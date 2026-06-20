import { motion } from 'framer-motion';

const Motion = motion;

/**
 * Banner động viên cuối màn setup game — gradient + chữ Nhật trang trí, không dùng ảnh mờ.
 */
export function PlaySetupMotivationBanner({ variants }) {
  return (
    <Motion.section
      variants={variants}
      className="play-setup-motivation"
      aria-label="Lời chúc học tập"
    >
      <div className="play-setup-motivation__aurora" aria-hidden />
      <span className="play-setup-motivation__glyph play-setup-motivation__glyph--a" aria-hidden>
        学
      </span>
      <span className="play-setup-motivation__glyph play-setup-motivation__glyph--b" aria-hidden>
        遊
      </span>
      <div className="play-setup-motivation__petals" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="play-setup-motivation__content">
        <p className="play-setup-motivation__kicker">がんばって！</p>
        <p className="play-setup-motivation__title">Chúc bạn học vui!</p>
        <p className="play-setup-motivation__sub">
          Mỗi ván chơi là thêm một bước gần hơn với tiếng Nhật — cố lên nhé!
        </p>
      </div>
    </Motion.section>
  );
}
