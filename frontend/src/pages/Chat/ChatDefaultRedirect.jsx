import { Navigate } from 'react-router-dom';
import { getDefaultChatRoomPath } from '../../utils/chatRoomAccess';

/** /chat → thẳng Phòng chung (không fetch, không lazy hop). */
export default function ChatDefaultRedirect() {
  return <Navigate to={getDefaultChatRoomPath()} replace />;
}
