/** Cache bootstrap phòng (room + messages) — hiện ngay như Facebook, fetch nền sau. */
const PREFIX = 'yume:chatRoom:';
const TTL_MS = 10 * 60 * 1000;

function key(roomId) {
  return `${PREFIX}${roomId}`;
}

export function readChatRoomCache(roomId) {
  if (roomId == null) return null;
  try {
    const raw = sessionStorage.getItem(key(roomId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.savedAt || Date.now() - data.savedAt > TTL_MS) return null;
    if (!data.room || !Array.isArray(data.messages)) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeChatRoomCache(roomId, { room, messages, hasMore, nextCursor, asMember }) {
  if (roomId == null || !room) return;
  try {
    sessionStorage.setItem(
      key(roomId),
      JSON.stringify({
        room,
        messages: Array.isArray(messages) ? messages.slice(-40) : [],
        hasMore: Boolean(hasMore),
        nextCursor: nextCursor ?? null,
        asMember: Boolean(asMember),
        savedAt: Date.now(),
      })
    );
  } catch {
    /* quota — bỏ qua */
  }
}

export function patchChatRoomCacheMessages(roomId, messages) {
  const cached = readChatRoomCache(roomId);
  if (!cached) return;
  writeChatRoomCache(roomId, {
    room: cached.room,
    messages,
    hasMore: cached.hasMore,
    nextCursor: cached.nextCursor,
    asMember: cached.asMember,
  });
}
