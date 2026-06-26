/* eslint-env browser */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as FM from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { ROUTES } from '../../data/routes';
import { getPostAuthRoute } from '../../utils/onboardingFlow';
import { GoogleAuthPill } from '../../components/auth/GoogleAuthPill';
import { AuthPageLayout } from '../../components/auth/AuthPageLayout';
import { isRequired, isEmail, minLength } from '../../utils/validators';
import { getErrorMessageForUser } from '../../utils/apiErrorMessage';
import { BACKEND_MISSING_HINT, isBackendConfigured } from '../../utils/apiConfig';
import { loginStaggerParent, loginStaggerItem } from '../Login/loginMotion';
import { User, Mail, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import yumeLogo from '../../assets/yume-logo.png';
import { Vi } from '../../components/ui/Vi';

const Motion = FM.motion;

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, login, loginWithGoogle, needsPlacementTest, user } = useAuth();
  const navigate = useNavigate();

  const routeAfterAuth = useCallback(
    (data) => {
      const u = authService.mergeUserWithRoleFromToken(data?.user ?? authService.getStoredUser());
      navigate(getPostAuthRoute(data, u, ROUTES.LEARN), { replace: true });
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
    navigate(getPostAuthRoute({ needsPlacementTest }, u, ROUTES.LEARN), { replace: true });
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
      const data = await login({ email, password });
      routeAfterAuth(data);
    } catch (err) {
      setError(getErrorMessageForUser(err, 'Đăng ký thất bại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <Motion.div variants={loginStaggerParent} initial="hidden" animate="visible">
        <Motion.div className="auth-brand" variants={loginStaggerItem}>
          <img src={yumeLogo} alt="" className="auth-brand__logo" />
          <span className="auth-brand__name">YumeGo-ji</span>
        </Motion.div>

        <Motion.h1 className="auth-title" variants={loginStaggerItem}>
          <Vi>Tạo tài khoản</Vi>
        </Motion.h1>
        <Motion.p className="auth-subtitle" variants={loginStaggerItem}>
          Tham gia cộng đồng YumeGo-ji ngay hôm nay.
        </Motion.p>

        {!isBackendConfigured() && (
          <div className="auth-alert auth-alert--warn" role="status">
            {BACKEND_MISSING_HINT}
          </div>
        )}

        <div className="mb-4 flex justify-center w-full">
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
          Hoặc tiếp tục bằng email
        </Motion.div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Motion.div variants={loginStaggerParent} initial="hidden" animate="visible">
            <Motion.div className="auth-field" variants={loginStaggerItem}>
              <label htmlFor="register-fullName" className="auth-field__label">
                <Vi>Họ và tên</Vi>
              </label>
              <div className="auth-field__control">
                <span className="auth-field__icon">
                  <User size={18} />
                </span>
                <input
                  id="register-fullName"
                  type="text"
                  className="auth-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
            </Motion.div>

            <Motion.div className="auth-field" variants={loginStaggerItem}>
              <label htmlFor="register-email" className="auth-field__label">
                Email
              </label>
              <div className="auth-field__control">
                <span className="auth-field__icon">
                  <Mail size={18} />
                </span>
                <input
                  id="register-email"
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

            <Motion.div className="auth-field-row auth-field-row--2" variants={loginStaggerItem}>
              <div className="auth-field">
                <label htmlFor="register-password" className="auth-field__label">
                  Mật khẩu
                </label>
                <div className="auth-field__control">
                  <span className="auth-field__icon">
                    <LockKeyhole size={18} />
                  </span>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input auth-input--password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-field__toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="register-confirmPassword" className="auth-field__label">
                  Xác nhận mật khẩu
                </label>
                <div className="auth-field__control">
                  <span className="auth-field__icon">
                    <LockKeyhole size={18} />
                  </span>
                  <input
                    id="register-confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              </div>
            </Motion.div>

            <div className="auth-error-slot" aria-live="polite">
              {error ? <p className="auth-error">{error}</p> : null}
            </div>

            <Motion.div variants={loginStaggerItem}>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <Vi ja="処理中...">Đang xử lý...</Vi> : <Vi>Đăng ký</Vi>}
              </button>
            </Motion.div>
          </Motion.div>
        </form>

        <Motion.p className="auth-switch" variants={loginStaggerItem}>
          Đã có tài khoản? <Link to={ROUTES.LOGIN}><Vi>Đăng nhập</Vi></Link>
        </Motion.p>
      </Motion.div>
    </AuthPageLayout>
  );
}
