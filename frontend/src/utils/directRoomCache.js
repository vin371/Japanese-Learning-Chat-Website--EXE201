/** Cache phòng 1–1 theo peerUserId — mở chat riêng nhanh như phòng chung. */
const SS_PREFIX = 'yume:directRoom:';
const TTL_MS = 30 * 60 * 1000;
const peerInflight = new Map();

export function getCachedDirectRoomId(peerUserId) {
  if (peerUserId == null) return null;
  try {
    const raw = sessionStorage.getItem(`${SS_PREFIX}${peerUserId}`);
    if (!raw) return null;
    const { roomId, at } = JSON.parse(raw);
    if (!roomId || !at || Date.now() - at > TTL_MS) return null;
    return roomId;
  } catch {
    return null;
  }
}

export function cacheDirectRoomId(peerUserId, roomId) {
  if (peerUserId == null || roomId == null) return;
  try {
    sessionStorage.setItem(
      `${SS_PREFIX}${peerUserId}`,
      JSON.stringify({ roomId: Number(roomId) || roomId, at: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

/** POST /direct — dedupe request đồng thời. */
export async function resolveDirectRoom(chatService, peerUserId) {
  if (peerUserId == null) return null;
  const key = String(peerUserId);
  if (peerInflight.has(key)) return peerInflight.get(key);

  const p = chatService
    .getOrCreateDirect(peerUserId)
    .then((room) => {
      const rid = room?.id ?? room?.Id;
      if (rid != null) cacheDirectRoomId(peerUserId, rid);
      return room;
    })
    .finally(() => {
      peerInflight.delete(key);
    });

  peerInflight.set(key, p);
  return p;
}
