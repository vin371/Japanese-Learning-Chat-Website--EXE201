using Npgsql;

namespace backend.Data;

public static class DbExceptionHelper
{
    /// <summary>SQL Server 208 = invalid object name.</summary>
    public static bool IsMissingRelation(Exception ex) =>
        ex switch
        {
            PostgresException pe => pe.SqlState == PostgresErrorCodes.UndefinedTable,
            _ => FindPostgres(ex)?.SqlState == PostgresErrorCodes.UndefinedTable
        };

    public static bool IsMissingColumn(Exception ex) =>
        ex switch
        {
            PostgresException pe => pe.SqlState == PostgresErrorCodes.UndefinedColumn,
            _ => FindPostgres(ex)?.SqlState == PostgresErrorCodes.UndefinedColumn
        };

    private static PostgresException? FindPostgres(Exception ex)
    {
        for (var e = ex; e != null; e = e.InnerException)
        {
            if (e is PostgresException pe)
                return pe;
        }
        return null;
    }
}
