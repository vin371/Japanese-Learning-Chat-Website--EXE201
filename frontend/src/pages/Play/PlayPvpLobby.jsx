import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../data/routes';

/** PvP games đã ngừng phát triển — chuyển về hub Trò chơi. */
export default function PlayPvpLobby() {
  return <Navigate to={ROUTES.PLAY} replace />;
}
