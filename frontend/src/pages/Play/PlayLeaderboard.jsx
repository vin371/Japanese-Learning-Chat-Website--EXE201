import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Gem, Medal, Sparkles, Trophy, Users } from 'lucide-react';
import { ROUTES } from '../../data/routes';
import { useAuth } from '../../hooks/useAuth';
import { fetchExpLeaderboard, fetchLeaderboard, fetchXuLeaderboard } from '../../services/gameService';
import { DASH_ACTION_IMAGES } from '../../data/learnVisualAssets';

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function formatIntVi(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0';
  const v = Math.round(Math.abs(x));
  const signed = x < 0 ? '-' : '';
  return signed + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function rankTone(rank) {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return 'default';
}

function PlayerAvatar({ name, url }) {
  const label = String(name || '?').slice(0, 2).toUpperCase();
  if (url) {
    return <img src={url} alt="" className="play-lb-page__avatar-img" loading="lazy" />;
  }
  return <span className="play-lb-page__avatar-fallback">{label}</span>;
}

function PodiumCard({ row, valueLabel, isMe }) {
  const rank = Number(pick(row, 'rank', 'Rank') ?? 0);
  const name = pick(row, 'displayName', 'DisplayName') || '—';
  const tone = rankTone(rank);
  return (
    <article className={`play-lb-page__podium-slot play-lb-page__podium-slot--${tone}${isMe ? ' play-lb-page__podium-slot--me' : ''}`}>
      <div className="play-lb-page__podium-rank">
        {rank === 1 ? <Crown size={18} /> : <Medal size={16} />}
        <span>#{rank}</span>
      </div>
      <div className="play-lb-page__podium-avatar">
        <PlayerAvatar name={name} url={pick(row, 'avatarUrl', 'AvatarUrl')} />
      </div>
      <strong className="play-lb-page__podium-name" title={name}>
        {name}
        {isMe ? <em> (bạn)</em> : null}
      </strong>
      <span className="play-lb-page__podium-value">{valueLabel}</span>
      <span className="play-lb-page__podium-level">{pick(row, 'levelCode', 'LevelCode') ?? '—'}</span>
    </article>
  );
}

function RankRow({ row, valueLabel, isMe, extra }) {
  const rank = pick(row, 'rank', 'Rank');
  const name = pick(row, 'displayName', 'DisplayName') || '—';
  const tone = rankTone(Number(rank));
  return (
    <li className={`play-lb-page__row play-lb-page__row--${tone}${isMe ? ' play-lb-page__row--me' : ''}`}>
      <span className="play-lb-page__row-rank">#{rank}</span>
      <div className="play-lb-page__row-avatar">
        <PlayerAvatar name={name} url={pick(row, 'avatarUrl', 'AvatarUrl')} />
      </div>
      <div className="play-lb-page__row-main">
        <strong>
          {name}
          {isMe ? <em> (bạn)</em> : null}
        </strong>
        {extra ? <small>{extra}</small> : null}
      </div>
      <span className="play-lb-page__row-value">{valueLabel}</span>
    </li>
  );
}

function AccountBoard({ rows, kind, currentUserId }) {
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  const valueFor = (row) => {
    if (kind === 'xu') {
      return `${formatIntVi(pick(row, 'xu', 'Xu') ?? 0)} xu`;
    }
    return `${formatIntVi(pick(row, 'exp', 'Exp') ?? 0)} XP`;
  };

  const orderPodium = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="play-lb-page__board">
      {top3.length > 0 ? (
        <div className={`play-lb-page__podium play-lb-page__podium--${top3.length}`}>
          {orderPodium.map((row) => {
            const uid = pick(row, 'userId', 'UserId');
            const isMe = currentUserId != null && uid != null && String(uid) === String(currentUserId);
            return (
              <PodiumCard
                key={String(uid ?? pick(row, 'rank', 'Rank'))}
                row={row}
                valueLabel={valueFor(row)}
                isMe={isMe}
              />
            );
          })}
        </div>
      ) : null}

      {rest.length > 0 ? (
        <ol className="play-lb-page__list">
          {rest.map((row) => {
            const uid = pick(row, 'userId', 'UserId');
            const isMe = currentUserId != null && uid != null && String(uid) === String(currentUserId);
            return (
              <RankRow
                key={String(uid ?? pick(row, 'rank', 'Rank'))}
                row={row}
                valueLabel={valueFor(row)}
                isMe={isMe}
                extra={pick(row, 'levelCode', 'LevelCode') ? `JLPT ${pick(row, 'levelCode', 'LevelCode')}` : null}
              />
            );
          })}
        </ol>
      ) : null}

      {rows.length > 0 && top3.length === 0 ? (
        <ol className="play-lb-page__list">
          {rows.map((row) => {
            const uid = pick(row, 'userId', 'UserId');
            const isMe = currentUserId != null && uid != null && String(uid) === String(currentUserId);
            return (
              <RankRow
                key={String(uid ?? pick(row, 'rank', 'Rank'))}
                row={row}
                valueLabel={valueFor(row)}
                isMe={isMe}
                extra={pick(row, 'levelCode', 'LevelCode') ? `JLPT ${pick(row, 'levelCode', 'LevelCode')}` : null}
              />
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}

export default function PlayLeaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('exp');
  const [period, setPeriod] = useState('weekly');
  const [sortBy, setSortBy] = useState('score');
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const gameQuery = useMemo(
    () => ({
      period,
      sortBy,
      friendsOnly,
      gameSlug: null,
      levelId: null,
    }),
    [period, sortBy, friendsOnly],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        let list = [];
        if (tab === 'exp') {
          list = await fetchExpLeaderboard(10);
        } else if (tab === 'xu') {
          list = await fetchXuLeaderboard(10);
        } else {
          list = await fetchLeaderboard(gameQuery);
          list = list.slice(0, 10);
        }
        if (!cancelled) setRows(list);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setErr(
            e?.response?.status === 401
              ? 'Cần đăng nhập để xem bảng bạn bè.'
              : e?.response?.data?.message || e?.message || 'Không tải được bảng xếp hạng.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, gameQuery]);

  const tabMeta = {
    exp: { title: 'Top EXP', sub: 'Điểm kinh nghiệm tích lũy trên tài khoản', icon: Sparkles },
    xu: { title: 'Top Xu', sub: 'Xu kiếm được từ game & thử thách', icon: Gem },
    game: { title: 'Điểm game', sub: 'Xếp hạng theo phiên chơi đã ghi qua server', icon: Trophy },
  };

  const Icon = tabMeta[tab].icon;

  return (
    <div className="play-lb-page">
      <div className="play-lb-page__hero">
        <img className="play-lb-page__hero-bg" src={DASH_ACTION_IMAGES.leaderboard} alt="" aria-hidden />
        <div className="play-lb-page__hero-shade" aria-hidden />
        <div className="play-lb-page__hero-inner">
          <Link className="play-lb-page__back" to={ROUTES.PLAY}>
            ← Trò chơi
          </Link>
          <h1 className="play-lb-page__title">Bảng xếp hạng</h1>
          <p className="play-lb-page__lead">Top 10 học viên — so tài EXP, xu và điểm game mỗi tuần.</p>
        </div>
      </div>

      <div className="play-lb-page__tabs" role="tablist" aria-label="Loại bảng xếp hạng">
        {[
          { id: 'exp', label: 'Top EXP' },
          { id: 'xu', label: 'Top Xu' },
          { id: 'game', label: 'Điểm game' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`play-lb-page__tab${tab === t.id ? ' play-lb-page__tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="play-lb-page__panel">
        <header className="play-lb-page__panel-head">
          <h2>
            <Icon size={20} />
            {tabMeta[tab].title}
          </h2>
          <p>{tabMeta[tab].sub}</p>
        </header>

        {tab === 'game' ? (
          <div className="play-lb-page__filters">
            <label className="play-lb-page__field">
              <span>Kỳ</span>
              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="weekly">Tuần này</option>
                <option value="monthly">Tháng này</option>
              </select>
            </label>
            <label className="play-lb-page__field">
              <span>Sắp xếp</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="score">Điểm cao</option>
                <option value="accuracy">Độ chính xác</option>
                <option value="speed">Tốc độ</option>
              </select>
            </label>
            <label className="play-lb-page__check">
              <input type="checkbox" checked={friendsOnly} onChange={(e) => setFriendsOnly(e.target.checked)} />
              <Users size={15} />
              Chỉ bạn bè
            </label>
          </div>
        ) : null}

        {err ? <div className="play-lb-page__err">{err}</div> : null}
        {loading ? <p className="play-lb-page__muted">Đang tải top 10…</p> : null}

        {!loading && rows.length === 0 && !err ? (
          <div className="play-lb-page__empty">
            <Trophy size={28} strokeWidth={1.6} />
            <p>
              {tab === 'game'
                ? 'Chưa có điểm game trong kỳ này. Chơi Hiragana/Kanji và kết thúc phiên để lên bảng.'
                : 'Chưa có dữ liệu. Hãy học bài và chơi game để tích lũy EXP hoặc xu.'}
            </p>
          </div>
        ) : null}

        {!loading && rows.length > 0 && (tab === 'exp' || tab === 'xu') ? (
          <AccountBoard rows={rows} kind={tab} currentUserId={user?.id} />
        ) : null}

        {!loading && rows.length > 0 && tab === 'game' ? (
          <ol className="play-lb-page__list play-lb-page__list--game">
            {rows.map((row) => {
              const uid = pick(row, 'userId', 'UserId');
              const isMe = user?.id != null && uid != null && String(uid) === String(user.id);
              const name = pick(row, 'displayName', 'DisplayName') || '—';
              const score = formatIntVi(pick(row, 'score', 'Score') ?? 0);
              const acc = Number(pick(row, 'accuracyAvg', 'AccuracyAvg') ?? 0).toFixed(1);
              return (
                <li key={String(uid ?? pick(row, 'rank', 'Rank'))} className={`play-lb-page__row${isMe ? ' play-lb-page__row--me' : ''}`}>
                  <span className="play-lb-page__row-rank">#{pick(row, 'rank', 'Rank')}</span>
                  <div className="play-lb-page__row-avatar">
                    <PlayerAvatar name={name} url={pick(row, 'avatarUrl', 'AvatarUrl')} />
                  </div>
                  <div className="play-lb-page__row-main">
                    <strong>
                      {name}
                      {isMe ? <em> (bạn)</em> : null}
                    </strong>
                    <small>
                      {pick(row, 'levelCode', 'LevelCode') ?? '—'} · {acc}% chính xác · {pick(row, 'gamesPlayed', 'GamesPlayed') ?? 0} trận
                    </small>
                  </div>
                  <span className="play-lb-page__row-value">{score} đ</span>
                </li>
              );
            })}
          </ol>
        ) : null}
      </section>

      <p className="play-lb-page__foot">
        <Link to={`${ROUTES.PLAY}/achievements`}>Xem thành tích →</Link>
      </p>
    </div>
  );
}
