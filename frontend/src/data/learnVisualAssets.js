import { HOMEPAGE_HERO, HOMEPAGE_WHY } from './homepageContent';
import {
  artDailyChallenge,
  artKanjiMemoryStones,
  artPvpSamurai,
  artVocabSpeed,
} from '../assets/play';

/** Ảnh dùng chung — Dashboard học viên & trang Learn */
export const LEARN_VISUAL = {
  hero: HOMEPAGE_HERO.image,
  heroAlt: HOMEPAGE_HERO.slides[0],
  sakura: HOMEPAGE_HERO.slides[1],
  city: HOMEPAGE_WHY.images[0],
  temple: HOMEPAGE_WHY.images[1],
  study: 'https://riki.edu.vn/goc-chia-se/wp-content/uploads/2020/06/thong-tin-nhat-ban-13-2.jpg',
};

export const DASH_ACTION_IMAGES = {
  learn: LEARN_VISUAL.sakura,
  play: artKanjiMemoryStones,
  leaderboard: artPvpSamurai,
  achievements: artDailyChallenge,
};

export const LEARN_TOPIC_IMAGES = {
  vocab: artVocabSpeed,
  grammar: LEARN_VISUAL.city,
  kanji: artKanjiMemoryStones,
  alphabet: LEARN_VISUAL.temple,
  promo: LEARN_VISUAL.heroAlt,
};
