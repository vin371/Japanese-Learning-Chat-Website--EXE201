import { useEffect, useMemo, useState } from 'react';
import { motion as motionFr, useReducedMotion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { SakuraRainLayer } from '../components/effects/SakuraRainLayer';
import http, { ENV } from '../api/client';
import { authService } from '../services/authService';
import { PremiumBadge } from '../components/profile/PremiumBadge';
import { userIsPremium } from '../utils/userPremium';
import { fetchMyProgressSummary } from '../services/learningProgressService';
import { socialService } from '../services/socialService';
import { Tooltip } from '../components/system/Tooltip';

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj != null && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function accountLevelTitle(code) {
  const c = String(code || 'N5').toUpperCase();
  const map = {
    N5: 'N5 Sơ cấp',
    N4: 'N4 Trung cấp',
    N3: 'N3 Trung cao',
    N2: 'N2 Cao cấp',
    N1: 'N1 Thành thạo',
  };
  return map[c] || `${c} — Học viên`;
}

function buildImageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const origin = ENV.API_URL || '';
  return `${origin}${path}`;
}

const Motion = motionFr;

function formatIntVi(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0';
  const v = Math.round(Math.abs(x));
  const signed = x < 0 ? '-' : '';
  const s = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return signed + s;
}

function aggregateLessonProgress(byLevel) {
  const rows = Array.isArray(byLevel) ? byLevel : [];
  let completed = 0;
  let total = 0;
  for (const row of rows) {
    completed += Number(pick(row, 'completedLessons', 'CompletedLessons') ?? 0) || 0;
    total += Number(pick(row, 'totalPublishedLessons', 'TotalPublishedLessons') ?? 0) || 0;
  }
  const safeDone = Math.min(completed, Math.max(total, 0));
  const pct = total > 0 ? Math.min(100, Math.round((safeDone / total) * 100)) : 0;
  return { completed, total, pct };
}

const hanamiEase = [0.22, 1, 0.36, 1];

function hanamiVariants(reduceMotion) {
  if (reduceMotion) {
    const z = { hidden: {}, show: {} };
    return { root: z, main: z, block: z };
  }
  return {
    root: {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { duration: 0.35, ease: hanamiEase, staggerChildren: 0.12, delayChildren: 0.04 },
      },
    },
    main: {
      hidden: {},
      show: {
        transition: { staggerChildren: 0.1, delayChildren: 0.06 },
      },
    },
    block: {
      hidden: { opacity: 0, y: 26 },
      show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: hanamiEase } },
    },
  };
}

