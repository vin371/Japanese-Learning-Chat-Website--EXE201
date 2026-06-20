import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { AuthPageLayout } from '../../components/auth/AuthPageLayout';
import { ROUTES } from '../../data/routes';
import { getErrorMessageForUser } from '../../utils/apiErrorMessage';
import { isRequired, isEmail, minLength } from '../../utils/validators';

function extractTokenFromResetUrl(resetUrl) {
  if (!resetUrl || typeof resetUrl !== 'string') return '';
  try {
    const u = resetUrl.startsWith('http://') || resetUrl.startsWith('https://')
      ? new URL(resetUrl)
      : new URL(resetUrl, globalThis.location?.origin || 'http://localhost:8080');
    const t = u.searchParams.get('token');
    return t ? decodeURIComponent(t) : '';
  } catch {
    return '';
  }
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get('token') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const hasTokenInUrl = Boolean(tokenFromUrl);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isRequired(password)) {
      setError('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (!minLength(password, 6)) {
      setError('Mật khẩu cần ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      if (hasTokenInUrl) {
        await authService.resetPassword({ token: tokenFromUrl, newPassword: password });
      } else {
        if (!isRequired(email)) {
          setError('Vui lòng nhập email.');
          setLoading(false);
          return;
        }
        if (!isEmail(email)) {
          setError('Email không hợp lệ.');
          setLoading(false);
          return;
        }
        const data = await authService.forgotPassword({ email });
        const token = extractTokenFromResetUrl(data?.resetUrl);
        if (!token) {
          setError(
            data?.smtpNotConfigured
              ? 'Chưa cấu hình SMTP nên không có email; API dev cũng không trả liên kết (kiểm tra email đã đăng ký, ASPNETCORE_ENVIRONMENT=Development, Frontend:PublicBaseUrl trên backend).'
              : 'Không nhận được mã đặt lại. Email có thể chưa đăng ký, hoặc server production không trả link — hãy mở liên kết trong email sau khi đã cấu hình SMTP.',
          );
          setLoading(false);
          return;
        }
        await authService.resetPassword({ token, newPassword: password });
      }

      setDone(true);
      setTimeout(
        () =>
          navigate(ROUTES.LOGIN, {
            replace: true,
            state: { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập.' },
          }),
        1500,
      );
    } catch (err) {
      setError(getErrorMessageForUser(err, 'Đặt lại mật khẩu thất bại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <h1 className="auth-title">Đặt lại mật khẩu</h1>
      <p className="auth-subtitle">
        {hasTokenInUrl
          ? 'Nhập mật khẩu mới cho tài khoản của bạn.'
          : 'Nhập email đã đăng ký và mật khẩu mới.'}
      </p>

      {done ? (
        <div className="auth-alert auth-alert--success">
          Đã cập nhật. Đang chuyển về trang đăng nhập…
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          {!hasTokenInUrl && (
            <div className="auth-field">
              <label htmlFor="reset-email" className="auth-field__label">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                className="auth-input auth-input--plain"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@email.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
          )}
          <div className="auth-field">
            <label htmlFor="reset-password" className="auth-field__label">
              Mật khẩu mới
            </label>
            <input
              id="reset-password"
              type="password"
              className="auth-input auth-input--plain"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reset-confirm" className="auth-field__label">
              Xác nhận mật khẩu
            </label>
            <input
              id="reset-confirm"
              type="password"
              className="auth-input auth-input--plain"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          <div className="auth-error-slot" aria-live="polite">
            {error ? <p className="auth-error">{error}</p> : null}
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
          </button>

          <div className="pt-3 flex justify-between items-center text-xs">
            <Link to={ROUTES.RESET_PASSWORD} className="auth-link-inline" replace>
              Nhập lại từ đầu
            </Link>
            <Link to={ROUTES.LOGIN} className="auth-link-inline">
              ← Đăng nhập
            </Link>
          </div>
        </form>
      )}
    </AuthPageLayout>
  );
}
