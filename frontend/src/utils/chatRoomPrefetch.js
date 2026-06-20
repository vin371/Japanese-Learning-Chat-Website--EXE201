import { loadChatRoomBootstrap, CHAT_INITIAL_MSG_LIMIT } from '../pages/Chat/chatRoomLoad';
import { readChatRoomCache, writeChatRoomCache } from './chatRoomSessionCache';
import { DEFAULT_GENERAL_ROOM_ID, getCachedGeneralRoomId } from './chatRoomAccess';

const inflight = new Map();
const FRESH_MS = 45 * 1000;

function parseMsgRes(msgRes) {
  const raw = msgRes?.items ?? msgRes?.Items ?? [];
  const list = Array.isArray(raw) ? raw : [];
  const hasMore = msgRes?.hasMore ?? msgRes?.HasMore ?? false;
  const nextCursor = msgRes?.nextCursor ?? msgRes?.NextCursor ?? null;
  return {
    items: list,
    hasMore: Boolean(hasMore),
    nextCursor: nextCursor != null && nextCursor !== '' ? String(nextCursor) : null,
  };
}

/** Tải trước phòng — dedupe request, ghi sessionStorage. */
export function prefetchChatRoom(roomId, { msgLimit = CHAT_INITIAL_MSG_LIMIT, force = false } = {}) {
  if (roomId == null || roomId === '') return Promise.resolve(null);
  const id = String(roomId);

  if (!force) {
    const cached = readChatRoomCache(id);
    if (cached && Date.now() - cached.savedAt < FRESH_MS) {
      return Promise.resolve(cached);
    }
  }

  if (inflight.has(id)) return inflight.get(id);

  const p = loadChatRoomBootstrap(id, { msgLimit })
    .then((result) => {
      if (result?.room && result.msgRes) {
        const parsed = parseMsgRes(result.msgRes);
        writeChatRoomCache(id, {
          room: result.room,
          messages: parsed.items,
          hasMore: parsed.hasMore,
          nextCursor: parsed.nextCursor,
          asMember: result.asMember,
        });
      }
      return result;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(id);
    });

  inflight.set(id, p);
  return p;
}

/** Prefetch phòng mặc định (Phòng chung) khi app rảnh. */
export function prefetchDefaultChatRoom() {
  const id = getCachedGeneralRoomId() ?? DEFAULT_GENERAL_ROOM_ID;
  return prefetchChatRoom(id);
}
