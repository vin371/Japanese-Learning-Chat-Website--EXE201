export function SurveyQuestionCard({ question, options, value, onChange }) {
  return (
    <div className="survey-qcard">
      <h2 className="survey-qcard__title">{question}</h2>
      <div className="survey-qcard__opts" role="radiogroup" aria-label={question}>
        {options.map((opt) => {
          const id = `survey-${opt.replace(/\s+/g, '-')}`;
          const selected = value === opt;
          return (
            <label key={opt} htmlFor={id} className={`survey-opt ${selected ? 'survey-opt--selected' : ''}`}>
              <input
                id={id}
                type="radio"
                name="survey-option"
                value={opt}
                checked={selected}
                onChange={() => onChange(opt)}
              />
              <span className="survey-opt__text">{opt}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
