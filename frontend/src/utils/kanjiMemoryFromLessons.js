/**
 * Gom cặp (mặt Nhật có Kanji ↔ nghĩa Việt) cho Kanji Memory.
 * Nguồn: API game (một request), khóa N5 tĩnh (legacy), hoặc bộ dự phòng cục bộ.
 */
import { N5_LESSONS } from '../data/n5BeginnerCourse';
import { N5_BASIC_KANJI_GROUPS } from '../data/japaneseAlphabet';

const KANJI_RE = /[\u4e00-\u9faf々〆ヵヶ]/;

function hasKanji(s) {
  return KANJI_RE.test(String(s || ''));
}

function pushPair(out, seen, kanjiFace, meaningVi, meta) {
  const k = String(kanjiFace || '').trim();
  const m = String(meaningVi || '').trim();
  if (!k || !m) return;
  if (k.length > 14 || m.length > 120) return;
  const key = `${k}|||${m}`;
  if (seen.has(key)) return;
  seen.add(key);
  out.push({
    kanji: k,
    meaning: m,
    lessonSlug: meta.lessonSlug,
    lessonTitle: meta.lessonTitle,
  });
}

function normalizeApiPairRow(row) {
  const kanji = row.kanji ?? row.Kanji;
  const meaning = row.meaning ?? row.Meaning;
  if (!kanji || !meaning) return null;
  return {
    kanji: String(kanji).trim(),
    meaning: String(meaning).trim(),
    lessonSlug: row.lessonSlug ?? row.LessonSlug ?? '',
    lessonTitle: row.lessonTitle ?? row.LessonTitle ?? '',
  };
}

/** Bộ Kanji N5 cơ bản — luôn sẵn sàng khi API chưa tải xong. */
export function getKanjiMemoryFallbackPairs() {
  const out = [];
  const seen = new Set();
  const meta = { lessonSlug: 'n5-basic', lessonTitle: 'Kanji N5 cơ bản' };
  for (const group of N5_BASIC_KANJI_GROUPS) {
    for (const it of group.items || []) {
      pushPair(out, seen, it.char, it.vi, meta);
    }
  }
  return out;
}

/**
 * @param {string|null|undefined} lessonSlug - chỉ một bài, hoặc null = toàn khóa
 * @returns {{ kanji: string, meaning: string, lessonSlug: string, lessonTitle: string }[]}
 */
export function extractKanjiMemoryPairsFromN5Lessons(lessonSlug = null) {
  const lessons = lessonSlug
    ? N5_LESSONS.filter((l) => l.slug === lessonSlug)
    : [...N5_LESSONS];

  const out = [];
  const seen = new Set();

  for (const lesson of lessons) {
    const meta = { lessonSlug: lesson.slug, lessonTitle: lesson.navTitle || lesson.headline || lesson.slug };
    const blocks = lesson.blocks || [];

    for (const block of blocks) {
      const type = block.type;

      if (type === 'kanji_table' && Array.isArray(block.rows)) {
        for (const row of block.rows) {
          const char = row.char ?? row.Char;
          const vi = row.vi ?? row.Vi;
          if (char && vi) pushPair(out, seen, char, vi, meta);
        }
      }

      if (type === 'vocab_table' && Array.isArray(block.rows)) {
        for (const row of block.rows) {
          const w = row.word ?? row.Word;
          const vi = row.vi ?? row.Vi;
          if (!w || !vi || !hasKanji(w)) continue;
          const fragment = String(w)
            .split(/[／/、,]/)
            .map((s) => s.trim())
            .find((s) => hasKanji(s));
          if (fragment) pushPair(out, seen, fragment, vi, meta);
        }
      }

      if (type === 'keyword_list' && Array.isArray(block.items)) {
        for (const it of block.items) {
          const jp = it.jp ?? it.Jp;
          const vi = it.vi ?? it.Vi ?? it.noteVi ?? it.NoteVi;
          if (!jp || !vi || !hasKanji(jp)) continue;
          const cleaned = String(jp).replace(/[。．.\s]+$/g, '').trim();
          if (cleaned.length <= 10) pushPair(out, seen, cleaned, vi, meta);
          else {
            const kanjiOnly = [...cleaned].filter((ch) => KANJI_RE.test(ch)).join('');
            if (kanjiOnly.length >= 1 && kanjiOnly.length <= 8) pushPair(out, seen, kanjiOnly, vi, meta);
          }
        }
      }

      if (type === 'phrase_list' && Array.isArray(block.items)) {
        for (const it of block.items) {
          const jp = it.jp ?? it.Jp;
          const vi = it.labelVi ?? it.LabelVi ?? it.noteVi ?? it.NoteVi;
          if (!jp || !vi || !hasKanji(jp)) continue;
          const cleaned = String(jp).replace(/[。．.]+$/, '').trim();
          if (cleaned.length <= 12) pushPair(out, seen, cleaned, vi, meta);
        }
      }
    }
  }

  return out;
}

