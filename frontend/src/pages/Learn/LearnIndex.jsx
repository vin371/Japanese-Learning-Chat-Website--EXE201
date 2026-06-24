import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useOutletContext } from 'react-router-dom';
import { ROUTES } from '../../data/routes';
import { useAuth } from '../../hooks/useAuth';
import http from '../../api/client';
import { isStaffUser } from '../../utils/roles';
import { getJlptLevelCodeFromUser, jlptCodeToLevelId } from '../../utils/learnLevelCode';
import {
  getLevelAccessMode,
  learnRouteWithJlpt,
  lockedLevelMessage,
} from '../../utils/learnLevelAccess';
import { LearnLevelLocked } from './components/LearnLevelLocked';
import { categoryTypeToSection, sectionLabelFor, sectionMatchesFilter } from '../../utils/learnDbLessonNav';
import { learnCardHover } from '../../utils/learnMotion';
import { LearnProgressRing } from './components/LearnProgressRing';
import { LearnImageCarousel } from './components/LearnImageCarousel';
import LearnAlphabet from './components/LearnAlphabet';
import { resolveLearnLessonThumb, resolveLearnLevelHero } from '../../utils/learnLessonThumb';
import { hasCompletedPlacementResult } from '../../utils/onboardingFlow';
import { LearnTrackThumb } from './components/LearnTrackThumb';

/** Ảnh minh họa banner «Kiểm tra trình độ» — luân phiên (crossfade) */
const LEARN_PROMO_ART_CAROUSEL_URLS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBVTHYikuZH0p7u2VCJV4qI-wu_3DW0qy1-EjnWqAmqyUKdRzHNQAM9GXSCjCZvLnCgSzIsD9GHwR5swUyXr2lpEkNu_QJmMZc2IFGPO7OlB6I-49dkWSL6CFOeaUaSQVuNiZT137-CaSBs9AqyOpK1YQ5zCE-SQshPbR6dxzed2JeyZjAWHHbvxSCaoxKTdZ5Z5XUFHI-HWSjqErRVHUcX_Vt3_xULtdOpR4ar4q7CMzm9ERrDqSXR29ITa1Ur5WES4mQW_rl0YJY',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCCvfKcFz3s4BHw0SyTPzICssn_5wC25ZQWfnKXnxvdYscL4L7IbL1im112bnvrBcf2K-JjVZMgIE0IoCu1_KqdjQIY34fu8nQ4QdxeDBSq-mY8dpdKvze8_05D-ZOoxeRJSZAiQs-NiiCuDa1vIQPOJbOyaja6xCtG2acmzlv_iPBJAjurTKG_7z-w7ojm7CD2RiZHjiz-KtimLGwaeHc-abxUJlNZSWGRyr9UTA7R93d1I670kcUYWhQUP0_RDDd6jLsK5iLAwfo',
];

/** Alias để ESLint nhận diện biến dùng qua JSX. */
const Motion = motion;

const learnRoot = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.065, delayChildren: 0.02 },
  },
};

const learnItem = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 32 },
  },
};

const learnGridBlock = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 360,
      damping: 30,
      staggerChildren: 0.042,
    },
  },
};

const learnSectionStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.075 },
  },
};

const DISPLAY_GROUP_KEYS = [
  { key: 'vocab', labelKey: 'vocab' },
  { key: 'grammar', labelKey: 'grammar' },
  { key: 'kanji', labelKey: 'kanji' },
];

function displayGroupsFor(levelCode) {
  const code = String(levelCode || 'N5').toUpperCase();
  return DISPLAY_GROUP_KEYS.map((g) => ({
    key: g.key,
    label:
      g.key === 'vocab'
        ? `Từ vựng ${code}`
        : g.key === 'grammar'
          ? `Ngữ pháp ${code}`
          : `Kanji ${code}`,
  }));
}

function sectionHeadVi(levelCode) {
  const code = String(levelCode || 'N5').toUpperCase();
  return {
    all: `Tất cả chủ đề JLPT ${code}`,
    dialogue: 'Hội thoại',
    reference: 'Tra cứu',
    reading: 'Bài đọc',
    vocab: `Từ vựng ${code}`,
    kanji: `Kanji ${code}`,
    grammar: `Ngữ pháp ${code}`,
    alphabet: 'Bảng chữ cái',
  };
}

function categoryAccent(section) {
  if (section === 'vocab') return 'vocab';
  if (section === 'grammar') return 'grammar';
  if (section === 'kanji') return 'kanji';
  return 'default';
}

