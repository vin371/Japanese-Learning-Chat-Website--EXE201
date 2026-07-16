using System.Collections;
using System.Text.RegularExpressions;
using Npgsql;

namespace backend.Data;

/// <summary>
/// Chuẩn hóa connection string PostgreSQL / Supabase cho Railway + local.
/// Đọc env không phân biệt hoa thường (Linux case-sensitive dễ lệch tên biến).
/// </summary>
public static class PostgresConnectionString
{
    public const string PlaceholderPassword = "YOUR_SUPABASE_DB_PASSWORD";

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

    /// <summary>Đọc env (Railway Variables) — null nếu chưa có mật khẩu thật.</summary>
    public static ResolveResult? TryResolveFromEnvironment()
    {
        LogRelevantEnvKeys();

        // Ưu tiên ConnectionStrings (key=value) — bỏ DATABASE_URL nếu cả hai có
        foreach (var key in FindEnvKeys(
                     "ConnectionStrings__DefaultConnection",
                     "ConnectionStrings:DefaultConnection",
                     "CONNECTIONSTRINGS__DEFAULTCONNECTION"))
        {
            var raw = GetEnv(key);
            if (string.IsNullOrWhiteSpace(raw) || IsPlaceholderConnection(raw))
                continue;
            try
            {
                if (HasEnv("DATABASE_URL") || HasEnv("database_url"))
                {
                    Console.WriteLine(
                        "[yumegoji] Có ConnectionStrings + DATABASE_URL — dùng ConnectionStrings. Nên xóa DATABASE_URL trên Railway.");
                }
                return new ResolveResult(Normalize(raw), key);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[yumegoji] Bỏ qua {key}: {ex.Message}");
            }
        }

        foreach (var key in FindEnvKeys(
                     "DATABASE_URL",
                     "SUPABASE_CONNECTION_STRING",
                     "DefaultConnection",
                     "SUPABASE_DB_URL"))
        {
            var raw = GetEnv(key);
            if (string.IsNullOrWhiteSpace(raw) || IsPlaceholderConnection(raw))
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

        var composed = TryComposeFromParts();
        if (composed != null)
            return composed;

        return null;
    }

    /// <summary>Ghi đè từ IConfiguration nếu env raw miss nhưng config đã có (hiếm).</summary>
    public static ResolveResult? TryResolveFromConfiguration(string? configured)
    {
        if (string.IsNullOrWhiteSpace(configured) || IsPlaceholderConnection(configured))
            return null;
        try
        {
            return new ResolveResult(Normalize(configured), "IConfiguration");
        }
        catch
        {
            return null;
        }
    }

    public static bool IsPlaceholderConnection(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return true;
        return raw.Contains(PlaceholderPassword, StringComparison.OrdinalIgnoreCase);
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
            hint =
                "Password đang là placeholder appsettings.json — container KHÔNG nhận được biến Railway. " +
                "Service Variables → thêm ConnectionStrings__DefaultConnection (Runtime) → Redeploy.";
        }
        else if (pwd.Length == 0)
        {
            hint = "Password trống.";
        }
        else if (pooler && user.Equals("postgres", StringComparison.OrdinalIgnoreCase))
        {
            hint = "Session pooler cần Username dạng postgres.<project-ref>.";
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
            if (e is PostgresException pe &&
                (pe.SqlState == PostgresErrorCodes.InvalidPassword || pe.SqlState == "28P01"))
                return true;
        }
        return false;
    }

