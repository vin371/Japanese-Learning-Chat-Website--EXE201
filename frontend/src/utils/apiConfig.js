import { ENV } from '../api/client';

/** Dev: Vite proxy /api → backend local. Production: cần VITE_API_URL trên Vercel. */
export function isBackendConfigured() {
  if (ENV.DEV) return true;
  return Boolean(ENV.API_URL);
}

export const BACKEND_MISSING_HINT =
  'Đăng nhập / Google cần API backend (.NET + SQL). Vercel chỉ host giao diện — xem trang chủ vẫn dùng được. Để login: deploy backend (Railway/Azure), thêm VITE_API_URL trên Vercel rồi redeploy.';
