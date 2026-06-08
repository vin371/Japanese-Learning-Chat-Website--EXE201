import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { SakuraRainLayer } from '../../components/effects/SakuraRainLayer';


const Motion = motion;

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

function clampRingTarget(ring) {
  const max = Math.max(1, Number(ring.max) || 100);
  const v = Number(ring.value);
  const raw = Number.isFinite(v) ? v : 0;
  return { target: Math.min(max, Math.max(0, raw)), max };
}

/**
 * Màn kết quả phiên — Kurenai + Sakura + đếm điểm + thẻ EXP/Xu.
 *
 * @param {{
 *   className?: string,
 *   kicker: string,
 *   headline: string,
 *   subline?: string,
 *   ring?: { value: number, max: number, centerLabel?: string } | null,
 *   scoreFallback?: import('react').ReactNode,
 *   showPerfect?: boolean,
 *   exp?: number | null,
 *   xu?: number | null,
 *   rewardsLoading?: boolean,
 *   alwaysShowRewardStrip?: boolean,
 *   statsLine?: string | null,
 *   children?: import('react').ReactNode,
 *   links?: import('react').ReactNode,
 *   onPlayAgain: () => void,
 *   playAgainLabel?: string,
 *   secondaryTo: string,
 *   secondaryLabel?: string,
 *   navBack?: { to: string, label: string },
 * }} props
 */
