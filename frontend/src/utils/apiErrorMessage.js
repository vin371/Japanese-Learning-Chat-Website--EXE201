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
    return 'Máy chủ chưa phản hồi (502). Kiểm tra backend có đang chạy (dotnet run, cổng 5056) và VITE_PROXY_TARGET trong frontend/.env.';
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
      return 'Không gọi được API backend (404). Trên Vercel: đặt VITE_API_URL trỏ tới URL backend (Railway/Azure) rồi deploy lại frontend.';
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
    return 'Không kết nối được API. Kiểm tra backend đang chạy và cấu hình proxy (VITE_PROXY_TARGET=http://localhost:5056).';
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
