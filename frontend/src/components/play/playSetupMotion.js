const easeOut = [0.22, 1, 0.36, 1];

/** Variant cha — bọc toàn bộ nội dung setup + banner (stagger). */
export function playSetupParentVariants(reduceMotion) {
  if (reduceMotion) return { hidden: {}, show: {} };
  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: 0.32, ease: easeOut, staggerChildren: 0.1, delayChildren: 0.05 },
    },
  };
}

/** Variant con — từng thẻ / section trong setup. */
export function playSetupChildVariants(reduceMotion) {
  if (reduceMotion) return { hidden: {}, show: {} };
  return {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: easeOut } },
  };
}
