import { useEffect, useState } from 'react';

const BASE_TEXT = 'Đang xếp cấp độ cho bạn';

export function AnimatedMessage({ baseText = BASE_TEXT, intervalMs = 450 }) {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d >= 3 ? 1 : d + 1));
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return (
    <p className="placement-processing__title" aria-live="polite">
      {baseText}
      {'.'.repeat(dots)}
    </p>
  );
}