function normalizeLesson(row) {
  const categoryType = row.categoryType ?? row.CategoryType ?? '';
  return {
    id: row.id ?? row.Id,
    slug: row.slug ?? row.Slug,
    title: row.title ?? row.Title,
    categoryName: row.categoryName ?? row.CategoryName ?? '',
    categoryType,
    section: categoryTypeToSection(categoryType),
    sortOrder: row.sortOrder ?? row.SortOrder ?? 0,
    levelId: row.levelId ?? row.LevelId ?? 0,
  };
}

/** completed | active | locked | guest-open — mọi bài N5 mở; chỉ đánh dấu đã xong. */
function rowStatesForAuth(lessons, progressByLessonId) {
  const isDone = (id) => {
    const p = progressByLessonId.get(id);
    if (!p) return false;
    const st = (p.status ?? p.Status ?? '').toLowerCase();
    const pct = Number(p.progressPercent ?? p.ProgressPercent ?? 0);
    return st === 'completed' || pct >= 100;
  };

  return lessons.map((lesson) => {
    if (isDone(lesson.id)) return { lesson, state: 'completed' };
    return { lesson, state: 'guest-open' };
  });
}

function rowStatesGuest(lessons) {
  return lessons.map((lesson) => ({ lesson, state: 'guest-open' }));
}

/** Thẻ bài học — ảnh minh họa theo title / cấp JLPT */
function TrackCard({ lesson, state, to, progressPercent, levelCode }) {
  const isLocked = state === 'locked';
  const accent = categoryAccent(lesson.section);
  const thumbSrc = resolveLearnLessonThumb({
    title: lesson.title,
    slug: lesson.slug,
    section: lesson.section,
    levelCode,
    sortOrder: lesson.sortOrder,
    lessonId: lesson.id,
  });
  const badge =
    state === 'completed'
      ? { cls: 'learn-track-card__badge--done', text: 'Xong' }
      : state === 'locked'
        ? { cls: 'learn-track-card__badge--locked', text: 'Khóa' }
        : state === 'guest-open'
          ? { cls: 'learn-track-card__badge--sample', text: 'Mở' }
          : { cls: 'learn-track-card__badge--active', text: 'Đang học' };
  const btnClass =
    state === 'completed'
      ? 'learn-track-card__btn learn-track-card__btn--review'
      : state === 'locked'
        ? 'learn-track-card__btn learn-track-card__btn--locked'
        : 'learn-track-card__btn learn-track-card__btn--primary';
  const label = state === 'completed' ? 'Ôn tập' : 'Học ngay';

  return (
    <Motion.div
      className={`learn-track-card learn-track-card--visual learn-track-card--accent-${accent} learn-track-card--${state === 'guest-open' ? 'guest' : state}`}
      variants={learnCardHover}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      <div className={`learn-track-card__thumb learn-track-card__thumb--${accent}`}>
        <LearnTrackThumb src={thumbSrc} className="learn-track-card__thumb-img" />
        <div className="learn-track-card__thumb-shade" aria-hidden />
      </div>
      <div className="learn-track-card__accent-bar" aria-hidden />
      <div className="learn-track-card__head">
        <span className={`learn-track-card__badge ${badge.cls}`}>{badge.text}</span>
        {lesson.sortOrder ? (
          <span className="learn-track-card__lesson-no">Bài {lesson.sortOrder}</span>
        ) : null}
      </div>
      <div className="learn-track-card__middle">
        <p className="learn-track-card__cat">{sectionLabelFor(lesson.section)}</p>
        <h4 className="learn-track-card__title">{lesson.title}</h4>
        {state === 'active' && progressPercent != null ? (
          <div className="learn-track-card__mini-prog" aria-hidden>
            <div
              className="learn-track-card__mini-prog-fill"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        ) : null}
      </div>
      <div className="learn-track-card__foot">
        {isLocked ? (
          <span className={btnClass} role="button" aria-disabled="true">
            {label}
          </span>
        ) : (
          <Link className={btnClass} to={to}>
            {label}
          </Link>
        )}
      </div>
    </Motion.div>
  );
}

function openLearnAiPanel() {
  window.dispatchEvent(new CustomEvent('yume-open-learn-ai'));
}

