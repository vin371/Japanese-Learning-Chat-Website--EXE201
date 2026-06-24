import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../data/routes';
import { useAuth } from '../../hooks/useAuth';
import { storage } from '../../utils/storage';
import { authService } from '../../services/authService';
import {
  PLACEMENT_PROCESSING_DELAY_MS,
  PLACEMENT_PROCESSING_START_KEY,
  clearPendingPlacement,
  getLearnHomeForLevel,
  hasCompletedPlacementResult,
  hasPendingPlacement,
  readPendingPlacement,
  readPlacementResult,
  savePendingPlacement,
  savePlacementResult,
} from '../../utils/onboardingFlow';
import { PlacementProcessingScreen } from './components/PlacementProcessingScreen';
import { ResultModal } from './components/ResultModal';

function resolvePendingFromNavigation(state) {
  if (!state || state.placementScore == null) return null;
  return {
    placementScore: state.placementScore,
    recommendedLevel: state.recommendedLevel,
    total: state.total ?? 20,
  };
}

function scheduleProcessingFinish(onFinish) {
  const now = Date.now();
  let startedAt = Number(sessionStorage.getItem(PLACEMENT_PROCESSING_START_KEY));
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    startedAt = now;
    sessionStorage.setItem(PLACEMENT_PROCESSING_START_KEY, String(startedAt));
  }

  const remaining = Math.max(0, PLACEMENT_PROCESSING_DELAY_MS - (now - startedAt));

  if (remaining === 0) {
    sessionStorage.removeItem(PLACEMENT_PROCESSING_START_KEY);
    onFinish();
    return undefined;
  }

  const timer = setTimeout(() => {
    sessionStorage.removeItem(PLACEMENT_PROCESSING_START_KEY);
    onFinish();
  }, remaining);

  return () => clearTimeout(timer);
}

export default function PlacementResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setNeedsPlacementTest } = useAuth();

  const [isProcessing, setIsProcessing] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    const saved = readPlacementResult();
    if (hasCompletedPlacementResult() && saved) {
      sessionStorage.removeItem(PLACEMENT_PROCESSING_START_KEY);
      setResultData({
        placementScore: saved.placementScore,
        recommendedLevel: saved.recommendedLevel,
        total: 20,
      });
      setIsProcessing(false);
      setShowResult(true);
      return undefined;
    }

    const fromNav = resolvePendingFromNavigation(location.state);
    const fromSession = readPendingPlacement();
    const pending = fromNav || fromSession;

    if (!pending) {
      navigate(ROUTES.TEST_INTRO, { replace: true });
      return undefined;
    }

    if (fromNav) {
      savePendingPlacement(pending);
    }

    setResultData(pending);

    return scheduleProcessingFinish(() => {
      setIsProcessing(false);
      setShowResult(true);
    });
  }, [location.state, navigate]);

  if (!resultData && !hasPendingPlacement() && !hasCompletedPlacementResult()) {
    return null;
  }

  const score = resultData?.placementScore ?? 0;
  const total = resultData?.total ?? 20;
  const level = resultData?.recommendedLevel ?? 'N5';

  const handleContinue = async () => {
    setBtnLoading(true);
    try {
      savePlacementResult({ placementScore: score, recommendedLevel: level });
      clearPendingPlacement();
      storage.set('needs_placement_test', false);
      setNeedsPlacementTest?.(false);

      const stored = authService.getStoredUser();
      if (stored) {
        const next = {
          ...stored,
          levelCode: level,
          level,
          LevelCode: level,
        };
        authService.setStoredUser(next);
        setUser(authService.mergeUserWithRoleFromToken(next));
      }
    } finally {
      navigate(getLearnHomeForLevel(level), { replace: true });
    }
  };

  if (isProcessing) {
    return <PlacementProcessingScreen />;
  }

  return (
    <ResultModal
      score={score}
      total={total}
      recommendedLevel={level}
      onContinue={handleContinue}
      loading={btnLoading}
      visible={showResult}
    />
  );
}
