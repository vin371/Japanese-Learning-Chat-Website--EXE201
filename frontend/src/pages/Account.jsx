import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion as motionFr, useReducedMotion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { SakuraRainLayer } from '../components/effects/SakuraRainLayer';
import http, { ENV } from '../api/client';
import { authService } from '../services/authService';
import { PremiumBadge } from '../components/profile/PremiumBadge';
import { userIsPremium } from '../utils/userPremium';
import { fetchMyProgressSummary } from '../services/learningProgressService';
import { socialService } from '../services/socialService';
import { Heart, Laugh, MessageSquare, ThumbsUp } from 'lucide-react';

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

function totalReactionCount(counts) {
  if (!counts || typeof counts !== 'object') return 0;
  return Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

function formatPostVisibilityLine(createdAt) {
  if (!createdAt) return 'Công khai';
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return 'Công khai';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Vừa mới đăng • Công khai';
  if (mins < 60) return `${mins} phút trước • Công khai`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước • Công khai`;
  return `${d.toLocaleDateString('vi-VN')} • Công khai`;
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

function commentCreatedMs(c) {
  const t = new Date(c?.createdAt ?? c?.CreatedAt ?? 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function postCreatedMs(p) {
  const t = new Date(p?.createdAt ?? p?.CreatedAt ?? 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function sortCommentsNewestFirst(list) {
  return [...(Array.isArray(list) ? list : [])].sort((a, b) => commentCreatedMs(b) - commentCreatedMs(a));
}

const HANAMI_MEMORY_SWATCHES = [
  'linear-gradient(135deg, #fecdd3 0%, #fda4af 100%)',
  'linear-gradient(135deg, #bae6fd 0%, #7dd3fc 100%)',
  'linear-gradient(135deg, #e9d5ff 0%, #c4b5fd 100%)',
  'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)',
];

const hanamiEase = [0.22, 1, 0.36, 1];

function hanamiVariants(reduceMotion) {
  if (reduceMotion) {
    const z = { hidden: {}, show: {} };
    return { root: z, main: z, block: z, post: z, feed: z };
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
    post: {
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: hanamiEase } },
    },
    feed: {
      hidden: {},
      show: {
        transition: { staggerChildren: 0.085, delayChildren: 0.03 },
      },
    },
  };
}

function AccountPostSmartComments({ postId, comments, commentInput, onInputChange, onSubmit }) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const sorted = useMemo(() => sortCommentsNewestFirst(comments), [comments]);
  const preview = sorted.slice(0, 3);
  const extra = sorted.slice(3);
  const hasMore = sorted.length > 3;

  return (
    <div className="yume-account__comments yume-account__comments--smart">
      {sorted.length > 0 ? (
        <>
          <ul className="yume-account__comment-list yume-account__comment-list--bubbles">
            {preview.map((c) => {
              const cid = c.id ?? c.Id;
              const author = c.author ?? c.Author ?? {};
              const name =
                pick(author, 'displayName', 'DisplayName') ||
                pick(author, 'username', 'Username') ||
                pick(c, 'authorDisplayName', 'AuthorDisplayName') ||
                'Thành viên';
              const body = c.content ?? c.Content ?? '';
              return (
                <li key={String(cid)} className="yume-account__comment-bubble">
                  <div className="yume-account__comment-bubble__author">{name}</div>
                  <div className="yume-account__comment-bubble__text">{body}</div>
                </li>
              );
            })}
          </ul>
          <AnimatePresence initial={false}>
            {expanded && extra.length > 0 ? (
              <Motion.div
                key={`extra-${postId}`}
                className="yume-account__comment-extra"
                initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.01 : 0.34, ease: hanamiEase }}
                style={{ overflow: 'hidden' }}
              >
                <ul className="yume-account__comment-list yume-account__comment-list--bubbles yume-account__comment-list--extra">
                  {extra.map((c) => {
                    const cid = c.id ?? c.Id;
                    const author = c.author ?? c.Author ?? {};
                    const name =
                      pick(author, 'displayName', 'DisplayName') ||
                      pick(author, 'username', 'Username') ||
                      'Thành viên';
                    const body = c.content ?? c.Content ?? '';
                    return (
                      <li key={String(cid)} className="yume-account__comment-bubble">
                        <div className="yume-account__comment-bubble__author">{name}</div>
                        <div className="yume-account__comment-bubble__text">{body}</div>
                      </li>
                    );
                  })}
                </ul>
              </Motion.div>
            ) : null}
          </AnimatePresence>
          {hasMore ? (
            <button type="button" className="yume-account__comment-toggle" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Thu gọn bình luận' : `Xem tất cả bình luận (${sorted.length})`}
            </button>
          ) : null}
        </>
      ) : null}
      <div className="yume-account__comment-form">
        <input
          type="text"
          placeholder="Viết bình luận…"
          value={commentInput || ''}
          onChange={(e) => onInputChange(postId, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void onSubmit(postId);
            }
          }}
        />
        <button type="button" onClick={() => void onSubmit(postId)}>
          Gửi
        </button>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user, setUser } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl ? buildImageUrl(user.avatarUrl) : '');
  const [avatarFileError, setAvatarFileError] = useState('');

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postError, setPostError] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImageFile, setPostImageFile] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);
  const [postReactions, setPostReactions] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [coverPreview, setCoverPreview] = useState('');
  const [progressSummary, setProgressSummary] = useState(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [friendsCount, setFriendsCount] = useState(null);
  const [coverFileError, setCoverFileError] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const quickEmojis = ['👍', '❤️', '🌸', '🔥'];
  const [profileTab, setProfileTab] = useState('info');

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

  /** Tối đa 4 ô: ưu tiên ảnh bài đăng (mới nhất), sau đó ảnh bìa / avatar nếu còn chỗ — tránh trùng URL. */
  const memoryLaneCells = useMemo(() => {
    const seen = new Set();
    const cells = [];

    const push = (fullUrl, meta) => {
      if (!fullUrl) return false;
      const key = String(fullUrl).replace(/\?.*$/, '');
      if (seen.has(key)) return false;
      seen.add(key);
      cells.push({ src: fullUrl, ...meta });
      return cells.length >= 4;
    };

    const sorted = [...posts].sort((a, b) => postCreatedMs(b) - postCreatedMs(a));
    for (const p of sorted) {
      const path = p.imageUrl ?? p.ImageUrl;
      if (!path) continue;
      if (push(buildImageUrl(path), { kind: 'post', postId: p.id ?? p.Id })) break;
    }
    if (cells.length < 4 && coverPreview) push(coverPreview, { kind: 'cover' });
    if (cells.length < 4 && avatarPreview) push(avatarPreview, { kind: 'avatar' });

    return cells;
  }, [posts, coverPreview, avatarPreview]);

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

        if (user && (profile.avatarUrl || prem !== undefined)) {
          const updatedUser = {
            ...user,
            ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
            ...(prem !== undefined ? { isPremium: !!prem, IsPremium: !!prem } : {}),
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

  const loadMyPosts = async () => {
    try {
      setLoadingPosts(true);
      setPostError('');
      const res = await http.get('/api/social/posts', { params: { limit: 50 } });
      const all = Array.isArray(res.data) ? res.data : [];
      const myId = user?.id ?? user?.userId ?? user?.Id;
      const mine = all.filter((p) => (p.author?.id ?? p.Author?.Id) === myId);
      setPosts(mine);

      const commentsEntries = await Promise.all(
        mine.map(async (p) => {
          const id = p.id ?? p.Id;
          try {
            const commentsRes = await http.get(`/api/social/posts/${id}/comments`, { params: { limit: 50 } });
            const list = Array.isArray(commentsRes.data) ? commentsRes.data : [];
            return [id, list];
          } catch {
            return [id, []];
          }
        })
      );

      const commentsMap = {};
      for (const [pid, list] of commentsEntries) {
        commentsMap[pid] = list;
      }
      setCommentsByPost(commentsMap);
    } catch {
      setPostError('Không tải được bài đăng. Vui lòng thử lại.');
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (user?.id == null && user?.userId == null && user?.Id == null) return undefined;
    void loadMyPosts();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadMyPosts đọc user; gọi lại khi đã đăng nhập
  }, [user?.id, user?.userId, user?.Id]);

  const handlePostImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPostImageFile(null);
      setPostImagePreview('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh cho bài đăng.');
      return;
    }
    setPostImageFile(file);
    setPostImagePreview(URL.createObjectURL(file));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent && !postImageFile) return;
    try {
      setCreatingPost(true);
      setPostError('');

      let imageUrl = null;
      if (postImageFile) {
        const formData = new FormData();
        formData.append('file', postImageFile);
        const uploadRes = await http.post('/api/uploads/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploadRes.data?.url || null;
      }

      const res = await http.post('/api/social/posts', {
        content: postContent || null,
        imageUrl,
      });
      const dto = res.data;
      setPosts((old) => [dto, ...old]);
      setPostContent('');
      setPostImageFile(null);
      setPostImagePreview('');
    } catch {
      setPostError('Không đăng được bài. Vui lòng thử lại.');
    } finally {
      setCreatingPost(false);
    }
  };

  const handleAddEmoji = (emoji) => {
    setPostContent((old) => `${old || ''}${emoji}`);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Xóa bài đăng này?')) return;
    try {
      await http.delete(`/api/social/posts/${postId}`);
      setPosts((old) => old.filter((p) => (p.id ?? p.Id) !== postId));
    } catch {
      alert('Không xóa được bài đăng. Vui lòng thử lại.');
    }
  };

  const handleToggleReactionOnServer = async (postId, emoji) => {
    setPostReactions((old) => {
      const current = old[postId];
      const next = current === emoji ? null : emoji;
      return { ...old, [postId]: next };
    });

    try {
      const res = await http.post(`/api/social/posts/${postId}/reactions/toggle`, { emoji });
      const summary = res.data;
      setPosts((old) =>
        old.map((p) =>
          (p.id ?? p.Id) === postId
            ? {
              ...p,
              reactions: summary,
            }
            : p
        )
      );
    } catch {
      /* im lặng */
    }
  };

  const handleCommentInputChange = (postId, value) => {
    setCommentInputs((old) => ({ ...old, [postId]: value }));
  };

  const handleSubmitComment = async (postId) => {
    const content = (commentInputs[postId] || '').trim();
    if (!content) return;
    try {
      const res = await http.post(`/api/social/posts/${postId}/comments`, { content });
      const dto = res.data;
      setCommentsByPost((old) => ({
        ...old,
        [postId]: [...(old[postId] || []), dto],
      }));
      setCommentInputs((old) => ({ ...old, [postId]: '' }));
    } catch {
      /* toast sau */
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
                  <span className="text-[0.62rem] font-bold text-slate-500 uppercase tracking-widest mt-1 text-center leading-tight">Lộ trình<br/>{levelCode}</span>
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
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-700/50 p-5 lg:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-extrabold text-[0.95rem] text-slate-900 dark:text-slate-100">Kỷ niệm học tập</span>
              <a href="#yume-account-feed-title" className="text-[0.8rem] font-bold text-rose-600 dark:text-rose-400 hover:underline">
                Xem tất cả
              </a>
            </div>
            <div className="grid grid-cols-2 gap-2" role="list" aria-label="Ảnh từ bài đăng và hồ sơ của bạn">
              {Array.from({ length: 4 }, (_, i) => {
                const cell = memoryLaneCells[i];
                if (cell) {
                  const label =
                    cell.kind === 'post'
                      ? 'Ảnh từ bài đăng'
                      : cell.kind === 'cover'
                        ? 'Ảnh bìa tài khoản'
                        : 'Ảnh đại diện';
                  return (
                    <div
                      key={`m-${i}-${cell.kind}-${cell.postId ?? 'profile'}`}
                      role="listitem"
                      className="aspect-square rounded-2xl bg-cover bg-center shadow-sm"
                      style={{ backgroundImage: `url(${cell.src})` }}
                      title={label}
                    />
                  );
                }
                return (
                  <div
                    key={`mem-ph-${i}`}
                    role="presentation"
                    className="aspect-square rounded-2xl opacity-50 dark:opacity-30"
                    style={{ background: HANAMI_MEMORY_SWATCHES[i] }}
                  />
                );
              })}
            </div>
            {memoryLaneCells.length === 0 && !loadingPosts ? (
              <p className="mt-4 m-0 text-center text-[0.8rem] leading-relaxed text-slate-500 dark:text-slate-400 italic">Đăng bài kèm ảnh hoặc thêm ảnh bìa — ảnh sẽ hiện ở đây.</p>
            ) : null}
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
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
                  Thông tin tài khoản
                  {profileTab === 'info' && <motionFr.div layoutId="profileTabIndicator" className="absolute bottom-0 left-0 right-0 h-1 bg-rose-600 dark:bg-rose-500 rounded-t-md" />}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={profileTab === 'settings'}
                  className={`relative px-2 sm:px-4 py-3 text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-t-lg ${profileTab === 'settings' ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  onClick={() => setProfileTab('settings')}
                >
                  Cài đặt
                  {profileTab === 'settings' && <motionFr.div layoutId="profileTabIndicator" className="absolute bottom-0 left-0 right-0 h-1 bg-rose-600 dark:bg-rose-500 rounded-t-md" />}
                </button>
              </nav>

              <div className="pt-6">
                {profileTab === 'info' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Cấp độ</div>
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
                      <div className="text-indigo-500 bg-indigo-100 dark:bg-indigo-900/40 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                          <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Bài viết</div>
                      <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">{loadingPosts ? '…' : posts.length}</div>
                      <div className="mt-auto text-xs text-slate-500 font-medium">Bài đăng của bạn</div>
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
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Bạn bè</div>
                      <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">{friendsCount === null ? '…' : friendsCount}</div>
                      <div className="mt-auto text-xs text-slate-500 font-medium">Danh sách kết bạn</div>
                    </Motion.article>
                  </div>
                ) : null}

                {profileTab === 'settings' ? (
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
                ) : null}
              </div>
            </div>
          </Motion.header>

          <Motion.section
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-700/50 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
            aria-label="Đăng bài mới"
            variants={hanamiV.block}
          >
            <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800" aria-hidden>
                  {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center font-bold text-slate-400">{avatarInitial}</span>}
                </div>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 sm:p-4 text-[0.95rem] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-rose-500/50 transition-all resize-none"
                  rows={3}
                  placeholder="Chia sẻ bài học hoặc khoảnh khắc…"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pl-14 sm:pl-16">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1">
                  {quickEmojis.map((em) => (
                    <button key={em} type="button" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-lg transition-colors flex-shrink-0" onClick={() => handleAddEmoji(em)}>
                      {em}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                  <label htmlFor="post-image-input" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span className="hidden sm:inline">Ảnh</span>
                  </label>
                  <input
                    id="post-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePostImageChange}
                  />
                  <button type="submit" className={`px-5 py-2 rounded-xl text-sm font-bold text-white transition-all ${creatingPost ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 shadow-md hover:shadow-lg hover:-translate-y-0.5'}`} disabled={creatingPost}>
                    {creatingPost ? 'Đang đăng…' : 'Đăng bài'}
                  </button>
                </div>
              </div>
              {postImagePreview ? (
                <div className="pl-14 sm:pl-16 mt-2">
                  <div className="relative inline-block">
                    <img src={postImagePreview} alt="" className="max-w-full h-auto max-h-48 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
                    <button type="button" className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors" onClick={() => setPostImagePreview(null)}>✕</button>
                  </div>
                </div>
              ) : null}
            </form>
          </Motion.section>

          {postError ? (
            <p className="yume-account-feed__error" role="alert">
              {postError}
            </p>
          ) : null}

          <Motion.section
            className="flex flex-col gap-6"
            aria-labelledby="yume-account-feed-title"
            variants={hanamiV.block}
          >
            <h2 id="yume-account-feed-title" className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 m-0 px-2">
              <span className="w-8 h-1 rounded-full bg-rose-500 inline-block"></span>
              Bài đăng
            </h2>
            <div className="w-full">
              {loadingPosts ? (
                <p className="text-center text-slate-500 py-10 font-bold animate-pulse">Đang tải bài đăng…</p>
              ) : posts.length === 0 ? (
                <p className="text-center text-slate-500 py-10 font-medium italic">Chưa có bài đăng. Hãy viết dòng đầu tiên!</p>
              ) : (
                <Motion.ul
                  className="flex flex-col gap-5 sm:gap-6 p-0 m-0 list-none"
                  variants={hanamiV.feed}
                  initial={reduceMotion ? false : 'hidden'}
                  animate="show"
                >
                  {posts.map((p) => {
                    const id = p.id ?? p.Id;
                    const createdAt = p.createdAt ?? p.CreatedAt;
                    const content = p.content ?? p.Content;
                    const imageUrl = p.imageUrl ?? p.ImageUrl;
                    const activeReaction = postReactions[id];
                    const reactionEmojis = ['👍', '❤️', '😆', '😮', '😢', '😡'];
                    const reactionsSummary = p.reactions ?? p.Reactions ?? null;
                    const reactionCounts = reactionsSummary?.counts ?? reactionsSummary?.Counts ?? {};
                    const comments = commentsByPost[id] || [];
                    const reactTotal = totalReactionCount(reactionCounts);
                    return (
                      <Motion.li
                        key={id}
                        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
                        variants={hanamiV.post}
                        whileHover={reduceMotion ? undefined : { y: -3, scale: 1.008 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-100 dark:ring-slate-800" aria-hidden>
                              {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center font-bold text-slate-400">{avatarInitial}</span>}
                            </div>
                            <div className="flex flex-col">
                              <div className="font-extrabold text-[0.95rem] text-slate-900 dark:text-slate-100 leading-tight">{displayName}</div>
                              <div className="text-[0.75rem] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                {formatPostVisibilityLine(createdAt)}
                              </div>
                            </div>
                          </div>
                          <button type="button" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" title="Xóa bài" onClick={() => handleDeletePost(id)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        </div>
                        {content ? <p className="text-[0.95rem] text-slate-800 dark:text-slate-200 leading-relaxed mb-4 whitespace-pre-wrap">{content}</p> : null}
                        {imageUrl ? (
                          <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-4 border border-slate-200 dark:border-slate-700/50">
                            <img
                              className="w-full max-h-[500px] object-cover"
                              src={buildImageUrl(imageUrl)}
                              alt=""
                            />
                          </div>
                        ) : null}
                        <div className="flex items-center gap-6 py-3 mb-2 border-y border-slate-100 dark:border-slate-800/80" aria-label="Tương tác bài viết">
                          <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400" title="Lượt thích">
                            <Heart className="w-4 h-4 text-rose-500" /> {reactTotal}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400" title="Bình luận">
                            <MessageSquare className="w-4 h-4 text-indigo-500" /> {comments.length}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400 ml-auto cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors" aria-hidden title="Chia sẻ">
                            ↗ <span className="hidden sm:inline">Chia sẻ</span>
                          </span>
                        </div>
                        <div className="yume-account__post-reactions">
                          <button
                            type="button"
                            onClick={() => void handleToggleReactionOnServer(id, activeReaction || '👍')}
                            className={
                              activeReaction
                                ? 'yume-account__post-reaction-main yume-account__post-reaction-main--active'
                                : 'yume-account__post-reaction-main'
                            }
                          >
                            <span className="yume-account__post-reaction-main-emoji">{activeReaction || '👍'}</span>
                            <span className="yume-account__post-reaction-main-label">Thích</span>
                          </button>
                          <div className="yume-account__post-reaction-picker">
                            {reactionEmojis.map((em) => {
                              const count = reactionCounts?.[em] ?? 0;
                              const isActive = activeReaction === em;
                              return (
                                <button
                                  key={em}
                                  type="button"
                                  onClick={() => void handleToggleReactionOnServer(id, em)}
                                  className={
                                    isActive
                                      ? 'yume-account__post-reaction yume-account__post-reaction--active'
                                      : 'yume-account__post-reaction'
                                  }
                                >
                                  <span className="yume-account__post-reaction-emoji">{em}</span>
                                  {count > 0 ? <span className="yume-account__post-reaction-count">{count}</span> : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <AccountPostSmartComments
                          postId={id}
                          comments={comments}
                          commentInput={commentInputs[id] || ''}
                          onInputChange={handleCommentInputChange}
                          onSubmit={handleSubmitComment}
                        />
                      </Motion.li>
                    );
                  })}
                </Motion.ul>
              )}
            </div>
          </Motion.section>
        </Motion.div>
      </Motion.div>
    </div>
  );
}
