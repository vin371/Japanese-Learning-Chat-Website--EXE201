import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/adminService';

const CACHE_MS = 45_000;
let cache = null;
let cacheAt = 0;
let inflight = null;

/** Gọi sớm khi vào admin — tab con dùng cache, không gọi API lại. */
export function prefetchAdminOverview() {
  void fetchAdminOverview(false);
}

export async function fetchAdminOverview(force = false) {
  const now = Date.now();
  if (!force && cache && now - cacheAt < CACHE_MS) {
    return cache;
  }
  if (inflight) {
    return inflight;
  }
  inflight = adminService
    .getOverview()
    .then((data) => {
      cache = data;
      cacheAt = Date.now();
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useAdminOverview() {
  const [ov, setOv] = useState(() => cache);
  const [loading, setLoading] = useState(!cache);
  const [err, setErr] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await fetchAdminOverview(true);
      setOv(data);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.userMessage || e?.message || 'Không tải được dữ liệu từ API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancel = false;
    if (cache && Date.now() - cacheAt < CACHE_MS) {
      setOv(cache);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    fetchAdminOverview(false)
      .then((data) => {
        if (!cancel) setOv(data);
      })
      .catch((e) => {
        if (!cancel) {
          setErr(e?.response?.data?.message || e?.userMessage || e?.message || 'Không tải được dữ liệu từ API.');
        }
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  return { ov, loading, err, reload };
}
