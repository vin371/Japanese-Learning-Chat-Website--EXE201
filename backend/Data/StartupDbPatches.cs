using Npgsql;

namespace backend.Data;

/// <summary>Patch idempotent khi API khởi động — tránh lỗi 23502 user_inventory.created_at trên Supabase.</summary>
public static class StartupDbPatches
{
    public static async Task ApplyUserInventoryTimestampDefaultsAsync(
        string connectionString,
        ILogger log,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            DO $$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'user_inventory'
                  AND column_name = 'created_at'
              ) THEN
                ALTER TABLE user_inventory ALTER COLUMN created_at SET DEFAULT NOW();
                ALTER TABLE user_inventory ALTER COLUMN updated_at SET DEFAULT NOW();
              END IF;
            END $$;
            """;

        try
        {
            await using var conn = new NpgsqlConnection(connectionString);
            await conn.OpenAsync(cancellationToken);
            await using var cmd = new NpgsqlCommand(sql, conn);
            await cmd.ExecuteNonQueryAsync(cancellationToken);
            log.LogInformation("StartupDbPatches: user_inventory created_at/updated_at DEFAULT NOW() applied.");
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "StartupDbPatches: không patch được user_inventory (bỏ qua, không chặn API).");
        }
    }
}
