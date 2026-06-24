import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ROUTES } from '../../data/routes';
import { OnboardingLayout, OnboardingProgressBar } from './components/OnboardingLayout';
import { SurveyQuestionCard } from './components/SurveyQuestionCard';
import { SURVEY_QUESTIONS, saveSurveyAnswers } from '../../utils/onboardingFlow';
import yumeLogo from '../../assets/yume-logo.png';
import { Vi } from '../../components/ui/Vi';

export default function OnboardingSurveyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ goal: '', focus: '', dailyDuration: '' });

  const current = SURVEY_QUESTIONS[step];
  const totalSteps = SURVEY_QUESTIONS.length;
  const currentValue = answers[current.id];
  const progressPct = useMemo(() => ((step + 1) / totalSteps) * 100, [step, totalSteps]);

  const handleNext = () => {
    if (!currentValue) return;
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      return;
    }
    saveSurveyAnswers(answers);
    navigate(ROUTES.TEST_INTRO, { replace: true });
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <OnboardingLayout>
      <div className="onboarding-brand">
        <img src={yumeLogo} alt="" className="onboarding-brand__logo" />
        <span className="onboarding-brand__name">YumeGo-ji</span>
      </div>

      <div className="onboarding-card">
        {step === 0 ? (
          <>
            <h1 className="onboarding-title"><Vi>Chào mừng bạn đến với YumeGo-ji</Vi></h1>
            <p className="onboarding-lead">
              YumeGo-ji là hệ thống học tiếng Nhật dành cho người học JLPT N5–N3. Bạn sẽ học qua Từ vựng, Ngữ pháp,
              Kanji và các bài luyện tập ngắn mỗi ngày.
            </p>
            <p className="onboarding-sub">
              Trước khi bắt đầu, hãy trả lời vài câu hỏi nhanh để hệ thống hiểu mục tiêu học của bạn.
            </p>
          </>
        ) : null}

        <p className="onboarding-step-label">Bước {step + 1}/{totalSteps}</p>
        <OnboardingProgressBar percent={progressPct} />

        <SurveyQuestionCard
          question={current.question}
          options={current.options}
          value={currentValue}
          onChange={(val) => setAnswers((prev) => ({ ...prev, [current.id]: val }))}
        />

        <div className="onboarding-actions">
          <button type="button" className="onboarding-btn onboarding-btn--primary" disabled={!currentValue} onClick={handleNext}>
            {step < totalSteps - 1 ? <Vi>Tiếp tục</Vi> : <Vi>Hoàn thành khảo sát</Vi>}
            <ChevronRight size={18} />
          </button>
          {step > 0 ? (
            <button type="button" className="onboarding-btn onboarding-btn--ghost" onClick={handleBack}>
              <Vi>Quay lại</Vi>
            </button>
          ) : null}
        </div>
      </div>
    </OnboardingLayout>
  );
}
