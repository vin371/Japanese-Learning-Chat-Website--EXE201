/**
 * Khóa N5 — nội dung lấy từ API /api/lessons (import DOCX N5 trên Supabase).
 * File tĩnh giữ lại để tương thích import; danh sách bài rỗng.
 */
export const N5_LESSONS = [];

export function getN5LessonBySlug(slug) {
  return N5_LESSONS.find((l) => l.slug === slug) ?? null;
}
