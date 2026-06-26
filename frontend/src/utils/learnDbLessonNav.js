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
    g.items.sort((a, b) => a.sortOrder - b.sortOrder || String(a.navTitle).localeCompare(String(b.navTitle), 'vi'));
  }
  return sectionOrder.filter((key) => map.has(key)).map((key) => map.get(key));
}
