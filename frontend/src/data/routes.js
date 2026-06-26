/**
 * Định nghĩa path và tên route dùng trong app
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  /** @deprecated Chuyển hướng → /learn */
  DASHBOARD: '/dashboard',
  ONBOARDING_SURVEY: '/onboarding-survey',
  TEST_INTRO: '/test-intro',
  PLACEMENT_TEST: '/placement-test',
  PLACEMENT_PROCESSING: '/placement-processing',
  PLACEMENT_RESULT: '/placement-result',
  LEVEL_UP_TEST: '/level-up-test/:toLevel',
  ADMIN: '/admin',
  MODERATOR: '/moderator',
  CHAT: '/chat',
  UPGRADE: '/upgrade',
  PLAY: '/play',
  PLAY_LEADERBOARD: '/play/leaderboard',
  PLAY_ACHIEVEMENTS: '/play/achievements',
  PLAY_SHOP: '/play/shop',
  LEARN: '/learn',
  CHAT_ROOM: '/chat/room/:roomId',
  UNAUTHORIZED: '/unauthorized',
  ACCOUNT: '/account',
};

/** Trang auth full-screen — ẩn header/footer site. */
export function isAuthRoute(pathname) {
  return (
    pathname === ROUTES.LOGIN ||
    pathname === ROUTES.REGISTER ||
    pathname === ROUTES.RESET_PASSWORD ||
    pathname === ROUTES.FORGOT_PASSWORD
  );
}

/** Onboarding full-screen — ẩn header/footer site. */
export function isOnboardingFlowRoute(pathname) {
  return (
    pathname === ROUTES.ONBOARDING_SURVEY ||
    pathname === ROUTES.TEST_INTRO ||
    pathname === ROUTES.PLACEMENT_TEST ||
    pathname === ROUTES.PLACEMENT_PROCESSING ||
    pathname === ROUTES.PLACEMENT_RESULT
  );
}

export const ROUTE_NAMES = {
  [ROUTES.HOME]: 'Trang chủ',
  [ROUTES.LOGIN]: 'Đăng nhập',
  [ROUTES.REGISTER]: 'Đăng ký',
  [ROUTES.FORGOT_PASSWORD]: 'Quên mật khẩu',
  [ROUTES.RESET_PASSWORD]: 'Đặt lại mật khẩu',
  [ROUTES.DASHBOARD]: 'Bảng điều khiển',
  [ROUTES.ONBOARDING_SURVEY]: 'Khảo sát',
  [ROUTES.TEST_INTRO]: 'Giới thiệu bài test',
  [ROUTES.PLACEMENT_TEST]: 'Bài test đầu vào',
  [ROUTES.PLACEMENT_PROCESSING]: 'Đang xếp cấp độ',
  [ROUTES.PLACEMENT_RESULT]: 'Kết quả xếp trình',
  [ROUTES.LEVEL_UP_TEST]: 'Thi nâng level',
  [ROUTES.ADMIN]: 'Quản trị',
  [ROUTES.MODERATOR]: 'Điều hành',
  [ROUTES.CHAT]: 'Trò chuyện',
  [ROUTES.UPGRADE]: 'Nâng cấp',
  [ROUTES.PLAY]: 'Trò chơi',
  [ROUTES.LEARN]: 'Học tập',
  [ROUTES.UNAUTHORIZED]: 'Không có quyền',
  [ROUTES.ACCOUNT]: 'Tài khoản',
};
