import { memo } from 'react';
import { resolveLearnUiJapanese } from '../../data/learnUiJapanese';

/**
 * Mặc định hiện tiếng Việt; hover thay bằng tiếng Nhật (CSS grid — không đổi layout).
 */
export const ViJaHoverText = memo(function ViJaHoverText({
  children,
  ja,
  className = '',
  as: Tag = 'span',
  title,
}) {
  const viText = typeof children === 'string' ? children : '';
  const jp = resolveLearnUiJapanese(viText, ja);
  const hasJa = Boolean(jp);

  if (!hasJa) {
    return (
      <Tag className={className} title={title}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      className={`vi-ja-hover${className ? ` ${className}` : ''}`}
      title={title ?? viText}
      aria-label={`${viText} (${jp})`}
      lang="vi"
    >
      <span className="vi-ja-hover__vi" aria-hidden={false}>
        {children}
      </span>
      <span className="vi-ja-hover__jp" lang="ja" aria-hidden="true">
        {jp}
      </span>
    </Tag>
  );
});

/** Alias ngắn — dùng toàn hệ thống. */
export const Vi = ViJaHoverText;
