import { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { speakJapanese, japaneseSpeechSupported } from '../../../utils/japaneseSpeech';
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
    <motion.div 
      className={`learn-alpha-cell learn-alpha-cell--${tone} learn-alpha-cell--clickable`} 
      variants={itemVariants} 
      lang="ja"
      onClick={() => japaneseSpeechSupported() && speakJapanese(kana)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (japaneseSpeechSupported()) speakJapanese(kana);
        }
      }}
      aria-label={`Nghe phát âm: ${kana}`}
    >
      {japaneseSpeechSupported() && (
        <span className="learn-alpha-cell__speaker-ico" aria-hidden="true">
          <Volume2 size={14} />
        </span>
      )}
      <div className="learn-alpha-cell__top">
        <span className="learn-alpha-cell__kana">{kana}</span>
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
                  className="learn-alpha-cell learn-alpha-cell--kanji learn-alpha-cell--clickable"
                  variants={itemVariants}
                  lang="ja"
                  onClick={() => japaneseSpeechSupported() && speakJapanese(item.char)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (japaneseSpeechSupported()) speakJapanese(item.char);
                    }
                  }}
                  aria-label={`Nghe phát âm: ${item.char}`}
                >
                  {japaneseSpeechSupported() && (
                    <span className="learn-alpha-cell__speaker-ico" aria-hidden="true">
                      <Volume2 size={14} />
                    </span>
                  )}
                  <div className="learn-alpha-cell__top">
                    <span className="learn-alpha-cell__kana learn-alpha-cell__kanji">{item.char}</span>
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
  const [activeTab, setActiveTab] = useState('hira');

  return (
    <motion.section
      className="learn-alpha"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <header className="learn-alpha__header">
        <div>
          <h2 className="learn-alpha__title">Bảng chữ cái &amp; Kanji N5</h2>
          <p className="learn-alpha__subtitle">
            Bấm loa từng ô để nghe. Cuộn từng cột khi cần xem thêm.
          </p>
        </div>
        
        <div className="learn-view-toggle learn-view-toggle--3" role="tablist" aria-label="Chuyển đổi bảng chữ">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'hira'}
            className={`learn-view-toggle__btn${activeTab === 'hira' ? ' learn-view-toggle__btn--on' : ''}`}
            onClick={() => setActiveTab('hira')}
          >
            Hiragana
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'kata'}
            className={`learn-view-toggle__btn${activeTab === 'kata' ? ' learn-view-toggle__btn--on' : ''}`}
            onClick={() => setActiveTab('kata')}
          >
            Katakana
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'kanji'}
            className={`learn-view-toggle__btn${activeTab === 'kanji' ? ' learn-view-toggle__btn--on' : ''}`}
            onClick={() => setActiveTab('kanji')}
          >
            Kanji
          </button>
        </div>
      </header>

      <div className="learn-alpha-board" role="region" aria-label="Bảng Hiragana, Katakana và Kanji">
        {activeTab === 'hira' && (
          <KanaColumn
            tone="hira"
            title="Hiragana"
            subtitle="Chữ mềm — từ thuần Nhật"
            rows={HIRAGANA_ROWS}
          />
        )}
        {activeTab === 'kata' && (
          <KanaColumn
            tone="kata"
            title="Katakana"
            subtitle="Chữ cứng — từ mượn"
            rows={KATAKANA_ROWS}
          />
        )}
        {activeTab === 'kanji' && <KanjiColumn />}
      </div>
    </motion.section>
  );
}
