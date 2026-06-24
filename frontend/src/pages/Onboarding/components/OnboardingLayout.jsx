import { OnboardingProgressBar } from './OnboardingProgressBar';

export function OnboardingLayout({ children, wide = false }) {
  return (
    <div className="onboarding-page">
      <div className={`onboarding-shell ${wide ? 'onboarding-shell--wide' : ''}`}>{children}</div>
    </div>
  );
}

export { OnboardingProgressBar };
