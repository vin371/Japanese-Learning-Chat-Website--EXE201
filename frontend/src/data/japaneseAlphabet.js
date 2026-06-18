import { HIRAGANA_GOJUON, KATAKANA_GOJUON } from './gojuonRomaji';

/** Gom 46 ký tự gojuon theo hàng (あ行, か行, …). */
function buildGojuonRows(table, script) {
  const rowDefs = [
    { label: 'あ行 — a', count: 5 },
    { label: 'か行 — ka', count: 5 },
    { label: 'さ行 — sa', count: 5 },
    { label: 'た行 — ta', count: 5 },
    { label: 'な行 — na', count: 5 },
    { label: 'は行 — ha', count: 5 },
    { label: 'ま行 — ma', count: 5 },
    { label: 'や行 — ya', count: 3 },
    { label: 'ら行 — ra', count: 5 },
    { label: 'わ行 & を', count: 2 },
    { label: 'ん — n', count: 1 },
  ];
  let i = 0;
  return rowDefs.map(({ label, count }) => {
    const items = table.slice(i, i + count).map((x) => ({
      kana: x.kana,
      romaji: x.romaji,
      script,
    }));
    i += count;
    return { label, items };
  });
}

export const HIRAGANA_ROWS = buildGojuonRows(HIRAGANA_GOJUON, 'hiragana');
export const KATAKANA_ROWS = buildGojuonRows(KATAKANA_GOJUON, 'katakana');

/** Cùng hàng — Hiragana bên trái, Katakana bên phải (đối chiếu). */
export const PAIRED_KANA_ROWS = HIRAGANA_ROWS.map((row, ri) => ({
  label: row.label,
  items: row.items.map((h, ii) => ({
    romaji: h.romaji,
    hiragana: h.kana,
    katakana: KATAKANA_ROWS[ri]?.items[ii]?.kana ?? '',
  })),
}));

