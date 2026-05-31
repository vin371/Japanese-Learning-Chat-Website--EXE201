/* eslint-env browser */
import { useCallback, useEffect, useRef, useState } from 'react';
import http, { ENV } from '../../api/client';
import { isApiUnavailableError } from '../../utils/apiErrorMessage';
import { BACKEND_MISSING_HINT } from '../../utils/apiConfig';

const POLL_MS = 45_000;
const PROBE_TIMEOUT_MS = 8000;

/**
 * Thanh cảnh báo nhẹ khi API không phản hồi — không chặn layout, tự ẩn khi backend lên lại.
 */
export function ApiOfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const mountedRef = useRef(true);

  const probe = useCallback(async () => {
    setChecking(true);
    try {
      await http.get('/api/Public/system-announcements/latest', {
        timeout: PROBE_TIMEOUT_MS,
        validateStatus: (s) => s >= 200 && s < 500,
      });
      if (mountedRef.current) setOffline(false);
    } catch (err) {
      if (mountedRef.current) setOffline(isApiUnavailableError(err));
    } finally {
      if (mountedRef.current) setChecking(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void probe();
    const id = window.setInterval(() => void probe(), POLL_MS);
    const onOnline = () => void probe();
    window.addEventListener('online', onOnline);
    return () => {
      mountedRef.current = false;
      window.clearInterval(id);
      window.removeEventListener('online', onOnline);
    };
  }, [probe]);

  if (!offline) return null;

  return (
    <div className="api-offline-banner" role="status" aria-live="polite">
      <div className="api-offline-banner__inner">
        <span className="api-offline-banner__dot" aria-hidden="true" />
        <p className="api-offline-banner__text">
          {ENV.PROD && !ENV.API_URL
            ? BACKEND_MISSING_HINT
            : ENV.PROD
              ? 'Không kết nối được API backend. Kiểm tra URL trong VITE_API_URL (Vercel) và backend Railway/Azure đang chạy.'
              : 'Không kết nối được API backend. Chạy dotnet run trong thư mục backend (cổng 5056); dev: để trống VITE_API_URL để dùng proxy Vite.'}
        </p>
        <button
          type="button"
          className="api-offline-banner__retry"
          onClick={() => void probe()}
          disabled={checking}
        >
          {checking ? 'Đang thử…' : 'Thử lại'}
        </button>
      </div>
    </div>
  );
}
