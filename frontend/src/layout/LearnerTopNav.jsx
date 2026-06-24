import { useEffect, useMemo, useCallback } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ENV } from '../api/client';
import { userIsPremium } from '../utils/userPremium';
import { useChatUnreadTotal } from '../hooks/useChatUnreadTotal';
import { useTheme } from '../hooks/useTheme';
import { ROUTES } from '../data/routes';
import { getDefaultChatRoomPath } from '../utils/chatRoomAccess';
import { prefetchDefaultChatRoom, prefetchChatRoom } from '../utils/chatRoomPrefetch';
import { MessageCircleMore, ShoppingCart, BookOpenText, Gamepad2 } from 'lucide-react';
import yumeLogo from '../assets/yume-logo.png';
import { AnimatedThemeToggler } from '../ui/animated-theme-toggler';
import UserProfileDropdown from '../ui/user-profile-dropdown';

function initialsFromUser(user, displayName) {
  const n = String(displayName || '').trim();
  if (n.length >= 2) return n.slice(0, 2).toUpperCase();
  const u = user?.username || user?.email || '';
  return String(u).slice(0, 1).toUpperCase() || 'U';
}

function buildAvatarSrc(user) {
  const path = user?.avatarUrl ?? user?.AvatarUrl;
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const origin = ENV.API_URL || '';
  return `${origin}${path}`;
}

/**
 * Thanh trên YumeGo-ji: học viên — Học tập, Trò chơi, Chat; admin — Dashboard + Chat; moderator — Điều hành + Chat.
 */
