import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'

const STATUSES = ['planned', 'seeded', 'transplanted', 'growing', 'harvested', 'failed']
const STATUS_EMOJI = { planned: '📋', seeded: '🫘', transplanted: '🌱', growing: '🌿', harvested: '🧺', failed: '🥀' }

export default function Plantings({ user }) {
  const [plantings, setPlantings] = useState([])
  const [beds, setBeds] = useState([])
  const [plants, setPlants] = useState([])
  const [seasons, setSeasons] = useState([])
  const [families, setFamilies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(null) // planting id
  const [editing, setEditing] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterBed, setFilterBed] = useState('all')

  const emptyForm = {
    plant_id: '', custom_name: '', custom_family_id: '',
    bed_id: '', season_id: '',
    date_seeded: '', date_transplanted: '', date_first_harvest: '', date_last_harvest: '',
    status: 'planned', notes: '', harvest_quantity: '', harvest_notes: ''
  }
  const [form, setForm] = useState(emptyForm)

  const emptyTask = { title: '', task_type: 'water', due_date: '', notes: '' }
  const [taskForm, setTaskForm] = useState(emptyTask)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [pRes, bRes, plRes, sRes, fRes] = await Promise.all([
      supabase.from('plantings').select('*, beds(name), seasons(year), plants(name, variety, family_id), plant_families!custom_family_id(name, color)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('beds').select('*').eq('user_id', user.id).order('name'),
      supabase.from('plants').select('id, name, variety, family_id, plant_families(name, color)').eq('user_id', user.id).order('name'),
      supabase.from('seasons').select('*').eq('user_id', user.id).order('year', { ascending: false }),
      supabase.from('plant_families').select('*').order('name'),
    ])
    setPlantings(pRes.data || [])
    setBeds(bRes.data || [])
    setPlants(plRes.data || [])
    setSeasons(sRes.data || [])
    setFamilies(fRes.data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(emptyForm); setShowModal(true) }
  function openEdit(p) {
    setEditing(p.id)
    setForm({
      plant_id: p.plant_id || '',
      custom_name: p.custom_name || '',
      custom_family_id: p.custom_family_id || '',
      bed_id: p.bed_id || '',
      season_id: p.season_id || '',
      date_seeded: p.date_seeded || '',
      date_transplanted: p.date_transplanted || '',
      date_first_harvest: p.date_first_harvest || '',
      date_last_harvest: p.date_last_harvest || '',
      status: p.status,
      notes: p.notes || '',
      harvest_quantity: p.harvest_quantity || '',
      harvest_notes: p.harvest_notes || '',
    })
    setShowModal(true)
  }

  async function save() {
    const payload = {
      ...form,
      user_id: user.id,
      plant_id: form.plant_id || null,
      custom_family_id: form.custom_family_id || null,
      bed_id: form.bed_id || null,
      season_id: form.season_id || null,
      date_seeded: form.date_seeded || null,
      date_transplanted: form.date_transplanted || null,
      date_first_harvest: form.date_first_harvest || null,
      date_last_harvest: form.date_last_harvest || null,
    }
    if (editing) {
      await supabase.from('plantings').update(payload).eq('id', editing)
    } else {
      await supabase.from('plantings').insert(payload)
    }
    setShowModal(false)
    loadAll()
  }

  async function deletePlanting(id) {
    if (!window.confirm('Delete this planting?')) return
    await supabase.from('tasks').delete().eq('planting_id', id)
    await supabase.from('plantings').delete().eq('id', id)
    loadAll()
  }

  async function saveTask() {
    await supabase.from('tasks').insert({
      ...taskForm,
      user_id: user.id,
      planting_id: showTaskModal,
      due_date: taskForm.due_date || null,
    })
    setShowTaskModal(null)
    setTaskForm(emptyTask)
  }

  async function quickStatus(id, status) {
    await supabase.from('plantings').update({ status }).eq('id', id)
    setPlantings(p => p.map(x => x.id === id ? { ...x, status } : x))
  }

  const filtered = plantings.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterBed !== 'all' && p.bed_id !== filterBed) return false
    return true
  })

  function displayName(p) {
    return p.custom_name || p.plants?.name || '—'
  }
  function displayVariety(p) {
    return p.plants?.variety || ''
  }
  function familyColor(p) {
    return p.plant_families?.color || p.plants?.plant_families?.color || '#9CA3AF'
  }
  function familyName(p) {
    return p.plant_families?.name || p.plants?.plant_families?.name || ''
  }

  if (loading) return <div className="empty-state"><p>Loading plantings…</p></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Plantings</h1>
          <p className="text-muted">Track everything in the ground this season</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add Planting</button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', flex: '0 0 auto' }}>
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterBed} onChange={e => setFilterBed(e.target.value)} style={{ width: 'auto', flex: '0 0 auto' }}>
          <option value="all">All beds</option>
          {beds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <span className="text-sm text-muted flex-center">{filtered.length} planting{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌱</div>
          <h3>No plantings yet</h3>
          <p>Add your first planting to start tracking your garden.</p>
          <button className="btn btn-primary mt-2" onClick={openNew}>Add Planting</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plant</th>
                  <th>Bed</th>
                  <th>Family</th>
                  <th>Seeded</th>
                  <th>Transplanted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{displayName(p)}</div>
                      {displayVariety(p) && <div className="text-sm text-muted">{displayVariety(p)}</div>}
                    </td>
                    <td>{p.beds?.name || <span className="text-muted">—</span>}</td>
                    <td>
                      {familyName(p) ? (
                        <span className="family-chip" style={{ background: familyColor(p) }}>
                          {familyName(p).split(' (')[0]}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="text-sm">{p.date_seeded ? format(parseISO(p.date_seeded), 'MMM d') : '—'}</td>
                    <td className="text-sm">{p.date_transplanted ? format(parseISO(p.date_transplanted), 'MMM d') : '—'}</td>
                    <td>
                      <select
                        value={p.status}
                        onChange={e => quickStatus(p.id, e.target.value)}
                        style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_EMOJI[s]} {s}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowTaskModal(p.id)} title="Add task">📋</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deletePlanting(p.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit planting modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Planting' : 'Add Planting'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Plant from Library</label>
                <select value={form.plant_id} onChange={e => setForm({ ...form, plant_id: e.target.value, custom_name: '', custom_family_id: '' })}>
                  <option value="">— Choose or type custom —</option>
                  {plants.map(p => (
                    <option key={p.id} value={p.id}>{p.name}{p.variety ? ` (${p.variety})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Custom Name (if not in library)</label>
                <input value={form.custom_name} onChange={e => setForm({ ...form, custom_name: e.target.value, plant_id: '' })} placeholder="e.g. Mystery squash" />
              </div>
            </div>

            {!form.plant_id && (
              <div className="form-group">
                <label>Plant Family (for rotation)</label>
                <select value={form.custom_family_id} onChange={e => setForm({ ...form, custom_family_id: e.target.value })}>
                  <option value="">— Select family —</option>
                  {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Bed / Area</label>
                <select value={form.bed_id} onChange={e => setForm({ ...form, bed_id: e.target.value })}>
                  <option value="">— Select bed —</option>
                  {beds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Season</label>
                <select value={form.season_id} onChange={e => setForm({ ...form, season_id: e.target.value })}>
                  <option value="">— Select season —</option>
                  {seasons.map(s => <option key={s.id} value={s.id}>{s.year}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date Seeded</label>
                <input type="date" value={form.date_seeded} onChange={e => setForm({ ...form, date_seeded: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Date Transplanted</label>
                <input type="date" value={form.date_transplanted} onChange={e => setForm({ ...form, date_transplanted: e.target.value })} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>First Harvest</label>
                <input type="date" value={form.date_first_harvest} onChange={e => setForm({ ...form, date_first_harvest: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Last Harvest</label>
                <input type="date" value={form.date_last_harvest} onChange={e => setForm({ ...form, date_last_harvest: e.target.value })} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_EMOJI[s]} {s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Harvest Quantity</label>
                <input value={form.harvest_quantity} onChange={e => setForm({ ...form, harvest_quantity: e.target.value })} placeholder="e.g. 4 lbs, 12 tomatoes" />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observations, issues, successes…" />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save Planting</button>
            </div>
          </div>
        </div>
      )}

      {/* Add task modal */}
      {showTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowTaskModal(null)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Task</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTaskModal(null)}>✕</button>
            </div>

            <div className="form-group">
              <label>Task Title</label>
              <input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="e.g. Water deeply" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={taskForm.task_type} onChange={e => setTaskForm({ ...taskForm, task_type: e.target.value })}>
                  {['water','fertilize','thin','prune','treat','harvest','transplant','other'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea value={taskForm.notes} onChange={e => setTaskForm({ ...taskForm, notes: e.target.value })} rows={2} />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowTaskModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveTask}>Add Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
