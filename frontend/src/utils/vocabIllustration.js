/**
 * Minh họa từ vựng — gradient + emoji theo nghĩa (không cần ảnh upload).
 * Có thể mở rộng thêm imageUrl từ API sau này.
 */

const RULES = [
  { test: /tôi|mình|わたし|私/, emoji: '🙋', tone: 'rose' },
  { test: /bạn|あなた|anata/, emoji: '👋', tone: 'sky' },
  { test: /anh|chị|em|ông|bà|cha|mẹ|父|母/, emoji: '👨‍👩‍👧', tone: 'amber' },
  { test: /tên|名前/, emoji: '🪪', tone: 'violet' },
  { test: /tuổi|年|歳/, emoji: '🎂', tone: 'pink' },
  { test: /quốc|国|国籍/, emoji: '🌏', tone: 'teal' },
  { test: /nghề|仕事|職|会社|員/, emoji: '💼', tone: 'slate' },
  { test: /học|学|生|学校|大学/, emoji: '🎓', tone: 'indigo' },
  { test: /nhà|家|部屋/, emoji: '🏠', tone: 'orange' },
  { test: /ăn|食|飲|料理|ご飯/, emoji: '🍱', tone: 'amber' },
  { test: /uống|飲/, emoji: '🍵', tone: 'green' },
  { test: /xe|車|電車|バス/, emoji: '🚃', tone: 'cyan' },
  { test: /thời gian|時|分|曜|月|火|水|木|金|土|日/, emoji: '🕐', tone: 'violet' },
  { test: /tiền|円|買|売/, emoji: '💴', tone: 'emerald' },
  { test: /mua|買/, emoji: '🛍️', tone: 'rose' },
  { test: /thời tiết|天気|雨|雪|晴/, emoji: '⛅', tone: 'sky' },
  { test: /mắt|目|見/, emoji: '👁️', tone: 'blue' },
  { test: /tay|手|足/, emoji: '✋', tone: 'peach' },
  { test: /nói|言|話/, emoji: '💬', tone: 'lavender' },
  { test: /nghe|聞/, emoji: '👂', tone: 'mint' },
  { test: /đi|行|来/, emoji: '🚶', tone: 'teal' },
  { test: /lớn|小|大|高|安/, emoji: '📏', tone: 'slate' },
  { test: /mới|古|新/, emoji: '✨', tone: 'gold' },
  { test: /bạn bè|友/, emoji: '🤝', tone: 'coral' },
  { test: /chào|こん|おは|ありがと/, emoji: '🙏', tone: 'rose' },
];

const TONE_GRADIENTS = {
  rose: 'linear-gradient(145deg, #fb7185 0%, #be123c 55%, #4c0519 100%)',
  sky: 'linear-gradient(145deg, #38bdf8 0%, #0284c7 55%, #0c4a6e 100%)',
  amber: 'linear-gradient(145deg, #fbbf24 0%, #d97706 55%, #78350f 100%)',
  violet: 'linear-gradient(145deg, #a78bfa 0%, #7c3aed 55%, #3b0764 100%)',
  pink: 'linear-gradient(145deg, #f472b6 0%, #db2777 55%, #831843 100%)',
  teal: 'linear-gradient(145deg, #2dd4bf 0%, #0d9488 55%, #134e4a 100%)',
  slate: 'linear-gradient(145deg, #94a3b8 0%, #475569 55%, #1e293b 100%)',
  indigo: 'linear-gradient(145deg, #818cf8 0%, #4f46e5 55%, #312e81 100%)',
  orange: 'linear-gradient(145deg, #fb923c 0%, #ea580c 55%, #7c2d12 100%)',
  green: 'linear-gradient(145deg, #4ade80 0%, #16a34a 55%, #14532d 100%)',
  cyan: 'linear-gradient(145deg, #22d3ee 0%, #0891b2 55%, #164e63 100%)',
  emerald: 'linear-gradient(145deg, #34d399 0%, #059669 55%, #064e3b 100%)',
  blue: 'linear-gradient(145deg, #60a5fa 0%, #2563eb 55%, #1e3a8a 100%)',
  peach: 'linear-gradient(145deg, #fdba74 0%, #f97316 55%, #9a3412 100%)',
  lavender: 'linear-gradient(145deg, #c4b5fd 0%, #8b5cf6 55%, #4c1d95 100%)',
  mint: 'linear-gradient(145deg, #6ee7b7 0%, #10b981 55%, #065f46 100%)',
  gold: 'linear-gradient(145deg, #fde047 0%, #ca8a04 55%, #713f12 100%)',
  coral: 'linear-gradient(145deg, #fda4af 0%, #f43f5e 55%, #881337 100%)',
  default: 'linear-gradient(145deg, #e879f9 0%, #9333ea 45%, #1e1b4b 100%)',
};

const DEFAULT = { emoji: '📖', tone: 'default' };

/**
 * @param {{ wordJp?: string, WordJp?: string, meaningVi?: string, MeaningVi?: string, imageUrl?: string, ImageUrl?: string }} item
 */
export function getVocabIllustration(item) {
  const imageUrl = item?.imageUrl ?? item?.ImageUrl;
  if (imageUrl) {
    return { type: 'image', imageUrl, emoji: null, gradient: null };
  }

  const meaning = String(item?.meaningVi ?? item?.MeaningVi ?? '').toLowerCase();
  const word = String(item?.wordJp ?? item?.WordJp ?? '');
  const haystack = `${meaning} ${word}`;

  const rule = RULES.find((r) => r.test.test(haystack)) ?? DEFAULT;
  return {
    type: 'scene',
    emoji: rule.emoji,
    gradient: TONE_GRADIENTS[rule.tone] ?? TONE_GRADIENTS.default,
  };
}