export default function AccountPage() {
  const { user, setUser } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl ? buildImageUrl(user.avatarUrl) : '');
  const [avatarFileError, setAvatarFileError] = useState('');

  const [coverPreview, setCoverPreview] = useState('');
  const [progressSummary, setProgressSummary] = useState(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [friendsCount, setFriendsCount] = useState(null);
  const [coverFileError, setCoverFileError] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [profileTab, setProfileTab] = useState('info');

  const [profileForm, setProfileForm] = useState({
    displayName: '',
    bio: '',
    dateOfBirth: '',
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');

  const displayName = useMemo(
    () => user?.displayName || user?.username || user?.name || user?.email?.split('@')[0] || 'Học viên',
    [user]
  );

  const username = user?.username || user?.email || '';
  const email = user?.email || '';
  let levelCode = String(user?.levelCode || user?.level || '').toUpperCase() || '';
  const rawLevelId = user?.levelId ?? user?.LevelId ?? null;
  if (!levelCode && rawLevelId != null) {
    const idNum = Number(rawLevelId);
    if (idNum === 1) levelCode = 'N5';
    else if (idNum === 2) levelCode = 'N4';
    else if (idNum === 3) levelCode = 'N3';
  }
  levelCode = levelCode || 'N5';
  const avatarInitial = (displayName || 'U').trim().slice(0, 2).toUpperCase();
  const isPremium = useMemo(() => userIsPremium(user), [user]);
  const levelTitle = accountLevelTitle(levelCode);
  const reduceMotion = useReducedMotion();
  const hanamiV = useMemo(() => hanamiVariants(!!reduceMotion), [reduceMotion]);

  const levelCompletionPct = useMemo(() => {
    const byLevel = progressSummary?.byLevel ?? progressSummary?.ByLevel ?? [];
    const row = byLevel.find(
      (r) => String(pick(r, 'levelCode', 'LevelCode') || '').toUpperCase() === levelCode
    );
    return Math.min(100, Math.round(Number(pick(row, 'completionPercent', 'CompletionPercent')) || 0));
  }, [progressSummary, levelCode]);

  const journeyAgg = useMemo(() => {
    const by = progressSummary?.byLevel ?? progressSummary?.ByLevel ?? [];
    return aggregateLessonProgress(by);
  }, [progressSummary]);

  const accountExp = useMemo(() => {
    const u = Number(pick(user, 'exp', 'Exp') ?? 0) || 0;
    const s = Number(pick(progressSummary, 'exp', 'Exp') ?? 0) || 0;
    return Math.max(u, s);
  }, [user, progressSummary]);

  useEffect(() => {
    const url = user?.avatarUrl ? buildImageUrl(user.avatarUrl) : '';
    setAvatarPreview(url);
    setAvatarFileError('');
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      try {
        const profile = await authService.getMyProfile();
        if (!profile || cancelled) return;
        const prem = profile.isPremium ?? profile.IsPremium;
        const coverPath = profile.coverUrl ?? profile.CoverUrl;
        setCoverPreview(coverPath ? buildImageUrl(coverPath) : '');
        if (profile.avatarUrl) {
          setAvatarPreview(buildImageUrl(profile.avatarUrl));
        }

        setProfileForm({
          displayName: profile.displayName || profile.DisplayName || '',
          bio: profile.bio || profile.Bio || '',
          dateOfBirth: profile.dateOfBirth || profile.DateOfBirth ? new Date(profile.dateOfBirth || profile.DateOfBirth).toISOString().split('T')[0] : '',
        });

        if (user) {
          const updatedUser = {
            ...user,
            ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
            ...(prem !== undefined ? { isPremium: !!prem, IsPremium: !!prem } : {}),
            displayName: profile.displayName || profile.DisplayName || user.displayName,
          };
          setUser(updatedUser);
          authService.setStoredUser(updatedUser);
        }
      } catch {
        /* im lặng */
      }
    }
    void fetchProfile();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.id == null && user?.userId == null) return undefined;
    let cancelled = false;
    (async () => {
      try {
        setProgressLoading(true);
        const data = await fetchMyProgressSummary();
        if (!cancelled) setProgressSummary(data ?? {});
      } catch {
        if (!cancelled) setProgressSummary(null);
      } finally {
        if (!cancelled) setProgressLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await socialService.getFriends();
        if (!cancelled) setFriendsCount(Array.isArray(list) ? list.length : 0);
      } catch {
        if (!cancelled) setFriendsCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarFileError('Vui lòng chọn file hình ảnh.');
      return;
    }
    try {
      setAvatarFileError('');
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await http.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const relativeUrl = uploadRes.data?.url || '';
      const fullUrl = buildImageUrl(relativeUrl);
      setAvatarPreview(fullUrl);

      if (user) {
        try {
          await authService.updateMyProfile({ avatarUrl: relativeUrl });
        } catch {
          /* giữ preview */
        }

        const updatedUser = { ...user, avatarUrl: relativeUrl };
        setUser(updatedUser);
        authService.setStoredUser(updatedUser);
      }
    } catch {
      setAvatarFileError('Không upload được avatar. Vui lòng thử lại.');
    }
  };

  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCoverFileError('Chỉ chọn file ảnh (JPG, PNG, WebP…).');
      return;
    }
    try {
      setCoverFileError('');
      setCoverUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await http.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const relativeUrl = uploadRes.data?.url || '';
      if (!relativeUrl) throw new Error('no url');
      await authService.updateMyProfile({ coverUrl: relativeUrl });
      setCoverPreview(buildImageUrl(relativeUrl));
    } catch {
      setCoverFileError('Không tải được ảnh bìa. Thử ảnh nhỏ hơn hoặc định dạng khác.');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaveSuccess(false);
    setProfileSaveError('');
    try {
      const dob = profileForm.dateOfBirth ? new Date(profileForm.dateOfBirth).toISOString() : null;
      await authService.updateMyProfile({
        displayName: profileForm.displayName,
        bio: profileForm.bio,
        dateOfBirth: dob,
      });
      if (user) {
        const updatedUser = { ...user, displayName: profileForm.displayName };
        setUser(updatedUser);
        authService.setStoredUser(updatedUser);
      }
      setProfileSaveSuccess(true);
      setIsEditingProfile(false);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch {
      setProfileSaveError('Không thể lưu thông tin. Vui lòng kiểm tra lại.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!coverPreview) return;
    if (!window.confirm('Bỏ ảnh bìa và dùng nền gradient mặc định?')) return;
    try {
      setCoverFileError('');
      setCoverUploading(true);
      await authService.updateMyProfile({ coverUrl: '' });
      setCoverPreview('');
    } catch {
      setCoverFileError('Không xóa được ảnh bìa. Thử lại sau.');
    } finally {
      setCoverUploading(false);
    }
  };

  const streakUi = Number(pick(progressSummary, 'streakDays', 'StreakDays') ?? 0) || 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 lg:py-10 relative z-10">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
        <SakuraRainLayer petalCount={28} buoyant />
      </div>
      <Motion.div
        className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] gap-6 xl:gap-8 items-start relative z-10"
        variants={hanamiV.root}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <Motion.aside className="flex flex-col gap-6" variants={hanamiV.block} aria-label="Tiến độ học">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-700/50 p-5 lg:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
            <div className="flex flex-col items-center mb-5">
              <div
                className="relative w-32 h-32 rounded-full flex items-center justify-center mb-3"
                style={{
                  background: `conic-gradient(#be123c ${levelCompletionPct}%, rgba(15, 23, 42, 0.08) 0)`,
                }}
                aria-hidden
              >
                <div className="absolute inset-2 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-2xl font-black text-rose-700 dark:text-rose-400 leading-none">{progressLoading ? '…' : `${levelCompletionPct}%`}</span>
                  <span className="text-[0.62rem] font-bold text-slate-500 uppercase tracking-widest mt-1 text-center leading-tight">Lộ trình<br />{levelCode}</span>
                </div>
              </div>
              <p className="text-center text-[0.88rem] text-slate-600 dark:text-slate-300 leading-relaxed max-w-[200px] m-0">
                {progressLoading
                  ? 'Đang tải tiến độ…'
                  : journeyAgg.total > 0
                    ? `${formatIntVi(journeyAgg.completed)} / ${formatIntVi(journeyAgg.total)} bài đã xuất bản`
                    : 'Chưa có bài trên lộ trình — vào Học tập để bắt đầu.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/60">
              <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xl font-black text-rose-600 dark:text-rose-400 leading-none mb-1.5">{formatIntVi(streakUi)}</span>
                <span className="text-[0.66rem] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><span aria-hidden>🔥</span> Streak</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none mb-1.5">{formatIntVi(accountExp)}</span>
                <span className="text-[0.66rem] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><span aria-hidden>✨</span> EXP</span>
              </div>
            </div>
          </div>
        </Motion.aside>

        <Motion.div className="flex flex-col gap-6 lg:gap-8 min-w-0" variants={hanamiV.main}>
          <Motion.header
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] overflow-hidden"
            variants={hanamiV.block}
          >
            <div className="relative h-48 sm:h-64 md:h-72 w-full bg-slate-100 dark:bg-slate-800" role="region" aria-label="Ảnh bìa hồ sơ">
              {coverPreview ? (
                <img src={coverPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-rose-100 to-indigo-100 dark:from-rose-950/40 dark:to-indigo-950/40" />
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                {coverPreview ? (
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs font-bold transition-colors"
                    disabled={coverUploading}
                    onClick={() => void handleRemoveCover()}
                  >
                    Nền mặc định
                  </button>
                ) : null}
                <label
                  htmlFor="cover-file"
                  className={`px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white backdrop-blur-md text-slate-800 text-xs font-bold transition-colors cursor-pointer shadow-sm ${coverUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {coverUploading ? 'Đang tải…' : coverPreview ? 'Đổi ảnh bìa' : 'Thêm ảnh bìa'}
                </label>
                <input
                  id="cover-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={coverUploading}
                  onChange={(ev) => void handleCoverFileChange(ev)}
                />
              </div>
              {coverFileError ? <p className="absolute bottom-4 right-4 bg-rose-500/90 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-md m-0 shadow-lg">{coverFileError}</p> : null}
            </div>

            <div className="px-5 sm:px-8 pb-6">
              <div className="relative flex flex-col items-center sm:items-start -mt-16 sm:-mt-20 mb-4 sm:mb-6">
                <div className="relative inline-block mb-3 sm:mb-0">
                  <div
                    className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 ring-4 ring-white dark:ring-slate-900 shadow-xl overflow-hidden ${isPremium ? 'ring-rose-400 dark:ring-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.4)]' : ''}`}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl sm:text-5xl font-black text-slate-300 dark:text-slate-600">{avatarInitial}</span>
                    )}
                  </div>
                  <label htmlFor="avatar-file" className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-9 h-9 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:scale-105 transition-transform" title="Đổi ảnh đại diện">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                  </label>
                  <input
                    id="avatar-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                  {avatarFileError ? <p className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max bg-rose-500 text-white text-[0.7rem] px-2 py-1 rounded shadow-md z-10 m-0">{avatarFileError}</p> : null}
                </div>

                <div className="flex flex-col items-center sm:items-start sm:ml-48 mt-4 sm:-mt-12 w-full">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 m-0">{displayName}</h1>
                    {isPremium ? <PremiumBadge variant="large" /> : null}
                  </div>
                  <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 m-0 shadow-sm">
                    {levelTitle}
                    {isPremium ? <span className="text-rose-600 dark:text-rose-400 ml-1">— Gói Premium</span> : ''}
                  </p>
                </div>
              </div>

              <nav className="flex items-center gap-2 sm:gap-6 border-b border-slate-200 dark:border-slate-700/60 pb-0" aria-label="Hồ sơ">
                <button
                  type="button"
                  role="tab"
                  aria-selected={profileTab === 'info'}
                  className={`relative px-2 sm:px-4 py-3 text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-t-lg ${profileTab === 'info' ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  onClick={() => setProfileTab('info')}
                >
                  <Tooltip content="アカウント情報">Thông tin tài khoản</Tooltip>
                  {profileTab === 'info' && <motionFr.div layoutId="profileTabIndicator" className="absolute bottom-0 left-0 right-0 h-1 bg-rose-600 dark:bg-rose-500 rounded-t-md" />}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={profileTab === 'settings'}
                  className={`relative px-2 sm:px-4 py-3 text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-t-lg ${profileTab === 'settings' ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  onClick={() => setProfileTab('settings')}
                >
                  <Tooltip content="設定">Cài đặt</Tooltip>
                  {profileTab === 'settings' && <motionFr.div layoutId="profileTabIndicator" className="absolute bottom-0 left-0 right-0 h-1 bg-rose-600 dark:bg-rose-500 rounded-t-md" />}
                </button>
              </nav>

              <div className="pt-6">
                {profileTab === 'info' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Motion.article
                      className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col relative overflow-hidden"
                      variants={hanamiV.block}
                      whileHover={reduceMotion ? undefined : { y: -4, scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                    >
                      <div className="text-amber-500 bg-amber-100 dark:bg-amber-900/40 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 4h12v2a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                          <path d="M9 14h6v2H9v-2Z" fill="currentColor" opacity="0.35" />
                          <path d="M8 20h8v2H8v-2Z" fill="currentColor" />
                        </svg>
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1"><Tooltip content='レベル'>Cấp độ</Tooltip></div>
                      <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-3">{levelCode}</div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2" role="progressbar" aria-valuenow={levelCompletionPct} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full bg-amber-500" style={{ width: `${levelCompletionPct}%` }} />
                      </div>
                      <div className="text-xs text-slate-500 font-medium">{progressLoading ? 'Đang tải tiến độ…' : `${levelCompletionPct}% tiến độ`}</div>
                    </Motion.article>

                    <Motion.article
                      className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col relative overflow-hidden"
                      variants={hanamiV.block}
                      whileHover={reduceMotion ? undefined : { y: -4, scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                    >
                      <div className="text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
                          <path d="M4 20v-1a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          <path d="M17 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          <path d="M20 20v-1a3 3 0 0 0-2.1-2.87" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1"><Tooltip content='友達'>Bạn bè</Tooltip></div>
                      <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">{friendsCount === null ? '…' : friendsCount}</div>
                      <div className="mt-auto text-xs text-slate-500 font-medium">Danh sách kết bạn</div>
                    </Motion.article>
                  </div>
                ) : null}

                {profileTab === 'settings' ? (
                  <div className="flex flex-col gap-6">
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 sm:p-8 border border-slate-200 dark:border-slate-700/60 shadow-sm">
                      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200 dark:border-slate-700/60">
                        <h2 className="text-[1.12rem] font-extrabold text-slate-900 dark:text-slate-100 m-0">Cập nhật hồ sơ</h2>
                        {!isEditingProfile && (
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(true)}
                            className="px-4 py-1.5 rounded-lg text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 transition-colors"
                          >
                            <Tooltip content='編集'>Sửa</Tooltip>
                          </button>
                        )}
                      </div>

                      {profileSaveSuccess && (
                        <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                          Cập nhật hồ sơ thành công!
                        </div>
                      )}

                      {!isEditingProfile ? (
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 m-0">
                          <div>
                            <dt className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tên hiển thị</dt>
                            <dd className="m-0 font-bold text-slate-900 dark:text-slate-100 break-all">{profileForm.displayName || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Ngày sinh</dt>
                            <dd className="m-0 font-bold text-slate-900 dark:text-slate-100">{profileForm.dateOfBirth ? new Date(profileForm.dateOfBirth).toLocaleDateString('vi-VN') : '—'}</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Giới thiệu bản thân (Bio)</dt>
                            <dd className="m-0 font-bold text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{profileForm.bio || '—'}</dd>
                          </div>
                        </dl>
                      ) : (
                        <form onSubmit={handleProfileSave} className="flex flex-col gap-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="displayName" className="text-sm font-bold text-slate-700 dark:text-slate-300">Tên hiển thị</label>
                              <input
                                id="displayName"
                                type="text"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-[0.95rem] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
                                placeholder="Nhập tên hiển thị…"
                                value={profileForm.displayName}
                                onChange={(e) => setProfileForm(f => ({ ...f, displayName: e.target.value }))}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="dateOfBirth" className="text-sm font-bold text-slate-700 dark:text-slate-300">Ngày sinh</label>
                              <input
                                id="dateOfBirth"
                                type="date"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
                                value={profileForm.dateOfBirth}
                                onChange={(e) => setProfileForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="bio" className="text-sm font-bold text-slate-700 dark:text-slate-300">Giới thiệu bản thân (Bio)</label>
                            <textarea
                              id="bio"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-[0.95rem] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all resize-y"
                              rows={3}
                              placeholder="Vài dòng về bản thân…"
                              value={profileForm.bio}
                              onChange={(e) => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                            />
                          </div>

                          {profileSaveError && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm font-medium">
                              {profileSaveError}
                            </div>
                          )}

                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingProfile(false)}
                              disabled={profileSaving}
                              className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all"
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              disabled={profileSaving}
                              className={`px-6 py-2.5 rounded-xl font-bold text-white transition-all ${profileSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 shadow-md hover:shadow-lg hover:-translate-y-0.5'}`}
                            >
                              {profileSaving ? 'Đang lưu…' : 'Lưu thay đổi'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 sm:p-8 border border-slate-200 dark:border-slate-700/60 shadow-sm">
                      <h2 className="text-[1.12rem] font-extrabold text-slate-900 dark:text-slate-100 mb-5 pb-3 border-b border-slate-200 dark:border-slate-700/60 m-0">Thông tin đăng nhập</h2>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 m-0">
                        <div>
                          <dt className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email</dt>
                          <dd className="m-0 font-bold text-slate-900 dark:text-slate-100 break-all">{email || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tên đăng nhập</dt>
                          <dd className="m-0 font-bold text-slate-900 dark:text-slate-100 break-all">{username || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Cấp độ JLPT</dt>
                          <dd className="m-0 font-bold text-slate-900 dark:text-slate-100">{levelCode}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </Motion.header>
        </Motion.div>
      </Motion.div>
    </div>
  );
}
