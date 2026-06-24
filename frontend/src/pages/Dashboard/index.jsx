import { useMemo, useEffect, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../data/routes';
import { fetchMyProgressSummary } from '../../services/learningProgressService';
import { authService } from '../../services/authService';
import { ChatbotWidget } from '../../components/support/ChatbotWidget';
import { userIsPremium } from '../../utils/userPremium';
import { SakuraRainLayer } from '../../components/effects/SakuraRainLayer';
import { Play, Gamepad2, ChartColumn, Trophy, Sparkles } from 'lucide-react';
import AnimatedProgressBar from '../../components/motion/AnimatedProgressBar';
import ShimmerSkeleton from '../../components/motion/ShimmerSkeleton';
import { learnCardHover } from '../../utils/learnMotion';
import { getRecommendedLevel } from '../../utils/onboardingFlow';
import { DASH_ACTION_IMAGES, LEARN_VISUAL } from '../../data/learnVisualAssets';
import { Vi } from '../../components/ui/Vi';

const Motion = motion;

const dashRoot = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const dashItem = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 30 } },
};

const dashCol = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 32, staggerChildren: 0.06 },
  },
};

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

const RANK_TIERS = [
  { label: 'Bronze', minExp: 0 },
  { label: 'Silver', minExp: 5000 },
  { label: 'Gold', minExp: 15000 },
  { label: 'Platinum', minExp: 30000 },
];

function formatIntVi(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0';
  const v = Math.round(Math.abs(x));
  const signed = x < 0 ? '-' : '';
  const s = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return signed + s;
}

function rankProgressFromExp(exp) {
  const e = Math.max(0, Number(exp) || 0);
  let idx = 0;
  for (let i = RANK_TIERS.length - 1; i >= 0; i -= 1) {
    if (e >= RANK_TIERS[i].minExp) {
      idx = i;
      break;
    }
  }
  const cur = RANK_TIERS[idx];
  const next = RANK_TIERS[idx + 1];
  if (!next) {
    return { currentLabel: cur.label, barPct: 100 };
  }
  const span = next.minExp - cur.minExp;
  const inTier = Math.min(100, Math.max(0, Math.round(((e - cur.minExp) / span) * 100)));
  return { currentLabel: cur.label, barPct: inTier };
}

function ShortcutCard({ to, image, title, subtitle, icon }) {
  return (
    <Link to={to} className="yume-hub-shortcut">
      <span className="yume-hub-shortcut__icon">{icon}</span>
      <span className="yume-hub-shortcut__text">
        <strong><Vi ja={title.startsWith('Học') ? `学習 ${title.replace('Học ', '')}` : undefined}>{title}</Vi></strong>
        <small><Vi>{subtitle}</Vi></small>
      </span>
      <span className="yume-hub-shortcut__thumb">
        <img src={image} alt="" loading="lazy" />
      </span>
    </Link>
  );
}

function learnRouteForJlpt(code) {
  const c = String(code || 'N5').trim().toUpperCase();
  return `${ROUTES.LEARN}?jlpt=${encodeURIComponent(c)}`;
}

