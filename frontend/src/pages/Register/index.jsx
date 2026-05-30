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
    <div className="auth-page auth-page--animated-login auth-page--register">
      <AuthSakuraLayer count={36} />

      <Motion.div
        className="auth-shell auth-shell--v3"
        variants={loginShellVariants}
        initial="hidden"
        animate="visible"
      >
        <section className="auth-left auth-left--register">
          <Motion.div className="auth-left__hero-copy" variants={loginHeroGlass} initial="hidden" animate="visible">
            <h2 className="auth-left__title">
              Bắt đầu hành trình <span className="auth-left__accent">tiếng Nhật.</span>
            </h2>
            <p className="auth-left__desc">
              Luyện Kanji, Hiragana và Katakana trên nền tảng cộng đồng tương tác.
            </p>
            <div className="auth-left__hero-footer" aria-hidden="true">
              <AuthHeroAvatars />
              <div>
                Đã có hơn <strong>12.000</strong> học viên đồng hành
              </div>
            </div>
          </Motion.div>
        </section>

        <Motion.section className="auth-right auth-right--v3" variants={loginStaggerParent} initial="hidden" animate="visible">
          <Motion.div className="auth-login-brand" variants={loginStaggerItem}>
            <img src={yumeLogo} alt="" width={40} height={40} style={{ borderRadius: '50%' }} />
            <span className="auth-login-brand__text">YumeGo-ji</span>
          </Motion.div>

          <Motion.h1 className="auth-right__title" variants={loginStaggerItem}>
            Tạo tài khoản
          </Motion.h1>
          <Motion.p className="auth-right__subtitle" variants={loginStaggerItem}>
            Tham gia cộng đồng YumeGo-ji ngay hôm nay.
          </Motion.p>

          <div className="auth-google-slot">
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

          <Motion.div className="auth-divider" variants={loginStaggerItem}>
            HOẶC TIẾP TỤC BẰNG EMAIL
          </Motion.div>

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
                <label htmlFor="register-fullName" className="input-label">
                  Họ và tên
                </label>
                <div className="auth-field-wrap">
                  <span className="auth-field-icon">
                    <User size={20} />
                  </span>
                  <input
                    id="register-fullName"
                    type="text"
                    className="auth-field-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    autoComplete="name"
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
                <label htmlFor="register-email" className="input-label">
                  Email
                </label>
                <div className="auth-field-wrap">
                  <span className="auth-field-icon">
                    <Mail size={20} />
                  </span>
                  <input
                    id="register-email"
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

              <Motion.div className="auth-grid-2" variants={loginStaggerItem}>
                <Motion.div
                  className="input-group input-group--auth-motion"
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                >
                  <label htmlFor="register-password" className="input-label">
                    Mật khẩu
                  </label>
                  <div className="auth-field-wrap auth-field-wrap--password">
                    <span className="auth-field-icon">
                      <LockKeyhole size={20} />
                    </span>
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      className="auth-field-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <Motion.button
                      type="button"
                      className="auth-field-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      whileTap={{ scale: 0.92 }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </Motion.button>
                  </div>
                </Motion.div>

                <Motion.div
                  className="input-group input-group--auth-motion"
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                >
                  <label htmlFor="register-confirmPassword" className="input-label">
                    Xác nhận mật khẩu
                  </label>
                  <div className="auth-field-wrap auth-field-wrap--password">
                    <span className="auth-field-icon">
                      <LockKeyhole size={20} />
                    </span>
                    <input
                      id="register-confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      className="auth-field-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                  </div>
                </Motion.div>
              </Motion.div>

              <div className="auth-form-error-slot" aria-live="polite">
                {error ? <p className="form-error">{error}</p> : null}
              </div>

              <Motion.div variants={loginStaggerItem}>
                <Motion.button
                  type="submit"
                  className="btn btn--primary btn--block btn--lg btn--auth-primary"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? 'Đang xử lý...' : 'Đăng ký'}
                </Motion.button>
              </Motion.div>
            </Motion.div>
          </form>

          <Motion.p className="auth-footer" variants={loginStaggerItem}>
            Đã có tài khoản? <Link to={ROUTES.LOGIN}>Đăng nhập</Link>
          </Motion.p>
          <Motion.div variants={loginStaggerItem}>
            <Link to={ROUTES.HOME} className="auth-back">
              ← Về trang chủ
            </Link>
          </Motion.div>
        </Motion.section>
      </Motion.div>
    </div>
  );
}
