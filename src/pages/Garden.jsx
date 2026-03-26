import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import GardenSetup from '../components/gardenMap/GardenSetup'
import GardenCanvas from '../components/gardenMap/GardenCanvas'
import BedSidebar from '../components/gardenMap/BedSidebar'
import HoverCard from '../components/gardenMap/HoverCard'
import LayerControls from '../components/gardenMap/LayerControls'

const DEFAULT_LAYERS = { plants: true, status: false, tasks: false, spacing: false, dates: false, grid: true }

export default function Garden({ user, navigate }) {
  const [loading, setLoading] = useState(true)
  const [garden, setGarden] = useState(null)
  const [beds, setBeds] = useState([])
  const [allBeds, setAllBeds] = useState([])
  const [selectedBed, setSelectedBed] = useState(null)
  const [layers, setLayers] = useState(DEFAULT_LAYERS)
  const [editMode, setEditMode] = useState(false)
  const [hoverItem, setHoverItem] = useState(null)
  const [hoverType, setHoverType] = useState(null)
  const [saveStatus, setSaveStatus] = useState('')
  const saveTimer = useRef(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: gardens } = await supabase
      .from('gardens').select('*').eq('user_id', user.id).order('created_at').limit(1)
    const g = gardens?.[0] || null
    setGarden(g)
    if (g) await loadBeds(g.id)
    const { data: allBedData } = await supabase
      .from('beds').select('*').eq('user_id', user.id).order('name')
    setAllBeds(allBedData || [])
    setLoading(false)
  }

  async function loadBeds(gardenId) {
    const { data } = await supabase
      .from('beds')
      .select(`
        *,
        plantings (
          id, status, custom_name, position_x, position_y,
          date_seeded, date_transplanted, date_first_harvest, date_last_harvest,
          plants ( id, name, variety, category ),
          tasks ( id, title, task_type, due_date, completed_at )
        )
      `)
      .eq('garden_id', gardenId)
      .eq('user_id', user.id)
      .order('name')
    setBeds(data || [])
  }

  function toggleLayer(key) {
    setLayers(l => ({ ...l, [key]: !l[key] }))
  }

  function scheduleSave(fn) {
    setSaveStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await fn()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(''), 2000)
    }, 500)
  }

  async function handleBedDragEnd(bedId, newX, newY) {
    setBeds(prev => prev.map(b => b.id === bedId ? { ...b, x: newX, y: newY } : b))
    scheduleSave(() => supabase.from('beds').update({ x: newX, y: newY }).eq('id', bedId))
  }

  async function handleBedResize(bedId, dims) {
    setBeds(prev => prev.map(b => b.id === bedId ? { ...b, ...dims } : b))
    scheduleSave(() => supabase.from('beds').update(dims).eq('id', bedId))
  }

  async function handleAddBedToGarden(bed) {
    const payload = { garden_id: garden.id, x: 1, y: 1 }
    await supabase.from('beds').update(payload).eq('id', bed.id)
    await loadBeds(garden.id)
    const { data } = await supabase.from('beds').select('*').eq('user_id', user.id).order('name')
    setAllBeds(data || [])
  }

  async function handleRemoveBedFromGarden(bedId) {
    setBeds(prev => prev.filter(b => b.id !== bedId))
    if (selectedBed?.id === bedId) setSelectedBed(null)
    const { data } = await supabase.from('beds').select('*').eq('user_id', user.id).order('name')
    setAllBeds(data || [])
  }

  async function handleBedAdded() {
    const { data } = await supabase.from('beds').select('*').eq('user_id', user.id).order('name')
    setAllBeds(data || [])
  }

  async function handleBedUpdated(updatedBed) {
    setBeds(prev => prev.map(b => b.id === updatedBed.id ? { ...b, ...updatedBed } : b))
    setSelectedBed(updatedBed)
    const { data } = await supabase.from('beds').select('*').eq('user_id', user.id).order('name')
    setAllBeds(data || [])
  }

  async function handleBedDeleted(bedId) {
    setBeds(prev => prev.filter(b => b.id !== bedId))
    if (selectedBed?.id === bedId) setSelectedBed(null)
    const { data } = await supabase.from('beds').select('*').eq('user_id', user.id).order('name')
    setAllBeds(data || [])
  }

  function toggleEditMode() {
    setEditMode(e => !e)
    // Clear hover card and selection when switching modes
    setHoverItem(null)
    setHoverType(null)
    if (editMode) setSelectedBed(null) // leaving edit mode — deselect
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '2rem' }}>🗺️</div>
        <p>Loading garden map…</p>
      </div>
    )
  }

  if (!garden) {
    return <GardenSetup user={user} onCreated={g => { setGarden(g); load() }} />
  }

  return (
    <div className="garden-page">
      <div className="garden-page-header">
        <div>
          <h1 style={{ marginBottom: 0 }}>{garden.name}</h1>
          <span className="text-sm text-muted">{garden.width_ft} × {garden.height_ft} ft</span>
        </div>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          {saveStatus === 'saving' && <span className="text-sm text-muted">Saving…</span>}
          {saveStatus === 'saved' && <span className="text-sm" style={{ color: 'var(--leaf)' }}>✓ Saved</span>}
          <button
            className={`btn btn-sm ${editMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={toggleEditMode}
          >
            {editMode ? '✓ Done Editing' : '✏️ Edit Layout'}
          </button>
        </div>
      </div>

      {editMode && (
        <div className="edit-mode-banner">
          Drag beds to reposition · Drag corners to resize · Click empty space to deselect
        </div>
      )}

      <LayerControls layers={layers} onToggle={toggleLayer} />

      <div className="garden-layout">
        <div className="garden-canvas-wrapper">
          <GardenCanvas
            garden={garden}
            beds={beds}
            selectedBed={selectedBed}
            layers={layers}
            editMode={editMode}
            onSelectBed={bed => {
              setSelectedBed(bed)
              setHoverItem(null)
            }}
            onBedDragEnd={handleBedDragEnd}
            onBedResize={handleBedResize}
            onHoverItem={(item, type) => {
              // Only show hover cards in view mode
              if (!editMode) {
                setHoverItem(item)
                setHoverType(type)
              }
            }}
            onHoverEnd={() => {
              if (!editMode) setHoverItem(null)
            }}
          />
        </div>

        <BedSidebar
          user={user}
          gardenId={garden.id}
          beds={beds}
          allBeds={allBeds}
          selectedBed={selectedBed}
          editMode={editMode}
          onBedAdded={handleBedAdded}
          onBedUpdated={handleBedUpdated}
          onBedDeleted={handleBedDeleted}
          onSelectBed={bed => { setSelectedBed(bed); setHoverItem(null) }}
          onAddBedToGarden={handleAddBedToGarden}
          onRemoveBedFromGarden={handleRemoveBedFromGarden}
        />
      </div>

      {!editMode && hoverItem && (
        <HoverCard
          item={hoverItem}
          type={hoverType}
          navigate={navigate || (() => {})}
          onClose={() => { setHoverItem(null); setHoverType(null) }}
        />
      )}
    </div>
  )
}
