import { Link } from 'react-router-dom';
import { ROUTES } from '../../../data/routes';
import { learnRouteWithJlpt } from '../../../utils/learnLevelAccess';

export function LearnLevelLocked({ targetCode, userCode, message }) {
  const back = learnRouteWithJlpt(ROUTES.LEARN, userCode);
  return (
    <div className="learn-level-locked" role="status">
      <div className="learn-level-locked__icon" aria-hidden>
        🔒
      </div>
      <h2 className="learn-level-locked__title">
        {targetCode} chưa mở khóa
      </h2>
      <p className="learn-level-locked__text">{message}</p>
      <Link className="learn-level-locked__btn" to={back}>
        Về {userCode}
      </Link>
    </div>
  );
}
