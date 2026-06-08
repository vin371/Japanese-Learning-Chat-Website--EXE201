import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentUserId } from '../../hooks/useCurrentUserId';
import { useTheme } from '../../hooks/useTheme';
import { ROUTES } from '../../data/routes';
import { notifyChatInboxRevised } from '../../hooks/useChatUnreadTotal';
import { chatService } from '../../services/chatService';
import { socialService } from '../../services/socialService';
import { ChatShellProvider } from '../../context/ChatShellProvider';
import { useChatShell } from '../../hooks/useChatShell';
import { SakuraRainLayer } from '../effects/SakuraRainLayer';
import { AnimatedThemeToggler } from '../../ui/animated-theme-toggler';
import { User, LogOut, BellPlus, BookText, MessageCircle, Moon, Sun, Settings, NotepadText, House, MessageSquare, Search } from 'lucide-react';
import yumeLogo from '../../assets/yume-logo.png';


/** Alias để ESLint nhận diện biến dùng qua JSX (giống SakuraRainLayer). */
const Motion = motion;

function safeArray(val) {
  return Array.isArray(val) ? val : [];
}

function initialsFromName(name) {
  if (!name || typeof name !== 'string') return ['?', '?', '?'];
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 3) {
    return [parts[0][0], parts[1][0], parts[2][0]].map((c) => c.toUpperCase());
  }
  if (parts.length === 2) {
    return [parts[0][0], parts[1][0]].map((c) => c.toUpperCase());
  }
  const w = parts[0] || 'A';
  return [w[0], w[w.length - 1] || w[0]].map((c) => c.toUpperCase());
}

function formatRelativeShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(diff / 3600000);
  if (hours >= 1) return `${hours}h`;
  const mins = Math.floor(diff / 60000);
  if (mins >= 1) return `${mins}m`;
  return 'mới';
}

/** Khớp backend OnlinePresenceRules.StaleAfterSeconds — chỉ online khi vừa có heartbeat gần đây. */
const PRESENCE_TTL_MS = 120_000;

function isPresenceOnline(row) {
  const raw = row?.isOnline ?? row?.IsOnline;
  const st = String(row?.presenceStatus ?? row?.PresenceStatus ?? '').toLowerCase();
  if (raw === true || st === 'online') return true;
  if (raw === false || st === 'offline' || st === 'away') return false;
  const lastSeen = row?.lastSeenAt ?? row?.LastSeenAt;
  const t = lastSeen ? new Date(lastSeen).getTime() : NaN;
  return Number.isFinite(t) && Date.now() - t <= PRESENCE_TTL_MS;
}

