using System.Data;
using Dapper;

namespace backend.Data;

public static class PgDapper
{
    public static Task<IEnumerable<T>> PgQueryAsync<T>(
        this IDbConnection connection, string sql, object? param = null, IDbTransaction? transaction = null,
        int? commandTimeout = null, CommandType? commandType = null) =>
        connection.QueryAsync<T>(PostgresSqlDialect.Adapt(sql), param, transaction, commandTimeout, commandType);

    public static Task<T> PgQueryFirstAsync<T>(
        this IDbConnection connection, string sql, object? param = null, IDbTransaction? transaction = null,
        int? commandTimeout = null, CommandType? commandType = null) =>
        connection.QueryFirstAsync<T>(PostgresSqlDialect.Adapt(sql), param, transaction, commandTimeout, commandType);

    public static Task<T?> PgQueryFirstOrDefaultAsync<T>(
        this IDbConnection connection, string sql, object? param = null, IDbTransaction? transaction = null,
        int? commandTimeout = null, CommandType? commandType = null) =>
        connection.QueryFirstOrDefaultAsync<T>(PostgresSqlDialect.Adapt(sql), param, transaction, commandTimeout, commandType);

    public static Task<int> PgExecuteAsync(
        this IDbConnection connection, string sql, object? param = null, IDbTransaction? transaction = null,
        int? commandTimeout = null, CommandType? commandType = null) =>
        connection.ExecuteAsync(PostgresSqlDialect.Adapt(sql), param, transaction, commandTimeout, commandType);

    public static Task<T> PgExecuteScalarAsync<T>(
        this IDbConnection connection, string sql, object? param = null, IDbTransaction? transaction = null,
        int? commandTimeout = null, CommandType? commandType = null) =>
        connection.ExecuteScalarAsync<T>(PostgresSqlDialect.Adapt(sql), param, transaction, commandTimeout, commandType);
}
