import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Approximate frost dates by US latitude band
const FROST_BY_LAT = [
  { maxLat: 30, spring: ['02-01', '03-01'], fall: ['11-15', '12-15'] },
  { maxLat: 33, spring: ['03-01', '04-01'], fall: ['10-25', '11-15'] },
  { maxLat: 36, spring: ['04-01', '04-15'], fall: ['10-15', '10-28'] },
  { maxLat: 40, spring: ['04-10', '04-25'], fall: ['10-01', '10-20'] },
  { maxLat: 44, spring: ['04-20', '05-05'], fall: ['09-20', '10-08'] },
  { maxLat: 47, spring: ['05-01', '05-15'], fall: ['09-10', '09-25'] },
  { maxLat: 90, spring: ['05-15', '06-01'], fall: ['08-25', '09-15'] },
]

// ── Beds Page ──────────────────────────────────────────────────
export function Beds({ user }) {
  const [beds, setBeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const BED_TYPES = [
    { value: 'raised_bed', label: '🪵 Raised Bed' },
    { value: 'in_ground', label: '🌍 In-Ground' },
    { value: 'container', label: '🪣 Container / Pot' },
    { value: 'seed_tray', label: '🌱 Seed Tray / Indoor' },
    { value: 'greenhouse', label: '🏡 Greenhouse' },
    { value: 'other', label: '📦 Other' },
  ]

  const emptyForm = { name: '', description: '', size_sqft: '', location_notes: '', type: 'raised_bed' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('beds').select('*').eq('user_id', user.id).order('name')
    setBeds(data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(emptyForm); setShowModal(true) }
  function openEdit(b) { setEditing(b.id); setForm({ name: b.name, description: b.description || '', size_sqft: b.size_sqft || '', location_notes: b.location_notes || '', type: b.type || 'raised_bed' }); setShowModal(true) }

  async function save() {
    const payload = { ...form, user_id: user.id, size_sqft: form.size_sqft ? parseFloat(form.size_sqft) : null, type: form.type || 'raised_bed' }
    if (editing) await supabase.from('beds').update(payload).eq('id', editing)
    else await supabase.from('beds').insert(payload)
    setShowModal(false)
    load()
  }

  async function deleteBed(id) {
    if (!window.confirm('Delete this bed? Plantings in this bed will lose their bed assignment.')) return
    await supabase.from('beds').delete().eq('id', id)
    load()
  }

  if (loading) return <div className="empty-state"><p>Loading…</p></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Beds & Areas</h1>
          <p className="text-muted">Name and describe your raised beds and growing areas</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add Bed</button>
      </div>

      {beds.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🪴</div>
          <h3>No beds yet</h3>
          <p>Add your raised beds and growing areas to start tracking plantings and rotation.</p>
          <button className="btn btn-primary mt-2" onClick={openNew}>Add First Bed</button>
        </div>
      ) : (
        <div className="grid-3">
          {beds.map(b => (
            <div key={b.id} className="card">
              <div className="card-header">
                <h3>{b.name}</h3>
                <div className="flex gap-1">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteBed(b.id)}>✕</button>
                </div>
              </div>
              {b.type && <p className="text-sm mb-1">{BED_TYPES.find(t => t.value === b.type)?.label || b.type}</p>}
              {b.description && <p className="text-sm mb-1">{b.description}</p>}
              {b.size_sqft && <p className="text-sm text-muted">📐 {b.size_sqft} sq ft</p>}
              {b.location_notes && <p className="text-sm text-muted mt-1">📍 {b.location_notes}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Bed' : 'Add Bed'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Bed Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Raised Bed 1, South Garden, Herb Patch" />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {BED_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Sunny south-facing 4x8 bed" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Size (sq ft)</label>
                <input type="number" value={form.size_sqft} onChange={e => setForm({ ...form, size_sqft: e.target.value })} placeholder="32" />
              </div>
              <div className="form-group">
                <label>Location Notes</label>
                <input value={form.location_notes} onChange={e => setForm({ ...form, location_notes: e.target.value })} placeholder="e.g. Near fence, full sun" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save Bed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Seasons Page ───────────────────────────────────────────────
export function Seasons({ user }) {
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const emptyForm = { year: new Date().getFullYear(), spring_frost_start: '', spring_frost_end: '', fall_frost_start: '', fall_frost_end: '', notes: '' }
  const [form, setForm] = useState(emptyForm)
  const [zip, setZip] = useState('')
  const [lookingUp, setLookingUp] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('seasons').select('*').eq('user_id', user.id).order('year', { ascending: false })
    setSeasons(data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(emptyForm); setZip(''); setShowModal(true) }
  function openEdit(s) {
    setEditing(s.id)
    setForm({ year: s.year, spring_frost_start: s.spring_frost_start || '', spring_frost_end: s.spring_frost_end || '', fall_frost_start: s.fall_frost_start || '', fall_frost_end: s.fall_frost_end || '', notes: s.notes || '' })
    setZip('')
    setShowModal(true)
  }

  async function lookupFrostDates() {
    if (!zip || zip.length < 5) return
    setLookingUp(true)
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
      if (!res.ok) throw new Error('ZIP not found')
      const data = await res.json()
      const lat = parseFloat(data.places[0].latitude)
      const entry = FROST_BY_LAT.find(e => lat < e.maxLat) || FROST_BY_LAT[FROST_BY_LAT.length - 1]
      const yr = form.year
      setForm(f => ({
        ...f,
        spring_frost_start: `${yr}-${entry.spring[0]}`,
        spring_frost_end: `${yr}-${entry.spring[1]}`,
        fall_frost_start: `${yr}-${entry.fall[0]}`,
        fall_frost_end: `${yr}-${entry.fall[1]}`,
      }))
    } catch {
      alert('Could not find frost dates for that ZIP code. Check the zip and try again, or enter dates manually.')
    }
    setLookingUp(false)
  }

  async function save() {
    const payload = {
      ...form,
      user_id: user.id,
      year: parseInt(form.year),
      spring_frost_start: form.spring_frost_start || null,
      spring_frost_end: form.spring_frost_end || null,
      fall_frost_start: form.fall_frost_start || null,
      fall_frost_end: form.fall_frost_end || null,
    }
    if (editing) await supabase.from('seasons').update(payload).eq('id', editing)
    else await supabase.from('seasons').insert(payload)
    setShowModal(false)
    load()
  }

  async function deleteSeason(id) {
    if (!window.confirm('Delete this season? All associated plantings will lose their season assignment.')) return
    await supabase.from('seasons').delete().eq('id', id)
    load()
  }

  if (loading) return <div className="empty-state"><p>Loading…</p></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Seasons</h1>
          <p className="text-muted">Track frost dates and garden years for rotation history</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add Season</button>
      </div>

      {seasons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No seasons yet</h3>
          <p>Add the current growing season to start logging plantings. Add past seasons for rotation history.</p>
          <button className="btn btn-primary mt-2" onClick={openNew}>Add {new Date().getFullYear()} Season</button>
        </div>
      ) : (
        <div className="grid-2">
          {seasons.map(s => (
            <div key={s.id} className="card">
              <div className="card-header">
                <h2 className="font-display">{s.year}</h2>
                <div className="flex gap-1">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteSeason(s.id)}>✕</button>
                </div>
              </div>
              {(s.spring_frost_start || s.spring_frost_end) && (
                <p className="text-sm mb-1">
                  🌸 <strong>Spring frost:</strong> {s.spring_frost_start} — {s.spring_frost_end}
                </p>
              )}
              {(s.fall_frost_start || s.fall_frost_end) && (
                <p className="text-sm mb-1">
                  🍂 <strong>Fall frost:</strong> {s.fall_frost_start} — {s.fall_frost_end}
                </p>
              )}
              {s.notes && <p className="text-sm text-muted mt-1">{s.notes}</p>}
              {!s.spring_frost_start && !s.fall_frost_start && !s.notes && (
                <p className="text-sm text-muted">No frost dates recorded</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Season' : 'Add Season'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>Year *</label>
              <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
            </div>
            <div className="form-row" style={{ alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Look up frost dates by ZIP code</label>
                <input
                  value={zip}
                  onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="e.g. 90210"
                  maxLength={5}
                />
              </div>
              <div className="form-group" style={{ flex: '0 0 auto' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={lookupFrostDates}
                  disabled={lookingUp || zip.length < 5}
                >
                  {lookingUp ? 'Looking up…' : '🌡 Auto-fill'}
                </button>
              </div>
            </div>
            <p className="text-sm text-muted mb-2" style={{ marginTop: '-0.5rem' }}>Approximate dates based on your location — adjust as needed.</p>
            <div className="form-row">
              <div className="form-group">
                <label>Spring Frost Start</label>
                <input type="date" value={form.spring_frost_start} onChange={e => setForm({ ...form, spring_frost_start: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Spring Frost End</label>
                <input type="date" value={form.spring_frost_end} onChange={e => setForm({ ...form, spring_frost_end: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fall Frost Start</label>
                <input type="date" value={form.fall_frost_start} onChange={e => setForm({ ...form, fall_frost_start: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Fall Frost End</label>
                <input type="date" value={form.fall_frost_end} onChange={e => setForm({ ...form, fall_frost_end: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Anything notable about this growing season" />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save Season</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
