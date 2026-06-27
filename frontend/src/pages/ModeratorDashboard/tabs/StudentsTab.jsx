import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';
import { moderationService } from '../../../services/moderationService';
import { modLevelOptions } from '../mockModerator';

function levelMeta(code) {
  const o = modLevelOptions.find((x) => x.code === code);
  return o || modLevelOptions[0];
}

function mapStaffLearnerToRow(api) {
  const userId = api.userId ?? api.UserId;
  const levelIdRaw = api.levelId ?? api.LevelId;
  const levelId = levelIdRaw === null || levelIdRaw === undefined ? null : Number(levelIdRaw);
  const levelCodeRaw = api.levelCode ?? api.LevelCode;
  const levelCode = levelCodeRaw != null ? String(levelCodeRaw).toUpperCase() : null;
  const levelName = api.levelName ?? api.LevelName;

  const opt =
    (Number.isFinite(levelId) ? modLevelOptions.find((o) => o.levelId === levelId) : null) ||
    (levelCode ? modLevelOptions.find((o) => o.code === levelCode) : null);

  const levelLabel =
    opt?.label || (levelName && levelCode ? `${levelCode} — ${levelName}` : levelName) || 'Chưa xếp loại';
  const levelTone =
    opt?.tone ??
    (levelId === 1 ? 'n5' : levelId === 2 ? 'n4' : levelId === 3 ? 'n3' : 'none');

  const displayName = String(api.displayName ?? api.DisplayName ?? '').trim();
  const username = api.username ?? api.Username ?? '—';
  const name = displayName || username || `User #${userId}`;
  const created = api.createdAt ?? api.CreatedAt;

  return {
    userId,
    name,
    sid: `HV-${userId}`,
    username,
    email: api.email ?? api.Email ?? '—',
    levelId: Number.isFinite(levelId) ? levelId : null,
    levelCode: opt?.code ?? levelCode,
    levelLabel,
    levelTone,
    joinedAt: created
      ? new Date(created).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : '—',
  };
}

const LEVEL_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả cấp độ' },
  { value: 'n5', label: 'N5 — Sơ cấp' },
  { value: 'n4', label: 'N4 — Trung cấp' },
  { value: 'n3', label: 'N3 — Nâng cao' },
  { value: 'none', label: 'Chưa xếp loại' },
];