export function LearnerTopNav() {
  const { user, logout, isAuthenticated } = useAuth();
  const { total: chatUnreadTotal, rooms: chatRooms, refresh: refreshChatUnread } = useChatUnreadTotal(
    !!isAuthenticated
  );
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const chatNavPath = getDefaultChatRoomPath();

  /** Trên nav: không tính unread phòng đang mở (đang xem = đã xử lý UI trong phòng). */
  const navChatUnread = useMemo(() => {
    const m = pathname.match(/^\/chat\/room\/([^/]+)/);
    const activeId = m ? m[1] : null;
    if (!activeId) return chatUnreadTotal;
    const row = chatRooms.find((r) => String(r.id ?? r.Id) === String(activeId));
    const here = Number(row?.unreadCount ?? row?.UnreadCount ?? 0) || 0;
    return Math.max(0, chatUnreadTotal - here);
  }, [pathname, chatUnreadTotal, chatRooms]);

  const displayName = user?.displayName || user?.username || user?.name || user?.email || 'Học viên';
  const initials = initialsFromUser(user, displayName);
  const avatarSrc = isAuthenticated ? buildAvatarSrc(user) : '';
  const xuBalance = Number(user?.xu ?? user?.Xu ?? 0) || 0;
  const roleNorm = String(user?.role ?? user?.Role ?? 'user').toLowerCase();
  const isAdminUser = roleNorm === 'admin';
  const isModeratorUser = roleNorm === 'moderator';
  /** Admin / Moderator: không Học tập / Trò chơi — trang nghiệp vụ + Chat. */
  const staffNav = isAdminUser || isModeratorUser;
  const onStaffWorkspace =
    staffNav &&
    (pathname.startsWith(ROUTES.ADMIN) || pathname.startsWith(ROUTES.MODERATOR));
  const staffHomePath = isAdminUser ? ROUTES.ADMIN : ROUTES.MODERATOR;
  const showVipAvatarFrame = !staffNav && xuBalance >= 100;
  const showPremiumBadge = !staffNav && userIsPremium(user);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const run = () => void prefetchDefaultChatRoom();
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(run, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 800);
    return () => window.clearTimeout(t);
  }, [isAuthenticated]);

  const onChatLinkWarm = useCallback(() => {
    const m = chatNavPath.match(/\/chat\/room\/(\d+)/);
    const id = m?.[1];
    if (id) void prefetchChatRoom(id);
    else void prefetchDefaultChatRoom();
  }, [chatNavPath]);

  return (
    <header className={`sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md${onStaffWorkspace ? ' learner-top-nav--staff-desk' : ''}`}>
      <div className={`w-full max-w-full flex items-center gap-3 px-3 sm:px-6 py-2.5 box-border flex-wrap md:flex-nowrap ${onStaffWorkspace ? 'justify-end' : 'justify-between md:justify-start'}`}>
        {!onStaffWorkspace ? (
        <Link
          to={staffNav ? staffHomePath : ROUTES.LEARN}
          className="flex items-center gap-2 no-underline text-inherit shrink-0 min-w-0"
          aria-label="YumeGo-ji"
        >
          <img src={yumeLogo} alt="" className="h-10 w-auto block rounded-full bg-white border border-slate-100" />
          <span className="font-extrabold text-[1.05rem] tracking-tight text-[#b72025] dark:text-purple-200 hidden min-[520px]:block">YumeGo-ji</span>
        </Link>
        ) : null}

        <div className="flex items-center gap-1.5 ml-auto flex-auto min-w-0 max-w-full justify-end max-md:order-3 max-md:w-full max-md:flex-none max-md:ml-0 max-md:flex-wrap max-md:gap-1.5 max-md:gap-y-2">
          <nav
            className="flex items-center gap-1 flex-auto min-w-0 justify-end flex-nowrap overflow-x-auto overflow-y-visible overscroll-contain pb-1 md:pb-0"
            aria-label={staffNav ? 'Trang nghiệp vụ và trò chuyện' : 'Điều hướng chính'}
          >
            {staffNav ? (
              <>
                {!onStaffWorkspace ? (
                <NavLink
                  to={staffHomePath}
                  end
                  className={({ isActive }) => `inline-flex items-center gap-1.5 px-2.5 md:px-4 py-2 rounded-xl no-underline font-semibold text-[0.92rem] border transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-rose-500/15 text-red-900 border-rose-500/30 dark:bg-purple-500/20 dark:text-yellow-100 dark:border-purple-400/40' 
                      : 'text-slate-700 dark:text-slate-200 border-transparent hover:bg-rose-500/10 hover:text-red-700 dark:hover:text-amber-100 dark:hover:bg-orange-500/20'
                  }`}
                >
                  {isAdminUser ? 'Bảng điều khiển' : 'Điều hành'}
                </NavLink>
                ) : null}
                <NavLink
                  to={chatNavPath}
                  isActive={(_, loc) => loc.pathname.startsWith('/chat')}
                  onMouseEnter={onChatLinkWarm}
                  onFocus={onChatLinkWarm}
                  className={({ isActive }) => `inline-flex items-center gap-1.5 px-2.5 md:px-4 py-2 rounded-xl no-underline font-semibold text-[0.92rem] border transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-rose-500/15 text-red-900 border-rose-500/30 dark:bg-purple-500/20 dark:text-yellow-100 dark:border-purple-400/40' 
                      : 'text-slate-700 dark:text-slate-200 border-transparent hover:bg-rose-500/10 hover:text-red-700 dark:hover:text-amber-100 dark:hover:bg-orange-500/20'
                  }`}
                  aria-label={navChatUnread > 0 ? `Trò chuyện, ${navChatUnread} tin chưa đọc` : undefined}
                >
                  <span className="relative inline-flex items-center justify-center shrink-0">
                    <MessageCircleMore size={20} />
                    {navChatUnread > 0 ? (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-4.5 px-1 box-border rounded-full bg-red-500 text-white text-[0.62rem] font-extrabold flex items-center justify-center pointer-events-none ring-2 ring-white dark:ring-slate-900" title={`${navChatUnread} tin chưa đọc ở phòng khác`}>
                        {navChatUnread > 99 ? '99+' : navChatUnread}
                      </span>
                    ) : null}
                  </span>
                  Trò chuyện
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to={ROUTES.LEARN} className={({ isActive }) => `inline-flex items-center gap-1.5 px-2.5 md:px-4 py-2 rounded-xl no-underline font-semibold text-[0.92rem] border transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-rose-500/15 text-red-900 border-rose-500/30 dark:bg-purple-500/20 dark:text-yellow-100 dark:border-purple-400/40' 
                    : 'text-slate-700 dark:text-slate-200 border-transparent hover:bg-rose-500/10 hover:text-red-700 dark:hover:text-amber-100 dark:hover:bg-orange-500/20'
                }`}>
                  <BookOpenText size={20} />
                  Học tập
                </NavLink>
                <NavLink to={ROUTES.PLAY} className={({ isActive }) => `inline-flex items-center gap-1.5 px-2.5 md:px-4 py-2 rounded-xl no-underline font-semibold text-[0.92rem] border transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-rose-500/15 text-red-900 border-rose-500/30 dark:bg-purple-500/20 dark:text-yellow-100 dark:border-purple-400/40' 
                    : 'text-slate-700 dark:text-slate-200 border-transparent hover:bg-rose-500/10 hover:text-red-700 dark:hover:text-amber-100 dark:hover:bg-orange-500/20'
                }`}>
                  <Gamepad2 size={20} />
                  Trò chơi
                </NavLink>
                <NavLink
                  to={chatNavPath}
                  isActive={(_, loc) => loc.pathname.startsWith('/chat')}
                  onMouseEnter={onChatLinkWarm}
                  onFocus={onChatLinkWarm}
                  className={({ isActive }) => `inline-flex items-center gap-1.5 px-2.5 md:px-4 py-2 rounded-xl no-underline font-semibold text-[0.92rem] border transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-rose-500/15 text-red-900 border-rose-500/30 dark:bg-purple-500/20 dark:text-yellow-100 dark:border-purple-400/40' 
                      : 'text-slate-700 dark:text-slate-200 border-transparent hover:bg-rose-500/10 hover:text-red-700 dark:hover:text-amber-100 dark:hover:bg-orange-500/20'
                  }`}
                  aria-label={navChatUnread > 0 ? `Trò chuyện, ${navChatUnread} tin chưa đọc` : undefined}
                >
                  <span className="relative inline-flex items-center justify-center shrink-0">
                    <MessageCircleMore size={20} />
                    {navChatUnread > 0 ? (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-4.5 px-1 box-border rounded-full bg-red-500 text-white text-[0.62rem] font-extrabold flex items-center justify-center pointer-events-none ring-2 ring-white dark:ring-slate-900" title={`${navChatUnread} tin chưa đọc ở phòng khác`}>
                        {navChatUnread > 99 ? '99+' : navChatUnread}
                      </span>
                    ) : null}
                  </span>
                  Trò chuyện
                </NavLink>
                <NavLink
                  to={ROUTES.UPGRADE}
                  className={({ isActive }) => `inline-flex items-center gap-1.5 px-2.5 md:px-4 py-2 rounded-xl no-underline font-semibold text-[0.92rem] border transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-rose-500/15 text-red-900 border-rose-500/30 dark:bg-purple-500/20 dark:text-yellow-100 dark:border-purple-400/40' 
                      : 'text-slate-700 dark:text-slate-200 border-transparent hover:bg-rose-500/10 hover:text-red-700 dark:hover:text-amber-100 dark:hover:bg-orange-500/20'
                  }`}
                >
                  <ShoppingCart size={20} />
                  Nâng cấp
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex items-center gap-1.5 shrink-0 min-w-0">
            <AnimatedThemeToggler
              className="w-[38px] h-[38px] shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer inline-flex items-center justify-center relative overflow-hidden transition-colors hover:border-red-500/35 dark:hover:border-purple-400/40"
              iconClassName="absolute inset-0 m-auto w-5 h-5 transition-transform duration-500"
              aria-label={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
            />

            <div className="relative min-w-0 shrink-0">
              <UserProfileDropdown
                displayName={displayName}
                avatarSrc={avatarSrc}
                initials={initials}
                showPremiumBadge={showPremiumBadge}
                accountTo={ROUTES.ACCOUNT}
                onLogout={() => {
                  logout();
                  navigate(ROUTES.LOGIN);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
