import React from 'react';

/**
 * Reusable Tooltip component using CSS-only Tailwind groups
 * @param {Object} props
 * @param {React.ReactNode} props.children - Target element to hover
 * @param {React.ReactNode} props.content - Tooltip text or element
 * @param {string} [props.className] - Extra classes for tooltip bubble
 * @param {string} [props.containerClassName] - Extra classes for wrapper (e.g. 'w-full' or 'inline-block')
 */
export function Tooltip({
  children,
  content,
  className = '',
  containerClassName = 'inline-block',
}) {
  if (!content) return children;

  return (
    <div className={`relative group ${containerClassName}`}>
      {children}
      <span
        className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-2.5 -translate-x-1/2 scale-75 opacity-0 transition-all duration-200 ease-out group-hover:scale-100 group-hover:opacity-100 bg-slate-950/90 dark:bg-slate-800/95 backdrop-blur-sm text-white text-[0.72rem] font-semibold px-2.5 py-1.5 rounded-lg shadow-lg border border-white/10 whitespace-nowrap ${className}`}
      >
        {content}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950/90 dark:border-t-slate-800/95" />
      </span>
    </div>
  );
}
