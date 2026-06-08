import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ROUTES } from '../../../data/routes';
import { SakuraRainLayer } from '../../../components/effects/SakuraRainLayer';
import { PhdRewardsMarquee } from './PhdRewardsMarquee';
import {
  POWERUP_ROWS,
  REWARD_CARDS,
  coverForGame,
  formatIntVi,
  levelBadge,
  pick,
  themeClass,
} from './playHubCore';
import { ArrowRight, ChartColumn, Gem, Gamepad, Gamepad2, Swords, ShoppingBag, Trophy, Package, PackageOpen, X, Check, Flame, Zap } from "lucide-react";
/** Alias để ESLint (không có react/jsx-uses-vars) nhận diện biến được dùng qua JSX. */
const Motion = motion;

const easeOut = [0.22, 1, 0.36, 1];

const vPage = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.38, ease: easeOut, staggerChildren: 0.075, delayChildren: 0.05 },
  },
};

const vBlock = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  },
};

const vHero = {
  hidden: { opacity: 0, y: 28, x: -14 },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: { type: 'spring', stiffness: 340, damping: 26 },
  },
};

const vColumns = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.2, staggerChildren: 0.11, delayChildren: 0.03 },
  },
};

const vSlideMain = {
  hidden: { opacity: 0, x: -26, y: 10 },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { type: 'spring', stiffness: 360, damping: 28 },
  },
};

const vAsideCol = {
  hidden: { opacity: 0, x: 28, y: 12 },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 360,
      damping: 28,
      staggerChildren: 0.072,
      delayChildren: 0.1,
    },
  },
};

const vAsideItem = {
  hidden: { opacity: 0, x: 16, y: 8 },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { type: 'spring', stiffness: 420, damping: 30 },
  },
};

const vCard = {
  hidden: { opacity: 0, y: 22, x: -8, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 440, damping: 30 },
  },
};

const hoverGame = {
  y: -10,
  scale: 1.028,
  boxShadow:
    '0 22px 48px -14px rgba(190, 24, 93, 0.22), 0 14px 32px -12px rgba(15, 23, 42, 0.12)',
  transition: { type: 'spring', stiffness: 480, damping: 24 },
};
const hoverReward = { y: -6, scale: 1.04, transition: { type: 'spring', stiffness: 500, damping: 24 } };

const hoverAsidePanel = {
  y: -5,
  scale: 1.014,
  boxShadow:
    '0 18px 40px -14px rgba(190, 24, 93, 0.16), 0 10px 24px -10px rgba(15, 23, 42, 0.1)',
  transition: { type: 'spring', stiffness: 400, damping: 26 },
};

function leaderboardHeading(kind) {
  if (kind === 'weekly') return 'Bảng xếp hạng tuần';
  if (kind === 'monthly') return 'Bảng xếp hạng tháng';
  return 'Top EXP';
}

function rankCellLabel(kind) {
  if (kind === 'weekly') return 'BXH tuần';
  if (kind === 'monthly') return 'BXH tháng';
  return 'Hạng EXP';
}

/**
 * Giao diện hub /play — layout 2 cột, motion, nền glass + sakura.
 * Header site (LearnerTopNav) nằm ngoài component này.
 */
