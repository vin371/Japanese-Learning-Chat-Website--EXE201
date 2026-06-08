import { SakuraRainLayer } from '../effects/SakuraRainLayer';
import { PLAY_SETUP_BG } from './playSetupMotion';

/**
 * Vỏ nền setup trò chơi — Sakura + ảnh zen nhạt (CSS).
 * Trang con bọc `Motion.div` (variants parent) ngay bên trong `children`.
 */
export function PlayGameSetupPro({ children }) {
  return (
    <div className="relative isolate w-full py-0.5 pb-8 min-h-0" style={{ '--play-setup-zen-bg': `url("${PLAY_SETUP_BG}")` }}>
      <div className="absolute inset-x-0 -top-2 bottom-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
        <SakuraRainLayer petalCount={22} buoyant />
      </div>
      <div 
        className="absolute inset-0 z-0 pointer-events-none play-setup-zenwash-tw" 
        style={{
          background: 'radial-gradient(ellipse 70% 55% at 12% 8%, rgba(254, 205, 211, 0.45), transparent 52%), radial-gradient(ellipse 60% 50% at 92% 18%, rgba(252, 231, 243, 0.5), transparent 48%), radial-gradient(ellipse 50% 40% at 8% 88%, rgba(254, 226, 226, 0.35), transparent 50%), linear-gradient(180deg, #fffafb 0%, #fdf4f6 45%, #faf5f7 100%)',
          opacity: 0.97
        }}
        aria-hidden 
      />
      <style>{`
        html[data-theme='dark'] .play-setup-zenwash-tw {
          background: radial-gradient(ellipse 65% 50% at 15% 10%, rgba(190, 24, 60, 0.12), transparent 55%), linear-gradient(180deg, #0f1117 0%, #151821 100%) !important;
          opacity: 1 !important;
        }
      `}</style>
      {children}
    </div>
  );
}
