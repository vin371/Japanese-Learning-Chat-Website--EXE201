/** Tách tiêu đề bài học theo dấu phân cách phổ biến (・ · •). */
const TITLE_SPLIT_RE = /\s*[・·•|\u00b7]\s*/;

export function splitLearnLessonTitle(title) {
  const full = String(title ?? '').trim();
  if (!full) return { primary: '', secondary: null, full: '' };

  const parts = full.split(TITLE_SPLIT_RE).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return { primary: full, secondary: null, full };

  return {
    primary: parts[0],
    secondary: parts.slice(1).join(' '),
    full,
  };
}
