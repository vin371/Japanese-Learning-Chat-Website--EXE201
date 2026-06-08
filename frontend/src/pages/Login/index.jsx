/* eslint-env browser */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import * as FM from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { ROUTES } from '../../data/routes';
import { getPostLoginRoute } from '../../utils/postLoginRoute';
import { isStaffUser } from '../../utils/roles';
import { isRequired, isEmail } from '../../utils/validators';
import { getErrorMessageForUser } from '../../utils/apiErrorMessage';
import { BACKEND_MISSING_HINT, isBackendConfigured } from '../../utils/apiConfig';
import { AuthSakuraLayer } from '../../components/auth/AuthSakuraLayer';
import { AuthHeroAvatars } from '../../components/auth/AuthHeroAvatars';
import { GoogleAuthPill } from '../../components/auth/GoogleAuthPill';
import {
  loginShellVariants,
  loginStaggerParent,
  loginStaggerItem,
  loginHeroGlass,
} from './loginMotion';
import { Mail, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import yumeLogo from '../../assets/yume-logo.png';

const Motion = FM.motion;

function IconEye({ open }) {
  if (open) {
    return <EyeOff size={20} />;
  }
  return <Eye size={20} />;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;
  const message = location.state?.message;

  useEffect(() => {
    if (message) setError('');
  }, [message]);

  const routeAfterAuth = useCallback(
    (data) => {
      const u = authService.mergeUserWithRoleFromToken(data?.user ?? authService.getStoredUser());
      if (data?.needsPlacementTest && !isStaffUser(u)) {
        navigate(ROUTES.PLACEMENT_TEST, { replace: true });
      } else {
        navigate(getPostLoginRoute(u, from), { replace: true });
      }
    },
    [navigate, from],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isBackendConfigured()) {
      setError(BACKEND_MISSING_HINT);
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
    setLoading(true);
    try {
      const data = await login({ email, password });
      routeAfterAuth(data);
    } catch (err) {
      setError(getErrorMessageForUser(err, 'Đăng nhập thất bại.'));
    } finally {
      setLoading(false);
    }
  };

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
        setError(getErrorMessageForUser(err, 'Đăng nhập Google thất bại.'));
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, routeAfterAuth],
  );

  return (
    <div className="relative min-h-[calc(100vh-72px)] flex items-stretch overflow-hidden font-sans bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <AuthSakuraLayer count={36} />

      <Motion.div
        className="relative z-10 w-full min-h-[calc(100vh-72px)] bg-white dark:bg-slate-900 overflow-hidden grid grid-cols-1 lg:grid-cols-2"
        variants={loginShellVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Cột bên trái: Ảnh núi Phú Sĩ */}
        <Motion.section
          className="relative min-h-[320px] lg:min-h-[min(720px,calc(100vh-72px))] p-8 lg:p-12 pb-16 flex flex-col justify-end items-start text-white bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(2, 6, 23, 0.05) 0%, rgba(2, 6, 23, 0.55) 100%), url('/hero-japan.png')`
          }}
        >
          <Motion.div className="relative z-10 max-w-lg" variants={loginHeroGlass} initial="hidden" animate="visible">
            <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-3 text-white drop-shadow-md">
              Chinh phục nghệ thuật <span className="text-rose-200 font-extrabold drop-shadow-[0_0_20px_rgba(251,113,133,0.5)]">tiếng Nhật</span>
            </h2>
            <p className="text-white/90 max-w-md text-sm lg:text-base leading-relaxed drop-shadow-sm">
              Cùng hàng nghìn học viên ôn ngữ pháp, kanji và văn hóa — YumeGo-ji đồng hành cùng bạn.
            </p>
            <div className="mt-6 inline-flex items-center gap-3 py-2 px-4 pl-3 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-xs lg:text-sm text-white/95 shadow-lg" aria-hidden="true">
              <AuthHeroAvatars />
              <div>
                Đã có hơn <strong className="font-bold">12.000</strong> học viên đồng hành
              </div>
            </div>
          </Motion.div>
        </Motion.section>

        {/* Lông vũ trắng nối ảnh Fuji → panel đăng nhập (chỉ hiển thị trên LG) */}
        <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[min(110px,14vw)] z-20 pointer-events-none bg-gradient-to-r from-transparent via-white/50 to-white dark:via-slate-900/50 dark:to-slate-900" />

        {/* Cột bên phải: Form đăng nhập */}
        <Motion.section
          className="relative z-30 bg-white dark:bg-slate-900 px-6 py-10 lg:px-12 lg:py-16 flex flex-col justify-center w-full max-w-[540px] mx-auto"
          variants={loginStaggerParent}
          initial="hidden"
          animate="visible"
        >
          <Motion.div className="flex items-center justify-center gap-2.5 mb-6" variants={loginStaggerItem}>
            <img src={yumeLogo} alt="" className="w-10 h-10 rounded-full object-contain" />
            <span className="text-2xl font-black tracking-tight text-rose-700 dark:text-rose-500">YumeGo-ji</span>
          </Motion.div>

          <Motion.h2 className="text-3xl! lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 text-center mb-1.5" variants={loginStaggerItem}>
            Chào mừng trở lại
          </Motion.h2>
          <Motion.p className="text-slate-500 dark:text-slate-400 text-center text-sm lg:text-base mb-6" variants={loginStaggerItem}>
            Nhập email và mật khẩu để đăng nhập.
          </Motion.p>

          {!isBackendConfigured() && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs text-center leading-relaxed" role="status">
              {BACKEND_MISSING_HINT}
            </div>
          )}

          {message && (
            <Motion.div
              className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium"
              variants={loginStaggerItem}
            >
              {message}
            </Motion.div>
          )}

          <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
            <Motion.div
              className="space-y-4"
              variants={loginStaggerParent}
              initial="hidden"
              animate="visible"
            >
              <Motion.div
                className="flex flex-col gap-1.5"
                variants={loginStaggerItem}
                whileHover={{ y: -1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              >
                <label htmlFor="login-email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Mail size={20} />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 hover:border-rose-300 transition-all shadow-inner"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </Motion.div>

              <Motion.div
                className="flex flex-col gap-1.5"
                variants={loginStaggerItem}
                whileHover={{ y: -1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              >
                <div className="flex justify-between items-center">
                  <label htmlFor="login-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Mật khẩu
                  </label>
                  <Link className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline" to={ROUTES.RESET_PASSWORD}>
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <LockKeyhole size={20} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 hover:border-rose-300 transition-all shadow-inner"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <Motion.button
                    type="button"
                    className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    whileTap={{ scale: 0.92 }}
                  >
                    <IconEye open={showPassword} />
                  </Motion.button>
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
                  {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                </Motion.button>
              </Motion.div>
            </Motion.div>
          </form>

          <Motion.div className="flex items-center gap-3 my-4 text-xs font-bold text-slate-400 uppercase tracking-wider before:content-[''] before:flex-1 before:h-[1px] before:bg-slate-200 dark:before:bg-slate-800 after:content-[''] after:flex-1 after:h-[1px] after:bg-slate-200 dark:after:bg-slate-800" variants={loginStaggerItem}>
            Đăng nhập với
          </Motion.div>

          <div className="mb-6 flex justify-center w-full">
            <GoogleAuthPill
              onCredential={onGoogleCredential}
              text="signin_with"
              disabled={loading}
              onConfigError={setError}
            />
          </div>

          <Motion.p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4" variants={loginStaggerItem}>
            Chưa có tài khoản?{' '}
            <Link to={ROUTES.REGISTER} className="text-rose-600 dark:text-rose-400 font-bold hover:underline">
              Đăng ký
            </Link>
          </Motion.p>

          <Motion.div className="text-center" variants={loginStaggerItem}>
            <Link to={ROUTES.HOME} className="inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
              ← Về trang chủ
            </Link>
          </Motion.div>

          <p className="mt-8 text-[10px] font-bold tracking-widest text-slate-300 dark:text-slate-700 text-center uppercase">
            Cảm nhận sự hài hòa của ngôn ngữ
          </p>
        </Motion.section>
      </Motion.div>
    </div>
  );
}
