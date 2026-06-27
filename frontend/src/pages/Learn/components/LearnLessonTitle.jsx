import { splitLearnLessonTitle } from '../../../utils/learnLessonTitle';

/**
 * Tiêu đề bài — 2 tầng thay cho dấu ・: dòng chính + phụ có vạch accent.
 */
export function LearnLessonTitle({ title, className = '', as: Tag = 'h4' }) {
  const { primary, secondary, full } = splitLearnLessonTitle(title);

  if (!secondary) {
    return (
      <Tag className={`learn-lesson-title learn-lesson-title--single ${className}`.trim()}>{full}</Tag>
    );
  }

  return (
    <Tag className={`learn-lesson-title learn-lesson-title--split ${className}`.trim()}>
      <span className="learn-lesson-title__primary">{primary}</span>
      <span className="learn-lesson-title__sub">
        <span className="learn-lesson-title__sub-accent" aria-hidden />
        <span className="learn-lesson-title__sub-text">{secondary}</span>
      </span>
    </Tag>
  );
}
