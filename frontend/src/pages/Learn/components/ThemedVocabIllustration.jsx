import { resolveLessonTheme, resolveVocabScene } from '../../../utils/vocabLessonThemes';

/** Minh họa SVG phẳng — cùng palette theo chủ đề bài học. */
export default function ThemedVocabIllustration({ lessonTitle, lessonSlug, item, className = '' }) {
  const theme = resolveLessonTheme(lessonTitle, lessonSlug);
  const scene = resolveVocabScene(item);
  const { palette } = theme;
  const rootClass = ['learn-themed-art', className].filter(Boolean).join(' ');

  return (
    <svg
      className={rootClass}
      viewBox="0 0 400 220"
      role="img"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`tg-${theme.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.sky} />
          <stop offset="100%" stopColor={palette.ground} />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#tg-${theme.id})`} />
      <ellipse cx="200" cy="200" rx="220" ry="40" fill={palette.ground} opacity="0.55" />
      {renderScene(scene, palette)}
      <circle cx="340" cy="36" r="28" fill={palette.soft} opacity="0.85" />
      <circle cx="56" cy="52" r="18" fill={palette.soft} opacity="0.6" />
    </svg>
  );
}

function renderScene(scene, p) {
  switch (scene) {
    case 'self':
      return (
        <g transform="translate(200 118)">
          <circle cx="0" cy="-34" r="26" fill={p.soft} stroke={p.ink} strokeWidth="2" />
          <path d="M-38 42 Q0 8 38 42" fill="none" stroke={p.accent} strokeWidth="10" strokeLinecap="round" />
          <rect x="-14" y="-8" width="28" height="18" rx="4" fill={p.accent} opacity="0.25" />
        </g>
      );
    case 'you':
      return (
        <g>
          <g transform="translate(155 118)">
            <circle cx="0" cy="-30" r="22" fill={p.soft} stroke={p.ink} strokeWidth="2" />
            <path d="M-30 38 Q0 10 30 38" fill="none" stroke={p.ink} strokeWidth="8" strokeLinecap="round" />
          </g>
          <g transform="translate(245 118)">
            <circle cx="0" cy="-30" r="22" fill={p.accent} stroke={p.ink} strokeWidth="2" />
            <path d="M-30 38 Q0 10 30 38" fill="none" stroke={p.accent} strokeWidth="8" strokeLinecap="round" />
          </g>
          <path d="M188 92 Q200 78 212 92" fill="none" stroke={p.accent} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'name':
      return (
        <g transform="translate(200 112)">
          <rect x="-58" y="-42" width="116" height="74" rx="10" fill={p.soft} stroke={p.ink} strokeWidth="2" />
          <circle cx="-28" cy="-12" r="16" fill={p.accent} opacity="0.35" />
          <rect x="-4" y="-22" width="52" height="8" rx="4" fill={p.ink} opacity="0.2" />
          <rect x="-4" y="-6" width="36" height="6" rx="3" fill={p.ink} opacity="0.15" />
        </g>
      );
    case 'age':
      return (
        <g transform="translate(200 118)">
          <rect x="-46" y="8" width="92" height="14" rx="4" fill={p.ink} opacity="0.15" />
          <rect x="-40" y="-18" width="80" height="28" rx="6" fill={p.soft} stroke={p.accent} strokeWidth="2" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={-30 + i * 22} y="-8" width="10" height="14" rx="2" fill={p.accent} opacity={0.5 + i * 0.15} />
          ))}
          <path d="M0 -42 L0 -58 M-10 -50 L10 -50" stroke={p.accent} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'country':
      return (
        <g transform="translate(200 112)">
          <circle cx="0" cy="0" r="48" fill={p.soft} stroke={p.ink} strokeWidth="2" />
          <ellipse cx="-8" cy="-4" rx="22" ry="30" fill={p.accent} opacity="0.35" />
          <ellipse cx="18" cy="8" rx="16" ry="22" fill={p.accent} opacity="0.5" />
          <path d="M-48 0 H48" stroke={p.ink} opacity="0.12" strokeWidth="2" />
        </g>
      );
    case 'work':
      return (
        <g transform="translate(200 118)">
          <rect x="-42" y="-10" width="84" height="52" rx="8" fill={p.soft} stroke={p.ink} strokeWidth="2" />
          <rect x="-42" y="-10" width="84" height="14" fill={p.accent} opacity="0.45" rx="8" />
          <rect x="-16" y="-34" width="32" height="24" rx="4" fill={p.accent} opacity="0.3" />
        </g>
      );
    case 'study':
      return (
        <g transform="translate(200 118)">
          <path d="M-50 20 L0 -28 L50 20 Z" fill={p.accent} opacity="0.35" />
          <rect x="-36" y="12" width="72" height="10" fill={p.ink} opacity="0.2" rx="2" />
          <rect x="-28" y="-6" width="56" height="22" rx="4" fill={p.soft} stroke={p.ink} strokeWidth="2" />
        </g>
      );
    case 'family':
      return (
        <g transform="translate(200 120)">
          {[-36, 0, 36].map((x, i) => (
            <g key={x} transform={`translate(${x} 0)`}>
              <circle cx="0" cy="-28" r={i === 1 ? 20 : 16} fill={p.soft} stroke={p.ink} strokeWidth="2" />
              <path d={`M-${i === 1 ? 24 : 18} 28 Q0 ${i === 1 ? 6 : 10} ${i === 1 ? 24 : 18} 28`} fill="none" stroke={p.accent} strokeWidth={i === 1 ? 9 : 7} strokeLinecap="round" opacity={0.7 + i * 0.1} />
            </g>
          ))}
        </g>
      );
    case 'meal':
      return (
        <g transform="translate(200 118)">
          <ellipse cx="0" cy="18" rx="54" ry="14" fill={p.ink} opacity="0.12" />
          <ellipse cx="0" cy="8" rx="48" ry="20" fill={p.soft} stroke={p.ink} strokeWidth="2" />
          <circle cx="-12" cy="2" r="10" fill={p.accent} opacity="0.45" />
          <circle cx="14" cy="0" r="8" fill={p.accent} opacity="0.35" />
        </g>
      );
    case 'drink':
      return (
        <g transform="translate(200 112)">
          <path d="M-22 36 L-14 -28 L14 -28 L22 36 Z" fill={p.soft} stroke={p.ink} strokeWidth="2" />
          <rect x="-10" y="-42" width="20" height="14" rx="3" fill={p.accent} opacity="0.4" />
        </g>
      );
    case 'home':
      return (
        <g transform="translate(200 118)">
          <path d="M0 -48 L-56 4 V40 H56 V4 Z" fill={p.soft} stroke={p.ink} strokeWidth="2" />
          <rect x="-16" y="12" width="32" height="28" rx="3" fill={p.accent} opacity="0.45" />
        </g>
      );
    case 'transport':
      return (
        <g transform="translate(200 120)">
          <rect x="-58" y="-8" width="116" height="34" rx="12" fill={p.soft} stroke={p.ink} strokeWidth="2" />
          <circle cx="-30" cy="30" r="12" fill={p.ink} opacity="0.25" />
          <circle cx="30" cy="30" r="12" fill={p.ink} opacity="0.25" />
          <rect x="-40" y="-22" width="36" height="18" rx="4" fill={p.accent} opacity="0.35" />
        </g>
      );
    case 'money':
      return (
        <g transform="translate(200 112)">
          <rect x="-40" y="-24" width="80" height="48" rx="8" fill={p.accent} opacity="0.35" stroke={p.ink} strokeWidth="2" />
          <text x="0" y="8" textAnchor="middle" fontSize="28" fill={p.ink} fontWeight="700">
            ¥
          </text>
        </g>
      );
    case 'greeting':
      return (
        <g transform="translate(200 118)">
          <circle cx="0" cy="-30" r="24" fill={p.soft} stroke={p.ink} strokeWidth="2" />
          <path d="M-34 36 Q0 4 34 36" fill="none" stroke={p.accent} strokeWidth="9" strokeLinecap="round" />
          <path d="M28 -42 Q42 -56 54 -40" fill="none" stroke={p.accent} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 'friends':
      return (
        <g transform="translate(200 118)">
          <path d="M-50 20 Q0 -20 50 20" fill="none" stroke={p.accent} strokeWidth="6" strokeLinecap="round" />
          <circle cx="-36" cy="0" r="14" fill={p.soft} stroke={p.ink} strokeWidth="2" />
          <circle cx="36" cy="0" r="14" fill={p.soft} stroke={p.ink} strokeWidth="2" />
        </g>
      );
    default:
      return (
        <g transform="translate(200 112)">
          <circle cx="0" cy="0" r="40" fill={p.soft} stroke={p.accent} strokeWidth="3" opacity="0.9" />
          <path d="M-18 -6 C-8 -22 8 -22 18 -6 C8 10 -8 10 -18 -6 Z" fill={p.accent} opacity="0.45" />
          <circle cx="0" cy="-8" r="6" fill={p.accent} />
        </g>
      );
  }
}
