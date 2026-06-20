/**
 * Ảnh thumbnail bài học — chỉ dùng file local đã kiểm tra (768×512 / 1408×768).
 * Tránh ảnh vuông 512×512 vì dễ bị crop khi hiển thị thumbnail ngang.
 */
import generated from '../generated-image.png';
import scene1 from '../scene_1.png';
import scene2 from '../scene_2.png';
import scene3 from '../scene_3.png';
import scene4 from '../scene_4.png';
import bgBamboo from '../kana-combat-bg-bamboo.png';
import bgFuji from '../kana-combat-bg-fuji.png';
import bgShrine from '../kana-combat-bg-shrine.png';
import bgVillage from '../kana-combat-bg-village.png';
import { artKanjiPuzzle, artPvpSamurai, artVocabSpeed } from '../play';

/** Pool an toàn — landscape, luôn load được qua Vite */
export const LEARN_SAFE_THUMBS = [
  scene1,
  scene2,
  scene3,
  scene4,
  bgBamboo,
  bgFuji,
  bgShrine,
  bgVillage,
  generated,
  artKanjiPuzzle,
  artPvpSamurai,
  artVocabSpeed,
];

export const LEARN_THUMB_FALLBACK = scene1;

export const LEARN_LEVEL_HERO = {
  N5: scene1,
  N4: bgFuji,
  N3: bgShrine,
};

export const LEARN_LEVEL_POOLS = {
  N5: {
    vocab: [scene1, scene2, bgVillage, artVocabSpeed, generated, scene3],
    grammar: [scene3, bgBamboo, scene4, artKanjiPuzzle, bgVillage],
    kanji: [bgShrine, scene2, scene4, bgFuji, artKanjiPuzzle, bgBamboo, generated, scene1],
    default: LEARN_SAFE_THUMBS,
  },
  N4: {
    vocab: [bgFuji, scene4, artVocabSpeed, generated, scene2],
    grammar: [bgBamboo, scene3, artKanjiPuzzle, scene1],
    kanji: [bgShrine, scene4, artPvpSamurai, bgFuji, scene2, generated],
    default: [bgFuji, scene3, generated],
  },
  N3: {
    vocab: [generated, artPvpSamurai, bgFuji, scene1, scene4],
    grammar: [artPvpSamurai, bgShrine, scene4, scene2],
    kanji: [bgShrine, artKanjiPuzzle, bgBamboo, generated, scene3, artPvpSamurai],
    default: [bgShrine, generated, scene4],
  },
};

/** Mỗi chủ đề một ảnh landscape riêng — không trùng */
export const LEARN_THEME_IMAGES = {
  'self-intro': scene1,
  'what-is': scene2,
  place: bgShrine,
  time: scene3,
  travel: bgFuji,
  family: bgVillage,
  food: scene4,
  shopping: generated,
  conversation: scene3,
  greeting: scene1,
  numbers: scene2,
  adjective: bgVillage,
  desire: scene4,
  weather: bgBamboo,
  work: artPvpSamurai,
  health: generated,
  kanji: bgShrine,
  kana: artVocabSpeed,
  review: generated,
  verb: scene2,
  daily: scene1,
  'list-sentence': scene4,
  quote: bgBamboo,
  thinking: artKanjiPuzzle,
  default: scene1,
};
