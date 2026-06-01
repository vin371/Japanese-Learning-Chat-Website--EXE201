using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs.Admin;
using backend.Models.Admin;
using backend.Models.Moderation;
using Dapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Npgsql;

namespace backend.Services.Admin;

public class AdminService : IAdminService
{
    private const string OverviewCacheKey = "admin:overview:v3";
    private static readonly TimeSpan OverviewCacheTtl = TimeSpan.FromSeconds(45);

    private readonly ApplicationDbContext _db;
    private readonly IMemoryCache _cache;

    public AdminService(ApplicationDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    private static DateTime PgTs(DateTime dt) => PgDateTime.ToUnspecifiedUtc(dt);

    private static bool IsOverviewQueryError(Exception ex) =>
        ex is PostgresException or ArgumentException or InvalidCastException or InvalidOperationException
        || DbExceptionHelper.IsMissingRelation(ex)
        || DbExceptionHelper.IsMissingColumn(ex)
        || DbExceptionHelper.IsConnectionError(ex);

    public async Task<AdminOverviewDto> GetOverviewAsync()
    {
        if (_cache.TryGetValue(OverviewCacheKey, out AdminOverviewDto? cached) && cached != null)
            return cached;

        var dto = await BuildOverviewAsync();
        _cache.Set(OverviewCacheKey, dto, OverviewCacheTtl);
        return dto;
    }

    private async Task<AdminOverviewDto> BuildOverviewAsync()
    {
        var connStr = _db.Database.GetConnectionString()
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection chưa cấu hình.");

        try
        {
        var now = DateTime.UtcNow;
        var dayStart = now.Date;
        var d7 = dayStart.AddDays(-7);
        var d30 = dayStart.AddDays(-30);
        var d30SignupChart = dayStart.AddDays(-29);
        var msgSince = now.AddHours(-24);

        // Một kết nối tuần tự — ổn định trên Supabase pooler / Railway (tránh 6 kết nối song song).
        await using var conn = new NpgsqlConnection(connStr);
        await conn.OpenAsync();

        var users = await QueryUserAggregateAsync(conn, d7, d30);
        var signup = await QuerySignupsPerDayAsync(conn, d30SignupChart, dayStart);
        var levels = await QueryUsersByLevelAsync(conn);
        var payment = await QueryPaymentBundleAsync(conn, dayStart, now);
        var learning = await QueryLearningActivityAsync(conn, now);
        var msgCount = await QueryMessagesCountAsync(conn, msgSince);
        var premium = users.PremiumUsers;
        var academyUsers = users.AcademyUsers;
        var freeUsers = Math.Max(0, academyUsers - premium);
        var conversion = academyUsers == 0 ? 0 : Math.Round(100.0 * premium / academyUsers, 2);
        var retention = users.CohortSize == 0
            ? 0
            : Math.Round(100.0 * users.RetainedCount / users.CohortSize, 1);

        return new AdminOverviewDto
        {
            AcademyUsers = academyUsers,
            FreeUsers = freeUsers,
            TotalUsers = users.TotalUsers,
            ActiveUsers = users.ActiveUsers,
            LockedUsers = users.LockedUsers,
            PremiumUsers = premium,
            RevenueTodayVnd = payment.RevenueToday,
            RevenueCumulativeVnd = payment.RevenueCumulative,
            PremiumConversionRatePercent = conversion,
            PremiumUpgradesThisMonth = payment.UpgradesThisMonth,
            NewUsersLast7Days = users.NewUsersLast7Days,
            NewUsersLast30Days = users.NewUsersLast30Days,
            RetentionRatePercent = retention,
            UsersByLevel = levels,
            MessagesLast24Hours = msgCount,
            NewUsersPerDay = signup,
            RevenueLast8Months = payment.RevenueLast8Months,
            LearningActivity = learning,
            UsersByPackage =
            [
                new PackageSliceDto { Name = "Miễn phí", Count = freeUsers, Color = "#94a3b8" },
                new PackageSliceDto { Name = "Premium", Count = premium, Color = "#7c3aed" }
            ]
        };
        }
        catch (Exception ex) when (IsOverviewQueryError(ex))
        {
            return new AdminOverviewDto();
        }
    }

    private sealed class UserAggregateRow
    {
        public int TotalUsers { get; set; }
        public int AcademyUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int LockedUsers { get; set; }
        public int PremiumUsers { get; set; }
        public int NewUsersLast7Days { get; set; }
        public int NewUsersLast30Days { get; set; }
        public int CohortSize { get; set; }
        public int RetainedCount { get; set; }
    }

    private sealed class PaymentBundle
    {
        public decimal RevenueToday { get; set; }
        public decimal RevenueCumulative { get; set; }
        public int UpgradesThisMonth { get; set; }
        public List<MonthlyRevenueDto> RevenueLast8Months { get; set; } = new();
    }

    private sealed class LearningRow
    {
        public int GameSessionsStartedLast30Days { get; set; }
        public int GameSessionsEndedLast30Days { get; set; }
        public int CompletedLessonsLast30Days { get; set; }
    }

    private static async Task<UserAggregateRow> QueryUserAggregateAsync(NpgsqlConnection conn, DateTime d7, DateTime d30)
    {
        try
        {
        return await conn.QueryFirstAsync<UserAggregateRow>(
            """
            SELECT
                COUNT(*)::int AS TotalUsers,
                COUNT(*) FILTER (WHERE role = 'user')::int AS AcademyUsers,
                COUNT(*) FILTER (WHERE role = 'user' AND NOT is_locked)::int AS ActiveUsers,
                COUNT(*) FILTER (WHERE role = 'user' AND is_locked)::int AS LockedUsers,
                COUNT(*) FILTER (WHERE role = 'user' AND is_premium)::int AS PremiumUsers,
                COUNT(*) FILTER (WHERE role = 'user' AND created_at >= @d7)::int AS NewUsersLast7Days,
                COUNT(*) FILTER (WHERE role = 'user' AND created_at >= @d30)::int AS NewUsersLast30Days,
                COUNT(*) FILTER (WHERE role = 'user' AND created_at < @d30)::int AS CohortSize,
                COUNT(*) FILTER (
                    WHERE role = 'user' AND created_at < @d30
                      AND last_login_at IS NOT NULL AND last_login_at >= @d30
                )::int AS RetainedCount
            FROM users
            WHERE deleted_at IS NULL
            """,
            new { d7 = PgTs(d7), d30 = PgTs(d30) });
        }
        catch (Exception ex) when (IsOverviewQueryError(ex))
        {
            return new UserAggregateRow();
        }
    }

    private static async Task<List<DailyCountDto>> QuerySignupsPerDayAsync(
        NpgsqlConnection conn, DateTime from, DateTime dayStart)
    {
        try
        {
        var rows = (await conn.QueryAsync<(DateTime Day, int Count)>(
            """
            SELECT DATE(created_at) AS Day, COUNT(*)::int AS Count
            FROM users
            WHERE deleted_at IS NULL AND role = 'user' AND created_at >= @from
            GROUP BY 1
            ORDER BY 1
            """,
            new { from = PgTs(from) })).ToList();
        var byDay = rows.ToDictionary(r => r.Day.Date, r => r.Count);

        var perDay = new List<DailyCountDto>();
        for (var d = from; d <= dayStart; d = d.AddDays(1))
        {
            byDay.TryGetValue(d.Date, out var c);
            perDay.Add(new DailyCountDto { Date = d.ToString("yyyy-MM-dd"), Count = c });
        }

        return perDay;
        }
        catch (Exception ex) when (IsOverviewQueryError(ex))
        {
            return new List<DailyCountDto>();
        }
    }

    private static async Task<List<LevelCountDto>> QueryUsersByLevelAsync(NpgsqlConnection conn)
    {
        try
        {
        var rows = await conn.QueryAsync<(int? LevelId, int Cnt)>(
            """
            SELECT level_id AS LevelId, COUNT(*)::int AS Cnt
            FROM users
            WHERE deleted_at IS NULL AND role = 'user'
            GROUP BY level_id
            ORDER BY level_id NULLS LAST
            """);
        return rows.Select(x => new LevelCountDto
        {
            LevelId = x.LevelId,
            Label = LevelLabel(x.LevelId),
            Count = x.Cnt
        }).ToList();
        }
        catch (Exception ex) when (IsOverviewQueryError(ex))
        {
            return new List<LevelCountDto>();
        }
    }

    private static async Task<int> QueryMessagesCountAsync(NpgsqlConnection conn, DateTime since)
    {
        try
        {
            return await conn.ExecuteScalarAsync<int>(
                """
                SELECT COUNT(*)::int FROM messages
                WHERE NOT is_deleted AND created_at >= @since
                """,
                new { since = PgTs(since) });
        }
        catch (Exception ex) when (IsOverviewQueryError(ex))
        {
            return 0;
        }
    }

    private static async Task<PaymentBundle> QueryPaymentBundleAsync(
        NpgsqlConnection conn, DateTime dayStart, DateTime nowUtc)
    {
        var monthStart = new DateTime(nowUtc.Year, nowUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextMonth = monthStart.AddMonths(1);
        var firstMonth = monthStart.AddMonths(-7);
        var rangeEndExclusive = monthStart.AddMonths(1);

        var result = new PaymentBundle();
        for (var i = 0; i < 8; i++)
        {
            var m = firstMonth.AddMonths(i);
            result.RevenueLast8Months.Add(new MonthlyRevenueDto
            {
                MonthKey = m.ToString("yyyy-MM"),
                MonthLabel = $"T{m.Month}/{m.Year % 100:D2}",
                AmountVnd = 0
            });
        }

        try
        {
            var summary = await conn.QueryFirstOrDefaultAsync<PaymentBundle>(
                """
                SELECT
                    COALESCE(SUM(CASE WHEN approved_at >= @dayStart THEN amount_vnd ELSE 0 END), 0) AS RevenueToday,
                    COALESCE(SUM(amount_vnd), 0) AS RevenueCumulative,
                    COUNT(*) FILTER (
                        WHERE approved_at >= @monthStart AND approved_at < @nextMonth
                    )::int AS UpgradesThisMonth
                FROM premium_payment_requests
                WHERE status = 'approved'
                """,
                new
                {
                    dayStart = PgTs(dayStart),
                    monthStart = PgTs(monthStart),
                    nextMonth = PgTs(nextMonth)
                });
            if (summary != null)
            {
                result.RevenueToday = summary.RevenueToday;
                result.RevenueCumulative = summary.RevenueCumulative;
                result.UpgradesThisMonth = summary.UpgradesThisMonth;
            }

            var monthly = await conn.QueryAsync<(int Y, int Mo, decimal Total)>(
                """
                SELECT EXTRACT(YEAR FROM approved_at)::int AS Y,
                       EXTRACT(MONTH FROM approved_at)::int AS Mo,
                       COALESCE(SUM(amount_vnd), 0) AS Total
                FROM premium_payment_requests
                WHERE status = 'approved'
                  AND approved_at IS NOT NULL
                  AND approved_at >= @start
                  AND approved_at < @endEx
                GROUP BY 1, 2
                """,
                new
                {
                    start = PgTs(firstMonth),
                    endEx = PgTs(rangeEndExclusive)
                });

            var byKey = result.RevenueLast8Months.ToDictionary(b => b.MonthKey, b => b, StringComparer.Ordinal);
            foreach (var row in monthly)
            {
                var key = $"{row.Y}-{row.Mo:D2}";
                if (byKey.TryGetValue(key, out var bucket))
                    bucket.AmountVnd = row.Total;
            }
        }
        catch (Exception ex) when (IsOverviewQueryError(ex))
        {
            /* bảng payment / timestamp */
        }

        return result;
    }

    private static async Task<LearningActivityStatsDto> QueryLearningActivityAsync(NpgsqlConnection conn, DateTime nowUtc)
    {
        var from30 = PgTs(nowUtc.AddDays(-30));
        var dto = new LearningActivityStatsDto();
        try
        {
            var row = await conn.QueryFirstOrDefaultAsync<LearningRow>(
                """
                SELECT
                    (SELECT COUNT(*)::int FROM game_sessions WHERE started_at >= @from) AS GameSessionsStartedLast30Days,
                    (SELECT COUNT(*)::int FROM game_sessions WHERE ended_at IS NOT NULL AND ended_at >= @from) AS GameSessionsEndedLast30Days,
                    (SELECT COUNT(*)::int FROM user_lesson_progress WHERE completed_at IS NOT NULL AND completed_at >= @from) AS CompletedLessonsLast30Days
                """,
                new { from = from30 });
            if (row == null) return dto;
            dto.GameSessionsStartedLast30Days = row.GameSessionsStartedLast30Days;
            dto.GameSessionsEndedLast30Days = row.GameSessionsEndedLast30Days;
            dto.CompletedLessonsLast30Days = row.CompletedLessonsLast30Days;
        }
        catch (Exception ex) when (IsOverviewQueryError(ex))
        {
            /* bảng game / lesson chưa migrate */
        }

        return dto;
    }


    private static string LevelLabel(int? lid) => lid switch
    {
        1 => "N5",
        2 => "N4",
        3 => "N3",
        4 => "N2",
        5 => "N1",
        _ => "Chưa gán"
    };

    public async Task<IReadOnlyList<SensitiveKeywordAdminDto>> ListSensitiveKeywordsAsync()
    {
        var list = await _db.SensitiveKeywords.AsNoTracking()
            .OrderBy(k => k.Keyword)
            .ToListAsync();
        return list.Select(MapKw).ToList();
    }

    public async Task<int> CreateSensitiveKeywordAsync(int adminUserId, CreateSensitiveKeywordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Keyword))
            throw new ArgumentException("Từ khóa không được để trống.");

        var kw = request.Keyword.Trim();
        var exists = await _db.SensitiveKeywords.AnyAsync(k => k.Keyword.ToLower() == kw.ToLower());
        if (exists)
            throw new InvalidOperationException("Từ khóa đã tồn tại.");

        var now = DateTime.UtcNow;
        var row = new SensitiveKeyword
        {
            Keyword = kw,
            Severity = Math.Clamp(request.Severity, 1, 3),
            IsActive = true,
            CreatedBy = adminUserId,
            CreatedAt = now,
            UpdatedAt = now
        };
        _db.SensitiveKeywords.Add(row);
        await _db.SaveChangesAsync();
        return row.Id;
    }

