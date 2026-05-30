/** Web client ID công khai (trùng frontend/.env.example) — fallback khi Vercel chưa set env. */
const DEFAULT_GOOGLE_CLIENT_ID =
  '638842872923-2d5sru8t06dkvh7k9qmur0m5o4o6nf0q.apps.googleusercontent.com';

function normalizeGoogleClientId(raw) {
  if (raw == null || raw === '') return '';
  const id = String(raw).trim();
  if (!id || id === 'undefined' || /^your[-_]/i.test(id)) return '';
  if (!/^[\w-]+\.apps\.googleusercontent\.com$/i.test(id)) return '';
  return id;
}

/** Client ID hợp lệ từ Vite env — tránh chuỗi rỗng / placeholder làm GIS render lỗi layout. */
export function getGoogleClientId() {
  const fromEnv = normalizeGoogleClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  return fromEnv || DEFAULT_GOOGLE_CLIENT_ID;
}

export function isGoogleClientIdConfigured() {
  return getGoogleClientId().length > 0;
}
