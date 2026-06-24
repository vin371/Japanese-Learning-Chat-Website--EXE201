export function SpinnerLoader({ size = 72 }) {
  return (
    <div
      className="placement-spinner"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Đang tải"
    >
      <span className="placement-spinner__ring" />
    </div>
  );
}
