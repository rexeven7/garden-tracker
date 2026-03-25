import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ── Beds Page ──────────────────────────────────────────────────
export function Beds({ user }) {
  const [beds, setBeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const emptyForm = { name: '', description: '', size_sqft: '', location_notes: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('beds').select('*').eq('user_id', user.id).order('name')
    setBeds(data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(emptyForm); setShowModal(true) }
  function openEdit(b) { setEditing(b.id); setForm({ name: b.name, description: b.description || '', size_sqft: b.size_sqft || '', location_notes: b.location_notes || '' }); setShowModal(true) }

  async function save() {
    const payload = { ...form, user_id: user.id, size_sqft: form.size_sqft ? parseFloat(form.size_sqft) : null }
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
            <div className="form-group">
              <label>Bed Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Raised Bed 1, South Garden, Herb Patch" />
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

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('seasons').select('*').eq('user_id', user.id).order('year', { ascending: false })
    setSeasons(data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(emptyForm); setShowModal(true) }
  function openEdit(s) {
    setEditing(s.id)
    setForm({ year: s.year, spring_frost_start: s.spring_frost_start || '', spring_frost_end: s.spring_frost_end || '', fall_frost_start: s.fall_frost_start || '', fall_frost_end: s.fall_frost_end || '', notes: s.notes || '' })
    setShowModal(true)
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
            <p className="text-sm text-muted mb-2">Her 2025 spring frost: April 18–30 · Fall frost: Oct 3–21</p>
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
