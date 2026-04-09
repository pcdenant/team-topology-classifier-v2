import { useState } from 'react'
import { C } from '../styles'

export default function HomeScreen({ onStart }) {
  const [name, setName] = useState('')

  return (
    <div className="empty-state">
      <div className="empty-logo">TT</div>
      <h1 className="empty-title">Quel type d'équipe êtes-vous vraiment ?</h1>
      <p className="empty-desc">
        Un diagnostic rapide pour clarifier la mission de votre équipe —
        sans jargon, en moins de 5 minutes.
      </p>

      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted }}>
          Nom de votre équipe <span style={{ fontWeight: 400 }}>(optionnel)</span>
        </label>
        <input
          className="input"
          type="text"
          placeholder="ex. Équipe Paiement, Team Data..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onStart(name)}
        />
      </div>

      <div className="empty-actions">
        <button className="btn btn-prim" onClick={() => onStart(name)}>
          Commencer le diagnostic
        </button>
        <button className="btn btn-sec" disabled style={{ opacity: 0.5 }}>
          Importer JSON
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, color: C.textLight, fontSize: 12, marginTop: 8 }}>
        <span>⏱ 3–5 minutes</span>
        <span>❓ 5 questions max</span>
        <span>🔒 Aucune donnée transmise</span>
      </div>
    </div>
  )
}
