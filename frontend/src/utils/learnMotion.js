/** Preset Framer Motion — trang Học tập & Dashboard học viên */

export const learnSpring = { type: 'spring', stiffness: 380, damping: 32 };

export const learnPageRoot = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.03 },
  },
};

export const learnPageItem = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: learnSpring,
  },
};

export const learnCardHover = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -10,
    scale: 1,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
  },
  tap: { scale: 0.985, transition: { duration: 0.15, ease: [0, 0, 0.2, 1] } },
};

export const learnFlipEnter = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 340, damping: 26 },
  },
};

export const barEase = [0.22, 1, 0.36, 1];
