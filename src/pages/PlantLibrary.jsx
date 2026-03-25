import { useState, useEffect } from 'react'
import { supabase, SEED_PLANTS } from '../lib/supabase'

const CATEGORIES = ['vegetable', 'herb', 'flower', 'fruit']

export default function PlantLibrary({ user }) {
  const [plants, setPlants] = useState([])
  const [families, setFamilies] = useState([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [filterFamily, setFilterFamily] = useState('all')

  const emptyForm = {
    name: '', variety: '', family_id: '', category: 'vegetable',
    sow_indoors_timing: '', direct_sow_timing: '', days_to_harvest: '',
    in_ground_start: '', in_ground_end: '', seed_quantity: '', notes: '', info: ''
  }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [pRes, fRes] = await Promise.all([
      supabase.from('plants').select('*, plant_families(name, color)').eq('user_id', user.id).order('name'),
      supabase.from('plant_families').select('*').order('name'),
    ])
    setPlants(pRes.data || [])
    setFamilies(fRes.data || [])
    setLoading(false)
  }

  async function seedLibrary() {
    if (!window.confirm(`This will add ${SEED_PLANTS.length} plants from your spreadsheet to your library. Continue?`)) return
    setSeeding(true)
    const familyMap = {}
    families.forEach(f => { familyMap[f.name] = f.id })

    const rows = SEED_PLANTS.map(p => ({
      user_id: user.id,
      name: p.name,
      variety: p.variety || null,
      family_id: familyMap[p.family] || null,
      category: p.category,
      sow_indoors_timing: p.sow_indoors_timing || null,
      direct_sow_timing: p.direct_sow_timing || null,
      days_to_harvest: p.days_to_harvest || null,
      in_ground_start: p.in_ground_start || null,
      in_ground_end: p.in_ground_end || null,
      seed_quantity: p.seed_quantity || null,
      notes: p.notes || null,
    }))

    await supabase.from('plants').insert(rows)
    setSeeding(false)
    loadAll()
  }

  function openNew() { setEditing(null); setForm(emptyForm); setShowModal(true) }
  function openEdit(p) {
    setEditing(p.id)
    setForm({
      name: p.name, variety: p.variety || '', family_id: p.family_id || '',
      category: p.category || 'vegetable',
      sow_indoors_timing: p.sow_indoors_timing || '', direct_sow_timing: p.direct_sow_timing || '',
      days_to_harvest: p.days_to_harvest || '', in_ground_start: p.in_ground_start || '',
      in_ground_end: p.in_ground_end || '', seed_quantity: p.seed_quantity || '',
      notes: p.notes || '', info: p.info || ''
    })
    setShowModal(true)
  }

  async function save() {
    const payload = { ...form, user_id: user.id, family_id: form.family_id || null }
    if (editing) await supabase.from('plants').update(payload).eq('id', editing)
    else await supabase.from('plants').insert(payload)
    setShowModal(false)
    loadAll()
  }

  async function deletePlant(id) {
    if (!window.confirm('Delete this plant from library?')) return
    await supabase.from('plants').delete().eq('id', id)
    loadAll()
  }

  const filtered = plants.filter(p => {
    const q = search.toLowerCase()
    if (q && !p.name.toLowerCase().includes(q) && !(p.variety || '').toLowerCase().includes(q)) return false
    if (filterFamily !== 'all' && p.family_id !== filterFamily) return false
    return true
  })

  if (loading) return <div className="empty-state"><p>Loading library…</p></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Plant Library</h1>
          <p className="text-muted">Your reference catalog — timing, varieties, notes</p>
        </div>
        <div className="flex gap-1">
          {plants.length === 0 && (
            <button className="btn btn-secondary" onClick={seedLibrary} disabled={seeding}>
              {seeding ? 'Importing…' : '📥 Import from Spreadsheet'}
            </button>
          )}
          <button className="btn btn-primary" onClick={openNew}>+ Add Plant</button>
        </div>
      </div>

      <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap' }}>
        <input
          style={{ flex: '1 1 200px', width: 'auto' }}
          placeholder="Search by name or variety…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={filterFamily} onChange={e => setFilterFamily(e.target.value)} style={{ width: 'auto', flex: '0 0 auto' }}>
          <option value="all">All families</option>
          {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>{plants.length === 0 ? 'Library is empty' : 'No matches'}</h3>
          <p>{plants.length === 0 ? 'Import your spreadsheet data or add plants manually.' : 'Try a different search.'}</p>
          {plants.length === 0 && (
            <button className="btn btn-primary mt-2" onClick={seedLibrary} disabled={seeding}>
              {seeding ? 'Importing…' : '📥 Import from Spreadsheet'}
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plant</th>
                  <th>Family</th>
                  <th>Category</th>
                  <th>Start Indoors</th>
                  <th>Direct Sow</th>
                  <th>Days to Harvest</th>
                  <th>Seed Qty</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      {p.variety && <div className="text-sm text-muted">{p.variety}</div>}
                    </td>
                    <td>
                      {p.plant_families ? (
                        <span className="family-chip" style={{ background: p.plant_families.color }}>
                          {p.plant_families.name.split(' (')[0]}
                        </span>
                      ) : '—'}
                    </td>
                    <td><span className="pill">{p.category}</span></td>
                    <td className="text-sm">{p.sow_indoors_timing || '—'}</td>
                    <td className="text-sm">{p.direct_sow_timing || '—'}</td>
                    <td className="text-sm">{p.days_to_harvest || '—'}</td>
                    <td className="text-sm">{p.seed_quantity || '—'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deletePlant(p.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Plant' : 'Add Plant'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Plant Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tomato" />
              </div>
              <div className="form-group">
                <label>Variety</label>
                <input value={form.variety} onChange={e => setForm({ ...form, variety: e.target.value })} placeholder="e.g. Beefsteak" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Plant Family</label>
                <select value={form.family_id} onChange={e => setForm({ ...form, family_id: e.target.value })}>
                  <option value="">— Select family —</option>
                  {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Indoors Timing</label>
                <input value={form.sow_indoors_timing} onChange={e => setForm({ ...form, sow_indoors_timing: e.target.value })} placeholder="e.g. 6-8 weeks before frost" />
              </div>
              <div className="form-group">
                <label>Direct Sow / Transplant</label>
                <input value={form.direct_sow_timing} onChange={e => setForm({ ...form, direct_sow_timing: e.target.value })} placeholder="e.g. After last frost" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>In-Ground Start</label>
                <input value={form.in_ground_start} onChange={e => setForm({ ...form, in_ground_start: e.target.value })} placeholder="e.g. May 1st" />
              </div>
              <div className="form-group">
                <label>In-Ground End</label>
                <input value={form.in_ground_end} onChange={e => setForm({ ...form, in_ground_end: e.target.value })} placeholder="e.g. Late summer" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Days to Harvest</label>
                <input value={form.days_to_harvest} onChange={e => setForm({ ...form, days_to_harvest: e.target.value })} placeholder="e.g. 65" />
              </div>
              <div className="form-group">
                <label>Seed Quantity</label>
                <input value={form.seed_quantity} onChange={e => setForm({ ...form, seed_quantity: e.target.value })} placeholder="e.g. 25 seeds" />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save Plant</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
