import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { chatService } from '../../services/chatService';
import { startChatRoomConnection } from '../../services/chatRealtime';
import { loadChatRoomBootstrap, CHAT_INITIAL_MSG_LIMIT } from './chatRoomLoad';
import { readChatRoomCache, writeChatRoomCache } from '../../utils/chatRoomSessionCache';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentUserId } from '../../hooks/useCurrentUserId';
import { YumeChatLayout } from '../../components/chat/YumeChatLayout';
import { useChatShell } from '../../hooks/useChatShell';
import { notifyChatInboxRevised } from '../../hooks/useChatUnreadTotal';
import { Smile, ImagePlus, Paperclip, AtSign, Sparkles, Share2, Send, ChevronDown } from 'lucide-react';

function formatRoomDisplayName(name) {
  const s = String(name ?? '').trim();
  if (!s) return 'Phòng chat';
  return s
    .replace(/\s+/g, ' ')
    .replace(/^phòngchung$/i, 'Phòng chung')
    .replace(/^phòng\s*n5$/i, 'Phòng N5')
    .replace(/^phòng\s*n4$/i, 'Phòng N4')
    .replace(/^phòng\s*n3$/i, 'Phòng N3');
}

function roomSubtitleParts({ isDirectRoom, peerSocialOnline, roomTypeNorm, onlineCount }) {
  if (isDirectRoom) {
    if (peerSocialOnline === true) return ['Đang hoạt động', 'Tin nhắn riêng'];
    if (peerSocialOnline === false) return ['Offline', 'Tin nhắn riêng'];
    return ['Tin nhắn riêng'];
  }
  const parts = [roomTypeNorm ? roomTypeLabelVi(roomTypeNorm) : 'Phòng chat', 'Đang tham gia'];
  if (onlineCount != null && Number.isFinite(Number(onlineCount))) {
    parts.push(`${Number(onlineCount)} đang online`);
  }
  return parts;
}

function roomTypeLabelVi(type) {
  switch (String(type || '').toLowerCase()) {
    case 'public':
      return 'Công khai';
    case 'level':
      return 'Theo cấp độ';
    case 'group':
      return 'Nhóm chat';
    case 'private':
      return 'Tin nhắn riêng';
    default:
      return 'Phòng chat';
  }
}

