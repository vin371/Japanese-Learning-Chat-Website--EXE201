import { useState } from 'react';
import { LayoutGrid, Table2 } from 'lucide-react';
import SpeakJaButton from '../../../components/learn/SpeakJaButton';
import { parseExampleLines } from '../../../utils/parseLessonExample';

function grammarCueIcon(pattern) {
  const p = String(pattern || '');
  if (/これ|それ|あれ|どれ|ここ|そこ|あそこ/.test(p)) return '📍';
  if (/ではありません|ません|ない/.test(p)) return '✖️';
  if (/ですか|ますか|か/.test(p)) return '❓';
  if (/て|で|に|へ|から|まで/.test(p)) return '🔗';
  if (/です|ます|だ/.test(p)) return '✅';
  return '📖';
}

function GrammarTable({ items }) {
  return (
    <div className="learn-vocab-table-wrap">
      <table className="learn-vocab-table learn-vocab-table--grammar">
        <thead>
          <tr>
            <th className="learn-vocab-table__col-no">#</th>
            <th>Mẫu</th>
            <th>Cấu trúc</th>
            <th>Nghĩa</th>
          </tr>
        </thead>
        <tbody>
          {items.map((g, idx) => {
            const pat = g.pattern ?? g.Pattern ?? '';
            const usage = g.structure ?? g.Structure ?? '';
            const meaning = g.meaningVi ?? g.MeaningVi ?? '';
            return (
              <tr key={g.id ?? g.Id ?? `${pat}-${idx}`} className="learn-vocab-table__row">
                <td className="learn-vocab-table__no">{idx + 1}</td>
                <td className="learn-vocab-table__word" lang="ja">
                  {pat}
                </td>
                <td className="learn-vocab-table__reading">{usage}</td>
                <td className="learn-vocab-table__mean">{meaning}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GrammarCard({ item, index }) {
  const pat = item.pattern ?? item.Pattern ?? '';
  const usage = item.structure ?? item.Structure ?? '';
  const meaning = item.meaningVi ?? item.MeaningVi ?? '';
  const examples = parseExampleLines(item.exampleSentences ?? item.ExampleSentences ?? '');
  const cue = grammarCueIcon(pat);

  return (
    <article className="learn-grammar-card" aria-label={`Mẫu ngữ pháp ${index + 1}`}>
      <header className="learn-grammar-card__head">
        <span className="learn-grammar-card__cue" aria-hidden>
          {cue}
        </span>
        <div className="learn-grammar-card__head-text">
          <span className="learn-grammar-card__no">Mẫu {index + 1}</span>
          <h3 className="learn-grammar-card__pattern" lang="ja">
            {pat}
          </h3>
        </div>
        {pat ? <SpeakJaButton text={pat} label={`Nghe: ${pat}`} /> : null}
      </header>

      {usage ? (
        <p className="learn-grammar-card__formula">
          <span className="learn-grammar-card__label">Công thức</span>
          {usage}
        </p>
      ) : null}

      {meaning ? <p className="learn-grammar-card__mean">{meaning}</p> : null}

      {examples.length > 0 ? (
        <div className="learn-grammar-card__examples">
          <span className="learn-grammar-card__label">Ví dụ</span>
          <ul className="learn-grammar-card__example-list">
            {examples.map((ex, i) => (
              <li key={i} className="learn-grammar-card__example">
                {ex.jp ? (
                  <div className="learn-grammar-card__ex-jp-row">
                    <p className="learn-grammar-card__ex-jp" lang="ja">
                      {ex.jp}
                    </p>
                    <SpeakJaButton text={ex.jp} label={`Nghe: ${ex.jp}`} />
                  </div>
                ) : null}
                {ex.vi ? <p className="learn-grammar-card__ex-vi">{ex.vi}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

/**
 * Ngữ pháp — danh sách thẻ đọc trực tiếp (không lật, không carousel).
 */
export default function GrammarFlashcardPlayer({ items }) {
  const [view, setView] = useState('list');
  const safe = Array.isArray(items) ? items : [];

  if (safe.length === 0) {
    return (
      <p className="learn-grammar-panel__empty">Chưa có mẫu ngữ pháp cho bài này.</p>
    );
  }

  return (
    <section className="learn-grammar-panel" aria-label="Nội dung ngữ pháp">
      <div className="learn-grammar-panel__modes" role="tablist">
        <button
          type="button"
          role="tab"
          className={`learn-flashdeck__mode${view === 'list' ? ' learn-flashdeck__mode--on' : ''}`}
          aria-selected={view === 'list'}
          onClick={() => setView('list')}
        >
          <LayoutGrid size={16} />
          Danh sách
        </button>
        <button
          type="button"
          role="tab"
          className={`learn-flashdeck__mode${view === 'table' ? ' learn-flashdeck__mode--on' : ''}`}
          aria-selected={view === 'table'}
          onClick={() => setView('table')}
        >
          <Table2 size={16} />
          Bảng tra
        </button>
      </div>

      {view === 'table' ? (
        <GrammarTable items={safe} />
      ) : (
        <div className="learn-grammar-panel__list">
          {safe.map((g, idx) => (
            <GrammarCard key={g.id ?? g.Id ?? `g-${idx}`} item={g} index={idx} />
          ))}
        </div>
      )}
    </section>
  );
}
