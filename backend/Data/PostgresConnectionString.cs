using System.Text.RegularExpressions;
using Npgsql;

namespace backend.Data;

/// <summary>
/// Chuẩn hóa connection string PostgreSQL / Supabase cho Railway + local.
/// Ưu tiên key=value (Npgsql); URI postgres(ql):// được chuyển sang Host=... để tránh cắt query/password.
/// </summary>
public static class PostgresConnectionString
{
    public const string PlaceholderPassword = "YOUR_SUPABASE_DB_PASSWORD";

    private static readonly string[] EnvKeys =
    [
        "ConnectionStrings__DefaultConnection",
        "ConnectionStrings:DefaultConnection",
        "DATABASE_URL",
        "SUPABASE_CONNECTION_STRING",
        "DefaultConnection",
    ];

    public sealed record ResolveResult(string Value, string Source);

    public sealed record Diagnostics(
        string Host,
        int Port,
        string Username,
        string Database,
        int PasswordLength,
        bool UsingPlaceholderPassword,
        bool LooksLikeSupabasePooler,
        string? Hint);

    /// <summary>Đọc env (Railway Variables) — null nếu chưa có.</summary>
    public static ResolveResult? TryResolveFromEnvironment()
    {
        foreach (var key in EnvKeys)
        {
            var raw = Environment.GetEnvironmentVariable(key);
            if (string.IsNullOrWhiteSpace(raw))
                continue;

            try
            {
                return new ResolveResult(Normalize(raw), key);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[yumegoji] Bỏ qua {key}: {ex.Message}");
            }
        }

        // Ghép từ biến rời (dễ paste mật khẩu trên Railway, tránh lỗi URI)
        var composed = TryComposeFromParts();
        if (composed != null)
            return composed;

        return null;
    }

    /// <summary>
    /// URI → Npgsql key=value; key=value giữ nguyên rồi ép SSL cho host Supabase.
    /// </summary>
    public static string Normalize(string raw)
    {
        var value = raw.Trim().Trim('"').Trim('\'');
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException("Connection string rỗng.");

        if (IsPostgresUri(value))
            value = UriToNpgsql(value);

        return EnsureSupabaseDefaults(value);
    }

    public static Diagnostics Inspect(string? connectionString)
    {
        var csb = new NpgsqlConnectionStringBuilder(connectionString ?? "");
        var host = csb.Host ?? "";
        var user = csb.Username ?? "";
        var pwd = csb.Password ?? "";
        var pooler = host.Contains("pooler.supabase.com", StringComparison.OrdinalIgnoreCase);
        string? hint = null;

        if (string.Equals(pwd, PlaceholderPassword, StringComparison.Ordinal))
        {
            hint = "Password đang là placeholder — đặt ConnectionStrings__DefaultConnection hoặc DATABASE_URL trên Railway (mật khẩu Database thật từ Supabase).";
        }
        else if (pwd.Length == 0)
        {
            hint = "Password trống.";
        }
        else if (pooler && user.Equals("postgres", StringComparison.OrdinalIgnoreCase))
        {
            hint = "Session pooler cần Username dạng postgres.<project-ref> (vd: postgres.jvdghkjkgrdogpymnwpu), không chỉ postgres.";
        }
        else if (pooler && !user.StartsWith("postgres.", StringComparison.OrdinalIgnoreCase))
        {
            hint = "Username pooler nên là postgres.<project-ref>.";
        }

        return new Diagnostics(
            host,
            csb.Port,
            user,
            csb.Database ?? "",
            pwd.Length,
            string.Equals(pwd, PlaceholderPassword, StringComparison.Ordinal),
            pooler,
            hint);
    }

    public static bool IsAuthFailure(Exception ex)
    {
        for (var e = ex; e != null; e = e.InnerException)
        {
            if (e is PostgresException pe && pe.SqlState == PostgresErrorCodes.InvalidPassword)
                return true;
            if (e is PostgresException pe2 && pe2.SqlState == "28P01")
                return true;
        }
        return false;
    }