function LessonGrid({ rows, viewMode, lessonProgressPercent, activeLevelCode }) {
  return (
    <Motion.div
      className={`learn-track__grid learn-track__grid--m2${viewMode === 'list' ? ' learn-track__grid--list' : ''}`}
      variants={learnGridBlock}
    >
      {rows.map(({ lesson, state }) => (
        <Motion.div key={lesson.id} className="learn-track-card-wrap" variants={learnItem}>
          <TrackCard
            lesson={lesson}
            state={state}
            to={learnRouteWithJlpt(`${ROUTES.LEARN}/${encodeURIComponent(lesson.slug)}`, activeLevelCode)}
            progressPercent={state === 'active' ? lessonProgressPercent(lesson.id) ?? 40 : null}
            levelCode={activeLevelCode}
          />
        </Motion.div>
      ))}
    </Motion.div>
  );
}

export default function LearnIndex() {
  const reduceMotion = useReducedMotion();
  const { isAuthenticated, user } = useAuth();
  const { sectionFilter, activeLevelCode: ctxLevelCode, activeLevelId: ctxLevelId, activeAccessMode, userLevelCode: ctxUserLevel, levelProgressMap } = useOutletContext() || {};
  const filterKey = sectionFilter || 'all';
  const activeLevelCode = ctxLevelCode || getJlptLevelCodeFromUser(user);
  const activeLevelId = ctxLevelId ?? jlptCodeToLevelId(activeLevelCode);
  const userLevelCode = ctxUserLevel || getJlptLevelCodeFromUser(user);
  const accessMode = activeAccessMode || getLevelAccessMode(activeLevelCode, userLevelCode, levelProgressMap || {});
  const displayGroups = useMemo(() => displayGroupsFor(activeLevelCode), [activeLevelCode]);
  const sectionHeadlines = useMemo(() => sectionHeadVi(activeLevelCode), [activeLevelCode]);
  const staffNoLearnerTests = isStaffUser(user);
  const showPlacementPromo = !staffNoLearnerTests && !hasCompletedPlacementResult();
  const [apiLessons, setApiLessons] = useState([]);
  const [progressItems, setProgressItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const lr = await http.get('/api/lessons', { params: { page: 1, pageSize: 200, levelId: activeLevelId } });
      const items = lr.data?.items ?? lr.data?.Items ?? [];
      setApiLessons((Array.isArray(items) ? items : []).map(normalizeLesson));

      if (isAuthenticated) {
        const pr = await http.get('/api/users/me/progress', { params: { page: 1, pageSize: 200 } });
        const pi = pr.data?.items ?? pr.data?.Items ?? [];
        setProgressItems(Array.isArray(pi) ? pi : []);
      } else {
        setProgressItems([]);
      }
    } catch {
      setApiLessons([]);
      setProgressItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeLevelId]);

  useEffect(() => {
    load();
  }, [load]);

  const progressByLessonId = useMemo(() => {
    const m = new Map();
    for (const p of progressItems) {
      const id = p.lessonId ?? p.LessonId;
      if (id) m.set(id, p);
    }
    return m;
  }, [progressItems]);

  const sortedApi = useMemo(() => {
    return [...apiLessons]
      .filter((l) => l.levelId === activeLevelId)
      .sort((a, b) => {
        const sectionOrder = { vocab: 0, grammar: 1, kanji: 2 };
        const sa = sectionOrder[a.section] ?? 9;
        const sb = sectionOrder[b.section] ?? 9;
        if (sa !== sb) return sa - sb;
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.id - b.id;
      });
  }, [apiLessons, activeLevelId]);

  const filteredLessons = useMemo(() => {
    if (filterKey === 'all' || filterKey === 'dialogue' || filterKey === 'reading' || filterKey === 'reference') {
      return sortedApi;
    }
    return sortedApi.filter((l) => sectionMatchesFilter(l.categoryType, filterKey));
  }, [sortedApi, filterKey]);

  const apiRows = useMemo(() => {
    if (!filteredLessons.length) return [];
    const rows = isAuthenticated
      ? rowStatesForAuth(filteredLessons, progressByLessonId)
      : rowStatesGuest(filteredLessons);
    return rows;
  }, [filteredLessons, progressByLessonId, isAuthenticated]);

  const apiCompleted = sortedApi.filter((l) => {
    const p = progressByLessonId.get(l.id);
    if (!p) return false;
    const st = (p.status ?? p.Status ?? '').toLowerCase();
    const pct = Number(p.progressPercent ?? p.ProgressPercent ?? 0);
    return st === 'completed' || pct >= 100;
  }).length;

  const totalTrack = sortedApi.length;
  const doneTrack = apiCompleted;
  const progressPct = totalTrack ? Math.round((doneTrack / totalTrack) * 100) : 0;

  const remainder = Math.max(0, totalTrack - doneTrack);
  const sectionHeadline = sectionHeadlines[filterKey] ?? sectionHeadlines.all;

  function lessonProgressPercent(lessonId) {
    const p = progressByLessonId.get(lessonId);
    if (!p) return null;
    return Number(p.progressPercent ?? p.ProgressPercent ?? 0);
  }

  if (accessMode === 'locked') {
    return (
      <LearnLevelLocked
        targetCode={activeLevelCode}
        userCode={userLevelCode}
        message={lockedLevelMessage(userLevelCode, levelProgressMap || {})}
      />
    );
  }

  if (filterKey === 'alphabet') {
    return (
      <Motion.div
        className="learn-dashboard"
        variants={learnRoot}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <LearnAlphabet />
      </Motion.div>
    );
  }

  const showGrouped = filterKey === 'all';

  return (
    <Motion.div
      className="learn-dashboard"
      variants={learnRoot}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <Motion.header className="learn-visual-hero" variants={learnItem}>
        {accessMode === 'review' ? (
          <div className="learn-level-review-banner" role="status">
            <span className="learn-level-review-banner__tag">Ôn tập</span>
            <p className="learn-level-review-banner__text">
              Bạn đang xem lại nội dung <strong>JLPT {activeLevelCode}</strong>. Tiến độ chỉ cập nhật khi học ở cấp{' '}
              <strong>{userLevelCode}</strong>.
            </p>
          </div>
        ) : null}
        <div className="learn-visual-hero__copy">
          <span className="learn-dashboard__tag">Lộ trình YumeGo-ji</span>
          <h1 className="learn-dashboard__title">
            Học tiếng Nhật <span className="learn-dashboard__title-accent">JLPT {activeLevelCode}</span>
          </h1>
          <p className="learn-dashboard__lead">
            {isAuthenticated
              ? 'Từ vựng, ngữ pháp và kanji — mỗi bài kèm thẻ học và minh họa trực quan.'
              : `Đăng nhập để lưu tiến độ. Mọi bài ${activeLevelCode} đều mở để học thử.`}
          </p>
          <div className="learn-visual-hero__chips">
            <span className="learn-visual-chip">Từ vựng</span>
            <span className="learn-visual-chip">Ngữ pháp</span>
            <span className="learn-visual-chip">Kanji</span>
          </div>
        </div>
        <div className="learn-visual-hero__media">
          <img src={resolveLearnLevelHero(activeLevelCode)} alt="" className="learn-visual-hero__photo" loading="lazy" decoding="async" />
          <div className="learn-visual-hero__ring">
            <LearnProgressRing size={100} percent={totalTrack ? progressPct : null} />
            <p className="learn-hero-ring__kicker">Tiến độ tổng</p>
            <p className="learn-dashboard__stat-meta learn-dashboard__stat-meta--under-ring">
              {totalTrack > 0
                ? remainder > 0
                  ? `${doneTrack}/${totalTrack} bài — còn ${remainder}`
                  : `${doneTrack}/${totalTrack} bài hoàn thành`
                : isAuthenticated
                  ? `Chưa có bài ${activeLevelCode}`
                  : 'Đăng nhập để xem tiến độ'}
            </p>
          </div>
        </div>
      </Motion.header>

      {loading ? (
        <Motion.p className="learn-track__loading" variants={learnItem}>
          Đang tải danh sách…
        </Motion.p>
      ) : null}

      {filteredLessons.length > 0 ? (
        <Motion.section className="learn-track learn-track--cards" aria-labelledby="learn-track-api-title" variants={learnSectionStagger}>
          <Motion.div className="learn-section-head learn-section-head--m2" variants={learnItem}>
            <div>
              <h2 id="learn-track-api-title" className="learn-section-head__title learn-section-head__title--system">
                Khóa học {activeLevelCode}
              </h2>
              <p className="learn-section-head__sub">{sectionHeadline}</p>
              {isAuthenticated && apiCompleted > 0 ? (
                <p className="learn-section-head__ready-line">Sẵn sàng để ôn tập</p>
              ) : null}
            </div>
            <div className="learn-view-toggle" role="group" aria-label="Kiểu xem">
              <button
                type="button"
                className={`learn-view-toggle__btn${viewMode === 'grid' ? ' learn-view-toggle__btn--on' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
              >
                Lưới
              </button>
              <button
                type="button"
                className={`learn-view-toggle__btn${viewMode === 'list' ? ' learn-view-toggle__btn--on' : ''}`}
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
              >
                Danh sách
              </button>
            </div>
          </Motion.div>

          {showGrouped ? (
            displayGroups.map((group) => {
              const groupRows = apiRows.filter(({ lesson }) => lesson.section === group.key);
              if (!groupRows.length) return null;
              return (
                <div key={group.key} className="learn-track-group">
                  <h3 className="learn-track-group__title">{group.label}</h3>
                  <LessonGrid rows={groupRows} viewMode={viewMode} lessonProgressPercent={lessonProgressPercent} activeLevelCode={activeLevelCode} />
                </div>
              );
            })
          ) : (
            <LessonGrid rows={apiRows} viewMode={viewMode} lessonProgressPercent={lessonProgressPercent} activeLevelCode={activeLevelCode} />
          )}
        </Motion.section>
      ) : !loading ? (
        <Motion.p className="learn-track__empty" variants={learnItem}>
          Chưa có bài {activeLevelCode} trong hệ thống.
        </Motion.p>
      ) : null}

      <Motion.section className="learn-ai-promo" aria-labelledby="learn-ai-promo-title" id="learn-ai-sensei" variants={learnItem}>
        <div className="learn-ai-promo__text">
          <h2 id="learn-ai-promo-title" className="learn-ai-promo__title">
            Hội thoại thực tế — luyện với AI Sensei
          </h2>
          <p className="learn-ai-promo__desc">
            Yumegoji AI hỗ trợ bạn trong khung chat trên trang Học tập — hỏi bài, đính ảnh hoặc tài liệu, phản hồi tức
            thì. Giữ thói quen luyện mỗi ngày.
          </p>
          <div className="learn-ai-promo__row">
            <button type="button" className="learn-ai-promo__cta" onClick={openLearnAiPanel}>
              Bắt đầu ngay
            </button>
            <span className="learn-ai-promo__xp">+500 XP mỗi phiên luyện tập</span>
          </div>
        </div>
        <div className="learn-ai-promo__art" aria-hidden />
      </Motion.section>

      {showPlacementPromo ? (
        <Motion.section className="learn-promo-banner" aria-labelledby="learn-promo-title" variants={learnItem}>
          <div className="learn-promo-banner__text">
            <h2 id="learn-promo-title" className="learn-promo-banner__title">
              Bạn đã sẵn sàng kiểm tra trình độ?
            </h2>
            <p className="learn-promo-banner__desc">
              Làm bài test đầu vào hoặc chơi minigame để ôn tập — giữ vững nhịp học mỗi ngày.
            </p>
            <div className="learn-promo-banner__actions">
              <Link className="learn-promo-banner__btn" to={ROUTES.PLACEMENT_TEST}>
                Làm bài thi thử
              </Link>
              <Link className="learn-promo-banner__btn learn-promo-banner__btn--ghost" to={ROUTES.PLAY}>
                Trò chơi ôn tập
              </Link>
            </div>
          </div>
          <LearnImageCarousel
            urls={LEARN_PROMO_ART_CAROUSEL_URLS}
            className="learn-promo-banner__art learn-promo-banner__art--carousel"
            aria-hidden
          />
        </Motion.section>
      ) : (
        <Motion.section className="learn-promo-banner learn-promo-banner--staff" aria-labelledby="learn-promo-staff-title" variants={learnItem}>
          <div className="learn-promo-banner__text">
            <h2 id="learn-promo-staff-title" className="learn-promo-banner__title">
              Khu vực học tập
            </h2>
            <p className="learn-promo-banner__desc">
              Tài khoản điều hành không dùng bài test đầu vào / thi nâng level. Bạn vẫn có thể xem bài học hoặc chơi ôn
              tập nếu cần.
            </p>
            <div className="learn-promo-banner__actions">
              <Link className="learn-promo-banner__btn learn-promo-banner__btn--ghost" to={ROUTES.PLAY}>
                Trò chơi ôn tập
              </Link>
            </div>
          </div>
          <LearnImageCarousel
            urls={LEARN_PROMO_ART_CAROUSEL_URLS}
            className="learn-promo-banner__art learn-promo-banner__art--carousel"
            aria-hidden
          />
        </Motion.section>
      )}

      <Motion.p className="learn-track__hint" variants={learnItem}>
        Gợi ý: mở từng bài và bấm <strong>Hoàn thành bài học</strong> ở cuối trang để cập nhật tiến độ.
      </Motion.p>
    </Motion.div>
  );
}
