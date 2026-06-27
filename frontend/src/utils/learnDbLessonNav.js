/** Map category type từ API → tab sidebar Learn. */
export function categoryTypeToSection(categoryType) {
  const t = String(categoryType ?? '').trim().toLowerCase();
  if (t === 'vocabulary') return 'vocab';
  if (t === 'grammar') return 'grammar';
  if (t === 'kanji') return 'kanji';
  if (t === 'reading') return 'reading';
  if (t === 'dialogue') return 'dialogue';
  if (t === 'alphabet') return 'alphabet';
  return t || 'all';
}

export function sectionMatchesFilter(categoryType, sectionFilter) {
  if (sectionFilter === 'all') return true;
  return categoryTypeToSection(categoryType) === sectionFilter;
}

const SECTION_LABELS = {
  vocab: 'Từ vựng',
  grammar: 'Ngữ pháp',
  kanji: 'Kanji',
  reading: 'Bài đọc',
  dialogue: 'Hội thoại',
  alphabet: 'Bảng chữ cái',
  reference: 'Tra cứu',
};

export function sectionLabelFor(section) {
  return SECTION_LABELS[section] ?? section;
}

const SECTION_SORT = {
  alphabet: 0,
  vocab: 1,
  grammar: 2,
  kanji: 3,
  dialogue: 4,
  reading: 5,
  reference: 6,
};

/** Sắp xếp bài: phần → danh mục → thứ tự → id. */
export function sortLearnLessons(lessons) {
  return [...lessons].sort((a, b) => {
    const sa = SECTION_SORT[a.section] ?? 9;
    const sb = SECTION_SORT[b.section] ?? 9;
    if (sa !== sb) return sa - sb;
    const ca = Number(a.categoryId) || 0;
    const cb = Number(b.categoryId) || 0;
    if (ca !== cb) return ca - cb;
    const oa = Number(a.sortOrder) || 0;
    const ob = Number(b.sortOrder) || 0;
    if (oa !== ob) return oa - ob;
    return (Number(a.id) || 0) - (Number(b.id) || 0);
  });
}

/**
 * Gán số hiển thị "Bài 01…" theo thứ tự đã sort (mỗi phần đếm lại từ 1).
 * sortOrder DB vẫn giữ để map ảnh / paywall.
 */
export function withLessonDisplayNumbers(lessons, { perSection = true } = {}) {
  const sorted = sortLearnLessons(lessons);
  const counters = {};
  return sorted.map((lesson, index) => {
    const key = perSection ? lesson.section || 'other' : '__all__';
    counters[key] = (counters[key] ?? 0) + 1;
    const displayNumber = perSection ? counters[key] : index + 1;
    return { ...lesson, displayNumber };
  });
}

/** Chuyển bài từ API thành item sidebar. */
export function dbLessonToNavItem(row) {
  const section = categoryTypeToSection(row.categoryType ?? row.CategoryType);
  return {
    slug: row.slug ?? row.Slug,
    navTitle: row.title ?? row.Title,
    section,
    sectionLabel: sectionLabelFor(section),
    sortOrder: Number(row.sortOrder ?? row.SortOrder ?? 0),
    id: row.id ?? row.Id,
    isPremium: !!(row.isPremium ?? row.IsPremium),
  };
}

export function buildLessonGroupsFromDb(lessons, sectionOrder) {
  const map = new Map();
  for (const row of lessons) {
    const item = dbLessonToNavItem(row);
    if (!item.slug) continue;
    if (!map.has(item.section)) {
      map.set(item.section, { section: item.section, label: item.sectionLabel, items: [] });
    }
    map.get(item.section).items.push(item);
  }
  for (const g of map.values()) {
    g.items = sortLearnLessons(g.items);
  }
  return sectionOrder.filter((key) => map.has(key)).map((key) => map.get(key));
}
