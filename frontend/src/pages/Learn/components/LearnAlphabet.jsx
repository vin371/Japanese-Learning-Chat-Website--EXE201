import { motion } from 'framer-motion';
import SpeakJaButton from '../../../components/learn/SpeakJaButton';
import {
  HIRAGANA_ROWS,
  KATAKANA_ROWS,
  N5_BASIC_KANJI_GROUPS,
} from '../../../data/japaneseAlphabet';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.015 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

function KanaCell({ kana, romaji, tone }) {
  return (
    <motion.div className={`learn-alpha-cell learn-alpha-cell--${tone}`} variants={itemVariants} lang="ja">
      <div className="learn-alpha-cell__top">
        <span className="learn-alpha-cell__kana">{kana}</span>
        <SpeakJaButton text={kana} label={`Nghe: ${kana}`} />
      </div>
      <span className="learn-alpha-cell__romaji">{romaji}</span>
    </motion.div>
  );
}

function KanaColumn({ tone, title, subtitle, rows }) {
  return (
    <div className={`learn-alpha-col learn-alpha-col--${tone}`}>
      <header className="learn-alpha-col__head">
        <h3 className="learn-alpha-col__title">{title}</h3>
        <p className="learn-alpha-col__sub">{subtitle}</p>
      </header>
      <div className="learn-alpha-col__body">
        {rows.map((row) => (
          <section key={row.label} className="learn-alpha-section">
            <h4 className="learn-alpha-section__title">{row.label}</h4>
            <div className="learn-alpha-grid">
              {row.items.map((item) => (
                <KanaCell key={item.kana} kana={item.kana} romaji={item.romaji} tone={tone} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function KanjiColumn() {
  return (
    <div className="learn-alpha-col learn-alpha-col--kanji">
      <header className="learn-alpha-col__head">
        <h3 className="learn-alpha-col__title">Kanji</h3>
        <p className="learn-alpha-col__sub">Hán tự N5 cơ bản — đọc & nghĩa</p>
      </header>
      <div className="learn-alpha-col__body">
        {N5_BASIC_KANJI_GROUPS.map((group) => (
          <section key={group.label} className="learn-alpha-section">
            <h4 className="learn-alpha-section__title">{group.label}</h4>
            <div className="learn-alpha-grid learn-alpha-grid--kanji">
              {group.items.map((item) => (
                <motion.div
                  key={item.char}
                  className="learn-alpha-cell learn-alpha-cell--kanji"
                  variants={itemVariants}
                  lang="ja"
                >
                  <div className="learn-alpha-cell__top">
                    <span className="learn-alpha-cell__kana learn-alpha-cell__kanji">{item.char}</span>
                    <SpeakJaButton text={item.char} label={`Nghe: ${item.char}`} />
                  </div>
                  <span className="learn-alpha-cell__romaji">{item.reading}</span>
                  <span className="learn-alpha-cell__vi">{item.vi}</span>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function LearnAlphabet() {
  return (
    <motion.section
      className="learn-alpha learn-alpha--triptych"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <header className="learn-alpha__header learn-alpha__header--triptych">
        <h2 className="learn-alpha__title">Bảng chữ cái &amp; Kanji N5</h2>
      </header>

      <p className="learn-alpha__hint">Bấm loa từng ô để nghe. Cuộn từng cột khi cần xem thêm.</p>

      <div className="learn-alpha-board" role="region" aria-label="Bảng Hiragana, Katakana và Kanji">
        <KanaColumn
          tone="hira"
          title="Hiragana"
          subtitle="Chữ mềm — từ thuần Nhật"
          rows={HIRAGANA_ROWS}
        />
        <KanaColumn
          tone="kata"
          title="Katakana"
          subtitle="Chữ cứng — từ mượn"
          rows={KATAKANA_ROWS}
        />
        <KanjiColumn />
      </div>
    </motion.section>
  );
}
