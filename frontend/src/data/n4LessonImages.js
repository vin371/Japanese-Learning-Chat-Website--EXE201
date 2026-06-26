/** N4 ảnh chủ đề trong public/images/n4 — đủ 25 bài. */
export const N4_LESSON_IMAGE_BASE = '/images/n4';

export const N4_MAX_LOCAL_LESSON = 25;

export const N4_LESSON_IMAGES_BY_NO = {
  1: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-01-suy-nghi-trich-dan.png`,
  2: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-02-khong-chac-chan.png`,
  3: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-03-bo-nghia-danh-tu.png`,
  4: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-04-nghe-noi-trong-co-ve.png`,
  5: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-05-hinh-nhu-giong-nhu.png`,
  6: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-06-dieu-kien-1.png`,
  7: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-07-dieu-kien-2.png`,
  8: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-08-muc-dich.png`,
  9: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-09-bien-doi-tro-nen.png`,
  10: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-10-quyet-dinh.png`,
  11: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-11-the-mo-rong-1.png`,
  12: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-12-the-mo-rong-2.png`,
  13: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-13-cho-nhan-hanh-dong.png`,
  14: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-14-nho-va-xin-phep.png`,
  15: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-15-kha-nang.png`,
  16: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-16-bi-dong.png`,
  17: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-17-sai-khien.png`,
  18: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-18-y-dinh-ke-hoach.png`,
  19: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-19-kinh-nghiem-thoi-quen.png`,
  20: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-20-dang-sap-vua-lam.png`,
  21: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-21-de-kho-qua-muc.png`,
  22: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-22-doi-lap-nhuong-bo.png`,
  23: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-23-gioi-han-muc-do.png`,
  24: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-24-giai-thich-hoi-thong-tin.png`,
  25: `${N4_LESSON_IMAGE_BASE}/yumegoji-n4-bai-25-thoi-gian-chu-de-nguon-tin.png`,
};

const SLUG_TO_LESSON_NO = {
  'suy-nghi-trich-dan': 1,
  'khong-chac-chan': 2,
  'bo-nghia-danh-tu': 3,
  'nghe-noi-trong-co-ve': 4,
  'hinh-nhu-giong-nhu': 5,
  'dieu-kien-1': 6,
  'dieu-kien-2': 7,
  'muc-dich': 8,
  'bien-doi-tro-nen': 9,
  'quyet-dinh': 10,
  'the-mo-rong-1': 11,
  'the-mo-rong-2': 12,
  'cho-nhan-hanh-dong': 13,
  'nho-va-xin-phep': 14,
  'kha-nang': 15,
  'bi-dong': 16,
  'sai-khien': 17,
  'y-dinh-ke-hoach': 18,
  'kinh-nghiem-thoi-quen': 19,
  'dang-sap-vua-lam': 20,
  'de-kho-qua-muc': 21,
  'doi-lap-nhuong-bo': 22,
  'gioi-han-muc-do': 23,
  'giai-thich-hoi-thong-tin': 24,
  'thoi-gian-chu-de-nguon-tin': 25,
};

function lessonNoFromSlug(slug) {
  const s = String(slug ?? '').trim().toLowerCase();
  if (!s) return 0;

  const baiMatch = s.match(/bai-(\d{1,2})/);
  if (baiMatch) {
    const no = Number(baiMatch[1]);
    if (no >= 1 && no <= N4_MAX_LOCAL_LESSON) return no;
  }

  if (SLUG_TO_LESSON_NO[s]) return SLUG_TO_LESSON_NO[s];
  for (const [key, no] of Object.entries(SLUG_TO_LESSON_NO)) {
    if (s.includes(key)) return no;
  }
  return 0;
}

/**
 * @param {{ levelCode?: string, sortOrder?: number, slug?: string }} opts
 * @returns {string | null}
 */
export function resolveN4LessonImage(opts) {
  if (String(opts?.levelCode ?? '').toUpperCase() !== 'N4') return null;

  const fromOrder = Number(opts?.sortOrder);
  const lessonNo =
    fromOrder >= 1 && fromOrder <= N4_MAX_LOCAL_LESSON
      ? fromOrder
      : lessonNoFromSlug(opts?.slug);

  if (lessonNo < 1 || lessonNo > N4_MAX_LOCAL_LESSON) return null;
  return N4_LESSON_IMAGES_BY_NO[lessonNo] ?? null;
}

export const N4_LEVEL_HERO_IMAGE = N4_LESSON_IMAGES_BY_NO[1];
