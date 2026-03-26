import { useEffect, useRef } from 'react'
import { getEmoji } from './PlantIcon'

const STATUS_LABEL = {
  planned: '📋 Planned', seeded: '🫘 Seeded', transplanted: '🌱 Transplanted',
  growing: '🌿 Growing', harvested: '🧺 Harvested', failed: '💀 Failed',
}

const BED_TYPE_LABEL = {
  raised_bed: '🪵 Raised Bed', in_ground: '🌍 In-Ground',
  container: '🪣 Container', seed_tray: '🌱 Seed Tray',
  greenhouse: '🏡 Greenhouse', other: '📦 Other',
}

function fmt(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function HoverCard({ item, type, canvasRect, navigate, onClose }) {
  const cardRef = useRef()

  // Position the card near the pointer / node, staying within viewport
  useEffect(() => {
    if (!cardRef.current || !item?._screenPos) return
    const card = cardRef.current
    const vw = window.innerWidth
    const vh = window.innerHeight
    const { x, y } = item._screenPos
    const cw = card.offsetWidth
    const ch = card.offsetHeight
    const margin = 12

    let left = x + margin
    let top = y - ch / 2

    if (left + cw > vw - margin) left = x - cw - margin
    if (top < margin) top = margin
    if (top + ch > vh - margin) top = vh - ch - margin

    card.style.left = `${left}px`
    card.style.top = `${top}px`
  }, [item])

  if (!item) return null

  return (
    <div className="hover-card" ref={cardRef}>
      <button className="hover-card-close" onClick={onClose}>✕</button>

      {type === 'planting' && (
        <>
          <div className="hover-card-title">
            <span className="hover-card-emoji">{getEmoji(item.plants)}</span>
            <div>
              <strong>{item.custom_name || item.plants?.name || 'Unknown Plant'}</strong>
              {item.plants?.variety && <span className="text-sm text-muted"> — {item.plants.variety}</span>}
            </div>
          </div>
          <div className="hover-card-body">
            {item.status && <div className="hover-card-row">{STATUS_LABEL[item.status] || item.status}</div>}
            {item.date_seeded && <div className="hover-card-row">🫘 Seeded {fmt(item.date_seeded)}</div>}
            {item.date_transplanted && <div className="hover-card-row">🌱 Transplanted {fmt(item.date_transplanted)}</div>}
            {item.date_first_harvest && <div className="hover-card-row">🧺 First harvest {fmt(item.date_first_harvest)}</div>}
          </div>
          <div className="hover-card-actions">
            <button className="btn btn-sm btn-secondary" onClick={() => { navigate('plantings', { highlightId: item.id }); onClose() }}>
              View Planting
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => { navigate('tasks', { plantingId: item.id }); onClose() }}>
              Add Task
            </button>
          </div>
        </>
      )}

      {type === 'bed' && (
        <>
          <div className="hover-card-title">
            <span className="hover-card-emoji">🪴</span>
            <div>
              <strong>{item.name}</strong>
              {(item.width_ft && item.height_ft) && (
                <span className="text-sm text-muted"> ({item.width_ft}×{item.height_ft} ft)</span>
              )}
            </div>
          </div>
          <div className="hover-card-body">
            {item.type && <div className="hover-card-row">{BED_TYPE_LABEL[item.type] || item.type}</div>}
            {item.plantings?.length > 0 && (
              <div className="hover-card-row">{item.plantings.length} planting{item.plantings.length !== 1 ? 's' : ''} this season</div>
            )}
            {item.location_notes && <div className="hover-card-row text-muted">📍 {item.location_notes}</div>}
          </div>
          <div className="hover-card-actions">
            <button className="btn btn-sm btn-secondary" onClick={() => { navigate('plantings', { bedId: item.id }); onClose() }}>
              View Bed
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => { navigate('plantings', { newPlanting: true, bedId: item.id }); onClose() }}>
              Add Planting
            </button>
          </div>
        </>
      )}
    </div>
  )
}
