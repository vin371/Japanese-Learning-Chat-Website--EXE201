import {
  getJlptLevelCodeFromUser,
  jlptCodeToLevelId,
  jlptRank,
  levelIdToJlptCode,
} from './learnLevelCode';

export const LEARN_JLPT_LEVELS = ['N5', 'N4', 'N3'];

/** Gom tiến độ theo mã JLPT từ `byLevel` của API summary. */
export function buildLevelProgressMap(byLevel) {
  const map = {};
  for (const row of Array.isArray(byLevel) ? byLevel : []) {
    let code = String(row.levelCode ?? row.LevelCode ?? '').trim().toUpperCase();
    if (!code) {
      const lid = row.levelId ?? row.LevelId;
      if (lid != null) code = levelIdToJlptCode(lid);
    }
    if (!code) continue;
    const total = Number(row.totalPublishedLessons ?? row.TotalPublishedLessons ?? 0) || 0;
    const done = Number(row.completedLessons ?? row.CompletedLessons ?? 0) || 0;
    let pct = Number(row.completionPercent ?? row.CompletionPercent ?? 0);
    if (total > 0) pct = Math.min(100, Math.round((done / total) * 100));
    map[code] = { total, done, pct };
  }
  return map;
}

export function isLevelCurriculumComplete(progressMap, code) {
  const p = progressMap?.[code];
  if (!p || p.total < 1) return false;
  return p.done >= p.total || p.pct >= 100;
}

/**
 * Quyền truy cập một cấp JLPT.
 * - `study`: cấp đang học (trùng hồ sơ) hoặc cấp khó hơn đã mở sau khi hoàn thành cấp hiện tại
 * - `review`: cấp dễ hơn — xem lại / ôn tập
 * - `locked`: chưa hoàn thành cấp đang học → không được vào cấp khó hơn
 */
export function getLevelAccessMode(targetCode, userCode, progressMap) {
  const target = String(targetCode || 'N5').trim().toUpperCase();
  const user = String(userCode || 'N5').trim().toUpperCase();
  const tr = jlptRank(target);
  const ur = jlptRank(user);

  if (tr > ur) return 'review';
  if (tr === ur) return 'study';
  if (isLevelCurriculumComplete(progressMap, user)) return 'study';
  return 'locked';
}

export function canViewLearnLevel(targetCode, userCode, progressMap) {
  return getLevelAccessMode(targetCode, userCode, progressMap) !== 'locked';
}

export function canMarkLessonProgress(targetCode, userCode, progressMap) {
  return getLevelAccessMode(targetCode, userCode, progressMap) === 'study';
}

export function lockedLevelMessage(userCode, progressMap) {
  const user = String(userCode || 'N5').toUpperCase();
  const p = progressMap?.[user];
  const remain =
    p && p.total > 0 ? Math.max(0, p.total - p.done) : null;
  if (remain != null && remain > 0) {
    return `Hoàn thành ${remain} bài còn lại ở ${user} để mở khóa cấp tiếp theo.`;
  }
  return `Hoàn thành toàn bộ bài học ${user} để mở khóa cấp tiếp theo.`;
}

export function learnRouteWithJlpt(pathname, jlptCode) {
  const code = String(jlptCode || 'N5').trim().toUpperCase();
  const path = pathname || '/learn';
  return `${path}?jlpt=${encodeURIComponent(code)}`;
}

export function jlptCodeFromLessonRow(row) {
  const lid = row?.levelId ?? row?.LevelId;
  if (lid != null) return levelIdToJlptCode(lid);
  return levelIdToJlptCode(jlptCodeToLevelId('N5'));
}

export function resolveUserLearnCode(user) {
  return getJlptLevelCodeFromUser(user);
}
