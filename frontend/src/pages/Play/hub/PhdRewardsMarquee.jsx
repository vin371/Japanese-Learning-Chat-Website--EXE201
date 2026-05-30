import { useRef, useEffect, useCallback } from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const useAnimationFrame = callback => {
  const requestRef = useRef(null);
  const previousTimeRef = useRef(null);

  const animate = useCallback(time => {
    // Rút gọn check null/undefined
    if (previousTimeRef.current != null) {
      const delta = time - previousTimeRef.current;
      callback(time, delta);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);
};

export function PhdRewardsMarquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  speed = 50,
  vertical = false,
  repeat = 4,
  ...props
}) {
  // Đã xóa containerRef vì không hề được sử dụng để tính toán kích thước trong logic
  const contentRef = useRef(null);
  const singleContentBlockRef = useRef(null);
  const animX = useRef(0);
  const isPaused = useRef(false);

  useAnimationFrame((t, delta) => {
    if (!contentRef.current || !singleContentBlockRef.current) return;
    if (pauseOnHover && isPaused.current) return;

    const singleContentBlockSize = vertical ? singleContentBlockRef.current.offsetHeight : singleContentBlockRef.current.offsetWidth;
    const contentStyle = window.getComputedStyle(contentRef.current);
    const computedGap = parseFloat(vertical ? contentStyle.rowGap || '0' : contentStyle.columnGap || '0');
    const loopDistance = singleContentBlockSize + computedGap;

    // Rút gọn tính toán khoảng cách
    const dx = (speed * delta) / 1000;
    animX.current += reverse ? dx : -dx;

    if (Math.abs(animX.current) >= loopDistance) {
      animX.current %= loopDistance;
    }

    // Rút gọn set style transform
    contentRef.current.style.transform = vertical
      ? `translateY(${animX.current}px)`
      : `translateX(${animX.current}px)`;
  });

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) isPaused.current = true;
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) isPaused.current = false;
  }, [pauseOnHover]);

  return (
    <div
      {...props}
      className={cn("phd-rewards-marquee", className)}
      style={{
        display: 'flex',
        overflow: 'hidden',
        padding: '0.5rem',
        flexDirection: vertical ? 'column' : 'row',
        '--gap': '2rem',
        gap: 'var(--gap)'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={contentRef}
        style={{
          display: 'flex',
          flexShrink: 0,
          justifyContent: 'space-around',
          flexDirection: vertical ? 'column' : 'row',
          gap: 'var(--gap)'
        }}
      >
        {/* Tối ưu cú pháp lặp Array */}
        {Array.from({ length: repeat }).map((_, i) => (
          <div
            key={i}
            ref={i === 0 ? singleContentBlockRef : null}
            style={{ display: 'flex', gap: '2rem' }}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PhdRewardsMarquee;