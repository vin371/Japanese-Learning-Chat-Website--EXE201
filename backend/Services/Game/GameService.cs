using System.Data;
using System.Text.Json;
using System.Text.RegularExpressions;
using backend.Data;
using backend.DTOs.Game;
using Dapper;
using Npgsql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace backend.Services.Game;

public partial class GameService : IGameService
{
    /// <summary>Số lượng mỗi loại power-up khi user chưa có vật phẩm (tổng túi = 0).</summary>
    private const int StarterPowerUpQuantityPerType = 10;

    /// <summary>Gói Miễn phí: tối đa phiên game bắt đầu trong ngày (UTC). Premium không giới hạn.</summary>
    private const int FreeTierDailyGameSessionLimit = 20;

    private static readonly HashSet<string> RetiredGameSlugs = new(StringComparer.OrdinalIgnoreCase)
    {
        "sentence-builder",
        "pvp-vocabulary",
        "multiple-choice",
        "flashcard-vocabulary",
        "flashcard-battle",
        "daily-challenge",
    };

    private readonly string _connectionString;
    private readonly ILogger<GameService> _logger;
    private readonly ApplicationDbContext _learningDb;

    public GameService(IConfiguration config, ILogger<GameService> logger, ApplicationDbContext learningDb)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection chưa cấu hình.");
        _logger = logger;
        _learningDb = learningDb;
    }

    private NpgsqlConnection CreateConnection() => new(_connectionString);

    private async Task<bool> IsUserPremiumAsync(int userId)
    {
        if (userId < 1) return false;
        return await _learningDb.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.IsPremium)
            .FirstOrDefaultAsync();
    }

    /// <summary>Slug trong DB (spec) dùng dấu gạch ngang; client có thể gửi gạch dưới.</summary>
    private static string NormalizePowerUpSlug(string? slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return "";
        return slug.Trim().Replace('_', '-').ToLowerInvariant();
    }

    /// <summary>Slug game trong dbo.games — chuẩn hoá giống power-up (gạch dưới → gạch ngang).</summary>
    private static string NormalizeGameSlug(string? slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return "";
        return slug.Trim().Replace('_', '-').ToLowerInvariant();
    }

    private static bool IsRetiredGameSlug(string normalizedSlug) =>
        !string.IsNullOrEmpty(normalizedSlug) && RetiredGameSlugs.Contains(normalizedSlug);

    /// <summary>Swagger/UI hay gửi setId = 0; coi như không chọn bộ đề (dùng auto + nhánh bài học).</summary>
    private static int? NormalizeOptionalSetId(int? setId) =>
        setId is > 0 ? setId : null;

    /// <summary>Nếu user chưa có vật phẩm nào (tổng quantity = 0), cấp gói mở đầu để dùng power-up khi chơi.</summary>
    private static async Task EnsureStarterInventoryIfEmptyAsync(NpgsqlConnection db, int userId)
    {
        var sum = await db.ExecuteScalarAsync<int?>(
            "SELECT SUM(quantity) FROM user_inventory WHERE user_id = @u",
            new { u = userId }) ?? 0;
        if (sum > 0)
            return;

        /* Không cấp 50:50 miễn phí — tính năng gợi ý chưa mở; tránh hiển thị số túi gây nhầm. */
        const string slugNorm = "LOWER(REPLACE(REPLACE(TRIM(p.slug), '_', '-'), ' ', ''))";

        await db.ExecuteAsync(
            $"""
            UPDATE user_inventory i
            SET quantity = @qty, updated_at = (NOW() AT TIME ZONE 'utc')
            FROM power_ups p
            WHERE i.power_up_id = p.id AND i.user_id = @u
              AND {slugNorm} <> 'fifty-fifty'
            """,
            new { u = userId, qty = StarterPowerUpQuantityPerType });

        await db.ExecuteAsync(
            $"""
            INSERT INTO user_inventory (user_id, power_up_id, quantity, created_at, updated_at)
            SELECT @u, p.id, @qty, (NOW() AT TIME ZONE 'utc'), (NOW() AT TIME ZONE 'utc')
            FROM power_ups p
            WHERE COALESCE(p.is_active, true)
              AND {slugNorm} <> 'fifty-fifty'
              AND NOT EXISTS (
                  SELECT 1 FROM user_inventory i
                  WHERE i.user_id = @u AND i.power_up_id = p.id)
            """,
            new { u = userId, qty = StarterPowerUpQuantityPerType });
    }

    public async Task<IReadOnlyList<GameInfoDto>> GetGamesAsync()
    {
        const string sql = """
            SELECT id AS Id, slug AS Slug, name AS Name, description AS Description,
                   skill_type AS SkillType, max_hearts AS MaxHearts,
                   COALESCE(is_pvp, false) AS IsPvp,
                   COALESCE(is_boss_mode, false) AS IsBossMode,
                   COALESCE(sort_order, 0) AS SortOrder,
                   level_min AS LevelMin,
                   level_max AS LevelMax
            FROM games
            WHERE COALESCE(is_active, true)
              AND LOWER(TRIM(slug)) NOT IN (
                'fill-in-blank', 'fill-blank',
                'sentence-builder', 'pvp-vocabulary', 'multiple-choice',
                'flashcard-vocabulary', 'flashcard-battle', 'daily-challenge'
              )
            ORDER BY COALESCE(sort_order, 0), id
            """;
        using var db = CreateConnection();
        await db.OpenAsync();
        var rows = await db.QueryAsync<GameInfoDto>(sql);
        return rows.ToList();
    }

    public async Task<IReadOnlyList<GameInfoDto>> GetAdminGamesAsync()
    {
        const string sql = """
            SELECT id AS Id, slug AS Slug, name AS Name, description AS Description,
                   skill_type AS SkillType, COALESCE(max_hearts, 3) AS MaxHearts,
                   COALESCE(is_pvp, false) AS IsPvp,
                   COALESCE(is_boss_mode, false) AS IsBossMode,
                   COALESCE(sort_order, 0) AS SortOrder,
                   level_min AS LevelMin,
                   level_max AS LevelMax
            FROM games
            WHERE COALESCE(is_active, true)
            ORDER BY COALESCE(sort_order, 0), id
            """;
        using var db = CreateConnection();
        await db.OpenAsync();
        var rows = await db.QueryAsync<GameInfoDto>(sql);
        return rows.ToList();
    }

    public async Task<GameInfoDto> CreateGameAsync(CreateGameAdminRequest req)
    {
        var slug = NormalizeGameSlug(req.Slug);
        if (string.IsNullOrWhiteSpace(slug))
            throw new InvalidOperationException("Slug game không hợp lệ.");
        var name = (req.Name ?? "").Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("Tên game không được để trống.");

        using var db = CreateConnection();
        await db.OpenAsync();
        var exists = await db.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM games WHERE LOWER(TRIM(slug)) = @s",
            new { s = slug });
        if (exists > 0)
            throw new InvalidOperationException("Slug game đã tồn tại.");

        var id = await db.ExecuteScalarAsync<int>(
            """
            INSERT INTO games
                (slug, name, description, skill_type, max_hearts, is_pvp, is_boss_mode, sort_order, level_min, level_max, is_active)
            VALUES (@slug, @name, @desc, @skill, @hearts, @pvp, @boss, @sort, @lmin, @lmax, true)
            RETURNING id
            """,
            new
            {
                slug,
                name,
                desc = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim(),
                skill = string.IsNullOrWhiteSpace(req.SkillType) ? null : req.SkillType.Trim(),
                hearts = Math.Clamp(req.MaxHearts, 1, 10),
                pvp = req.IsPvp,
                boss = req.IsBossMode,
                sort = req.SortOrder,
                lmin = string.IsNullOrWhiteSpace(req.LevelMin) ? null : req.LevelMin.Trim(),
                lmax = string.IsNullOrWhiteSpace(req.LevelMax) ? null : req.LevelMax.Trim()
            });

        return new GameInfoDto(
            id,
            slug,
            name,
            string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim(),
            string.IsNullOrWhiteSpace(req.SkillType) ? null : req.SkillType.Trim(),
            Math.Clamp(req.MaxHearts, 1, 10),
            req.IsPvp,
            req.IsBossMode,
            req.SortOrder,
            string.IsNullOrWhiteSpace(req.LevelMin) ? null : req.LevelMin.Trim(),
            string.IsNullOrWhiteSpace(req.LevelMax) ? null : req.LevelMax.Trim());
    }

    public async Task<bool> DeleteGameAsync(int gameId)
    {
        using var db = CreateConnection();
        var n = await db.PgExecuteAsync(
            "UPDATE dbo.games SET is_active = 0 WHERE id = @id AND ISNULL(is_active, 1) = 1",
            new { id = gameId });
        return n > 0;
    }

    public async Task<StartSessionResponse> StartSessionAsync(int userId, StartSessionRequest req)
    {
        var gameSlug = NormalizeGameSlug(req.GameSlug);
        if (string.IsNullOrEmpty(gameSlug))
            throw new InvalidOperationException("Thiếu game slug.");
        if (IsRetiredGameSlug(gameSlug))
            throw new InvalidOperationException("Game này đã ngừng phát triển.");

        var effectiveSetId = NormalizeOptionalSetId(req.SetId);

        using var db = CreateConnection();
        await db.OpenAsync();

        try
        {
            await EnsureStarterInventoryIfEmptyAsync(db, userId);

            if (!await IsUserPremiumAsync(userId))
            {
                var today = DateTime.UtcNow.Date;
                var cnt = await db.PgExecuteScalarAsync<int>(
                    """
                    SELECT COUNT(*) FROM dbo.game_sessions
                    WHERE user_id = @u AND started_at >= @dayStart
                    """,
                    new { u = userId, dayStart = today });
                if (cnt >= FreeTierDailyGameSessionLimit)
                    throw new InvalidOperationException(
                        "Gói Miễn phí: đã đạt giới hạn lượt chơi trong ngày. Nâng cấp Premium để không giới hạn.");

                var isPvp = await db.PgExecuteScalarAsync<bool?>(
                    """
                    SELECT COALESCE(is_pvp, false)
                    FROM dbo.games
                    WHERE LOWER(LTRIM(RTRIM(slug))) = LOWER(@slug) AND ISNULL(is_active, 1) = 1
                    """,
                    new { slug = gameSlug });
                if (isPvp is null)
                    throw new InvalidOperationException("Game không tồn tại hoặc đã tắt.");
                if (isPvp == true)
                    throw new InvalidOperationException("Giải đấu PvP chỉ dành cho gói Premium.");
            }

            if (string.Equals(gameSlug, "vocabulary-speed-quiz", StringComparison.OrdinalIgnoreCase)
                && effectiveSetId is null
                && req.UseLessonVocabulary != false)
            {
                var fromLessons = await TryStartVocabularySpeedFromLessonsAsync(userId, req, db);
                if (fromLessons is not null)
                    return fromLessons;
            }

            if (string.Equals(gameSlug, "counter-quest", StringComparison.OrdinalIgnoreCase)
                && effectiveSetId is null
                && req.UseLessonVocabulary != false)
            {
                var fromLessons = await TryStartCounterQuestFromLessonsAsync(userId, req, db);
                if (fromLessons is not null)
                    return fromLessons;
            }

            if (string.Equals(gameSlug, "boss-battle", StringComparison.OrdinalIgnoreCase)
                && effectiveSetId is null
                && req.UseLessonVocabulary != false)
            {
                var fromLessons = await TryStartBossBattleFromLessonsAsync(userId, req, db);
                if (fromLessons is not null)
                    return fromLessons;
            }

            int? questionCountForSp = null;
            if (string.Equals(gameSlug, "counter-quest", StringComparison.OrdinalIgnoreCase))
            {
                var want = req.QuestionCount is int cq && cq > 0 ? cq : 10;
                questionCountForSp = Math.Clamp(want, 5, 25);
            }
            else if (string.Equals(gameSlug, "boss-battle", StringComparison.OrdinalIgnoreCase))
            {
                var want = req.QuestionCount is int bq && bq > 0 ? bq : 10;
                questionCountForSp = Math.Clamp(want, 5, 25);
            }

            var startRows = (await db.PgQueryAsync<SpStartPgRow>(
                """
                SELECT * FROM sp_start_game_session(@user_id, @game_slug, @set_id, @question_count)
                """,
                new
                {
                    user_id = userId,
                    game_slug = gameSlug,
                    set_id = effectiveSetId,
                    question_count = questionCountForSp,
                })).ToList();

            if (startRows.Count == 0)
                throw new InvalidOperationException("Không nhận được thông tin phiên từ sp_start_game_session.");

            var first = startRows[0];
            var info = new SpStartRow
            {
                session_id = first.session_id,
                max_hearts = first.max_hearts,
                set_id = first.set_id
            };

            var questions = startRows.Select(r => new SpQuestionRow
            {
                id = r.q_id,
                question_type = r.question_type,
                question_text = r.question_text,
                hint_text = r.hint_text,
                audio_url = r.audio_url,
                image_url = r.image_url,
                options_json = r.options_json,
                base_score = r.base_score,
                difficulty = r.difficulty
            }).ToList();

            var tpq = await db.PgExecuteScalarAsync<int?>(
                """
                SELECT time_per_question_s
                FROM game_question_sets
                WHERE id = (SELECT set_id FROM game_sessions WHERE id = @sid)
                LIMIT 1
                """,
                new { sid = info.session_id });

            return new StartSessionResponse(
                info.session_id,
                info.max_hearts,
                tpq ?? 10,
                questions.Select(q => new QuestionDto(
                    q.id,
                    q.question_type,
                    q.question_text,
                    q.hint_text,
                    q.audio_url,
                    q.image_url,
                    q.options_json ?? "[]",
                    q.base_score,
                    q.difficulty)).ToList());
        }
        catch (PostgresException ex)
        {
            _logger.LogWarning(ex, "sp_StartGameSession failed for slug {Slug}", gameSlug);
            throw new InvalidOperationException(ex.Message, ex);
        }
    }

    public async Task<AnswerResultDto> SubmitAnswerAsync(int userId, SubmitAnswerRequest req)
    {
        if (req.SessionId < 1)
            throw new ArgumentException("SessionId không hợp lệ.");
        if (req.QuestionId < 1)
            throw new ArgumentException("QuestionId không hợp lệ — hãy bắt đầu phiên mới.");
        if (req.QuestionOrder < 1)
            throw new ArgumentException("QuestionOrder không hợp lệ.");

        using var db = CreateConnection();
        await db.OpenAsync();

        var sessionUserId = await db.PgExecuteScalarAsync<int?>(
            "SELECT user_id FROM dbo.game_sessions WHERE id = @id AND ended_at IS NULL",
            new { id = req.SessionId });

        if (sessionUserId != userId)
            throw new UnauthorizedAccessException("Session không hợp lệ.");

        var powerNorm = string.IsNullOrWhiteSpace(req.PowerUpUsed)
            ? null
            : NormalizePowerUpSlug(req.PowerUpUsed);
        if (string.IsNullOrEmpty(powerNorm))
            powerNorm = null;

        /* double-points: chỉ trừ túi khi trả lời đúng (xem khối sau sp_SubmitAnswer). */
        if (powerNorm is not null && powerNorm != "double-points")
        {
            await DeductPowerUpAsync(db, userId, powerNorm, req.SessionId);
            if (powerNorm == "heart")
                await RestoreOneHeartAsync(db, req.SessionId);
        }

        SpAnswerRow result;
        try
        {
            result = await db.PgQueryFirstAsync<SpAnswerRow>(
                """
                SELECT * FROM sp_submit_answer(@session_id, @question_id, @question_order, @chosen_index, @response_ms, @power_up_used)
                """,
                new
                {
                    session_id = req.SessionId,
                    question_id = req.QuestionId,
                    question_order = req.QuestionOrder,
                    chosen_index = req.ChosenIndex,
                    response_ms = req.ResponseMs,
                    power_up_used = powerNorm
                });
        }
        catch (PostgresException ex)
        {
            _logger.LogWarning(ex,
                "sp_submit_answer failed for session {SessionId} — fallback in-app submit", req.SessionId);
            result = await SubmitAnswerInAppAsync(db, req, powerNorm);
        }

        if (powerNorm == "double-points" && result.is_correct)
            await DeductPowerUpAsync(db, userId, "double-points", req.SessionId);

        var isCorrect = result.is_correct;
        var usedPower = string.IsNullOrWhiteSpace(req.PowerUpUsed)
            ? null
            : NormalizePowerUpSlug(req.PowerUpUsed);
        if (string.IsNullOrEmpty(usedPower))
            usedPower = null;
        var loseHeartOnWrong = !isCorrect && !string.Equals(usedPower, "skip", StringComparison.OrdinalIgnoreCase);
        var hearts = await GetHeartsRemainingAsync(db, req.SessionId, loseHeartOnWrong);

        var postMeta = await db.PgQueryFirstAsync<(string? explanation, int total_score)>(
            """
            SELECT
              (SELECT explanation FROM dbo.game_questions WHERE id = @qid) AS explanation,
              (SELECT COALESCE(SUM(score_earned), 0) FROM dbo.game_session_answers WHERE session_id = @sid) AS total_score
            """,
            new { qid = req.QuestionId, sid = req.SessionId });

        return new AnswerResultDto(
            isCorrect,
            result.correct_index,
            postMeta.explanation,
            result.score_earned,
            result.combo,
            result.speed_bonus,
            postMeta.total_score,
            hearts);
    }

    public async Task<SessionSummaryDto> EndSessionAsync(int userId, int sessionId)
    {
        using var db = CreateConnection();
        await db.OpenAsync();

        var sessionUserId = await db.PgExecuteScalarAsync<int?>(
            "SELECT user_id FROM dbo.game_sessions WHERE id = @id",
            new { id = sessionId });
        if (sessionUserId != userId)
            throw new UnauthorizedAccessException("Session không hợp lệ.");

        return await FinalizeSessionAsync(this, db, sessionId);
    }

    /// <summary>Kanji Memory chạy toàn bộ trên client; khi thắng, client gọi để cộng EXP/xu (cùng quy tắc: 10 EXP/cặp, trần 100; 1 xu/cặp).</summary>
    public async Task<KanjiMemoryCompleteResultDto> CompleteKanjiMemoryAsync(int userId, CompleteKanjiMemoryRequest req)
    {
        var total = req.TotalPairs;
        var matched = req.MatchedPairs;
        if (total is < 4 or > 8)
            throw new ArgumentException("Số cặp phải từ 4 đến 8.");
        if (matched != total)
            throw new ArgumentException("Chỉ ghi nhận phần thưởng khi ghép đủ mọi cặp.");

        var expReward = Math.Min(100, total * 10);
        var xuReward = total;
        var finalScore = Math.Min(100, (int)Math.Round(100.0 * matched / total));

        using var db = CreateConnection();
        await db.OpenAsync();
        var n = await db.PgExecuteAsync(
            "UPDATE dbo.users SET exp = exp + @e, xu = xu + @x WHERE id = @u",
            new { e = expReward, x = xuReward, u = userId });
        if (n != 1)
            throw new InvalidOperationException("Không cập nhật được tài khoản.");

        try
        {
            await EvaluateTotalExpAchievementsAsync(db, userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "EvaluateTotalExpAchievementsAsync failed after Kanji Memory user {UserId}", userId);
        }

        return new KanjiMemoryCompleteResultDto(finalScore, matched, total, expReward, xuReward);
    }

    private static readonly Regex KanjiMemoryKanjiRe = new(@"[\u4e00-\u9faf々〆ヵヶ]", RegexOptions.Compiled);

    public async Task<IReadOnlyList<KanjiMemoryPairDto>> GetKanjiMemoryPairsAsync(int? levelId = null)
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var pairs = new List<KanjiMemoryPairDto>();

        void AddPair(string? kanji, string? meaning, string slug, string title)
        {
            var k = (kanji ?? "").Trim();
            var m = (meaning ?? "").Trim();
            if (k.Length == 0 || m.Length == 0 || k.Length > 14 || m.Length > 120) return;
            var key = $"{k}|||{m}";
            if (!seen.Add(key)) return;
            pairs.Add(new KanjiMemoryPairDto(k, m, slug, title));
        }

        var kanjiRows = await (
            from k in _learningDb.KanjiItems.AsNoTracking()
            join l in _learningDb.Lessons.AsNoTracking() on k.LessonId equals l.Id
            join c in _learningDb.LessonCategories.AsNoTracking() on l.CategoryId equals c.Id
            where l.IsPublished && k.MeaningVi != null && k.KanjiChar != null
                  && (!levelId.HasValue || c.LevelId == levelId.Value)
            select new { k.KanjiChar, k.MeaningVi, l.Slug, l.Title }
        ).ToListAsync();

        foreach (var row in kanjiRows)
            AddPair(row.KanjiChar, row.MeaningVi, row.Slug, row.Title);

        var vocabRows = await (
            from v in _learningDb.VocabularyItems.AsNoTracking()
            join l in _learningDb.Lessons.AsNoTracking() on v.LessonId equals l.Id
            join c in _learningDb.LessonCategories.AsNoTracking() on l.CategoryId equals c.Id
            where l.IsPublished && v.MeaningVi != null && v.WordJp != null
                  && (!levelId.HasValue || c.LevelId == levelId.Value)
            select new { v.WordJp, v.MeaningVi, l.Slug, l.Title }
        ).ToListAsync();

        foreach (var row in vocabRows)
        {
            if (!KanjiMemoryKanjiRe.IsMatch(row.WordJp)) continue;
            var fragment = row.WordJp
                .Split(['／', '/', '、', ','])
                .Select(s => s.Trim())
                .FirstOrDefault(s => KanjiMemoryKanjiRe.IsMatch(s));
            if (fragment != null)
                AddPair(fragment, row.MeaningVi, row.Slug, row.Title);
        }

        return pairs;
    }

    public async Task<InventoryDto> GetInventoryAsync(int userId)
    {
        const string sql = """
            SELECT p.id AS Id,
                   REPLACE(REPLACE(LOWER(TRIM(p.slug)), '_', '-'), ' ', '') AS Slug,
                   p.name AS Name, p.description AS Description,
                   p.effect_type AS EffectType,
                   p.xu_price AS XuPrice,
                   COALESCE(p.is_premium, false) AS IsPremium,
                   COALESCE(i.quantity, 0) AS QuantityOwned
            FROM power_ups p
            LEFT JOIN user_inventory i ON i.power_up_id = p.id AND i.user_id = @uid
            WHERE COALESCE(p.is_active, true)
            ORDER BY COALESCE(p.sort_order, 0), p.id
            """;
        using var db = CreateConnection();
        await db.OpenAsync();
        await EnsureStarterInventoryIfEmptyAsync(db, userId);
        var items = await db.PgQueryAsync<PowerUpDto>(sql, new { uid = userId });
        return new InventoryDto(items.ToList());
    }

    public async Task<PurchasePowerUpResultDto> PurchasePowerUpAsync(int userId, PurchasePowerUpRequest req)
    {
        var norm = NormalizePowerUpSlug(req.PowerUpSlug);
        if (string.IsNullOrEmpty(norm))
            throw new ArgumentException("Thiếu mã vật phẩm (slug).");

        var qty = req.Quantity < 1 ? 1 : req.Quantity > 99 ? 99 : req.Quantity;

        using var db = CreateConnection();
        await db.OpenAsync();
        await EnsureStarterInventoryIfEmptyAsync(db, userId);

        using var tx = db.BeginTransaction();
        try
        {
            var pu = await db.PgQueryFirstOrDefaultAsync<PurchasePowerUpRow>(
                """
                SELECT TOP 1 id AS Id, xu_price AS XuPrice
                FROM dbo.power_ups
                WHERE ISNULL(is_active, 1) = 1
                  AND REPLACE(REPLACE(LOWER(LTRIM(RTRIM(slug))), N'_', N'-'), N' ', N'') = @slug
                """,
                new { slug = norm },
                tx);
            if (pu is null)
                throw new ArgumentException($"Không tìm thấy vật phẩm '{norm}'.");

            if (!pu.XuPrice.HasValue || pu.XuPrice.Value < 1)
                throw new InvalidOperationException("Vật phẩm này chưa được bán bằng xu.");

            var totalCost = pu.XuPrice.Value * qty;

            var paid = await db.PgExecuteAsync(
                """
                UPDATE dbo.users
                SET xu = xu - @cost
                WHERE id = @uid AND xu >= @cost
                """,
                new { cost = totalCost, uid = userId },
                tx);
            if (paid != 1)
                throw new InvalidOperationException("Không đủ xu để mua.");

            var invUpd = await db.PgExecuteAsync(
                """
                UPDATE dbo.user_inventory
                SET quantity = quantity + @q, updated_at = SYSUTCDATETIME()
                WHERE user_id = @uid AND power_up_id = @pid
                """,
                new { q = qty, uid = userId, pid = pu.Id },
                tx);

            if (invUpd == 0)
            {
                await db.PgExecuteAsync(
                    """
                    INSERT INTO dbo.user_inventory (user_id, power_up_id, quantity, created_at, updated_at)
                    VALUES (@uid, @pid, @q, SYSUTCDATETIME(), SYSUTCDATETIME())
                    """,
                    new { uid = userId, pid = pu.Id, q = qty },
                    tx);
            }

            var xuBalance = await db.PgExecuteScalarAsync<int>(
                "SELECT xu FROM dbo.users WHERE id = @uid",
                new { uid = userId },
                tx);
            var quantityOwned = await db.PgExecuteScalarAsync<int>(
                """
                SELECT ISNULL(quantity, 0) FROM dbo.user_inventory
                WHERE user_id = @uid AND power_up_id = @pid
                """,
                new { uid = userId, pid = pu.Id },
                tx);

            tx.Commit();
            return new PurchasePowerUpResultDto(xuBalance, quantityOwned);
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task<UsePowerUpResultDto> UsePowerUpAsync(int userId, UsePowerUpRequest req)
    {
        using var db = CreateConnection();
        await db.OpenAsync();

        var sessionUserId = await db.PgExecuteScalarAsync<int?>(
            "SELECT user_id FROM dbo.game_sessions WHERE id = @id AND ended_at IS NULL",
            new { id = req.SessionId });
        if (sessionUserId != userId)
            throw new UnauthorizedAccessException("Session không hợp lệ.");

        var norm = NormalizePowerUpSlug(req.PowerUpSlug);
        if (string.IsNullOrEmpty(norm))
            throw new ArgumentException("Thiếu power-up slug.");

        IReadOnlyList<int>? fiftyHidden = null;
        if (norm == "fifty-fifty")
        {
            if (req.QuestionId is null or < 1)
                throw new ArgumentException("50:50 cần gửi questionId của câu hiện tại.");

            var answered = await db.PgExecuteScalarAsync<int>(
                """
                SELECT COUNT(1) FROM dbo.game_session_answers
                WHERE session_id = @sid AND question_id = @qid
                """,
                new { sid = req.SessionId, qid = req.QuestionId.Value });
            if (answered > 0)
                throw new InvalidOperationException("Đã trả lời câu này — không dùng 50:50.");

            const string qSql = """
                SELECT gq.correct_index, gq.options_json
                FROM dbo.game_sessions gs
                INNER JOIN dbo.game_questions gq
                  ON gq.id = @qid AND gq.set_id = gs.set_id
                WHERE gs.id = @sid AND gs.ended_at IS NULL
                """;
            var qRows = (await db.PgQueryAsync<(int correct_index, string? options_json)>(
                    qSql,
                    new { sid = req.SessionId, qid = req.QuestionId.Value }))
                .ToList();
            if (qRows.Count == 0)
                throw new InvalidOperationException("Câu hỏi không thuộc phiên hiện tại.");

            var qrow = qRows[0];
            var optionCount = CountOptionEntriesFromJson(qrow.options_json);
            if (optionCount < 2)
                throw new InvalidOperationException("Câu hỏi không đủ đáp án để dùng 50:50.");

            var correct = Math.Clamp(qrow.correct_index, 0, optionCount - 1);
            fiftyHidden = PickFiftyFiftyHiddenIndices(optionCount, correct);
        }

        await DeductPowerUpAsync(db, userId, norm, req.SessionId);
        int? heartsAfter = null;
        if (norm == "heart")
        {
            await RestoreOneHeartAsync(db, req.SessionId);
            heartsAfter = await GetHeartsRemainingAsync(db, req.SessionId, loseHeart: false);
        }

        return new UsePowerUpResultDto(fiftyHidden, heartsAfter);
    }

    private static int CountOptionEntriesFromJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return 0;
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (root.ValueKind == JsonValueKind.Array)
                return root.GetArrayLength();
            if (root.ValueKind == JsonValueKind.Object)
            {
                if (root.TryGetProperty("options", out var o) && o.ValueKind == JsonValueKind.Array)
                    return o.GetArrayLength();
                if (root.TryGetProperty("Options", out var o2) && o2.ValueKind == JsonValueKind.Array)
                    return o2.GetArrayLength();
            }
        }
        catch (JsonException)
        {
            return 0;
        }

        return 0;
    }

    private static int[] PickFiftyFiftyHiddenIndices(int optionCount, int correctIndex)
    {
        var wrong = new List<int>(optionCount);
        for (var i = 0; i < optionCount; i++)
        {
            if (i != correctIndex)
                wrong.Add(i);
        }

        var rnd = Random.Shared;
        for (var i = wrong.Count - 1; i > 0; i--)
        {
            var j = rnd.Next(i + 1);
            (wrong[i], wrong[j]) = (wrong[j], wrong[i]);
        }

        var take = Math.Min(2, wrong.Count);
        return wrong.Take(take).ToArray();
    }

    public async Task<IReadOnlyList<LeaderboardEntryDto>> GetLeaderboardAsync(
        string? gameSlug,
        string period = "weekly",
        string sortBy = "score",
        int? levelId = null,
        int? viewerUserId = null,
        bool friendsOnly = false)
    {
        sortBy = sortBy?.Trim().ToLowerInvariant() switch
        {
            "accuracy" => "accuracy",
            "speed" => "speed",
            _ => "score"
        };

        period = period?.Trim().ToLowerInvariant() switch
        {
            "monthly" => "monthly",
            _ => "weekly"
        };

        var orderSql = sortBy switch
        {
            "accuracy" => "le.accuracy_percent DESC NULLS LAST, le.score DESC",
            "speed" => "CASE WHEN le.avg_response_seconds IS NULL THEN 1 ELSE 0 END, le.avg_response_seconds ASC NULLS LAST, le.score DESC",
            _ => "le.score DESC, le.accuracy_percent DESC NULLS LAST"
        };

        using var db = CreateConnection();
        await db.OpenAsync();

        try
        {
            IReadOnlyList<int> friendIds = Array.Empty<int>();
            if (friendsOnly)
            {
                if (viewerUserId is null or <= 0)
                    return Array.Empty<LeaderboardEntryDto>();

                const string friendsSql = """
                    SELECT DISTINCT CASE WHEN f.user_id = @me THEN f.friend_id ELSE f.user_id END AS fid
                    FROM dbo.friendships f
                    WHERE f.user_id = @me OR f.friend_id = @me
                    """;
                friendIds = (await db.PgQueryAsync<int>(friendsSql, new { me = viewerUserId.Value })).ToList();
                if (friendIds.Count == 0)
                    return Array.Empty<LeaderboardEntryDto>();
            }

            var levelClause = levelId.HasValue
                ? "AND lp.level_id = @levelId"
                : "AND lp.level_id IS NULL";

            var friendClause = friendsOnly ? "AND le.user_id IN @friendIds" : "";

            gameSlug = string.IsNullOrWhiteSpace(gameSlug) ? null : NormalizeGameSlug(gameSlug);

            var sql = $"""
                SELECT TOP (100)
                       le.rank AS Rank,
                       le.user_id AS UserId,
                       ISNULL(NULLIF(LTRIM(RTRIM(up.display_name)), N''), u.username) AS DisplayName,
                       up.avatar_url AS AvatarUrl,
                       le.score AS Score,
                       ISNULL(le.accuracy_percent, 0) AS AccuracyAvg,
                       0 AS GamesPlayed,
                       0 AS BestCombo,
                       CAST(ISNULL(le.avg_response_seconds, 0) * 1000 AS INT) AS AvgDurationMs,
                       lv.code AS LevelCode
                FROM dbo.leaderboard_entries le
                INNER JOIN dbo.leaderboard_periods lp ON lp.id = le.period_id
                INNER JOIN dbo.users u ON u.id = le.user_id
                LEFT JOIN dbo.user_profiles up ON up.user_id = le.user_id
                LEFT JOIN dbo.levels lv ON lv.id = u.level_id
                LEFT JOIN dbo.games g ON g.id = lp.game_id
                WHERE lp.type = @period
                  AND lp.period_start <= @today
                  AND lp.period_end >= @today
                  AND ISNULL(LTRIM(RTRIM(LOWER(u.role))), N'user') = N'user'
                  AND COALESCE(u.is_locked, false) = false
                  AND LOWER(ISNULL(u.username, N'')) NOT LIKE N'admin%'
                  AND LOWER(ISNULL(u.username, N'')) NOT LIKE N'staff%'
                  AND LOWER(ISNULL(u.username, N'')) NOT LIKE N'moderator%'
                  AND LOWER(ISNULL(u.username, N'')) NOT LIKE N'demo%'
                  AND (@gameSlug IS NULL OR g.slug = @gameSlug)
                  {levelClause}
                  {friendClause}
                ORDER BY {orderSql}
                """;

            var today = DateTime.UtcNow.Date;
            var list = (await db.PgQueryAsync<LeaderboardEntryDto>(sql, new
            {
                period,
                gameSlug,
                levelId,
                friendIds,
                today
            })).ToList();

            if (list.Count > 0 && list.All(e => e.Rank == 0))
            {
                for (var i = 0; i < list.Count; i++)
                    list[i] = list[i] with { Rank = i + 1 };
            }

            return list;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GetLeaderboardAsync failed (bảng leaderboard / user_profiles / levels chưa đồng bộ?)");
            return Array.Empty<LeaderboardEntryDto>();
        }
    }

    public async Task<IReadOnlyList<AchievementDto>> GetAchievementsAsync(int userId)
    {
        const string sql = """
            SELECT a.id AS Id, a.slug AS Slug, a.name AS Name, a.description AS Description,
                   CAST(CASE WHEN ua.id IS NULL THEN 0 ELSE 1 END AS BIT) AS Earned,
                   ua.earned_at AS EarnedAt,
                   ISNULL(a.reward_exp, 0) AS RewardExp,
                   ISNULL(a.reward_xu, 0) AS RewardXu
            FROM dbo.achievements a
            LEFT JOIN dbo.user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = @uid
            WHERE ISNULL(a.is_active, 1) = 1
            ORDER BY ISNULL(a.sort_order, 0), a.id
            """;
        try
        {
            using var db = CreateConnection();
            var rows = await db.PgQueryAsync<AchievementDto>(sql, new { uid = userId });
            return rows.ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GetAchievementsAsync failed for user {UserId}", userId);
            return Array.Empty<AchievementDto>();
        }
    }

    public async Task<IReadOnlyList<ExpLeaderboardEntryDto>> GetExpLeaderboardAsync(int limit = 20)
    {
        limit = Math.Clamp(limit, 1, 100);
        try
        {
            var rows = await BuildAccountLeaderboardQuery(orderByXu: false)
                .Take(limit)
                .ToListAsync();

            return rows.Select((r, i) => new ExpLeaderboardEntryDto(
                i + 1,
                r.UserId,
                r.DisplayName,
                r.AvatarUrl,
                r.Exp,
                r.LevelCode)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GetExpLeaderboardAsync failed");
            return Array.Empty<ExpLeaderboardEntryDto>();
        }
    }

    public async Task<IReadOnlyList<XuLeaderboardEntryDto>> GetXuLeaderboardAsync(int limit = 20)
    {
        limit = Math.Clamp(limit, 1, 100);
        try
        {
            var rows = await BuildAccountLeaderboardQuery(orderByXu: true)
                .Take(limit)
                .ToListAsync();

            return rows.Select((r, i) => new XuLeaderboardEntryDto(
                i + 1,
                r.UserId,
                r.DisplayName,
                r.AvatarUrl,
                r.Xu,
                r.LevelCode)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GetXuLeaderboardAsync failed");
            return Array.Empty<XuLeaderboardEntryDto>();
        }
    }

    private IQueryable<AccountLeaderboardRow> BuildAccountLeaderboardQuery(bool orderByXu)
    {
        var q =
            from u in _learningDb.Users.AsNoTracking()
            join up in _learningDb.UserProfiles.AsNoTracking() on u.Id equals up.UserId into upJoin
            from up in upJoin.DefaultIfEmpty()
            join lv in _learningDb.Levels.AsNoTracking() on u.LevelId equals lv.Id into lvJoin
            from lv in lvJoin.DefaultIfEmpty()
            where u.DeletedAt == null
            where u.Role.ToLower() == "user"
            where !u.IsLocked
            where !EF.Functions.Like(u.Username.ToLower(), "admin%")
            where !EF.Functions.Like(u.Username.ToLower(), "staff%")
            where !EF.Functions.Like(u.Username.ToLower(), "moderator%")
            where !EF.Functions.Like(u.Username.ToLower(), "demo%")
            select new AccountLeaderboardRow
            {
                UserId = u.Id,
                DisplayName = up != null && up.DisplayName != null && up.DisplayName.Trim() != ""
                    ? up.DisplayName.Trim()
                    : u.Username,
                AvatarUrl = up != null ? up.AvatarUrl : null,
                Exp = u.Exp,
                Xu = u.Xu,
                LevelCode = lv != null ? lv.Code : null,
            };

        return orderByXu
            ? q.OrderByDescending(r => r.Xu).ThenBy(r => r.UserId)
            : q.OrderByDescending(r => r.Exp).ThenBy(r => r.UserId);
    }

    private sealed class AccountLeaderboardRow
    {
        public int UserId { get; init; }
        public string DisplayName { get; init; } = "";
        public string? AvatarUrl { get; init; }
        public int Exp { get; init; }
        public int Xu { get; init; }
        public string? LevelCode { get; init; }
    }

    public async Task<PvpRoomDto> CreatePvpRoomAsync(int userId, CreatePvpRoomRequest req)
    {
        using var db = CreateConnection();
        await db.OpenAsync();

        var slug = NormalizeGameSlug(req.GameSlug);
        if (IsRetiredGameSlug(slug))
            throw new ArgumentException("Game PvP này đã ngừng phát triển.");
        var gameId = await db.PgExecuteScalarAsync<int?>(
            "SELECT id FROM dbo.games WHERE slug = @slug AND ISNULL(is_active, 1) = 1",
            new { slug });
        if (gameId is null)
            throw new ArgumentException($"Game '{slug}' không tồn tại hoặc chưa kích hoạt.");

        var roomCode = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();

        if (req.LevelId.HasValue)
        {
            await db.PgExecuteAsync(
                """
                INSERT INTO dbo.pvp_rooms (room_code, game_id, host_user_id, level_id, status)
                VALUES (@code, @gid, @uid, @lid, N'waiting')
                """,
                new { code = roomCode, gid = gameId, uid = userId, lid = req.LevelId.Value });
        }
        else
        {
            await db.PgExecuteAsync(
                """
                INSERT INTO dbo.pvp_rooms (room_code, game_id, host_user_id, status)
                VALUES (@code, @gid, @uid, N'waiting')
                """,
                new { code = roomCode, gid = gameId, uid = userId });
        }

        var room = await GetPvpRoomByCodeAsync(db, roomCode);
        return room ?? throw new InvalidOperationException("Không đọc lại được phòng PvP vừa tạo.");
    }

    public async Task<PvpRoomDto> JoinPvpRoomAsync(int userId, JoinPvpRoomRequest req)
    {
        using var db = CreateConnection();
        await db.OpenAsync();

        var roomId = await db.PgExecuteScalarAsync<int?>(
            """
            SELECT id FROM dbo.pvp_rooms
            WHERE room_code = @code AND status = N'waiting' AND guest_user_id IS NULL
            """,
            new { code = req.RoomCode.Trim().ToUpperInvariant() });

        if (roomId is null)
            throw new InvalidOperationException("Phòng không tồn tại, đã đầy hoặc đã bắt đầu.");

        await db.PgExecuteAsync(
            """
            UPDATE dbo.pvp_rooms
            SET guest_user_id = @uid, status = N'active', started_at = SYSUTCDATETIME()
            WHERE id = @rid
            """,
            new { uid = userId, rid = roomId });

        var room = await GetPvpRoomByCodeAsync(db, req.RoomCode.Trim().ToUpperInvariant());
        return room ?? throw new InvalidOperationException("Không đọc lại được phòng PvP.");
    }

    public async Task<PvpRoomDto?> GetPvpRoomAsync(string roomCode)
    {
        using var db = CreateConnection();
        await db.OpenAsync();
        return await GetPvpRoomByCodeAsync(db, roomCode.Trim().ToUpperInvariant());
    }

    public async Task<IReadOnlyList<SessionSummaryDto>> GetHistoryAsync(int userId, int page = 1, int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var offset = (page - 1) * pageSize;

        const string sql = """
            SELECT gs.id AS SessionId,
                   gs.score AS FinalScore,
                   gs.correct_count AS CorrectCount,
                   gs.total_questions AS TotalQuestions,
                   CAST(CASE WHEN gs.total_questions > 0
                        THEN (gs.correct_count * 100.0 / gs.total_questions)
                        ELSE 0 END AS DECIMAL(5,2)) AS AccuracyPercent,
                   ISNULL(gs.max_combo, 0) AS MaxCombo,
                   ISNULL(gs.time_spent_seconds, 0) AS TimeSpentSeconds,
                   ISNULL(gs.exp_earned, 0) AS ExpEarned,
                   ISNULL(gs.xu_earned, 0) AS XuEarned,
                   CAST(N'completed' AS NVARCHAR(32)) AS Result
            FROM dbo.game_sessions gs
            WHERE gs.user_id = @uid AND gs.ended_at IS NOT NULL
            ORDER BY gs.started_at DESC
            OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY
            """;

        using var db = CreateConnection();
        var rows = await db.PgQueryAsync<SessionSummaryDto>(sql, new { uid = userId, offset, size = pageSize });
        return rows.ToList();
    }

    private static async Task<SessionSummaryDto> FinalizeSessionAsync(GameService self, NpgsqlConnection db, int sessionId)
    {
        var existing = await db.PgQueryFirstOrDefaultAsync<SpEndRow>(
            """
            SELECT score AS final_score, correct_count, total_questions,
                   CAST(CASE WHEN total_questions > 0 THEN (correct_count * 100.0 / total_questions) ELSE 0 END AS DECIMAL(5,2)) AS accuracy_percent,
                   COALESCE(max_combo, 0) AS max_combo,
                   COALESCE(time_spent_seconds, 0) AS time_spent_seconds,
                   COALESCE(exp_earned, 0) AS exp_earned,
                   COALESCE(xu_earned, 0) AS xu_earned
            FROM dbo.game_sessions
            WHERE id = @id AND ended_at IS NOT NULL
            """,
            new { id = sessionId });

        if (existing is not null)
            return MapEndResult(sessionId, existing);

        SpEndRow result;
        try
        {
            result = await FinalizeSessionInAppAsync(db, sessionId);
        }
        catch (Exception ex)
        {
            self._logger.LogWarning(ex,
                "In-app finalize failed for session {SessionId} — trying sp_end_game_session", sessionId);
            try
            {
                result = await db.PgQueryFirstAsync<SpEndRow>(
                    "SELECT * FROM sp_end_game_session(@session_id)",
                    new { session_id = sessionId });
            }
            catch (PostgresException spEx)
            {
                self._logger.LogWarning(spEx,
                    "sp_end_game_session failed for session {SessionId} — retry in-app finalize", sessionId);
                result = await FinalizeSessionInAppAsync(db, sessionId);
            }
        }

        try
        {
            await self.AfterGameSessionCompletedAsync(db, sessionId, result);
        }
        catch (Exception ex)
        {
            self._logger.LogWarning(ex, "AfterGameSessionCompleted failed for session {SessionId}", sessionId);
        }

        return MapEndResult(sessionId, result);
    }

    /// <summary>Dự phòng khi SP PostgreSQL cũ lỗi (vd. user_statistics thiếu lessons_completed).</summary>
    private static async Task<SpAnswerRow> SubmitAnswerInAppAsync(
        NpgsqlConnection db,
        SubmitAnswerRequest req,
        string? powerNorm)
    {
        var sessionTotalQ = await db.PgExecuteScalarAsync<int?>(
            "SELECT NULLIF(total_questions, 0) FROM dbo.game_sessions WHERE id = @id",
            new { id = req.SessionId });

        var ppt = sessionTotalQ is null or < 1
            ? 10
            : Math.Max(1, (int)Math.Round(100.0 / sessionTotalQ.Value));

        var correctIndex = await db.PgExecuteScalarAsync<int?>(
            "SELECT correct_index FROM dbo.game_questions WHERE id = @qid",
            new { qid = req.QuestionId });

        var isCorrect = req.ChosenIndex is not null
                        && correctIndex is not null
                        && req.ChosenIndex == correctIndex;

        var maxOrder = await db.PgExecuteScalarAsync<int>(
            """
            SELECT COALESCE(MAX(question_order), 0)
            FROM dbo.game_session_answers
            WHERE session_id = @sid
            """,
            new { sid = req.SessionId });

        var comboNow = 0;
        for (var ord = maxOrder; ord >= 1; ord--)
        {
            var prevCorrect = await db.PgExecuteScalarAsync<bool?>(
                """
                SELECT is_correct FROM dbo.game_session_answers
                WHERE session_id = @sid AND question_order = @ord
                """,
                new { sid = req.SessionId, ord });
            if (prevCorrect == true)
                comboNow++;
            else
                break;
        }

        var scoreEarned = 0;
        if (isCorrect)
        {
            comboNow++;
            var doubleActive = string.Equals(powerNorm, "double-points", StringComparison.OrdinalIgnoreCase);
            scoreEarned = ppt * (doubleActive ? 2 : 1);
        }
        else
        {
            comboNow = 0;
        }

        await db.PgExecuteAsync(
            """
            INSERT INTO dbo.game_session_answers
              (session_id, question_id, question_order, chosen_index, is_correct,
               response_ms, score_earned, combo_at_answer, power_up_used, answered_at)
            VALUES
              (@sid, @qid, @ord, @chosen, @ok, @ms, @score, @combo, @pu, NOW())
            """,
            new
            {
                sid = req.SessionId,
                qid = req.QuestionId,
                ord = req.QuestionOrder,
                chosen = req.ChosenIndex,
                ok = isCorrect,
                ms = req.ResponseMs,
                score = scoreEarned,
                combo = comboNow,
                pu = powerNorm
            });

        return new SpAnswerRow
        {
            is_correct = isCorrect,
            correct_index = correctIndex,
            score_earned = scoreEarned,
            combo = comboNow,
            speed_bonus = 0
        };
    }

    private static async Task UpsertUserStatisticsAfterGameAsync(NpgsqlConnection db, int userId, int expReward)
    {
        try
        {
            await db.PgExecuteAsync(
                """
                INSERT INTO user_statistics (
                  user_id, lessons_completed, games_played, quizzes_completed, total_exp, updated_at
                ) VALUES (@u, 0, 1, 0, @exp, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                  games_played = user_statistics.games_played + 1,
                  total_exp    = user_statistics.total_exp + @exp,
                  updated_at   = NOW()
                """,
                new { u = userId, exp = expReward });
        }
        catch (Exception)
        {
            /* không chặn kết thúc phiên */
        }
    }

    private static async Task<SpEndRow> FinalizeSessionInAppAsync(NpgsqlConnection db, int sessionId)
    {
        var meta = await db.PgQueryFirstAsync<(int user_id, int game_id, int total_questions)>(
            """
            SELECT user_id, game_id, COALESCE(total_questions, 0) AS total_questions
            FROM dbo.game_sessions
            WHERE id = @id
            """,
            new { id = sessionId });

        var agg = await db.PgQueryFirstAsync<(int total_score, int correct, int max_combo, int time_spent)>(
            """
            SELECT
              COALESCE(SUM(score_earned), 0) AS total_score,
              COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0) AS correct,
              COALESCE(MAX(combo_at_answer), 0) AS max_combo,
              CASE WHEN COUNT(*) > 1
                THEN EXTRACT(EPOCH FROM (MAX(answered_at) - MIN(answered_at)))::INTEGER
                ELSE 0 END AS time_spent
            FROM dbo.game_session_answers
            WHERE session_id = @sid
            """,
            new { sid = sessionId });

        var totalScore = Math.Min(100, agg.total_score);
        var expReward = Math.Min(100, agg.correct * 10);
        var xuReward = Math.Max(0, agg.correct);
        var accuracy = meta.total_questions > 0
            ? Math.Round((decimal)agg.correct / meta.total_questions * 100m, 2)
            : 0m;

        await db.PgExecuteAsync(
            """
            UPDATE dbo.game_sessions SET
              score = @score,
              correct_count = @correct,
              max_combo = @combo,
              time_spent_seconds = @time,
              exp_earned = @exp,
              xu_earned = @xu,
              ended_at = NOW()
            WHERE id = @id AND ended_at IS NULL
            """,
            new
            {
                id = sessionId,
                score = totalScore,
                correct = agg.correct,
                combo = agg.max_combo,
                time = agg.time_spent,
                exp = expReward,
                xu = xuReward
            });

        await db.PgExecuteAsync(
            "UPDATE dbo.users SET exp = exp + @e, xu = xu + @x WHERE id = @u",
            new { e = expReward, x = xuReward, u = meta.user_id });

        await UpsertUserStatisticsAfterGameAsync(db, meta.user_id, expReward);

        try
        {
            await db.PgExecuteAsync(
                """
                INSERT INTO user_activities_log (
                  user_id, activity_type, entity_type, entity_id, score, created_at
                ) VALUES (@u, 'game_completed', 'game', @gid, @score, NOW())
                """,
                new { u = meta.user_id, gid = meta.game_id, score = totalScore });
        }
        catch (Exception)
        {
            /* không chặn kết thúc phiên */
        }

        return new SpEndRow
        {
            final_score = totalScore,
            correct_count = agg.correct,
            total_questions = meta.total_questions,
            accuracy_percent = accuracy,
            max_combo = agg.max_combo,
            time_spent_seconds = agg.time_spent,
            exp_earned = expReward,
            xu_earned = xuReward
        };
    }

    private static SessionSummaryDto MapEndResult(int sessionId, SpEndRow r) =>
        new(
            sessionId,
            r.final_score,
            r.correct_count,
            r.total_questions,
            r.accuracy_percent,
            r.max_combo,
            r.time_spent_seconds,
            r.exp_earned,
            r.xu_earned,
            "completed");

    private static async Task<int> GetHeartsRemainingAsync(NpgsqlConnection db, int sessionId, bool loseHeart)
    {
        var session = await db.PgQueryFirstAsync<(int? hearts_remaining, int max_hearts)>(
            """
            SELECT gs.hearts_remaining,
                   COALESCE(g.max_hearts, 3) AS max_hearts
            FROM dbo.game_sessions gs
            INNER JOIN dbo.games g ON g.id = gs.game_id
            WHERE gs.id = @id
            """,
            new { id = sessionId });

        if (!loseHeart)
            return session.hearts_remaining ?? session.max_hearts;

        var current = session.hearts_remaining ?? session.max_hearts;
        var newVal = Math.Max(0, current - 1);

        await db.PgExecuteAsync(
            """
            UPDATE dbo.game_sessions
            SET hearts_remaining = @h,
                hearts_lost = ISNULL(hearts_lost, 0) + 1
            WHERE id = @id
            """,
            new { h = newVal, id = sessionId });

        return newVal;
    }

    private static async Task RestoreOneHeartAsync(NpgsqlConnection db, int sessionId)
    {
        await db.PgExecuteAsync(
            """
            UPDATE game_sessions gs
            SET hearts_remaining = CASE
                WHEN gs.hearts_remaining IS NULL THEN COALESCE(g.max_hearts, 3)
                WHEN gs.hearts_remaining + 1 > COALESCE(g.max_hearts, 3) THEN COALESCE(g.max_hearts, 3)
                ELSE gs.hearts_remaining + 1
            END
            FROM games g
            WHERE gs.game_id = g.id AND gs.id = @sid
            """,
            new { sid = sessionId });
    }

    private async Task DeductPowerUpAsync(NpgsqlConnection db, int userId, string normalizedSlug, int sessionId)
    {
        var powerUpId = await db.PgExecuteScalarAsync<int?>(
            """
            SELECT TOP 1 id FROM dbo.power_ups
            WHERE ISNULL(is_active, 1) = 1
              AND REPLACE(REPLACE(LOWER(LTRIM(RTRIM(slug))), N'_', N'-'), N' ', N'') = @slug
            """,
            new { slug = normalizedSlug });
        if (powerUpId is null)
            throw new ArgumentException($"Power-up '{normalizedSlug}' không tồn tại.");

        var qty = await db.PgExecuteScalarAsync<int>(
            """
            SELECT ISNULL(
                (SELECT quantity FROM dbo.user_inventory WHERE user_id = @uid AND power_up_id = @pid), 0)
            """,
            new { uid = userId, pid = powerUpId });

        if (qty <= 0)
            throw new InvalidOperationException($"Không đủ vật phẩm '{normalizedSlug}' trong túi đồ.");

        await db.PgExecuteAsync(
            """
            UPDATE dbo.user_inventory
            SET quantity = quantity - 1, updated_at = SYSUTCDATETIME()
            WHERE user_id = @uid AND power_up_id = @pid AND quantity > 0
            """,
            new { uid = userId, pid = powerUpId });

        await db.PgExecuteAsync(
            """
            INSERT INTO dbo.game_session_powerups (session_id, power_up_id, used_at_order, used_at)
            SELECT @sid, @pid,
                   ISNULL((SELECT MAX(used_at_order) FROM dbo.game_session_powerups WHERE session_id = @sid), 0) + 1,
                   SYSUTCDATETIME()
            """,
            new { sid = sessionId, pid = powerUpId });
    }

    private static async Task<PvpRoomDto?> GetPvpRoomByCodeAsync(NpgsqlConnection db, string code)
    {
        return await db.PgQueryFirstOrDefaultAsync<PvpRoomDto>(
            """
            SELECT r.id AS RoomId, r.room_code AS RoomCode, r.status AS Status,
                   r.host_user_id AS HostUserId,
                   ISNULL(up.display_name, hu.username) AS HostDisplayName,
                   r.guest_user_id AS GuestUserId,
                   ISNULL(gp.display_name, gu.username) AS GuestDisplayName
            FROM dbo.pvp_rooms r
            INNER JOIN dbo.users hu ON hu.id = r.host_user_id
            LEFT JOIN dbo.user_profiles up ON up.user_id = r.host_user_id
            LEFT JOIN dbo.users gu ON gu.id = r.guest_user_id
            LEFT JOIN dbo.user_profiles gp ON gp.user_id = r.guest_user_id
            WHERE r.room_code = @code
            """,
            new { code });
    }

    private sealed class SpStartRow
    {
        public int session_id { get; set; }
        public int max_hearts { get; set; }
        public int? set_id { get; set; }
    }

    private sealed class SpStartPgRow
    {
        public int session_id { get; set; }
        public int max_hearts { get; set; }
        public int? set_id { get; set; }
        public int q_id { get; set; }
        public string question_type { get; set; } = null!;
        public string? question_text { get; set; }
        public string? hint_text { get; set; }
        public string? audio_url { get; set; }
        public string? image_url { get; set; }
        public string? options_json { get; set; }
        public int base_score { get; set; }
        public int difficulty { get; set; }
    }

    private sealed class SpQuestionRow
    {
        public int id { get; set; }
        public string question_type { get; set; } = null!;
        public string? question_text { get; set; }
        public string? hint_text { get; set; }
        public string? audio_url { get; set; }
        public string? image_url { get; set; }
        public string? options_json { get; set; }
        public int base_score { get; set; }
        public int difficulty { get; set; }
    }

    private sealed class SpAnswerRow
    {
        public bool is_correct { get; set; }
        public int? correct_index { get; set; }
        public int score_earned { get; set; }
        public int combo { get; set; }
        public int speed_bonus { get; set; }
    }

    private sealed class SpEndRow
    {
        public int final_score { get; set; }
        public int correct_count { get; set; }
        public int total_questions { get; set; }
        public decimal accuracy_percent { get; set; }
        public int max_combo { get; set; }
        public int time_spent_seconds { get; set; }
        public int exp_earned { get; set; }
        public int xu_earned { get; set; }
    }

    private sealed class PurchasePowerUpRow
    {
        public int Id { get; set; }
        public int? XuPrice { get; set; }
    }
}
