import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { ROUTES } from '../data/routes';
import yumeLogo from '../assets/yume-logo.png';
import { AnimatedThemeToggler } from '../ui/animated-theme-toggler';
import UserProfileDropdown from '../ui/user-profile-dropdown';
import { userIsPremium } from '../utils/userPremium';
import { ENV } from '../api/client';

const MARKETING_PATHS = [ROUTES.HOME, ROUTES.LOGIN, ROUTES.REGISTER];

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

export function Header() {
  const { isAuthenticated, logout, user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMarketing = MARKETING_PATHS.includes(location.pathname);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountWrapRef = useRef(null);
  const displayName = user?.displayName || user?.username || user?.name || user?.email || 'Học viên';
  const roleNorm = String(user?.role ?? user?.Role ?? 'user').toLowerCase();
  const isAdminUser = roleNorm === 'admin';
  const isModeratorUser = roleNorm === 'moderator';
  const initials = initialsFromUser(user, displayName);
  const avatarSrc = isAuthenticated ? buildAvatarSrc(user) : '';
  const xuBalance = Number(user?.xu ?? user?.Xu ?? 0) || 0;
  const staffNav = isAdminUser || isModeratorUser;
  const showPremiumBadge = !staffNav && userIsPremium(user);

  useEffect(() => {
    if (!accountOpen) return undefined;
    function onDocMouseDown(e) {
      const el = accountWrapRef.current;
      if (!el || el.contains(e.target)) return;
      setAccountOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setAccountOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  if (isMarketing) {
    return (
      <header className="layout-header layout-header--marketing">
        <Link to={ROUTES.HOME} className="layout-header__brand" aria-label="YumeGo-ji — về trang chủ">
          <img src={yumeLogo} alt="YumeGo-ji" className="layout-header__brand-logo" />
          <span className="layout-header__brand-title">YumeGo-ji</span>
        </Link>

        <nav className="layout-header__nav-center" aria-label="Điều hướng chính">
          <Link to={ROUTES.HOME}>Trang chủ</Link>
          {isAuthenticated ? (
            <Link to={ROUTES.LEARN}>Khóa học</Link>
          ) : (
            <Link to={`${ROUTES.HOME}#method`}>Khóa học</Link>
          )}
          {isAuthenticated ? (
            <Link to={`${ROUTES.HOME}#testimonials`}>Blog</Link>
          ) : (
            <>
              <Link to={`${ROUTES.HOME}#why`}>Giới thiệu</Link>
              <Link to={`${ROUTES.HOME}#testimonials`}>Blog</Link>
              <Link to={`${ROUTES.HOME}#lien-he`}>Liên hệ</Link>
            </>
          )}
        </nav>

        <div className="layout-header__actions">
          <AnimatedThemeToggler
            className="layout-header__theme"
            iconClassName="layout-header__theme-icon"
            aria-label="Chuyển sáng/tối"
            title="Chuyển sáng/tối"
          />
          {isAuthenticated ? (
            <div className="layout-header__account-wrap" ref={accountWrapRef}>
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
                menuOpen={accountOpen}
                setMenuOpen={setAccountOpen}
              />
            </div>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className="layout-header__link-muted">
                Đăng nhập
              </Link>
              <Link to={ROUTES.REGISTER} className="btn btn--primary btn--sm layout-header__cta-register">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="layout-header">
      <Link to={ROUTES.HOME} className="layout-header__logo" aria-label="YumeGo-ji — về trang chủ">
        <img src={yumeLogo} alt="YumeGo-ji" className="layout-header__logo-img" />
        <span className="layout-header__logo-title">YumeGo-ji</span>
      </Link>
      <nav className="layout-header__nav">

        <Link to={ROUTES.HOME}>Trang chủ</Link>
        {isAuthenticated ? (
          <>
            <Link to={ROUTES.CHAT}>Trò chuyện</Link>
            <AnimatedThemeToggler
              className="layout-header__theme"
              iconClassName="layout-header__theme-icon"
              aria-label="Chuyển sáng/tối"
              title="Chuyển sáng/tối"
            />
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
              menuOpen={accountOpen}
              setMenuOpen={setAccountOpen}
            />
          </>
        ) : (
          <>
            <Link to={ROUTES.LOGIN}>Đăng nhập</Link>
            <Link to={ROUTES.REGISTER} className="btn btn--inverted btn--sm">
              Đăng ký
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
