/* eslint-env browser */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getGoogleClientId } from '../utils/googleClientId';

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const GSI_SCRIPT_SELECTOR = 'script[data-yumegoji-gsi]';
const HIDDEN_BUTTON_WIDTH = 280;

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
 * GIS render ẩn — nút hiển thị luôn là pill tùy chỉnh (không hiện tên Google tự động).
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
    let gsiInitialized = false;

    const render = () => {
      const g = globalThis.google;
      if (cancelled || !g?.accounts?.id) return false;
      if (mountEl.childElementCount > 0) return true;

      if (!gsiInitialized) {
        g.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => {
            void onCredentialRef.current?.(res?.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          // Coc Coc / Chrome chặn FedCM → NetworkError khi bấm Google trên production
          use_fedcm_for_prompt: false,
          use_fedcm_for_button: false,
        });
        gsiInitialized = true;
      }

      g.accounts.id.renderButton(mountEl, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text,
        width: HIDDEN_BUTTON_WIDTH,
        locale: 'vi',
      });
      return true;
    };

    if (!render()) {
      intervalId = globalThis.setInterval(() => {
        if (render() && intervalId != null) globalThis.clearInterval(intervalId);
      }, 120);
    }

    return () => {
      cancelled = true;
      if (intervalId != null) globalThis.clearInterval(intervalId);
      mountEl.replaceChildren();
    };
  }, [clientId, text, gsiReady]);

  const triggerSignIn = useCallback(() => {
    const mountEl = mountRef.current;
    const roleBtn = mountEl?.querySelector('[role="button"]');
    if (roleBtn instanceof HTMLElement) {
      roleBtn.click();
      return;
    }
    const g = globalThis.google;
    g?.accounts?.id?.prompt?.();
  }, []);

  return {
    mountRef,
    clientIdConfigured: !!clientId,
    gsiReady: !!clientId && gsiReady,
    triggerSignIn,
  };
}
