import { Star, Trophy } from 'lucide-react';

export function ResultModal({ score, total, recommendedLevel, onContinue, loading, visible = true }) {
  const level = String(recommendedLevel || 'N5').toUpperCase();

  return (
    <div className={`placement-result-overlay ${visible ? 'placement-result-overlay--visible' : ''}`}>
      <div
        className={`placement-result-modal ${visible ? 'placement-result-modal--visible' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="placement-result-title"
      >
        <div className="placement-result-modal__icon" aria-hidden>
          <Trophy size={40} strokeWidth={1.75} />
          <Star className="placement-result-modal__star" size={18} fill="#B72025" color="#B72025" />
        </div>
        <h1 id="placement-result-title" className="placement-result-modal__title">
          Xin chúc mừng!
        </h1>
        <p className="placement-result-modal__level">Bạn đã đạt trình độ {level}</p>
        <p className="placement-result-modal__score">
          Kết quả của bạn: {score}/{total}
        </p>
        <p className="placement-result-modal__hint">
          YumeGo-ji đã đề xuất lộ trình học phù hợp với trình độ hiện tại của bạn.
        </p>
        <button type="button" className="onboarding-btn onboarding-btn--primary" onClick={onContinue} disabled={loading}>
          {loading ? 'Đang chuẩn bị…' : 'Vào trang học của tôi'}
        </button>
      </div>
    </div>
  );
}
