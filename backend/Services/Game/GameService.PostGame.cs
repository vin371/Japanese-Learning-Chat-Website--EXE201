using System.Linq;
using System.Text.Json;
using Dapper;
using Npgsql;
using backend.Data;

namespace backend.Services.Game;

/// <summary>Cập nhật bảng xếp hạng + thành tích sau khi kết thúc phiên game (6.3 / 6.4).</summary>
public partial class GameService
{
    private sealed class GameSessionMetaRow
    {
        public int UserId { get; set; }
        public int GameId { get; set; }
        public string GameSlug { get; set; } = "";
        public int? LevelId { get; set; }
    }

    private async Task AfterGameSessionCompletedAsync(NpgsqlConnection db, int sessionId, SpEndRow summary)
    {
        var meta = await db.PgQueryFirstOrDefaultAsync<GameSessionMetaRow>(
            """
            SELECT gs.user_id AS UserId, gs.game_id AS GameId, g.slug AS GameSlug, u.level_id AS LevelId
            FROM dbo.game_sessions gs
            INNER JOIN dbo.games g ON g.id = gs.game_id
            INNER JOIN dbo.users u ON u.id = gs.user_id
            WHERE gs.id = @sid
            """,
            new { sid = sessionId });

        if (meta is null)
            return;

        var utc = DateTime.UtcNow;
        var weekStart = GetUtcWeekStart(utc);
        var weekEnd = weekStart.AddDays(7);
        var monthStart = GetUtcMonthStart(utc);
        var monthEnd = monthStart.AddMonths(1);

        var weeklyGlobal = await EnsureLeaderboardPeriodAsync(db, "weekly", weekStart, weekEnd, null, null,
            "Tuần toàn hệ thống");
        var monthlyGlobal = await EnsureLeaderboardPeriodAsync(db, "monthly", monthStart, monthEnd, null, null,
            "Tháng toàn hệ thống");
        var weeklyGame = await EnsureLeaderboardPeriodAsync(db, "weekly", weekStart, weekEnd, meta.GameId, null,
            "Tuần theo game");

        var sessionAvgTop10Ms = await db.PgExecuteScalarAsync<double?>(
            """
            SELECT AVG(x.response_ms::double precision)
            FROM (
                SELECT response_ms
                FROM game_session_answers
                WHERE session_id = @sid AND response_ms IS NOT NULL
                ORDER BY question_order
                LIMIT 10
            ) x
            """,
            new { sid = sessionId });

        var sessionAvgMsInt = sessionAvgTop10Ms is null ? (int?)null : (int)Math.Round(sessionAvgTop10Ms.Value);

        await UpsertLeaderboardEntryAsync(db, weeklyGlobal, meta.UserId, summary.final_score, summary.accuracy_percent,
            summary.max_combo, sessionAvgMsInt);
        await UpsertLeaderboardEntryAsync(db, monthlyGlobal, meta.UserId, summary.final_score, summary.accuracy_percent,
            summary.max_combo, sessionAvgMsInt);
        await UpsertLeaderboardEntryAsync(db, weeklyGame, meta.UserId, summary.final_score, summary.accuracy_percent,
            summary.max_combo, sessionAvgMsInt);

        if (meta.LevelId is > 0)
        {
            var weeklyLevel = await EnsureLeaderboardPeriodAsync(db, "weekly", weekStart, weekEnd, null, meta.LevelId,
                "Tuần theo cấp độ");
            await UpsertLeaderboardEntryAsync(db, weeklyLevel, meta.UserId, summary.final_score,
                summary.accuracy_percent, summary.max_combo, sessionAvgMsInt);
        }

        await EvaluateSessionAchievementsAsync(db, meta, summary, sessionId, sessionAvgTop10Ms);

        try
        {
            await EvaluateTotalExpAchievementsAsync(db, meta.UserId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "EvaluateTotalExpAchievementsAsync failed after session {SessionId}", sessionId);
        }
    }

    private static int GetMinExpFromCriteriaJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return int.MaxValue;
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("minExp", out var e))
                return e.GetInt32();
            if (doc.RootElement.TryGetProperty("min_exp", out var e2))
                return e2.GetInt32();
        }
        catch
        {
            /* ignore */
        }

        return int.MaxValue;
    }

    public async Task RefreshTotalExpAchievementsForUserAsync(int userId)
    {
        if (userId <= 0) return;
        using var db = CreateConnection();
        await db.OpenAsync();
        await EvaluateTotalExpAchievementsAsync(db, userId);
    }

    /// <summary>Thành tích mốc EXP (criteria_type = total_exp). Phần thưởng EXP có thể kích hoạt mốc tiếp theo — lặp tối đa 15 lần.</summary>
    private async Task EvaluateTotalExpAchievementsAsync(NpgsqlConnection db, int userId)
    {
        for (var guard = 0; guard < 15; guard++)
        {
            var exp = await db.PgExecuteScalarAsync<int>(
                "SELECT ISNULL(exp, 0) FROM dbo.users WHERE id = @u", new { u = userId });

            var rows = (await db.PgQueryAsync<(int id, string slug, string? criteriaJson)>(
                """
                SELECT a.id, a.slug, a.criteria_json
                FROM dbo.achievements a
                WHERE ISNULL(a.is_active, 1) = 1
                  AND LOWER(COALESCE(a.criteria_type, '')) = 'total_exp'
                  AND NOT EXISTS (
                    SELECT 1 FROM dbo.user_achievements ua
                    WHERE ua.user_id = @u AND ua.achievement_id = a.id)
                """,
                new { u = userId })).ToList();

            if (rows.Count == 0)
                return;

            var eligible = rows
                .Select(r => (r, min: GetMinExpFromCriteriaJson(r.criteriaJson)))
                .Where(x => x.min <= exp)
                .OrderBy(x => x.min)
                .ThenBy(x => x.r.id)
                .ToList();

            if (eligible.Count == 0)
                return;

            await TryGrantAchievementBySlugAsync(db, userId, eligible[0].r.slug);
        }
    }

    private static DateTime GetUtcWeekStart(DateTime utcNow)
    {
        var d = utcNow.Date;
        var diff = (7 + (int)d.DayOfWeek - (int)DayOfWeek.Monday) % 7;
        return DateTime.SpecifyKind(d.AddDays(-diff), DateTimeKind.Utc);
    }

    private static DateTime GetUtcMonthStart(DateTime utcNow)
    {
        var m = new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        return m;
    }

    private static async Task<int> EnsureLeaderboardPeriodAsync(
        NpgsqlConnection db,
        string periodType,
        DateTime startsAt,
        DateTime endsAt,
        int? gameId,
        int? levelId,
        string _)
    {
        var scope = gameId is not null ? "game" : levelId is not null ? "level" : "global";
        var periodStart = DateOnly.FromDateTime(startsAt);
        var periodEnd = DateOnly.FromDateTime(endsAt);

        var existing = await db.PgExecuteScalarAsync<int?>(
            """
            SELECT id
            FROM leaderboard_periods
            WHERE type = @pt
              AND scope = @scope
              AND period_start = @s
              AND ((@gid IS NULL AND game_id IS NULL) OR game_id = @gid)
              AND ((@lid IS NULL AND level_id IS NULL) OR level_id = @lid)
            """,
            new { pt = periodType, scope, s = periodStart, gid = gameId, lid = levelId });

        if (existing is not null)
            return existing.Value;

        return await db.PgExecuteScalarAsync<int>(
            """
            INSERT INTO leaderboard_periods (type, scope, level_id, game_id, period_start, period_end, created_at)
            VALUES (@pt, @scope, @lid, @gid, @s, @e, NOW() AT TIME ZONE 'utc')
            RETURNING id
            """,
            new
            {
                gid = gameId,
                lid = levelId,
                pt = periodType,
                scope,
                s = periodStart,
                e = periodEnd
            });
    }

    private static async Task UpsertLeaderboardEntryAsync(
        NpgsqlConnection db,
        int periodId,
        int userId,
        int sessionScore,
        decimal sessionAccuracy,
        int _sessionMaxCombo,
        int? sessionAvgMs)
    {
        var row = await db.PgQueryFirstOrDefaultAsync<LeaderboardRow>(
            """
            SELECT score, accuracy_percent
            FROM leaderboard_entries
            WHERE period_id = @p AND user_id = @u
            """,
            new { p = periodId, u = userId });

        var avgSec = sessionAvgMs is null ? (decimal?)null : sessionAvgMs.Value / 1000m;

        if (row is null)
        {
            await db.PgExecuteAsync(
                """
                INSERT INTO leaderboard_entries (period_id, user_id, rank, score, accuracy_percent, avg_response_seconds, created_at, updated_at)
                VALUES (@p, @u, 1, @score, @acc, @avgSec, NOW() AT TIME ZONE 'utc', NOW() AT TIME ZONE 'utc')
                """,
                new
                {
                    p = periodId,
                    u = userId,
                    score = sessionScore,
                    acc = sessionAccuracy,
                    avgSec
                });
            return;
        }

        var newScore = Math.Max(row.score, sessionScore);
        var newAcc = row.accuracy_percent is null
            ? sessionAccuracy
            : (row.accuracy_percent.Value + sessionAccuracy) / 2;

        await db.PgExecuteAsync(
            """
            UPDATE leaderboard_entries
            SET score = @score,
                accuracy_percent = @acc,
                avg_response_seconds = COALESCE(@avgSec, avg_response_seconds),
                updated_at = NOW() AT TIME ZONE 'utc'
            WHERE period_id = @p AND user_id = @u
            """,
            new
            {
                p = periodId,
                u = userId,
                score = newScore,
                acc = newAcc,
                avgSec
            });
    }

    private sealed class LeaderboardRow
    {
        public int score { get; set; }
        public decimal? accuracy_percent { get; set; }
    }

    private async Task EvaluateSessionAchievementsAsync(
        NpgsqlConnection db,
        GameSessionMetaRow meta,
        SpEndRow summary,
        int sessionId,
        double? avgTop10Ms)
    {
        if (meta.GameSlug.Equals("hiragana-match", StringComparison.OrdinalIgnoreCase)
            && summary.total_questions > 0
            && summary.correct_count == summary.total_questions)
            await TryGrantAchievementBySlugAsync(db, meta.UserId, "hiragana-master");

        if (meta.GameSlug.Equals("katakana-match", StringComparison.OrdinalIgnoreCase)
            && summary.total_questions > 0
            && summary.correct_count == summary.total_questions)
            await TryGrantAchievementBySlugAsync(db, meta.UserId, "katakana-master");

        if (summary.max_combo >= 5)
            await TryGrantAchievementBySlugAsync(db, meta.UserId, "combo-king");

        var answerCount = await db.PgExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM dbo.game_session_answers WHERE session_id = @sid AND response_ms IS NOT NULL",
            new { sid = sessionId });

        if (answerCount >= 10 && avgTop10Ms is not null && avgTop10Ms < 2000)
            await TryGrantAchievementBySlugAsync(db, meta.UserId, "speed-demon");

        var distinctDays = await db.PgExecuteScalarAsync<int>(
            """
            SELECT COUNT(DISTINCT CAST(completed_at AS DATE))
            FROM dbo.user_daily_challenges
            WHERE user_id = @u AND completed_at IS NOT NULL
            """,
            new { u = meta.UserId });

        if (distinctDays >= 30)
            await TryGrantAchievementBySlugAsync(db, meta.UserId, "daily-dedication");
    }

    private async Task TryGrantAchievementBySlugAsync(NpgsqlConnection db, int userId, string slug)
    {
        var ach = await db.PgQueryFirstOrDefaultAsync<(int id, int exp, int xu)?>(
            """
            SELECT id, reward_exp, reward_xu
            FROM dbo.achievements
            WHERE slug = @slug AND ISNULL(is_active, 1) = 1
            """,
            new { slug });

        if (ach is null)
            return;

        var exists = await db.PgExecuteScalarAsync<int>(
            """
            SELECT COUNT(1) FROM dbo.user_achievements WHERE user_id = @u AND achievement_id = @a
            """,
            new { u = userId, a = ach.Value.id });

        if (exists > 0)
            return;

        await db.PgExecuteAsync(
            """
            INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
            VALUES (@u, @a, NOW() AT TIME ZONE 'utc')
            """,
            new { u = userId, a = ach.Value.id });

        if (ach.Value.exp > 0 || ach.Value.xu > 0)
        {
            await db.PgExecuteAsync(
                "UPDATE dbo.users SET exp = exp + @e, xu = xu + @x WHERE id = @u",
                new { e = ach.Value.exp, x = ach.Value.xu, u = userId });
        }
    }
}
