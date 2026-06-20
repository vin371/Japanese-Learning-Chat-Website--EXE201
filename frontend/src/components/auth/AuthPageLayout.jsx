import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../data/routes';
import { AuthSakuraLayer } from './AuthSakuraLayer';

/** Trang đăng nhập / đăng ký — full màn hình, không header/footer, không ảnh hero. */
export function AuthPageLayout({ children }) {
  return (
    <div className="auth-page">
      <AuthSakuraLayer count={14} />
      <Link to={ROUTES.HOME} className="auth-page__home">
        <ArrowLeft size={17} aria-hidden />
        Về trang chủ
      </Link>
      <div className="auth-page__center">
        <div className="auth-page__card">{children}</div>
      </div>
    </div>
  );
}