function JlptPathRow({ code, name, pct, done, total, image }) {
  const jlpt = String(code || '').trim().toUpperCase();
  return (
    <Link to={learnRouteForJlpt(jlpt)} className="yume-hub-jlpt-row yume-hub-jlpt-row--link">
      <div className="yume-hub-jlpt-row__thumb">
        <img src={image} alt="" loading="lazy" />
      </div>
      <div className="yume-hub-jlpt-row__body">
        <div className="yume-hub-jlpt-row__head">
          <span className="yume-hub-jlpt-row__code">{code}</span>
          <strong>{name}</strong>
          <span className="yume-hub-jlpt-row__pct">{pct}%</span>
        </div>
        <AnimatedProgressBar
          percent={pct}
          className="yume-hub-jlpt-row__bar"
          fillClassName="yume-hub-jlpt-row__bar-fill"
          aria-label={`Tiến độ ${code}`}
        />
        <p className="yume-hub-jlpt-row__meta">
          {done}/{total} bài hoàn thành
        </p>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const reduceMotion = useReducedMotion();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const data = await fetchMyProgressSummary();
      setSummary(data);
    } catch {
      setSummaryError('Không tải được thống kê học tập. Thử tải lại trang.');
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = String(user?.role ?? user?.Role ?? authService.getRoleFromStoredToken() ?? 'user').toLowerCase();
    if (role === 'admin') navigate(ROUTES.ADMIN, { replace: true });
    else if (role === 'moderator') navigate(ROUTES.MODERATOR, { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const userIdStable = user?.id ?? user?.userId ?? user?.Id;
  useEffect(() => {
    if (userIdStable == null) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const profile = await authService.getMyProfile();
        if (cancelled || !profile) return;
        const prem = profile.isPremium ?? profile.IsPremium;
        if (prem === undefined) return;
        setUser((prev) => {
          if (!prev) return prev;
          const nextPrem = !!prem;
          const cur = !!(prev.isPremium ?? prev.IsPremium);
          if (cur === nextPrem) return prev;
          const next = { ...prev, isPremium: nextPrem, IsPremium: nextPrem };
          authService.setStoredUser(next);
          return next;
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userIdStable, setUser]);

  const displayName = useMemo(
    () => user?.displayName || user?.username || user?.name || user?.email?.split('@')[0] || 'bạn',
    [user],
  );

  const isPremium = useMemo(() => userIsPremium(user), [user]);

  let levelCode = getRecommendedLevel() || user?.levelCode || user?.level || null;
  const rawLevelId = user?.levelId ?? user?.LevelId ?? null;
  if (!levelCode && rawLevelId != null) {
    const idNum = Number(rawLevelId);
    if (idNum === 1) levelCode = 'N5';
    else if (idNum === 2) levelCode = 'N4';
    else if (idNum === 3) levelCode = 'N3';
  }
  levelCode = (levelCode || 'N4').toUpperCase();

  const exp = pick(summary, 'exp', 'Exp') ?? 0;
  const streakDays = pick(summary, 'streakDays', 'StreakDays') ?? 0;
  const byLevel = pick(summary, 'byLevel', 'ByLevel') ?? [];
  const rankInfo = rankProgressFromExp(exp);
  const completedLessons = Array.isArray(byLevel)
    ? byLevel.reduce((s, row) => s + (pick(row, 'completedLessons', 'CompletedLessons') ?? 0), 0)
    : 0;

  const levelRows = Array.isArray(byLevel)
    ? byLevel.filter((row) => (pick(row, 'totalPublishedLessons', 'TotalPublishedLessons') ?? 0) > 0)
    : [];

  const levelNumber = Math.max(1, Math.round(Number(exp || 0) / 65));
  const dailyGoalPct = Math.min(100, Math.max(8, rankInfo.barPct));
  const xpToNext = Math.max(0, 5000 - (Number(exp || 0) % 5000));
  const topRows = levelRows.slice(0, 2);

  const learnHome = learnRouteForJlpt(levelCode);

  const quickActions = [
    {
      key: 'learn',
      title: `Học ${levelCode}`,
      sub: 'Bài mới & ôn tập',
      to: learnHome,
      icon: <Play size={18} />,
      image: DASH_ACTION_IMAGES.learn,
    },
    {
      key: 'play',
      title: 'Chơi game',
      sub: 'Ôn qua mini-game',
      to: ROUTES.PLAY,
      icon: <Gamepad2 size={18} />,
      image: DASH_ACTION_IMAGES.play,
    },
    {
      key: 'rank',
      title: 'Xếp hạng',
      sub: 'Bảng tuần',
      to: `${ROUTES.PLAY}/leaderboard`,
      icon: <ChartColumn size={18} />,
      image: DASH_ACTION_IMAGES.leaderboard,
    },
    {
      key: 'badge',
      title: 'Thành tích',
      sub: 'Huy hiệu & XP',
      to: `${ROUTES.PLAY}/achievements`,
      icon: <Trophy size={18} />,
      image: DASH_ACTION_IMAGES.achievements,
    },
  ];

  return (
    <div className="yume-dashboard yume-dashboard--hub">
      <SakuraRainLayer petalCount={14} />
      <Motion.div
        className="yume-dashboard__motion-root yume-hub-shell"
        variants={dashRoot}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <Motion.section className="yume-hub-hero" variants={dashItem}>
          <div className="yume-hub-hero__panel">
            <div className="yume-hub-hero__tags">
              {isPremium ? <span className="yume-hub-tag yume-hub-tag--gold">Premium</span> : null}
              <span className="yume-hub-tag">Hạng {rankInfo.currentLabel}</span>
              <span className="yume-hub-tag yume-hub-tag--accent">{levelCode}</span>
            </div>
            <h1 className="yume-hub-hero__title">
              Chào <em>{displayName}</em>
            </h1>
            <p className="yume-hub-hero__lead">
              Ôn từ vựng, luyện kanji và chat cùng cộng đồng — mỗi ngày một chút là đủ.
            </p>
            <div className="yume-hub-hero__cta">
              <Link to={learnHome} className="yume-hub-btn yume-hub-btn--primary">
                <Sparkles size={17} />
                <Vi>Học tiếp</Vi>
              </Link>
              <Link to={ROUTES.PLAY} className="yume-hub-btn yume-hub-btn--ghost">
                <Vi>Chơi ôn</Vi>
              </Link>
            </div>
          </div>
          <div className="yume-hub-hero__visual" aria-hidden>
            <img src={LEARN_VISUAL.hero} alt="" loading="eager" />
          </div>
          <dl className="yume-hub-kpis">
            <div>
              <dt><Vi>Cấp</Vi></dt>
              <dd>{levelNumber}</dd>
            </div>
            <div>
              <dt><Vi>Chuỗi</Vi></dt>
              <dd>{summaryLoading ? '…' : `${formatIntVi(streakDays)} ngày`}</dd>
            </div>
            <div>
              <dt>XP</dt>
              <dd>{summaryLoading ? '…' : formatIntVi(exp)}</dd>
            </div>
            <div>
              <dt><Vi>Bài xong</Vi></dt>
              <dd>{summaryLoading ? '…' : formatIntVi(completedLessons)}</dd>
            </div>
          </dl>
        </Motion.section>

        {summaryError ? (
          <Motion.p className="yume-dashboard__banner-error" role="alert" variants={dashItem}>
            {summaryError}
          </Motion.p>
        ) : null}

        <Motion.nav className="yume-hub-shortcuts" aria-label="Lối tắt" variants={dashItem}>
          {quickActions.map((a) => (
            <Motion.div key={a.key} variants={learnCardHover} initial="rest" whileHover="hover" whileTap="tap">
              <ShortcutCard to={a.to} image={a.image} title={a.title} subtitle={a.sub} icon={a.icon} />
            </Motion.div>
          ))}
        </Motion.nav>

        <div className="yume-hub-body">
        <Motion.section
          className="yume-hub-card yume-hub-card--path"
          variants={dashItem}
          initial={reduceMotion ? false : 'hidden'}
          animate="show"
        >
          <header className="yume-hub-card__head">
            <h2><Vi>Lộ trình JLPT</Vi></h2>
            <Link to={learnHome}><Vi ja="すべて見る →">Xem tất cả →</Vi></Link>
          </header>
            {summaryLoading ? (
              <ShimmerSkeleton lines={2} className="yume-shimmer--jlpt" />
            ) : topRows.length === 0 ? (
              <p className="yume-hub-empty">Bắt đầu từ bài N5 đầu tiên trong mục Học tập.</p>
            ) : (
              <div className="yume-hub-jlpt-list">
                {topRows.map((row, idx) => {
                  const code = pick(row, 'levelCode', 'LevelCode') ?? '';
                  const name = pick(row, 'levelName', 'LevelName') ?? code;
                  const pct = Math.round(Number(pick(row, 'completionPercent', 'CompletionPercent')) || 0);
                  const done = pick(row, 'completedLessons', 'CompletedLessons') ?? 0;
                  const total = pick(row, 'totalPublishedLessons', 'TotalPublishedLessons') ?? 0;
                  const cover = idx === 0 ? LEARN_VISUAL.sakura : LEARN_VISUAL.study;
                  return (
                    <JlptPathRow
                      key={String(pick(row, 'levelId', 'LevelId') ?? idx)}
                      code={code}
                      name={name}
                      pct={pct}
                      done={done}
                      total={total}
                      image={cover}
                    />
                  );
                })}
              </div>
            )}
            {levelCode === 'N5' ? (
              <Link to="/level-up-test/N4" className="yume-hub-link-more">
                <Vi ja="N4昇格試験 →">Thi lên N4 →</Vi>
              </Link>
            ) : null}
            {levelCode === 'N4' ? (
              <Link to="/level-up-test/N3" className="yume-hub-link-more">
                <Vi ja="N3昇格試験 →">Thi lên N3 →</Vi>
              </Link>
            ) : null}
          </Motion.section>

          <Motion.aside
            className="yume-hub-aside"
            variants={dashCol}
            initial={reduceMotion ? false : 'hidden'}
            animate="show"
          >
            <section className="yume-hub-card yume-hub-card--goal">
              <div className="yume-hub-goal__banner">
                <img src={LEARN_VISUAL.heroAlt} alt="" loading="lazy" />
                <div className="yume-hub-goal__overlay">
                  <span className="yume-hub-goal__badge">{dailyGoalPct}%</span>
                  <p><Vi>Mục tiêu hôm nay</Vi></p>
                </div>
              </div>
              <div className="yume-hub-goal__body">
                <p>Còn khoảng {formatIntVi(xpToNext)} XP đến mốc hạng tiếp theo.</p>
                <Link to={learnHome} className="yume-hub-btn yume-hub-btn--primary yume-hub-btn--block">
                  <Vi>Học ngay</Vi>
                </Link>
              </div>
            </section>

            {!isPremium ? (
              <Link className="yume-hub-upgrade" to={ROUTES.UPGRADE}>
                <Vi>Nâng cấp Premium</Vi> →
              </Link>
            ) : null}
          </Motion.aside>
        </div>
      </Motion.div>

      <ChatbotWidget />
    </div>
  );
}
