import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion as motionFr, useReducedMotion } from 'framer-motion';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../data/routes';
import { useAuth } from '../../hooks/useAuth';
import http from '../../api/client';
import { fetchMyProgressSummary } from '../../services/learningProgressService';
import { isStaffUser } from '../../utils/roles';
import LearnAiWidget from './LearnAiWidget';
import { LearnSidebarShell } from './components/LearnSidebarShell';
import { SakuraRainLayer } from '../../components/effects/SakuraRainLayer';
import {
  buildLessonGroupsFromDb,
  dbLessonToNavItem,
  sortLearnLessons,
} from '../../utils/learnDbLessonNav';
import {
  jlptCodeToLevelId,
  resolveActiveLearnLevelCode,
} from '../../utils/learnLevelCode';
import {
  buildLevelProgressMap,
  canViewLearnLevel,
  getLevelAccessMode,
  learnRouteWithJlpt,
  resolveUserLearnCode,
} from '../../utils/learnLevelAccess';

const Motion = motionFr;

const SECTION_ORDER = ['vocab', 'grammar', 'kanji', 'dialogue', 'reading', 'reference', 'alphabet'];

/** Chỉ gọi API — không setState (tránh cảnh báo React Compiler trong useEffect). */
async function fetchLearnLayoutSnapshot(isAuthenticated, levelId) {
  try {
    const lr = await http.get('/api/lessons', { params: { page: 1, pageSize: 100, levelId } });
    const items = lr.data?.items ?? lr.data?.Items ?? [];
    const list = Array.isArray(items) ? items : [];

    if (!isAuthenticated) {
      return {
        publishedFromDb: list,
        sidebarTotal: 0,
        sidebarDone: 0,
      };
    }

    const pr = await http.get('/api/users/me/progress', { params: { page: 1, pageSize: 200 } });
    const progress = pr.data?.items ?? pr.data?.Items ?? [];
    const progressMap = new Map();
    for (const p of Array.isArray(progress) ? progress : []) {
      const id = p.lessonId ?? p.LessonId;
      if (id != null) progressMap.set(id, p);
    }
    let done = 0;
    for (const row of list) {
      const id = row.id ?? row.Id;
      const p = progressMap.get(id);
      if (!p) continue;
      const st = String(p.status ?? p.Status ?? '').toLowerCase();
      const pct = Number(p.progressPercent ?? p.ProgressPercent ?? 0);
      if (st === 'completed' || pct >= 100) done++;
    }

    return {
      publishedFromDb: list,
      sidebarTotal: list.length,
      sidebarDone: done,
    };
  } catch {
    return {
      publishedFromDb: [],
      sidebarTotal: 0,
      sidebarDone: 0,
    };
  }
}

