/* eslint-env browser */
import { useEffect, useRef, useState } from 'react';
import { getGoogleClientId } from '../utils/googleClientId';

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const GSI_SCRIPT_SELECTOR = 'script[data-yumegoji-gsi]';
const BUTTON_MIN_WIDTH = 280;

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

function buttonWidthFor(mountEl) {
  const w = mountEl?.clientWidth ?? 0;
  return Math.max(BUTTON_MIN_WIDTH, Math.floor(w) || 400);
}

/**
 * Nút Google GIS hiển thị trực tiếp — user bấm iframe thật (tránh FedCM AbortError khi click ẩn).
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
    let gsiInitialized = false;

    let rendered = false;

    const renderButton = () => {
      const g = globalThis.google;
      if (cancelled || !g?.accounts?.id) return;

      if (!gsiInitialized) {
        g.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => {
            void onCredentialRef.current?.(res?.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
          use_fedcm_for_button: false,
        });
        gsiInitialized = true;
      }

      mountEl.replaceChildren();
      g.accounts.id.renderButton(mountEl, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text,
        width: buttonWidthFor(mountEl),
        locale: 'vi',
      });
      rendered = true;
    };

    const tryRender = () => {
      if (cancelled || rendered) return;
      if (mountEl.clientWidth < 10) {
        requestAnimationFrame(tryRender);
        return;
      }
      renderButton();
    };
    tryRender();

    return () => {
      cancelled = true;
      mountEl.replaceChildren();
    };
  }, [clientId, text, gsiReady]);

  return {
    mountRef,
    clientIdConfigured: !!clientId,
    gsiReady: !!clientId && gsiReady,
  };
}
