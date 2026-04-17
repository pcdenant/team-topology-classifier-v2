import { useState } from 'react'

export default function RankOnly({ options, value, onChange }) {
  const ranked = value?.ranked ?? options.map(o => o.id)
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)

  const move = (id, dir) => {
    const i = ranked.indexOf(id)
    const ni = i + dir
    if (i < 0 || ni < 0 || ni >= ranked.length) return
    const nr = [...ranked]
    ;[nr[i], nr[ni]] = [nr[ni], nr[i]]
    onChange({ ranked: nr })
  }

  const reorderByDrop = (targetId) => {
    if (!dragId || dragId === targetId) return
    const fi = ranked.indexOf(dragId)
    const ti = ranked.indexOf(targetId)
    if (fi < 0 || ti < 0) return
    const nr = [...ranked]
    nr.splice(fi, 1)
    nr.splice(ti, 0, dragId)
    onChange({ ranked: nr })
    setDragId(null)
    setOverId(null)
  }

  return (
    <div>
      <p className="lbl" style={{ marginBottom: 8 }}>
        Du plus fréquent au moins fréquent <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#999' }}>(flèches ou glisser)</span>
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
  )
}
