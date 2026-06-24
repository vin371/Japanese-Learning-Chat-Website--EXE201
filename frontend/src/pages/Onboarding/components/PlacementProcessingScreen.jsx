import { SpinnerLoader } from './SpinnerLoader';
import { AnimatedMessage } from './AnimatedMessage';

export function PlacementProcessingScreen() {
  return (
    <div className="placement-processing">
      <div className="placement-processing__inner">
        <SpinnerLoader size={80} />
        <AnimatedMessage />
        <p className="placement-processing__sub">
          Vui lòng chờ một chút, YumeGo-ji đang phân tích kết quả của bạn
        </p>
      </div>
    </div>
  );
}
