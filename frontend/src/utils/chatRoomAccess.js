import { getJlptLevelCodeFromUser, jlptCodeToLevelId } from './learnLevelCode';

function safeArray(val) {
  return Array.isArray(val) ? val : [];
}

export function isChatStaff(user) {
  const role = String(user?.role ?? user?.Role ?? '').toLowerCase();
  return role === 'admin' || role === 'moderator';
}

export function userLevelId(user) {
  const raw = user?.levelId ?? user?.LevelId;
  if (raw != null && Number.isFinite(Number(raw))) return Number(raw);
  return jlptCodeToLevelId(getJlptLevelCodeFromUser(user));
}

export function isGeneralPublicRoom(room) {
  const type = String(room?.type ?? room?.Type ?? '').toLowerCase();
  const slug = String(room?.slug ?? room?.Slug ?? '').toLowerCase();
  return type === 'public' && (slug === 'general' || slug === 'common');
}

/** Học viên: Phòng chung + phòng level đúng JLPT. Admin/mod: mọi phòng public/level. */
export function canAccessPublicRoom(room, user) {
  if (!room) return false;
  if (isChatStaff(user)) return true;

  const type = String(room?.type ?? room?.Type ?? '').toLowerCase();
  if (type === 'private' || type === 'group') return true;
  if (isGeneralPublicRoom(room)) return true;

  if (type === 'level') {
    const roomLvl = Number(room?.levelId ?? room?.LevelId);
    const myLvl = userLevelId(user);
    return Number.isFinite(roomLvl) && roomLvl === myLvl;
  }

  return false;
}

export function canShowRoomInInbox(room, user) {
  const type = String(room?.type ?? room?.Type ?? '').toLowerCase();
  if (type === 'private' || type === 'group') return true;
  return canAccessPublicRoom(room, user);
}

export function filterPublicRoomsForUser(rooms, user) {
  return safeArray(rooms).filter((r) => canAccessPublicRoom(r, user));
}

const LEVEL_KIND_BY_ID = { 1: 'n5', 2: 'n4', 3: 'n3' };

/** Phím tắt sidebar — học viên: phòng đúng JLPT + Phòng chung; staff: tất cả. */
export function allowedShortcutKinds(user) {
  if (isChatStaff(user)) return ['n5', 'n4', 'n3', 'general'];
  const levelKind = LEVEL_KIND_BY_ID[userLevelId(user)];
  if (levelKind) return [levelKind, 'general'];
  return ['general'];
}

export const GENERAL_ROOM_CACHE_KEY = 'yume:generalRoomId';
export const SHORTCUT_ROOMS_CACHE_KEY = 'yume:shortcutRoomIds';

/** Seed DB — id phòng JLPT / chung (fallback khi API chưa kịp load). */
export const DEFAULT_SHORTCUT_ROOM_IDS = {
  n5: 1,
  n4: 2,
  n3: 3,
  general: 4,
};

export function getDefaultShortcutRoomId(kind) {
  return DEFAULT_SHORTCUT_ROOM_IDS[kind] ?? null;
}

