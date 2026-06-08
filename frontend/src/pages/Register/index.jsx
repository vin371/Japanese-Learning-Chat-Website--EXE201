/* eslint-env browser */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as FM from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { ROUTES } from '../../data/routes';
import { getPostLoginRoute } from '../../utils/postLoginRoute';
import { isStaffUser } from '../../utils/roles';
import { GoogleAuthPill } from '../../components/auth/GoogleAuthPill';
import { isRequired, isEmail, minLength } from '../../utils/validators';
import { getErrorMessageForUser } from '../../utils/apiErrorMessage';
import { BACKEND_MISSING_HINT, isBackendConfigured } from '../../utils/apiConfig';
import { AuthSakuraLayer } from '../../components/auth/AuthSakuraLayer';
import { AuthHeroAvatars } from '../../components/auth/AuthHeroAvatars';
import {
  loginShellVariants,
  loginStaggerParent,
  loginStaggerItem,
  loginHeroGlass,
} from '../Login/loginMotion';
import { User, Mail, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import yumeLogo from '../../assets/yume-logo.png';

const Motion = FM.motion;

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, loginWithGoogle, needsPlacementTest, user } = useAuth();
  const navigate = useNavigate();

  const routeAfterAuth = useCallback(
    (data) => {
      const u = authService.mergeUserWithRoleFromToken(data?.user ?? authService.getStoredUser());
      if (data?.needsPlacementTest && !isStaffUser(u)) {
        navigate(ROUTES.PLACEMENT_TEST, { replace: true });
      } else {
        navigate(getPostLoginRoute(u, ROUTES.DASHBOARD), { replace: true });
      }
    },
    [navigate],
  );

  const onGoogleCredential = useCallback(
    async (credential) => {
      if (!credential) return;
      setError('');
      if (!isBackendConfigured()) {
        setError(BACKEND_MISSING_HINT);
        return;
      }
      setLoading(true);
      try {
        const data = await loginWithGoogle({ idToken: credential });
        routeAfterAuth(data);
      } catch (err) {
        setError(getErrorMessageForUser(err, 'Đăng ký/đăng nhập Google thất bại.'));
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, routeAfterAuth],
  );

  const buildUsername = (name, emailValue) => {
    const fromName = String(name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 24);

    if (fromName) return fromName;

    const fromEmail = String(emailValue || '')
      .trim()
      .split('@')[0]
      ?.toLowerCase()
      ?.replace(/[^a-z0-9_]/g, '')
      ?.slice(0, 24);

    return fromEmail || `user_${Date.now()}`;
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const u = authService.mergeUserWithRoleFromToken(user);
    if (needsPlacementTest && !isStaffUser(u)) {
      navigate(ROUTES.PLACEMENT_TEST, { replace: true });
      return;
    }
    navigate(getPostLoginRoute(u, ROUTES.DASHBOARD), { replace: true });
  }, [isAuthenticated, needsPlacementTest, user, navigate]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isBackendConfigured()) {
      setError(BACKEND_MISSING_HINT);
      return;
    }
    if (!isRequired(fullName)) {
      setError('Vui lòng nhập họ tên.');
      return;
    }
    if (!isRequired(email)) {
      setError('Vui lòng nhập email.');
      return;
    }
    if (!isEmail(email)) {
      setError('Email không hợp lệ.');
      return;
    }
    if (!isRequired(password)) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }
    if (!minLength(password, 6)) {
      setError('Mật khẩu cần ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      await authService.register({
        username: buildUsername(fullName, email),
        email,
        password,
      });
      setError('');
      navigate(ROUTES.LOGIN, { replace: true, state: { message: 'Đăng ký thành công. Vui lòng đăng nhập.' } });
    } catch (err) {
      setError(getErrorMessageForUser(err, 'Đăng ký thất bại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-72px)] flex items-stretch overflow-hidden font-sans bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <AuthSakuraLayer count={36} />

      <Motion.div
        className="relative z-10 w-full min-h-[calc(100vh-72px)] bg-white dark:bg-slate-900 overflow-hidden grid grid-cols-1 lg:grid-cols-2"
        variants={loginShellVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Cột bên trái: Ảnh phong cảnh đăng ký */}
        <section 
          className="relative min-h-[320px] lg:min-h-[min(720px,calc(100vh-72px))] p-8 lg:p-12 pb-16 flex flex-col justify-end items-start text-white bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(2, 6, 23, 0.10) 0%, rgba(2, 6, 23, 0.60) 100%), url('/auth-register.png')`
          }}
        >
          <Motion.div className="relative z-10 max-w-lg" variants={loginHeroGlass} initial="hidden" animate="visible">
            <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-3 text-white drop-shadow-md">
              Bắt đầu hành trình <span className="text-rose-200 font-extrabold drop-shadow-[0_0_20px_rgba(251,113,133,0.5)]">tiếng Nhật.</span>
            </h2>
            <p className="text-white/90 max-w-md text-sm lg:text-base leading-relaxed drop-shadow-sm">
              Luyện Kanji, Hiragana và Katakana trên nền tảng cộng đồng tương tác.
            </p>
            <div className="mt-6 inline-flex items-center gap-3 py-2 px-4 pl-3 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-xs lg:text-sm text-white/95 shadow-lg" aria-hidden="true">
              <AuthHeroAvatars />
              <div>
                Đã có hơn <strong className="font-bold">12.000</strong> học viên đồng hành
              </div>
            </div>
          </Motion.div>
        </section>

        {/* Lông vũ trắng nối ảnh Fuji/Japan → panel đăng nhập (chỉ hiển thị trên LG) */}
        <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[min(110px,14vw)] z-20 pointer-events-none bg-gradient-to-r from-transparent via-white/50 to-white dark:via-slate-900/50 dark:to-slate-900" />

        {/* Cột bên phải: Form đăng ký */}
        <Motion.section 
          className="relative z-30 bg-white dark:bg-slate-900 px-6 py-10 lg:px-12 lg:py-16 flex flex-col justify-center w-full max-w-[540px] mx-auto"
          variants={loginStaggerParent} 
          initial="hidden" 
          animate="visible"
        >
          <Motion.div className="flex items-center justify-center gap-2.5 mb-5" variants={loginStaggerItem}>
            <img src={yumeLogo} alt="" className="w-10 h-10 rounded-full object-contain" />
            <span className="text-2xl font-black tracking-tight text-rose-700 dark:text-rose-500">YumeGo-ji</span>
          </Motion.div>

          <Motion.h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 text-center mb-1" variants={loginStaggerItem}>
            Tạo tài khoản
          </Motion.h1>
          <Motion.p className="text-slate-500 dark:text-slate-400 text-center text-sm lg:text-base mb-5" variants={loginStaggerItem}>
            Tham gia cộng đồng YumeGo-ji ngay hôm nay.
          </Motion.p>

          {!isBackendConfigured() && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs text-center leading-relaxed" role="status">
              {BACKEND_MISSING_HINT}
            </div>
          )}

          <div className="mb-5 flex justify-center w-full">
            <GoogleAuthPill
              onCredential={onGoogleCredential}
              text="signup_with"
              disabled={loading}
              label="Đăng ký với"
              onConfigError={setError}
              showLabel={false}
              className="auth-google-only--register"
            />
          </div>

          <Motion.div className="flex items-center gap-3 my-3 text-xs font-bold text-slate-400 uppercase tracking-wider before:content-[''] before:flex-1 before:h-[1px] before:bg-slate-200 dark:before:bg-slate-800 after:content-[''] after:flex-1 after:h-[1px] after:bg-slate-200 dark:after:bg-slate-800" variants={loginStaggerItem}>
            HOẶC TIẾP TỤC BẰNG EMAIL
          </Motion.div>

          <form className="space-y-4 mb-5" onSubmit={handleSubmit}>
            <Motion.div
              className="space-y-3.5"
              variants={loginStaggerParent}
              initial="hidden"
              animate="visible"
            >
              {/* Họ tên */}
              <Motion.div
                className="flex flex-col gap-1"
                variants={loginStaggerItem}
                whileHover={{ y: -1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              >
                <label htmlFor="register-fullName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Họ và tên
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <User size={20} />
                  </span>
                  <input
                    id="register-fullName"
                    type="text"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 hover:border-rose-300 transition-all shadow-inner text-sm lg:text-base"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              </Motion.div>

              {/* Email */}
              <Motion.div
                className="flex flex-col gap-1"
                variants={loginStaggerItem}
                whileHover={{ y: -1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              >
                <label htmlFor="register-email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Mail size={20} />
                  </span>
                  <input
                    id="register-email"
                    type="email"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 hover:border-rose-300 transition-all shadow-inner text-sm lg:text-base"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </Motion.div>

              {/* Mật khẩu + Nhập lại mật khẩu */}
              <Motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" variants={loginStaggerItem}>
                <div className="flex flex-col gap-1">
                  <label htmlFor="register-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Mật khẩu
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <LockKeyhole size={20} />
                    </span>
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 hover:border-rose-300 transition-all shadow-inner text-sm lg:text-base"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <Motion.button
                      type="button"
                      className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      whileTap={{ scale: 0.92 }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Motion.button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="register-confirmPassword" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <LockKeyhole size={20} />
                    </span>
                    <input
                      id="register-confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 hover:border-rose-300 transition-all shadow-inner text-sm lg:text-base"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                  </div>
                </div>
              </Motion.div>

              <div className="min-h-[20px]" aria-live="polite">
                {error ? <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}
              </div>

              <Motion.div variants={loginStaggerItem}>
                <Motion.button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/35 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[46px]"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                >
                  {loading ? 'Đang xử lý...' : 'Đăng ký'}
                </Motion.button>
              </Motion.div>
            </Motion.div>
          </form>

          <Motion.p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4" variants={loginStaggerItem}>
            Đã có tài khoản?{' '}
            <Link to={ROUTES.LOGIN} className="text-rose-600 dark:text-rose-400 font-bold hover:underline">
              Đăng nhập
            </Link>
          </Motion.p>

          <Motion.div className="text-center" variants={loginStaggerItem}>
            <Link to={ROUTES.HOME} className="inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
              ← Về trang chủ
            </Link>
          </Motion.div>
        </Motion.section>
      </Motion.div>
    </div>
  );
}
