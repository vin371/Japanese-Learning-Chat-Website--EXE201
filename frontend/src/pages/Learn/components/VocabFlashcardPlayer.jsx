import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  CornerDownRight,
  FlipHorizontal2,
  LayoutGrid,
  Layers,
  Maximize2,
  Minimize2,
  Play,
  Shuffle,
  Square,
  Star,
  Table2,
  Volume2,
} from 'lucide-react';
import SpeakJaButton from '../../../components/learn/SpeakJaButton';
import { japaneseSpeechSupported, speakJapanese, stopJapaneseSpeech } from '../../../utils/japaneseSpeech';
import { resolveLessonTheme } from '../../../utils/vocabLessonThemes';
import { getVocabIllustration } from '../../../utils/vocabIllustration';
import { learnFlipEnter, learnPageItem, learnPageRoot } from '../../../utils/learnMotion';
import LessonFlipCard from './LessonFlipCard';
import ApiVocabTable from './ApiVocabTableInline';

function shuffleIndices(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function VisualCue({ item, size = 'md' }) {
  const ill = getVocabIllustration(item);
  if (ill.type === 'image' && ill.imageUrl) {
    return (
      <div className={`learn-flip-visual learn-flip-visual--photo${size === 'sm' ? ' learn-flip-visual--sm' : ''}`}>
        <img src={ill.imageUrl} alt="" loading="lazy" />
      </div>
    );
  }
  return (
    <div
      className={`learn-flip-visual learn-flip-visual--emoji${size === 'sm' ? ' learn-flip-visual--sm' : ''}`}
      style={ill.gradient ? { background: ill.gradient } : undefined}
    >
      <span aria-hidden>{ill.emoji}</span>
    </div>
  );
}

function VocabListCard({ item, index, isKanji }) {
  const w = item.wordJp ?? item.WordJp ?? '';
  const reading = String(item.reading ?? item.Reading ?? '').trim();
  const meaning = String(item.meaningVi ?? item.MeaningVi ?? '').trim();
  const speakText = reading || w;
  const ill = getVocabIllustration(item);
  const label = isKanji ? 'Hán tự' : 'Từ';

  return (
    <article
      className={`learn-vocab-item${isKanji ? ' learn-vocab-item--kanji' : ''}`}
      aria-label={`${label} ${index + 1}`}
    >
      <header className="learn-vocab-item__head">
        <span className="learn-vocab-item__cue" aria-hidden>
          {ill.emoji}
        </span>
        <div className="learn-vocab-item__head-text">
          <span className="learn-vocab-item__no">
            {label} {index + 1}
          </span>
          <h3 className={`learn-vocab-item__jp${isKanji ? ' learn-vocab-item__jp--kanji' : ''}`} lang="ja">
            {w}
          </h3>
        </div>
        {speakText ? <SpeakJaButton text={speakText} label={`Nghe: ${speakText}`} /> : null}
      </header>
      {reading ? (
        <p className="learn-vocab-item__reading" lang="ja">
          {reading}
        </p>
      ) : null}
      {meaning ? <p className="learn-vocab-item__mean">{meaning}</p> : null}
    </article>
  );
}

export default function VocabFlashcardPlayer({
  items,
  lessonTitle,
  lessonSlug,
  lessonId,
  starStoragePrefix = 'vocab',
  TableComponent = ApiVocabTable,
  themeTag,
  cardKind = 'vocab',
}) {
  const shellRef = useRef(null);
  const autoTimerRef = useRef(null);
  const [view, setView] = useState('flip');
  const [order, setOrder] = useState(() => (Array.isArray(items) ? items.map((_, i) => i) : []));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [starred, setStarred] = useState(() => new Set());
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const safe = Array.isArray(items) ? items : [];
  const count = safe.length;
  const currentIdx = order[index] ?? 0;
  const current = safe[currentIdx];
  const theme = useMemo(() => resolveLessonTheme(lessonTitle, lessonSlug), [lessonTitle, lessonSlug]);
  const storageKey = lessonId ? `yume-${starStoragePrefix}-stars-${lessonId}` : null;
  const isKanji = cardKind === 'kanji';
  const label = themeTag ?? (isKanji ? 'Kanji' : 'Từ vựng');

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setStarred(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    setOrder(safe.map((_, i) => i));
    setIndex(0);
    setFlipped(false);
  }, [safe.length, lessonSlug]);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const persistStars = useCallback(
    (next) => {
      setStarred(next);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify([...next]));
        } catch {
          /* ignore */
        }
      }
    },
    [storageKey],
  );

  const go = useCallback(
    (delta) => {
      if (count === 0) return;
      setFlipped(false);
      setIndex((i) => Math.min(count - 1, Math.max(0, i + delta)));
    },
    [count],
  );

  const stopAuto = useCallback(() => {
    if (autoTimerRef.current) {
      window.clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    stopJapaneseSpeech();
    setPlaying(false);
  }, []);

  const speakCurrent = useCallback(() => {
    if (!current) return;
    const w = current.wordJp ?? current.WordJp ?? '';
    const reading = String(current.reading ?? current.Reading ?? '').trim();
    speakJapanese(reading || w);
  }, [current]);

  const playAuto = useCallback(() => {
    if (!japaneseSpeechSupported() || count === 0) return;
    stopAuto();
    setPlaying(true);
    let pos = index;
    const run = () => {
      const idx = order[pos] ?? 0;
      const item = safe[idx];
      if (!item) {
        stopAuto();
        return;
      }
      setIndex(pos);
      setFlipped(false);
      const w = item.wordJp ?? item.WordJp ?? '';
      const reading = String(item.reading ?? item.Reading ?? '').trim();
      const u = new SpeechSynthesisUtterance(reading || w);
      u.lang = 'ja-JP';
      u.rate = 0.9;
      u.onend = () => {
        autoTimerRef.current = window.setTimeout(() => {
          pos += 1;
          if (pos >= count) {
            stopAuto();
            return;
          }
          run();
        }, 800);
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    };
    run();
  }, [count, index, order, safe, stopAuto]);

  useEffect(() => () => stopAuto(), [stopAuto]);

  useEffect(() => {
    const onKey = (e) => {
      if (view !== 'flip') return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, view]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
      return;
    }
    void shellRef.current?.requestFullscreen?.();
  }, []);

  if (count === 0) {
    return (
      <p className="learn-vocab-panel__empty">
        {isKanji ? 'Chưa có hán tự cho bài này.' : 'Chưa có từ vựng cho bài này.'}
      </p>
    );
  }

  const w = current?.wordJp ?? current?.WordJp ?? '';
  const reading = String(current?.reading ?? current?.Reading ?? '').trim();
  const meaning = String(current?.meaningVi ?? current?.MeaningVi ?? '').trim();
  const starKey = current?.id ?? current?.Id ?? `${currentIdx}`;
  const isStarred = starred.has(starKey);
  const accent = isKanji ? '#d97706' : theme.palette.accent;

  return (
    <section
      ref={shellRef}
      className={`learn-vocab-panel${isKanji ? ' learn-vocab-panel--kanji' : ''}${view === 'flip' ? ' learn-vocab-panel--flip-active' : ''}`}
      style={{ '--flash-theme-accent': accent }}
      aria-label={isKanji ? 'Nội dung hán tự' : 'Nội dung từ vựng'}
    >
      <div className="learn-vocab-panel__modes" role="tablist">
        <button
          type="button"
          role="tab"
          className={`learn-flashdeck__mode${view === 'flip' ? ' learn-flashdeck__mode--on' : ''}`}
          aria-selected={view === 'flip'}
          onClick={() => {
            stopAuto();
            setView('flip');
          }}
        >
          <Layers size={16} />
          Thẻ lật
        </button>
        <button
          type="button"
          role="tab"
          className={`learn-flashdeck__mode${view === 'list' ? ' learn-flashdeck__mode--on' : ''}`}
          aria-selected={view === 'list'}
          onClick={() => {
            stopAuto();
            setView('list');
          }}
        >
          <LayoutGrid size={16} />
          Danh sách
        </button>
        <button
          type="button"
          role="tab"
          className={`learn-flashdeck__mode${view === 'table' ? ' learn-flashdeck__mode--on' : ''}`}
          aria-selected={view === 'table'}
          onClick={() => {
            stopAuto();
            setView('table');
          }}
        >
          <Table2 size={16} />
          Bảng tra
        </button>
      </div>

      {view === 'table' ? (
        <div className="learn-flashdeck__table-pane">
          <TableComponent items={safe} />
        </div>
      ) : view === 'flip' ? (
        <motion.div
          className="learn-flashdeck learn-flashdeck--flip"
          variants={learnFlipEnter}
          initial="hidden"
          animate="show"
        >
          <div className="learn-flashdeck__stage learn-flashdeck__stage--flip">
            <div className="learn-flashdeck__main-area">
              <button type="button" className="learn-flashdeck__nav-side learn-flashdeck__nav-side--prev" onClick={() => go(-1)} disabled={index <= 0} aria-label="Trước">
                <ChevronLeft size={36} />
              </button>
              <div className="learn-flashdeck__card-wrap">
                <button
                  type="button"
                  className={`learn-flashdeck__star learn-flashdeck__star--float${isStarred ? ' learn-flashdeck__star--on' : ''}`}
                  onClick={() => {
                    const next = new Set(starred);
                    if (next.has(starKey)) next.delete(starKey);
                    else next.add(starKey);
                    persistStars(next);
                  }}
                  aria-pressed={isStarred}
                >
                  <Star size={18} fill={isStarred ? 'currentColor' : 'none'} />
                </button>

                <LessonFlipCard
                  key={currentIdx}
                  isFlipped={flipped}
                  onFlip={() => setFlipped((f) => !f)}
                  accent={accent}
                  front={
                    <div className="learn-flip-face learn-flip-face--front">
                      <span className="learn-flip-face__badge">{label}</span>
                      <p className={`learn-flip-face__jp${isKanji ? ' learn-flip-face__jp--kanji' : ''}`} lang="ja">
                        {w}
                      </p>
                      <span className="learn-flip-face__flip-ico" aria-hidden="true">
                        <CornerDownRight size={18} />
                      </span>
                    </div>
                  }
                  back={
                    <div className="learn-flip-face learn-flip-face--back">
                      <VisualCue item={current} />
                      <p className="learn-flip-face__jp learn-flip-face__jp--sm" lang="ja">
                        {w}
                      </p>
                      {reading ? (
                        <p className="learn-flip-face__reading" lang="ja">
                          {reading}
                        </p>
                      ) : null}
                      {meaning ? <p className="learn-flip-face__mean">{meaning}</p> : null}
                      <div className="learn-flip-face__actions">
                        {japaneseSpeechSupported() ? <SpeakJaButton text={reading || w} label="Nghe" /> : null}
                      </div>
                    </div>
                  }
                />
              </div>
              <button type="button" className="learn-flashdeck__nav-side learn-flashdeck__nav-side--next" onClick={() => go(1)} disabled={index >= count - 1} aria-label="Tiếp">
                <ChevronRight size={36} />
              </button>
            </div>

            <div className="learn-flashdeck__toolbar">
              <div className="learn-flashdeck__toolbar-side">
                {japaneseSpeechSupported() ? (
                  playing ? (
                    <button type="button" className="learn-flashdeck__tool" onClick={stopAuto} aria-label="Dừng">
                      <Square size={18} />
                    </button>
                  ) : (
                    <button type="button" className="learn-flashdeck__tool" onClick={playAuto} aria-label="Tự động">
                      <Play size={18} />
                    </button>
                  )
                ) : null}
                <button
                  type="button"
                  className="learn-flashdeck__tool"
                  onClick={() => {
                    stopAuto();
                    setOrder(shuffleIndices(count));
                    setIndex(0);
                    setFlipped(false);
                  }}
                  aria-label="Xáo trộn"
                >
                  <Shuffle size={18} />
                </button>
                <button type="button" className="learn-flashdeck__tool" onClick={() => setFlipped((f) => !f)} aria-label="Lật thẻ">
                  <FlipHorizontal2 size={18} />
                </button>
              </div>
              <div className="learn-flashdeck__pager">
                <span className="learn-flashdeck__counter">
                  {index + 1} / {count}
                </span>
              </div>
              <div className="learn-flashdeck__toolbar-side learn-flashdeck__toolbar-side--end">
                {japaneseSpeechSupported() ? (
                  <button type="button" className="learn-flashdeck__tool" onClick={speakCurrent} aria-label="Nghe">
                    <Volume2 size={18} />
                  </button>
                ) : null}
                <button type="button" className="learn-flashdeck__tool" onClick={toggleFullscreen} aria-label="Toàn màn hình">
                  {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="learn-vocab-panel__list"
          variants={learnPageRoot}
          initial="hidden"
          animate="show"
        >
          {safe.map((item, idx) => (
            <motion.div key={item.id ?? item.Id ?? `v-${idx}`} variants={learnPageItem}>
              <VocabListCard item={item} index={idx} isKanji={isKanji} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