export function StudentsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [savingUserId, setSavingUserId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const wrapRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const list = await moderationService.listStaffLearners({ limit: 300 });
      setRows(list.map(mapStaffLearnerToRow));
    } catch (e) {
      setErr(e?.message || 'Không tải danh sách học viên (cần JWT moderator/admin).');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!openId) return undefined;
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpenId(null);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openId]);

  const legend = useMemo(
    () => [
      { tone: 'n5', label: 'N5 — Sơ cấp' },
      { tone: 'n4', label: 'N4 — Trung cấp' },
      { tone: 'n3', label: 'N3 — Nâng cao' },
      { tone: 'none', label: 'Chưa xếp loại' },
    ],
    [],
  );

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((s) => {
      if (levelFilter && s.levelTone !== levelFilter) return false;
      if (!q) return true;
      const hay = [s.name, s.username, s.email, s.sid].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [rows, searchQuery, levelFilter]);

  const hasActiveFilters = Boolean(searchQuery.trim() || levelFilter);

  function clearFilters() {
    setSearchQuery('');
    setLevelFilter('');
  }

  async function applyLevel(userId, levelId, patchRow) {
    setSavingUserId(userId);
    setErr(null);
    try {
      await moderationService.patchLearnerLevel(userId, levelId);
      setRows((prev) => prev.map((s) => (s.userId === userId ? { ...s, ...patchRow } : s)));
      setOpenId(null);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.Message ||
        e?.message ||
        'Không cập nhật được cấp độ.';
      setErr(msg);
    } finally {
      setSavingUserId(null);
    }
  }

  function setLevel(userId, code) {
    const meta = levelMeta(code);
    return applyLevel(userId, meta.levelId, {
      levelId: meta.levelId,
      levelCode: meta.code,
      levelLabel: meta.label,
      levelTone: meta.tone,
    });
  }

  function clearLevel(userId) {
    return applyLevel(userId, null, {
      levelId: null,
      levelCode: null,
      levelLabel: 'Chưa xếp loại',
      levelTone: 'none',
    });
  }

  function levelIdDisplay(levelId) {
    if (levelId === null || levelId === undefined) return '—';
    return String(levelId);
  }

  return (
    <div className="mod-dash__panel mod-dash__panel--students">
      <div className="mod-dash__panel-head">
        <div className="mod-dash__panel-head-text">
          <h2 className="mod-dash__panel-title">Quản lý học viên</h2>
          <p className="mod-dash__panel-desc">
            Tìm kiếm, lọc theo cấp JLPT và điều chỉnh trình độ học viên.
          </p>
        </div>
      </div>

      <div className="mod-dash__toolbar" role="search">
        <div className="mod-dash__toolbar-search">
          <Search className="mod-dash__toolbar-search-ico" size={16} aria-hidden />
          <input
            type="search"
            className="mod-dash__toolbar-input"
            placeholder="Tìm tên, email, mã HV…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Tìm học viên"
          />
          {searchQuery ? (
            <button
              type="button"
              className="mod-dash__toolbar-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Xóa tìm kiếm"
            >
              <X size={14} aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="mod-dash__toolbar-filters">
          <label className="mod-dash__toolbar-select-wrap">
            <SlidersHorizontal size={14} aria-hidden className="mod-dash__toolbar-select-ico" />
            <select
              className="mod-dash__toolbar-select"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              aria-label="Lọc theo cấp độ"
            >
              {LEVEL_FILTER_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {hasActiveFilters ? (
            <button type="button" className="mod-dash__toolbar-chip" onClick={clearFilters}>
              <X size={12} aria-hidden />
              Xóa lọc
            </button>
          ) : null}
        </div>

        <div className="mod-dash__toolbar-actions">
          <span className="mod-dash__toolbar-meta">
            {loading ? 'Đang tải…' : `${filteredRows.length} / ${rows.length} học viên`}
          </span>
          <button
            type="button"
            className="mod-dash__btn mod-dash__btn--toolbar"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={15} aria-hidden className={loading ? 'mod-dash__spin' : undefined} />
            Làm mới
          </button>
        </div>
      </div>

      {err ? (
        <p className="mod-dash__inline-hint mod-dash__inline-hint--warn" role="status">
          {err}
        </p>
      ) : null}

      <div className="mod-dash__table-wrap mod-dash__table-wrap--students" ref={wrapRef}>
        <table className="mod-dash__table mod-dash__table--students">
          <thead>
            <tr>
              <th>Học viên</th>
              <th>Tên đăng nhập</th>
              <th>Email</th>
              <th>Cấp độ</th>
              <th>Ngày tham gia</th>
              <th className="mod-dash__th-actions">Điều chỉnh</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="mod-dash__table-empty">
                  {rows.length === 0 ? (
                    <>
                      Chưa có học viên (role <code className="mod-dash__code">user</code>) trong hệ thống.
                    </>
                  ) : (
                    <>Không có học viên khớp bộ lọc. Thử đổi từ khóa hoặc cấp độ.</>
                  )}
                </td>
              </tr>
            ) : null}
            {filteredRows.map((s) => (
              <tr key={s.userId}>
                <td>
                  <div className="mod-dash__person">
                    <span className="mod-dash__avatar">{String(s.name).slice(0, 1).toUpperCase()}</span>
                    <div>
                      <div className="mod-dash__person-name">{s.name}</div>
                      <div className="mod-dash__subtle">{s.sid}</div>
                    </div>
                  </div>
                </td>
                <td className="mod-dash__mono">{s.username}</td>
                <td className="mod-dash__td-email">{s.email}</td>
                <td>
                  <span className={`mod-dash__level mod-dash__level--${s.levelTone}`}>{s.levelLabel}</span>
                  <span className="mod-dash__level-id-hint" title="level_id trong database">
                    id {levelIdDisplay(s.levelId)}
                  </span>
                </td>
                <td className="mod-dash__mono">{s.joinedAt}</td>
                <td>
                  <div className="mod-dash__action-cell">
                    <button
                      type="button"
                      className="mod-dash__btn mod-dash__btn--outline mod-dash__btn--sm"
                      onClick={() => setOpenId((x) => (x === s.userId ? null : s.userId))}
                      aria-expanded={openId === s.userId}
                      disabled={savingUserId === s.userId}
                    >
                      Chỉnh cấp độ ▾
                    </button>
                    {openId === s.userId ? (
                      <div className="mod-dash__action-menu mod-dash__action-menu--wide" role="menu">
                        {modLevelOptions.map((opt) => (
                          <button
                            key={opt.code}
                            type="button"
                            className="mod-dash__action-item mod-dash__action-item--stack"
                            role="menuitem"
                            disabled={savingUserId === s.userId}
                            onClick={() => setLevel(s.userId, opt.code)}
                          >
                            <span>
                              <strong>
                                {opt.label}
                                {s.levelCode === opt.code ? ' ✓' : ''}
                              </strong>
                              <small>
                                {opt.sub} · level_id = {opt.levelId}
                              </small>
                            </span>
                          </button>
                        ))}
                        <div className="mod-dash__menu-sep" />
                        <button
                          type="button"
                          className="mod-dash__action-item mod-dash__action-item--muted"
                          role="menuitem"
                          disabled={savingUserId === s.userId}
                          onClick={() => clearLevel(s.userId)}
                        >
                          <span>
                            <strong>Gỡ gán cấp</strong>
                            <small>Đặt level_id = NULL (chưa xếp loại)</small>
                          </span>
                        </button>
                        <div className="mod-dash__menu-sep" />
                        <button type="button" className="mod-dash__action-item mod-dash__action-item--muted" role="menuitem">
                          <span>
                            <strong>Reset bài test xếp loại</strong>
                            <small>Chưa nối API — có thể bổ sung sau</small>
                          </span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mod-dash__legend">
        <span className="mod-dash__legend-title">Chú thích cấp độ:</span>
        {legend.map((l) => (
          <span key={l.label} className="mod-dash__legend-item">
            <span className={`mod-dash__dot mod-dash__dot--${l.tone}`} aria-hidden />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
