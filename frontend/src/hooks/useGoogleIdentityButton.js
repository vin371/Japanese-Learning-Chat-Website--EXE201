/* eslint-env browser */
import { useEffect, useRef, useState } from 'react';
import { getGoogleClientId } from '../utils/googleClientId';

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const GSI_SCRIPT_SELECTOR = 'script[data-yumegoji-gsi]';
const WIDTH_EPSILON = 8;

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

function measureButtonWidth(mountEl) {
  const wrap = mountEl.closest('.auth-google-pill-wrap');
  return Math.min(400, Math.max(240, Math.round(wrap?.clientWidth || mountEl.clientWidth || 320)));
}

/**
 * Gắn nút Google Identity Services vào mountRef.
 */
export function useGoogleIdentityButton(onCredential, options = {}) {
  const { text = 'signin_with' } = options;
  const mountRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;
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
    let resizeTimer;
    let gsiInitialized = false;
    let renderedWidth = 0;

    const render = (force = false) => {
      const g = globalThis.google;
      if (cancelled || !g?.accounts?.id) return false;

      const w = measureButtonWidth(mountEl);
      const hasButton = mountEl.childElementCount > 0;
      if (!force && hasButton && Math.abs(w - renderedWidth) < WIDTH_EPSILON) {
        return true;
      }

      if (!gsiInitialized) {
        g.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => {
            void onCredentialRef.current?.(res?.credential);
          },
        });
        gsiInitialized = true;
      }

      renderedWidth = w;
      mountEl.replaceChildren();
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

    const scheduleRender = (force = false) => {
      globalThis.requestAnimationFrame(() => {
        if (!cancelled) render(force);
      });
    };

    if (!render(true)) {
      intervalId = globalThis.setInterval(() => {
        if (render(true) && intervalId != null) globalThis.clearInterval(intervalId);
      }, 120);
    }

    const onWindowResize = () => {
      if (cancelled) return;
      globalThis.clearTimeout(resizeTimer);
      resizeTimer = globalThis.setTimeout(() => {
        if (!cancelled) render(false);
      }, 250);
    };

    globalThis.addEventListener('resize', onWindowResize, { passive: true });

    return () => {
      cancelled = true;
      if (intervalId != null) globalThis.clearInterval(intervalId);
      globalThis.clearTimeout(resizeTimer);
      globalThis.removeEventListener('resize', onWindowResize);
      mountEl.replaceChildren();
    };
  }, [clientId, text, gsiReady]);

  return {
    mountRef,
    clientIdConfigured: !!clientId,
    gsiReady: !!clientId && gsiReady,
  };
}
