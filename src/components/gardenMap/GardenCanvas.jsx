import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { Stage, Layer, Line, Text } from 'react-konva'
import GardenBoundary from './GardenBoundary'
import BedShape from './BedShape'
import PlantIcon from './PlantIcon'

const PADDING = 60
const MIN_ZOOM = 0.15
const MAX_ZOOM = 4
const HOVER_DELAY_MS = 400

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
  compact,
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

  // Container size — needed so BedShapes know how many px per foot
  const [size, setSize] = useState({ w: 800, h: 600 })
  // Zoom display only — does NOT drive the Stage transform
  const [zoomPct, setZoomPct] = useState(100)

  // px per foot: fit garden into container at 1x zoom
  const baseScale = Math.min(
    (size.w - PADDING * 2) / Math.max(garden.width_ft, 1),
    (size.h - PADDING * 2) / Math.max(garden.height_ft, 1)
  )

  // Observe container size changes
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setSize({ w: Math.max(200, width), h: Math.max(200, height) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // When garden or container changes, re-center imperatively
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    if (compact && beds?.length > 0) {
      // In compact mode: fit the bounding box of placed beds (not the whole garden)
      const xs  = beds.map(b => b.x || 0)
      const ys  = beds.map(b => b.y || 0)
      const x2s = beds.map(b => (b.x || 0) + (b.width_ft  || 4))
      const y2s = beds.map(b => (b.y || 0) + (b.height_ft || 4))
      const minX = Math.min(...xs);  const maxX = Math.max(...x2s)
      const minY = Math.min(...ys);  const maxY = Math.max(...y2s)
      const bedW = (maxX - minX) * baseScale
      const bedH = (maxY - minY) * baseScale
      const fitScale = Math.min(
        (size.w - PADDING * 2) / Math.max(bedW, 1),
        (size.h - PADDING * 2) / Math.max(bedH, 1),
        4
      )
      const cx = ((minX + maxX) / 2) * baseScale * fitScale
      const cy = ((minY + maxY) / 2) * baseScale * fitScale
      stage.scale({ x: fitScale, y: fitScale })
      stage.position({ x: size.w / 2 - cx, y: size.h / 2 - cy })
      stage.batchDraw()
      setZoomPct(Math.round(fitScale * 100))
    } else {
      const gw = garden.width_ft * baseScale
      const gh = garden.height_ft * baseScale
      stage.scale({ x: 1, y: 1 })
      stage.position({ x: (size.w - gw) / 2, y: (size.h - gh) / 2 })
      stage.batchDraw()
      setZoomPct(100)
    }
  }, [garden.id, size.w, size.h, compact, beds?.length])

  // Wheel zoom — entirely imperative, never touches React state
  function handleWheel(e) {
    e.evt.preventDefault()
    const stage = stageRef.current
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    const factor = e.evt.deltaY < 0 ? 1.12 : 0.9
    const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldScale * factor))
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }
    stage.scale({ x: newScale, y: newScale })
    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
    stage.batchDraw()
    setZoomPct(Math.round(newScale * 100))
  }

  function zoomBy(factor) {
    const stage = stageRef.current
    if (!stage) return
    const oldScale = stage.scaleX()
    const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldScale * factor))
    const center = { x: size.w / 2, y: size.h / 2 }
    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    }
    stage.scale({ x: newScale, y: newScale })
    stage.position({
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    })
    stage.batchDraw()
    setZoomPct(Math.round(newScale * 100))
  }

  function resetZoom() {
    const stage = stageRef.current
    if (!stage) return
    const gw = garden.width_ft * baseScale
    const gh = garden.height_ft * baseScale
    stage.scale({ x: 1, y: 1 })
    stage.position({ x: (size.w - gw) / 2, y: (size.h - gh) / 2 })
    stage.batchDraw()
    setZoomPct(100)
  }

  // Hover helpers
  function clearHoverTimer() {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null }
  }

  function handleBedEnter(bed) {
    if (editMode) return
    clearHoverTimer()
    // Capture screen position now (synchronously in the event)
    const stage = stageRef.current
    const container = containerRef.current
    if (!stage || !container) return
    const pos = stage.getPointerPosition()
    const bounds = container.getBoundingClientRect()
    if (!pos) return
    const screenPos = { x: bounds.left + pos.x, y: bounds.top + pos.y }
    hoverTimer.current = setTimeout(() => {
      onHoverItem?.({ ...bed, _screenPos: screenPos }, 'bed')
    }, HOVER_DELAY_MS)
  }

  function handlePlantEnter(planting) {
    if (editMode) return
    clearHoverTimer()
    const stage = stageRef.current
    const container = containerRef.current
    if (!stage || !container) return
    const pos = stage.getPointerPosition()
    const bounds = container.getBoundingClientRect()
    if (!pos) return
    const screenPos = { x: bounds.left + pos.x, y: bounds.top + pos.y }
    hoverTimer.current = setTimeout(() => {
      onHoverItem?.({ ...planting, _screenPos: screenPos }, 'planting')
    }, HOVER_DELAY_MS)
  }

  function handleLeave() {
    clearHoverTimer()
    onHoverEnd?.()
  }

  function handleDragStart() {
    clearHoverTimer()
    onHoverEnd?.()
  }

  function handleStageClick(e) {
    if (e.target === stageRef.current) {
      onSelectBed?.(null)
      clearHoverTimer()
      onHoverEnd?.()
    }
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
      const parts = []
      if (p.date_seeded) parts.push(`🫘 ${fmtDate(p.date_seeded)}`)
      if (p.date_transplanted) parts.push(`🌱 ${fmtDate(p.date_transplanted)}`)
      if (p.date_first_harvest) parts.push(`🧺 ${fmtDate(p.date_first_harvest)}`)
      if (parts.length === 0) return null
      return (
        <Text key={p.id + '_dates'} x={p._px + 12} y={p._py - 8} text={parts.join('  ')}
          fontSize={7} fontFamily="DM Sans, sans-serif" fill="rgba(255,255,255,0.8)"
          shadowColor="rgba(0,0,0,0.5)" shadowBlur={2} listening={false} />
      )
    })
  }

  return (
    <div
      ref={containerRef}
      className={`garden-canvas-container${editMode ? ' edit-mode' : ''}`}
    >
      {!compact && (
        <div className="canvas-zoom-indicator">
          <button className="canvas-zoom-btn" onClick={() => zoomBy(1.25)}>+</button>
          <span>{zoomPct}%</span>
          <button className="canvas-zoom-btn" onClick={() => zoomBy(0.8)}>−</button>
          <button className="canvas-zoom-btn" title="Fit garden" onClick={resetZoom}>⌂</button>
        </div>
      )}

      {/*
        KEY: No x, y, scaleX, scaleY props on Stage.
        Konva owns its own transform. We only drive it imperatively via stageRef.
        This keeps Konva's hit-detection in sync with its actual rendered position.
      */}
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        draggable
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        style={{ display: 'block' }}
      >
        <Layer>
          <GardenBoundary garden={garden} scale={baseScale} />
          {renderGrid()}
        </Layer>

        <Layer>
          {(() => {
            // Compute stage scale once for all beds
            const stageScale = zoomPct / 100
            const targetScreen = Math.max(14, Math.min(28, 18 * Math.sqrt(stageScale)))
            return beds.map(bed => {
              // Compute plant positions when either plants or dates layer is active
              const needsLayout = layers?.plants || layers?.dates
              const plantings = needsLayout
                ? autoLayoutPlants(bed.plantings || [], bed.width_ft || 4, bed.height_ft || 4, baseScale)
                : []
              // Cap icon to 55% of the bed's smaller screen dimension so icons never overflow narrow beds
              const bedWorldW = (bed.width_ft || 4) * baseScale
              const bedWorldH = (bed.height_ft || 4) * baseScale
              const iconSize = Math.min(
                Math.max(8, targetScreen / stageScale),
                bedWorldW * 0.55,
                bedWorldH * 0.55
              )
              return (
                <BedShape
                  key={bed.id}
                  bed={bed}
                  scale={baseScale}
                  stageScale={stageScale}
                  selected={selectedBed?.id === bed.id}
                  editMode={editMode}
                  onSelect={onSelectBed}
                  onDragEnd={onBedDragEnd}
                  onDragStart={handleDragStart}
                  onResize={onBedResize}
                  onHover={handleBedEnter}
                  onHoverEnd={handleLeave}
                  layers={layers}
                >
                  {layers?.plants && plantings.map(p => (
                    <PlantIcon
                      key={p.id}
                      planting={p}
                      x={p._px}
                      y={p._py}
                      iconSize={iconSize}
                      showLabel={layers.plants && baseScale * stageScale > 25}
                      showStatus={layers.status}
                      showSpacing={layers.spacing}
                      scale={baseScale}
                      onHover={handlePlantEnter}
                      onHoverEnd={handleLeave}
                    />
                  ))}
                  {renderDateLabels(plantings)}
                </BedShape>
              )
            })
          })()}
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
