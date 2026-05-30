using System.Text.RegularExpressions;

namespace backend.Data;

/// <summary>Chuyển cú pháp SQL Server (Dapper) sang PostgreSQL / Supabase.</summary>
public static class PostgresSqlDialect
{
    public static string Adapt(string sql)
    {
        if (string.IsNullOrWhiteSpace(sql))
            return sql;

        var s = sql;
        s = Regex.Replace(s, @"\bdbo\.", "", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"\bISNULL\s*\(", "COALESCE(", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"\bSYSUTCDATETIME\s*\(\s*\)", "NOW() AT TIME ZONE 'utc'", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"\bGETDATE\s*\(\s*\)", "NOW()", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"\bN'", "'");
        s = Regex.Replace(s, @"CAST\s*\(\s*([^)]+?)\s+AS\s+BIT\s*\)", "($1)::boolean", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"CAST\s*\(\s*([^)]+?)\s+AS\s+NVARCHAR\s*\(\s*\d+\s*\)\s*\)", "$1", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"LTRIM\s*\(\s*RTRIM\s*\(([^)]+)\)\s*\)", "TRIM($1)", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"\[\s*([^\]]+)\s*\]", "\"$1\"", RegexOptions.IgnoreCase);

        s = Regex.Replace(
            s,
            @"OFFSET\s+@(\w+)\s+ROWS\s+FETCH\s+NEXT\s+@(\w+)\s+ROWS\s+ONLY",
            "OFFSET @$1 LIMIT @$2",
            RegexOptions.IgnoreCase);

        s = Regex.Replace(
            s,
            @"OUTPUT\s+INSERTED\.(\w+)",
            "RETURNING $1",
            RegexOptions.IgnoreCase);

        s = AdaptSelectTop(s);
        return s;
    }

    private static string AdaptSelectTop(string sql)
    {
        var m = Regex.Match(sql, @"^\s*SELECT\s+TOP\s*\(\s*([^)]+)\s*\)\s+",
            RegexOptions.IgnoreCase | RegexOptions.Singleline);
        if (!m.Success)
            return sql;

        var limitExpr = m.Groups[1].Value.Trim();
        var rest = sql[m.Length..].TrimEnd();
        var orderIdx = Regex.Match(rest, @"\s+ORDER\s+BY\s+", RegexOptions.IgnoreCase).Index;
        if (orderIdx > 0)
        {
            var beforeOrder = rest[..orderIdx].TrimEnd();
            var orderPart = rest[orderIdx..].TrimEnd();
            return $"SELECT {beforeOrder} {orderPart} LIMIT {limitExpr}";
        }

        return $"SELECT {rest} LIMIT {limitExpr}";
    }
}
