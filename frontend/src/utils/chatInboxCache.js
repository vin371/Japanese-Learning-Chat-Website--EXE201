/** Cache ngắn GET /rooms — tránh gọi trùng khi mở chat (nav + sidebar + badge). */
let cachedRooms = null;
let cachedAt = 0;
const TTL_MS = 8000;
const SS_KEY = 'yume:inboxRooms';
const SS_TTL_MS = 5 * 60 * 1000;

function readSessionRooms() {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    const { list, at } = JSON.parse(raw);
    if (!Array.isArray(list) || !at || Date.now() - at > SS_TTL_MS) return null;
    return list;
  } catch {
    return null;
  }
}

function writeSessionRooms(list) {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify({ list, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function getCachedMyRoomsSnapshot() {
  const now = Date.now();
  if (cachedRooms && now - cachedAt < TTL_MS) return cachedRooms;
  return readSessionRooms() ?? [];
}

export function invalidateMyRoomsCache() {
  cachedRooms = null;
  cachedAt = 0;
  try {
    sessionStorage.removeItem(SS_KEY);
  } catch {
    /* ignore */
  }
}

/** Gộp phòng mới (vd. chat riêng vừa tạo) vào cache inbox — sidebar hiện ngay. */
export function upsertRoomInInboxCache(room) {
  if (!room) return;
  const rid = room.id ?? room.Id;
  if (rid == null) return;
  const now = Date.now();
  let list = [...getCachedMyRoomsSnapshot()];
  const idx = list.findIndex((r) => String(r.id ?? r.Id) === String(rid));
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...room };
  } else {
    list = [room, ...list];
  }
  cachedRooms = list;
  cachedAt = now;
  writeSessionRooms(list);
  return list;
}

export async function fetchMyRoomsCached(chatService, { limit = 25, force = false } = {}) {
  const now = Date.now();
  if (!force && cachedRooms && now - cachedAt < TTL_MS) {
    return cachedRooms;
  }
  if (!force) {
    const ss = readSessionRooms();
    if (ss) {
      cachedRooms = ss;
      cachedAt = now;
      return ss;
    }
  }
  const list = await chatService.getMyRooms({ limit });
  const arr = Array.isArray(list) ? list : [];
  cachedRooms = arr;
  cachedAt = now;
  writeSessionRooms(arr);
  return arr;
}
