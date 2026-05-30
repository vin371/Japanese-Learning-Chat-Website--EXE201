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
    <div className="auth-page auth-page--animated-login">
      <AuthSakuraLayer count={36} />

      <Motion.div
        className="auth-shell auth-shell--v3"
        variants={loginShellVariants}
        initial="hidden"
        animate="visible"
      >
        <Motion.section className="auth-left auth-left--photo auth-left--v3">
          <Motion.div className="auth-left__hero-copy" variants={loginHeroGlass} initial="hidden" animate="visible">
            <h2 className="auth-left__title">
              Chinh phục nghệ thuật <span className="auth-left__accent">tiếng Nhật</span>
            </h2>
            <p className="auth-left__desc">
              Cùng hàng nghìn học viên ôn ngữ pháp, kanji và văn hóa — YumeGo-ji đồng hành cùng bạn.
            </p>
            <div className="auth-left__hero-footer" aria-hidden="true">
              <AuthHeroAvatars />
              <div>
                Đã có hơn <strong>12.000</strong> học viên đồng hành
              </div>
            </div>
          </Motion.div>
        </Motion.section>

        <Motion.section className="auth-right auth-right--v3" variants={loginStaggerParent} initial="hidden" animate="visible">
          <Motion.div className="auth-login-brand" variants={loginStaggerItem}>
            <img src={yumeLogo} alt="" width={50} height={50} style={{ borderRadius: '50%' }} />
            <span className="auth-login-brand__text">YumeGo-ji</span>
          </Motion.div>

          <Motion.h1 className="auth-right__title" variants={loginStaggerItem}>
            Chào mừng trở lại
          </Motion.h1>
          <Motion.p className="auth-right__subtitle" variants={loginStaggerItem}>
            Nhập email và mật khẩu để đăng nhập.
          </Motion.p>

          {message && (
            <Motion.p className="auth-card__message" variants={loginStaggerItem}>
              {message}
            </Motion.p>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <Motion.div
              className="auth-form__stagger"
              variants={loginStaggerParent}
              initial="hidden"
              animate="visible"
            >
              <Motion.div
                className="input-group input-group--auth-motion"
                variants={loginStaggerItem}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              >
                <label htmlFor="login-email" className="input-label">
                  Email
                </label>
                <div className="auth-field-wrap">
                  <span className="auth-field-icon">
                    <Mail size={20} />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    className="auth-field-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </Motion.div>

              <Motion.div
                className="input-group input-group--auth-motion"
                variants={loginStaggerItem}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              >
                <div className="auth-row">
                  <label htmlFor="login-password" className="input-label">
                    Mật khẩu
                  </label>
                  <Link className="auth-link" to={ROUTES.RESET_PASSWORD}>
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="auth-field-wrap auth-field-wrap--password">
                  <span className="auth-field-icon">
                    <LockKeyhole size={20} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-field-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <Motion.button
                    type="button"
                    className="auth-field-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    whileTap={{ scale: 0.92 }}
                  >
                    <IconEye open={showPassword} />
                  </Motion.button>
                </div>
              </Motion.div>

              <div className="auth-form-error-slot" aria-live="polite">
                {error ? <p className="form-error">{error}</p> : null}
              </div>

              <Motion.div variants={loginStaggerItem}>
                <Motion.button
                  type="submit"
                  className="btn btn--block btn--lg btn--auth-primary"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                </Motion.button>
              </Motion.div>
            </Motion.div>
          </form>

          <div className="auth-google-slot">
            <GoogleAuthPill
              onCredential={onGoogleCredential}
              text="signin_with"
              disabled={loading}
              onConfigError={setError}
            />
          </div>

          <Motion.p className="auth-footer" variants={loginStaggerItem}>
            Chưa có tài khoản? <Link to={ROUTES.REGISTER}>Đăng ký</Link>
          </Motion.p>
          <Motion.div variants={loginStaggerItem}>
            <Link to={ROUTES.HOME} className="auth-back">
              ← Về trang chủ
            </Link>
          </Motion.div>

          <p className="auth-login-tagline">Cảm nhận sự hài hòa của ngôn ngữ</p>
        </Motion.section>
      </Motion.div>
    </div>
  );
}
