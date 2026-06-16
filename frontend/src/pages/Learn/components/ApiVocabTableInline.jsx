import SpeakJaButton from '../../../components/learn/SpeakJaButton';

/** Bảng tra — tách nhỏ để flashcard player import không kéo cả LearnLesson. */
export default function ApiVocabTable({ items }) {
  return (
    <div className="learn-vocab-table-wrap">
      <table className="learn-vocab-table">
        <thead>
          <tr>
            <th className="learn-vocab-table__col-no">#</th>
            <th className="learn-vocab-table__col-word">Từ / Kanji</th>
            <th className="learn-vocab-table__col-read">Cách đọc</th>
            <th className="learn-vocab-table__col-mean">Nghĩa</th>
            <th className="learn-vocab-table__col-audio">
              <span className="sr-only">Phát âm</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((v, idx) => {
            const w = v.wordJp ?? v.WordJp ?? '';
            const reading = String(v.reading ?? v.Reading ?? '').trim();
            const meaning = String(v.meaningVi ?? v.MeaningVi ?? '').trim();
            const speakText = (reading || w).trim();
            return (
              <tr key={v.id ?? v.Id ?? `${w}-${idx}`} className="learn-vocab-table__row">
                <td className="learn-vocab-table__no">{idx + 1}</td>
                <td className="learn-vocab-table__word" lang="ja">
                  {w}
                </td>
                <td className="learn-vocab-table__reading" lang="ja">
                  {reading}
                </td>
                <td className="learn-vocab-table__mean">{meaning}</td>
                <td className="learn-vocab-table__audio">
                  {speakText ? (
                    <SpeakJaButton text={speakText} label={`Nghe: ${speakText}`} />
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
