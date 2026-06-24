/* eslint-env browser */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import * as FM from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { ROUTES } from '../../data/routes';
import { getPostAuthRoute } from '../../utils/onboardingFlow';
import { isRequired, isEmail } from '../../utils/validators';
import { getErrorMessageForUser } from '../../utils/apiErrorMessage';
import { BACKEND_MISSING_HINT, isBackendConfigured } from '../../utils/apiConfig';
import { AuthPageLayout } from '../../components/auth/AuthPageLayout';
import { GoogleAuthPill } from '../../components/auth/GoogleAuthPill';
import { loginStaggerParent, loginStaggerItem } from './loginMotion';
import { Mail, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import yumeLogo from '../../assets/yume-logo.png';
import { Vi } from '../../components/ui/Vi';

const Motion = FM.motion;

function IconEye({ open }) {
  if (open) return <EyeOff size={18} />;
  return <Eye size={18} />;
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
      navigate(getPostAuthRoute(data, u, from), { replace: true });
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
    <AuthPageLayout>
      <Motion.div variants={loginStaggerParent} initial="hidden" animate="visible">
        <Motion.div className="auth-brand" variants={loginStaggerItem}>
          <img src={yumeLogo} alt="" className="auth-brand__logo" />
          <span className="auth-brand__name">YumeGo-ji</span>
        </Motion.div>

        <Motion.h1 className="auth-title" variants={loginStaggerItem}>
          <Vi>Chào mừng trở lại</Vi>
        </Motion.h1>
        <Motion.p className="auth-subtitle" variants={loginStaggerItem}>
          Nhập email và mật khẩu để đăng nhập.
        </Motion.p>

        {!isBackendConfigured() && (
          <div className="auth-alert auth-alert--warn" role="status">
            {BACKEND_MISSING_HINT}
          </div>
        )}

        {message && (
          <Motion.div className="auth-alert auth-alert--success" variants={loginStaggerItem}>
            {message}
          </Motion.div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <Motion.div variants={loginStaggerParent} initial="hidden" animate="visible">
            <Motion.div className="auth-field" variants={loginStaggerItem}>
              <label htmlFor="login-email" className="auth-field__label">
                Email
              </label>
              <div className="auth-field__control">
                <span className="auth-field__icon">
                  <Mail size={18} />
                </span>
                <input
                  id="login-email"
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </Motion.div>

            <Motion.div className="auth-field" variants={loginStaggerItem}>
              <div className="auth-field__head">
                <label htmlFor="login-password" className="auth-field__label">
                  <Vi>Mật khẩu</Vi>
                </label>
                <Link className="auth-link-inline" to={ROUTES.RESET_PASSWORD}>
                  <Vi>Quên mật khẩu?</Vi>
                </Link>
              </div>
              <div className="auth-field__control">
                <span className="auth-field__icon">
                  <LockKeyhole size={18} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input auth-input--password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-field__toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <IconEye open={showPassword} />
                </button>
              </div>
            </Motion.div>

            <div className="auth-error-slot" aria-live="polite">
              {error ? <p className="auth-error">{error}</p> : null}
            </div>

            <Motion.div variants={loginStaggerItem}>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <Vi ja="処理中...">Đang xử lý...</Vi> : <Vi>Đăng nhập</Vi>}
              </button>
            </Motion.div>
          </Motion.div>
        </form>

        <Motion.div className="auth-divider" variants={loginStaggerItem}>
          <Vi>Đăng nhập với</Vi>
        </Motion.div>

        <div className="flex justify-center w-full mb-4">
          <GoogleAuthPill
            onCredential={onGoogleCredential}
            text="signin_with"
            disabled={loading}
            onConfigError={setError}
          />
        </div>

        <Motion.p className="auth-switch" variants={loginStaggerItem}>
          Chưa có tài khoản? <Link to={ROUTES.REGISTER}><Vi>Đăng ký</Vi></Link>
        </Motion.p>
      </Motion.div>
    </AuthPageLayout>
  );
}
