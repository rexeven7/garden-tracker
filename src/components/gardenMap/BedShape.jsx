import { useRef } from 'react'
import { Group, Rect, Circle, Text } from 'react-konva'

const BED_COLORS = {
  raised_bed:  '#A0845C',
  in_ground:   '#6B5B4E',
  container:   '#C67B4B',
  seed_tray:   '#B8B8B8',
  greenhouse:  '#8DB58080',
  other:       '#9CA3AF',
}

const HANDLE_SIZE = 10  // slightly larger for easier grabbing
const MIN_FT = 1

export default function BedShape({
  bed,
  scale,
  selected,
  editMode,
  onSelect,
  onDragEnd,
  onDragStart,
  onResize,
  onHover,
  onHoverEnd,
  layers,
  children,
}) {
  const groupRef = useRef()

  const x = (bed.x || 0) * scale
  const y = (bed.y || 0) * scale
  const w = (bed.width_ft || 4) * scale
  const h = (bed.height_ft || 4) * scale
  const fillColor = BED_COLORS[bed.type] || BED_COLORS.other

  function handleDragEnd(e) {
    const newX = Math.max(0, e.target.x() / scale)
    const newY = Math.max(0, e.target.y() / scale)
    onDragEnd?.(bed.id, newX, newY)
  }

  // Show resize handles only when selected AND in edit mode
  const handles = (selected && editMode) ? [
    { id: 'tl', cx: 0,   cy: 0   },
    { id: 'tr', cx: w,   cy: 0   },
    { id: 'bl', cx: 0,   cy: h   },
    { id: 'br', cx: w,   cy: h   },
    { id: 'tc', cx: w/2, cy: 0   },
    { id: 'bc', cx: w/2, cy: h   },
    { id: 'ml', cx: 0,   cy: h/2 },
    { id: 'mr', cx: w,   cy: h/2 },
  ] : []

  function handleResizeDragEnd(handleId, e) {
    if (!onResize) return
    const dx = e.target.x() / scale
    const dy = e.target.y() / scale
    let newW = bed.width_ft
    let newH = bed.height_ft
    let newX = bed.x || 0
    let newY = bed.y || 0
    if (handleId.includes('r')) newW = Math.max(MIN_FT, dx)
    if (handleId.includes('l')) { newW = Math.max(MIN_FT, bed.width_ft - dx); newX = (bed.x || 0) + dx }
    if (handleId.includes('b')) newH = Math.max(MIN_FT, dy)
    if (handleId.includes('t')) { newH = Math.max(MIN_FT, bed.height_ft - dy); newY = (bed.y || 0) + dy }
    e.target.x(0)
    e.target.y(0)
    onResize(bed.id, { width_ft: newW, height_ft: newH, x: newX, y: newY })
  }

  const labelFontSize = Math.max(10, Math.min(16, w / (bed.name?.length || 1) * 1.4))

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      draggable={editMode}
      onDragStart={() => { onDragStart?.() }}
      onDragEnd={handleDragEnd}
      onClick={e => { e.cancelBubble = true; onSelect?.(bed) }}
      onTap={e => { e.cancelBubble = true; onSelect?.(bed) }}
      onMouseEnter={e => {
        e.target.getStage().container().style.cursor = editMode ? 'grab' : 'pointer'
        onHover?.(bed, e)
      }}
      onMouseLeave={e => {
        e.target.getStage().container().style.cursor = 'default'
        onHoverEnd?.()
      }}
    >
      {/* Bed fill */}
      <Rect
        width={w}
        height={h}
        fill={fillColor}
        opacity={0.9}
        stroke={selected ? '#D4A853' : 'rgba(255,255,255,0.25)'}
        strokeWidth={selected ? 2.5 : 1}
        cornerRadius={4}
        shadowColor="rgba(0,0,0,0.25)"
        shadowBlur={4}
        shadowOffsetY={2}
      />

      {/* Status overlay */}
      {layers?.status && bed.plantings?.length > 0 && (() => {
        const priority = ['failed', 'harvested', 'growing', 'transplanted', 'seeded', 'planned']
        const worst = priority.find(s => bed.plantings.some(p => p.status === s))
        const colors = { planned: '#94a3b830', seeded: '#60a5fa30', transplanted: '#34d39930', growing: '#4ade8030', harvested: '#fbbf2430', failed: '#f8717130' }
        return worst ? <Rect width={w} height={h} fill={colors[worst] || 'transparent'} cornerRadius={4} listening={false} /> : null
      })()}

      {/* Bed name */}
      <Text
        text={bed.name}
        width={w}
        height={h}
        align="center"
        verticalAlign="middle"
        fontSize={labelFontSize}
        fontFamily="DM Sans, sans-serif"
        fontStyle="600"
        fill="white"
        shadowColor="rgba(0,0,0,0.6)"
        shadowBlur={3}
        shadowOffsetY={1}
        listening={false}
        ellipsis
        wrap="none"
      />

      {/* Dimensions (when selected in edit mode) */}
      {selected && editMode && (
        <Text
          text={`${bed.width_ft}×${bed.height_ft} ft`}
          x={0}
          y={h + 4}
          width={w}
          align="center"
          fontSize={10}
          fontFamily="DM Sans, sans-serif"
          fill="rgba(255,255,255,0.85)"
          shadowColor="rgba(0,0,0,0.5)"
          shadowBlur={2}
          listening={false}
        />
      )}

      {/* Tasks badge */}
      {layers?.tasks && (() => {
        const pending = bed.plantings?.flatMap(p => p.tasks || []).filter(t => !t.completed_at) || []
        const overdue = pending.filter(t => t.due_date && t.due_date < new Date().toISOString().split('T')[0])
        if (pending.length === 0) return null
        return (
          <Group x={w - 16} y={-8}>
            <Circle radius={10} fill={overdue.length > 0 ? '#ef4444' : '#f59e0b'} />
            <Text text={String(pending.length)} x={-10} y={-7} width={20} align="center" fontSize={10} fontStyle="bold" fill="white" listening={false} />
          </Group>
        )
      })()}

      {/* Resize handles — only in edit mode when selected */}
      {handles.map(h => (
        <Rect
          key={h.id}
          x={h.cx - HANDLE_SIZE / 2}
          y={h.cy - HANDLE_SIZE / 2}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          fill="white"
          stroke="#D4A853"
          strokeWidth={1.5}
          cornerRadius={2}
          draggable
          onDragEnd={e => handleResizeDragEnd(h.id, e)}
          onMouseEnter={e => { e.target.getStage().container().style.cursor = getCursor(h.id) }}
          onMouseLeave={e => { e.target.getStage().container().style.cursor = 'grab' }}
        />
      ))}

      {children}
    </Group>
  )
}

function getCursor(handleId) {
  if (handleId === 'tl' || handleId === 'br') return 'nwse-resize'
  if (handleId === 'tr' || handleId === 'bl') return 'nesw-resize'
  if (handleId === 'tc' || handleId === 'bc') return 'ns-resize'
  return 'ew-resize'
}
