import { useEffect, useMemo, useState } from 'react';
import { LEARN_SAFE_THUMBS, LEARN_THUMB_FALLBACK } from '../../../assets/learnThumbs';

function nextFallback(current, tried) {
  const queue = [...LEARN_SAFE_THUMBS, LEARN_THUMB_FALLBACK].filter(Boolean);
  for (const candidate of queue) {
    if (candidate !== current && !tried.has(candidate)) return candidate;
  }
  return LEARN_THUMB_FALLBACK;
}

/** Thumbnail bài học — luân phiên fallback nếu ảnh lỗi */
export function LearnTrackThumb({ src, className }) {
  const initial = src || LEARN_THUMB_FALLBACK;
  const [current, setCurrent] = useState(initial);
  const [tried, setTried] = useState(() => new Set());

  const resetKey = useMemo(() => String(src ?? ''), [src]);

  useEffect(() => {
    setCurrent(src || LEARN_THUMB_FALLBACK);
    setTried(new Set());
  }, [resetKey, src]);

  return (
    <img
      className={className}
      src={current}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => {
        setTried((prev) => {
          const nextTried = new Set(prev);
          nextTried.add(current);
          const fallback = nextFallback(current, nextTried);
          setCurrent(fallback);
          return nextTried;
        });
      }}
    />
  );
}