function IconUserPlus({ className }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function IconUsersGroupPlus({ className }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function IconSearch({ className }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

const DEMO_GROUPS_VISUAL = [
  {
    id: 'demo-g1',
    name: 'Nhóm ABC',
    memberCount: 3,
    initials: ['H', 'B', 'P'],
    timeLabel: '9d',
    isPlaceholder: true,
  },
  {
    id: 'demo-g2',
    name: 'Nhóm XYZ',
    memberCount: 5,
    initials: ['X', 'Y', 'Z'],
    timeLabel: '2d',
    isPlaceholder: true,
  },
];

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string | number | null} [props.selectedRoomId]
 * @param {'full' | 'lobby'} [props.variant] — `lobby`: chỉ cột giữa (sảnh /chat), không sidebar trái/phải
 */
export function YumeChatLayout({ children, selectedRoomId = null, variant = 'full' }) {
  return (
    <ChatShellProvider>
      <YumeChatLayoutInner variant={variant} selectedRoomId={selectedRoomId}>
        {children}
      </YumeChatLayoutInner>
    </ChatShellProvider>
  );
}

function YumeChatLayoutInner({ children, selectedRoomId = null, variant = 'full' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isChatLobby = /^\/chat\/?$/.test(location.pathname);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    rightPanelOpen,
    setRightPanelOpen,
    closeRightPanel,
    roomSummary,
    inboxRevision,
    bumpInboxRevision,
    directRoomPresence,
    friendsRevision,
  } = useChatShell();

  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [inboxTab, setInboxTab] = useState('all');
  const [listSearch, setListSearch] = useState('');

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupSaving, setGroupSaving] = useState(false);
  const [groupError, setGroupError] = useState('');

  const [friendModalOpen, setFriendModalOpen] = useState(false);
  const [friendModalStep, setFriendModalStep] = useState('search');
  const [friendPick, setFriendPick] = useState(null);
  const [friendIntroText, setFriendIntroText] = useState('Chào bạn ~ Có thể kết bạn được không?..');
  const [friendQuery, setFriendQuery] = useState('');
  const [friendResults, setFriendResults] = useState([]);
  const [friendSearching, setFriendSearching] = useState(false);
  const [friendBusyId, setFriendBusyId] = useState(null);
  const [friendToast, setFriendToast] = useState('');
  const [sidebarNotice, setSidebarNotice] = useState('');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState(null);
  const [requestActionId, setRequestActionId] = useState(null);
  const [invitesModalOpen, setInvitesModalOpen] = useState(false);
  const [inviteTab, setInviteTab] = useState('received');
  const [groupMemberQuery, setGroupMemberQuery] = useState('');
  const [groupMemberIds, setGroupMemberIds] = useState([]);
  const [sidebarRoomMenuId, setSidebarRoomMenuId] = useState(null);
  const [sidebarBusyRoomId, setSidebarBusyRoomId] = useState(null);
  /** 'general' | 'n5' | 'n4' | 'n3' — đang resolve phòng từ API khi chưa có trong inbox */
  const [shortcutBusyKey, setShortcutBusyKey] = useState(null);
  const sidebarListRef = useRef(null);
  const prevSelectedRoomIdRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const mainPaneKey = `${location.pathname}::${selectedRoomId ?? ''}`;

  const convListContainerVariants = useMemo(
    () => ({
      hidden: {},
      visible: {
        transition: {
          staggerChildren: reduceMotion ? 0 : 0.042,
          delayChildren: reduceMotion ? 0 : 0.04,
        },
      },
    }),
    [reduceMotion],
  );

  const convListItemVariants = useMemo(
    () => ({
      hidden: reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
      },
    }),
    [reduceMotion],
  );

  const pathAsideContainerVariants = useMemo(
    () => ({
      hidden: {},
      visible: {
        transition: {
          staggerChildren: reduceMotion ? 0 : 0.08,
          delayChildren: reduceMotion ? 0 : 0.06,
        },
      },
    }),
    [reduceMotion],
  );

  const pathAsideCardVariants = useMemo(
    () => ({
      hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
      },
    }),
    [reduceMotion],
  );

  const displayName = user?.displayName || user?.username || user?.name || user?.email || 'Bạn';
  const handle = user?.username || user?.email?.split('@')[0] || 'user';
  const avatarLetter = (displayName || 'U').slice(0, 1).toUpperCase();
  const myId = useCurrentUserId(user);

  const loadRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const my = await chatService.getMyRooms({ limit: 50 });
      setRooms(safeArray(my));
    } catch {
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  const loadFriends = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) setFriendsLoading(true);
    try {
      const list = await socialService.getFriends();
      setFriends(safeArray(list));
    } catch {
      if (!silent) setFriends([]);
    } finally {
      if (!silent) setFriendsLoading(false);
    }
  }, []);

  const loadIncomingRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const list = await socialService.getIncomingFriendRequests();
      const arr = safeArray(list);
      const pending = arr.filter((r) => {
        const s = String(r.status ?? r.Status ?? 'pending').toLowerCase();
        return s === 'pending' || s === '';
      });
      setIncomingRequests(pending);
    } catch (err) {
      setIncomingRequests([]);
      const noResponse = !err?.response && err?.request;
      const msg =
        err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || noResponse
          ? 'Không kết nối được API (kiểm tra backend đã bật và VITE_API_URL / proxy).'
          : err?.response?.data?.message || err?.message || 'Không tải được lời mời kết bạn.';
      setRequestsError(msg);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const loadOutgoingRequests = useCallback(async () => {
    try {
      const list = await socialService.getOutgoingFriendRequests();
      setOutgoingRequests(safeArray(list));
    } catch {
      setOutgoingRequests([]);
    }
  }, []);

  const goChatLobbyPreservePath = useCallback(() => {
    if (location.pathname.startsWith('/chat/room')) {
      navigate(ROUTES.CHAT);
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!inboxRevision) return;
    loadRooms();
  }, [inboxRevision, loadRooms]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  useEffect(() => {
    if (selectedRoomId == null || String(selectedRoomId).startsWith('demo-')) return;
    void loadFriends({ silent: true });
  }, [selectedRoomId, loadFriends]);

  /** Sau khi presence phòng đổi (ChatRoomPage) — cập nhật chấm xanh danh sách bạn bè. */
  useEffect(() => {
    const fr = friendsRevision ?? 0;
    if (fr < 1) return;
    void loadFriends({ silent: true });
  }, [friendsRevision, loadFriends]);

  /** Làm mới IsOnline của bạn bè (sau khi họ gửi heartbeat). */
  useEffect(() => {
    const t = window.setInterval(() => {
      void loadFriends({ silent: true });
    }, 45_000);
    return () => window.clearInterval(t);
  }, [loadFriends]);

  useEffect(() => {
    loadIncomingRequests();
  }, [loadIncomingRequests]);

  useEffect(() => {
    void loadOutgoingRequests();
  }, [loadOutgoingRequests]);

  useEffect(() => {
    if (!invitesModalOpen) return;
    void loadIncomingRequests();
    void loadOutgoingRequests();
  }, [invitesModalOpen, loadIncomingRequests, loadOutgoingRequests]);

  useEffect(() => {
    if (!groupModalOpen) return;
    void loadFriends();
  }, [groupModalOpen, loadFriends]);

  useEffect(() => {
    closeRightPanel();
  }, [selectedRoomId, closeRightPanel]);

  useEffect(() => {
    if (!userMenuOpen) return undefined;
    function onDocMouseDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [userMenuOpen]);

  useEffect(() => {
    if (sidebarRoomMenuId == null) return undefined;
    function onDocDown(e) {
      if (sidebarListRef.current && !sidebarListRef.current.contains(e.target)) {
        setSidebarRoomMenuId(null);
      }
    }
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [sidebarRoomMenuId]);

  useEffect(() => {
    const prev = prevSelectedRoomIdRef.current;
    const cur = selectedRoomId;
    const switched = prev != null && cur != null && String(prev) !== String(cur);
    if (!switched) {
      prevSelectedRoomIdRef.current = cur ?? null;
      return;
    }

    setRooms((old) =>
      old.map((r) =>
        String(r?.id ?? r?.Id) === String(prev)
          ? { ...r, unreadCount: 0, UnreadCount: 0 }
          : r
      )
    );

    void chatService
      .markRoomRead(prev, null)
      .then(() => {
        bumpInboxRevision?.();
        notifyChatInboxRevised();
        return loadRooms();
      })
      .catch(() => { });

    prevSelectedRoomIdRef.current = cur ?? null;
  }, [selectedRoomId, loadRooms, bumpInboxRevision]);

  const friendOnlineByUserId = useMemo(() => {
    const map = new Map();
    for (const row of friends) {
      const f = row.friend ?? row.Friend;
      const uid = Number(f?.id ?? f?.Id ?? 0);
      if (!uid) continue;
      const online = isPresenceOnline(row);
      map.set(uid, online);
    }
    return map;
  }, [friends]);

  const effectiveFriendOnlineByUserId = useMemo(() => {
    const m = new Map(friendOnlineByUserId);
    const p = directRoomPresence;
    if (p?.peerUserId == null) return m;
    const id = Number(p.peerUserId);
    if (!id) return m;
    if (p.online === true) m.set(id, true);
    else if (p.online === false) m.set(id, false);
    return m;
  }, [friendOnlineByUserId, directRoomPresence]);

  const conversationRows = useMemo(() => {
    const fromApi = rooms.map((r) => {
      const peer = r.peerUser ?? r.PeerUser;
      const rawType = String(r.type || r.Type || '').toLowerCase();
      const isDirect = rawType === 'private';
      const peerUserId = Number(peer?.id ?? peer?.Id ?? 0) || null;
      const peerOnlineFromRoom = Boolean(peer?.isOnline ?? peer?.IsOnline ?? false);
      const isOnline =
        isDirect && peerUserId
          ? Boolean(effectiveFriendOnlineByUserId.get(peerUserId)) || peerOnlineFromRoom
          : false;
      const name =
        isDirect && peer
          ? peer.displayName || peer.DisplayName || peer.username || peer.Username || 'Chat riêng'
          : r.name || r.Name || 'Phòng chat';
      const ini = initialsFromName(name);
      while (ini.length < 3) ini.push('•');
      const last = r.lastMessage ?? r.LastMessage;
      const lastAt = last?.createdAt ?? last?.CreatedAt ?? r.updatedAt ?? r.UpdatedAt ?? r.createdAt ?? r.CreatedAt;
      const lastAtMs = lastAt ? new Date(lastAt).getTime() : 0;
      const unreadCount = Number(r.unreadCount ?? r.UnreadCount ?? 0) || 0;
      const snippet = last?.content ?? last?.Content;
      return {
        id: r.id ?? r.Id,
        name,
        memberCount: r.memberCount ?? r.membersCount ?? r.MembersCount ?? '—',
        initials: ini.slice(0, 3),
        timeLabel: formatRelativeShort(lastAt),
        snippet: snippet ? String(snippet).slice(0, 56) : null,
        isPlaceholder: false,
        isDirect,
        isOnline,
        peerUserId,
        roomType: rawType,
        myRole: r.myRole ?? r.MyRole,
        createdBy: r.createdBy ?? r.CreatedBy,
        unreadCount,
        lastAtMs,
      };
    });
    return fromApi.sort((a, b) => b.lastAtMs - a.lastAtMs);
  }, [rooms, effectiveFriendOnlineByUserId]);

  const visibleConversations = useMemo(() => {
    let rows = conversationRows;
    const q = listSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          String(r.name).toLowerCase().includes(q) ||
          (r.snippet && String(r.snippet).toLowerCase().includes(q))
      );
    }
    if (inboxTab === 'unread') {
      rows = rows.filter((r) => r.unreadCount > 0);
    }
    return rows;
  }, [conversationRows, listSearch, inboxTab]);

  const groupChats = useMemo(() => visibleConversations.filter((g) => !g.isDirect), [visibleConversations]);
  const directChats = useMemo(() => visibleConversations.filter((g) => g.isDirect), [visibleConversations]);

  const pendingOutgoingRequests = useMemo(() => {
    return outgoingRequests.filter((r) => {
      const s = String(r.status ?? r.Status ?? 'pending').toLowerCase();
      return s === 'pending' || s === '';
    });
  }, [outgoingRequests]);

  const friendRows = useMemo(() => {
    return friends
      .map((row) => {
        const f = row.friend ?? row.Friend;
        if (f == null) return null;
        const uid = f?.id ?? f?.Id;
        const friendshipId = row.friendshipId ?? row.FriendshipId ?? uid;
        const uname = f?.username ?? f?.Username ?? '';
        const dname = f?.displayName ?? f?.DisplayName ?? uname;
        const uidNum = Number(uid) || 0;
        const online = uidNum ? Boolean(effectiveFriendOnlineByUserId.get(uidNum)) : isPresenceOnline(row);
        const lastSeen = row.lastSeenAt ?? row.LastSeenAt;
        return {
          key: String(friendshipId ?? uid ?? ''),
          id: uid,
          name: dname || uname || (uid != null ? `User ${uid}` : 'Bạn bè'),
          username: uname,
          online,
          timeLabel: online ? 'online' : formatRelativeShort(lastSeen),
          snippet: online ? 'Đang hoạt động' : 'Offline',
        };
      })
      .filter(Boolean);
  }, [friends, effectiveFriendOnlineByUserId]);

  /** Phím tắt phòng kiểu mock Sakura (cột điều hướng trái). */
  const shortcutRooms = useMemo(() => {
    const groups = conversationRows.filter((r) => !r.isDirect);
    function pick(patterns) {
      for (const r of groups) {
        const n = String(r.name).toLowerCase();
        if (patterns.some((re) => re.test(n))) return r;
      }
      return null;
    }
    return {
      ai: pick([/yume\s*ai|^ai\b|trợ lý|chatbot|bot\b|sakura|assistant/i]),
      n5: pick([/\bn5\b|jlpt\s*n5|phòng\s*n5/i]),
      n4: pick([/\bn4\b|jlpt\s*n4|phòng\s*n4/i]),
      n3: pick([/\bn3\b|jlpt\s*n3|phòng\s*n3/i]),
      general: pick([/chung|general|tổng|lobby|cộng đồng/i]),
    };
  }, [conversationRows]);

  const assistantRowForList = useMemo(() => {
    const ai = shortcutRooms.ai;
    if (!ai) return null;
    return visibleConversations.find((r) => String(r.id) === String(ai.id)) ?? null;
  }, [shortcutRooms.ai, visibleConversations]);

  const groupChatsRoomsOnly = useMemo(
    () =>
      groupChats.filter((g) => !assistantRowForList || String(g.id) !== String(assistantRowForList.id)),
    [groupChats, assistantRowForList]
  );

  const friendsForGroupPick = useMemo(() => {
    const q = groupMemberQuery.trim().toLowerCase();
    if (!q) return friendRows;
    return friendRows.filter(
      (f) => f.name.toLowerCase().includes(q) || String(f.username || '').toLowerCase().includes(q)
    );
  }, [friendRows, groupMemberQuery]);

  function goRoom(roomId) {
    if (roomId == null || String(roomId).startsWith('demo-')) return;
    navigate(`/chat/room/${roomId}`);
  }

  const goShortcutKind = useCallback(
    async (kind) => {
      const row = shortcutRooms[kind];
      if (row && !row.isPlaceholder) {
        goRoom(row.id);
        return;
      }
      setShortcutBusyKey(kind);
      try {
        const [pubs, levels] = await Promise.all([
          chatService.getPublicRooms({ type: 'public', limit: 80 }),
          chatService.getPublicRooms({ type: 'level', limit: 80 }),
        ]);
        const all = [...safeArray(pubs), ...safeArray(levels)];
        const slugMap = {
          general: ['common', 'general'],
          n5: ['level-n5'],
          n4: ['level-n4'],
          n3: ['level-n3'],
        };
        const wantSlugs = slugMap[kind];
        let found =
          wantSlugs &&
          all.find((r) => {
            const slug = String(r.slug ?? r.Slug ?? '').toLowerCase();
            return wantSlugs.some((s) => slug === s);
          });
        if (!found && kind === 'general') {
          found = all.find((r) =>
            /phòng\s*chung|^\s*chung\s*$|cộng\s*đồng/i.test(String(r.name ?? r.Name ?? ''))
          );
        }
        if (!found && (kind === 'n5' || kind === 'n4' || kind === 'n3')) {
          const re = new RegExp(`\\b${kind}\\b`, 'i');
          found = all.find((r) => re.test(String(r.name ?? r.Name ?? '')));
        }
        const id = found?.id ?? found?.Id;
        if (id != null) {
          await chatService.joinRoom(id);
          notifyChatInboxRevised();
          await loadRooms();
          navigate(`/chat/room/${id}`);
          return;
        }
      } catch {
        /* noop */
      } finally {
        setShortcutBusyKey(null);
      }
      navigate(ROUTES.CHAT);
    },
    [shortcutRooms, navigate, loadRooms]
  );

  function handleCreateChat() {
    navigate(ROUTES.CHAT);
  }

  function openGroupModal() {
    setGroupError('');
    setGroupMemberQuery('');
    setGroupMemberIds([]);
    setGroupModalOpen(true);
  }

  function toggleGroupMember(uid) {
    if (uid == null || uid === '') return;
    const n = Number(uid);
    if (Number.isNaN(n)) return;
    setGroupMemberIds((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    const name = groupName.trim();
    if (!name) {
      setGroupError('Nhập tên nhóm.');
      return;
    }
    setGroupSaving(true);
    setGroupError('');
    try {
      const room = await chatService.createRoom({
        name,
        type: 'group',
        maxMembers: 50,
        initialMemberIds: groupMemberIds.length > 0 ? groupMemberIds : undefined,
      });
      const rid = room?.id ?? room?.Id;
      setGroupModalOpen(false);
      setGroupName('');
      setGroupMemberIds([]);
      setGroupMemberQuery('');
      await loadRooms();
      if (rid != null) navigate(`/chat/room/${rid}`);
    } catch (err) {
      setGroupError(err?.response?.data?.message || err?.message || 'Không tạo được nhóm.');
    } finally {
      setGroupSaving(false);
    }
  }

  function openFriendModal() {
    setFriendModalStep('search');
    setFriendPick(null);
    setFriendIntroText('Chào bạn ~ Có thể kết bạn được không?..');
    setFriendToast('');
    setFriendResults([]);
    setFriendQuery('');
    setFriendModalOpen(true);
  }

  function closeInvitesModal() {
    setInvitesModalOpen(false);
  }

  function closeFriendModal() {
    setFriendModalOpen(false);
    setFriendModalStep('search');
    setFriendPick(null);
    setFriendToast('');
    setFriendResults([]);
  }

  useEffect(() => {
    if (!sidebarNotice) return undefined;
    const t = window.setTimeout(() => setSidebarNotice(''), 4000);
    return () => window.clearTimeout(t);
  }, [sidebarNotice]);

  function selectUserForFriendStep(u) {
    const id = u?.id ?? u?.Id;
    if (id == null) return;
    if (myId != null && String(id) === String(myId)) return;
    const un = u?.username ?? u?.Username ?? '';
    const dn = u?.displayName ?? u?.DisplayName ?? un;
    setFriendPick({ id, username: un, displayName: dn });
    setFriendModalStep('confirm');
    setFriendToast('');
  }

  async function searchFriends() {
    const q = friendQuery.trim();
    if (q.length < 1) {
      setFriendResults([]);
      setFriendToast('');
      return;
    }
    setFriendSearching(true);
    setFriendToast('');
    try {
      const hits = safeArray(await socialService.searchUsers(q, 15));
      setFriendResults(hits);
      if (hits.length === 1) {
        selectUserForFriendStep(hits[0]);
      } else {
        setFriendModalStep('search');
        setFriendPick(null);
      }
    } catch {
      setFriendResults([]);
    } finally {
      setFriendSearching(false);
    }
  }

  async function sendRequestToUser(targetId) {
    if (targetId == null || (myId != null && String(targetId) === String(myId))) return;
    setFriendBusyId(targetId);
    setFriendToast('');
    try {
      await socialService.sendFriendRequest(targetId);
      closeFriendModal();
      setSidebarNotice('Đã gửi lời mời kết bạn.');
      void loadOutgoingRequests();
    } catch (err) {
      setFriendToast(err?.response?.data?.message || err?.message || 'Không gửi được lời mời.');
    } finally {
      setFriendBusyId(null);
    }
  }

  async function acceptRequest(requestId) {
    if (requestId == null) return;
    setRequestActionId(requestId);
    try {
      await socialService.acceptFriendRequest(requestId);
      await Promise.all([loadFriends(), loadIncomingRequests(), loadOutgoingRequests()]);
    } catch (err) {
      window.alert(err?.response?.data?.message || err?.message || 'Không chấp nhận được.');
    } finally {
      setRequestActionId(null);
    }
  }

  async function rejectRequest(requestId) {
    if (requestId == null) return;
    setRequestActionId(requestId);
    try {
      await socialService.rejectFriendRequest(requestId);
      await Promise.all([loadIncomingRequests(), loadOutgoingRequests()]);
    } catch (err) {
      window.alert(err?.response?.data?.message || err?.message || 'Không từ chối được.');
    } finally {
      setRequestActionId(null);
    }
  }

  async function cancelOutgoingRequest(requestId) {
    if (requestId == null) return;
    setRequestActionId(requestId);
    try {
      await socialService.cancelFriendRequest(requestId);
      await loadOutgoingRequests();
    } catch (err) {
      window.alert(err?.response?.data?.message || err?.message || 'Không thu hồi được lời mời.');
    } finally {
      setRequestActionId(null);
    }
  }

  async function openDirectChat(peerUserId) {
    if (peerUserId == null) return;
    try {
      const room = await chatService.getOrCreateDirect(peerUserId);
      const rid = room?.id ?? room?.Id;
      if (rid != null) {
        closeFriendModal();
        navigate(`/chat/room/${rid}`);
      }
    } catch (err) {
      setFriendToast(err?.response?.data?.message || err?.message || 'Không mở được chat riêng.');
    }
  }

  function leaveLabelForRoomType(rt) {
    const t = String(rt || '').toLowerCase();
    if (t === 'private') return 'Rời cuộc trò chuyện';
    if (t === 'group') return 'Rời nhóm';
    return 'Rời phòng';
  }

  async function handleSidebarLeaveRoom(roomId, g) {
    if (roomId == null || g?.isPlaceholder) return;
    const isPrivate = String(g.roomType || '').toLowerCase() === 'private';
    const msg = isPrivate
      ? 'Rời cuộc trò chuyện này? Bạn có thể mở lại sau.'
      : 'Rời phòng / nhóm? Với phòng công khai bạn có thể tham gia lại bất cứ lúc nào.';
    if (!window.confirm(msg)) return;
    setSidebarBusyRoomId(roomId);
    setSidebarRoomMenuId(null);
    try {
      await chatService.leaveRoom(roomId);
      await loadRooms();
      notifyChatInboxRevised();
      if (selectedRoomId != null && String(selectedRoomId) === String(roomId)) {
        navigate(ROUTES.CHAT);
      }
    } catch (err) {
      window.alert(err?.response?.data?.message || err?.message || 'Không rời được phòng.');
    } finally {
      setSidebarBusyRoomId(null);
    }
  }

  async function handleSidebarDeleteGroup(roomId) {
    if (roomId == null) return;
    if (!window.confirm('Xóa nhóm cho tất cả thành viên? Hành động này không hoàn tác.')) return;
    setSidebarBusyRoomId(roomId);
    setSidebarRoomMenuId(null);
    try {
      await chatService.deleteRoom(roomId);
      await loadRooms();
      notifyChatInboxRevised();
      if (selectedRoomId != null && String(selectedRoomId) === String(roomId)) {
        navigate(ROUTES.CHAT);
      }
    } catch (err) {
      window.alert(
        err?.response?.data?.message ||
        err?.message ||
        (err?.response?.status === 403
          ? 'Chỉ admin hoặc người tạo nhóm mới có thể xóa nhóm.'
          : 'Không xóa được nhóm.')
      );
    } finally {
      setSidebarBusyRoomId(null);
    }
  }

  function renderConvListItems(rows, { showMenu = false } = {}) {
    const clean = (rows || []).filter((g) => g != null && g.id != null && !g.isPlaceholder);
    return clean.map((g) => {
      const active = selectedRoomId != null && String(selectedRoomId) === String(g.id);
      const useMenu = showMenu && !g.isPlaceholder;
      const busy = sidebarBusyRoomId != null && String(sidebarBusyRoomId) === String(g.id);
      const menuOpen = useMenu && sidebarRoomMenuId != null && String(sidebarRoomMenuId) === String(g.id);
      const rowBtn = (
        <button
          type="button"
          className={`relative flex flex-row items-center w-full px-4 py-[0.85rem] gap-[0.85rem] text-left rounded-xl transition-colors hover:bg-rose-600/5 dark:hover:bg-rose-500/10 ${active ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}`}
          onClick={() => goRoom(g.id)}
          disabled={g.isPlaceholder}
          title={g.isPlaceholder ? 'Tham gia phòng từ server để mở chat' : undefined}
        >
          {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-[#dc143c] dark:bg-[#ff4d6d]" aria-hidden="true" />}
          <div className="relative flex shrink-0" aria-hidden>
            {g.isDirect ? (
              <>
                <span className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold">{g.initials[0]}</span>
                {g.isOnline ? <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-[2.5px] border-white dark:border-slate-900 z-10" title="Đang hoạt động" /> : null}
              </>
            ) : (
              g.initials.slice(0, 3).map((ch, i) => (
                <span key={`${g.id}-av-${i}`} className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold -ml-2 first:ml-0 ring-2 ring-white dark:ring-slate-900">
                  {ch}
                </span>
              ))
            )}
          </div>
          <div className="flex-1 flex flex-col min-w-0 gap-1">
            <div className="flex justify-between items-baseline w-full">
              <span className="font-bold text-[0.95rem] text-slate-800 dark:text-slate-100 truncate">{g.name}</span>
              <span className="text-[0.72rem] shrink-0 ml-2 text-slate-500 dark:text-slate-400">{g.timeLabel}</span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="text-[0.85rem] text-slate-500 dark:text-slate-400 truncate flex-1">
                {g.snippet ||
                  (typeof g.memberCount === 'number' ? `${g.memberCount} thành viên` : `${g.memberCount ?? '—'} thành viên`)}
              </span>
              {g.unreadCount > 0 && (
                <span className="bg-[#dc143c] text-white text-[0.68rem] font-bold px-1.5 rounded-full ml-2" title={`${g.unreadCount} chưa đọc`}>
                  {g.unreadCount > 99 ? '99+' : g.unreadCount}
                </span>
              )}
            </div>
          </div>
        </button>
      );

      return (
        <Motion.li key={g.id} variants={convListItemVariants}>
          {useMenu ? (
            <div className="moji-chat__conv-li-inner">
              {rowBtn}
              <div className="moji-chat__conv-menu-wrap">
                <button
                  type="button"
                  className={`moji-chat__conv-menu-trigger ${menuOpen ? 'moji-chat__conv-menu-trigger--open' : ''}`}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label={`Tùy chọn ${g.name}`}
                  disabled={busy}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSidebarRoomMenuId((prev) => (prev === g.id ? null : g.id));
                  }}
                >
                  ⋮
                </button>
                {menuOpen ? (
                  <div className="moji-chat__conv-menu-dropdown" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      className="moji-chat__room-menu-item"
                      onClick={() => void handleSidebarLeaveRoom(g.id, g)}
                    >
                      {leaveLabelForRoomType(g.roomType)}
                    </button>
                    {g.roomType === 'group' ? (
                      <button
                        type="button"
                        role="menuitem"
                        className="moji-chat__room-menu-item moji-chat__room-menu-item--danger"
                        onClick={() => void handleSidebarDeleteGroup(g.id)}
                      >
                        Xóa nhóm
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            rowBtn
          )}
        </Motion.li>
      );
    });
  }

  function primaryLobbyActive() {
    return isChatLobby && (selectedRoomId == null || selectedRoomId === '');
  }

  function primaryItemActive(row) {
    return (
      row &&
      !row.isPlaceholder &&
      selectedRoomId != null &&
      String(selectedRoomId) === String(row.id)
    );
  }

  function primaryUnreadPill(row) {
    if (!row || !row.unreadCount) return null;
    const n = row.unreadCount > 99 ? '99+' : row.unreadCount;
    return (
      <span className="moji-chat__primary-item-pill" title={`${row.unreadCount} chưa đọc`}>
        {n}
      </span>
    );
  }

  const roleHint =
    String(user?.roleName ?? user?.RoleName ?? user?.role ?? user?.Role ?? '')
      .trim() || 'Học viên';

  const isLobbySolo = variant === 'lobby';

  return (
    <div className={`moji-chat ${isLobbySolo ? 'moji-chat--lobby-solo' : 'moji-chat--sakura-3col'}`}>
      {!isLobbySolo ? (
        <>
          <aside className="flex flex-col shrink-0 w-[min(300px,100%)] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" aria-label="Điều hướng và hội thoại">

            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
              <AnimatePresence mode="wait">
                <Motion.div
                  key="nav-messages"
                  className="flex flex-col p-4 gap-4"
                  initial={reduceMotion ? false : { opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex flex-col gap-1 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="overflow-x-hidden overflow-y-visible">
                      <ul className="flex flex-col gap-1">
                        <li>
                          <button
                            type="button"
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-semibold text-sm ${primaryLobbyActive() ? 'bg-gradient-to-r from-[#c41e4a] to-[#7f1430] text-white shadow-md shadow-rose-900/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                            onClick={goChatLobbyPreservePath}
                          >
                            <span className="opacity-70" aria-hidden>
                              <House size={18} />
                            </span>
                            <span>Sảnh chat</span>
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-semibold text-sm ${primaryItemActive(shortcutRooms.n5) ? 'bg-gradient-to-r from-[#c41e4a] to-[#7f1430] text-white shadow-md shadow-rose-900/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                            onClick={() => goShortcutKind('n5')}
                            disabled={shortcutBusyKey != null}
                            aria-busy={shortcutBusyKey === 'n5'}
                          >
                            <span className="font-bold text-xs tracking-wider opacity-70" aria-hidden>
                              N5
                            </span>
                            <span>Phòng N5</span>
                            {primaryUnreadPill(shortcutRooms.n5)}
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-semibold text-sm ${primaryItemActive(shortcutRooms.n4) ? 'bg-gradient-to-r from-[#c41e4a] to-[#7f1430] text-white shadow-md shadow-rose-900/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                            onClick={() => goShortcutKind('n4')}
                            disabled={shortcutBusyKey != null}
                            aria-busy={shortcutBusyKey === 'n4'}
                          >
                            <span className="font-bold text-xs tracking-wider opacity-70" aria-hidden>
                              N4
                            </span>
                            <span>Phòng N4</span>
                            {primaryUnreadPill(shortcutRooms.n4)}
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-semibold text-sm ${primaryItemActive(shortcutRooms.n3) ? 'bg-gradient-to-r from-[#c41e4a] to-[#7f1430] text-white shadow-md shadow-rose-900/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                            onClick={() => goShortcutKind('n3')}
                            disabled={shortcutBusyKey != null}
                            aria-busy={shortcutBusyKey === 'n3'}
                          >
                            <span className="font-bold text-xs tracking-wider opacity-70" aria-hidden>
                              N3
                            </span>
                            <span>Phòng N3</span>
                            {primaryUnreadPill(shortcutRooms.n3)}
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-semibold text-sm ${primaryItemActive(shortcutRooms.general) ? 'bg-gradient-to-r from-[#c41e4a] to-[#7f1430] text-white shadow-md shadow-rose-900/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                            onClick={() => goShortcutKind('general')}
                            disabled={shortcutBusyKey != null}
                            aria-busy={shortcutBusyKey === 'general'}
                          >
                            <span className="opacity-70" aria-hidden>
                              <MessageSquare size={18} />
                            </span>
                            <span>Phòng chung</span>
                            {primaryUnreadPill(shortcutRooms.general)}
                          </button>
                        </li>
                      </ul>
                    </div>
                    <div className="mt-2 shrink-0">
                      <button type="button" className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-colors" onClick={handleCreateChat}>
                        + Tin nhắn mới
                      </button>
                    </div>
                  </div>

                  <h2 className="font-sans font-bold text-[1.25rem] tracking-[0.05em] uppercase mt-2 mb-4 text-slate-800 dark:text-slate-200">Tin nhắn</h2>
                  {sidebarNotice ? (
                    <div className="p-3 mb-4 text-sm font-semibold text-rose-800 bg-rose-50 rounded-xl dark:bg-rose-900/20 dark:text-rose-200" role="status">
                      {sidebarNotice}
                    </div>
                  ) : null}
                  <div className="mb-4">
                    <div className="flex items-center h-[42px] px-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-full transition-colors focus-within:border-rose-500/50 focus-within:ring-2 focus-within:ring-rose-500/20">
                      <span className="flex items-center justify-center text-slate-400 mr-2" aria-hidden>
                        <Search size={18} />
                      </span>
                      <input
                        type="search"
                        className="flex-1 bg-transparent border-none outline-none text-[0.9rem] text-slate-800 dark:text-slate-200 placeholder-slate-400"
                        placeholder="Tìm hội thoại…"
                        value={listSearch}
                        onChange={(e) => setListSearch(e.target.value)}
                        aria-label="Tìm hội thoại"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={inboxTab === 'all'}
                      className={`px-4 py-1.5 rounded-full text-[0.8rem] font-bold tracking-wide transition-colors border ${inboxTab === 'all' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                      onClick={() => setInboxTab('all')}
                    >
                      Tất cả
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={inboxTab === 'unread'}
                      className={`px-4 py-1.5 rounded-full text-[0.8rem] font-bold tracking-wide transition-colors border ${inboxTab === 'unread' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                      onClick={() => setInboxTab('unread')}
                    >
                      Chưa đọc
                    </button>
                  </div>
                  <div ref={sidebarListRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {roomsLoading ? (
                      <ul className="flex flex-col gap-0.5" aria-hidden>
                        {[1, 2, 3, 4].map((k) => (
                          <li key={k} className="flex gap-3 px-4 py-3 items-center w-full animate-pulse opacity-60">
                            <span className="w-[44px] h-[44px] rounded-full bg-slate-200 dark:bg-slate-700/50 shrink-0" />
                            <span className="flex-1 flex flex-col gap-2">
                              <span className="h-3.5 bg-slate-200 dark:bg-slate-700/50 rounded w-full" />
                              <span className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-2/3" />
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-col gap-6">
                        {assistantRowForList ? (
                          <section className="flex flex-col" aria-labelledby="moji-sec-assistant">
                            <div className="flex justify-between items-center px-4 py-1 mb-1">
                              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" id="moji-sec-assistant">
                                TRỢ LÝ
                              </h3>
                            </div>
                            <Motion.ul
                              className="flex flex-col gap-0.5"
                              variants={convListContainerVariants}
                              initial={reduceMotion ? false : 'hidden'}
                              animate={reduceMotion ? false : 'visible'}
                            >
                              {renderConvListItems([assistantRowForList], { showMenu: true })}
                            </Motion.ul>
                          </section>
                        ) : null}
                        <section className="flex flex-col" aria-labelledby="moji-sec-friends">
                          <div className="flex justify-between items-center px-4 py-1 mb-1">
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" id="moji-sec-friends">
                              BẠN BÈ
                            </h3>
                            <button
                              type="button"
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20"
                              title="Lời mời kết bạn"
                              aria-label="Lời mời kết bạn"
                              onClick={() => setInvitesModalOpen(true)}
                            >
                              <IconUserPlus size={16} />
                            </button>
                          </div>
                          {directChats.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 px-4 py-3 italic text-center bg-slate-50 dark:bg-slate-800/20 rounded-xl mx-2 border border-dashed border-slate-200 dark:border-slate-800">
                              {inboxTab === 'unread' ? 'Không có chat riêng chưa đọc.' : 'Chưa có cuộc trò chuyện riêng.'}
                            </p>
                          ) : (
                            <Motion.ul
                              className="flex flex-col gap-0.5"
                              variants={convListContainerVariants}
                              initial={reduceMotion ? false : 'hidden'}
                              animate={reduceMotion ? false : 'visible'}
                            >
                              {renderConvListItems(directChats)}
                            </Motion.ul>
                          )}
                        </section>
                      </div>
                    )}
                  </div>
                </Motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-between items-center p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <button
                type="button"
                className="flex flex-col items-center justify-center w-[4.5rem] h-14 rounded-xl transition-colors text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20"
                onClick={goChatLobbyPreservePath}
              >
                <span className="mb-0.5 opacity-90" aria-hidden>
                  <MessageCircle size={20} />
                </span>
                <span className="text-[0.65rem] font-bold">Tin nhắn</span>
              </button>
              <AnimatedThemeToggler
                className="flex flex-col items-center justify-center w-[4.5rem] h-14 rounded-xl transition-colors text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
                aria-label="Chuyển sáng/tối"
              >
                <span className="mb-0.5 opacity-80" aria-hidden>
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </span>
                <span className="text-[0.65rem] font-medium">Giao diện</span>
              </AnimatedThemeToggler>
              <div className="relative" ref={menuRef}>
                <button type="button" className="flex flex-col items-center justify-center w-[4.5rem] h-14 rounded-xl transition-colors text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800" title="Cài đặt" onClick={() => setUserMenuOpen((o) => !o)}>
                  <span className="mb-0.5 opacity-80" aria-hidden>
                    <Settings size={20} />
                  </span>
                  <span className="text-[0.65rem] font-medium">Cài đặt</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute bottom-[4.5rem] right-0 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 p-2 z-50 flex flex-col origin-bottom-right animate-in fade-in zoom-in-95 duration-150" role="menu">
                    <div className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-700 mb-2">
                      <span className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg shrink-0">{avatarLetter}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{displayName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">@{handle}</div>
                      </div>
                    </div>
                    <button type="button" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" role="menuitem">
                      <span className="opacity-70" aria-hidden>
                        <User size={18} />
                      </span>
                      Tài khoản
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setInvitesModalOpen(true);
                      }}
                    >
                      <span className="opacity-70 relative" aria-hidden>
                        <BellPlus size={18} />
                        {incomingRequests.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />}
                      </span>
                      Lời mời kết bạn
                      {incomingRequests.length > 0 ? ` (${incomingRequests.length})` : ''}
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-1"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                        navigate(ROUTES.LOGIN);
                      }}
                    >
                      <span className="opacity-70" aria-hidden>
                        <LogOut size={18} />
                      </span>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-center items-center gap-2 py-2.5 text-[0.75rem] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/50">
              <button type="button" className="hover:text-slate-800 dark:hover:text-slate-200 hover:underline transition-colors" onClick={() => navigate(ROUTES.LEARN)}>
                Học tập
              </button>
              <span className="opacity-50" aria-hidden>
                ·
              </span>
              <button type="button" className="hover:text-slate-800 dark:hover:text-slate-200 hover:underline transition-colors" onClick={() => navigate(ROUTES.ACCOUNT)}>
                Tài khoản
              </button>
            </div>
          </aside>
        </>
      ) : null}

      <section className={`moji-chat__main ${isLobbySolo ? 'moji-chat__main--solo' : ''}`}>
        {!isLobbySolo ? (
          <div className="moji-chat__main-sakura-wrap" aria-hidden>
            <div className="moji-chat__main-sakura moji-chat__main-sakura--far">
              <SakuraRainLayer petalCount={14} />
            </div>
            <div className="moji-chat__main-sakura moji-chat__main-sakura--mid">
              <SakuraRainLayer petalCount={22} buoyant />
            </div>
          </div>
        ) : null}
        <div className="moji-chat__main-surface">
          <AnimatePresence mode="wait">
            <Motion.div
              key={mainPaneKey}
              className="moji-chat__main-motion"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -14 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </Motion.div>
          </AnimatePresence>
        </div>
      </section>

      {!isLobbySolo && rightPanelOpen ? (
        <aside className="moji-chat__info-panel moji-chat__info-panel--path" aria-label="Thông tin hội thoại">
          <div className="moji-chat__info-panel-head">
            <h2 className="moji-chat__info-panel-title">Thông tin</h2>
            <button
              type="button"
              className="moji-chat__info-panel-close"
              aria-label="Đóng"
              onClick={() => setRightPanelOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="moji-chat__info-panel-cover">
            <div className="moji-chat__info-panel-avatar">
              {(roomSummary?.letter || roomSummary?.title || '?').toString().slice(0, 1).toUpperCase()}
            </div>
            <div className="moji-chat__info-panel-names">
              <div className="moji-chat__info-panel-name">{roomSummary?.title || `Hội thoại #${selectedRoomId}`}</div>
              <div className="moji-chat__info-panel-sub">{roomSummary?.subtitle || 'YumeGo-ji chat'}</div>
            </div>
          </div>
          <ul className="moji-chat__info-panel-sections">
            <li className="moji-chat__info-muted">Ảnh / file đã gửi — sắp có khi backend hỗ trợ.</li>
            <li className="moji-chat__info-muted">Link đã chia sẻ — sắp có.</li>
          </ul>
          <div className="moji-chat__info-panel-actions">
            <button type="button" className="moji-chat__info-action-btn" disabled>
              Ghim hội thoại
            </button>
            <button type="button" className="moji-chat__info-action-btn" disabled>
              Tắt thông báo
            </button>
          </div>
        </aside>
      ) : !isLobbySolo ? (
        <aside className="moji-chat__path-aside" aria-label="Tiến độ và tài liệu">
          <Motion.div
            className="moji-chat__path-aside-motion"
            variants={pathAsideContainerVariants}
            initial={reduceMotion ? false : 'hidden'}
            animate={reduceMotion ? false : 'visible'}
          >
            <Motion.div className="moji-chat__path-card moji-chat__path-card--profile" variants={pathAsideCardVariants}>
              <div className="moji-chat__path-profile-avatar" aria-hidden>
                {avatarLetter}
              </div>
              <div className="moji-chat__path-profile-body">
                <div className="moji-chat__path-profile-name">{displayName}</div>
                <div className="moji-chat__path-profile-role">{roleHint}</div>
                <p className="moji-chat__path-profile-tag">Lộ trình JLPT trên YumeGo-ji</p>
              </div>
              <button type="button" className="moji-chat__path-pill-btn" onClick={() => navigate(ROUTES.LEARN)}>
                Ôn bài trên Học tập
              </button>
            </Motion.div>
            <Motion.div className="moji-chat__path-card" variants={pathAsideCardVariants}>
              <div className="moji-chat__path-card-head">
                <span className="moji-chat__path-card-title">Tiến độ gợi ý</span>
                <span className="moji-chat__path-card-meta">minh họa</span>
              </div>
              <div className="moji-chat__path-progress-num">68%</div>
              <div className="moji-chat__path-progress-bar" role="presentation">
                <span className="moji-chat__path-progress-fill" style={{ width: '68%' }} />
              </div>
              <p className="moji-chat__path-card-desc">Tiếp tục hội thoại và phòng level để tăng độ nói và nghe.</p>
            </Motion.div>
            <Motion.div className="moji-chat__path-card" variants={pathAsideCardVariants}>
              <div className="moji-chat__path-card-head">
                <span className="moji-chat__path-card-title">Tài liệu nhanh</span>
                <button type="button" className="moji-chat__path-text-link" onClick={() => navigate(ROUTES.LEARN)}>
                  Xem tất cả
                </button>
              </div>
              <div className="moji-chat__path-materials">
                <button type="button" className="moji-chat__path-material-tile" onClick={() => navigate(ROUTES.LEARN)}>
                  <span className="moji-chat__path-material-ico" aria-hidden>
                    <NotepadText />
                  </span>
                  <span className="moji-chat__path-material-name">Bảng chữ Hiragana</span>
                </button>
                <button type="button" className="moji-chat__path-material-tile" onClick={() => navigate(ROUTES.LEARN)}>
                  <span className="moji-chat__path-material-ico" aria-hidden>
                    <BookText />
                  </span>
                  <span className="moji-chat__path-material-name">Ngữ pháp N5</span>
                </button>
              </div>
            </Motion.div>
            <Motion.div className="moji-chat__path-milestones" variants={pathAsideCardVariants} aria-label="Mốc minh họa">

            </Motion.div>
          </Motion.div>
        </aside>
      ) : null}

      {groupModalOpen && (
        <div
          className="moji-chat__modal-backdrop"
          role="presentation"
          onClick={() => !groupSaving && setGroupModalOpen(false)}
        >
          <div
            className="moji-chat__modal moji-chat__modal--group"
            role="dialog"
            aria-labelledby="moji-group-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="moji-chat__modal-head">
              <h2 id="moji-group-title" className="moji-chat__modal-title">
                Tạo Nhóm Chat Mới
              </h2>
              <button
                type="button"
                className="moji-chat__modal-x"
                aria-label="Đóng"
                disabled={groupSaving}
                onClick={() => setGroupModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <label className="moji-chat__modal-label">
                Tên nhóm
                <input
                  className="moji-chat__modal-input"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Gõ tên nhóm vào đây…"
                  maxLength={120}
                  disabled={groupSaving}
                  autoComplete="off"
                />
              </label>
              <label className="moji-chat__modal-label">
                Mời thành viên
                <input
                  className="moji-chat__modal-input"
                  value={groupMemberQuery}
                  onChange={(e) => setGroupMemberQuery(e.target.value)}
                  placeholder="Tìm theo tên hiển thị…"
                  disabled={groupSaving}
                  autoComplete="off"
                />
              </label>
              <div className="moji-chat__group-member-box">
                {friendsLoading ? (
                  <p className="moji-chat__muted moji-chat__group-member-empty">Đang tải danh sách bạn…</p>
                ) : friendsForGroupPick.length === 0 ? (
                  <p className="moji-chat__muted moji-chat__group-member-empty">Chưa có bạn để mời. Hãy kết bạn trước.</p>
                ) : (
                  <ul className="moji-chat__group-member-list">
                    {friendsForGroupPick.map((f) => {
                      const uid = f.id;
                      const n = Number(uid);
                      const selected = groupMemberIds.includes(n);
                      return (
                        <li key={f.key}>
                          <button
                            type="button"
                            className={`moji-chat__group-member-row ${selected ? 'moji-chat__group-member-row--selected' : ''}`}
                            onClick={() => toggleGroupMember(uid)}
                            disabled={groupSaving}
                          >
                            <span className="moji-chat__group-member-check" aria-hidden>
                              {selected ? '✓' : ''}
                            </span>
                            <span className="moji-chat__group-member-av">{f.name.slice(0, 1).toUpperCase()}</span>
                            <span className="moji-chat__group-member-name">{f.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {groupError && <p className="moji-chat__modal-error">{groupError}</p>}
              <button
                type="submit"
                className="moji-chat__modal-btn moji-chat__modal-btn--primary moji-chat__modal-btn--block moji-chat__modal-btn--gradient"
                disabled={groupSaving}
              >
                <IconUserPlus className="moji-chat__inline-ico" />
                {groupSaving ? 'Đang tạo…' : 'Tạo nhóm'}
              </button>
            </form>
          </div>
        </div>
      )}

      {invitesModalOpen && (
        <div className="moji-chat__modal-backdrop" role="presentation" onClick={closeInvitesModal}>
          <div
            className="moji-chat__modal moji-chat__modal--invites"
            role="dialog"
            aria-labelledby="moji-invites-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="moji-chat__modal-head">
              <h2 id="moji-invites-title" className="moji-chat__modal-title">
                Lời mời kết bạn
              </h2>
              <button type="button" className="moji-chat__modal-x" aria-label="Đóng" onClick={closeInvitesModal}>
                ×
              </button>
            </div>
            <div className="moji-chat__invite-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={inviteTab === 'received'}
                className={`moji-chat__invite-tab ${inviteTab === 'received' ? 'moji-chat__invite-tab--active' : ''}`}
                onClick={() => setInviteTab('received')}
              >
                Đã nhận
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={inviteTab === 'sent'}
                className={`moji-chat__invite-tab ${inviteTab === 'sent' ? 'moji-chat__invite-tab--active' : ''}`}
                onClick={() => setInviteTab('sent')}
              >
                Đã gửi
              </button>
            </div>
            <div className="moji-chat__invite-body">
              {inviteTab === 'received' && requestsLoading && (
                <p className="moji-chat__muted moji-chat__invite-empty">Đang tải…</p>
              )}
              {inviteTab === 'received' && requestsError && (
                <div className="moji-chat__invite-error">
                  <p className="moji-chat__modal-error">{requestsError}</p>
                  <button type="button" className="moji-chat__modal-btn moji-chat__modal-btn--ghost moji-chat__modal-btn--sm" onClick={() => loadIncomingRequests()}>
                    Thử lại
                  </button>
                </div>
              )}
              {inviteTab === 'received' && !requestsLoading && !requestsError && incomingRequests.length === 0 && (
                <p className="moji-chat__muted moji-chat__invite-empty">Không có lời mời chờ xử lý.</p>
              )}
              {inviteTab === 'received' && incomingRequests.length > 0 && (
                <ul className="moji-chat__invite-list">
                  {incomingRequests.map((req) => {
                    const rid = req.id ?? req.Id;
                    const from = req.fromUser ?? req.FromUser;
                    const un = from?.username ?? from?.Username ?? '';
                    const dn = (from?.displayName ?? from?.DisplayName ?? un) || 'Người gửi';
                    const busy = requestActionId === rid;
                    return (
                      <li key={rid} className="moji-chat__invite-item">
                        <div className="moji-chat__invite-user">
                          <span className="moji-chat__invite-av" aria-hidden>
                            {(dn || un).slice(0, 1).toUpperCase()}
                          </span>
                          <div>
                            <div className="moji-chat__invite-name">{dn}</div>
                            <div className="moji-chat__invite-sub">@{un}</div>
                          </div>
                        </div>
                        <div className="moji-chat__invite-actions">
                          <button
                            type="button"
                            className="moji-chat__invite-btn moji-chat__invite-btn--accept"
                            disabled={busy}
                            onClick={() => acceptRequest(rid)}
                          >
                            {busy ? '…' : 'Chấp nhận'}
                          </button>
                          <button
                            type="button"
                            className="moji-chat__invite-btn moji-chat__invite-btn--reject"
                            disabled={busy}
                            onClick={() => rejectRequest(rid)}
                          >
                            Từ chối
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {inviteTab === 'sent' && pendingOutgoingRequests.length === 0 && (
                <p className="moji-chat__muted moji-chat__invite-empty">Bạn chưa gửi lời mời nào đang chờ.</p>
              )}
              {inviteTab === 'sent' && pendingOutgoingRequests.length > 0 && (
                <ul className="moji-chat__invite-list">
                  {pendingOutgoingRequests.map((req) => {
                    const rid = req.id ?? req.Id;
                    const to = req.toUser ?? req.ToUser;
                    const un = to?.username ?? to?.Username ?? '';
                    const dn = (to?.displayName ?? to?.DisplayName ?? un) || 'Người nhận';
                    const busy = requestActionId === rid;
                    return (
                      <li key={rid} className="moji-chat__invite-item">
                        <div className="moji-chat__invite-user">
                          <span className="moji-chat__invite-av" aria-hidden>
                            {(dn || un).slice(0, 1).toUpperCase()}
                          </span>
                          <div>
                            <div className="moji-chat__invite-name">{dn}</div>
                            <div className="moji-chat__invite-sub">@{un}</div>
                          </div>
                        </div>
                        <div className="moji-chat__invite-actions moji-chat__invite-actions--single">
                          <button
                            type="button"
                            className="moji-chat__invite-btn moji-chat__invite-btn--withdraw"
                            disabled={busy}
                            onClick={() => cancelOutgoingRequest(rid)}
                          >
                            {busy ? '…' : 'Thu hồi'}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <button
              type="button"
              className="moji-chat__modal-btn moji-chat__modal-btn--primary moji-chat__modal-btn--block moji-chat__modal-btn--gradient"
              onClick={() => {
                closeInvitesModal();
                openFriendModal();
              }}
            >
              <IconUserPlus className="moji-chat__inline-ico" />
              Kết bạn
            </button>
          </div>
        </div>
      )}

      {friendModalOpen && (
        <div className="moji-chat__modal-backdrop" role="presentation" onClick={closeFriendModal}>
          <div
            className="moji-chat__modal moji-chat__modal--friend"
            role="dialog"
            aria-labelledby="moji-friend-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="moji-chat__modal-head">
              <h2 id="moji-friend-title" className="moji-chat__modal-title">
                Kết Bạn
              </h2>
              <button type="button" className="moji-chat__modal-x" aria-label="Đóng" onClick={closeFriendModal}>
                ×
              </button>
            </div>
            {friendModalStep === 'search' && (
              <>
                <label className="moji-chat__modal-label">
                  Tìm bằng username
                  <input
                    className="moji-chat__modal-input"
                    value={friendQuery}
                    onChange={(e) => setFriendQuery(e.target.value)}
                    placeholder="Gõ tên username vào đây…"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void searchFriends())}
                    autoComplete="off"
                  />
                </label>
                {friendToast && <p className="moji-chat__modal-toast moji-chat__modal-toast--warn">{friendToast}</p>}
                <ul className="moji-chat__modal-user-list">
                  {friendResults.map((u) => {
                    const id = u.id ?? u.Id;
                    const un = u.username ?? u.Username ?? '';
                    const dn = u.displayName ?? u.DisplayName ?? un;
                    const isSelf = myId != null && id != null && String(id) === String(myId);
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          className="moji-chat__modal-pick-row"
                          disabled={isSelf}
                          onClick={() => selectUserForFriendStep(u)}
                        >
                          <div>
                            <div className="moji-chat__modal-user-name">{dn}</div>
                            <div className="moji-chat__modal-user-sub">@{un}</div>
                          </div>
                          {isSelf ? <span className="moji-chat__muted moji-chat__muted--sm">Bạn</span> : <span className="moji-chat__modal-pick-hint">Chọn</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="moji-chat__modal-footer-row">
                  <button type="button" className="moji-chat__modal-btn moji-chat__modal-btn--ghost moji-chat__modal-btn--pill" onClick={closeFriendModal}>
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="moji-chat__modal-btn moji-chat__modal-btn--primary moji-chat__modal-btn--pill moji-chat__modal-btn--gradient"
                    onClick={() => void searchFriends()}
                  >
                    <IconSearch className="moji-chat__inline-ico" />
                    {friendSearching ? '…' : 'Tìm'}
                  </button>
                </div>
              </>
            )}
            {friendModalStep === 'confirm' && friendPick && (
              <>
                <p className="moji-chat__modal-toast moji-chat__modal-toast--success">
                  Tìm thấy @{friendPick.username} rồi nè 🥳
                </p>
                <label className="moji-chat__modal-label">
                  Giới thiệu
                  <textarea
                    className="moji-chat__modal-textarea"
                    rows={3}
                    value={friendIntroText}
                    onChange={(e) => setFriendIntroText(e.target.value)}
                    placeholder="Lời nhắn kèm lời mời (hiển thị trên giao diện — API hiện chỉ gửi lời mời)"
                  />
                </label>
                {friendToast ? <p className="moji-chat__modal-error">{friendToast}</p> : null}
                <div className="moji-chat__modal-footer-row">
                  <button
                    type="button"
                    className="moji-chat__modal-btn moji-chat__modal-btn--ghost moji-chat__modal-btn--pill"
                    onClick={() => {
                      setFriendModalStep('search');
                      setFriendPick(null);
                      setFriendToast('');
                    }}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    className="moji-chat__modal-btn moji-chat__modal-btn--primary moji-chat__modal-btn--pill moji-chat__modal-btn--gradient"
                    disabled={friendBusyId === friendPick.id}
                    onClick={() => void sendRequestToUser(friendPick.id)}
                  >
                    <IconUserPlus className="moji-chat__inline-ico" />
                    {friendBusyId === friendPick.id ? '…' : 'Kết Bạn'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
