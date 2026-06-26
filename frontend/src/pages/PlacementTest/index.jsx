import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ROUTES } from '../../data/routes';
import { useAuth } from '../../hooks/useAuth';
import http from '../../api/client';
import { storage } from '../../utils/storage';
import { isStaffUser } from '../../utils/roles';
import { levelFromScore, savePendingPlacement } from '../../utils/onboardingFlow';
import { PLACEMENT_DRAFT_KEY } from './constants';
import yumeLogo from '../../assets/yume-logo.png';

const TEST_DURATION_SECONDS = 15 * 60;

function readDraft() {
  try {
    const raw = localStorage.getItem(PLACEMENT_DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.answers !== 'object') return null;
    return { answers: data.answers, currentIndex: data.currentIndex ?? 0 };
  } catch {
    return null;
  }
}

function writeDraft(answers, currentIndex) {
  localStorage.setItem(
    PLACEMENT_DRAFT_KEY,
    JSON.stringify({ answers, currentIndex, savedAt: new Date().toISOString() }),
  );
}

function clearDraft() {
  localStorage.removeItem(PLACEMENT_DRAFT_KEY);
}

export default function PlacementTest() {
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SECONDS);
  const [submitted, setSubmitted] = useState(false);
  const expirySubmitRef = useRef(false);

  const navigate = useNavigate();
  const { user, setNeedsPlacementTest } = useAuth();

  useEffect(() => {
    if (isStaffUser(user)) {
      storage.set('needs_placement_test', false);
      setNeedsPlacementTest?.(false);
      navigate(ROUTES.LEARN, { replace: true });
    }
  }, [user, navigate, setNeedsPlacementTest]);

  useEffect(() => {
    if (isStaffUser(user)) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await http.get('/api/PlacementTest');
        if (!cancelled && res.data) {
          expirySubmitRef.current = false;
          setTest(res.data);
          setTimeLeft(res.data.timeLimitSeconds ?? TEST_DURATION_SECONDS);
          const d = readDraft();
          if (d?.answers) {
            setAnswers(d.answers);
            setCurrentIndex(Math.min(d.currentIndex ?? 0, (res.data.questions?.length ?? 1) - 1));
          }
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setTest(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSubmit = useCallback(
    async (isAuto = false) => {
      if (!test || submitting || submitted) return;
      setSubmitting(true);
      try {
        const payload = {
          answers: test.questions.map((q) => ({
            questionId: q.id,
            selectedKey: answers[q.id] || '',
          })),
        };
        const res = await http.post('/api/PlacementTest/submit', payload);
        const apiResult = res.data;
        const score = Number(apiResult?.correctCount ?? 0);
        const total = Number(apiResult?.totalCount ?? test.questions.length ?? 20);
        const recommendedLevel = String(apiResult?.levelLabel || levelFromScore(score)).toUpperCase();

        savePendingPlacement({ placementScore: score, recommendedLevel, total });
        clearDraft();
        setSubmitted(true);
        navigate(ROUTES.PLACEMENT_RESULT, {
          replace: true,
          state: { placementScore: score, total, recommendedLevel },
        });
      } catch (e) {
        if (!isAuto) console.error(e);
      } finally {
        setSubmitting(false);
      }
    },
    [test, submitted, submitting, answers, navigate],
  );

  useEffect(() => {
    if (!test || submitted) return;
    if (timeLeft <= 0) {
      if (!expirySubmitRef.current) {
        expirySubmitRef.current = true;
        void handleSubmit(true);
      }
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [test, timeLeft, submitted, handleSubmit]);

  const questions = test?.questions ?? [];
  const totalQ = questions.length || test?.totalQuestions || 20;
  const currentQ = questions[currentIndex];
  const selectedKey = currentQ ? answers[currentQ.id] : null;
  const progressPct = totalQ > 0 ? ((currentIndex + 1) / totalQ) * 100 : 0;
  const isLast = currentIndex >= totalQ - 1;

  const handleSelect = (key) => {
    if (!currentQ || submitted) return;
    setAnswers((prev) => {
      const next = { ...prev, [currentQ.id]: key };
      writeDraft(next, currentIndex);
      return next;
    });
  };

  const handleContinue = () => {
    if (!selectedKey || submitting) return;
    if (isLast) {
      void handleSubmit(false);
      return;
    }
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    writeDraft(answers, nextIndex);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const urgent = timeLeft <= 60 && !submitted;

  if (loading) {
    return (
      <div className="onboarding-page">
        <p>Đang tải bài test...</p>
      </div>
    );
  }

  if (!test || !currentQ) {
    return (
      <div className="onboarding-page">
        <p>Không tải được bài test.</p>
      </div>
    );
  }

  const opts = currentQ.options || [];

  return (
    <div className="onboarding-page">
      <div className="placement-quiz">
        <div className="onboarding-brand">
          <img src={yumeLogo} alt="" className="onboarding-brand__logo" />
          <span className="onboarding-brand__name">Kiểm tra trình độ</span>
        </div>

        <div className="placement-quiz__top">
          <div className="placement-quiz__meta">
            <span>
              Câu <strong>{currentIndex + 1}</strong>/{totalQ}
            </span>
            <span className={`placement-quiz__timer ${urgent ? 'placement-quiz__timer--urgent' : ''}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          <div className="placement-quiz__bar" aria-hidden>
            <div className="placement-quiz__bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <article className="placement-quiz__card">
          <p className="placement-quiz__stem">{currentQ.text}</p>
          <div className="placement-quiz__opts" role="radiogroup" aria-label={`Câu ${currentIndex + 1}`}>
            {opts.map((opt) => {
              const checked = selectedKey === opt.key;
              const id = `placement-q-${currentQ.id}-${opt.key}`;
              return (
                <label key={opt.key} htmlFor={id} className={`survey-opt ${checked ? 'survey-opt--selected' : ''}`}>
                  <input
                    id={id}
                    type="radio"
                    name={`q-${currentQ.id}`}
                    checked={checked}
                    onChange={() => handleSelect(opt.key)}
                  />
                  <span className="survey-opt__text">
                    <strong>{String(opt.key).toUpperCase()}.</strong> {opt.text}
                  </span>
                </label>
              );
            })}
          </div>
        </article>

        <div className="placement-quiz__bottom">
          <button
            type="button"
            className="onboarding-btn onboarding-btn--primary"
            disabled={!selectedKey || submitting}
            onClick={handleContinue}
          >
            {submitting ? 'Đang nộp bài…' : isLast ? 'Hoàn thành' : 'Tiếp tục'}
            {!submitting ? <ChevronRight size={18} /> : null}
          </button>
        </div>
      </div>
    </div>
  );
}
