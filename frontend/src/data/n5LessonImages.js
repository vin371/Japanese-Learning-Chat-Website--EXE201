/** N5 ảnh chủ đề trong public/images/n5 — đủ 25 bài. */
export const N5_LESSON_IMAGE_BASE = '/images/n5';

export const N5_MAX_LOCAL_LESSON = 25;

export const N5_LESSON_IMAGES_BY_NO = {
  1: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-01-gioi-thieu-ban-than.png`,
  2: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-02-day-la-gi.png`,
  3: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-03-dia-diem.png`,
  4: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-04-thoi-gian.png`,
  5: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-05-di-dau-voi-ai.png`,
  6: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-06-hanh-dong-hang-ngay.png`,
  7: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-07-dia-diem-hanh-dong-cong-cu.png`,
  8: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-08-cho-nhan-co-ban.png`,
  9: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-09-so-thich-kha-nang.png`,
  10: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-10-ton-tai.png`,
  11: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-11-so-luong-tan-suat.png`,
  12: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-12-tinh-tu-i-na.png`,
  13: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-13-mong-muon.png`,
  14: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-14-ru-re-de-nghi.png`,
  15: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-15-the-te-co-ban.png`,
  16: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-16-noi-hanh-dong.png`,
  17: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-17-the-nai.png`,
  18: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-18-the-tu-dien.png`,
  19: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-19-the-ta.png`,
  20: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-20-so-sanh.png`,
  21: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-21-ly-do.png`,
  22: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-22-khi-truoc-sau.png`,
  23: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-23-liet-ke-noi-cau.png`,
  24: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-24-suy-nghi-trich-loi.png`,
  25: `${N5_LESSON_IMAGE_BASE}/yumegoji-n5-bai-25-tong-on-n5.png`,
};

const SLUG_TO_LESSON_NO = {
  'gioi-thieu-ban-than': 1,
  'day-la-gi': 2,
  'dia-diem': 3,
  'thoi-gian': 4,
  'di-dau-voi-ai': 5,
  'hanh-dong-hang-ngay': 6,
  'dia-diem-hanh-dong-cong-cu': 7,
  'cho-nhan-co-ban': 8,
  'so-thich-kha-nang': 9,
  'ton-tai': 10,
  'so-luong-tan-suat': 11,
  'tinh-tu': 12,
  'mong-muon': 13,
  'ru-re-de-nghi': 14,
  'the-co-ban': 15,
  'noi-hanh-dong': 16,
  'the-tu-dien': 18,
  'so-sanh': 20,
  'ly-do': 21,
  'khi-truoc-sau': 22,
  'liet-ke-noi-cau': 23,
  'suy-nghi-trich-loi': 24,
  'tong-on-n5': 25,
};

function lessonNoFromSlugAndTitle(slug, title) {
  const s = String(slug ?? '').trim().toLowerCase();
  if (!s) return 0;

  if (s === 'the') {
    const t = String(title ?? '');
    if (/た|thể\s*た/i.test(t)) return 19;
    if (/ない|thể\s*ない/i.test(t)) return 17;
    return 0;
  }

  if (SLUG_TO_LESSON_NO[s]) return SLUG_TO_LESSON_NO[s];
  for (const [key, no] of Object.entries(SLUG_TO_LESSON_NO)) {
    if (s.includes(key)) return no;
  }
  return 0;
}

/**
 * @param {{ levelCode?: string, sortOrder?: number, slug?: string, title?: string }} opts
 * @returns {string | null}
 */
export function resolveN5LessonImage(opts) {
  if (String(opts?.levelCode ?? 'N5').toUpperCase() !== 'N5') return null;

  const fromOrder = Number(opts?.sortOrder);
  const lessonNo =
    fromOrder >= 1 && fromOrder <= N5_MAX_LOCAL_LESSON
      ? fromOrder
      : lessonNoFromSlugAndTitle(opts?.slug, opts?.title);

  if (lessonNo < 1 || lessonNo > N5_MAX_LOCAL_LESSON) return null;
  return N5_LESSON_IMAGES_BY_NO[lessonNo] ?? null;
}

export const N5_LEVEL_HERO_IMAGE = N5_LESSON_IMAGES_BY_NO[1];
