import {
  LEARN_LEVEL_HERO,
  LEARN_LEVEL_POOLS,
  LEARN_SAFE_THUMBS,
  LEARN_THEME_IMAGES,
  LEARN_THUMB_FALLBACK,
} from '../assets/learnThumbs';
import { N4_LEVEL_HERO_IMAGE, resolveN4LessonImage } from '../data/n4LessonImages';
import { N5_LEVEL_HERO_IMAGE, resolveN5LessonImage } from '../data/n5LessonImages';

export { LEARN_LEVEL_HERO, LEARN_SAFE_THUMBS, LEARN_THUMB_FALLBACK };

const SLUG_RULES = [
  { keys: ['gioi-thieu-ban-than', 'self-intro', 'ban-than'], theme: 'self-intro' },
  { keys: ['day-la-gi', 'cai-gi', 'kore'], theme: 'what-is' },
  { keys: ['dia-diem', 'place', 'noi-chon'], theme: 'place' },
  { keys: ['so-luong', 'tan-suat', 'so-dem', 'dem'], theme: 'numbers' },
  { keys: ['tinh-tu', 'keiyoushi'], theme: 'adjective' },
  { keys: ['mong-muon', 'tai', 'kibou'], theme: 'desire' },
  { keys: ['hoi-thoai', 'kaiwa', 'chao-hoi'], theme: 'conversation' },
  { keys: ['thoi-gian', 'time', 'lich'], theme: 'time' },
  { keys: ['gia-dinh', 'family'], theme: 'family' },
  { keys: ['mua-sam', 'shopping'], theme: 'shopping' },
  { keys: ['an-uong', 'food', 'nha-hang'], theme: 'food' },
  { keys: ['du-lich', 'travel', 'di-lai', 'di-dau'], theme: 'travel' },
  { keys: ['kanji', 'chu-han'], theme: 'kanji' },
  { keys: ['hiragana', 'katakana', 'bang-chu'], theme: 'kana' },
  { keys: ['tong-on', 'on-tap'], theme: 'review' },
  { keys: ['hanh-dong', 'hang-ngay'], theme: 'daily' },
  { keys: ['liet-ke', 'noi-cau'], theme: 'list-sentence' },
  { keys: ['trich-loi', 'suy-nghi'], theme: 'quote' },
];

const TITLE_RULES = [
  { keys: ['giới thiệu', 'bản thân', '自己紹介'], theme: 'self-intro' },
  { keys: ['đây là gì', 'cái gì', 'なに', '何'], theme: 'what-is' },
  { keys: ['địa điểm', 'nơi chốn', '場所', 'どこ'], theme: 'place' },
  { keys: ['chào hỏi', 'こん', 'おは'], theme: 'greeting' },
  { keys: ['số lượng', 'tần suất', 'số đếm', 'đếm', '数'], theme: 'numbers' },
  { keys: ['tính từ', '形容詞'], theme: 'adjective' },
  { keys: ['mong muốn', 'muốn', '希望', 'たい'], theme: 'desire' },
  { keys: ['hội thoại', '会話', 'trò chuyện'], theme: 'conversation' },
  { keys: ['thời gian', 'giờ', '時間', '時'], theme: 'time' },
  { keys: ['đi đâu', 'với ai', 'đi lại', '旅行'], theme: 'travel' },
  { keys: ['hành động', 'hằng ngày', 'sinh hoạt'], theme: 'daily' },
  { keys: ['gia đình', '家族', 'người nhà'], theme: 'family' },
  { keys: ['mua sắm', 'cửa hàng', '買'], theme: 'shopping' },
  { keys: ['ăn uống', 'nhà hàng', '食', 'món'], theme: 'food' },
  { keys: ['du lịch', '交通'], theme: 'travel' },
  { keys: ['thời tiết', '天気'], theme: 'weather' },
  { keys: ['công việc', 'làm việc', '仕事'], theme: 'work' },
  { keys: ['sức khoẻ', 'bệnh viện', '体'], theme: 'health' },
  { keys: ['kanji', 'chữ hán', '漢字'], theme: 'kanji' },
  { keys: ['hiragana', 'katakana', 'bảng chữ', 'アルファベット'], theme: 'kana' },
  { keys: ['tổng ôn', 'ôn tập', 'review'], theme: 'review' },
  { keys: ['liệt kê', 'nối câu'], theme: 'list-sentence' },
  { keys: ['suy nghĩ', 'trích lời'], theme: 'quote' },
  { keys: ['động từ', 'verb', '動詞'], theme: 'verb' },
  { keys: ['quá khứ', 'tương lai', 'thì'], theme: 'verb' },
];

function norm(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function themeFromRules(slug, title) {
  const s = norm(slug);
  if (s) {
    for (const rule of SLUG_RULES) {
      if (rule.keys.some((k) => s.includes(norm(k)))) return rule.theme;
    }
  }
  const t = norm(title);
  if (t) {
    for (const rule of TITLE_RULES) {
      if (rule.keys.some((k) => t.includes(norm(k)))) return rule.theme;
    }
  }
  return null;
}

function poolFor(levelCode, section) {
  const lv = LEARN_LEVEL_POOLS[String(levelCode || 'N5').toUpperCase()] || LEARN_LEVEL_POOLS.N5;
  return lv[section] || lv.default || LEARN_SAFE_THUMBS;
}

/** Hash ổn định — mỗi bài một ảnh khác nhau trong pool */
function pickFromPool(pool, opts) {
  const safePool = pool?.length ? pool : LEARN_SAFE_THUMBS;
  const key = [
    opts?.lessonId ?? '',
    opts?.sortOrder ?? '',
    norm(opts?.title),
    norm(opts?.slug),
    opts?.section ?? '',
    opts?.levelCode ?? '',
  ].join('|');
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return safePool[hash % safePool.length] || LEARN_THUMB_FALLBACK;
}

/**
 * @param {{ title?: string, slug?: string, section?: string, levelCode?: string, sortOrder?: number, lessonId?: number }} opts
 */
export function resolveLearnLessonThumb(opts) {
  const n5Image = resolveN5LessonImage(opts);
  if (n5Image) return n5Image;

  const n4Image = resolveN4LessonImage(opts);
  if (n4Image) return n4Image;

  const theme = themeFromRules(opts?.slug, opts?.title);
  if (theme && LEARN_THEME_IMAGES[theme]) {
    return LEARN_THEME_IMAGES[theme];
  }
  return pickFromPool(poolFor(opts?.levelCode, opts?.section), opts);
}

export function resolveLearnLevelHero(levelCode) {
  const code = String(levelCode || 'N5').toUpperCase();
  if (code === 'N5') return N5_LEVEL_HERO_IMAGE;
  if (code === 'N4') return N4_LEVEL_HERO_IMAGE;
  return LEARN_LEVEL_HERO[code] || LEARN_THUMB_FALLBACK;
}