/**
 * @param {object} detail - payload GET /api/lessons/slug/...
 * @returns {{ kanji: string, meaning: string, lessonSlug: string, lessonTitle: string }[]}
 */
export function extractKanjiMemoryPairsFromApiDetail(detail) {
  const lesson = detail?.lesson ?? detail?.Lesson ?? {};
  const meta = {
    lessonSlug: lesson.slug ?? lesson.Slug ?? '',
    lessonTitle: lesson.title ?? lesson.Title ?? metaSlug(lesson),
  };
  const out = [];
  const seen = new Set();

  const kanjiRows = detail?.kanji ?? detail?.Kanji ?? [];
  for (const row of kanjiRows) {
    const char = row.character ?? row.Character;
    const vi = row.meaningVi ?? row.MeaningVi ?? row.meaningEn ?? row.MeaningEn;
    if (char && vi) pushPair(out, seen, char, vi, meta);
  }

  const vocabRows = detail?.vocabulary ?? detail?.Vocabulary ?? [];
  for (const row of vocabRows) {
    const w = row.wordJp ?? row.WordJp;
    const vi = row.meaningVi ?? row.MeaningVi ?? row.meaningEn ?? row.MeaningEn;
    if (!w || !vi || !hasKanji(w)) continue;
    const fragment = String(w)
      .split(/[／/、,]/)
      .map((s) => s.trim())
      .find((s) => hasKanji(s));
    if (fragment) pushPair(out, seen, fragment, vi, meta);
  }

  return out;
}

function metaSlug(lesson) {
  return lesson.slug ?? lesson.Slug ?? 'lesson';
}

/**
 * Tải cặp Kanji — ưu tiên GET /api/game/kanji-memory/pairs (một request).
 * @param {import('axios').AxiosInstance} http
 * @param {number|null} levelId - 1=N5, null=tất cả cấp
 */
export async function fetchKanjiMemoryPairsFromApi(http, levelId = 1) {
  try {
    const params = levelId != null ? { levelId } : {};
    const { data } = await http.get('/api/game/kanji-memory/pairs', {
      params,
      timeout: 25000,
    });
    const rows = Array.isArray(data) ? data : data?.pairs ?? data?.Pairs ?? [];
    const out = [];
    const seen = new Set();
    for (const row of rows) {
      const pair = normalizeApiPairRow(row);
      if (!pair) continue;
      const key = `${pair.kanji}|||${pair.meaning}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(pair);
    }
    if (out.length > 0) return out;
  } catch {
    /* thử legacy bên dưới */
  }

  return fetchKanjiMemoryPairsLegacy(http, levelId != null ? [levelId] : [1, 2, 3]);
}

/** Legacy: từng bài /api/lessons/slug — chậm, chỉ dùng khi endpoint mới chưa có. */
async function fetchKanjiMemoryPairsLegacy(http, levelIds = [1]) {
  const listItems = [];
  for (const lid of levelIds) {
    const { data } = await http.get('/api/lessons', {
      params: { page: 1, pageSize: 200, levelId: lid },
      timeout: 20000,
    });
    const items = data?.items ?? data?.Items ?? [];
    if (Array.isArray(items)) listItems.push(...items);
  }

  const targets = listItems.filter((l) => {
    const t = String(l.categoryType ?? l.CategoryType ?? '').toLowerCase();
    return t === 'kanji' || t === 'vocabulary';
  });

  const out = [];
  const seen = new Set();
  const batchSize = 6;

  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (l) => {
        const slug = l.slug ?? l.Slug;
        if (!slug) return;
        try {
          const { data } = await http.get(`/api/lessons/slug/${encodeURIComponent(slug)}`, {
            timeout: 15000,
          });
          for (const pair of extractKanjiMemoryPairsFromApiDetail(data)) {
            const key = `${pair.kanji}|||${pair.meaning}`;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(pair);
          }
        } catch {
          /* bỏ qua bài lỗi */
        }
      }),
    );
  }

  return out;
}

/**
 * Pool dùng ngay: API (nếu có) → static N5 → fallback cục bộ.
 * @param {{ kanji: string, meaning: string }[]} apiPool
 */
export function resolveKanjiMemoryPool(apiPool) {
  if (apiPool?.length > 0) return apiPool;
  const staticPool = extractKanjiMemoryPairsFromN5Lessons(null);
  if (staticPool.length > 0) return staticPool;
  return getKanjiMemoryFallbackPairs();
}

/**
 * @param {{ kanji: string, meaning: string }[]} pool
 * @param {number} pairCount
 */
export function pickRandomPairs(pool, pairCount) {
  const n = Math.min(Math.max(1, pairCount), pool.length);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
