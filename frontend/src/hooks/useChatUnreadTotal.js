import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { chatService } from '../services/chatService';
import {
  fetchMyRoomsCached,
  getCachedMyRoomsSnapshot,
  invalidateMyRoomsCache,
} from '../utils/chatInboxCache';

/** Đồng bộ với bump inbox trong chat (ChatShellContext). */
export const CHAT_INBOX_REVISED_EVENT = 'moji-chat-inbox-revised';

const BADGE_SS_KEY = 'yume:chatUnreadTotal';

function readStoredBadge() {
  try {
    const n = Number(sessionStorage.getItem(BADGE_SS_KEY));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeStoredBadge(total) {
  try {
    sessionStorage.setItem(BADGE_SS_KEY, String(Math.max(0, total)));
  } catch {
    /* ignore */
  }
}

function sumUnread(arr) {
  return arr.reduce(
    (acc, r) => acc + (Number(r.unreadCount ?? r.UnreadCount ?? 0) || 0),
    0
  );
}

export function notifyChatInboxRevised() {
  invalidateMyRoomsCache();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CHAT_INBOX_REVISED_EVENT));
  }
}

/**
 * Tổng unread trên tất cả phòng (GET /api/Chat/rooms) — dùng badge trên nav "Chat".
 * Không gọi API khi đang ở /chat — tránh chặn network lúc mở phòng.
 */
export function useChatUnreadTotal(enabled) {
  const { pathname } = useLocation();
  const onChatPage = pathname.startsWith('/chat');

  const [total, setTotal] = useState(() => {
    const rooms = getCachedMyRoomsSnapshot();
    return rooms.length ? sumUnread(rooms) : readStoredBadge();
  });
  const [rooms, setRooms] = useState(() => getCachedMyRoomsSnapshot());

  const refresh = useCallback(async () => {
    if (!enabled) {
      setTotal(0);
      setRooms([]);
      return;
    }
    try {
      const arr = await fetchMyRoomsCached(chatService, { limit: 20 });
      const sum = sumUnread(arr);
      setTotal(sum);
      setRooms(arr);
      writeStoredBadge(sum);
    } catch {
      /* giữ badge cũ */
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    if (onChatPage) {
      const snap = getCachedMyRoomsSnapshot();
      if (snap.length) setRooms(snap);
      return undefined;
    }

    const delay = 1200;
    const boot = window.setTimeout(() => {
      void refresh();
    }, delay);

    const onFocus = () => {
      if (!window.location.pathname.startsWith('/chat')) void refresh();
    };
    const onEvt = () => {
      if (!window.location.pathname.startsWith('/chat')) void refresh();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener(CHAT_INBOX_REVISED_EVENT, onEvt);
    const id = window.setInterval(() => {
      if (!window.location.pathname.startsWith('/chat')) void refresh();
    }, 90000);

    return () => {
      window.clearTimeout(boot);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener(CHAT_INBOX_REVISED_EVENT, onEvt);
      window.clearInterval(id);
    };
  }, [enabled, refresh, onChatPage]);

  return { total, rooms, refresh };
}
