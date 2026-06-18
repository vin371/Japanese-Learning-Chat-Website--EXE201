/**
 * Chủ đề minh họa theo bài học — cùng palette & phong cách trong một chủ đề.
 */

const THEMES = {
  'self-intro': {
    id: 'self-intro',
    label: 'Giới thiệu bản thân',
    palette: { sky: '#fde8e4', ground: '#f9d5ce', accent: '#d64545', ink: '#5c2e2e', soft: '#fff5f3' },
  },
  family: {
    id: 'family',
    label: 'Gia đình',
    palette: { sky: '#e8f4fd', ground: '#cfe8fa', accent: '#3b82f6', ink: '#1e3a5f', soft: '#f0f9ff' },
  },
  food: {
    id: 'food',
    label: 'Ăn uống',
    palette: { sky: '#fef3e2', ground: '#fde4c3', accent: '#ea580c', ink: '#7c2d12', soft: '#fffbeb' },
  },
  time: {
    id: 'time',
    label: 'Thời gian',
    palette: { sky: '#ede9fe', ground: '#ddd6fe', accent: '#7c3aed', ink: '#4c1d95', soft: '#f5f3ff' },
  },
  place: {
    id: 'place',
    label: 'Địa điểm',
    palette: { sky: '#e0f2fe', ground: '#bae6fd', accent: '#0284c7', ink: '#0c4a6e', soft: '#f0f9ff' },
  },
  shopping: {
    id: 'shopping',
    label: 'Mua sắm',
    palette: { sky: '#fce7f3', ground: '#fbcfe8', accent: '#db2777', ink: '#831843', soft: '#fdf2f8' },
  },
  nature: {
    id: 'nature',
    label: 'Thiên nhiên',
    palette: { sky: '#dcfce7', ground: '#bbf7d0', accent: '#16a34a', ink: '#14532d', soft: '#f0fdf4' },
  },
  study: {
    id: 'study',
    label: 'Học tập',
    palette: { sky: '#e0e7ff', ground: '#c7d2fe', accent: '#4f46e5', ink: '#312e81', soft: '#eef2ff' },
  },
  default: {
    id: 'default',
    label: 'Từ vựng',
    palette: { sky: '#f1f5f9', ground: '#e2e8f0', accent: '#b72025', ink: '#334155', soft: '#f8fafc' },
  },
};

const SLUG_RULES = [
  { test: /gioi-thieu-ban-than|self.?intro|ban-than/, theme: 'self-intro' },
  { test: /gia-dinh|family|nguoi-than/, theme: 'family' },
  { test: /an-uong|food|nha-hang|mon-an|thuc-an/, theme: 'food' },
  { test: /thoi-gian|time|gio|lich|ngay/, theme: 'time' },
  { test: /dia-diem|place|nha|truong|cong-ty|station/, theme: 'place' },
  { test: /mua-sam|shopping|cua-hang/, theme: 'shopping' },
  { test: /thien-nhien|weather|thoi-tiet/, theme: 'nature' },
  { test: /hoc|school|study|ngu-phap/, theme: 'study' },
];

const TITLE_RULES = [
  { test: /giới thiệu bản thân|自己紹介/, theme: 'self-intro' },
  { test: /gia đình|家族/, theme: 'family' },
  { test: /ăn|uống|ẩm thực|食/, theme: 'food' },
  { test: /thời gian|giờ|ngày|時間/, theme: 'time' },
  { test: /nhà|trường|công ty|địa điểm/, theme: 'place' },
  { test: /mua|bán|cửa hàng/, theme: 'shopping' },
  { test: /thời tiết|thiên nhiên/, theme: 'nature' },
  { test: /học|学校/, theme: 'study' },
];

const SCENE_RULES = [
  { test: /tôi|mình|私|わたし/, scene: 'self' },
  { test: /bạn|あなた/, scene: 'you' },
  { test: /tên|名前|họ/, scene: 'name' },
  { test: /tuổi|年|歳/, scene: 'age' },
  { test: /quốc|国|国籍/, scene: 'country' },
  { test: /nghề|仕事|職|会社|員|viên/, scene: 'work' },
  { test: /học|学|生|学校/, scene: 'study' },
  { test: /cha|mẹ|父|母|anh|chị|em|家族/, scene: 'family' },
  { test: /ăn|食|飲|ご飯|料理/, scene: 'meal' },
  { test: /uống|飲み/, scene: 'drink' },
  { test: /nhà|家/, scene: 'home' },
  { test: /xe|車|電車/, scene: 'transport' },
  { test: /tiền|円|買/, scene: 'money' },
  { test: /chào|こん|おは/, scene: 'greeting' },
  { test: /bạn bè|友/, scene: 'friends' },
];

/**
 * @param {string} title
 * @param {string} slug
 */
export function resolveLessonTheme(title, slug) {
  const s = `${slug || ''} ${title || ''}`.toLowerCase();
  for (const r of SLUG_RULES) {
    if (r.test.test(s)) return THEMES[r.theme];
  }
  for (const r of TITLE_RULES) {
    if (r.test.test(title || '')) return THEMES[r.theme];
  }
  return THEMES.default;
}

/**
 * @param {{ meaningVi?: string, MeaningVi?: string, wordJp?: string, WordJp?: string }} item
 */
export function resolveVocabScene(item) {
  const hay = `${item?.meaningVi ?? item?.MeaningVi ?? ''} ${item?.wordJp ?? item?.WordJp ?? ''}`.toLowerCase();
  const rule = SCENE_RULES.find((r) => r.test.test(hay));
  return rule?.scene ?? 'default';
}

export { THEMES };
