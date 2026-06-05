/* eslint-env browser */
import * as FM from 'framer-motion';
import { useGoogleIdentityButton } from '../../hooks/useGoogleIdentityButton';

const Motion = FM.motion;

function IconGoogleG() {
  return (
    <svg
      className="auth-google-fallback-pill__g"
      width="20"
      height="20"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

const MISSING_CONFIG_MSG =
  'Chưa cấu hình Google OAuth: thêm VITE_GOOGLE_CLIENT_ID vào frontend/.env (xem .env.example).';

/**
 * Luôn hiện pill "Google" — iframe GIS trong suốt phía trên (user bấm trực tiếp, không hiện tên tài khoản).
 */
export function GoogleAuthPill({
  onCredential,
  text = 'signin_with',
  disabled = false,
  buttonLabel = 'Google',
  onConfigError,
  className = '',
  showLabel = true,
}) {
  const { mountRef, clientIdConfigured, gsiReady } = useGoogleIdentityButton(onCredential, {
    text,
  });

  return (
    <div className={`flex flex-col items-center justify-center my-2 w-full max-w-[400px] mx-auto ${className}`.trim()}>
      {showLabel}
      <div className={`group relative block w-full h-[3.25rem] min-h-[3.25rem] m-0 overflow-hidden rounded-xl ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        {!clientIdConfigured ? (
          <Motion.button
            type="button"
            className="w-full min-h-[3.25rem] px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-all"
            disabled={disabled}
            onClick={() => onConfigError?.(MISSING_CONFIG_MSG)}
            aria-label={`${buttonLabel} — cần cấu hình Client ID`}
            title="Cần VITE_GOOGLE_CLIENT_ID — xem frontend/.env.example"
            whileHover={{ scale: disabled ? 1 : 1.01 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
          >
            <IconGoogleG />
            <span>{buttonLabel}</span>
          </Motion.button>
        ) : !gsiReady ? (
          <Motion.button
            type="button"
            className="w-full min-h-[3.25rem] px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-semibold text-sm shadow-sm flex items-center justify-center gap-2.5 opacity-60 cursor-not-allowed"
            disabled
            aria-busy="true"
          >
            <IconGoogleG />
            <span>Đang tải…</span>
          </Motion.button>
        ) : (
          <>
            <div className="w-full min-h-[3.25rem] px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 font-semibold text-sm shadow-sm flex items-center justify-center gap-2.5 pointer-events-none select-none transition-all duration-200 group-hover:bg-slate-100 dark:group-hover:bg-slate-800/80 group-hover:border-slate-300 dark:group-hover:border-slate-700" aria-hidden="true">
              <IconGoogleG />
              <span>{buttonLabel}</span>
            </div>
            <div
              ref={mountRef}
              className="absolute inset-0 z-20 flex items-center justify-center opacity-[0.01] overflow-hidden cursor-pointer w-full h-full [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-full"
              aria-label={`${buttonLabel} — đăng nhập`}
            />
          </>
        )}
      </div>
    </div>
  );
}
