import { Fragment } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ROUTES } from '../../../data/routes';
import {
  LEARN_JLPT_LEVELS,
  getLevelAccessMode,
  learnRouteWithJlpt,
} from '../../../utils/learnLevelAccess';
import { BookUp, SpellCheck, Languages, MessageSquareText, Layers, BookA } from 'lucide-react';
import { ViJaHoverText } from '../../../components/learn/ViJaHoverText';
import { sectionJaLabelFor } from '../../../data/learnUiJapanese';

function IconRoadmap({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChar({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 19.5A2.5 2.5 0 016.5 17H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M10 8h4M12 6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconGrammar({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconKanji({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconChat({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6a3 3 0 013-3h10a3 3 0 013 3v8a3 3 0 01-3 3h-2l-4 3v-3H7a3 3 0 01-3-3V6z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconLock({ className }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 11V8a5 5 0 0110 0v3M6 11h12v10H6V11z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCheck({ className }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Một thẻ trong cột sidebar (mẫu Hanami: nhiều khối bo góc tách nhau) */
function ShellCard({ variant, children }) {
  return <div className={`learn-shell-card learn-shell-card--${variant}`}>{children}</div>;
}

const JLPT_LEVELS = LEARN_JLPT_LEVELS;

function LessonListSection({ sectionFilter, goFilter, lessonGroups, visibleGroups, visibleDbLessons, activeLevelCode }) {
  return (
    <ShellCard variant="lessons">
      <div className="learn-nav__group-label learn-sidebar__list-label">
        <ViJaHoverText ja="レッスン一覧">Danh sách bài</ViJaHoverText>
      </div>
      <div className="learn-nav__tabs learn-nav__tabs--shell" role="tablist" aria-label="Lọc theo nhóm">
        <button
          type="button"
          role="tab"
          aria-selected={sectionFilter === 'all'}
          className={`learn-nav__tab${sectionFilter === 'all' ? ' learn-nav__tab--active' : ''}`}
          onClick={() => goFilter('all')}
        >
          <ViJaHoverText ja="すべて">Tất cả</ViJaHoverText>
        </button>
        {lessonGroups.map((g) => (
          <button
            key={g.section}
            type="button"
            role="tab"
            aria-selected={sectionFilter === g.section}
            className={`learn-nav__tab${sectionFilter === g.section ? ' learn-nav__tab--active' : ''}`}
            onClick={() => goFilter(g.section)}
          >
            <ViJaHoverText ja={sectionJaLabelFor(g.section, activeLevelCode)}>{g.label}</ViJaHoverText>
          </button>
        ))}
      </div>
      <div className="learn-sidebar__scroll">
        {visibleGroups.map((group) => (
          <Fragment key={group.section}>
            {sectionFilter === 'all' ? (
              <div className="learn-nav__section-label">
                <ViJaHoverText ja={sectionJaLabelFor(group.section, activeLevelCode)}>
                  {group.label}
                </ViJaHoverText>
              </div>
            ) : null}
            <ul className="learn-nav__list learn-nav__list--section">
              {group.items.map((lesson) => (
                <li key={lesson.slug}>
                  <NavLink
                    to={learnRouteWithJlpt(`${ROUTES.LEARN}/${lesson.slug}`, activeLevelCode)}
                    className={({ isActive }) => `learn-nav__link${isActive ? ' learn-nav__link--active' : ''}`}
                    end
                  >
                    <span className="learn-nav__text">{lesson.navTitle}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </Fragment>
        ))}
        {visibleDbLessons.length > 0 ? (
          <>
            <div className="learn-nav__section-label learn-nav__section-label--db">
              <ViJaHoverText ja="システムのレッスン">Bài từ hệ thống</ViJaHoverText>
            </div>
            <ul className="learn-nav__list learn-nav__list--section">
              {visibleDbLessons.map((row) => {
                const slug = row.slug ?? row.Slug;
                const title = row.title ?? row.Title;
                const cat = row.categoryName ?? row.CategoryName;
                return (
                  <li key={row.id ?? row.Id}>
                    <NavLink
                      to={learnRouteWithJlpt(`${ROUTES.LEARN}/${encodeURIComponent(slug)}`, activeLevelCode)}
                      className={({ isActive }) =>
                        `learn-nav__link learn-nav__link--stack${isActive ? ' learn-nav__link--active' : ''}`
                      }
                      end
                    >
                      <span className="learn-nav__db-meta">{cat}</span>
                      <span className="learn-nav__text">{title}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </div>
    </ShellCard>
  );
}

/**
 * Cột trái trang Học — thứ tự (trên → dưới):
 * 1) Tiến độ học viên  2) JLPT  3) Phân loại + lộ trình  4) Danh sách bài  5) Thử thách tuần
 */
export function LearnSidebarShell({
  user,
  displayName,
  isAuthenticated,
  sidebarPct,
  sidebarDone,
  sidebarTotal,
  sectionFilter,
  goFilter,
  lessonGroups,
  visibleGroups,
  visibleDbLessons,
  activeLevelCode,
  userLevelCode,
  levelProgressMap,
  onSwitchLevel,
  staffBypass = false,
}) {
  const viewing = String(activeLevelCode || userLevelCode).toUpperCase();

  return (
    <aside className="learn-layout__nav learn-sidebar learn-sidebar--shell" aria-label="Điều hướng khóa học">
      <div className="learn-shell-stack">
        <ShellCard variant="user">
          <Link className="learn-sidebar__back" to={ROUTES.DASHBOARD}>
            ← <ViJaHoverText ja="ダッシュボードへ">Về bảng điều khiển</ViJaHoverText>
          </Link>
          <div className="learn-shell-user">
            <div className="learn-shell-user__name">{displayName}</div>
            <div className="learn-shell-user__line">
              <ViJaHoverText ja="学習者">Học viên</ViJaHoverText> — <strong>JLPT {userLevelCode}</strong>
              {isAuthenticated && sidebarTotal > 0 ? (
                <>
                  {' '}
                  — {sidebarPct}% ({sidebarDone}/{sidebarTotal})
                </>
              ) : null}
            </div>
            <div className="learn-shell-user__bar" aria-hidden>
              <div
                className="learn-shell-user__fill"
                style={{ width: `${isAuthenticated && sidebarTotal ? sidebarPct : 0}%` }}
              />
            </div>
          </div>
        </ShellCard>

        <ShellCard variant="jlpt">
          <div className="learn-shell-jlpt" role="group" aria-label="Chọn cấp JLPT">
            {JLPT_LEVELS.map((code) => {
              const access = staffBypass
                ? 'study'
                : getLevelAccessMode(code, userLevelCode, levelProgressMap);
              const isViewing = code === viewing;
              const isProfile = code === userLevelCode;
              const locked = access === 'locked';
              const review = access === 'review';

              let mod = 'learn-shell-jlpt__item--future';
              if (locked) mod = 'learn-shell-jlpt__item--locked';
              else if (isViewing) mod = 'learn-shell-jlpt__item--viewing';
              else if (isProfile) mod = 'learn-shell-jlpt__item--current';
              else if (review) mod = 'learn-shell-jlpt__item--done';

              const title = locked
                ? `Hoàn thành ${userLevelCode} để mở ${code}`
                : review
                  ? `Ôn tập ${code}`
                  : isProfile
                    ? `Đang học ${code}`
                    : `Xem ${code}`;

              return (
                <button
                  key={code}
                  type="button"
                  className={`learn-shell-jlpt__item learn-shell-jlpt__btn ${mod}${isViewing ? ' learn-shell-jlpt__btn--active' : ''}`}
                  disabled={locked}
                  title={title}
                  aria-pressed={isViewing}
                  aria-label={title}
                  onClick={() => onSwitchLevel?.(code)}
                >
                  <span className="learn-shell-jlpt__code">{code}</span>
                  {review ? <IconCheck className="learn-shell-jlpt__ico" /> : null}
                  {locked ? <IconLock className="learn-shell-jlpt__ico" /> : null}
                </button>
              );
            })}
          </div>
        </ShellCard>

        <ShellCard variant="filters">
          <div className="learn-shell-cats-label">
            <ViJaHoverText ja="学習カテゴリ">Phân loại học tập</ViJaHoverText>
          </div>
          <nav className="learn-shell-cats" aria-label="Lọc theo dạng bài">
            <button type="button" className={`learn-shell-cats__btn${sectionFilter === 'alphabet' ? ' learn-shell-cats__btn--active' : ''}`} onClick={() => goFilter('alphabet')}>
              <BookA size={20} />
              <ViJaHoverText ja="文字表">Bảng chữ cái</ViJaHoverText>
            </button>
            <button
              type="button"
              className={`learn-shell-cats__btn${sectionFilter === 'vocab' ? ' learn-shell-cats__btn--active' : ''}`}
              onClick={() => goFilter('vocab')}
            >
              <BookUp size={20} />
              <ViJaHoverText ja="語彙">Từ vựng</ViJaHoverText>
            </button>
            <button
              type="button"
              className={`learn-shell-cats__btn${sectionFilter === 'grammar' ? ' learn-shell-cats__btn--active' : ''}`}
              onClick={() => goFilter('grammar')}
            >
              <SpellCheck size={20} />
              <ViJaHoverText ja="文法">Ngữ pháp</ViJaHoverText>
            </button>
            <button
              type="button"
              className={`learn-shell-cats__btn${sectionFilter === 'kanji' ? ' learn-shell-cats__btn--active' : ''}`}
              onClick={() => goFilter('kanji')}
            >
              <Languages size={20} />
              <ViJaHoverText ja="漢字">Kanji</ViJaHoverText>
            </button>
            <button
              type="button"
              className={`learn-shell-cats__btn${sectionFilter === 'dialogue' ? ' learn-shell-cats__btn--active' : ''}`}
              onClick={() => goFilter('dialogue')}
            >
              <MessageSquareText size={20} />
              <ViJaHoverText ja="会話">Hội thoại</ViJaHoverText>
            </button>
          </nav>
          <NavLink
            to={learnRouteWithJlpt(ROUTES.LEARN, activeLevelCode)}
            end
            className={({ isActive }) => `learn-shell-roadmap${isActive ? ' learn-shell-roadmap--active' : ''}`}
          >
            <Layers size={20} />
            <ViJaHoverText ja="学習ロードマップ">Lộ trình tổng quan</ViJaHoverText>
          </NavLink>
        </ShellCard>

        <LessonListSection
          sectionFilter={sectionFilter}
          goFilter={goFilter}
          lessonGroups={lessonGroups}
          visibleGroups={visibleGroups}
          visibleDbLessons={visibleDbLessons}
          activeLevelCode={activeLevelCode}
        />

        <ShellCard variant="weekly">
          <Link className="learn-shell-weekly" to={`${ROUTES.PLAY}/daily`}>
            <span className="learn-shell-weekly__kicker">
              <ViJaHoverText ja="週間チャレンジ">Thử thách hàng tuần</ViJaHoverText>
            </span>
            <span className="learn-shell-weekly__title">
              <ViJaHoverText ja="クイック復習・XP獲得">Ôn nhanh · nhận XP</ViJaHoverText>
            </span>
            <span className="learn-shell-weekly__go">
              <ViJaHoverText ja="チャレンジへ">Vào thử thách</ViJaHoverText> →
            </span>
          </Link>
        </ShellCard>
      </div>
    </aside>
  );
}
