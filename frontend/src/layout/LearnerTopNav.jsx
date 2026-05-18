import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ENV } from '../api/client';
import { PremiumBadge } from '../components/profile/PremiumBadge';
import { userIsPremium } from '../utils/userPremium';
import { useChatUnreadTotal } from '../hooks/useChatUnreadTotal';
import { useTheme } from '../hooks/useTheme';
import { ROUTES } from '../data/routes';
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

  /** Trên nav: không tính unread phòng đang mở (đang xem = đã xử lý UI trong phòng). */
  const navChatUnread = useMemo(() => {
    const m = pathname.match(/^\/chat\/room\/([^/]+)/);
    const activeId = m ? m[1] : null;
    if (!activeId) return chatUnreadTotal;
    const row = chatRooms.find((r) => String(r.id ?? r.Id) === String(activeId));
    const here = Number(row?.unreadCount ?? row?.UnreadCount ?? 0) || 0;
    return Math.max(0, chatUnreadTotal - here);
  }, [pathname, chatUnreadTotal, chatRooms]);

  useEffect(() => {
    if (!isAuthenticated || !pathname.startsWith('/chat')) return;
    void refreshChatUnread();
  }, [pathname, isAuthenticated, refreshChatUnread]);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);

  const displayName = user?.displayName || user?.username || user?.name || user?.email || 'Học viên';
  const initials = initialsFromUser(user, displayName);
  const avatarSrc = isAuthenticated ? buildAvatarSrc(user) : '';
  const xuBalance = Number(user?.xu ?? user?.Xu ?? 0) || 0;
  const roleNorm = String(user?.role ?? user?.Role ?? 'user').toLowerCase();
  const isAdminUser = roleNorm === 'admin';
  const isModeratorUser = roleNorm === 'moderator';
  const roleLine = isAdminUser ? 'Quản trị viên' : isModeratorUser ? 'Điều hành viên' : 'Học viên';
  /** Admin / Moderator: không Học tập / Trò chơi — trang nghiệp vụ + Chat. */
  const staffNav = isAdminUser || isModeratorUser;
  const showVipAvatarFrame = !staffNav && xuBalance >= 100;
  const showPremiumBadge = !staffNav && userIsPremium(user);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  return (
    <header className="learner-nav">
      <div className="learner-nav__inner">
        <Link
          to={isAdminUser ? ROUTES.ADMIN : isModeratorUser ? ROUTES.MODERATOR : ROUTES.DASHBOARD}
          className="learner-nav__brand"
          aria-label="YumeGo-ji"
        >
          <img src={yumeLogo} alt="" className="learner-nav__brand-logo" />
          <span className="learner-nav__brand-title">YumeGo-ji</span>
        </Link>

        <div className="learner-nav__end-cluster">
          <nav
            className="learner-nav__links"
            aria-label={staffNav ? 'Trang nghiệp vụ và trò chuyện' : 'Điều hướng chính'}
          >
            {staffNav ? (
              <>
                <NavLink
                  to={isAdminUser ? ROUTES.ADMIN : ROUTES.MODERATOR}
                  end
                  className={({ isActive }) => `learner-nav__link ${isActive ? 'learner-nav__link--active' : ''}`}
                >
                  {isAdminUser ? 'Bảng điều khiển' : 'Điều hành'}
                </NavLink>
                <NavLink
                  to={ROUTES.CHAT}
                  className={({ isActive }) => `learner-nav__link ${isActive ? 'learner-nav__link--active' : ''}`}
                  aria-label={navChatUnread > 0 ? `Trò chuyện, ${navChatUnread} tin chưa đọc` : undefined}
                >
                  <span className="learner-nav__icon-badge-wrap">
                    <MessageCircleMore size={20} />
                    {navChatUnread > 0 ? (
                      <span className="learner-nav__nav-badge" title={`${navChatUnread} tin chưa đọc ở phòng khác`}>
                        {navChatUnread > 99 ? '99+' : navChatUnread}
                      </span>
                    ) : null}
                  </span>
                  Trò chuyện
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to={ROUTES.LEARN} className={({ isActive }) => `learner-nav__link ${isActive ? 'learner-nav__link--active' : ''}`}>
                  <BookOpenText size={20} />
                  Học tập
                </NavLink>
                <NavLink to={ROUTES.PLAY} className={({ isActive }) => `learner-nav__link ${isActive ? 'learner-nav__link--active' : ''}`}>
                  <Gamepad2 size={20} />
                  Trò chơi
                </NavLink>
                <NavLink
                  to={ROUTES.CHAT}
                  className={({ isActive }) => `learner-nav__link ${isActive ? 'learner-nav__link--active' : ''}`}
                  aria-label={navChatUnread > 0 ? `Trò chuyện, ${navChatUnread} tin chưa đọc` : undefined}
                >
                  <span className="learner-nav__icon-badge-wrap">
                    <MessageCircleMore size={20} />
                    {navChatUnread > 0 ? (
                      <span className="learner-nav__nav-badge" title={`${navChatUnread} tin chưa đọc ở phòng khác`}>
                        {navChatUnread > 99 ? '99+' : navChatUnread}
                      </span>
                    ) : null}
                  </span>
                  Trò chuyện
                </NavLink>
                <NavLink
                  to={ROUTES.UPGRADE}
                  className={({ isActive }) => `learner-nav__link ${isActive ? 'learner-nav__link--active' : ''}`}
                >
                  <ShoppingCart size={20} />
                  Nâng cấp
                </NavLink>
              </>
            )}
          </nav>

          <div className="learner-nav__right">
            <AnimatedThemeToggler
              className="learner-nav__theme"
              iconClassName="learner-nav__theme-icon"
              aria-label={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
            />

            <div className="learner-nav__user-wrap" ref={wrapRef}>
              <UserProfileDropdown
                user={user}
                displayName={displayName}
                avatarSrc={avatarSrc}
                initials={initials}
                showPremiumBadge={showPremiumBadge}
                logout={() => {
                  logout();
                  navigate(ROUTES.LOGIN);
                }}
                ROUTES={ROUTES}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