    public async Task<bool> UpdateSensitiveKeywordAsync(int id, UpdateSensitiveKeywordRequest request)
    {
        var row = await _db.SensitiveKeywords.FirstOrDefaultAsync(k => k.Id == id);
        if (row == null) return false;

        if (!string.IsNullOrWhiteSpace(request.Keyword))
            row.Keyword = request.Keyword.Trim();
        if (request.Severity.HasValue)
            row.Severity = Math.Clamp(request.Severity.Value, 1, 3);
        if (request.IsActive.HasValue)
            row.IsActive = request.IsActive.Value;
        row.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteSensitiveKeywordAsync(int id)
    {
        var row = await _db.SensitiveKeywords.FirstOrDefaultAsync(k => k.Id == id);
        if (row == null) return false;
        _db.SensitiveKeywords.Remove(row);
        await _db.SaveChangesAsync();
        return true;
    }

    private static SensitiveKeywordAdminDto MapKw(SensitiveKeyword k) => new()
    {
        Id = k.Id,
        Keyword = k.Keyword,
        Severity = k.Severity,
        IsActive = k.IsActive,
        CreatedBy = k.CreatedBy,
        CreatedAt = k.CreatedAt,
        UpdatedAt = k.UpdatedAt
    };

    public async Task<SystemAnnouncementPublicDto?> GetLatestPublishedAnnouncementAsync()
    {
        var row = await _db.SystemAnnouncements.AsNoTracking()
            .Where(a => a.IsPublished && a.PublishedAt != null)
            .OrderByDescending(a => a.PublishedAt)
            .ThenByDescending(a => a.Id)
            .FirstOrDefaultAsync();
        return row == null ? null : MapAnnouncement(row);
    }

    public async Task<SystemAnnouncementPublicDto> PublishSystemAnnouncementAsync(int adminUserId, PublishSystemAnnouncementRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Tiêu đề không được để trống.");

        var title = request.Title.Trim();
        if (title.Length > 200)
            title = title[..200];

        var content = string.IsNullOrWhiteSpace(request.Content) ? string.Empty : request.Content.Trim();
        var typeRaw = string.IsNullOrWhiteSpace(request.Type) ? "maintenance" : request.Type.Trim();
        var type = typeRaw.Length > 30 ? typeRaw[..30] : typeRaw;

        var now = DateTime.UtcNow;
        var row = new SystemAnnouncement
        {
            Title = title,
            Content = content,
            Type = type,
            IsPublished = true,
            PublishedAt = now,
            CreatedBy = adminUserId,
            CreatedAt = now,
            UpdatedAt = now
        };
        _db.SystemAnnouncements.Add(row);
        await _db.SaveChangesAsync();
        return MapAnnouncement(row);
    }

    private static SystemAnnouncementPublicDto MapAnnouncement(SystemAnnouncement a) => new()
    {
        Id = a.Id,
        Title = a.Title,
        Content = a.Content,
        Type = a.Type,
        PublishedAt = a.PublishedAt
    };
}