export function PlayKurenaiSummary({
  className = '',
  kicker,
  headline,
  subline = '',
  ring = null,
  scoreFallback = null,
  showPerfect = false,
  exp = null,
  xu = null,
  rewardsLoading = false,
  alwaysShowRewardStrip = false,
  statsLine = null,
  children = null,
  links = null,
  onPlayAgain,
  playAgainLabel = 'Chơi lại',
  secondaryTo,
  secondaryLabel = 'Danh sách game',
  navBack = null,
}) {
  const reduceMotion = useReducedMotion();
  const gradId = useId().replace(/:/g, '');
  const [displayScore, setDisplayScore] = useState(0);
  const [ringProgress, setRingProgress] = useState(0);

  const ringValue = ring != null ? Number(ring.value) : null;
  const ringMax = ring != null ? Number(ring.max) : null;
  const clampedLive =
    ringValue != null && ringMax != null ? clampRingTarget({ value: ringValue, max: ringMax }) : { target: 0, max: 100 };

  useEffect(() => {
    if (reduceMotion || ringValue == null || ringMax == null) return;
    const { target, max } = clampRingTarget({ value: ringValue, max: ringMax });
    let raf = 0;
    const start = performance.now();
    const dur = 1180;
    const tick = (t) => {
      const p = Math.min(1, Math.max(0, (t - start) / dur));
      const eased = 1 - (1 - p) ** 3;
      setDisplayScore(Math.round(target * eased));
      setRingProgress((target / max) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, ringValue, ringMax]);

  const ringProgVisual = reduceMotion ? clampedLive.target / clampedLive.max : ringProgress;
  const scoreNumVisual = reduceMotion ? clampedLive.target : displayScore;
  const dashOffset = ring ? RING_C * (1 - ringProgVisual) : RING_C;
  const centerLabel = ring?.centerLabel?.trim() || 'ĐIỂM';

  const showExpCard = alwaysShowRewardStrip || rewardsLoading || exp != null;
  const showXuCard = alwaysShowRewardStrip || rewardsLoading || xu != null;
  const showRewardRow = showExpCard || showXuCard;

  return (
    <div className={`relative min-h-[100vh] w-full max-w-[640px] mx-auto px-4 sm:px-6 pt-5 pb-10 text-center text-stone-900 dark:text-stone-50 isolation-auto font-sans ${className}`.trim()}>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute inset-0 w-full h-full opacity-40 scale-90 blur-[0.5px]">
          <SakuraRainLayer petalCount={14} />
        </div>
        <div className="absolute inset-0 w-full h-full opacity-70">
          <SakuraRainLayer petalCount={22} buoyant />
        </div>
        <div className="absolute inset-0 w-full h-full opacity-90 scale-110">
          <SakuraRainLayer petalCount={11} buoyant />
        </div>
      </div>
      
      {/* Wash background */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none bg-[#f9f7f2] dark:bg-[#12100e]" 
        style={{
          backgroundImage: `
            radial-gradient(ellipse 60% 45% at 50% -5%, rgba(252, 231, 243, 0.55), transparent 55%),
            radial-gradient(ellipse 45% 35% at 8% 40%, rgba(254, 226, 226, 0.22), transparent 50%),
            repeating-linear-gradient(118deg, transparent 0, transparent 56px, rgba(165, 29, 36, 0.018) 56px, rgba(165, 29, 36, 0.018) 57px)
          `
        }}
        aria-hidden 
      />

      {navBack ? (
        <div className="relative z-10 max-w-[640px] mx-auto pt-1.5 px-4 sm:px-6 text-left">
          <Link className="inline-block text-[0.88rem] font-bold text-rose-700 hover:bg-rose-700/10 rounded-full px-2.5 py-1 transition-colors duration-200" to={navBack.to}>
            {navBack.label}
          </Link>
        </div>
      ) : null}

      <Motion.div
        className="relative z-10"
        initial={reduceMotion ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.05 : 0.48, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="m-0 mb-1.5 text-[0.72rem] font-extrabold tracking-[0.2em] uppercase text-rose-700">{kicker}</p>
        <h1 className="m-0 mb-2.5 text-[clamp(1.55rem,4.2vw,2.1rem)] font-bold text-stone-900 dark:text-stone-50 leading-[1.15]">{headline}</h1>
        {subline ? <p className="mx-auto mt-0 mb-6 max-w-[28rem] text-[0.95rem] leading-[1.55] text-stone-600 dark:text-stone-400">{subline}</p> : null}

        {ring ? (
          <Motion.div
            className="mx-auto mt-0 mb-5 max-w-[22rem] pt-5 px-5 pb-4 bg-white dark:bg-stone-900 rounded-[22px] border border-stone-900/10 dark:border-white/10 shadow-[0_16px_42px_rgba(28,25,23,0.08)]"
            initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative w-[min(220px,72vw)] aspect-square mx-auto mb-1.5">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
                <defs>
                  <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c92a35" />
                    <stop offset="100%" stopColor="#7f151a" />
                  </linearGradient>
                </defs>
                <circle className="fill-none stroke-stone-900/10 stroke-[10]" cx="60" cy="60" r={RING_R} />
                <circle
                  className="fill-none stroke-[10] stroke-linecap-round transition-[stroke-dashoffset] duration-[60ms] ease-linear"
                  cx="60"
                  cy="60"
                  r={RING_R}
                  stroke={`url(#${gradId})`}
                  strokeDasharray={RING_C}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[clamp(2.5rem,9vw,3.35rem)] font-extrabold tabular-nums text-stone-900 dark:text-stone-50 leading-none">{scoreNumVisual}</span>
                <span className="mt-1 text-[0.72rem] font-extrabold tracking-[0.14em] text-stone-600 dark:text-stone-400">{centerLabel}</span>
              </div>
            </div>
            {showPerfect ? (
              <div className="flex justify-center gap-1.5 mt-1.5 mb-0.5" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="text-[0.95rem] leading-none opacity-85 drop-shadow-[0_1px_1px_rgba(165,29,36,0.15)]">
                    🌸
                  </span>
                ))}
              </div>
            ) : null}
            {showPerfect ? <p className="mt-0.5 mb-0 font-serif text-[1.15rem] italic font-bold text-rose-700">Hoàn hảo!</p> : null}
          </Motion.div>
        ) : scoreFallback ? (
          <div className="mx-auto mt-0 mb-5 max-w-[22rem] pt-5 px-5 pb-4 bg-white dark:bg-stone-900 rounded-[22px] border border-stone-900/10 dark:border-white/10 shadow-[0_16px_42px_rgba(28,25,23,0.08)]">
            <div className="m-0 text-[1.35rem] font-extrabold text-stone-900 dark:text-stone-50">{scoreFallback}</div>
          </div>
        ) : null}

        {showRewardRow ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[26rem] mx-auto mb-4">
            {showExpCard ? (
              <Motion.div
                className="flex items-start gap-2.5 px-3.5 py-3 text-left bg-white/80 dark:bg-stone-900/65 border border-stone-900/10 dark:border-white/10 rounded-xl shadow-[0_6px_18px_rgba(28,25,23,0.05)] transition-all hover:-translate-y-[3px] hover:shadow-[0_12px_28px_rgba(28,25,23,0.1)] hover:border-rose-700/20"
                initial={reduceMotion ? false : { opacity: 0, x: -38 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reduceMotion ? 0.05 : 0.48, delay: reduceMotion ? 0 : 0.72, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="shrink-0 flex items-center justify-center w-[2.1rem] h-[2.1rem] rounded-full text-[0.95rem] font-extrabold text-white bg-gradient-to-br from-rose-700 to-rose-900" aria-hidden>
                  ★
                </span>
                <div>
                  <span className="block text-[0.72rem] font-bold text-stone-500 uppercase tracking-[0.06em] mb-0.5">Kinh nghiệm thu được</span>
                  {rewardsLoading ? (
                    <span className="text-[0.82rem] italic text-stone-500">Đang cập nhật…</span>
                  ) : (
                    <span className="text-[1.05rem] font-extrabold tabular-nums text-stone-900 dark:text-stone-50">+{Number(exp) || 0} EXP</span>
                  )}
                </div>
              </Motion.div>
            ) : null}
            {showXuCard ? (
              <Motion.div
                className="flex items-start gap-2.5 px-3.5 py-3 text-left bg-white/80 dark:bg-stone-900/65 border border-stone-900/10 dark:border-white/10 rounded-xl shadow-[0_6px_18px_rgba(28,25,23,0.05)] transition-all hover:-translate-y-[3px] hover:shadow-[0_12px_28px_rgba(28,25,23,0.1)] hover:border-rose-700/20"
                initial={reduceMotion ? false : { opacity: 0, x: 38 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reduceMotion ? 0.05 : 0.48, delay: reduceMotion ? 0 : 0.88, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="shrink-0 flex items-center justify-center w-[2.1rem] h-[2.1rem] rounded-full text-[0.95rem] font-extrabold text-white bg-gradient-to-br from-stone-700 to-stone-900" aria-hidden>
                  ✦
                </span>
                <div>
                  <span className="block text-[0.72rem] font-bold text-stone-500 uppercase tracking-[0.06em] mb-0.5">Xu thưởng</span>
                  {rewardsLoading ? (
                    <span className="text-[0.82rem] italic text-stone-500">Đang cập nhật…</span>
                  ) : (
                    <span className="text-[1.05rem] font-extrabold tabular-nums text-stone-900 dark:text-stone-50">+{Number(xu) || 0} Xu</span>
                  )}
                </div>
              </Motion.div>
            ) : null}
          </div>
        ) : null}

        {statsLine ? <p className="mt-1 mb-0 text-base font-bold tabular-nums text-stone-900 dark:text-stone-50">{statsLine}</p> : null}

        {children ? <div className="mx-auto mt-3 max-w-[28rem] text-left text-[0.88rem] leading-[1.5] text-stone-500 space-y-2">{children}</div> : null}

        {links ? <div className="mx-auto mt-2.5 max-w-[28rem] text-[0.88rem] leading-[1.5] text-stone-500 [&>a]:font-bold [&>a]:text-rose-700 [&>a]:transition-colors [&>a:hover]:border-b [&>a:hover]:border-rose-700/40">{links}</div> : null}

        <div className="flex flex-wrap justify-center gap-3 mt-7">
          <button type="button" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[0.92rem] font-extrabold text-white bg-gradient-to-br from-rose-700 to-rose-900 shadow-[0_8px_24px_rgba(165,29,36,0.35)] transition-all hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_12px_32px_rgba(165,29,36,0.4)] active:translate-y-0" onClick={onPlayAgain}>
            <span className="text-[1.05rem] leading-none opacity-95" aria-hidden>
              ↻
            </span>
            {playAgainLabel}
          </button>
          <Link className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[0.92rem] font-extrabold text-stone-900 dark:text-stone-50 bg-white/90 dark:bg-stone-900/95 border border-stone-900/10 dark:border-white/10 shadow-[0_4px_14px_rgba(28,25,23,0.06)] transition-all hover:-translate-y-0.5 hover:border-rose-700/25 hover:shadow-[0_10px_26px_rgba(28,25,23,0.1)] active:translate-y-0" to={secondaryTo}>
            <span className="text-[1.05rem] leading-none opacity-95" aria-hidden>
              ≡
            </span>
            {secondaryLabel}
          </Link>
        </div>
      </Motion.div>
    </div>
  );
}
