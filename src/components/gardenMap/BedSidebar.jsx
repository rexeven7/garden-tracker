import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const BED_TYPES = [
  { value: 'raised_bed', label: '🪵 Raised Bed' },
  { value: 'in_ground',  label: '🌍 In-Ground' },
  { value: 'container',  label: '🪣 Container' },
  { value: 'seed_tray',  label: '🌱 Seed Tray' },
  { value: 'greenhouse', label: '🏡 Greenhouse' },
  { value: 'other',      label: '📦 Other' },
]

const BED_COLORS = {
  raised_bed: '#A0845C', in_ground: '#6B5B4E', container: '#C67B4B',
  seed_tray: '#B8B8B8', greenhouse: '#8DB580', other: '#9CA3AF',
}

export default function BedSidebar({
  user,
  gardenId,
  beds,
  allBeds,
  selectedBed,
  onBedAdded,
  onBedUpdated,
  onBedDeleted,
  onSelectBed,
  onAddBedToGarden,
  onRemoveBedFromGarden,
}) {
  const [tab, setTab] = useState('beds') // 'beds' | 'properties'
  const [showNewBed, setShowNewBed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', size_sqft: '', location_notes: '',
    type: 'raised_bed', width_ft: '', height_ft: '',
  })
  const [propForm, setPropForm] = useState(null)

  // Switch to properties tab when a bed is selected
  if (selectedBed && tab === 'beds' && !showNewBed) {
    // Don't auto-switch — let user control tabs
  }

  function openNewBed() {
    setForm({ name: '', description: '', size_sqft: '', location_notes: '', type: 'raised_bed', width_ft: '', height_ft: '' })
    setShowNewBed(true)
  }

  async function saveNewBed() {
    if (!form.name.trim()) { alert('Bed name is required.'); return }
    setSaving(true)
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      description: form.description || null,
      size_sqft: form.size_sqft ? parseFloat(form.size_sqft) : null,
      location_notes: form.location_notes || null,
      type: form.type || 'raised_bed',
      width_ft: form.width_ft ? parseFloat(form.width_ft) : null,
      height_ft: form.height_ft ? parseFloat(form.height_ft) : null,
    }
    const { data, error } = await supabase.from('beds').insert(payload).select().single()
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setShowNewBed(false)
    onBedAdded?.(data)
  }

  async function saveBedProperties() {
    if (!propForm || !selectedBed) return
    setSaving(true)
    const payload = {
      name: propForm.name,
      description: propForm.description || null,
      location_notes: propForm.location_notes || null,
      type: propForm.type,
      width_ft: propForm.width_ft ? parseFloat(propForm.width_ft) : null,
      height_ft: propForm.height_ft ? parseFloat(propForm.height_ft) : null,
      x: propForm.x ? parseFloat(propForm.x) : null,
      y: propForm.y ? parseFloat(propForm.y) : null,
      rotation_deg: propForm.rotation_deg ? parseFloat(propForm.rotation_deg) : 0,
    }
    await supabase.from('beds').update(payload).eq('id', selectedBed.id)
    setSaving(false)
    onBedUpdated?.({ ...selectedBed, ...payload })
  }

  async function deleteBed(bed) {
    if (!window.confirm(`Delete "${bed.name}"? This cannot be undone.`)) return
    await supabase.from('beds').delete().eq('id', bed.id)
    onBedDeleted?.(bed.id)
  }

  async function removeFromGarden(bed) {
    await supabase.from('beds').update({ garden_id: null, x: null, y: null }).eq('id', bed.id)
    onRemoveBedFromGarden?.(bed.id)
  }

  // When selectedBed changes, sync propForm
  if (selectedBed && (!propForm || propForm._id !== selectedBed.id)) {
    setPropForm({
      _id: selectedBed.id,
      name: selectedBed.name || '',
      description: selectedBed.description || '',
      location_notes: selectedBed.location_notes || '',
      type: selectedBed.type || 'raised_bed',
      width_ft: selectedBed.width_ft || '',
      height_ft: selectedBed.height_ft || '',
      x: selectedBed.x || '',
      y: selectedBed.y || '',
      rotation_deg: selectedBed.rotation_deg || 0,
    })
  }

  const unplacedBeds = allBeds.filter(b => !b.garden_id)
  const placedBeds = beds // already filtered to this garden

  return (
    <div className="bed-sidebar">
      <div className="bed-sidebar-tabs">
        <button
          className={`bed-sidebar-tab ${tab === 'beds' ? 'active' : ''}`}
          onClick={() => setTab('beds')}
        >
          Your Beds
        </button>
        <button
          className={`bed-sidebar-tab ${tab === 'properties' ? 'active' : ''}`}
          onClick={() => setTab('properties')}
          disabled={!selectedBed}
        >
          Properties
        </button>
      </div>

      {tab === 'beds' && !showNewBed && (
        <div className="bed-sidebar-content">
          <div className="bed-sidebar-section-header">
            <span>In Garden ({placedBeds.length})</span>
          </div>
          {placedBeds.length === 0 && (
            <p className="text-sm text-muted" style={{ padding: '0.75rem 1rem' }}>
              No beds placed yet. Add beds from below or drag them onto the canvas.
            </p>
          )}
          {placedBeds.map(bed => (
            <div
              key={bed.id}
              className={`bed-list-item ${selectedBed?.id === bed.id ? 'selected' : ''}`}
              onClick={() => onSelectBed?.(bed)}
            >
              <div className="bed-list-dot" style={{ background: BED_COLORS[bed.type] || '#9CA3AF' }} />
              <div className="bed-list-info">
                <strong>{bed.name}</strong>
                {bed.width_ft && bed.height_ft && (
                  <span className="text-sm text-muted"> {bed.width_ft}×{bed.height_ft} ft</span>
                )}
              </div>
              <span className="bed-list-check">✓</span>
            </div>
          ))}

          {unplacedBeds.length > 0 && (
            <>
              <div className="bed-sidebar-section-header">
                <span>Not Placed ({unplacedBeds.length})</span>
              </div>
              {unplacedBeds.map(bed => (
                <div key={bed.id} className="bed-list-item unplaced">
                  <div className="bed-list-dot" style={{ background: BED_COLORS[bed.type] || '#9CA3AF' }} />
                  <div className="bed-list-info">
                    <strong>{bed.name}</strong>
                    {bed.width_ft && bed.height_ft && (
                      <span className="text-sm text-muted"> {bed.width_ft}×{bed.height_ft} ft</span>
                    )}
                  </div>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => onAddBedToGarden?.(bed)}
                  >
                    + Add
                  </button>
                </div>
              ))}
            </>
          )}

          <div style={{ padding: '1rem' }}>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewBed}>
              + New Bed
            </button>
          </div>
        </div>
      )}

      {tab === 'beds' && showNewBed && (
        <div className="bed-sidebar-content">
          <div className="bed-sidebar-form-header">
            <h3>New Bed</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowNewBed(false)}>✕</button>
          </div>
          <div style={{ padding: '0 1rem 1rem' }}>
            <div className="form-group">
              <label>Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Raised Bed 1" />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {BED_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Width (ft)</label>
                <input type="number" value={form.width_ft} onChange={e => setForm({ ...form, width_ft: e.target.value })} placeholder="4" min="1" />
              </div>
              <div className="form-group">
                <label>Depth (ft)</label>
                <input type="number" value={form.height_ft} onChange={e => setForm({ ...form, height_ft: e.target.value })} placeholder="8" min="1" />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" />
            </div>
            <div className="flex gap-1">
              <button className="btn btn-secondary" onClick={() => setShowNewBed(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveNewBed} disabled={saving}>
                {saving ? 'Saving…' : 'Create Bed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'properties' && selectedBed && propForm && (
        <div className="bed-sidebar-content">
          <div style={{ padding: '0 1rem 1rem' }}>
            <div className="form-group">
              <label>Name</label>
              <input value={propForm.name} onChange={e => setPropForm({ ...propForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={propForm.type} onChange={e => setPropForm({ ...propForm, type: e.target.value })}>
                {BED_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Width (ft)</label>
                <input type="number" value={propForm.width_ft} onChange={e => setPropForm({ ...propForm, width_ft: e.target.value })} min="1" />
              </div>
              <div className="form-group">
                <label>Depth (ft)</label>
                <input type="number" value={propForm.height_ft} onChange={e => setPropForm({ ...propForm, height_ft: e.target.value })} min="1" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>X position (ft)</label>
                <input type="number" value={propForm.x} onChange={e => setPropForm({ ...propForm, x: e.target.value })} min="0" step="0.5" />
              </div>
              <div className="form-group">
                <label>Y position (ft)</label>
                <input type="number" value={propForm.y} onChange={e => setPropForm({ ...propForm, y: e.target.value })} min="0" step="0.5" />
              </div>
            </div>
            <div className="form-group">
              <label>Rotation (°)</label>
              <input type="number" value={propForm.rotation_deg} onChange={e => setPropForm({ ...propForm, rotation_deg: e.target.value })} step="15" />
            </div>
            <div className="form-group">
              <label>Location Notes</label>
              <input value={propForm.location_notes} onChange={e => setPropForm({ ...propForm, location_notes: e.target.value })} placeholder="e.g. Full sun, near fence" />
            </div>
            <div className="flex gap-1 mb-2">
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveBedProperties} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: '0.5rem' }}
              onClick={() => removeFromGarden(selectedBed)}
            >
              Remove from Garden
            </button>
            <button
              className="btn btn-danger"
              style={{ width: '100%' }}
              onClick={() => deleteBed(selectedBed)}
            >
              Delete Bed
            </button>
          </div>
        </div>
      )}

      {tab === 'properties' && !selectedBed && (
        <div className="bed-sidebar-content">
          <p className="text-sm text-muted" style={{ padding: '1rem' }}>
            Click a bed on the canvas to view and edit its properties.
          </p>
        </div>
      )}
    </div>
  )
}
