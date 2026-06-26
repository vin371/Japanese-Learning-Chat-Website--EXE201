import { ROUTES } from '../data/routes';
import { isStaffUser } from './roles';
import { getPostLoginRoute } from './postLoginRoute';

export const SURVEY_STORAGE_KEY = 'yumegoji_onboarding_survey';
export const PLACEMENT_RESULT_STORAGE_KEY = 'yumegoji_placement_result';
export const PLACEMENT_PENDING_KEY = 'yumegoji_placement_pending';
export const PLACEMENT_PROCESSING_START_KEY = 'yumegoji_placement_processing_at';

/** Thời gian chờ bắt buộc trước khi hiện kết quả (ms). */
export const PLACEMENT_PROCESSING_DELAY_MS = 3000;

export const ONBOARDING_ROUTE_LIST = [
  ROUTES.ONBOARDING_SURVEY,
  ROUTES.TEST_INTRO,
  ROUTES.PLACEMENT_TEST,
  ROUTES.PLACEMENT_PROCESSING,
  ROUTES.PLACEMENT_RESULT,
];

export const SURVEY_QUESTIONS = [
  {
    id: 'goal',
    question: 'Mục tiêu học tiếng Nhật của bạn là gì?',
    options: [
      'Học để thi JLPT',
      'Học để giao tiếp cơ bản',
      'Học phục vụ công việc',
      'Học vì sở thích',
    ],
  },
  {
    id: 'focus',
    question: 'Bạn muốn tập trung vào phần nào nhất?',
    options: ['Từ vựng', 'Ngữ pháp', 'Kanji', 'Luyện đề tổng hợp'],
  },
  {
    id: 'dailyDuration',
    question: 'Bạn muốn học bao lâu mỗi ngày?',
    options: ['5 phút', '10 phút', '15 phút', '30 phút'],
  },
];

const DAILY_MINUTES_MAP = {
  '5 phút': 5,
  '10 phút': 10,
  '15 phút': 15,
  '30 phút': 30,
};

export function isOnboardingRoute(pathname) {
  return ONBOARDING_ROUTE_LIST.includes(pathname);
}

export function readSurveyData() {
  try {
    const raw = localStorage.getItem(SURVEY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasCompletedSurvey() {
  const data = readSurveyData();
  return !!(data?.completedAt && data?.answers && typeof data.answers === 'object');
}

export function saveSurveyAnswers(answers) {
  const payload = {
    answers,
    completedAt: new Date().toISOString(),
  };
  localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function readPlacementResult() {
  try {
    const raw = localStorage.getItem(PLACEMENT_RESULT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasCompletedPlacementResult() {
  const data = readPlacementResult();
  return !!data?.hasCompletedPlacementTest;
}

export function levelFromScore(score) {
  const s = Number(score) || 0;
  if (s <= 7) return 'N5';
  if (s <= 14) return 'N4';
  return 'N3';
}

export function savePlacementResult({ placementScore, recommendedLevel }) {
  const payload = {
    hasCompletedPlacementTest: true,
    placementScore: Number(placementScore) || 0,
    recommendedLevel: recommendedLevel || levelFromScore(placementScore),
    completedAt: new Date().toISOString(),
  };
  localStorage.setItem(PLACEMENT_RESULT_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function getRecommendedLevel() {
  const result = readPlacementResult();
  if (result?.recommendedLevel) return String(result.recommendedLevel).toUpperCase();
  return null;
}

export function getDailyGoalLabel() {
  const survey = readSurveyData();
  return survey?.answers?.dailyDuration || '10 phút';
}

export function getDailyGoalMinutes() {
  return DAILY_MINUTES_MAP[getDailyGoalLabel()] ?? 10;
}

export function clearOnboardingStorage() {
  localStorage.removeItem(SURVEY_STORAGE_KEY);
  localStorage.removeItem(PLACEMENT_RESULT_STORAGE_KEY);
  sessionStorage.removeItem(PLACEMENT_PENDING_KEY);
}

/** Kết quả tạm sau khi nộp bài — chưa lưu chính thức cho đến khi user bấm tiếp tục. */
export function savePendingPlacement({ placementScore, recommendedLevel, total = 20 }) {
  const payload = {
    placementScore: Number(placementScore) || 0,
    recommendedLevel: String(recommendedLevel || levelFromScore(placementScore)).toUpperCase(),
    total: Number(total) || 20,
    submittedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(PLACEMENT_PENDING_KEY, JSON.stringify(payload));
  return payload;
}

export function readPendingPlacement() {
  try {
    const raw = sessionStorage.getItem(PLACEMENT_PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPendingPlacement() {
  sessionStorage.removeItem(PLACEMENT_PENDING_KEY);
  sessionStorage.removeItem(PLACEMENT_PROCESSING_START_KEY);
}

export function hasPendingPlacement() {
  return !!readPendingPlacement();
}

export function levelResultMessage(level) {
  const lv = String(level || 'N5').toUpperCase();
  if (lv === 'N4') {
    return 'Bạn đã có nền tảng tốt! YumeGo-ji đề xuất bạn học từ JLPT N4.';
  }
  if (lv === 'N3') {
    return 'Tuyệt vời! Bạn phù hợp với lộ trình JLPT N3.';
  }
  return 'Bạn phù hợp bắt đầu từ JLPT N5.';
}

/**
 * Route bắt buộc tiếp theo trong onboarding (null = được phép ở pathname hiện tại).
 */
export function getOnboardingEnforcement(pathname, { needsPlacementTest, user }) {
  if (isStaffUser(user)) return null;

  const surveyDone = hasCompletedSurvey();
  const placementDone = hasCompletedPlacementResult();
  const inPipeline = needsPlacementTest && !placementDone;

  if (!inPipeline) {
    if (isOnboardingRoute(pathname) && pathname !== ROUTES.PLACEMENT_RESULT) {
      return ROUTES.LEARN;
    }
    return null;
  }

  if (!surveyDone) {
    return pathname === ROUTES.ONBOARDING_SURVEY ? null : ROUTES.ONBOARDING_SURVEY;
  }

  if (
    pathname === ROUTES.PLACEMENT_TEST ||
    pathname === ROUTES.PLACEMENT_RESULT ||
    pathname === ROUTES.PLACEMENT_PROCESSING
  ) {
    return null;
  }

  if (pathname === ROUTES.TEST_INTRO || pathname === ROUTES.ONBOARDING_SURVEY) {
    return pathname === ROUTES.ONBOARDING_SURVEY ? ROUTES.TEST_INTRO : null;
  }

  return ROUTES.TEST_INTRO;
}

export function getLearnHomeForLevel(levelCode) {
  const code = String(levelCode || 'N5').toUpperCase();
  return `${ROUTES.LEARN}?jlpt=${encodeURIComponent(code)}`;
}

export function getPostAuthRoute(data, user, fallbackPath = ROUTES.LEARN) {
  const u = user ?? data?.user;
  if (isStaffUser(u)) {
    return getPostLoginRoute(u, fallbackPath);
  }
  if (data?.needsPlacementTest) {
    return ROUTES.ONBOARDING_SURVEY;
  }
  return getPostLoginRoute(u, fallbackPath);
}