export default function LearnLayout() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const [sectionFilter, setSectionFilter] = useState('all');
  const [publishedFromDb, setPublishedFromDb] = useState([]);
  const [sidebarTotal, setSidebarTotal] = useState(0);
  const [sidebarDone, setSidebarDone] = useState(0);
  const [levelProgressMap, setLevelProgressMap] = useState({});

  const userLevelCode = resolveUserLearnCode(user);
  const staffBypass = isStaffUser(user);
  const activeLevelCode = resolveActiveLearnLevelCode(searchParams, user);
  const activeLevelId = jlptCodeToLevelId(activeLevelCode);
  const activeAccessMode = staffBypass
    ? 'study'
    : getLevelAccessMode(activeLevelCode, userLevelCode, levelProgressMap);

  const isLearnIndex = location.pathname === ROUTES.LEARN;

  const applyLearnLayoutSnapshot = useCallback((snap) => {
    setPublishedFromDb(snap.publishedFromDb);
    setSidebarTotal(snap.sidebarTotal);
    setSidebarDone(snap.sidebarDone);
  }, []);

  const reloadLearnLayoutData = useCallback(() => {
    void fetchLearnLayoutSnapshot(isAuthenticated, activeLevelId).then(applyLearnLayoutSnapshot);
    if (isAuthenticated) {
      void fetchMyProgressSummary()
        .then((data) => {
          const byLevel = data?.byLevel ?? data?.ByLevel ?? [];
          setLevelProgressMap(buildLevelProgressMap(byLevel));
        })
        .catch(() => setLevelProgressMap({}));
    } else {
      setLevelProgressMap({});
    }
  }, [isAuthenticated, activeLevelId, applyLearnLayoutSnapshot]);

  useEffect(() => {
    let cancelled = false;
    void fetchLearnLayoutSnapshot(isAuthenticated, activeLevelId).then((snap) => {
      if (cancelled) return;
      applyLearnLayoutSnapshot(snap);
    });
    if (isAuthenticated) {
      void fetchMyProgressSummary()
        .then((data) => {
          if (cancelled) return;
          const byLevel = data?.byLevel ?? data?.ByLevel ?? [];
          setLevelProgressMap(buildLevelProgressMap(byLevel));
        })
        .catch(() => {
          if (!cancelled) setLevelProgressMap({});
        });
    } else {
      setLevelProgressMap({});
    }
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, activeLevelId, applyLearnLayoutSnapshot]);

  useEffect(() => {
    if (staffBypass) return;
    if (!isAuthenticated) {
      if (activeLevelCode !== 'N5') {
        navigate(learnRouteWithJlpt(location.pathname, 'N5'), { replace: true });
      }
      return;
    }
    if (!canViewLearnLevel(activeLevelCode, userLevelCode, levelProgressMap)) {
      navigate(learnRouteWithJlpt(location.pathname, userLevelCode), { replace: true });
    }
  }, [
    staffBypass,
    isAuthenticated,
    activeLevelCode,
    userLevelCode,
    levelProgressMap,
    location.pathname,
    navigate,
  ]);

  const levelLessons = useMemo(
    () =>
      publishedFromDb.filter((row) => Number(row.levelId ?? row.LevelId) === activeLevelId),
    [publishedFromDb, activeLevelId],
  );

  const lessonNavList = useMemo(
    () =>
      sortLearnLessons(
        levelLessons
          .map((row) => ({
            ...dbLessonToNavItem(row),
            categoryId: row.categoryId ?? row.CategoryId ?? 0,
          }))
          .filter((x) => x.slug),
      ),
    [levelLessons],
  );

  const lessonGroups = useMemo(
    () => buildLessonGroupsFromDb(levelLessons, SECTION_ORDER),
    [levelLessons],
  );

  const visibleDbLessons = useMemo(() => [], []);

  const visibleGroups = useMemo(
    () =>
      sectionFilter === 'all'
        ? lessonGroups
        : lessonGroups.filter((g) => g.section === sectionFilter),
    [lessonGroups, sectionFilter],
  );

  const sidebarPct = sidebarTotal ? Math.round((sidebarDone / sidebarTotal) * 100) : 0;
  const displayName =
    user?.displayName?.trim() ||
    user?.username ||
    user?.email?.split('@')[0] ||
    'Học viên';

  function switchLearnLevel(code) {
    if (!staffBypass && isAuthenticated) {
      if (!canViewLearnLevel(code, userLevelCode, levelProgressMap)) return;
    } else if (!isAuthenticated && code !== 'N5') {
      return;
    }
    const target = learnRouteWithJlpt(isLearnIndex ? ROUTES.LEARN : location.pathname, code);
    navigate(target);
  }

  function goFilter(key) {
    setSectionFilter(key);
    const target = learnRouteWithJlpt(isLearnIndex ? ROUTES.LEARN : location.pathname, activeLevelCode);
    if (!isLearnIndex) navigate(target);
  }

  return (
    <div className="page learn-layout learn-layout--shodo yume-page learn-layout--crimson-blossom">
      <SakuraRainLayer petalCount={22} />
      <div className="learn-layout__blossom-content">
        <div className="learn-layout__grid learn-layout__grid--shodo">
        <LearnSidebarShell
          user={user}
          displayName={displayName}
          isAuthenticated={isAuthenticated}
          sidebarPct={sidebarPct}
          sidebarDone={sidebarDone}
          sidebarTotal={sidebarTotal}
          sectionFilter={sectionFilter}
          goFilter={goFilter}
          lessonGroups={lessonGroups}
          visibleGroups={visibleGroups}
          visibleDbLessons={visibleDbLessons}
          activeLevelCode={activeLevelCode}
          userLevelCode={userLevelCode}
          levelProgressMap={levelProgressMap}
          onSwitchLevel={switchLearnLevel}
          staffBypass={staffBypass}
        />

        <main className="learn-layout__main learn-layout__main--shodo">
          <AnimatePresence mode="wait" initial={false}>
            <Motion.div
              key={location.pathname}
              className="learn-layout__outlet-motion"
              initial={reduceMotion ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
              transition={{
                duration: reduceMotion ? 0.05 : 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Outlet
                context={{
                  reloadSidebarProgress: reloadLearnLayoutData,
                  sectionFilter,
                  goFilter,
                  lessonNavList,
                  activeLevelCode,
                  activeLevelId,
                  activeAccessMode,
                  userLevelCode,
                  levelProgressMap,
                  staffBypass,
                }}
              />
            </Motion.div>
          </AnimatePresence>
        </main>
        </div>
        <LearnAiWidget isAuthenticated={isAuthenticated} />
      </div>
    </div>
  );
}
