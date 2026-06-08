import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { PlayGameSetupPro } from '../../components/play/PlayGameSetupPro';
import { playSetupChildVariants, playSetupParentVariants } from '../../components/play/playSetupMotion';
import SpeakJaButton from '../../components/learn/SpeakJaButton';
import { ROUTES } from '../../data/routes';
import { N5_LESSONS } from '../../data/n5BeginnerCourse';
import { completeKanjiMemoryRewards } from '../../services/gameService';
import { PlayKurenaiSummary } from './PlayKurenaiSummary';
import {
  extractKanjiMemoryPairsFromN5Lessons,
  pickRandomPairs,
} from '../../utils/kanjiMemoryFromLessons';
import { BookType, Settings, Star } from 'lucide-react';

const Motion = motion;

const DEFAULT_PAIR_TARGET = 8;
const MIN_PAIRS = 4;
const YUME_PLAY_EXP_REFRESH = 'yume-play-exp-refresh';
/** Số cánh hoa rơi (CSS animation) — tắt khi reduce motion */
const SAKURA_PETAL_COUNT = 18;

function formatMmSs(totalSec) {
  const s = Math.max(0, Math.floor(Number(totalSec) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function pickReward(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCardsFromPairs(pairs) {
  const raw = [];
  pairs.forEach((p, idx) => {
    const pairId = idx;
    raw.push({
      id: `k-${pairId}`,
      pairId,
      kind: 'kanji',
      text: p.kanji,
      flipped: false,
      matched: false,
    });
    raw.push({
      id: `m-${pairId}`,
      pairId,
      kind: 'meaning',
      text: p.meaning,
      flipped: false,
      matched: false,
    });
  });
  return shuffle(raw);
}

export default function KanjiMemoryGame() {
  const reduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const lessonParam = searchParams.get('lesson') || '';

  const [phase, setPhase] = useState('setup');
  const [pairTarget, setPairTarget] = useState(DEFAULT_PAIR_TARGET);
  const [selectedLesson, setSelectedLesson] = useState(lessonParam);
  const [cards, setCards] = useState([]);
  const [pairsMeta, setPairsMeta] = useState([]);
  const [turns, setTurns] = useState(0);
  const [apiReward, setApiReward] = useState(null);
  const [apiRewardErr, setApiRewardErr] = useState('');
  const [apiRewardLoading, setApiRewardLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const lockRef = useRef(false);
  const flipBackTimerRef = useRef(null);
  const turnsRef = useRef(0);
  const rewardClaimRef = useRef(false);

  useEffect(() => {
    setSelectedLesson(lessonParam);
  }, [lessonParam]);

  const poolAll = useMemo(() => extractKanjiMemoryPairsFromN5Lessons(null), []);
  const poolLesson = useMemo(
    () => (selectedLesson ? extractKanjiMemoryPairsFromN5Lessons(selectedLesson) : []),
    [selectedLesson],
  );

  const activePool = selectedLesson ? poolLesson : poolAll;
  const maxPairsAvailable = activePool.length;

  const lessonOptions = useMemo(() => {
    return N5_LESSONS.map((l) => {
      const count = extractKanjiMemoryPairsFromN5Lessons(l.slug).length;
      return {
        slug: l.slug,
        label: `${l.navTitle || l.slug} (${l.sectionLabel || l.section})`,
        count,
      };
    }).filter((o) => o.count >= MIN_PAIRS);
  }, []);

  const startGame = useCallback(() => {
    if (flipBackTimerRef.current) {
      clearTimeout(flipBackTimerRef.current);
      flipBackTimerRef.current = null;
    }
    const cap = Math.min(DEFAULT_PAIR_TARGET, maxPairsAvailable);
    const want = Math.min(pairTarget, cap);
    const n = Math.max(MIN_PAIRS, want);
    const picked = pickRandomPairs(activePool, n);
    setPairsMeta(picked);
    setCards(buildCardsFromPairs(picked));
    turnsRef.current = 0;
    setTurns(0);
    lockRef.current = false;
    setPhase('playing');
    if (selectedLesson) setSearchParams({ lesson: selectedLesson }, { replace: true });
    else setSearchParams({}, { replace: true });
  }, [activePool, maxPairsAvailable, pairTarget, selectedLesson, setSearchParams]);

  const totalPairs = pairsMeta.length;

  const matchedPairsCount = useMemo(() => {
    const matched = cards.filter((c) => c.matched);
    if (matched.length < 2) return 0;
    const byPair = new Map();
    matched.forEach((c) => {
      byPair.set(c.pairId, (byPair.get(c.pairId) || 0) + 1);
    });
    let n = 0;
    byPair.forEach((cnt) => {
      if (cnt >= 2) n += 1;
    });
    return n;
  }, [cards]);

  useEffect(() => {
    return () => {
      if (flipBackTimerRef.current) clearTimeout(flipBackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    setElapsedSec(0);
    const id = window.setInterval(() => {
      setElapsedSec((t) => t + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, pairsMeta]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (totalPairs > 0 && matchedPairsCount >= totalPairs) setPhase('won');
  }, [matchedPairsCount, phase, totalPairs]);

  useEffect(() => {
    if (phase !== 'won') {
      if (phase === 'setup' || phase === 'playing') {
        rewardClaimRef.current = false;
        setApiReward(null);
        setApiRewardErr('');
        setApiRewardLoading(false);
      }
      return;
    }
    if (totalPairs < MIN_PAIRS) return;
    if (rewardClaimRef.current) return;
    rewardClaimRef.current = true;
    setApiRewardLoading(true);
    setApiRewardErr('');
    (async () => {
      try {
        const data = await completeKanjiMemoryRewards({
          totalPairs,
          matchedPairs: totalPairs,
        });
        setApiReward(data);
        window.dispatchEvent(new Event(YUME_PLAY_EXP_REFRESH));
      } catch (e) {
        rewardClaimRef.current = false;
        const msg =
          e?.response?.data?.message ??
          e?.response?.data?.Message ??
          (typeof e?.message === 'string' ? e.message : '');
        setApiRewardErr(
          msg || 'Không ghi nhận phần thưởng — kiểm tra đăng nhập hoặc API.',
        );
      } finally {
        setApiRewardLoading(false);
      }
    })();
  }, [phase, totalPairs]);

  const openUnmatched = useMemo(() => cards.filter((c) => c.flipped && !c.matched), [cards]);
  const openCount = openUnmatched.length;

  const onCardClick = useCallback(
    (cardId) => {
      if (phase !== 'playing' || lockRef.current) return;

      setCards((prev) => {
        const card = prev.find((c) => c.id === cardId);
        if (!card || card.matched || card.flipped) return prev;
        const open = prev.filter((c) => c.flipped && !c.matched);
        if (open.length >= 2) return prev;

        const next = prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c));
        const open2 = next.filter((c) => c.flipped && !c.matched);

        if (open2.length === 1) return next;

        if (open2.length === 2) {
          const [c1, c2] = open2;
          const isMatch = c1.pairId === c2.pairId && c1.kind !== c2.kind;
          lockRef.current = true;
          turnsRef.current += 1;
          setTurns(turnsRef.current);

          if (isMatch) {
            lockRef.current = false;
            return next.map((c) => (c.pairId === c1.pairId ? { ...c, matched: true, flipped: true } : c));
          }

          if (flipBackTimerRef.current) clearTimeout(flipBackTimerRef.current);
          flipBackTimerRef.current = setTimeout(() => {
            setCards((p) => p.map((c) => (c.flipped && !c.matched ? { ...c, flipped: false } : c)));
            lockRef.current = false;
          }, 700);
          return next;
        }

        return next;
      });
    },
    [phase],
  );

  const selectPairValue = Math.min(
    pairTarget,
    Math.max(MIN_PAIRS, maxPairsAvailable || MIN_PAIRS),
    DEFAULT_PAIR_TARGET,
  );

  if (phase === 'setup') {
    const parentV = playSetupParentVariants(!!reduceMotion);
    const childV = playSetupChildVariants(!!reduceMotion);
    return (
      <PlayGameSetupPro>
        <Motion.div
          className="relative z-10 w-full max-w-5xl mx-auto px-4 md:px-6"
          variants={parentV}
          initial={reduceMotion ? false : 'hidden'}
          animate="show"
        >
          <Motion.header variants={childV} className="mb-4">
            <Link className="inline-block text-[0.88rem] font-bold text-rose-700 hover:underline mb-2" to={ROUTES.PLAY}>
              ← Trò chơi
            </Link>
            <h1 className="m-0 text-[clamp(1.45rem,4vw,1.85rem)] font-black tracking-tight leading-tight text-slate-900 dark:text-slate-100">
              <span className="font-extrabold">Kanji </span>
              <span className="text-rose-700">Memory</span>
            </h1>
          </Motion.header>

          <Motion.div variants={childV} className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-4 lg:gap-5 items-start mb-4">
            <section className="rounded-2xl p-4 lg:p-5 border border-slate-900/5 bg-white/72 dark:bg-slate-900/60 dark:border-slate-400/10 backdrop-blur-md">
              <p className="m-0 mb-3 text-[0.88rem] leading-relaxed text-slate-600 dark:text-slate-300">
                Lật thẻ và ghép <strong>Kanji / từ</strong> với <strong>nghĩa tiếng Việt</strong> từ khóa N5 trong app —
                luyện trí nhớ và nhận diện chữ.
              </p>
              <ul className="m-0 p-0 list-none flex flex-col gap-3">
                <li className="flex gap-3 items-start">
                  <span className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[1.1rem] bg-rose-200/55 border border-rose-700/10 text-rose-700" aria-hidden>
                    <BookType />
                  </span>
                  <div>
                    <div className="font-extrabold text-[0.82rem] text-slate-900 dark:text-slate-100 mb-0.5">Ghép cặp Kanji — nghĩa</div>
                    <div className="text-[0.78rem] leading-relaxed text-slate-500 dark:text-slate-400">
                      Mỗi cặp gồm 2 thẻ; mở đúng hai thẻ cùng cặp để ghi điểm.
                    </div>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[1.1rem] bg-rose-200/55 border border-rose-700/10 text-rose-700" aria-hidden>
                    <Star />
                  </span>
                  <div>
                    <div className="font-extrabold text-[0.82rem] text-slate-900 dark:text-slate-100 mb-0.5">EXP sau phiên</div>
                    <div className="text-[0.78rem] leading-relaxed text-slate-500 dark:text-slate-400">
                      Hoàn thành vòng để ghi nhận phần thưởng lên server (cần đăng nhập).
                    </div>
                  </div>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl p-4 lg:p-5 border border-slate-900/5 bg-white/72 dark:bg-slate-900/60 dark:border-slate-400/10 backdrop-blur-md">
              <div className="flex items-center gap-2 font-extrabold text-[0.88rem] mb-3 text-slate-900 dark:text-slate-100">
                <span className="text-[1rem] opacity-85 text-slate-700 dark:text-slate-300" aria-hidden>
                  <Settings />
                </span>
                Cấu hình lượt chơi
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-1.5 mb-2.5">
                  <span className="font-bold text-[0.78rem] text-slate-500 dark:text-slate-400">Nguồn từ vựng</span>
                  <select className="rounded-full px-3.5 py-2 border border-slate-900/10 bg-white font-semibold text-[0.9rem] text-slate-700 dark:bg-slate-800 dark:border-slate-400/20 dark:text-slate-100" value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)}>
                    <option value="">Toàn bộ bài N5 (gom tất cả)</option>
                    {lessonOptions.map((o) => (
                      <option key={o.slug} value={o.slug}>
                        {o.label} — {o.count} cặp
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-bold text-[0.78rem] text-slate-500 dark:text-slate-400">
                    Số cặp (tối đa {Math.min(DEFAULT_PAIR_TARGET, Math.max(maxPairsAvailable, MIN_PAIRS))})
                  </span>
                  <select
                    className="rounded-full px-3.5 py-2 border border-slate-900/10 bg-white font-semibold text-[0.9rem] text-slate-700 dark:bg-slate-800 dark:border-slate-400/20 dark:text-slate-100"
                    value={selectPairValue}
                    onChange={(e) => setPairTarget(Number(e.target.value))}
                    disabled={maxPairsAvailable < MIN_PAIRS}
                  >
                    {Array.from(
                      { length: Math.max(0, Math.min(maxPairsAvailable, DEFAULT_PAIR_TARGET) - MIN_PAIRS + 1) },
                      (_, i) => MIN_PAIRS + i,
                    ).map((n) => (
                      <option key={n} value={n}>
                        {n} cặp ({n * 2} thẻ)
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
          </Motion.div>

          <Motion.p variants={childV} className="m-0 mb-3 text-[0.88rem] text-slate-600 dark:text-slate-300">
            Đang có <strong>{poolAll.length}</strong> cặp unique trong toàn khóa; bài chọn: <strong>{maxPairsAvailable}</strong>{' '}
            cặp.
          </Motion.p>

          {maxPairsAvailable < MIN_PAIRS ? (
            <Motion.p variants={childV} className="m-0 mb-4 text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-lg text-sm font-medium">
              Chưa đủ cặp Kanji trong bài đã chọn (cần ít nhất {MIN_PAIRS}). Thử &quot;Toàn bộ bài N5&quot;.
            </Motion.p>
          ) : (
            <Motion.div variants={childV}>
              <Motion.button
                type="button"
                className="flex items-center justify-center gap-1.5 w-full max-w-3xl mx-auto mb-4 px-5 py-3 rounded-2xl font-black text-[1rem] text-white bg-gradient-to-br from-rose-700 to-rose-600 shadow-[0_12px_28px_rgba(190,18,60,0.28)] transition-all hover:brightness-105 border-none cursor-pointer"
                onClick={startGame}
                whileHover={reduceMotion ? undefined : { scale: 1.02, y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              >
                Bắt đầu <span aria-hidden>▶</span>
              </Motion.button>
            </Motion.div>
          )}

          <Motion.section variants={childV} className="relative rounded-2xl overflow-hidden min-h-[clamp(11rem,32vw,20rem)] border border-slate-900/5 bg-rose-50 dark:bg-slate-900" aria-label="Cảm hứng học tập">
            <div className="absolute inset-0 bg-transparent bg-[url('../../assets/images/zen-bg.jpg')] bg-cover bg-center bg-no-repeat opacity-40 mix-blend-multiply dark:mix-blend-screen dark:opacity-20 pointer-events-none" style={{ backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.22) 100%), var(--play-setup-zen-bg, none)` }} />
            <p className="relative z-10 m-0 px-4 pt-5 pb-4 max-w-sm font-extrabold text-[0.95rem] text-slate-900 dark:text-slate-100 drop-shadow-sm dark:drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">Cảm hứng học tập từ thiên nhiên</p>
          </Motion.section>
        </Motion.div>
      </PlayGameSetupPro>
    );
  }

  if (phase === 'won') {
    const finalScoreRaw = pickReward(apiReward, 'finalScore', 'FinalScore');
    const finalScore = finalScoreRaw != null && Number.isFinite(Number(finalScoreRaw)) ? Number(finalScoreRaw) : null;
    const expRw = pickReward(apiReward, 'expEarned', 'ExpEarned');
    const xuRw = pickReward(apiReward, 'xuEarned', 'XuEarned');
    const expNum = expRw != null && Number.isFinite(Number(expRw)) ? Number(expRw) : null;
    const xuNum = xuRw != null && Number.isFinite(Number(xuRw)) ? Number(xuRw) : null;
    const perfectGuess = totalPairs > 0 && turns <= totalPairs * 2;

    return (
      <PlayKurenaiSummary
        navBack={{ to: ROUTES.PLAY, label: '← Quay lại trò chơi' }}
        kicker="Bài tập hoàn tất"
        headline="Hoàn thành Kanji Memory!"
        subline={`Đã ghép đúng ${totalPairs} cặp sau ${turns} lượt mở thẻ.`}
        ring={{ value: finalScore ?? 0, max: 100, centerLabel: 'ĐIỂM' }}
        showPerfect={perfectGuess}
        exp={expNum}
        xu={xuNum}
        alwaysShowRewardStrip={apiRewardLoading || Boolean(apiReward)}
        rewardsLoading={apiRewardLoading}
        statsLine={null}
        links={null}
        onPlayAgain={startGame}
        secondaryTo={ROUTES.LEARN}
        secondaryLabel="Về phần học"
      >
        {apiRewardErr ? <p className="play-kurenai-summary__alert">{apiRewardErr}</p> : null}
      </PlayKurenaiSummary>
    );
  }

  const cols = 4;

  const playShellMotion = reduceMotion
    ? false
    : { opacity: 0, y: 18, scale: 0.985 };
  const playShellAnimate = reduceMotion ? false : { opacity: 1, y: 0, scale: 1 };
  const playShellTransition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

  const headMotion = reduceMotion
    ? false
    : { opacity: 0, y: -8 };
  const hintMotion = reduceMotion ? false : { opacity: 0, y: 6 };
  const footMotion = reduceMotion ? false : { opacity: 0 };

  const gridListVariants = reduceMotion
    ? { hidden: {}, show: {} }
    : {
      hidden: {},
      show: {
        transition: { staggerChildren: 0.035, delayChildren: 0.08 },
      },
    };
  const gridCardVariants = reduceMotion
    ? { hidden: {}, show: {} }
    : {
      hidden: { opacity: 0, y: 16, scale: 0.94, rotateX: -6 },
      show: {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        transition: { type: 'spring', stiffness: 380, damping: 26 },
      },
    };

  return (
    <div className={`kanji-memory kanji-memory--play${reduceMotion ? ' kanji-memory--reduce-motion' : ''}`}>
      <div className="kanji-memory__sakura" aria-hidden />

      <Motion.div
        className="kanji-memory__shell"
        initial={playShellMotion}
        animate={playShellAnimate}
        transition={playShellTransition}
      >
        {!reduceMotion ? (
          <div className="kanji-memory__sakura-fall" aria-hidden>
            {Array.from({ length: SAKURA_PETAL_COUNT }, (_, i) => (
              <span
                key={`km-petal-${i}`}
                className="kanji-memory__petal"
                style={{
                  left: `${6 + ((i * 23) % 86)}%`,
                  animationDuration: `${8.25 + (i % 8) * 0.55}s`,
                  animationDelay: `${-i * 0.42}s`,
                  '--km-drift': `${-18 + (i % 11) * 3.5}px`,
                }}
              />
            ))}
          </div>
        ) : null}

        <div className="kanji-memory__shell-body">
          <Motion.header
            className="kanji-memory__head kanji-memory__head--play"
            initial={headMotion}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...playShellTransition, delay: reduceMotion ? 0 : 0.04 }}
          >
            <div className="kanji-memory__head-left">
              <Link className="kanji-memory__back" to={ROUTES.PLAY}>
                ← Quay lại
              </Link>
              <h1 className="kanji-memory__title">KANJI MEMORY</h1>
            </div>
            <div className="kanji-memory__control" role="group" aria-label="Bảng điều khiển trò chơi">
              <div className="kanji-memory__control-metric">
                <span className="kanji-memory__control-label">Thời gian</span>
                <span className="kanji-memory__control-value kanji-memory__control-value--time" aria-live="polite">
                  {formatMmSs(elapsedSec)}
                </span>
              </div>
              <div className="kanji-memory__control-metric">
                <span className="kanji-memory__control-label">Lượt mở</span>
                <span className="kanji-memory__control-value">{turns}</span>
              </div>
              <div className="kanji-memory__control-metric">
                <span className="kanji-memory__control-label">Tiến độ</span>
                <span className="kanji-memory__control-value kanji-memory__control-value--muted">
                  {matchedPairsCount}/{totalPairs}
                </span>
              </div>
              <button
                type="button"
                className="kanji-memory__control-reset"
                onClick={() => {
                  if (flipBackTimerRef.current) {
                    clearTimeout(flipBackTimerRef.current);
                    flipBackTimerRef.current = null;
                  }
                  startGame();
                }}
                title="Làm mới ván (cùng cấu hình)"
                aria-label="Làm mới ván"
              >
                <span aria-hidden>↻</span>
              </button>
            </div>
          </Motion.header>

          <Motion.p
            className="kanji-memory__hint"
            initial={hintMotion}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...playShellTransition, delay: reduceMotion ? 0 : 0.1 }}
          >
            Lật thẻ và ghép Kanji với nghĩa tương ứng!
          </Motion.p>

          <Motion.div
            className="kanji-memory__grid"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            variants={gridListVariants}
            initial={reduceMotion ? false : 'hidden'}
            animate={reduceMotion ? false : 'show'}
          >
            {cards.map((c) => {
              const showFace = c.flipped || c.matched;
              const isKanjiFace = c.kind === 'kanji';
              const isPicked = c.flipped && !c.matched;
              const disabled = c.matched || (openCount >= 2 && !c.flipped);
              const label = showFace
                ? `${isKanjiFace ? 'Kanji' : 'Nghĩa'}: ${c.text}${c.matched ? ' (đã ghép)' : ''}`
                : 'Thẻ úp — bấm để mở';
              return (
                <Motion.div
                  key={c.id}
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  variants={gridCardVariants}
                  className={`kanji-memory__card ${showFace ? 'kanji-memory__card--open' : ''} ${c.matched ? 'kanji-memory__card--matched' : ''} ${isPicked ? 'kanji-memory__card--picked' : ''} ${disabled ? 'kanji-memory__card--disabled' : ''}`}
                  aria-label={label}
                  onClick={() => {
                    if (!disabled) onCardClick(c.id);
                  }}
                  onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onCardClick(c.id);
                    }
                  }}
                >
                  <div className="kanji-memory__flip">
                    <div className="kanji-memory__flip-inner">
                      <div className="kanji-memory__flip-face kanji-memory__flip-face--back" aria-hidden>
                        <span className="kanji-memory__flip-sakura-ico" aria-hidden>
                          ❀
                        </span>
                        <span className="kanji-memory__q">?</span>
                      </div>
                      <div className="kanji-memory__flip-face kanji-memory__flip-face--front" lang={isKanjiFace ? 'ja' : 'vi'}>
                        <span className={`kanji-memory__face ${isKanjiFace ? 'kanji-memory__face--jp' : 'kanji-memory__face--vi'}`}>
                          {c.text}
                        </span>
                        {isKanjiFace ? (
                          <span className="kanji-memory__speak">
                            <SpeakJaButton text={c.text} label={`Nghe: ${c.text}`} />
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Motion.div>
              );
            })}
          </Motion.div>

          <Motion.footer
            className="kanji-memory__foot"
            initial={footMotion}
            animate={{ opacity: 1 }}
            transition={{ ...playShellTransition, delay: reduceMotion ? 0 : 0.2 }}
          >
            <button
              type="button"
              className="kanji-memory__linkish"
              onClick={() => {
                if (flipBackTimerRef.current) clearTimeout(flipBackTimerRef.current);
                setPhase('setup');
                setCards([]);
              }}
            >
              Đổi bài / số cặp
            </button>
          </Motion.footer>
        </div>
      </Motion.div>
    </div>
  );
}
