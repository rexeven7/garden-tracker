import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [beds, setBeds] = useState([])         // beds placed in this garden
  const [allBeds, setAllBeds] = useState([])   // all user beds
  const [selectedBed, setSelectedBed] = useState(null)
  const [layers, setLayers] = useState(DEFAULT_LAYERS)
  const [hoverItem, setHoverItem] = useState(null)
  const [hoverType, setHoverType] = useState(null)
  const [saveStatus, setSaveStatus] = useState('')  // '' | 'saving' | 'saved'
  const saveTimer = useRef(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)

    // Load garden (first one for this user)
    const { data: gardens } = await supabase
      .from('gardens')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')
      .limit(1)

    const g = gardens?.[0] || null
    setGarden(g)

    if (g) {
      await loadBeds(g.id)
    }

    // Load all beds (for sidebar unplaced list)
    const { data: allBedData } = await supabase
      .from('beds')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
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

  // Debounced save
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
    // Optimistically update local state
    setBeds(prev => prev.map(b => b.id === bedId ? { ...b, x: newX, y: newY } : b))
    scheduleSave(() => supabase.from('beds').update({ x: newX, y: newY }).eq('id', bedId))
  }

  async function handleBedResize(bedId, dims) {
    setBeds(prev => prev.map(b => b.id === bedId ? { ...b, ...dims } : b))
    scheduleSave(() => supabase.from('beds').update(dims).eq('id', bedId))
  }

  async function handleAddBedToGarden(bed) {
    // Place bed at origin if no position
    const payload = { garden_id: garden.id, x: 0, y: 0 }
    await supabase.from('beds').update(payload).eq('id', bed.id)
    await loadBeds(garden.id)
    // Refresh allBeds
    const { data } = await supabase.from('beds').select('*').eq('user_id', user.id).order('name')
    setAllBeds(data || [])
  }

  async function handleRemoveBedFromGarden(bedId) {
    setBeds(prev => prev.filter(b => b.id !== bedId))
    if (selectedBed?.id === bedId) setSelectedBed(null)
    const { data } = await supabase.from('beds').select('*').eq('user_id', user.id).order('name')
    setAllBeds(data || [])
  }

  async function handleBedAdded(newBed) {
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

  function handleHoverItem(item, type) {
    setHoverItem(item)
    setHoverType(type)
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
      {/* Page header */}
      <div className="garden-page-header">
        <div>
          <h1 style={{ marginBottom: 0 }}>{garden.name}</h1>
          <span className="text-sm text-muted">{garden.width_ft} × {garden.height_ft} ft</span>
        </div>
        <div className="flex gap-2 align-center">
          {saveStatus === 'saving' && <span className="text-sm text-muted">Saving…</span>}
          {saveStatus === 'saved' && <span className="text-sm" style={{ color: 'var(--leaf)' }}>✓ Saved</span>}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (window.confirm('Edit garden settings?')) {
                // Reset garden to trigger setup (could be a modal in the future)
              }
            }}
            title="Garden settings"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Layer controls */}
      <LayerControls layers={layers} onToggle={toggleLayer} />

      {/* Main layout: canvas + sidebar */}
      <div className="garden-layout">
        {/* Canvas area */}
        <div className="garden-canvas-wrapper">
          <GardenCanvas
            garden={garden}
            beds={beds}
            selectedBed={selectedBed}
            layers={layers}
            readOnly={false}
            onSelectBed={bed => {
              setSelectedBed(bed)
              if (bed) setHoverItem(null)
            }}
            onBedDragEnd={handleBedDragEnd}
            onBedResize={handleBedResize}
            onHoverItem={handleHoverItem}
            onHoverEnd={() => {}}
          />
        </div>

        {/* Sidebar */}
        <BedSidebar
          user={user}
          gardenId={garden.id}
          beds={beds}
          allBeds={allBeds}
          selectedBed={selectedBed}
          onBedAdded={handleBedAdded}
          onBedUpdated={handleBedUpdated}
          onBedDeleted={handleBedDeleted}
          onSelectBed={setSelectedBed}
          onAddBedToGarden={handleAddBedToGarden}
          onRemoveBedFromGarden={handleRemoveBedFromGarden}
        />
      </div>

      {/* Hover card (rendered as portal-like absolute div) */}
      {hoverItem && (
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
