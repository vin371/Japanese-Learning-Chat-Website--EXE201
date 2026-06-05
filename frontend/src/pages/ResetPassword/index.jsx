import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { AuthHeroAvatars } from '../../components/auth/AuthHeroAvatars';
import { ROUTES } from '../../data/routes';
import { getErrorMessageForUser } from '../../utils/apiErrorMessage';
import { isRequired, isEmail, minLength } from '../../utils/validators';

/** Lấy token từ URL đầy đủ do API dev trả (vd http://localhost:8080/reset-password?token=…). */
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
    <div className="relative min-h-[calc(100vh-72px)] flex items-stretch overflow-hidden font-sans bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <div className="relative z-10 w-full min-h-[calc(100vh-72px)] bg-white dark:bg-slate-900 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Cột bên trái: Ảnh núi Phú Sĩ */}
        <section 
          className="relative min-h-[320px] lg:min-h-[min(720px,calc(100vh-72px))] p-8 lg:p-12 pb-16 flex flex-col justify-end items-start text-white bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(2, 6, 23, 0.05) 0%, rgba(2, 6, 23, 0.55) 100%), url('/hero-japan.png')`
          }}
        >
          <div className="relative z-10 max-w-lg">
            <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-3 text-white drop-shadow-md">
              Mật khẩu mới, hành trình tiếp tục.
            </h2>
            <p className="text-white/90 max-w-md text-sm lg:text-base leading-relaxed drop-shadow-sm">
              Chọn mật khẩu đủ mạnh và dễ nhớ với bạn.
            </p>
            <div className="mt-6 inline-flex items-center gap-3 py-2 px-4 pl-3 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-xs lg:text-sm text-white/95 shadow-lg" aria-hidden="true">
              <AuthHeroAvatars />
              <div>
                Đã có hơn <strong className="font-bold">12.000</strong> học viên đồng hành
              </div>
            </div>
          </div>
        </section>

        {/* Lông vũ trắng nối ảnh Fuji/Japan → panel (chỉ hiển thị trên LG) */}
        <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[min(110px,14vw)] z-20 pointer-events-none bg-gradient-to-r from-transparent via-white/50 to-white dark:via-slate-900/50 dark:to-slate-900" />

        {/* Cột bên phải: Form đặt lại mật khẩu */}
        <section className="relative z-30 bg-white dark:bg-slate-900 px-6 py-10 lg:px-12 lg:py-16 flex flex-col justify-center w-full max-w-[540px] mx-auto">
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 text-center mb-1.5">Đặt lại mật khẩu</h1>
          <p className="text-slate-500 dark:text-slate-400 text-center text-sm lg:text-base mb-6">
            {hasTokenInUrl
              ? 'Nhập mật khẩu mới cho tài khoản của bạn.'
              : 'Nhập email đã đăng ký và mật khẩu mới (một bước — không cần trang quên mật khẩu riêng).'}
          </p>

          {done ? (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              Đã cập nhật. Đang chuyển về trang đăng nhập…
            </div>
          ) : (
            <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
              {!hasTokenInUrl && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reset-email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 hover:border-rose-300 transition-all shadow-inner text-sm lg:text-base"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@email.com"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reset-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mật khẩu mới
                </label>
                <input
                  id="reset-password"
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 hover:border-rose-300 transition-all shadow-inner text-sm lg:text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reset-confirm" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Xác nhận mật khẩu
                </label>
                <input
                  id="reset-confirm"
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 hover:border-rose-300 transition-all shadow-inner text-sm lg:text-base"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
              
              <div className="min-h-[20px]" aria-live="polite">
                {error ? <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}
              </div>

              <button type="submit" className="w-full py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/35 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[46px]" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
              </button>

              <div className="pt-2 flex justify-between items-center text-xs">
                <Link to={ROUTES.RESET_PASSWORD} className="font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors" replace>
                  Nhập lại từ đầu
                </Link>
                <Link to={ROUTES.LOGIN} className="font-semibold text-rose-600 dark:text-rose-400 hover:underline transition-colors">
                  ← Đăng nhập
                </Link>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
