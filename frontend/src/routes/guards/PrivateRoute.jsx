import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../data/routes';
import { getOnboardingEnforcement } from '../../utils/onboardingFlow';

/**
 * Bảo vệ route: đăng nhập + onboarding bắt buộc (survey → test intro → placement test).
 */
export function PrivateRoute({ children }) {
  const { isAuthenticated, loading, needsPlacementTest, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loading">Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const redirect = getOnboardingEnforcement(location.pathname, { needsPlacementTest, user });
  if (redirect && redirect !== location.pathname) {
    return <Navigate to={redirect} replace />;
  }

  return children;
}
