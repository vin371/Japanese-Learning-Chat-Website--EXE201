/** Client ID hợp lệ từ Vite env — tránh chuỗi rỗng / placeholder làm GIS render lỗi layout. */
export function getGoogleClientId() {
  const raw = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (raw == null || raw === '') return '';
  const id = String(raw).trim();
  if (!id || id === 'undefined' || /^your[-_]/i.test(id)) return '';
  if (!/^[\w-]+\.apps\.googleusercontent\.com$/i.test(id)) return '';
  return id;
}

export function isGoogleClientIdConfigured() {
  return getGoogleClientId().length > 0;
}
