import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { barEase } from '../../../utils/learnMotion';

const MotionCircle = motion.circle;

/**
 * Vòng tròn tiến độ — animate khi % thay đổi.
 * @param {number|null|undefined} percent — 0–100 hoặc null khi chưa có dữ liệu
 */
export function LearnProgressRing({ percent, size = 132 }) {
  const reduceMotion = useReducedMotion();
  const has = percent != null && !Number.isNaN(Number(percent));
  const pct = has ? Math.min(100, Math.max(0, Number(percent))) : 0;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const targetDash = has ? c * (1 - pct / 100) : c;
  const [dash, setDash] = useState(reduceMotion ? targetDash : c);

  useEffect(() => {
    if (!has) {
      setDash(c);
      return;
    }
    if (reduceMotion) {
      setDash(targetDash);
      return;
    }
    const id = requestAnimationFrame(() => setDash(targetDash));
    return () => cancelAnimationFrame(id);
  }, [has, targetDash, c, reduceMotion]);

  return (
    <div className="learn-hero-ring" style={{ width: size, height: size }} aria-hidden={!has}>
      <svg className="learn-hero-ring__svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="learn-hero-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        {has ? (
          <MotionCircle
            className="learn-hero-ring__arc"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={reduceMotion ? false : { strokeDashoffset: c }}
            animate={{ strokeDashoffset: dash }}
            transition={reduceMotion ? { duration: 0 } : { duration: 1, ease: barEase }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </svg>
      <div className="learn-hero-ring__label">
        <motion.span
          className="learn-hero-ring__pct"
          key={has ? pct : 'empty'}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: barEase }}
        >
          {has ? `${pct}%` : '—'}
        </motion.span>
      </div>
    </div>
  );
}
