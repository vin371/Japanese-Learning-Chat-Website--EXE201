import SpeakJaButton from '../../../components/learn/SpeakJaButton';

export default function ApiKanjiTable({ items }) {
  return (
    <div className="learn-vocab-table-wrap">
      <table className="learn-table learn-table--kanji learn-vocab-table">
        <thead>
          <tr>
            <th className="learn-vocab-table__col-no">#</th>
            <th>Hán tự</th>
            <th>Đọc</th>
            <th>Nghĩa</th>
            <th className="learn-vocab-table__col-audio">
              <span className="sr-only">Phát âm</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((k, idx) => {
            const char = k.character ?? k.Character ?? k.kanjiChar ?? k.wordJp ?? '';
            const reading = [k.readingsKun ?? k.ReadingsKun, k.readingsOn ?? k.ReadingsOn, k.reading ?? k.Reading]
              .filter(Boolean)
              .join(' · ');
            const vi = k.meaningVi ?? k.MeaningVi ?? '';
            return (
              <tr key={k.id ?? k.Id ?? `${char}-${idx}`} className="learn-vocab-table__row">
                <td className="learn-vocab-table__no">{idx + 1}</td>
                <td className="learn-table__kanji-cell learn-vocab-table__word" lang="ja">
                  {char}
                </td>
                <td className="learn-vocab-table__reading" lang="ja">
                  {reading}
                </td>
                <td className="learn-vocab-table__mean">{vi}</td>
                <td className="learn-vocab-table__audio">
                  {char ? <SpeakJaButton text={char} label={`Nghe: ${char}`} /> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
