import { useEffect, useMemo, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { publicApi } from '../../api/publicApi';
import { ROUTES } from '../../data/routes';

const DISMISS_KEY = 'yumegoji_sys_ann_dismiss_id';
const POLL_MS = 60_000;
const AUTO_DISMISS_MS = 2 * 60 * 1000;

function readDismissedId() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) || '';
  } catch {
    return '';
  }
}

function writeDismissedId(id) {
  try {
    sessionStorage.setItem(DISMISS_KEY, String(id));
  } catch {
    /* ignore */
  }
}

export function SystemAnnouncementBanner() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState(null);
  const [dismissedId, setDismissedId] = useState(readDismissedId);
  const [timeLeftPct, setTimeLeftPct] = useState(100);

  const hideOnRoute = useMemo(() => {
    const p = location.pathname || '';
    return p.startsWith(ROUTES.ADMIN) || p.startsWith(ROUTES.MODERATOR);
  }, [location.pathname]);

  useEffect(() => {
    if (hideOnRoute) return undefined;

    let cancelled = false;

    async function load() {
      try {
        const { data } = await publicApi.getLatestSystemAnnouncement();
        if (cancelled) return;
        const ann = data?.announcement ?? data?.Announcement ?? null;
        setAnnouncement(ann && (ann.id ?? ann.Id) ? ann : null);
      } catch {
        if (!cancelled) setAnnouncement(null);
      }
    }

    void load();
    const t = window.setInterval(() => void load(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [hideOnRoute]);

  const id = announcement?.id ?? announcement?.Id;
  const title = announcement?.title ?? announcement?.Title ?? '';
  const content = announcement?.content ?? announcement?.Content ?? '';
  const type = announcement?.type ?? announcement?.Type ?? '';
  const typeNorm = String(type).trim().toLowerCase();
  const isVisible = !hideOnRoute && id && title && String(dismissedId) !== String(id);

  function dismiss() {
    if (!id) return;
    writeDismissedId(id);
    setDismissedId(String(id));
  }

  useEffect(() => {
    if (!isVisible || !id) {
      setTimeLeftPct(100);
      return undefined;
    }

    const annId = id;
    const started = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - started;
      const pct = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setTimeLeftPct(pct);
      if (elapsed >= AUTO_DISMISS_MS) {
        writeDismissedId(annId);
        setDismissedId(String(annId));
      }
    }, 250);

    return () => window.clearInterval(tick);
  }, [isVisible, id]);

  if (!isVisible) return null;

  const typeLabel =
    typeNorm === 'maintenance'
      ? 'Bảo trì'
      : typeNorm === 'event'
        ? 'Sự kiện'
        : typeNorm === 'promo'
          ? 'Khuyến mãi'
          : typeNorm === 'info' || typeNorm === ''
            ? 'Thông báo'
            : String(type).trim() || 'Thông báo';

  return (
    <div className="sys-announce" role="region" aria-label="Thông báo hệ thống" aria-live="polite">
      <div className="sys-announce__accent" aria-hidden />
      <div className="sys-announce__inner">
        <span className="sys-announce__icon" aria-hidden>
          <Bell size={18} strokeWidth={2.25} />
        </span>
        <span className="sys-announce__badge">{typeLabel}</span>
        <div className="sys-announce__text">
          <strong className="sys-announce__title">{title}</strong>
          {content ? <p className="sys-announce__body">{content}</p> : null}
        </div>
        <button
          type="button"
          className="sys-announce__close"
          aria-label="Đóng thông báo (tự ẩn sau 2 phút)"
          onClick={dismiss}
        >
          <X size={18} strokeWidth={2.25} aria-hidden />
        </button>
      </div>
      <div
        className="sys-announce__timer"
        role="progressbar"
        aria-valuenow={Math.round(timeLeftPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Thời gian còn lại trước khi tự ẩn"
      >
        <span className="sys-announce__timer-fill" style={{ width: `${timeLeftPct}%` }} />
      </div>
    </div>
  );
}
