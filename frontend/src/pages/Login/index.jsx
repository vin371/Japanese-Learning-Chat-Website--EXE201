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
import { useGoogleIdentityButton } from '../../hooks/useGoogleIdentityButton';
import {
  loginShellVariants,
  loginStaggerParent,
  loginStaggerItem,
  loginHeroGlass,
} from './loginMotion';
import { Mail, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import yumeLogo from '../../assets/yume-logo.png';

const Motion = FM.motion;

function IconGoogleG() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" overflow="hidden" viewBox="0 0 268.152 273.883"><defs><linearGradient id="a"><stop offset="0" stop-color="#0fbc5c" /><stop offset="1" stop-color="#0cba65" /></linearGradient><linearGradient id="g"><stop offset=".231" stop-color="#0fbc5f" /><stop offset=".312" stop-color="#0fbc5f" /><stop offset=".366" stop-color="#0fbc5e" /><stop offset=".458" stop-color="#0fbc5d" /><stop offset=".54" stop-color="#12bc58" /><stop offset=".699" stop-color="#28bf3c" /><stop offset=".771" stop-color="#38c02b" /><stop offset=".861" stop-color="#52c218" /><stop offset=".915" stop-color="#67c30f" /><stop offset="1" stop-color="#86c504" /></linearGradient><linearGradient id="h"><stop offset=".142" stop-color="#1abd4d" /><stop offset=".248" stop-color="#6ec30d" /><stop offset=".312" stop-color="#8ac502" /><stop offset=".366" stop-color="#a2c600" /><stop offset=".446" stop-color="#c8c903" /><stop offset=".54" stop-color="#ebcb03" /><stop offset=".616" stop-color="#f7cd07" /><stop offset=".699" stop-color="#fdcd04" /><stop offset=".771" stop-color="#fdce05" /><stop offset=".861" stop-color="#ffce0a" /></linearGradient><linearGradient id="f"><stop offset=".316" stop-color="#ff4c3c" /><stop offset=".604" stop-color="#ff692c" /><stop offset=".727" stop-color="#ff7825" /><stop offset=".885" stop-color="#ff8d1b" /><stop offset="1" stop-color="#ff9f13" /></linearGradient><linearGradient id="b"><stop offset=".231" stop-color="#ff4541" /><stop offset=".312" stop-color="#ff4540" /><stop offset=".458" stop-color="#ff4640" /><stop offset=".54" stop-color="#ff473f" /><stop offset=".699" stop-color="#ff5138" /><stop offset=".771" stop-color="#ff5b33" /><stop offset=".861" stop-color="#ff6c29" /><stop offset="1" stop-color="#ff8c18" /></linearGradient><linearGradient id="d"><stop offset=".408" stop-color="#fb4e5a" /><stop offset="1" stop-color="#ff4540" /></linearGradient><linearGradient id="c"><stop offset=".132" stop-color="#0cba65" /><stop offset=".21" stop-color="#0bb86d" /><stop offset=".297" stop-color="#09b479" /><stop offset=".396" stop-color="#08ad93" /><stop offset=".477" stop-color="#0aa6a9" /><stop offset=".568" stop-color="#0d9cc6" /><stop offset=".667" stop-color="#1893dd" /><stop offset=".769" stop-color="#258bf1" /><stop offset=".859" stop-color="#3086ff" /></linearGradient><linearGradient id="e"><stop offset=".366" stop-color="#ff4e3a" /><stop offset=".458" stop-color="#ff8a1b" /><stop offset=".54" stop-color="#ffa312" /><stop offset=".616" stop-color="#ffb60c" /><stop offset=".771" stop-color="#ffcd0a" /><stop offset=".861" stop-color="#fecf0a" /><stop offset=".915" stop-color="#fecf08" /><stop offset="1" stop-color="#fdcd01" /></linearGradient><linearGradient xlink:href="#a" id="s" x1="219.7" x2="254.467" y1="329.535" y2="329.535" gradientUnits="userSpaceOnUse" /><radialGradient xlink:href="#b" id="m" cx="109.627" cy="135.862" r="71.46" fx="109.627" fy="135.862" gradientTransform="matrix(-1.93688 1.043 1.45573 2.55542 290.525 -400.634)" gradientUnits="userSpaceOnUse" /><radialGradient xlink:href="#c" id="n" cx="45.259" cy="279.274" r="71.46" fx="45.259" fy="279.274" gradientTransform="matrix(-3.5126 -4.45809 -1.69255 1.26062 870.8 191.554)" gradientUnits="userSpaceOnUse" /><radialGradient xlink:href="#d" id="l" cx="304.017" cy="118.009" r="47.854" fx="304.017" fy="118.009" gradientTransform="matrix(2.06435 0 0 2.59204 -297.679 -151.747)" gradientUnits="userSpaceOnUse" /><radialGradient xlink:href="#e" id="o" cx="181.001" cy="177.201" r="71.46" fx="181.001" fy="177.201" gradientTransform="matrix(-.24858 2.08314 2.96249 .33417 -255.146 -331.164)" gradientUnits="userSpaceOnUse" /><radialGradient xlink:href="#f" id="p" cx="207.673" cy="108.097" r="41.102" fx="207.673" fy="108.097" gradientTransform="matrix(-1.2492 1.34326 -3.89684 -3.4257 880.501 194.905)" gradientUnits="userSpaceOnUse" /><radialGradient xlink:href="#g" id="r" cx="109.627" cy="135.862" r="71.46" fx="109.627" fy="135.862" gradientTransform="matrix(-1.93688 -1.043 1.45573 -2.55542 290.525 838.683)" gradientUnits="userSpaceOnUse" /><radialGradient xlink:href="#h" id="j" cx="154.87" cy="145.969" r="71.46" fx="154.87" fy="145.969" gradientTransform="matrix(-.0814 -1.93722 2.92674 -.11625 -215.135 632.86)" gradientUnits="userSpaceOnUse" /><filter id="q" width="1.097" height="1.116" x="-.048" y="-.058" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1.701" /></filter><filter id="k" width="1.033" height="1.02" x="-.017" y="-.01" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".242" /></filter><clipPath id="i" clipPathUnits="userSpaceOnUse"><path d="M371.378 193.24H237.083v53.438h77.167c-1.241 7.563-4.026 15.003-8.105 21.786-4.674 7.773-10.451 13.69-16.373 18.196-17.74 13.498-38.42 16.258-52.783 16.258-36.283 0-67.283-23.286-79.285-54.928-.484-1.149-.805-2.335-1.197-3.507a81.115 81.115 0 0 1-4.101-25.448c0-9.226 1.569-18.057 4.43-26.398 11.285-32.897 42.985-57.467 80.179-57.467 7.481 0 14.685.884 21.517 2.648a77.668 77.668 0 0 1 33.425 18.25l40.834-39.712c-24.839-22.616-57.219-36.32-95.844-36.32-30.878 0-59.386 9.553-82.748 25.7-18.945 13.093-34.483 30.625-44.97 50.985-9.753 18.879-15.094 39.8-15.094 62.294 0 22.495 5.35 43.633 15.103 62.337v.126c10.302 19.857 25.368 36.954 43.678 49.988 15.997 11.386 44.68 26.551 84.031 26.551 22.63 0 42.687-4.051 60.375-11.644 12.76-5.478 24.065-12.622 34.301-21.804 13.525-12.132 24.117-27.139 31.347-44.404 7.23-17.265 11.097-36.79 11.097-57.957 0-9.858-.998-19.87-2.689-28.968Z" /></clipPath></defs><g clip-path="url(#i)" transform="matrix(.95792 0 0 .98525 -90.174 -78.856)"><path fill="url(#j)" d="M92.076 219.958c.148 22.14 6.501 44.983 16.117 63.424v.127c6.949 13.392 16.445 23.97 27.26 34.452l65.327-23.67c-12.36-6.235-14.246-10.055-23.105-17.026-9.054-9.066-15.802-19.473-20.004-31.677h-.17l.17-.127c-2.765-8.058-3.037-16.613-3.14-25.503Z" filter="url(#k)" /><path fill="url(#l)" d="M237.083 79.025c-6.456 22.526-3.988 44.421 0 57.161 7.457.006 14.64.888 21.45 2.647a77.662 77.662 0 0 1 33.424 18.25l41.88-40.726c-24.81-22.59-54.667-37.297-96.754-37.332Z" filter="url(#k)" /><path fill="url(#m)" d="M236.943 78.847c-31.67 0-60.91 9.798-84.871 26.359a145.533 145.533 0 0 0-24.332 21.15c-1.904 17.744 14.257 39.551 46.262 39.37 15.528-17.936 38.495-29.542 64.056-29.542l.07.002-1.044-57.335c-.048 0-.093-.004-.14-.004Z" filter="url(#k)" /><path fill="url(#n)" d="m341.475 226.379-28.268 19.285c-1.24 7.562-4.028 15.002-8.107 21.786-4.674 7.772-10.45 13.69-16.373 18.196-17.702 13.47-38.328 16.244-52.687 16.255-14.842 25.102-17.444 37.675 1.043 57.934 22.877-.016 43.157-4.117 61.046-11.796 12.931-5.551 24.388-12.792 34.761-22.097 13.706-12.295 24.442-27.503 31.769-45 7.327-17.497 11.245-37.282 11.245-58.734Z" filter="url(#k)" /><path fill="#3086ff" d="M234.996 191.21v57.498h136.006c1.196-7.874 5.152-18.064 5.152-26.5 0-9.858-.996-21.899-2.687-30.998Z" filter="url(#k)" /><path fill="url(#o)" d="M128.39 124.327c-8.394 9.119-15.564 19.326-21.249 30.364-9.753 18.879-15.094 41.83-15.094 64.324 0 .317.026.627.029.944 4.32 8.224 59.666 6.649 62.456 0-.004-.31-.039-.613-.039-.924 0-9.226 1.57-16.026 4.43-24.367 3.53-10.289 9.056-19.763 16.123-27.926 1.602-2.031 5.875-6.397 7.121-9.016.475-.997-.862-1.557-.937-1.908-.083-.393-1.876-.077-2.277-.37-1.275-.929-3.8-1.414-5.334-1.845-3.277-.921-8.708-2.953-11.725-5.06-9.536-6.658-24.417-14.612-33.505-24.216Z" filter="url(#k)" /><path fill="url(#p)" d="M162.099 155.857c22.112 13.301 28.471-6.714 43.173-12.977l-25.574-52.664a144.74 144.74 0 0 0-26.543 14.504c-12.316 8.512-23.192 18.9-32.176 30.72Z" filter="url(#q)" /><path fill="url(#r)" d="M171.099 290.222c-29.683 10.641-34.33 11.023-37.062 29.29a144.806 144.806 0 0 0 16.792 13.984c15.996 11.386 46.766 26.551 86.118 26.551.046 0 .09-.004.137-.004v-59.157l-.094.002c-14.736 0-26.512-3.843-38.585-10.527-2.977-1.648-8.378 2.777-11.123.799-3.786-2.729-12.9 2.35-16.183-.938Z" filter="url(#k)" /><path fill="url(#s)" d="M219.7 299.023v59.996c5.506.64 11.236 1.028 17.247 1.028 6.026 0 11.855-.307 17.52-.872v-59.748a105.119 105.119 0 0 1-17.477 1.461c-5.932 0-11.7-.686-17.29-1.865Z" filter="url(#k)" opacity=".5" /></g></svg>
  );
}

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

  const { mountRef: googleBtnRef, clientIdConfigured } = useGoogleIdentityButton(onGoogleCredential, {
    text: 'signin_with',
  });

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

              {error && (
                <Motion.p className="form-error" variants={loginStaggerItem}>
                  {error}
                </Motion.p>
              )}

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

          <Motion.div
            className="auth-google-only"
            variants={loginStaggerItem}
            whileHover={{ y: -1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <p className="auth-google-only__label">Đăng nhập với</p>
            <div className="auth-google-pill-wrap">
              {clientIdConfigured ? (
                <div ref={googleBtnRef} className="auth-google-mount auth-google-mount--pill" />
              ) : (
                <Motion.button
                  type="button"
                  className="auth-google-fallback-pill"
                  disabled={loading}
                  onClick={() =>
                    setError(
                      'Chưa cấu hình Google OAuth: thêm VITE_GOOGLE_CLIENT_ID vào frontend/.env (xem .env.example), GoogleAuth:ClientId trên backend, và chạy backend/doc/sql/060-google-oauth-users.sql nếu DB chưa có google_sub.',
                    )
                  }
                  aria-label="Đăng nhập với Google — cần cấu hình Client ID"
                  title="Cần VITE_GOOGLE_CLIENT_ID — xem frontend/.env.example"
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  <IconGoogleG />
                  <span>Google</span>
                </Motion.button>
              )}
            </div>
          </Motion.div>

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