    private static ResolveResult? TryComposeFromParts()
    {
        var password = GetEnv("SUPABASE_DB_PASSWORD") ?? GetEnv("POSTGRES_PASSWORD");
        if (string.IsNullOrWhiteSpace(password) ||
            password.Equals(PlaceholderPassword, StringComparison.OrdinalIgnoreCase))
            return null;

        var host = GetEnv("SUPABASE_DB_HOST") ?? "aws-1-ap-southeast-2.pooler.supabase.com";
        var user = GetEnv("SUPABASE_DB_USER") ?? "postgres.jvdghkjkgrdogpymnwpu";
        var database = GetEnv("SUPABASE_DB_NAME") ?? "postgres";
        var portRaw = GetEnv("SUPABASE_DB_PORT") ?? "5432";
        if (!int.TryParse(portRaw, out var port))
            port = 5432;

        var csb = new NpgsqlConnectionStringBuilder
        {
            Host = host.Trim(),
            Port = port,
            Database = database.Trim(),
            Username = user.Trim(),
            Password = password.Trim(),
            SslMode = SslMode.Require,
        };
        return new ResolveResult(EnsureSupabaseDefaults(csb.ConnectionString), "SUPABASE_DB_PASSWORD(+host/user)");
    }

    private static void LogRelevantEnvKeys()
    {
        var names = new List<string>();
        foreach (DictionaryEntry entry in Environment.GetEnvironmentVariables())
        {
            var name = entry.Key?.ToString() ?? "";
            if (name.Contains("Connection", StringComparison.OrdinalIgnoreCase) ||
                name.Contains("DATABASE", StringComparison.OrdinalIgnoreCase) ||
                name.Contains("SUPABASE", StringComparison.OrdinalIgnoreCase) ||
                name.Equals("JWT_KEY", StringComparison.OrdinalIgnoreCase) ||
                name.Contains("Jwt", StringComparison.OrdinalIgnoreCase))
            {
                names.Add(name);
            }
        }

        names.Sort(StringComparer.OrdinalIgnoreCase);
        Console.WriteLine(
            names.Count == 0
                ? "[yumegoji] Env DB/JWT: (không có key nào) — Variables Railway chưa inject vào container."
                : "[yumegoji] Env DB/JWT keys: " + string.Join(", ", names));
    }

    private static IEnumerable<string> FindEnvKeys(params string[] candidates)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var c in candidates)
        {
            foreach (DictionaryEntry entry in Environment.GetEnvironmentVariables())
            {
                var name = entry.Key?.ToString() ?? "";
                if (!name.Equals(c, StringComparison.OrdinalIgnoreCase))
                    continue;
                if (seen.Add(name))
                    yield return name;
            }
        }
    }

    private static bool HasEnv(string name) => !string.IsNullOrWhiteSpace(GetEnv(name));

    private static string? GetEnv(string name)
    {
        foreach (DictionaryEntry entry in Environment.GetEnvironmentVariables())
        {
            var key = entry.Key?.ToString() ?? "";
            if (key.Equals(name, StringComparison.OrdinalIgnoreCase))
                return entry.Value?.ToString();
        }
        return null;
    }

    private static bool IsPostgresUri(string value) =>
        value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase);

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
            throw new InvalidOperationException("DATABASE_URL thiếu user/password hoặc host.");

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

        var slash = hostPart.IndexOf('/');
        var hostPort = slash >= 0 ? hostPart[..slash] : hostPart;
        var database = slash >= 0 ? hostPart[(slash + 1)..].Trim('/') : "postgres";
        if (string.IsNullOrEmpty(database))
            database = "postgres";

        string host;
        var port = 5432;
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

        if (host.Contains("pooler.supabase.com", StringComparison.OrdinalIgnoreCase) &&
            user.Equals("postgres", StringComparison.OrdinalIgnoreCase))
        {
            Console.WriteLine(
                "[yumegoji] CẢNH BÁO: Username=postgres trên pooler — nên dùng postgres.<project-ref>.");
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
            csb.SslMode = SslMode.Require;
            csb.Remove("Trust Server Certificate");
            csb.Remove("TrustServerCertificate");
        }

        if (!string.IsNullOrEmpty(csb.Password))
            csb.Password = csb.Password.Trim();
        if (!string.IsNullOrEmpty(csb.Username))
            csb.Username = csb.Username.Trim();

        return csb.ConnectionString;
    }
}
