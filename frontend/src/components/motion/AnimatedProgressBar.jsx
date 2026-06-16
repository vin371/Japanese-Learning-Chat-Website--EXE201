import { motion, useReducedMotion } from 'framer-motion';
import { barEase } from '../../utils/learnMotion';

/**
 * Thanh tiến độ animate width khi mount / đổi %.
 */
export default function AnimatedProgressBar({
  percent = 0,
  className = '',
  fillClassName = 'yume-anim-bar__fill',
  'aria-label': ariaLabel,
}) {
  const reduceMotion = useReducedMotion();
  const pct = Math.min(100, Math.max(0, Number(percent) || 0));

  return (
    <div
      className={`yume-anim-bar ${className}`.trim()}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <motion.span
        className={fillClassName}
        initial={reduceMotion ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.85, ease: barEase }}
      />
    </div>
  );
}
