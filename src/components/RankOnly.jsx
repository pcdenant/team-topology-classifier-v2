import { useState, useEffect } from 'react'

export default function RankOnly({ options, value, onChange }) {
  const init = options.map(o => o.id)
  const [ranked, setRanked] = useState(value?.ranked ?? init)
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)

  useEffect(() => { if (!value) onChange({ ranked: init }) }, [])

  const move = (id, dir) => {
    const i = ranked.indexOf(id), ni = i + dir
    if (ni < 0 || ni >= ranked.length) return
    const nr = [...ranked]; [nr[i], nr[ni]] = [nr[ni], nr[i]]
    setRanked(nr); onChange({ ranked: nr })
  }

  return (
    <div>
      <p className="lbl" style={{ marginBottom: 8 }}>
        Du plus fréquent au moins fréquent <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#999' }}>(flèches ou glisser)</span>
      </p>
      <div className="rank-list">
        {ranked.map((id, i) => {
          const o = options.find(x => x.id === id)
          return (
            <div key={id}
              className={`rank-item${dragId === id ? ' drag' : ''}${overId === id ? ' over' : ''}`}
              draggable
              onDragStart={e => { setDragId(id); e.dataTransfer.effectAllowed = 'move' }}
              onDragOver={e => { e.preventDefault(); if (id !== dragId) setOverId(id) }}
              onDrop={e => {
                e.preventDefault()
                if (!dragId || dragId === id) return
                const fi = ranked.indexOf(dragId), ti = ranked.indexOf(id)
                const nr = [...ranked]; nr.splice(fi, 1); nr.splice(ti, 0, dragId)
                setRanked(nr); setDragId(null); setOverId(null); onChange({ ranked: nr })
              }}
              onDragEnd={() => { setDragId(null); setOverId(null) }}>
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