/** Kanji N5 cơ bản — ôn nhanh trước khi vào bài kanji theo chủ đề. */
export const N5_BASIC_KANJI_GROUPS = [
  {
    label: 'Số đếm',
    items: [
      { char: '一', reading: 'いち', vi: 'một' },
      { char: '二', reading: 'に', vi: 'hai' },
      { char: '三', reading: 'さん', vi: 'ba' },
      { char: '四', reading: 'よん', vi: 'bốn' },
      { char: '五', reading: 'ご', vi: 'năm' },
      { char: '六', reading: 'ろく', vi: 'sáu' },
      { char: '七', reading: 'なな', vi: 'bảy' },
      { char: '八', reading: 'はち', vi: 'tám' },
      { char: '九', reading: 'きゅう', vi: 'chín' },
      { char: '十', reading: 'じゅう', vi: 'mười' },
      { char: '百', reading: 'ひゃく', vi: 'trăm' },
      { char: '千', reading: 'せん', vi: 'nghìn' },
      { char: '万', reading: 'まん', vi: 'vạn' },
    ],
  },
  {
    label: 'Người & gia đình',
    items: [
      { char: '人', reading: 'ひと', vi: 'người' },
      { char: '男', reading: 'おとこ', vi: 'nam' },
      { char: '女', reading: 'おんな', vi: 'nữ' },
      { char: '子', reading: 'こ', vi: 'trẻ em' },
      { char: '父', reading: 'ちち', vi: 'cha' },
      { char: '母', reading: 'はは', vi: 'mẹ' },
      { char: '友', reading: 'とも', vi: 'bạn' },
      { char: '先', reading: 'せん', vi: 'trước' },
      { char: '生', reading: 'せい', vi: 'sinh / học sinh' },
    ],
  },
  {
    label: 'Thiên nhiên & thời gian',
    items: [
      { char: '日', reading: 'ひ', vi: 'ngày / mặt trời' },
      { char: '月', reading: 'つき', vi: 'tháng / mặt trăng' },
      { char: '火', reading: 'ひ', vi: 'lửa' },
      { char: '水', reading: 'みず', vi: 'nước' },
      { char: '木', reading: 'き', vi: 'cây' },
      { char: '金', reading: 'きん', vi: 'vàng / kim loại' },
      { char: '土', reading: 'つち', vi: 'đất' },
      { char: '山', reading: 'やま', vi: 'núi' },
      { char: '川', reading: 'かわ', vi: 'sông' },
      { char: '田', reading: 'た', vi: 'ruộng' },
      { char: '天', reading: 'てん', vi: 'trời' },
      { char: '気', reading: 'き', vi: 'khí / thời tiết' },
      { char: '雨', reading: 'あめ', vi: 'mưa' },
      { char: '雪', reading: 'ゆき', vi: 'tuyết' },
    ],
  },
  {
    label: 'Cơ thể & hành động',
    items: [
      { char: '目', reading: 'め', vi: 'mắt' },
      { char: '耳', reading: 'みみ', vi: 'tai' },
      { char: '口', reading: 'くち', vi: 'miệng' },
      { char: '手', reading: 'て', vi: 'tay' },
      { char: '足', reading: 'あし', vi: 'chân' },
      { char: '見', reading: 'みる', vi: 'nhìn' },
      { char: '聞', reading: 'きく', vi: 'nghe' },
      { char: '言', reading: 'いう', vi: 'nói' },
      { char: '行', reading: 'いく', vi: 'đi' },
      { char: '来', reading: 'くる', vi: 'đến' },
      { char: '食', reading: 'たべる', vi: 'ăn' },
      { char: '飲', reading: 'のむ', vi: 'uống' },
    ],
  },
  {
    label: 'Đời sống hằng ngày',
    items: [
      { char: '家', reading: 'いえ', vi: 'nhà' },
      { char: '学', reading: 'がく', vi: 'học' },
      { char: '校', reading: 'こう', vi: 'trường' },
      { char: '電', reading: 'でん', vi: 'điện' },
      { char: '車', reading: 'くるま', vi: 'xe' },
      { char: '本', reading: 'ほん', vi: 'sách' },
      { char: '語', reading: 'ご', vi: 'ngôn ngữ' },
      { char: '国', reading: 'くに', vi: 'đất nước' },
      { char: '会', reading: 'かい', vi: 'gặp / hội' },
      { char: '社', reading: 'しゃ', vi: 'công ty' },
      { char: '店', reading: 'みせ', vi: 'cửa hàng' },
      { char: '駅', reading: 'えき', vi: 'ga tàu' },
    ],
  },
  {
    label: 'Hướng & mô tả',
    items: [
      { char: '大', reading: 'おおきい', vi: 'lớn' },
      { char: '小', reading: 'ちいさい', vi: 'nhỏ' },
      { char: '上', reading: 'うえ', vi: 'trên' },
      { char: '下', reading: 'した', vi: 'dưới' },
      { char: '中', reading: 'なか', vi: 'giữa / trong' },
      { char: '外', reading: 'そと', vi: 'ngoài' },
      { char: '左', reading: 'ひだり', vi: 'trái' },
      { char: '右', reading: 'みぎ', vi: 'phải' },
      { char: '東', reading: 'ひがし', vi: 'đông' },
      { char: '西', reading: 'にし', vi: 'tây' },
      { char: '南', reading: 'みなみ', vi: 'nam' },
      { char: '北', reading: 'きた', vi: 'bắc' },
      { char: '新', reading: 'あたらしい', vi: 'mới' },
      { char: '古', reading: 'ふるい', vi: 'cũ' },
      { char: '高', reading: 'たかい', vi: 'cao / đắt' },
      { char: '安', reading: 'やすい', vi: 'rẻ' },
    ],
  },
];

export const ALPHABET_TAB_META = {
  compare: {
    title: 'Bảng đối chiếu Hiragana & Katakana',
    subtitle: 'Mỗi ô: chữ mềm (trái) — chữ cứng (phải) — cùng romaji',
    hint: 'Học theo cặp あ/ア để nhớ nhanh. Bấm loa từng bên để nghe phát âm.',
  },
  hiragana: {
    title: 'Bảng chữ cái Hiragana',
    subtitle: 'Bảng chữ mềm — dùng cho từ thuần Nhật và ngữ pháp',
    hint: 'Bấm từng ô để nghe phát âm. Học theo hàng あ → ん trước khi luyện game Hiragana Match.',
  },
  katakana: {
    title: 'Bảng chữ cái Katakana',
    subtitle: 'Bảng chữ cứng — thường dùng cho từ mượn nước ngoài',
    hint: 'Katakana có nét góc hơn Hiragana. So sánh cùng romaji giữa hai bảng để nhớ nhanh.',
  },
  kanji: {
    title: 'Kanji N5 cơ bản',
    subtitle: 'Hán tự thường gặp — ôn trước khi vào bài kanji theo chủ đề',
    hint: 'Mỗi ô: hán tự lớn, cách đọc on/kun phổ biến, nghĩa tiếng Việt. Bấm loa để nghe.',
  },
};