    private static ResolveResult? TryComposeFromParts()
    {
        var password = Environment.GetEnvironmentVariable("SUPABASE_DB_PASSWORD")
            ?? Environment.GetEnvironmentVariable("POSTGRES_PASSWORD");
        if (string.IsNullOrWhiteSpace(password))
            return null;

        var host = Environment.GetEnvironmentVariable("SUPABASE_DB_HOST")
            ?? Environment.GetEnvironmentVariable("POSTGRES_HOST")
            ?? "aws-1-ap-southeast-2.pooler.supabase.com";
        var user = Environment.GetEnvironmentVariable("SUPABASE_DB_USER")
            ?? Environment.GetEnvironmentVariable("POSTGRES_USER")
            ?? "postgres.jvdghkjkgrdogpymnwpu";
        var database = Environment.GetEnvironmentVariable("SUPABASE_DB_NAME")
            ?? Environment.GetEnvironmentVariable("POSTGRES_DB")
            ?? "postgres";
        var portRaw = Environment.GetEnvironmentVariable("SUPABASE_DB_PORT")
            ?? Environment.GetEnvironmentVariable("POSTGRES_PORT")
            ?? "5432";
        if (!int.TryParse(portRaw, out var port))
            port = 5432;

        var csb = new NpgsqlConnectionStringBuilder
        {
            Host = host.Trim(),
            Port = port,
            Database = database.Trim(),
            Username = user.Trim(),
            Password = password,
            SslMode = SslMode.Require,
        };
        return new ResolveResult(EnsureSupabaseDefaults(csb.ConnectionString), "SUPABASE_DB_PASSWORD(+host/user)");
    }

    private static bool IsPostgresUri(string value) =>
        value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Parse URI thủ công (LastIndexOf '@') rồi Unescape — tránh cắt password khi có ký tự đặc biệt đã encode.
    /// </summary>
    private static string UriToNpgsql(string uri)
    {
        var value = uri;
        var q = value.IndexOf('?', StringComparison.Ordinal);
        if (q >= 0)
            value = value[..q];

        var schemeMatch = Regex.Match(value, @"^postgres(?:ql)?://", RegexOptions.IgnoreCase);
        if (!schemeMatch.Success)
            throw new InvalidOperationException("DATABASE_URL không phải URI postgres hợp lệ.");

        var rest = value[schemeMatch.Length..];
        var at = rest.LastIndexOf('@');
        if (at <= 0)
            throw new InvalidOperationException("DATABASE_URL thiếu user/password hoặc host (dạng user:pass@host).");

        var userInfo = rest[..at];
        var hostPart = rest[(at + 1)..];

        string user;
        string password;
        var colon = userInfo.IndexOf(':');
        if (colon < 0)
        {
            user = Uri.UnescapeDataString(userInfo);
            password = "";
        }
        else
        {
            user = Uri.UnescapeDataString(userInfo[..colon]);
            password = Uri.UnescapeDataString(userInfo[(colon + 1)..]);
        }

        // host:port/db
        var slash = hostPart.IndexOf('/');
        var hostPort = slash >= 0 ? hostPart[..slash] : hostPart;
        var database = slash >= 0 ? hostPart[(slash + 1)..].Trim('/') : "postgres";
        if (string.IsNullOrEmpty(database))
            database = "postgres";

        string host;
        int port = 5432;
        var colonHost = hostPort.LastIndexOf(':');
        if (colonHost > 0 && int.TryParse(hostPort[(colonHost + 1)..], out var parsedPort))
        {
            host = hostPort[..colonHost];
            port = parsedPort;
        }
        else
        {
            host = hostPort;
        }

        if (string.IsNullOrWhiteSpace(host))
            throw new InvalidOperationException("DATABASE_URL thiếu host.");

        // Pooler: nếu user chỉ là postgres, thử suy ra project-ref từ host db.<ref>.supabase.co
        if (host.Contains("pooler.supabase.com", StringComparison.OrdinalIgnoreCase) &&
            user.Equals("postgres", StringComparison.OrdinalIgnoreCase))
        {
            Console.WriteLine(
                "[yumegoji] CẢNH BÁO: Username=postgres trên pooler — nên dùng postgres.<project-ref>. " +
                "Nếu auth fail, sửa Username hoặc dùng ConnectionStrings__DefaultConnection (key=value).");
        }

        var csb = new NpgsqlConnectionStringBuilder
        {
            Host = host,
            Port = port,
            Database = database,
            Username = user,
            Password = password,
            SslMode = SslMode.Require,
        };
        return csb.ConnectionString;
    }

    private static string EnsureSupabaseDefaults(string npgsql)
    {
        var csb = new NpgsqlConnectionStringBuilder(npgsql);
        if (string.IsNullOrWhiteSpace(csb.Host))
            throw new InvalidOperationException("Connection string thiếu Host.");

        var isSupabase = csb.Host.Contains("supabase.com", StringComparison.OrdinalIgnoreCase)
            || csb.Host.Contains("supabase.co", StringComparison.OrdinalIgnoreCase);

        if (isSupabase)
        {
            // Supabase bắt buộc SSL; bỏ Trust Server Certificate (obsolete trên Npgsql mới)
            csb.SslMode = SslMode.Require;
            csb.Remove("Trust Server Certificate");
            csb.Remove("TrustServerCertificate");
        }

        return csb.ConnectionString;
    }
}
