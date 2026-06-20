import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const secrets = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'appsettings.Secrets.json'), 'utf8'),
);

function parseConn(s) {
  const parts = {};
  for (const seg of s.split(';')) {
    const t = seg.trim();
    if (!t) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    parts[t.slice(0, i).trim().toLowerCase()] = t.slice(i + 1).trim();
  }
  return {
    host: parts.host,
    port: Number(parts.port || 5432),
    database: parts.database,
    user: parts.username,
    password: parts.password,
    ssl: { rejectUnauthorized: false },
  };
}

const db = new pg.Client(parseConn(secrets.ConnectionStrings.DefaultConnection));

async function main() {
  await db.connect();
  const before = await db.query(`SELECT id, slug, name FROM games WHERE slug = 'daily-challenge'`);
  console.log('Before delete games:', before.rows);

  await db.query('BEGIN');
  try {
    await db.query(`UPDATE game_sessions SET daily_challenge_id = NULL WHERE daily_challenge_id IS NOT NULL`);
    const udc = await db.query(`DELETE FROM user_daily_challenges`);
    const dc = await db.query(`DELETE FROM daily_challenges`);
    const g = await db.query(`DELETE FROM games WHERE slug = 'daily-challenge' RETURNING id, slug, name`);
    await db.query('COMMIT');
    console.log('Deleted user_daily_challenges:', udc.rowCount);
    console.log('Deleted daily_challenges:', dc.rowCount);
    console.log('Deleted games:', g.rows);
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }

  const after = await db.query(`SELECT slug FROM games WHERE slug = 'daily-challenge'`);
  console.log('After (should be 0):', after.rowCount);
  await db.end();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
