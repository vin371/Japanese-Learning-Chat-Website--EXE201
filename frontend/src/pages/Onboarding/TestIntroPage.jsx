import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, Sparkles, Target } from 'lucide-react';
import { ROUTES } from '../../data/routes';
import { OnboardingLayout } from './components/OnboardingLayout';
import yumeLogo from '../../assets/yume-logo.png';

const FACTS = [
  { icon: ClipboardList, value: '20', label: 'câu hỏi' },
  { icon: Clock, value: '5–10', label: 'phút' },
  { icon: Target, value: 'Auto', label: 'xếp trình độ' },
  { icon: Sparkles, value: 'AI', label: 'đề xuất lộ trình' },
];

export default function TestIntroPage() {
  const navigate = useNavigate();

  return (
    <OnboardingLayout>
      <div className="onboarding-brand">
        <img src={yumeLogo} alt="" className="onboarding-brand__logo" />
        <span className="onboarding-brand__name">YumeGo-ji</span>
      </div>

      <div className="onboarding-card onboarding-card--wide">
        <h1 className="onboarding-title">Kiểm tra trình độ của bạn</h1>
        <p className="onboarding-lead">
          YumeGo-ji sẽ dùng bài test 20 câu để xác định trình độ phù hợp của bạn: N5, N4 hoặc N3.
        </p>

        <div className="test-intro-facts">
          {FACTS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="test-intro-fact">
              <Icon size={22} color="#B72025" style={{ margin: '0 auto 0.35rem' }} />
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="onboarding-actions">
          <button
            type="button"
            className="onboarding-btn onboarding-btn--primary"
            onClick={() => navigate(ROUTES.PLACEMENT_TEST, { replace: true })}
          >
            Bắt đầu kiểm tra
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
