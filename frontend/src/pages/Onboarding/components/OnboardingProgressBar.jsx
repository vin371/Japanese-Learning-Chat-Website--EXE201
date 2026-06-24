export function OnboardingProgressBar({ percent }) {
  const safe = Math.min(100, Math.max(0, Number(percent) || 0));
  return (
    <div className="onboarding-progress" role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100}>
      <div className="onboarding-progress__fill" style={{ width: `${safe}%` }} />
    </div>
  );
}
