import { Link } from 'react-router-dom';
import { ROUTES } from '../data/routes';
import { Vi } from '../components/ui/Vi';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer id="site-footer" className="layout-footer">
      <div className="sn-container footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">Yumegoji</div>
          <p className="footer-desc">
            <Vi ja="ベトナム人向け日本語学習プラットフォーム — 楽しく学び、長く覚え、毎日会話練習。">
              Nền tảng học tiếng Nhật dành cho người Việt — học vui, nhớ lâu, luyện giao tiếp mỗi ngày.
            </Vi>
          </p>
        </div>
        <div className="footer-col">
          <h4 className="footer-title"><Vi>Học tập</Vi></h4>
          <Link className="footer-link" to={ROUTES.LEARN}>
            <Vi>Lộ trình học JLPT</Vi>
          </Link>
          <a className="footer-link" href={`${ROUTES.HOME}#method`}>
            <Vi>Học Hiragana</Vi>
          </a>
          <a className="footer-link" href={`${ROUTES.HOME}#method`}>
            <Vi>Học Katakana</Vi>
          </a>
          <a className="footer-link" href={`${ROUTES.HOME}#method`}>
            <Vi>Ôn Kanji</Vi>
          </a>
        </div>
        <div className="footer-col">
          <h4 className="footer-title"><Vi>Công ty</Vi></h4>
          <a className="footer-link" href={`${ROUTES.HOME}#why`}>
            <Vi>Giới thiệu</Vi>
          </a>
          <a className="footer-link" href={`${ROUTES.HOME}#lien-he`}>
            <Vi>Tuyển dụng</Vi>
          </a>
          <span id="lien-he" className="footer-link footer-link--static">
            <Vi>Liên hệ</Vi>: support@sakuranihongo.example
          </span>
        </div>
        <div className="footer-col">
          <h4 className="footer-title"><Vi>Pháp lý</Vi></h4>
          <a className="footer-link" href={`${ROUTES.HOME}#site-footer`}>
            <Vi>Chính sách bảo mật</Vi>
          </a>
          <a className="footer-link" href={`${ROUTES.HOME}#site-footer`}>
            <Vi>Điều khoản sử dụng</Vi>
          </a>
          <a className="footer-link" href={`${ROUTES.HOME}#site-footer`}>
            <Vi>Chính sách hoàn tiền</Vi>
          </a>
        </div>
      </div>
      <div className="footer-bottom sn-container">
        <span>&copy; {year} YumeGo-ji. All rights reserved.</span>
      </div>
    </footer>
  );
}
