export default function SingleChoice({ options, value, onChange }) {
  return (
    <div className="choice-list">
      {options.map(o => (
        <button key={o.id} className={`choice-card${value === o.id ? ' sel' : ''}`} onClick={() => onChange(o.id)} type="button">
          <span className={`radio${value === o.id ? ' sel' : ''}`} />
          <span style={{ flex: 1 }}>{o.label}</span>
        </button>
      ))}
    </div>
  )
}
