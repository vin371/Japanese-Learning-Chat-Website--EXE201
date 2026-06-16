import { resolveLessonTheme } from '../../../utils/vocabLessonThemes';

function sceneForPattern(pattern) {
  const p = String(pattern || '');
  if (/ではありません|じゃありません|ません/.test(p)) return 'negative';
  if (/ですか|ますか|か$/.test(p)) return 'question';
  if (/です|だ$|ます/.test(p)) return 'affirm';
  return 'grammar';
}

export default function ThemedGrammarIllustration({ lessonTitle, lessonSlug, pattern, className = '' }) {
  const theme = resolveLessonTheme(lessonTitle, lessonSlug);
  const scene = sceneForPattern(pattern);
  const { palette } = theme;
  const rootClass = ['learn-themed-art', className].filter(Boolean).join(' ');

  return (
    <svg className={rootClass} viewBox="0 0 400 220" role="img" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`gg-${theme.id}-${scene}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.sky} />
          <stop offset="100%" stopColor={palette.ground} />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#gg-${theme.id}-${scene})`} />
      <ellipse cx="200" cy="198" rx="210" ry="36" fill={palette.ground} opacity="0.5" />
      {scene === 'affirm' ? (
        <g transform="translate(200 108)">
          <rect x="-70" y="-36" width="140" height="72" rx="12" fill={palette.soft} stroke={palette.ink} strokeWidth="2" opacity="0.95" />
          <text x="0" y="8" textAnchor="middle" fontSize="28" fill={palette.accent} fontWeight="800">
            です
          </text>
          <path d="M-90 -52 L-70 -68 M70 -68 L90 -52" stroke={palette.accent} strokeWidth="3" strokeLinecap="round" />
        </g>
      ) : null}
      {scene === 'negative' ? (
        <g transform="translate(200 108)">
          <rect x="-78" y="-36" width="156" height="72" rx="12" fill={palette.soft} stroke={palette.ink} strokeWidth="2" />
          <line x1="-40" y1="0" x2="40" y2="0" stroke={palette.accent} strokeWidth="5" strokeLinecap="round" />
          <circle cx="0" cy="0" r="46" fill="none" stroke={palette.accent} strokeWidth="3" opacity="0.45" />
        </g>
      ) : null}
      {scene === 'question' ? (
        <g transform="translate(200 108)">
          <circle cx="0" cy="0" r="48" fill={palette.soft} stroke={palette.accent} strokeWidth="3" />
          <text x="0" y="14" textAnchor="middle" fontSize="42" fill={palette.accent} fontWeight="800">
            ?
          </text>
        </g>
      ) : null}
      {scene === 'grammar' ? (
        <g transform="translate(200 112)">
          <rect x="-52" y="-40" width="104" height="72" rx="8" fill={palette.soft} stroke={palette.ink} strokeWidth="2" />
          <rect x="-40" y="-24" width="80" height="8" rx="4" fill={palette.ink} opacity="0.2" />
          <rect x="-40" y="-8" width="56" height="8" rx="4" fill={palette.ink} opacity="0.15" />
          <rect x="-40" y="8" width="64" height="8" rx="4" fill={palette.accent} opacity="0.35" />
        </g>
      ) : null}
    </svg>
  );
}
