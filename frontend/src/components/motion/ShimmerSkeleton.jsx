/** Khối skeleton shimmer — loading chuyên nghiệp */
export default function ShimmerSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`yume-shimmer ${className}`.trim()} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="yume-shimmer__line"
          style={{ width: i === lines - 1 ? '72%' : '100%' }}
        />
      ))}
    </div>
  );
}
