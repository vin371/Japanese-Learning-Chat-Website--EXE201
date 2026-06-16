/**
 * Mã JLPT hiện tại từ user (đồng bộ logic với Dashboard).
 * @param {object|null|undefined} user
 * @returns {'N5'|'N4'|'N3'|'N2'|'N1'}
 */
export function getJlptLevelCodeFromUser(user) {
  let levelCode = user?.levelCode || user?.level || null;
  const rawLevelId = user?.levelId ?? user?.LevelId ?? null;
  if (!levelCode && rawLevelId != null) {
    levelCode = levelIdToJlptCode(rawLevelId);
  }
  return String(levelCode || 'N5')
    .trim()
    .toUpperCase();
}

/** N5 = 5 (dễ) … N1 = 1 (khó) — dùng so sánh trạng thái thẻ JLPT */
export function jlptRank(code) {
  const m = { N5: 5, N4: 4, N3: 3, N2: 2, N1: 1 };
  return m[String(code || '').toUpperCase()] ?? 4;
}

/** JLPT mã → id trong bảng `levels` / API `levelId` */
export function jlptCodeToLevelId(code) {
  const m = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 };
  return m[String(code || 'N5').trim().toUpperCase()] ?? 1;
}

export function levelIdToJlptCode(levelId) {
  const m = { 1: 'N5', 2: 'N4', 3: 'N3', 4: 'N2', 5: 'N1' };
  const id = Number(levelId);
  return m[id] || 'N5';
}

/**
 * Cấp JLPT đang xem trên trang Học — ưu tiên `?jlpt=N4` trên URL, không thì theo hồ sơ.
 * @param {URLSearchParams|{ get: (k: string) => string | null }|null|undefined} searchParams
 */
export function resolveActiveLearnLevelCode(searchParams, user) {
  const fromUrl = searchParams?.get?.('jlpt') || searchParams?.get?.('level');
  const raw = String(fromUrl || '').trim().toUpperCase();
  if (/^N[1-5]$/.test(raw)) return raw;
  return getJlptLevelCodeFromUser(user);
}
