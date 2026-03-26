import { useRef, useState, useEffect, useCallback } from 'react'
import { Stage, Layer, Line, Text } from 'react-konva'
import GardenBoundary from './GardenBoundary'
import BedShape from './BedShape'
import PlantIcon from './PlantIcon'

const PADDING = 40
const MIN_ZOOM = 0.15
const MAX_ZOOM = 4
const HOVER_DELAY_MS = 500  // how long mouse must rest before hover card appears

function autoLayoutPlants(plantings, bedWidthFt, bedHeightFt, scale) {
  const cols = Math.max(1, Math.floor(bedWidthFt))
  const rows = Math.max(1, Math.floor(bedHeightFt))
  const cellW = (bedWidthFt * scale) / cols
  const cellH = (bedHeightFt * scale) / rows
  return plantings.map((p, i) => {
    if (p.position_x != null && p.position_y != null) {
      return { ...p, _px: p.position_x * scale, _py: p.position_y * scale }
    }
    const col = i % cols
    const row = Math.floor(i / cols)
    return { ...p, _px: cellW * col + cellW / 2, _py: cellH * row + cellH / 2 }
  })
}

export default function GardenCanvas({
  garden,
  beds,
  selectedBed,
  layers,
  editMode,
  onSelectBed,
  onBedDragEnd,
  onBedResize,
  onHoverItem,
  onHoverEnd,
  stageRef: externalStageRef,
}) {
  const containerRef = useRef()
  const internalStageRef = useRef()
  const stageRef = externalStageRef || internalStageRef
  const hoverTimer = useRef(null)

  const [size, setSize] = useState({ w: 800, h: 600 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: PADDING, y: PADDING })

  const baseScale = Math.min(
    (size.w - PADDING * 2) / (garden.width_ft || 1),
    (size.h - PADDING * 2) / (garden.height_ft || 1)
  )

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setSize({ w: Math.max(200, width), h: Math.max(200, height) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const gw = (garden.width_ft || 1) * baseScale
    const gh = (garden.height_ft || 1) * baseScale
    setPan({ x: (size.w - gw) / 2, y: (size.h - gh) / 2 })
    setZoom(1)
  }, [garden.id, size.w, size.h])

  const handleWheel = useCallback(e => {
    e.evt.preventDefault()
    const stage = stageRef.current
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    const factor = e.evt.deltaY < 0 ? 1.12 : 0.9
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor))
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }
    setZoom(newZoom)
    setPan({
      x: pointer.x - mousePointTo.x * (newZoom / zoom * oldScale),
      y: pointer.y - mousePointTo.y * (newZoom / zoom * oldScale),
    })
  }, [zoom])

  function clearHoverTimer() {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
  }

  function scheduleHover(item, type) {
    clearHoverTimer()
    hoverTimer.current = setTimeout(() => {
      onHoverItem?.(item, type)
    }, HOVER_DELAY_MS)
  }

  function handleStageMouseDown(e) {
    clearHoverTimer()
    if (e.target === stageRef.current) {
      onSelectBed?.(null)
      onHoverEnd?.()
    }
  }

  function handleStageDragEnd(e) {
    setPan({ x: e.target.x(), y: e.target.y() })
  }

  function getScreenPos() {
    const stage = stageRef.current
    const containerBounds = containerRef.current?.getBoundingClientRect()
    const pos = stage?.getPointerPosition()
    if (!pos || !containerBounds) return null
    return { x: containerBounds.left + pos.x, y: containerBounds.top + pos.y }
  }

  function handleBedEnter(bed, e) {
    if (editMode) return  // no hover cards in edit mode
    if (!e) return
    const screenPos = getScreenPos()
    if (!screenPos) return
    scheduleHover({ ...bed, _screenPos: screenPos }, 'bed')
  }

  function handleBedLeave() {
    clearHoverTimer()
    onHoverEnd?.()
  }

  function handleBedDragStart() {
    // Cancel any pending hover when a drag begins
    clearHoverTimer()
    onHoverEnd?.()
  }

  function handlePlantEnter(planting, e) {
    if (editMode) return
    if (!e) return
    const screenPos = getScreenPos()
    if (!screenPos) return
    scheduleHover({ ...planting, _screenPos: screenPos }, 'planting')
  }

  function renderGrid() {
    if (!layers?.grid) return null
    const gw = garden.width_ft * baseScale
    const gh = garden.height_ft * baseScale
    const lines = []
    for (let x = 0; x <= garden.width_ft; x += garden.grid_spacing_ft || 1) {
      lines.push(<Line key={`v${x}`} points={[x * baseScale, 0, x * baseScale, gh]} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} listening={false} />)
    }
    for (let y = 0; y <= garden.height_ft; y += garden.grid_spacing_ft || 1) {
      lines.push(<Line key={`h${y}`} points={[0, y * baseScale, gw, y * baseScale]} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} listening={false} />)
    }
    return lines
  }

  function renderDateLabels(plantings) {
    if (!layers?.dates) return null
    return plantings.map(p => {
      const dates = []
      if (p.date_seeded) dates.push(`🫘 ${fmtDate(p.date_seeded)}`)
      if (p.date_transplanted) dates.push(`🌱 ${fmtDate(p.date_transplanted)}`)
      if (p.date_first_harvest) dates.push(`🧺 ${fmtDate(p.date_first_harvest)}`)
      if (dates.length === 0) return null
      return (
        <Text
          key={p.id + '_dates'}
          x={p._px + 12}
          y={p._py - 8}
          text={dates.join('  ')}
          fontSize={7}
          fontFamily="DM Sans, sans-serif"
          fill="rgba(255,255,255,0.8)"
          shadowColor="rgba(0,0,0,0.5)"
          shadowBlur={2}
          listening={false}
        />
      )
    })
  }

  function resetZoom() {
    setZoom(1)
    setPan({ x: (size.w - garden.width_ft * baseScale) / 2, y: (size.h - garden.height_ft * baseScale) / 2 })
  }

  return (
    <div ref={containerRef} className="garden-canvas-container">
      <div className="canvas-zoom-indicator">
        <button className="canvas-zoom-btn" onClick={() => setZoom(z => Math.min(MAX_ZOOM, z * 1.25))}>+</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button className="canvas-zoom-btn" onClick={() => setZoom(z => Math.max(MIN_ZOOM, z * 0.8))}>−</button>
        <button className="canvas-zoom-btn" title="Reset zoom" onClick={resetZoom}>⌂</button>
      </div>

      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        x={pan.x}
        y={pan.y}
        scaleX={zoom}
        scaleY={zoom}
        draggable
        onDragEnd={handleStageDragEnd}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        style={{ display: 'block' }}
      >
        <Layer>
          <GardenBoundary garden={garden} scale={baseScale} />
          {renderGrid()}
        </Layer>

        <Layer>
          {beds.map(bed => {
            const plantings = layers?.plants
              ? autoLayoutPlants(bed.plantings || [], bed.width_ft || 4, bed.height_ft || 4, baseScale)
              : []

            return (
              <BedShape
                key={bed.id}
                bed={bed}
                scale={baseScale}
                selected={selectedBed?.id === bed.id}
                editMode={editMode}
                onSelect={onSelectBed}
                onDragEnd={onBedDragEnd}
                onDragStart={handleBedDragStart}
                onResize={onBedResize}
                onHover={handleBedEnter}
                onHoverEnd={handleBedLeave}
                layers={layers}
              >
                {layers?.plants && plantings.map(p => (
                  <PlantIcon
                    key={p.id}
                    planting={p}
                    x={p._px}
                    y={p._py}
                    iconSize={Math.max(12, Math.min(24, baseScale * 0.8))}
                    showLabel={layers.plants && baseScale > 30}
                    showStatus={layers.status}
                    showSpacing={layers.spacing}
                    scale={baseScale}
                    onHover={handlePlantEnter}
                    onHoverEnd={handleBedLeave}
                  />
                ))}
                {layers?.plants && renderDateLabels(plantings)}
              </BedShape>
            )
          })}
        </Layer>
      </Stage>
    </div>
  )
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
