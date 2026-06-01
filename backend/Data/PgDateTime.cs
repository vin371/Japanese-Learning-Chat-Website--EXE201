using System.Data;

namespace backend.Data;

/// <summary>Chuẩn hóa DateTime cho PostgreSQL <c>timestamp without time zone</c> (Supabase).</summary>
public static class PgDateTime
{
    public static DateTime ToUnspecifiedUtc(DateTime value)
    {
        var utc = value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
        return DateTime.SpecifyKind(utc, DateTimeKind.Unspecified);
    }

    public static void AddTimestampParameter(this IDbCommand cmd, string name, DateTime value)
    {
        var p = cmd.CreateParameter();
        p.ParameterName = name;
        p.Value = ToUnspecifiedUtc(value);
        p.DbType = DbType.DateTime2;
        cmd.Parameters.Add(p);
    }
}