export function getCachedShortcutRoomId(kind) {
  if (!kind) return null;
  try {
    const raw = sessionStorage.getItem(SHORTCUT_ROOMS_CACHE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    const n = Number(map?.[kind]);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function cacheShortcutRoomId(kind, roomId) {
  if (!kind || roomId == null) return;
  try {
    const raw = sessionStorage.getItem(SHORTCUT_ROOMS_CACHE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[kind] = Number(roomId) || roomId;
    sessionStorage.setItem(SHORTCUT_ROOMS_CACHE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function cacheShortcutRoomsFromList(rooms) {
  for (const r of safeArray(rooms)) {
    const kind = shortcutKindForRoom(r);
    const id = r?.id ?? r?.Id;
    if (kind && id != null) cacheShortcutRoomId(kind, id);
    if (kind === 'general') cacheGeneralRoomId(id);
  }
}

/** Id phòng cho sidebar — ưu tiên inbox, cache, seed DB. */
export function resolveShortcutRoomId(kind, shortcutRow) {
  if (shortcutRow?.id != null && !String(shortcutRow.id).startsWith('demo-')) {
    return shortcutRow.id;
  }
  const cached = getCachedShortcutRoomId(kind);
  if (cached) return cached;
  return getDefaultShortcutRoomId(kind);
}

/** Seed Supabase — Phòng chung (slug `general`). Dùng khi chưa cache để vào chat ngay. */
export const DEFAULT_GENERAL_ROOM_ID = 4;

export function getDefaultChatRoomPath() {
  const id = getCachedGeneralRoomId() ?? DEFAULT_GENERAL_ROOM_ID;
  return `/chat/room/${id}`;
}

export function getCachedGeneralRoomId() {
  try {
    const n = Number(sessionStorage.getItem(GENERAL_ROOM_CACHE_KEY));
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function cacheGeneralRoomId(roomId) {
  if (roomId == null) return;
  try {
    sessionStorage.setItem(GENERAL_ROOM_CACHE_KEY, String(roomId));
  } catch {
    /* ignore */
  }
}

/** Tìm phòng chung từ danh sách public đã lọc. */
export function pickGeneralRoom(rooms, user) {
  return findRoomByShortcutKind(filterPublicRoomsForUser(rooms, user), 'general');
}

export function shortcutKindForRoom(room) {
  const slug = String(room?.slug ?? room?.Slug ?? '').toLowerCase();
  const type = String(room?.type ?? room?.Type ?? '').toLowerCase();

  if (slug === 'general' || slug === 'common') return 'general';
  if (slug === 'room-n5' || slug === 'level-n5') return 'n5';
  if (slug === 'room-n4' || slug === 'level-n4') return 'n4';
  if (slug === 'room-n3' || slug === 'level-n3') return 'n3';

  if (type === 'level') {
    const lid = Number(room?.levelId ?? room?.LevelId);
    return LEVEL_KIND_BY_ID[lid] || null;
  }

  const name = String(room?.name ?? room?.Name ?? '');
  if (/phòng\s*chung|^\s*chung\s*$|cộng\s*đồng/i.test(name)) return 'general';
  if (/\bn5\b/i.test(name)) return 'n5';
  if (/\bn4\b/i.test(name)) return 'n4';
  if (/\bn3\b/i.test(name)) return 'n3';
  return null;
}

const SLUG_HINTS = {
  general: ['general', 'common'],
  n5: ['room-n5', 'level-n5'],
  n4: ['room-n4', 'level-n4'],
  n3: ['room-n3', 'level-n3'],
};

/** Tìm phòng joinable theo phím tắt (slug/name). */
export function findRoomByShortcutKind(rooms, kind) {
  const list = safeArray(rooms);
  const wantSlugs = SLUG_HINTS[kind];

  if (wantSlugs) {
    const bySlug = list.find((r) => {
      const slug = String(r.slug ?? r.Slug ?? '').toLowerCase();
      return wantSlugs.some((s) => slug === s);
    });
    if (bySlug) return bySlug;
  }

  if (kind === 'general') {
    return list.find((r) => /phòng\s*chung|^\s*chung\s*$|cộng\s*đồng/i.test(String(r.name ?? r.Name ?? '')));
  }

  if (kind === 'n5' || kind === 'n4' || kind === 'n3') {
    const re = new RegExp(`\\b${kind}\\b`, 'i');
    return list.find((r) => re.test(String(r.name ?? r.Name ?? '')));
  }

  return null;
}

export const SHORTCUT_UI = {
  n5: { badge: 'N5', label: 'Phòng N5' },
  n4: { badge: 'N4', label: 'Phòng N4' },
  n3: { badge: 'N3', label: 'Phòng N3' },
  general: { badge: null, label: 'Phòng chung' },
};
