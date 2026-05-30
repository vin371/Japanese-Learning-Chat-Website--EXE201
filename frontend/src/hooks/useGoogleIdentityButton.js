/* eslint-env browser */
import { useEffect, useRef, useState } from 'react';
import { getGoogleClientId } from '../utils/googleClientId';

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const GSI_SCRIPT_SELECTOR = 'script[data-yumegoji-gsi]';

function loadGsiScript() {
  if (globalThis.google?.accounts?.id) {
    return Promise.resolve();
  }
  const existing = document.querySelector(GSI_SCRIPT_SELECTOR);
  if (existing) {
    return new Promise((resolve, reject) => {
      if (globalThis.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('gsi-load-failed')), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.dataset.yumegojiGsi = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('gsi-load-failed'));
    document.head.appendChild(script);
  });
}

/**
 * Gắn nút Google Identity Services vào mountRef.
 * Chỉ load script GIS khi có VITE_GOOGLE_CLIENT_ID hợp lệ.
 */
export function useGoogleIdentityButton(onCredential, options = {}) {
  const { text = 'signin_with' } = options;
  const mountRef = useRef(null);
  const clientId = getGoogleClientId();
  const [gsiReady, setGsiReady] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setGsiReady(false);
      return undefined;
    }
    let cancelled = false;
    loadGsiScript()
      .then(() => {
        if (!cancelled) setGsiReady(true);
      })
      .catch(() => {
        if (!cancelled) setGsiReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !gsiReady) return undefined;
    const mountEl = mountRef.current;
    if (!mountEl) return undefined;

    let cancelled = false;
    let intervalId;
    let resizeObserver;
    let gsiInitialized = false;

    const render = () => {
      const g = globalThis.google;
      if (cancelled || !g?.accounts?.id) return false;
      if (!gsiInitialized) {
        g.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => {
            void onCredential(res?.credential);
          },
        });
        gsiInitialized = true;
      }
      mountEl.replaceChildren();
      const wrap = mountEl.closest('.auth-google-pill-wrap');
      const w = Math.min(400, Math.max(240, Math.round(wrap?.clientWidth || mountEl.parentElement?.clientWidth || 320)));
      g.accounts.id.renderButton(mountEl, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text,
        width: w,
        locale: 'vi',
      });
      return true;
    };

    if (!render()) {
      intervalId = globalThis.setInterval(() => {
        if (render() && intervalId != null) globalThis.clearInterval(intervalId);
      }, 120);
    }

    if (typeof ResizeObserver !== 'undefined') {
      const wrap = mountEl.closest('.auth-google-pill-wrap');
      if (wrap) {
        resizeObserver = new ResizeObserver(() => {
          if (!cancelled) render();
        });
        resizeObserver.observe(wrap);
      }
    }

    return () => {
      cancelled = true;
      if (intervalId != null) globalThis.clearInterval(intervalId);
      resizeObserver?.disconnect();
      mountEl.replaceChildren();
    };
  }, [onCredential, clientId, text, gsiReady]);

  return {
    mountRef,
    clientIdConfigured: !!clientId,
    gsiReady: !!clientId && gsiReady,
  };
}
