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

        s = AdaptIsActiveBoolean(s);
        s = AdaptInsertReturning(s);
        s = AdaptSelectTop(s);
        return s;
    }

    /// <summary>PostgreSQL: is_active là boolean — không dùng COALESCE(..., 1) = 1.</summary>
    private static string AdaptIsActiveBoolean(string sql)
    {
        sql = Regex.Replace(
            sql,
            @"COALESCE\((\w+\.)?is_active,\s*1\)\s*=\s*1",
            "COALESCE($1is_active, true)",
            RegexOptions.IgnoreCase);
        sql = Regex.Replace(sql, @"\bis_active\s*=\s*0\b", "is_active = false", RegexOptions.IgnoreCase);
        sql = Regex.Replace(sql, @"\bis_active\s*=\s*1\b", "is_active = true", RegexOptions.IgnoreCase);
        return sql;
    }

    /// <summary>SQL Server OUTPUT INSERTED.col → PostgreSQL VALUES ... RETURNING col (đúng vị trí cú pháp).</summary>
    private static string AdaptInsertReturning(string sql)
    {
        return Regex.Replace(
            sql,
            @"(INSERT\s+INTO\s+[\s\S]+?)\s+OUTPUT\s+INSERTED\.(\w+)\s+(VALUES\s+[\s\S]+)",
            "$1 $3 RETURNING $2",
            RegexOptions.IgnoreCase);
    }

    private static string AdaptSelectTop(string sql)
    {
        // TOP (expr) — e.g. TOP (@n)
        var m = Regex.Match(sql, @"^\s*SELECT\s+TOP\s*\(\s*([^)]+)\s*\)\s+",
            RegexOptions.IgnoreCase | RegexOptions.Singleline);
        if (m.Success)
            return AdaptTopRest(sql, m.Length, m.Groups[1].Value.Trim());

        // TOP <số> — e.g. TOP 1 (PaymentService, GameService)
        m = Regex.Match(sql, @"^\s*SELECT\s+TOP\s+(\d+)\s+",
            RegexOptions.IgnoreCase | RegexOptions.Singleline);
        if (m.Success)
            return AdaptTopRest(sql, m.Length, m.Groups[1].Value.Trim());

        return sql;
    }

    private static string AdaptTopRest(string sql, int restStart, string limitExpr)
    {
        var rest = sql[restStart..].TrimEnd();
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