function toNum(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * ID người gửi — backend/SignalR có thể dùng tên khác nhau; không gộp nhầm sang current user.
 * Một số payload còn bọc user/sender trong object.
 */
function extractSenderUserId(m) {
  if (!m || typeof m !== 'object') return null;
  const top = toNum(
    m.userId ??
    m.UserId ??
    m.senderId ??
    m.SenderId ??
    m.senderUserId ??
    m.SenderUserId ??
    m.fromUserId ??
    m.FromUserId ??
    m.authorUserId ??
    m.AuthorUserId
  );
  if (top != null) return top;
  const nested = m.user ?? m.User ?? m.sender ?? m.Sender;
  if (nested && typeof nested === 'object') {
    return toNum(
      nested.id ??
      nested.Id ??
      nested.userId ??
      nested.UserId ??
      nested.senderId ??
      nested.SenderId
    );
  }
  return null;
}

function idsMatch(a, b) {
  if (a == null || b == null) return false;
  return String(Number(a)) === String(Number(b));
}

/** API có thể trả PascalCase (UserId, Id) — gom về id/userId số để so isOwn & key ổn định. */
function normalizeMessageShape(m) {
  if (!m || typeof m !== 'object') return m;
  const id = m.id ?? m.Id;
  const userId = extractSenderUserId(m);
  const rx = m.reactions ?? m.Reactions;
  return {
    ...m,
    ...(id != null ? { id } : {}),
    ...(userId != null ? { userId } : {}),
    content: m.content ?? m.Content ?? '',
    type: m.type ?? m.Type ?? 'text',
    createdAt: m.createdAt ?? m.CreatedAt,
    replyToId: m.replyToId ?? m.ReplyToId,
    isPinned: Boolean(m.isPinned ?? m.IsPinned),
    senderDisplayName: m.senderDisplayName ?? m.SenderDisplayName,
    senderUsername: m.senderUsername ?? m.SenderUsername,
    senderAvatarUrl: m.senderAvatarUrl ?? m.SenderAvatarUrl,
    reactions: Array.isArray(rx) ? rx : [],
  };
}

/** Trùng id (REST + SignalR / double fetch) gây duplicate React key — giữ bản đầu theo thứ tự. */
function dedupeMessagesById(list) {
  const seen = new Set();
  const out = [];
  for (const m of list) {
    const id = m?.id ?? m?.Id;
    const isTemp = id == null || String(id).startsWith('tmp-');
    if (isTemp) {
      out.push(m);
      continue;
    }
    const k = String(id);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(m);
  }
  return out;
}

/** GET /rooms/{id}/messages — PagedMessagesResponse (Items, HasMore, NextCursor). */
function parsePagedMessagesResponse(res) {
  const raw = res?.items ?? res?.Items ?? [];
  const list = Array.isArray(raw) ? raw : [];
  const hasMore = res?.hasMore ?? res?.HasMore ?? false;
  const nextCursor = res?.nextCursor ?? res?.NextCursor ?? null;
  return {
    items: dedupeMessagesById(list.map(normalizeMessageShape)),
    hasMore: Boolean(hasMore),
    nextCursor: nextCursor != null && nextCursor !== '' ? String(nextCursor) : null,
  };
}

/** Cuộn vùng feed tới đáy — đáng tin cậy hơn scrollIntoView lên sentinel trong flex. */
function scrollFeedToEnd(feedEl, { smooth = false } = {}) {
  if (!feedEl) return;
  const go = () => {
    feedEl.scrollTop = feedEl.scrollHeight;
    if (smooth) {
      feedEl.scrollTo({ top: feedEl.scrollHeight, behavior: 'smooth' });
    }
  };
  // Đợi DOM render xong rồi cuộn
  requestAnimationFrame(() => {
    go();
    // Lần 2 phòng trường hợp ảnh/lazy load thay đổi scrollHeight
    requestAnimationFrame(go);
  });
}

/** Nhãn ngày giữa các tin (giống mẫu Zalo). */
function formatDateSeparator(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function shouldShowDateSeparator(prevIso, curIso) {
  if (!curIso) return false;
  if (!prevIso) return true;
  const a = new Date(prevIso);
  const b = new Date(curIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return true;
  return (
    a.getFullYear() !== b.getFullYear() || a.getMonth() !== b.getMonth() || a.getDate() !== b.getDate()
  );
}

/** Hiện mốc giờ giữa cụm tin (cách > 5 phút) — như MessageItem mẫu. */
function shouldShowTimeCluster(prevIso, curIso) {
  if (!curIso) return false;
  if (!prevIso) return true;
  const a = new Date(prevIso).getTime();
  const b = new Date(curIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return true;
  return b - a > 300000;
}

function formatTimeShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/** Tin tối ưu (_opt) chưa có id từ server — gán theo myId để luôn căn phải đúng mọi tài khoản. */
function messageSenderId(m, myId) {
  if (!m || typeof m !== 'object') return null;
  if (m._opt && myId != null) return myId;
  return extractSenderUserId(m);
}

function messageSenderName(m) {
  return (
    m.senderDisplayName ||
    m.SenderDisplayName ||
    m.senderUsername ||
    m.SenderUsername ||
    'Người gửi'
  );
}

/** Nhóm: tên hiển thị + @username — không gắn với username cụ thể (member, staff1, …). */
function messageSenderLabel(m) {
  const dn = m.senderDisplayName || m.SenderDisplayName || '';
  const un = m.senderUsername || m.SenderUsername || '';
  if (dn && un) return `${dn} (@${un})`;
  return dn || (un ? `@${un}` : 'Người gửi');
}

function getLatestPersistedMessageId(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const item = list[i];
    const id = item?.id ?? item?.Id;
    if (id == null) continue;
    const sid = String(id);
    if (sid.startsWith('tmp-')) continue;
    return id;
  }
  return null;
}

/** Chat 1–1: nếu API không gửi tên người gửi, dùng peer từ phòng để avatar vẫn đúng người. */
function peerAvatarLetter(m, isDirectRoom, peerUser) {
  const fromMsg = messageSenderName(m);
  const hasNameFromApi =
    !!(m.senderDisplayName || m.SenderDisplayName || m.senderUsername || m.SenderUsername);
  if (!isDirectRoom || !peerUser) {
    return fromMsg.slice(0, 1).toUpperCase();
  }
  if (hasNameFromApi) {
    return fromMsg.slice(0, 1).toUpperCase();
  }
  const pn =
    peerUser.displayName ||
    peerUser.DisplayName ||
    peerUser.username ||
    peerUser.Username ||
    '?';
  return pn.slice(0, 1).toUpperCase();
}

/** Phản ứng — khớp gợi ý backend (ReactionBody). */
const REACTION_PRESETS = [
  { id: 'like', label: '👍' },
  { id: 'love', label: '❤️' },
  { id: 'haha', label: '😂' },
  { id: 'wow', label: '😮' },
  { id: 'sad', label: '😢' },
  { id: 'angry', label: '😠' },
];

const COMPOSER_QUICK_EMOJI = ['😀', '😂', '🤣', '❤️', '👍', '👏', '🎉', '🔥', '😮', '😢', '🙏', '✨', '💪', '📚'];

const MAX_CHAT_IMAGE_BYTES = 1_200_000;
const MAX_CHAT_FILE_BYTES = 500_000;

const ACHIEVEMENT_STICKERS = [
  { key: 'n5_pass', emoji: '🌸', title: 'Hoàn thành N5', subtitle: 'Thành tích học tập' },
  { key: 'streak7', emoji: '🔥', title: 'Streak 7 ngày', subtitle: 'Luyện tập đều đặn' },
  { key: 'game_win', emoji: '🏆', title: 'Chiến thắng minigame', subtitle: 'Sticker độc quyền từ game' },
];

function findMessageById(list, mid) {
  if (mid == null) return null;
  return list.find((x) => String(x.id ?? x.Id) === String(mid)) ?? null;
}

function reactionLabel(emojiId) {
  const p = REACTION_PRESETS.find((r) => r.id === emojiId);
  return p ? p.label : emojiId;
}

function MessageBody({ m }) {
  const type = String(m.type || m.Type || 'text').toLowerCase();
  const raw = m.content ?? m.Content ?? '';
  if (type === 'image' && (raw.startsWith('data:image/') || raw.startsWith('http'))) {
    return (
      <span className="block -m-4 mb-2 overflow-hidden rounded-t-[14px]">
        <img src={raw} alt="" className="max-w-full h-auto object-cover max-h-[300px]" loading="lazy" />
      </span>
    );
  }
  if (type === 'file') {
    let fileObj = null;
    try {
      fileObj = JSON.parse(raw);
    } catch {
      return <span className="block break-words whitespace-pre-wrap">{raw}</span>;
    }
    const o = fileObj;
    return (
      <span className="flex items-center gap-2 text-[0.95rem]">
        📎 <strong className="font-semibold">{o?.name || 'Tệp đính kèm'}</strong>
        {o?.size != null ? (
          <span className="opacity-70 text-xs"> ({Math.round(o.size / 1024)} KB)</span>
        ) : null}
      </span>
    );
  }
  if (type === 'sticker' || type === 'achievement_share' || type === 'lesson_share') {
    let cardObj = null;
    try {
      cardObj = JSON.parse(raw);
    } catch {
      return <span className="block break-words whitespace-pre-wrap">{raw}</span>;
    }
    const o = cardObj;
    const sub = o?.subtitle || o?.courseName;
    return (
      <span className="flex items-center gap-3 bg-black/10 dark:bg-white/10 p-2.5 rounded-xl border border-black/5 dark:border-white/5">
        <span className="text-2xl" aria-hidden>
          {o?.emoji || '🏅'}
        </span>
        <span className="flex flex-col min-w-0">
          <strong className="font-bold text-sm truncate">{o?.title || o?.label || 'Chia sẻ'}</strong>
          {sub ? <small className="text-xs opacity-80 truncate">{sub}</small> : null}
        </span>
      </span>
    );
  }
  return <span className="block break-words whitespace-pre-wrap">{raw}</span>;
}

function MessageReplyQuote({ parent, isOwn }) {
  if (!parent) return null;
  const prevText = (parent.content ?? parent.Content ?? '').slice(0, 120);
  const who = messageSenderLabel(parent);
  return (
    <div className={`flex items-stretch gap-2 mb-2 pl-2 border-l-2 text-[0.8rem] rounded-r-md py-0.5 opacity-90 ${isOwn ? 'border-white/50 bg-white/10 text-white' : 'border-rose-500 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
      <span className="flex flex-col min-w-0">
        <span className="font-bold truncate opacity-80 mb-0.5">{who}</span>
        <span className="truncate opacity-90">{prevText || 'Tin nhắn'}</span>
      </span>
    </div>
  );
}

function pinnedBannerSnippet(m) {
  if (!m) return '';
  const t = String(m.type || m.Type || 'text').toLowerCase();
  const raw = m.content || m.Content || '';
  if (t === 'text') return raw.slice(0, 120);
  if (t === 'image') return '[Ảnh]';
  if (t === 'file') {
    try {
      const o = JSON.parse(raw);
      return o.name || '[Tệp đính kèm]';
    } catch {
      return raw.slice(0, 80);
    }
  }
  try {
    const o = JSON.parse(raw);
    return o.title || o.label || o.courseName || '[Chia sẻ]';
  } catch {
    return raw.slice(0, 80);
  }
}

/** Nút phản ứng góc dưới bong bóng + popover dạng viên khi hover. */
function MessageReactionDock({ disabled, busy, onPick }) {
  return (
    <div className="group/dock relative flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-full p-0.5">
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 opacity-0 scale-95 pointer-events-none group-hover/dock:opacity-100 group-hover/dock:scale-100 group-hover/dock:pointer-events-auto transition-all duration-300 delay-150 group-hover/dock:delay-0 origin-bottom z-50">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-full p-1.5" role="menu">
          {REACTION_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="menuitem"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-lg transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
              title={p.id}
              disabled={disabled || busy}
              onClick={() => onPick(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50"
        aria-label="Phản ứng cảm xúc"
        aria-haspopup="true"
        disabled={disabled}
      >
        <span aria-hidden>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 10v12" />
            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
          </svg>
        </span>
      </button>
    </div>
  );
}

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const myId = useCurrentUserId(user);
  const myDisplay =
    user?.displayName || user?.username || user?.name || user?.email || 'Bạn';

  const {
    bumpInboxRevision,
    setDirectRoomPresence,
    bumpFriendsRevision,
  } = useChatShell();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsJoin, setNeedsJoin] = useState(false);
  const [joining, setJoining] = useState(false);
  const [keywordWarning, setKeywordWarning] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const bottomRef = useRef(null);
  const feedRef = useRef(null);
  const loadingOlderRef = useRef(false);
  const stickToBottomRef = useRef(true);
  const [showJumpLatest, setShowJumpLatest] = useState(false);
  const [presence, setPresence] = useState(null);
  const [roomMembers, setRoomMembers] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [pendingMedia, setPendingMedia] = useState(null);
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);
  const [stickerPopoverOpen, setStickerPopoverOpen] = useState(false);
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [reactionBusyMid, setReactionBusyMid] = useState(null);
  const [recallBusyMid, setRecallBusyMid] = useState(null);
  const prevRoomIdRef = useRef(null);
  const prevRoomCanMarkRef = useRef(false);
  const prevRoomLastMessageIdRef = useRef(null);
  const lastPickedReactionRef = useRef({});
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  /** POST /rooms/{id}/read rồi báo sidebar refetch — tránh badge chưa đọc kẹt sau khi đã mở phòng. */
  const markReadAndSyncSidebar = useCallback(
    async (rid, lastMessageId, isMember) => {
      if (!rid || !isMember) return;
      try {
        await chatService.markRoomRead(rid, lastMessageId ?? null);
        bumpInboxRevision?.();
        notifyChatInboxRevised();
      } catch {
        /* API lỗi — giữ badge; không chặn UI */
      }
    },
    [bumpInboxRevision]
  );

  useEffect(() => {
    const prevRoomId = prevRoomIdRef.current;
    const changedRoom = prevRoomId != null && roomId != null && String(prevRoomId) !== String(roomId);
    if (changedRoom && prevRoomCanMarkRef.current) {
      void markReadAndSyncSidebar(prevRoomId, prevRoomLastMessageIdRef.current, true);
    }

    prevRoomIdRef.current = roomId ?? null;
    prevRoomCanMarkRef.current = Boolean(roomId) && !needsJoin && !loading;
    prevRoomLastMessageIdRef.current =
      getLatestPersistedMessageId(messages) ?? (room?.lastMessage ?? room?.LastMessage)?.id ?? (room?.lastMessage ?? room?.LastMessage)?.Id ?? null;
  }, [roomId, needsJoin, loading, messages, room, markReadAndSyncSidebar]);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    const cached = readChatRoomCache(roomId);
    if (cached) {
      setRoom(cached.room);
      setMessages(cached.messages);
      setHasMore(cached.hasMore);
      setNextCursor(cached.nextCursor);
      setNeedsJoin(!cached.asMember);
      setLoading(false);
      setError('');
      requestAnimationFrame(() => scrollFeedToEnd(feedRef.current, { smooth: false }));
    } else {
      setLoading(true);
    }

    async function load() {
      if (!cached) {
        setError('');
        setNeedsJoin(false);
        setKeywordWarning('');
      }
      try {
        const { room: roomRes, asMember: member, msgRes } = await loadChatRoomBootstrap(roomId, {
          msgLimit: CHAT_INITIAL_MSG_LIMIT,
        });
        if (cancelled) return;
        if (!roomRes) {
          if (!cached) {
            setError('Không tìm thấy phòng hoặc bạn chưa có quyền xem.');
            setRoom(null);
            setMessages([]);
            setHasMore(false);
            setNextCursor(null);
          }
          return;
        }

        const parsed = parsePagedMessagesResponse(msgRes);

        setRoom(roomRes);
        setNeedsJoin(!member);
        setMessages(parsed.items);
        setHasMore(parsed.hasMore);
        setNextCursor(parsed.nextCursor);
        writeChatRoomCache(roomId, {
          room: roomRes,
          messages: parsed.items,
          hasMore: parsed.hasMore,
          nextCursor: parsed.nextCursor,
          asMember: member,
        });
        if (member) {
          const last = parsed.items.length > 0 ? parsed.items[parsed.items.length - 1] : null;
          const lid = last ? last.id ?? last.Id : null;
          window.setTimeout(() => {
            void markReadAndSyncSidebar(roomId, lid, member);
          }, 0);
        }
        if (!cancelled) {
          stickToBottomRef.current = true;
          setShowJumpLatest(false);
          scrollFeedToEnd(feedRef.current, { smooth: false });
        }
      } catch (e) {
        if (!cancelled && !cached) {
          const msg = e?.response?.data?.message || e?.message || 'Không tải được phòng.';
          const detail = e?.response?.data?.detail;
          setError(detail ? `${msg} (${detail})` : msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [roomId, markReadAndSyncSidebar]);

  useEffect(() => {
    stickToBottomRef.current = true;
    setShowJumpLatest(false);
  }, [roomId]);

  useEffect(() => {
    if (!loading && stickToBottomRef.current && feedRef.current && messages.length > 0 && !loadingOlderRef.current) {
      scrollFeedToEnd(feedRef.current, { smooth: false });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!roomId || needsJoin || loading) {
      setPresence(null);
      setRoomMembers([]);
      return undefined;
    }
    let cancelled = false;
    async function loadPresenceMembers() {
      try {
        const [p, mems] = await Promise.all([
          chatService.getRoomPresence(roomId).catch(() => null),
          chatService.getRoomMembers(roomId, { limit: 40 }).catch(() => []),
        ]);
        if (cancelled) return;
        setPresence(p || null);
        setRoomMembers(Array.isArray(mems) ? mems : []);
      } catch {
        if (!cancelled) {
          setPresence(null);
          setRoomMembers([]);
        }
      }
    }
    const deferId = window.setTimeout(() => {
      void loadPresenceMembers();
    }, 2000);
    const t = window.setInterval(() => void loadPresenceMembers(), 45000);
    return () => {
      cancelled = true;
      window.clearTimeout(deferId);
      window.clearInterval(t);
    };
  }, [roomId, needsJoin, loading]);

  const loadOlderMessages = useCallback(async () => {
    if (!roomId || needsJoin || loading || !hasMore || !nextCursor || loadingOlderRef.current) return;
    const container = feedRef.current;
    if (!container) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);

    // Lưu lại vị trí scroll TRƯỚC khi fetch
    const prevScrollHeight = container.scrollHeight;
    const prevScrollTop = container.scrollTop;

    try {
      const msgRes = await chatService.getRoomMessages(roomId, { cursor: nextCursor, limit: 50 });
      const parsed = parsePagedMessagesResponse(msgRes);

      // Dùng flushSync để React cập nhật DOM đồng bộ ngay lập tức,
      // giúp ta đo scrollHeight mới và khôi phục vị trí scroll TRƯỚC khi trình duyệt paint.
      flushSync(() => {
        setMessages((prev) => dedupeMessagesById([...parsed.items, ...prev]));
        setHasMore(parsed.hasMore);
        setNextCursor(parsed.nextCursor);
      });

      // Khôi phục vị trí scroll: tin cũ được chèn phía trên → scrollHeight tăng.
      // Đặt scrollTop = (scrollHeight mới - scrollHeight cũ) + scrollTop cũ
      // để người dùng vẫn thấy đúng tin nhắn họ đang đọc.
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;

      loadingOlderRef.current = false;
      setLoadingOlder(false);
    } catch {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [roomId, needsJoin, loading, hasMore, nextCursor]);

  function onFeedScroll() {
    const el = feedRef.current;
    if (!el) return;

    // Cập nhật trạng thái "đang ở gần đáy"
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = dist < 120;
    stickToBottomRef.current = nearBottom;

    // Hiển thị nút "Tin mới nhất"
    const hasScrollableHistory = el.scrollHeight > el.clientHeight + 80;
    const showJump = !nearBottom && hasScrollableHistory;
    setShowJumpLatest((prev) => (prev === showJump ? prev : showJump));

    // Khi cuộn gần đầu (< 200px) và chưa đang load → tải tin cũ
    if (el.scrollTop < 200 && !loadingOlderRef.current && hasMore) {
      void loadOlderMessages();
    }
  }

  function handleJumpToLatest() {
    stickToBottomRef.current = true;
    setShowJumpLatest(false);
    scrollFeedToEnd(feedRef.current, { smooth: true });
  }

  useEffect(() => {
    if (!roomId || needsJoin || loading) return undefined;

    let cancelled = false;
    let stopFn = null;
    const deferId = window.setTimeout(() => {
      void (async () => {
        try {
          const stop = await startChatRoomConnection(roomId, {
            onReceiveMessage: (msg) => {
              if (cancelled || !msg) return;
              const normalized = normalizeMessageShape(msg);
              const newId = normalized.id ?? normalized.Id;
              setMessages((prev) => {
                if (newId == null) return prev;
                if (prev.some((m) => String(m.id ?? m.Id) === String(newId))) return prev;
                const next = dedupeMessagesById([...prev, normalized]);
                if (stickToBottomRef.current) {
                  requestAnimationFrame(() => scrollFeedToEnd(feedRef.current, { smooth: true }));
                }
                return next;
              });
              if (newId != null) {
                void chatService
                  .markRoomRead(roomId, newId)
                  .then(() => {
                    bumpInboxRevision?.();
                    notifyChatInboxRevised();
                  })
                  .catch(() => { });
              }
            },
            onMessageUpdated: (msg) => {
              if (cancelled || !msg) return;
              const normalized = normalizeMessageShape(msg);
              const id = normalized.id ?? normalized.Id;
              if (id == null) return;
              setMessages((prev) =>
                dedupeMessagesById(
                  prev.map((m) => (String(m.id ?? m.Id) === String(id) ? normalizeMessageShape({ ...m, ...normalized }) : m))
                )
              );
            },
            onMessageDeleted: (payload) => {
              if (cancelled) return;
              const mid = payload?.messageId ?? payload?.MessageId;
              if (mid == null) return;
              setMessages((prev) => prev.filter((m) => String(m.id ?? m.Id) !== String(mid)));
            },
          });

          if (cancelled) {
            void stop();
          } else {
            stopFn = stop;
          }
        } catch {
          /* SignalR tùy chọn — gửi/nhận qua REST vẫn hoạt động */
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(deferId);
      if (stopFn) {
        void stopFn();
      }
    };
  }, [roomId, needsJoin, loading, bumpInboxRevision]);

  async function handleJoin() {
    if (!roomId) return;
    setJoining(true);
    setError('');
    try {
      await chatService.joinRoom(roomId);
      setNeedsJoin(false);
      const [roomRes, msgRes] = await Promise.all([
        chatService.getRoom(roomId),
        chatService.getRoomMessages(roomId, { limit: 50 }),
      ]);
      setRoom(roomRes);
      const parsed = parsePagedMessagesResponse(msgRes);
      setMessages(parsed.items);
      setHasMore(parsed.hasMore);
      setNextCursor(parsed.nextCursor);
      const last = parsed.items.length > 0 ? parsed.items[parsed.items.length - 1] : null;
      const lid = last ? last.id ?? last.Id : null;
      void markReadAndSyncSidebar(roomId, lid, true);
      stickToBottomRef.current = true;
      setShowJumpLatest(false);
      scrollFeedToEnd(feedRef.current, { smooth: false });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Không thể tham gia phòng.');
    } finally {
      setJoining(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = draft.trim();
    if ((!text && !pendingMedia) || !roomId || needsJoin) return;

    let sendType = 'text';
    let sendContent = text;
    if (pendingMedia?.kind === 'image') {
      sendType = 'image';
      sendContent = pendingMedia.dataUrl;
    } else if (pendingMedia?.kind === 'file') {
      sendType = 'file';
      sendContent = JSON.stringify(pendingMedia.meta);
    }

    const replyToId = replyingTo ? replyingTo.id ?? replyingTo.Id : undefined;
    const prevDraft = draft;
    const prevMedia = pendingMedia;
    const prevReply = replyingTo;

    setDraft('');
    setPendingMedia(null);
    setReplyingTo(null);
    setEmojiPopoverOpen(false);
    setStickerPopoverOpen(false);
    setSharePopoverOpen(false);
    setMentionOpen(false);
    setError('');
    setKeywordWarning('');

    const optimistic = {
      id: `tmp-${Date.now()}`,
      content: sendContent,
      type: sendType,
      userId: myId ?? undefined,
      senderId: myId ?? undefined,
      senderDisplayName: myDisplay,
      createdAt: new Date().toISOString(),
      replyToId,
      reactions: [],
      _opt: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    stickToBottomRef.current = true;
    scrollFeedToEnd(feedRef.current, { smooth: false });
    try {
      const { message: saved, sensitiveKeywordMatches } = await chatService.sendMessage(roomId, {
        content: sendContent,
        type: sendType,
        replyToId,
      });
      if (Array.isArray(sensitiveKeywordMatches) && sensitiveKeywordMatches.length > 0) {
        setKeywordWarning(`Nội dung có thể chứa từ khóa nhạy cảm: ${sensitiveKeywordMatches.join(', ')}`);
      }
      const savedNorm = saved ? normalizeMessageShape(saved) : saved;
      setMessages((prev) =>
        dedupeMessagesById(
          prev.map((m) => {
            const mid = m.id ?? m.Id;
            return mid === optimistic.id ? savedNorm : m;
          })
        )
      );
      const lid = savedNorm?.id ?? savedNorm?.Id;
      void markReadAndSyncSidebar(roomId, lid, true);
      stickToBottomRef.current = true;
      scrollFeedToEnd(feedRef.current, { smooth: true });
    } catch (e2) {
      setMessages((prev) => prev.filter((m) => (m.id ?? m.Id) !== optimistic.id));
      setDraft(prevDraft);
      setPendingMedia(prevMedia);
      setReplyingTo(prevReply);
      const msg = e2?.response?.data?.message || e2?.message || 'Gửi thất bại.';
      const detail = e2?.response?.data?.detail;
      setError(detail ? `${msg} (${detail})` : msg);
    }
  }

  async function handleToggleReaction(mid, emoji) {
    if (!roomId || needsJoin || mid == null) return;
    const k = String(mid);
    const prevPick = lastPickedReactionRef.current[k];
    setReactionBusyMid(mid);
    setError('');
    try {
      if (prevPick === emoji) {
        await chatService.removeReaction(roomId, mid, emoji);
        lastPickedReactionRef.current[k] = null;
        setMessages((prevList) =>
          prevList.map((msg) => {
            if (String(msg.id ?? msg.Id) !== k) return msg;
            const cur = [...(msg.reactions || [])];
            const idx = cur.findIndex((r) => (r.emoji ?? r.Emoji) === emoji);
            if (idx < 0) return msg;
            const row = cur[idx];
            const cnt = (row.count ?? row.Count ?? 1) - 1;
            if (cnt <= 0) cur.splice(idx, 1);
            else cur[idx] = { ...row, count: cnt, Count: cnt };
            return normalizeMessageShape({ ...msg, reactions: cur });
          })
        );
      } else {
        if (prevPick) {
          await chatService.removeReaction(roomId, mid, prevPick).catch(() => { });
        }
        const updated = await chatService.addReaction(roomId, mid, emoji);
        lastPickedReactionRef.current[k] = emoji;
        if (updated) {
          const norm = normalizeMessageShape(updated);
          setMessages((prevList) =>
            prevList.map((msg) => (String(msg.id ?? msg.Id) === k ? norm : msg))
          );
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Không cập nhật reaction.');
    } finally {
      setReactionBusyMid(null);
    }
  }

  async function handlePinMessage(mid, shouldPin) {
    if (!roomId || needsJoin || mid == null) return;
    setError('');
    try {
      if (shouldPin) await chatService.pinMessage(roomId, mid);
      else await chatService.unpinMessage(roomId, mid);
      setMessages((prevList) =>
        prevList.map((msg) =>
          String(msg.id ?? msg.Id) === String(mid)
            ? normalizeMessageShape({ ...msg, isPinned: shouldPin, IsPinned: shouldPin })
            : msg
        )
      );
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Không ghim/bỏ ghim được (cần quyền moderator phòng).');
    }
  }

  async function handleRecallMessage(mid) {
    if (!roomId || needsJoin || mid == null) return;
    const k = String(mid);
    if (k.startsWith('tmp-')) return;
    if (!window.confirm('Thu hồi tin nhắn này? Mọi người trong phòng sẽ không còn thấy tin.')) return;
    setRecallBusyMid(mid);
    setError('');
    try {
      await chatService.deleteMessage(roomId, mid);
      delete lastPickedReactionRef.current[k];
      setMessages((prevList) => prevList.filter((msg) => String(msg.id ?? msg.Id) !== k));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Không thu hồi được tin nhắn.');
    } finally {
      setRecallBusyMid(null);
    }
  }

  function sendStickerPayload(payload, msgType = 'sticker') {
    if (!roomId || needsJoin) return;
    const body = JSON.stringify(payload);
    const optimistic = {
      id: `tmp-${Date.now()}`,
      content: body,
      type: msgType,
      userId: myId ?? undefined,
      senderDisplayName: myDisplay,
      createdAt: new Date().toISOString(),
      reactions: [],
      _opt: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    stickToBottomRef.current = true;
    scrollFeedToEnd(feedRef.current, { smooth: false });
    setStickerPopoverOpen(false);
    setSharePopoverOpen(false);
    void (async () => {
      try {
        const { message: saved } = await chatService.sendMessage(roomId, {
          content: body,
          type: msgType,
        });
        const norm = saved ? normalizeMessageShape(saved) : saved;
        setMessages((prev) =>
          dedupeMessagesById(prev.map((m) => ((m.id ?? m.Id) === optimistic.id ? norm : m)))
        );
        const lid = norm?.id ?? norm?.Id;
        if (lid != null) void markReadAndSyncSidebar(roomId, lid, true);
        scrollFeedToEnd(feedRef.current, { smooth: true });
      } catch (err) {
        setMessages((prev) => prev.filter((m) => (m.id ?? m.Id) !== optimistic.id));
        setError(err?.response?.data?.message || err?.message || 'Không gửi được sticker/chia sẻ.');
      }
    })();
  }

  function onPickImageFile(ev) {
    const f = ev.target.files?.[0];
    ev.target.value = '';
    if (!f || !f.type.startsWith('image/')) return;
    if (f.size > MAX_CHAT_IMAGE_BYTES) {
      setError(`Ảnh tối đa ~${Math.round(MAX_CHAT_IMAGE_BYTES / 1024)} KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPendingMedia({ kind: 'image', dataUrl: reader.result, name: f.name });
    reader.readAsDataURL(f);
  }

  function onPickAttachFile(ev) {
    const f = ev.target.files?.[0];
    ev.target.value = '';
    if (!f) return;
    if (f.size > MAX_CHAT_FILE_BYTES) {
      setError(`File tối đa ~${Math.round(MAX_CHAT_FILE_BYTES / 1024)} KB (bản demo).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const full = String(reader.result || '');
      const b64 = full.includes(',') ? full.split(',')[1] : full;
      setPendingMedia({
        kind: 'file',
        meta: { name: f.name, mime: f.type || 'application/octet-stream', size: f.size, data: b64 },
      });
    };
    reader.readAsDataURL(f);
  }

  const roomTypeNorm = (room?.type || room?.Type || '').toLowerCase();
  /** Backend: phòng 1–1 dùng type `private` (ChatService PrivateRoomType). */
  const isDirectRoom = roomTypeNorm === 'private';
  const peerUser = room?.peerUser ?? room?.PeerUser;
  const directPeerLine =
    isDirectRoom && peerUser
      ? peerUser.displayName ||
      peerUser.DisplayName ||
      peerUser.username ||
      peerUser.Username ||
      ''
      : '';

  const roomTitle =
    isDirectRoom && peerUser
      ? peerUser.displayName || peerUser.DisplayName || peerUser.username || peerUser.Username || room?.name
      : room?.name || 'Phòng chat';
  const roomTitleDisplay = formatRoomDisplayName(roomTitle);
  const onlineCount = presence != null ? (presence.onlineCount ?? presence.OnlineCount) : null;
  const memberCount = presence != null ? (presence.memberCount ?? presence.MemberCount) : null;
  const peerSocialOnline =
    isDirectRoom && onlineCount != null && memberCount != null
      ? Number(memberCount) >= 2 && Number(onlineCount) >= 2
      : null;
  const headerSubtitleParts = useMemo(
    () =>
      roomSubtitleParts({
        isDirectRoom,
        peerSocialOnline,
        roomTypeNorm,
        onlineCount,
      }),
    [isDirectRoom, peerSocialOnline, roomTypeNorm, onlineCount]
  );

  const directPeerUserId = useMemo(() => {
    if (!room || String(room?.type || room?.Type || '').toLowerCase() !== 'private') return null;
    const p = room.peerUser ?? room.PeerUser;
    const n = Number(p?.id ?? p?.Id ?? 0);
    return n || null;
  }, [room]);

  const presenceOnlineSig = useMemo(() => {
    if (presence == null) return '';
    const oc = presence.onlineCount ?? presence.OnlineCount;
    const mc = presence.memberCount ?? presence.MemberCount;
    return `${oc}|${mc}`;
  }, [presence]);

  const myRoleNorm = String(room?.myRole ?? room?.MyRole ?? '').toLowerCase();
  const createdByNum = Number(room?.createdBy ?? room?.CreatedBy ?? NaN);
  const canPinMessages =
    ['moderator', 'admin', 'owner', 'siteadmin'].includes(myRoleNorm) ||
    (Number.isFinite(createdByNum) && myId != null && Number(myId) === createdByNum);

  const mentionCandidates = useMemo(() => {
    const q = (mentionQuery || '').toLowerCase();
    return roomMembers
      .filter((mem) => {
        const uid = mem.userId ?? mem.UserId;
        if (myId != null && idsMatch(uid, myId)) return false;
        const un = String(mem.username ?? mem.Username ?? '').toLowerCase();
        const dn = String(mem.displayName ?? mem.DisplayName ?? '').toLowerCase();
        if (!un && !dn) return false;
        if (!q) return true;
        return un.includes(q) || dn.includes(q);
      })
      .slice(0, 12);
  }, [roomMembers, mentionQuery, myId]);

  function pickMention(username) {
    const un = String(username || '').trim();
    if (!un) return;
    setDraft((prev) => {
      const i = prev.lastIndexOf('@');
      if (i < 0) return `${prev}@${un} `;
      let j = i + 1;
      while (j < prev.length && prev[j] !== ' ') j += 1;
      return `${prev.slice(0, i)}@${un} ${prev.slice(j)}`;
    });
    setMentionOpen(false);
    setMentionQuery('');
  }

  function onDraftChange(e) {
    const v = e.target.value;
    setDraft(v);
    const c = typeof e.target.selectionStart === 'number' ? e.target.selectionStart : v.length;
    const before = v.slice(0, c);
    const at = before.lastIndexOf('@');
    if (at >= 0) {
      const frag = before.slice(at + 1);
      if (!frag.includes(' ') && frag.length <= 48) {
        setMentionQuery(frag.toLowerCase());
        setMentionOpen(true);
        return;
      }
    }
    setMentionOpen(false);
    setMentionQuery('');
  }

  function openMentionPicker() {
    setEmojiPopoverOpen(false);
    setStickerPopoverOpen(false);
    setSharePopoverOpen(false);
    setDraft((d) => (d.endsWith('@') ? d : `${d}@`));
    setMentionQuery('');
    setMentionOpen(true);
  }

  useEffect(() => {
    if (!setDirectRoomPresence) return undefined;
    if (directPeerUserId == null) {
      setDirectRoomPresence(null);
      return undefined;
    }
    let online = null;
    if (peerSocialOnline === true) online = true;
    else if (peerSocialOnline === false) online = false;
    setDirectRoomPresence({ peerUserId: directPeerUserId, online });
    return () => setDirectRoomPresence(null);
  }, [directPeerUserId, peerSocialOnline, setDirectRoomPresence]);

  useEffect(() => {
    if (!presenceOnlineSig || !bumpFriendsRevision) return;
    bumpFriendsRevision();
  }, [presenceOnlineSig, bumpFriendsRevision]);

  const pinnedPreview = messages.find((m) => m.isPinned);

  return (
    <YumeChatLayout selectedRoomId={roomId}>
      {loading && !room ? (
        <div className="moji-chat__room moji-chat__room--loading">
          <div className="moji-chat__empty" role="status" aria-live="polite">
            <div className="moji-chat__empty-icon" aria-hidden>
              <span className="moji-chat__empty-bubble">•••</span>
            </div>
            <p className="moji-chat__empty-loading-hint">Đang mở cuộc trò chuyện…</p>
          </div>
        </div>
      ) : (
        <div key={String(roomId ?? 'none')} className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden h-full relative">
          <header className="chat-room-header shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
            <div className="chat-room-header__inner">
              {isDirectRoom && peerUser && (
                <div className="relative shrink-0" aria-hidden>
                  <div className="chat-room-header__avatar chat-room-header__avatar--direct">
                    {(peerUser.displayName || peerUser.DisplayName || peerUser.username || peerUser.Username || '?')
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                  {peerSocialOnline === true ? (
                    <span className="chat-room-header__online-dot" title="Đang hoạt động" />
                  ) : null}
                </div>
              )}
              {!isDirectRoom && (
                <div className="chat-room-header__avatar" aria-hidden>
                  {roomTitleDisplay.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="chat-room-header__meta">
                <h1 className="chat-room-header__title">{roomTitleDisplay}</h1>
                <div className="chat-room-header__subtitle">
                  {headerSubtitleParts.map((part, i) => (
                    <Fragment key={part}>
                      {i > 0 ? <span className="chat-room-header__sep" aria-hidden>·</span> : null}
                      <span>{part}</span>
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </header>

          {needsJoin && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50 p-3 flex items-center justify-between z-10 shadow-sm" role="status">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Bạn chưa tham gia phòng này. Tham gia để xem và gửi tin nhắn.</p>
              <button type="button" className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50" disabled={joining} onClick={handleJoin}>
                {joining ? 'Đang tham gia…' : 'Tham gia phòng'}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 text-sm font-medium border-b border-red-200 dark:border-red-800/50 z-10" role="alert">
              {error}
            </div>
          )}

          {keywordWarning && (
            <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 p-3 text-sm font-medium border-b border-orange-200 dark:border-orange-800/50 z-10" role="status">
              {keywordWarning}
            </div>
          )}

          <div className="flex-1 overflow-hidden relative bg-white dark:bg-slate-900/50 w-full">
            <div
              ref={feedRef}
              className="absolute inset-0 overflow-y-auto overflow-x-hidden px-4 py-6 flex flex-col chat-feed-no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onScroll={onFeedScroll}
            >
              {loadingOlder && (
                <div className="text-center py-2">
                  <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium rounded-full shadow-sm" role="status">
                    Đang tải tin cũ…
                  </span>
                </div>
              )}

              {pinnedPreview && !needsJoin ? (
                <div className="sticky top-0 z-10 mx-auto max-w-md w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl p-3 flex gap-3 items-center mb-6" role="status">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm" aria-hidden>
                    📌
                  </span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Tin ghim</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{messageSenderLabel(pinnedPreview)}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{pinnedBannerSnippet(pinnedPreview)}</span>
                  </div>
                </div>
              ) : null}

              {messages.length === 0 && !needsJoin && (
                <div className="flex-1 flex items-center justify-center min-h-[12rem]">
                  <p className="text-slate-500 dark:text-slate-400 text-sm italic bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">Chưa có tin nhắn. Hãy chào mọi người!</p>
                </div>
              )}

              {/*
            Chat 1–1 (private): tin mình phải + màu nổi bật; tin đối phương trái, không tên (chỉ 2 người).
            Chat nhóm: tin người khác có avatar + tên; gom tin liên tiếp cùng người (chỉ hiện tên/avatar dòng đầu).
            Cuộn lên: load thêm tin cũ (cursor) — giống Moji_RealtimeChatApp ChatWindowBody.
          */}
              {messages.map((m, idx) => {
                const sid = messageSenderId(m, myId);
                const isOwn = myId != null && sid != null && idsMatch(sid, myId);
                const prev = idx > 0 ? messages[idx - 1] : null;
                const next = idx < messages.length - 1 ? messages[idx + 1] : null;
                const prevSid = prev ? messageSenderId(prev, myId) : null;
                const nextSid = next ? messageSenderId(next, myId) : null;
                const isNewSender = prevSid == null || prevSid !== sid;
                const peerLabel = messageSenderLabel(m);
                const peerInitial = peerAvatarLetter(m, isDirectRoom, peerUser);
                const rowKey = m.id ?? m.Id ?? `row-${idx}`;
                const t = formatTime(m.createdAt || m.CreatedAt);
                const curIso = m.createdAt || m.CreatedAt;
                const prevIso = prev ? prev.createdAt || prev.CreatedAt : null;
                const nextIso = next ? next.createdAt || next.CreatedAt : null;
                const showDateSep = shouldShowDateSeparator(prevIso, curIso);
                const showTimeCluster = shouldShowTimeCluster(prevIso, curIso);
                const nextBreaksClusterDate = next ? shouldShowDateSeparator(curIso, nextIso) : true;
                const nextBreaksClusterTime = next ? shouldShowTimeCluster(curIso, nextIso) : true;

                const clusterPrev =
                  !!prev && prevSid === sid && !showDateSep && !showTimeCluster;
                const clusterNext =
                  !!next && nextSid === sid && !nextBreaksClusterDate && !nextBreaksClusterTime;
                let bubbleGroup = 'single';
                if (clusterPrev && clusterNext) bubbleGroup = 'mid';
                else if (clusterPrev) bubbleGroup = 'last';
                else if (clusterNext) bubbleGroup = 'first';

                /** Nhóm: bắt buộc tên + avatar ở tin đầu của chuỗi cùng người gửi. */
                const showGroupHeader = !isDirectRoom && isNewSender;
                /** 1–1: avatar ở tin đầu chuỗi từ đối phương; nhóm: avatar + tên chỉ khi đổi người gửi. */
                const showPeerAvatar = !isOwn && (isDirectRoom ? isNewSender : showGroupHeader);
                /** Cùng người gửi, tin tiếp theo: giữ lề trái (cột trống = độ rộng avatar). */
                const showPeerSpacer = !isOwn && !showPeerAvatar && prevSid === sid;

                const bubbleGroupClass =
                  bubbleGroup === 'single'
                    ? ''
                    : bubbleGroup === 'first'
                      ? ' moji-chat__bubble--grp-first'
                      : bubbleGroup === 'mid'
                        ? ' moji-chat__bubble--grp-mid'
                        : ' moji-chat__bubble--grp-last';

                const rowTightClass = clusterPrev ? ' moji-chat__row--tight' : '';
                const mid = m.id ?? m.Id;
                const replyParent = findMessageById(messages, m.replyToId ?? m.ReplyToId);

                if (isOwn) {
                  return (
                    <Fragment key={rowKey}>
                      {showDateSep && (
                        <div className="flex justify-center my-4">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">{formatDateSeparator(curIso)}</span>
                        </div>
                      )}
                      {!showDateSep && showTimeCluster && (
                        <div className="text-center text-[10px] font-medium text-slate-400 dark:text-slate-500 my-1">{formatTimeShort(curIso)}</div>
                      )}
                      <article
                        className={`flex w-full justify-end ${clusterPrev ? 'mt-0.5' : 'mt-3'}`}
                        aria-label="Tin nhắn của bạn"
                      >
                        <div className="flex flex-col items-end max-w-[75%] md:max-w-[65%] min-w-0">
                          <div className="group relative flex items-center gap-2">
                            {!needsJoin ? (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
                                <button
                                  type="button"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                                  title="Trả lời"
                                  aria-label="Trả lời tin nhắn"
                                  onClick={() => setReplyingTo(m)}
                                >
                                  <span className="text-sm font-serif" aria-hidden>
                                    ,,
                                  </span>
                                </button>
                                {canPinMessages ? (
                                  <button
                                    type="button"
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                                    title={m.isPinned ? 'Bỏ ghim' : 'Ghim tin'}
                                    aria-label={m.isPinned ? 'Bỏ ghim tin nhắn' : 'Ghim tin nhắn'}
                                    onClick={() => void handlePinMessage(mid, !m.isPinned)}
                                  >
                                    <span className="text-[13px]" aria-hidden>
                                      📌
                                    </span>
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                                  title="Thu hồi tin nhắn"
                                  aria-label="Thu hồi tin nhắn"
                                  disabled={recallBusyMid === mid || String(mid).startsWith('tmp-')}
                                  onClick={() => void handleRecallMessage(mid)}
                                >
                                  <span className="text-[13px]" aria-hidden>
                                    🗑
                                  </span>
                                </button>
                              </div>
                            ) : null}
                            <div className="relative group">
                              <div className={`relative px-4 py-2 text-[0.95rem] shadow-sm bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 text-white border border-white/10 ${bubbleGroup === 'single' ? 'rounded-2xl rounded-br-sm' :
                                bubbleGroup === 'first' ? 'rounded-2xl rounded-br-sm' :
                                  bubbleGroup === 'mid' ? 'rounded-2xl rounded-tr-sm rounded-br-sm' :
                                    'rounded-2xl rounded-tr-sm'
                                }`}>
                                <MessageReplyQuote parent={replyParent} isOwn />
                                {m.isPinned ? (
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-amber-200 uppercase tracking-wider mb-1" title="Tin đã ghim">
                                    <span aria-hidden>📌</span> Đã ghim
                                  </div>
                                ) : null}
                                <MessageBody m={m} />
                              </div>
                              {!needsJoin ? (
                                <div className="absolute -bottom-4 -left-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 group-hover:delay-0 z-10">
                                  <MessageReactionDock
                                    disabled={needsJoin}
                                    busy={reactionBusyMid === mid}
                                    onPick={(emojiId) => void handleToggleReaction(mid, emojiId)}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>
                          {(m.reactions || []).length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1 justify-end">
                              {(m.reactions || []).map((r, ri) => {
                                const em = r.emoji ?? r.Emoji;
                                const c = r.count ?? r.Count ?? 0;
                                return (
                                  <span key={`${String(em)}-${ri}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium shadow-sm">
                                    {reactionLabel(em)} <small className="opacity-70">{c}</small>
                                  </span>
                                );
                              })}
                            </div>
                          ) : null}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {idx === messages.length - 1 && (
                              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Đã xem</span>
                            )}
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{t}</span>
                          </div>
                        </div>
                      </article>
                    </Fragment>
                  );
                }

                return (
                  <Fragment key={rowKey}>
                    {showDateSep && (
                      <div className="flex justify-center my-4">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">{formatDateSeparator(curIso)}</span>
                      </div>
                    )}
                    {!showDateSep && showTimeCluster && (
                      <div className="text-center text-[10px] font-medium text-slate-400 dark:text-slate-500 my-1">{formatTimeShort(curIso)}</div>
                    )}
                    <article
                      className={`flex w-full justify-start ${clusterPrev ? 'mt-0.5' : 'mt-3'}`}
                      aria-label={isDirectRoom ? 'Tin nhắn' : `Tin từ ${peerLabel}`}
                    >
                      {showPeerAvatar && (
                        <div
                          className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm shrink-0 mr-2 text-slate-600 dark:text-slate-300 shadow-sm"
                          aria-hidden
                          title={peerLabel}
                        >
                          {peerInitial}
                        </div>
                      )}
                      {showPeerSpacer && <div className="w-8 h-8 shrink-0 mr-2" aria-hidden />}
                      <div className="flex flex-col items-start max-w-[75%] md:max-w-[65%] min-w-0">
                        {isDirectRoom && isNewSender && directPeerLine && (
                          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1">{directPeerLine}</div>
                        )}
                        {showGroupHeader && <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1">{peerLabel}</div>}
                        <div className="group relative flex items-center gap-2">
                          <div className="relative group">
                            <div className={`relative px-4 py-2 text-[0.95rem] shadow-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 ${bubbleGroup === 'single' ? 'rounded-2xl rounded-bl-sm' :
                              bubbleGroup === 'first' ? 'rounded-2xl rounded-bl-sm' :
                                bubbleGroup === 'mid' ? 'rounded-2xl rounded-tl-sm rounded-bl-sm' :
                                  'rounded-2xl rounded-tl-sm'
                              }`}>
                              <MessageReplyQuote parent={replyParent} isOwn={false} />
                              {m.isPinned ? (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1" title="Tin đã ghim">
                                  <span aria-hidden>📌</span> Đã ghim
                                </div>
                              ) : null}
                              <MessageBody m={m} />
                            </div>
                            {!needsJoin ? (
                              <div className="absolute -bottom-4 -right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 group-hover:delay-0 z-10">
                                <MessageReactionDock
                                  disabled={needsJoin}
                                  busy={reactionBusyMid === mid}
                                  onPick={(emojiId) => void handleToggleReaction(mid, emojiId)}
                                />
                              </div>
                            ) : null}
                          </div>
                          {!needsJoin ? (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
                              <button
                                type="button"
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                                title="Trả lời"
                                aria-label="Trả lời tin nhắn"
                                onClick={() => setReplyingTo(m)}
                              >
                                <span className="text-sm font-serif" aria-hidden>
                                  ,,
                                </span>
                              </button>
                              {canPinMessages ? (
                                <button
                                  type="button"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                                  title={m.isPinned ? 'Bỏ ghim' : 'Ghim tin'}
                                  aria-label={m.isPinned ? 'Bỏ ghim tin nhắn' : 'Ghim tin nhắn'}
                                  onClick={() => void handlePinMessage(mid, !m.isPinned)}
                                >
                                  <span className="text-[13px]" aria-hidden>
                                    📌
                                  </span>
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        {(m.reactions || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1 justify-start">
                            {(m.reactions || []).map((r, ri) => {
                              const em = r.emoji ?? r.Emoji;
                              const c = r.count ?? r.Count ?? 0;
                              return (
                                <span key={`${String(em)}-${ri}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium shadow-sm">
                                  {reactionLabel(em)} <small className="opacity-70">{c}</small>
                                </span>
                              );
                            })}
                          </div>
                        ) : null}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{t}</span>
                        </div>
                      </div>
                    </article>
                  </Fragment>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {showJumpLatest ? (
              <button
                type="button"
                className="chat-jump-latest"
                onClick={handleJumpToLatest}
                title="Cuộn xuống tin mới nhất"
              >
                Tin mới nhất
                <ChevronDown size={15} strokeWidth={2.25} aria-hidden />
              </button>
            ) : null}
          </div>

          <div className="chat-composer-wrap shrink-0 z-10 relative">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-hidden
              tabIndex={-1}
              onChange={onPickImageFile}
            />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              aria-hidden
              tabIndex={-1}
              onChange={onPickAttachFile}
            />
            <form className="chat-composer-form relative max-w-4xl mx-auto" onSubmit={sendMessage}>
              {replyingTo ? (
                <div className="flex items-center justify-between gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-l-4 border-indigo-500 rounded-r-xl" role="status">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Trả lời {messageSenderLabel(replyingTo)}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300 truncate mt-0.5">
                      {(replyingTo.content ?? replyingTo.Content ?? '').slice(0, 100) || '…'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="w-8 h-8 flex items-center justify-center shrink-0 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Hủy trả lời"
                    onClick={() => setReplyingTo(null)}
                  >
                    ✕
                  </button>
                </div>
              ) : null}
              {pendingMedia ? (
                <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700" role="status">
                  {pendingMedia.kind === 'image' ? (
                    <img src={pendingMedia.dataUrl} alt="" className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" />
                  ) : (
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-sm">
                      📎 {pendingMedia.meta?.name || 'Tệp'}
                    </span>
                  )}
                  <button
                    type="button"
                    className="w-8 h-8 flex items-center justify-center shrink-0 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Bỏ ảnh hoặc file"
                    onClick={() => setPendingMedia(null)}
                  >
                    ✕
                  </button>
                </div>
              ) : null}
              <div className="chat-composer-bar">
                <div className="chat-composer-tools-anchor">
                  <div className="chat-composer-tools" aria-label="Công cụ soạn tin">
                    <button
                      type="button"
                      className={`chat-composer-btn${emojiPopoverOpen ? ' chat-composer-btn--active' : ''}`}
                      title="Chèn emoji"
                      disabled={needsJoin}
                      onClick={() => {
                        setStickerPopoverOpen(false);
                        setSharePopoverOpen(false);
                        setEmojiPopoverOpen((v) => !v);
                      }}
                    >
                      <Smile size={19} strokeWidth={1.75} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="chat-composer-btn"
                      title="Gửi ảnh"
                      disabled={needsJoin}
                      onClick={() => {
                        setEmojiPopoverOpen(false);
                        setStickerPopoverOpen(false);
                        setSharePopoverOpen(false);
                        imageInputRef.current?.click();
                      }}
                    >
                      <ImagePlus size={19} strokeWidth={1.75} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="chat-composer-btn"
                      title="Đính kèm file"
                      disabled={needsJoin}
                      onClick={() => {
                        setEmojiPopoverOpen(false);
                        setStickerPopoverOpen(false);
                        setSharePopoverOpen(false);
                        fileInputRef.current?.click();
                      }}
                    >
                      <Paperclip size={19} strokeWidth={1.75} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="chat-composer-btn"
                      title="Gắn @username"
                      disabled={needsJoin}
                      onClick={() => {
                        setEmojiPopoverOpen(false);
                        setStickerPopoverOpen(false);
                        setSharePopoverOpen(false);
                        openMentionPicker();
                      }}
                    >
                      <AtSign size={18} strokeWidth={1.75} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={`chat-composer-btn${stickerPopoverOpen ? ' chat-composer-btn--active' : ''}`}
                      title="Sticker thành tích"
                      disabled={needsJoin}
                      onClick={() => {
                        setEmojiPopoverOpen(false);
                        setSharePopoverOpen(false);
                        setStickerPopoverOpen((v) => !v);
                      }}
                    >
                      <Sparkles size={18} strokeWidth={1.75} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={`chat-composer-btn${sharePopoverOpen ? ' chat-composer-btn--active' : ''}`}
                      title="Chia sẻ bài học / thành tích"
                      disabled={needsJoin}
                      onClick={() => {
                        setEmojiPopoverOpen(false);
                        setStickerPopoverOpen(false);
                        setSharePopoverOpen((v) => !v);
                      }}
                    >
                      <Share2 size={18} strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>
                  {emojiPopoverOpen ? (
                    <div className="chat-composer-popover chat-composer-popover--emoji" role="group" aria-label="Emoji nhanh">
                      {COMPOSER_QUICK_EMOJI.map((emo) => (
                        <button
                          key={emo}
                          type="button"
                          className="chat-composer-emoji-btn"
                          onClick={() => {
                            setDraft((d) => `${d}${emo}`);
                            setEmojiPopoverOpen(false);
                          }}
                        >
                          {emo}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {stickerPopoverOpen ? (
                    <div className="chat-composer-popover chat-composer-popover--stickers" role="list" aria-label="Sticker thành tích">
                      {ACHIEVEMENT_STICKERS.map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          className="flex items-center gap-3 p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors w-full"
                          onClick={() =>
                            sendStickerPayload(
                              { key: s.key, emoji: s.emoji, title: s.title, subtitle: s.subtitle },
                              'sticker'
                            )
                          }
                        >
                          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 text-xl shrink-0" aria-hidden>
                            {s.emoji}
                          </span>
                          <span className="flex flex-col min-w-0">
                            <strong className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{s.title}</strong>
                            <small className="text-xs text-slate-500 dark:text-slate-400 truncate">{s.subtitle}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {sharePopoverOpen ? (
                    <div className="chat-composer-popover chat-composer-popover--share" role="group" aria-label="Chia sẻ nhanh">
                      <button
                        type="button"
                        className="flex items-center gap-3 w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        onClick={() =>
                          sendStickerPayload(
                            {
                              emoji: '📚',
                              title: 'Bài học: Hiragana cơ bản',
                              courseName: 'JLPT N5 — Bài 1',
                              lessonUrl: `${window.location.origin}/learn`,
                            },
                            'lesson_share'
                          )
                        }
                      >
                        <span className="text-xl" aria-hidden>📚</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Chia sẻ bài học (mẫu)</span>
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-3 w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        onClick={() =>
                          sendStickerPayload(
                            {
                              emoji: '🏅',
                              title: 'Thành tích mới',
                              subtitle: 'Hoàn thành bài kiểm tra tuần',
                              points: 120,
                            },
                            'achievement_share'
                          )
                        }
                      >
                        <span className="text-xl" aria-hidden>🏅</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Chia sẻ thành tích (mẫu)</span>
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="chat-composer-divider" aria-hidden />
                <div className="chat-composer-input-wrap">
                  <input
                    type="text"
                    className="chat-composer-input"
                    placeholder={needsJoin ? 'Tham gia phòng để nhắn tin…' : 'Nhập tin nhắn… (@để gắn thẻ)'}
                    value={draft}
                    onChange={onDraftChange}
                    disabled={needsJoin}
                    aria-label="Nội dung tin nhắn"
                    autoComplete="off"
                  />
                  {mentionOpen && !needsJoin && mentionCandidates.length > 0 ? (
                    <ul className="chat-composer-mention-list" role="listbox" aria-label="Gợi ý thành viên">
                      {mentionCandidates.map((mem) => {
                        const un = mem.username ?? mem.Username ?? '';
                        const dn = mem.displayName ?? mem.DisplayName ?? '';
                        return (
                          <li key={String(mem.userId ?? mem.UserId ?? un)}>
                            <button
                              type="button"
                              className="chat-composer-mention-item"
                              role="option"
                              onClick={() => pickMention(un)}
                            >
                              <span className="chat-composer-mention-user">@{un}</span>
                              {dn ? <span className="chat-composer-mention-name">{dn}</span> : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
                <button
                  type="submit"
                  className="chat-composer-send"
                  aria-label="Gửi"
                  disabled={needsJoin || (!draft.trim() && !pendingMedia)}
                >
                  <Send size={17} strokeWidth={2.25} aria-hidden />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </YumeChatLayout>
  );
}
