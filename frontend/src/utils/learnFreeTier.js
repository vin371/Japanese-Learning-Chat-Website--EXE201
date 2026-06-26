/** Giới hạn bài học gói Free — khớp backend FreeTierLessonPolicy. */
export const FREE_LESSON_MAX_BY_LEVEL = {
  N5: 5,
  N4: 3,
  N3: 0,
};

export function maxFreeLessonsForLevel(levelCode) {
  const code = String(levelCode || 'N5').trim().toUpperCase();
  return FREE_LESSON_MAX_BY_LEVEL[code] ?? 0;
}

/**
 * @param {{ sortOrder?: number, isPremium?: boolean }} lesson
 * @param {string} levelCode
 * @param {boolean} userIsPremium
 */
export function lessonRequiresPremiumAccess(lesson, levelCode, userIsPremium) {
  if (userIsPremium) return false;
  if (lesson?.isPremium) return true;
  const maxFree = maxFreeLessonsForLevel(levelCode);
  if (maxFree < 1) return true;
  const order = Number(lesson?.sortOrder) || 0;
  return order > maxFree;
}
