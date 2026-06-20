import { chatService } from '../../services/chatService';

export const CHAT_INITIAL_MSG_LIMIT = 25;

async function resolveRoomDto(roomId) {
  try {
    const room = await chatService.getRoom(roomId);
    return { room, asMember: true };
  } catch (err) {
    const st = err?.response?.status;
    if (st === 404) {
      const room = await chatService.getPublicRoom(roomId).catch(() => null);
      return { room, asMember: false };
    }
    throw err;
  }
}

/** Room + messages song song — tối thiểu round-trip. */
export async function loadChatRoomBootstrap(roomId, { msgLimit = CHAT_INITIAL_MSG_LIMIT } = {}) {
  const [roomResult, msgRes] = await Promise.all([
    resolveRoomDto(roomId),
    chatService.getRoomMessages(roomId, { limit: msgLimit }),
  ]);

  let { room, asMember } = roomResult;
  if (!room) {
    return { room: null, asMember: false, msgRes: null };
  }

  let member = asMember;
  const rawItems = msgRes?.items ?? msgRes?.Items ?? [];
  if (!member && Array.isArray(rawItems) && rawItems.length > 0) {
    member = true;
  }

  if (!member) {
    const type = String(room.type ?? room.Type ?? '').toLowerCase();
    if (type === 'public' || type === 'level') {
      try {
        await chatService.joinRoom(roomId);
        member = true;
        room = (await chatService.getRoom(roomId).catch(() => room)) ?? room;
      } catch {
        /* banner tham gia */
      }
    }
  }

  return { room, asMember: member, msgRes };
}