export function PlayHubDashboard({
  loadError,
  loading,
  ordered,
  displayName,
  exp,
  streakDays,
  xu,
  expUi,
  pseudoLevel,
  invQty,
  myLbRank,
  lbBoardKind,
  lbRows,
  expTopRows,
  user,
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative isolate min-h-0 play-dash">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
        <SakuraRainLayer petalCount={28} buoyant />
      </div>
      <div
        className="fixed inset-0 z-0 backdrop-blur-md phd-glass-layer-tw"
        style={{
          background: 'radial-gradient(900px 420px at 12% 8%, rgba(255, 228, 235, 0.55), transparent 62%), radial-gradient(720px 380px at 88% 18%, rgba(224, 231, 255, 0.45), transparent 58%), linear-gradient(165deg, rgba(255, 255, 255, 0.72) 0%, rgba(248, 250, 252, 0.55) 45%, rgba(255, 241, 246, 0.5) 100%)'
        }}
        aria-hidden
      />
      <style>{`
        html[data-theme='dark'] .phd-glass-layer-tw {
          background: radial-gradient(800px 400px at 15% 10%, rgba(190, 24, 93, 0.12), transparent 55%), radial-gradient(640px 360px at 85% 20%, rgba(99, 102, 241, 0.14), transparent 55%), linear-gradient(168deg, rgba(15, 23, 42, 0.88) 0%, rgba(17, 24, 39, 0.92) 100%) !important;
        }
      `}</style>
      <Motion.div
        className="relative z-10"
        variants={vPage}
        initial="hidden"
        animate="show"
        style={{ willChange: 'opacity' }}
      >
        <Motion.div
          className="mb-5 px-5 py-4 lg:px-6 lg:py-6 rounded-[22px] border border-slate-900/10 bg-white/78 dark:bg-slate-900/82 dark:border-slate-400/20 backdrop-blur-md shadow-[0_18px_48px_-28px_rgba(15,23,42,0.18)] dark:shadow-[0_18px_48px_-24px_rgba(0,0,0,0.45)]"
          variants={vHero}
          animate={{
            boxShadow: [
              '0 18px 48px -28px rgba(15, 23, 42, 0.18)',
              '0 22px 56px -24px rgba(190, 24, 93, 0.14)',
              '0 18px 48px -28px rgba(15, 23, 42, 0.18)',
            ],
          }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <p className="inline-flex mb-2 px-2.5 py-1 rounded-full text-[0.72rem] font-extrabold tracking-wide text-rose-700 bg-rose-200/55 border border-rose-400/35 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-900/50">CHÀO MỪNG TRỞ LẠI!</p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="m-0 mb-2 text-[clamp(1.35rem,2.8vw,1.85rem)] font-extrabold text-slate-900 dark:text-slate-100">
                Xin chào, <strong className="text-rose-700 dark:text-rose-400">{displayName}</strong>!
              </h1>
              <p className="m-0 max-w-xl leading-relaxed text-slate-500 text-[0.95rem]">
                Hôm nay bạn đã sẵn sàng chinh phục tiếng Nhật chưa? Daily Challenge đang chờ bạn!
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Link className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50" to={`${ROUTES.PLAY}/daily`}>
                  <Swords /> Daily Challenge
                </Link>
                <Link className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50" to={`${ROUTES.PLAY}/hiragana-match`}>
                  <Gamepad2 /> Quick Match
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-stretch" aria-label="Chỉ số nhanh">
              <div className="min-w-[108px] px-3 py-2.5 rounded-2xl border border-slate-900/10 bg-gradient-to-br from-white/95 to-rose-50/88 dark:from-slate-800/95 dark:to-slate-900/90 dark:border-slate-400/20 shadow-[0_8px_22px_-12px_rgba(190,24,93,0.25)]">
                <span className="block text-[0.66rem] font-extrabold tracking-wide text-slate-600 dark:text-slate-300 uppercase">EXP</span>
                <span className="text-[1.15rem] font-black leading-tight bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">{formatIntVi(exp)}</span>
              </div>
              <div className="min-w-[108px] px-3 py-2.5 rounded-2xl border border-slate-900/10 bg-gradient-to-br from-white/95 to-rose-50/88 dark:from-slate-800/95 dark:to-slate-900/90 dark:border-slate-400/20 shadow-[0_8px_22px_-12px_rgba(190,24,93,0.25)]">
                <span className="block text-[0.66rem] font-extrabold tracking-wide text-slate-600 dark:text-slate-300 uppercase">Xu</span>
                <span className="text-[1.15rem] font-black leading-tight text-amber-700 dark:text-amber-500">{formatIntVi(xu)}</span>
              </div>
              <div className="min-w-[108px] px-3 py-2.5 rounded-2xl border border-slate-900/10 bg-gradient-to-br from-white/95 to-rose-50/88 dark:from-slate-800/95 dark:to-slate-900/90 dark:border-slate-400/20 shadow-[0_8px_22px_-12px_rgba(190,24,93,0.25)]">
                <span className="block text-[0.66rem] font-extrabold tracking-wide text-slate-600 dark:text-slate-300 uppercase">Streak</span>
                <span className="text-[1.15rem] font-black text-slate-900 dark:text-slate-50 leading-tight">{formatIntVi(streakDays)} ngày</span>
              </div>
              <div className="min-w-[108px] px-3 py-2.5 rounded-2xl border border-slate-900/10 bg-gradient-to-br from-white/95 to-rose-50/88 dark:from-slate-800/95 dark:to-slate-900/90 dark:border-slate-400/20 shadow-[0_8px_22px_-12px_rgba(190,24,93,0.25)]">
                <span className="block text-[0.66rem] font-extrabold tracking-wide text-slate-600 dark:text-slate-300 uppercase">Cấp</span>
                <span className="text-[1.15rem] font-black text-slate-900 dark:text-slate-50 leading-tight">LV {pseudoLevel}</span>
              </div>
            </div>
          </div>
        </Motion.div>

        <Motion.div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(260px,320px)] gap-4 lg:gap-7 items-start" variants={vColumns}>
          <Motion.div className="flex-1 min-w-0" variants={vSlideMain}>
            {loadError ? <div className="text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-lg mb-4 text-sm font-medium">{loadError}</div> : null}
            {loading ? <p className="text-slate-500 italic text-sm mb-4">Đang tải danh sách game…</p> : null}

            <Motion.section className="mb-5" variants={vBlock}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="m-0 text-[1.12rem] font-extrabold inline-flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                  <span aria-hidden><Gamepad /></span> Trò chơi
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="text-[0.78rem] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{ordered.length} games</span>
                  <Link className="text-[0.88rem] font-bold text-rose-700 whitespace-nowrap hover:underline" to={`${ROUTES.PLAY}/leaderboard`}>
                    Xem tất cả →
                  </Link>
                </div>
              </div>
              <Motion.ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-2 p-0 list-none" variants={vPage} initial="hidden" animate="show">
                {ordered.map((g) => (
                  <Motion.li
                    key={g.slug}
                    className={`relative flex flex-col p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-900/10 dark:border-slate-400/20 shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden ${themeClass(g)}`}
                    variants={vCard}
                    whileHover={hoverGame}
                    whileTap={{ scale: 0.985 }}
                  >
                    <div className="absolute top-3 left-3 right-3 flex justify-between z-10 pointer-events-none">
                      <span className="bg-slate-900/60 backdrop-blur-md text-white text-[0.62rem] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">{levelBadge(g)}</span>
                      {g.isPvp ? <span className="bg-indigo-600 text-white text-[0.62rem] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">PvP</span> : null}
                      {g.isBossMode ? (
                        <span className="bg-rose-600 text-white text-[0.62rem] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_12px_rgba(225,29,72,0.6)] border border-white/20">Boss</span>
                      ) : null}
                    </div>
                    <div className="relative h-28 mb-2 flex items-center justify-center">
                      <img className="max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]" src={coverForGame(g)} alt="" />
                    </div>
                    <h3 className="m-0 mb-0.5 text-[1.02rem] font-extrabold text-slate-900 dark:text-slate-100 pr-16">{g.name}</h3>
                    <p className="m-0 mb-1.5 text-[0.72rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">{g.skillType || 'Luyện tập'}</p>
                    <p className="m-0 mb-3 text-[0.82rem] text-slate-600 dark:text-slate-300 flex-1 leading-relaxed">{g.description || '—'}</p>
                    <Link
                      className="block text-center py-2 rounded-xl border border-[#e9b7cf] bg-[#FBDAEB] text-[#d42f7a] font-extrabold text-[0.78rem] tracking-[0.15em] hover:bg-[#f3e4eb] transition-colors dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60"
                      to={g.isPvp ? `${ROUTES.PLAY}/pvp` : `${ROUTES.PLAY}/${g.slug}`}
                    >
                      PLAY NOW
                    </Link>
                  </Motion.li>
                ))}
              </Motion.ul>
            </Motion.section>

            <Motion.section className="mb-5" variants={vBlock}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="m-0 text-[1.12rem] font-extrabold inline-flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                  <span aria-hidden><Gem size={20} /></span> Phần thưởng
                </h2>
              </div>
              <PhdRewardsMarquee pauseOnHover={false} speed={50} className="relative w-full overflow-hidden py-1 rounded-2xl [mask-image:linear-gradient(90deg,transparent_0%,#000_4%,#000_96%,transparent_100%)]">
                {REWARD_CARDS.map((r, i) => {
                  const Icon = r.icon;
                  return (
                    <Motion.div key={r.title} className="w-full px-3 py-3 rounded-2xl border border-slate-900/5 bg-white/85 dark:bg-slate-800/88 dark:border-slate-400/20 backdrop-blur-sm shadow-[0_10px_28px_-18px_rgba(15,23,42,0.2)]" whileHover={hoverReward} whileTap={{ scale: 0.98 }} style={{ width: 'min(152px, 44vw)' }}>
                      <Motion.span
                        className="text-[1.45rem] inline-block mb-1 leading-none"
                        aria-hidden
                        animate={
                          reduceMotion
                            ? undefined
                            : { y: [0, -6, 0], rotate: [0, 4, -4, 0] }
                        }
                        transition={
                          reduceMotion
                            ? undefined
                            : {
                              duration: 2.6 + (i % 4) * 0.2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              delay: i * 0.09,
                            }
                        }
                      >
                        <Icon size={26} color='#be123c' />
                      </Motion.span>
                      <div className="font-extrabold text-[0.82rem] mb-1 text-slate-900 dark:text-slate-100">{r.title}</div>
                      <div className="text-[0.74rem] leading-relaxed font-semibold text-slate-700 dark:text-slate-300">{r.desc}</div>
                    </Motion.div>
                  );
                })}
              </PhdRewardsMarquee>
            </Motion.section>

            <Motion.section className="mt-5 mb-5 py-4 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-900/10 dark:border-slate-400/20 shadow-sm" variants={vBlock} aria-labelledby="dash-powerups-main">
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-900/10 dark:border-slate-400/20">
                <h2 id="dash-powerups-main" className="m-0 text-[1.12rem] font-extrabold inline-flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                  <span aria-hidden><PackageOpen /></span> Vật phẩm (Power-ups)
                </h2>
                <Link className="text-[0.82rem] font-bold text-rose-700 whitespace-nowrap hover:underline flex items-center gap-1" to={`${ROUTES.PLAY}/shop`}>
                  Cửa hàng xu <ArrowRight size={10} />
                </Link>
              </div>
              <p className="m-0 mb-3 text-[0.78rem] text-slate-900 dark:text-slate-100">
                Số lượng từ túi đồ API — dùng trong lúc chơi (phiên game đang mở). Mua thêm bằng xu tại cửa hàng.
              </p>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 m-0 p-0 list-none">
                {POWERUP_ROWS.map((p) => (
                  <Motion.li
                    key={p.slug}
                    className="relative flex flex-col p-3 pt-3.5 items-center text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-900/5 dark:border-slate-400/10"
                    whileHover={{ y: -4, scale: 1.015 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  >
                    <span className="absolute top-2 right-2 bg-rose-700 text-white text-[0.66rem] font-black px-1.5 py-0.5 rounded-[6px] shadow-sm">{formatIntVi(invQty(p.slug))}</span>
                    <img className="w-11 h-11 object-contain mb-2 drop-shadow-sm filter brightness-110" src={p.img} alt="" />
                    <div className="flex-1 flex flex-col items-center">
                      <div className="text-[0.88rem] font-extrabold text-slate-900 dark:text-slate-100 leading-tight mb-1">{p.label}</div>
                      <div className="text-[0.72rem] leading-[1.3] text-slate-500">{p.desc}</div>
                      {p.hint ? <div className="text-[0.68rem] italic text-slate-500 mt-1">{p.hint}</div> : null}
                    </div>
                  </Motion.li>
                ))}
              </ul>
            </Motion.section>

            <details className="mb-3 rounded-2xl border border-slate-900/5 bg-white/80 dark:bg-slate-800/85 dark:border-slate-400/20 px-3 py-1.5 backdrop-blur-sm group">
              <summary className="flex items-center gap-2 cursor-pointer font-extrabold py-2 list-none outline-none group-open:border-b group-open:border-slate-900/5 group-open:mb-2 [&::-webkit-details-marker]:hidden"><Package size={20} className="shrink-0" /> Cách nhận vật phẩm</summary>
              <ul className="pl-6 m-0 mb-2 list-disc space-y-1 text-[0.88rem] text-slate-700 dark:text-slate-300">
                <li>Đăng nhập hàng ngày</li>
                <li>Hoàn thành daily challenge</li>
                <li>Chiến thắng trong PvP</li>
                <li>Mua bằng xu (kiếm từ game)</li>
                <li>Premium: nhận thêm mỗi ngày</li>
              </ul>
            </details>

            <details className="mb-3 rounded-2xl border border-slate-900/5 bg-white/80 dark:bg-slate-800/85 dark:border-slate-400/20 px-3 py-1.5 backdrop-blur-sm group">
              <summary className="flex items-center gap-2 cursor-pointer font-extrabold py-2 list-none outline-none group-open:border-b group-open:border-slate-900/5 group-open:mb-2 [&::-webkit-details-marker]:hidden"><ChartColumn size={20} className="shrink-0" /> Cơ chế điểm số</summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 mb-2">
                <ul className="m-0 p-0 list-none space-y-2">
                  <li className="flex items-start gap-2 text-[0.88rem] leading-[1.4] text-slate-700 dark:text-slate-300"><Check size={20} color='lightgreen' className="shrink-0 mt-0.5" /> <span>Trả lời đúng: +100 điểm cơ bản</span></li>
                  <li className="flex items-start gap-2 text-[0.88rem] leading-[1.4] text-slate-700 dark:text-slate-300"><Flame size={20} fill='orange' color='orange' className="shrink-0 mt-0.5" /> <span>Combo: ×1.2 → ×1.5 → ×2.0</span></li>
                </ul>
                <ul className="m-0 p-0 list-none space-y-2">
                  <li className="flex items-start gap-2 text-[0.88rem] leading-[1.4] text-slate-700 dark:text-slate-300"><Zap size={20} fill='yellow' color='yellow' className="shrink-0 mt-0.5" /> <span>Trả lời nhanh: + điểm thưởng</span></li>
                  <li className="flex items-start gap-2 text-[0.88rem] leading-[1.4] text-slate-700 dark:text-slate-300"><X size={20} color='red' className="shrink-0 mt-0.5" /> <span>Sai: mất 1 mạng, reset combo</span></li>
                </ul>
              </div>
            </details>

            <details className="mb-3 rounded-2xl border border-slate-900/5 bg-white/80 dark:bg-slate-800/85 dark:border-slate-400/20 px-3 py-1.5 backdrop-blur-sm group">
              <summary className="flex items-center gap-2 cursor-pointer font-extrabold py-2 list-none outline-none group-open:border-b group-open:border-slate-900/5 group-open:mb-2 [&::-webkit-details-marker]:hidden"><Trophy size={20} className="shrink-0" /> Top điểm (EXP)</summary>
              <p className="m-0 mb-3 text-[0.78rem] text-slate-900 dark:text-slate-100">Xếp hạng theo điểm tích lũy trên tài khoản.</p>
              {expTopRows.length === 0 ? (
                <p className="text-slate-500 italic text-[0.88rem] mb-2">Chưa có dữ liệu bảng xếp hạng EXP.</p>
              ) : (
                <ol className="m-0 p-0 mb-2 list-none flex flex-col gap-1">
                  {expTopRows.map((r, i) => {
                    const uid = pick(r, 'userId', 'UserId');
                    const name = pick(r, 'displayName', 'DisplayName') || '—';
                    const ex = Number(pick(r, 'exp', 'Exp') ?? 0);
                    const me = user?.id != null && uid != null && String(uid) === String(user.id);
                    const label = pick(r, 'rank', 'Rank') ?? i + 1;
                    return (
                      <li
                        key={String(uid ?? i)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[0.88rem] ${me ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 shadow-sm' : 'bg-slate-50 dark:bg-slate-900/50'}`}
                      >
                        <span className="font-extrabold text-slate-400 dark:text-slate-500 w-6">#{label}</span>
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[0.72rem] text-slate-600 dark:text-slate-400 overflow-hidden dark:border dark:border-slate-700">
                          {r.avatarUrl ? <img src={r.avatarUrl} alt="" className="w-full h-full object-cover" /> : name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="flex-1 font-bold text-slate-700 dark:text-slate-200 truncate">
                          {name}
                          {me ? <span className="font-semibold text-indigo-600 dark:text-indigo-400"> (bạn)</span> : null}
                        </span>
                        <span className="font-black text-slate-900 dark:text-slate-50 tabular-nums">{formatIntVi(ex)} XP</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </details>

          </Motion.div>

          <Motion.aside className="flex flex-col gap-4 lg:sticky lg:top-3" variants={vAsideCol}>
            <Motion.div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.06)] border border-slate-200 dark:border-slate-700" variants={vAsideItem} whileHover={hoverAsidePanel}>
              <div className="relative flex items-center justify-center w-[3.2rem] h-[3.2rem] rounded-full bg-slate-900 text-white shrink-0 shadow-md">
                <span className="font-black text-[1.2rem] leading-none">{pseudoLevel}</span>
                <span className="absolute -bottom-1.5 bg-rose-700 text-[0.55rem] px-1.5 py-0.5 rounded uppercase font-black tracking-widest shadow-sm">LV</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[1rem] truncate text-slate-900 dark:text-slate-100">{displayName}</div>
                <div className="text-[0.7rem] uppercase tracking-wide text-rose-700 font-bold truncate">Kanji Hunter • Speed Demon</div>
              </div>
            </Motion.div>
            <Motion.div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.06)] border border-slate-200 dark:border-slate-700" variants={vAsideItem} whileHover={hoverAsidePanel}>
              <div className="flex justify-between items-end mb-1 text-[0.82rem] text-slate-900 dark:text-slate-100 font-extrabold">
                <span>EXP</span>
                <span>
                  {expUi.line} <small className="font-semibold text-slate-500">{expUi.sub}</small>
                </span>
              </div>
              <div
                className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={expUi.pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="h-full bg-gradient-to-r from-violet-600 to-pink-600 transition-all duration-500" style={{ width: `${expUi.pct}%` }} />
              </div>
            </Motion.div>
            <Motion.div className="grid grid-cols-3 gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.06)] border border-slate-200 dark:border-slate-700 text-center" variants={vAsideItem} whileHover={hoverAsidePanel}>
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="text-[1.1rem] font-black text-amber-600 leading-none mb-1">{formatIntVi(xu)}</div>
                <div className="text-[0.66rem] font-bold text-slate-500 uppercase tracking-wider">Xu</div>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="text-[1.1rem] font-black text-slate-900 dark:text-slate-50 leading-none mb-1">{formatIntVi(streakDays)}</div>
                <div className="text-[0.66rem] font-bold text-slate-500 uppercase tracking-wider">Streak</div>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 relative">
                <div className="text-[1.1rem] font-black text-rose-700 leading-none mb-1">
                  {myLbRank > 0 ? `#${myLbRank}` : lbRows.length > 0 ? '…' : '—'}
                </div>
                <div className="text-[0.66rem] font-bold text-slate-500 uppercase tracking-wider">{rankCellLabel(lbBoardKind)}</div>
                {myLbRank === 0 && lbRows.length > 0 ? (
                  <div className="absolute -bottom-3 w-[120%] text-center text-[0.58rem] font-bold text-slate-400 mt-0.5 leading-tight">Ngoài top hiển thị</div>
                ) : null}
              </div>
            </Motion.div>

            <Motion.div
              className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.06)] border border-slate-200 dark:border-slate-700"
              variants={vAsideItem}
              whileHover={hoverAsidePanel}
            >
              <h2 className="m-0 mb-3 text-[1.12rem] font-extrabold inline-flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                <span aria-hidden><PackageOpen /></span> Vật phẩm
              </h2>
              <ul className="flex flex-col gap-2 m-0 p-0 list-none">
                {POWERUP_ROWS.map((p) => (
                  <li key={p.slug} className="flex items-center justify-between gap-2 text-[0.86rem] px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <img className="w-9 h-9 object-contain rounded-lg bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)] dark:bg-white/10 shrink-0 filter brightness-110" src={p.img} alt="" width={36} height={36} />
                      <span className="font-extrabold text-slate-700 dark:text-slate-200 overflow-hidden text-ellipsis whitespace-nowrap">{p.label}</span>
                    </span>
                    <span className="font-black text-rose-700 shrink-0 tabular-nums">×{formatIntVi(invQty(p.slug))}</span>
                  </li>
                ))}
              </ul>
              <Link className="block w-full mt-3 px-3 py-2.5 rounded-xl border-none cursor-pointer font-extrabold text-[0.88rem] text-white text-center no-underline bg-gradient-to-br from-rose-700 to-rose-500 shadow-[0_10px_24px_-10px_rgba(190,24,93,0.55)] transition-all hover:brightness-105" to={`${ROUTES.PLAY}/shop`}>
                VÀO CỬA HÀNG
              </Link>
            </Motion.div>

            <Motion.div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.06)] border border-slate-200 dark:border-slate-700" variants={vAsideItem} whileHover={hoverAsidePanel}>
              <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-900/10 dark:border-slate-400/20">
                <h3 className="m-0 text-[1.05rem] font-extrabold inline-flex items-center gap-1.5 text-slate-900 dark:text-slate-100"><Trophy size={20} /> {leaderboardHeading(lbBoardKind)}</h3>
                <Link to={`${ROUTES.PLAY}/leaderboard`} className="text-[0.82rem] font-bold text-rose-700 whitespace-nowrap hover:underline">
                  Xem tất cả →
                </Link>
              </div>
              <p className="m-0 mb-3 text-[0.82rem] text-slate-500 italic flex items-center justify-end">
                <Link to={`${ROUTES.PLAY}/shop`} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex items-center gap-1"><ShoppingBag size={16} /> Cửa hàng xu</Link>
              </p>
              {lbRows.length === 0 ? (
                <p className="text-slate-500 italic text-[0.88rem]">
                  Chưa có dữ liệu xếp hạng. Chơi game có ghi điểm (quiz / Kanji Memory) hoặc F5 sau khi backend cập nhật
                  BXH.
                </p>
              ) : (
                <ol className="m-0 p-0 list-none flex flex-col gap-1.5">
                  {lbRows.map((r, i) => {
                    const name = pick(r, 'displayName', 'DisplayName') || '—';
                    const rawScore = pick(r, 'score', 'Score') ?? pick(r, 'exp', 'Exp');
                    const score = Number(rawScore) || 0;
                    const uid = pick(r, 'userId', 'UserId');
                    const jlpt = pick(r, 'levelCode', 'LevelCode');
                    const me = user?.id != null && uid != null && String(uid) === String(user.id);
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                    const scoreSuffix = lbBoardKind === 'exp' ? ' XP' : '';
                    return (
                      <Motion.li
                        key={String(uid ?? `${name}-${i}`)}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[0.86rem] ${me ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 shadow-sm' : 'bg-transparent'}`}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ x: -2 }}
                      >
                        <span className="w-6 font-bold text-slate-400 dark:text-slate-500">{medal}</span>
                        <span className="flex-1 font-bold text-slate-700 dark:text-slate-200 truncate">
                          {name}
                          {jlpt ? <span className="text-[0.66rem] uppercase tracking-wide text-slate-400 font-bold ml-1"> · {jlpt}</span> : null}
                        </span>
                        <span className="font-black text-rose-700 dark:text-rose-400 tabular-nums">
                          {formatIntVi(score)}
                          {scoreSuffix}
                        </span>
                      </Motion.li>
                    );
                  })}
                </ol>
              )}
            </Motion.div>
          </Motion.aside>
        </Motion.div>

      </Motion.div>
    </div>
  );
}
