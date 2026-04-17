import { useState } from 'react'

export default function MultiSelectRank({ options, value, onChange }) {
  const selected = value?.selected ?? []
  const ranked = value?.ranked ?? []
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)

  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange({
        selected: selected.filter(s => s !== id),
        ranked: ranked.filter(r => r !== id),
      })
    } else {
      onChange({ selected: [...selected, id], ranked: [...ranked, id] })
    }
  }

  const move = (id, dir) => {
    const i = ranked.indexOf(id)
    const ni = i + dir
    if (i < 0 || ni < 0 || ni >= ranked.length) return
    const nr = [...ranked]
    ;[nr[i], nr[ni]] = [nr[ni], nr[i]]
    onChange({ selected, ranked: nr })
  }

  const reorderByDrop = (targetId) => {
    if (!dragId || dragId === targetId) return
    const fi = ranked.indexOf(dragId)
    const ti = ranked.indexOf(targetId)
    if (fi < 0 || ti < 0) return
    const nr = [...ranked]
    nr.splice(fi, 1)
    nr.splice(ti, 0, dragId)
    onChange({ selected, ranked: nr })
    setDragId(null)
    setOverId(null)
  }

  return (
    <div>
      <div className="opt-list">
        {options.map(o => (
          <button
            key={o.id}
            className={`opt-card${selected.includes(o.id) ? ' sel' : ''}`}
            onClick={() => toggle(o.id)}
            type="button"
          >
            <span className={`chk${selected.includes(o.id) ? ' on' : ''}`}>
              {selected.includes(o.id) && '✓'}
            </span>
            <span style={{ flex: 1 }}>{o.label}</span>
          </button>
        ))}
      </div>

      {selected.length >= 2 && (
        <div style={{ marginTop: 16 }}>
          <p className="lbl" style={{ marginBottom: 8 }}>
            Classez par importance <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#999' }}>(le plus important en haut)</span>
          </p>
          <div className="rank-list">
            {ranked.map((id, i) => {
              const o = options.find(x => x.id === id)
              if (!o) return null
              return (
                <div
                  key={id}
                  className={`rank-item${dragId === id ? ' drag' : ''}${overId === id ? ' over' : ''}`}
                  draggable
                  onDragStart={e => { setDragId(id); e.dataTransfer.effectAllowed = 'move' }}
                  onDragOver={e => { e.preventDefault(); if (id !== dragId) setOverId(id) }}
                  onDrop={e => { e.preventDefault(); reorderByDrop(id) }}
                  onDragEnd={() => { setDragId(null); setOverId(null) }}
                >
                  <span className="rank-num">{i + 1}</span>
                  <span className="rank-txt">{o.label}</span>
                  <div className="rank-ctrls">
                    <button className="rank-btn" onClick={() => move(id, -1)} disabled={i === 0} type="button">↑</button>
                    <button className="rank-btn" onClick={() => move(id, 1)} disabled={i === ranked.length - 1} type="button">↓</button>
                  </div>
                  <span className="drag-h">⠿</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
