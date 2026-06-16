import { useReducedMotion } from 'framer-motion';

/**
 * Thẻ lật 2 mặt — chữ Nhật / nghĩa.
 */
export default function LessonFlipCard({ isFlipped, onFlip, front, back, className = '', accent = 'var(--color-primary)' }) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={['learn-flip-card', className].filter(Boolean).join(' ')}
      style={{ '--flip-accent': accent }}
    >
      <button
        type="button"
        className={`learn-flip-card__hit${isFlipped ? ' learn-flip-card__hit--back' : ''}`}
        onClick={onFlip}
        aria-label={isFlipped ? 'Lật thẻ' : 'Lật xem nghĩa'}
        aria-pressed={isFlipped}
      >
        <div
          className={`learn-flip-card__inner${isFlipped ? ' learn-flip-card__inner--flipped' : ''}${reduceMotion ? ' learn-flip-card__inner--reduce' : ''}`}
        >
          <div className="learn-flip-card__face learn-flip-card__face--front">{front}</div>
          <div className="learn-flip-card__face learn-flip-card__face--back">{back}</div>
        </div>
      </button>
      <p className="learn-flip-card__hint">{isFlipped ? 'Bấm để lật lại' : 'Bấm thẻ để lật'}</p>
    </div>
  );
}
