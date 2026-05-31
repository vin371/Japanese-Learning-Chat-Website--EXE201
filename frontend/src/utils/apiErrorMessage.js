import { ENV } from '../api/client';

const PROD_API_HINT =
  'Chưa kết nối API backend trên production. Deploy backend (.NET) lên Railway/Azure, thêm biến VITE_API_URL (URL API public) trên Vercel → Settings → Environment Variables, rồi Redeploy frontend.';

const DEV_API_HINT =
  'Không kết nối được API. Chạy backend: cd backend && dotnet run (cổng 5056). Dev: để trống VITE_API_URL trong frontend/.env để dùng proxy Vite.';

function apiConnectionHint() {
  if (ENV.PROD) {
    return ENV.API_URL
      ? 'Không kết nối được API backend. Kiểm tra backend (Railway/Azure) đang chạy và VITE_API_URL trên Vercel trỏ đúng URL.'
      : PROD_API_HINT;
  }
  return DEV_API_HINT;
}

/**
 * Lỗi mạng / gateway — API không phản hồi hoặc proxy lỗi.
 */
export function isApiUnavailableError(err) {
  if (!err) return false;
  if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') return true;
  const status = err.response?.status;
  if (status === 502 || status === 503 || status === 504) return true;
  if (!err.response && err.request) return true;
  const msg = String(err.message || '').toLowerCase();
  return msg.includes('network error') || msg.includes('502') || msg.includes('503');
}

/**
 * Lấy thông báo lỗi hiển thị cho người dùng: ưu tiên `response.data.message` từ API,
 * nếu không thì dịch các lỗi axios/network phổ biến sang tiếng Việt.
 */
export function getErrorMessageForUser(err, fallbackVi = 'Đã có lỗi xảy ra. Vui lòng thử lại.') {
  const api = err?.response?.data?.message ?? err?.response?.data?.Message;
  if (typeof api === 'string' && api.trim()) return api.trim();

  const status = err?.response?.status;
  if (status === 502) {
    return `Máy chủ chưa phản hồi (502). ${apiConnectionHint()}`;
  }
  if (status === 503) {
    return 'Dịch vụ tạm không khả dụng (503). Thử lại sau.';
  }
  if (status === 504) {
    return 'Hết thời gian chờ phản hồi từ máy chủ (504).';
  }
  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }
  if (status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }
  if (status === 404) {
    const url = String(err?.config?.url || err?.response?.config?.url || '');
    if (url.includes('/api/') || url.includes('/hubs/')) {
      return 'Chưa kết nối API backend (404). Vercel chỉ host giao diện — deploy backend .NET (Railway/Azure), thêm VITE_API_URL trên Vercel rồi redeploy frontend.';
    }
    return 'Không tìm thấy dữ liệu.';
  }
  if (status === 500) {
    return 'Lỗi máy chủ (500). Vui lòng thử lại sau.';
  }

  if (err?.code === 'ECONNABORTED') {
    return 'Hết thời gian chờ. Vui lòng thử lại.';
  }
  if (err?.code === 'ERR_NETWORK' || (!err?.response && err?.request)) {
    return apiConnectionHint();
  }

  const raw = err?.message;
  if (typeof raw !== 'string') return fallbackVi;

  const m = raw.toLowerCase();
  if (m.includes('network error')) {
    return 'Không kết nối được máy chủ. Kiểm tra mạng hoặc đảm bảo API backend đang chạy.';
  }
  if (m.includes('timeout')) {
    return 'Hết thời gian chờ. Vui lòng thử lại.';
  }

  return fallbackVi;
}
