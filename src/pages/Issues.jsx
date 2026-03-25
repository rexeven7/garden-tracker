import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'

const TYPE_ICONS  = { pest: '🐛', disease: '🍂', other: '⚠️' }
const SEV_COLORS  = { low: 'var(--leaf)', medium: 'var(--amber)', high: 'var(--red)' }
const SEV_LABELS  = { low: 'Low', medium: 'Medium', high: 'High' }

export default function Issues({ user }) {
  const [issues, setIssues]       = useState([])
  const [plantings, setPlantings] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showResolved, setShowResolved] = useState(false)
  const [filterType, setFilterType] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const emptyForm = { planting_id: '', issue_type: 'pest', title: '', severity: 'medium', description: '', treatment: '' }
  const [form, setForm]           = useState(emptyForm)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [iRes, pRes] = await Promise.all([
      supabase.from('issues')
        .select('*, plantings(custom_name, plants(name), beds(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('plantings')
        .select('id, custom_name, plants(name, variety), beds(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])
    setIssues(iRes.data || [])
    setPlantings(pRes.data || [])
    setLoading(false)
  }

  function openNew(prefillPlantingId = '') {
    setEditing(null)
    setForm({ ...emptyForm, planting_id: prefillPlantingId })
    setShowModal(true)
  }

  function openEdit(issue) {
    setEditing(issue.id)
    setForm({
      planting_id: issue.planting_id || '',
      issue_type:  issue.issue_type,
      title:       issue.title,
      severity:    issue.severity,
      description: issue.description || '',
      treatment:   issue.treatment || '',
    })
    setShowModal(true)
  }

  async function save() {
    if (!form.title.trim()) return
    const payload = {
      user_id:     user.id,
      planting_id: form.planting_id || null,
      issue_type:  form.issue_type,
      title:       form.title,
      severity:    form.severity,
      description: form.description || null,
      treatment:   form.treatment || null,
    }
    if (editing) {
      await supabase.from('issues').update(payload).eq('id', editing)
    } else {
      await supabase.from('issues').insert(payload)
    }
    setShowModal(false)
    load()
  }

  async function toggleResolved(issue) {
    const val = issue.resolved_at ? null : new Date().toISOString()
    await supabase.from('issues').update({ resolved_at: val }).eq('id', issue.id)
    load()
  }

  async function deleteIssue(id) {
    if (!window.confirm('Delete this issue?')) return
    await supabase.from('issues').delete().eq('id', id)
    setIssues(i => i.filter(x => x.id !== id))
  }

  function plantingLabel(p) {
    if (!p) return null
    const name = p.custom_name || p.plants?.name || '—'
    const bed  = p.beds?.name
    return bed ? `${name} · ${bed}` : name
  }

  const filtered = issues.filter(i => {
    if (!showResolved && i.resolved_at) return false
    if (filterType !== 'all' && i.issue_type !== filterType) return false
    return true
  })

  const open_issues   = filtered.filter(i => !i.resolved_at)
  const resolved_list = filtered.filter(i => i.resolved_at)

  if (loading) return <div className="empty-state"><p>Loading issues…</p></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pest & Issue Log</h1>
          <p className="text-muted">Track pests, diseases, and other problems in your garden</p>
        </div>
        <button className="btn btn-primary" onClick={() => openNew()}>+ Report Issue</button>
      </div>

      {/* Controls */}
      <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All types</option>
          <option value="pest">🐛 Pest</option>
          <option value="disease">🍂 Disease</option>
          <option value="other">⚠️ Other</option>
        </select>
        <label className="flex-center gap-1 text-sm" style={{ cursor: 'pointer' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={showResolved} onChange={e => setShowResolved(e.target.checked)} />
          Show resolved
        </label>
        {issues.filter(i => !i.resolved_at).length > 0 && (
          <span className="pill" style={{ background: '#fee2e2', color: 'var(--red)' }}>
            {issues.filter(i => !i.resolved_at).length} open
          </span>
        )}
      </div>

      {/* Open issues */}
      {open_issues.length === 0 && !showResolved ? (
        <div className="empty-state">
          <div className="empty-icon">🌿</div>
          <h3>No open issues</h3>
          <p>Your garden looks healthy! Report a problem if you spot one.</p>
          <button className="btn btn-primary mt-2" onClick={() => openNew()}>Report Issue</button>
        </div>
      ) : (
        <>
          {open_issues.length > 0 && (
            <div className="mb-2">
              <div className="issue-section-label">Open · {open_issues.length}</div>
              {open_issues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
            </div>
          )}
          {showResolved && resolved_list.length > 0 && (
            <div>
              <div className="issue-section-label" style={{ color: 'var(--muted)' }}>Resolved · {resolved_list.length}</div>
              {resolved_list.map(issue => <IssueCard key={issue.id} issue={issue} />)}
            </div>
          )}
        </>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Issue' : 'Report Issue'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={form.issue_type} onChange={e => setForm({ ...form, issue_type: e.target.value })}>
                  <option value="pest">🐛 Pest</option>
                  <option value="disease">🍂 Disease</option>
                  <option value="other">⚠️ Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Severity</label>
                <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Aphids on tomatoes, Powdery mildew on squash" autoFocus />
            </div>

            <div className="form-group">
              <label>Linked Planting (optional)</label>
              <select value={form.planting_id} onChange={e => setForm({ ...form, planting_id: e.target.value })}>
                <option value="">— Not linked to a specific plant —</option>
                {plantings.map(p => (
                  <option key={p.id} value={p.id}>{plantingLabel(p)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="What did you observe? Location on plant, severity, spread…"
              />
            </div>

            <div className="form-group">
              <label>Treatment applied (optional)</label>
              <textarea
                rows={2}
                value={form.treatment}
                onChange={e => setForm({ ...form, treatment: e.target.value })}
                placeholder="e.g. Sprayed with neem oil 2% solution, hand-removed caterpillars…"
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editing ? 'Save Changes' : 'Report Issue'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  function IssueCard({ issue }) {
    const plLabel = plantingLabel(issue.plantings)
    return (
      <div className={`issue-card ${issue.resolved_at ? 'resolved' : ''}`}>
        <div className="issue-card-left">
          <div className="issue-type-icon">{TYPE_ICONS[issue.issue_type]}</div>
          <div
            className="issue-severity-dot"
            style={{ background: SEV_COLORS[issue.severity] }}
            title={`${SEV_LABELS[issue.severity]} severity`}
          />
        </div>
        <div className="issue-card-body">
          <div className="issue-title">{issue.title}</div>
          {plLabel && <div className="text-sm text-muted">{plLabel}</div>}
          {issue.description && <div className="issue-description">{issue.description}</div>}
          {issue.treatment && (
            <div className="issue-treatment">
              <span style={{ fontWeight: 600 }}>Treatment:</span> {issue.treatment}
            </div>
          )}
          <div className="issue-meta">
            <span>{format(parseISO(issue.created_at), 'MMM d, yyyy')}</span>
            {issue.resolved_at && (
              <span style={{ color: 'var(--leaf)' }}>✓ Resolved {format(parseISO(issue.resolved_at), 'MMM d')}</span>
            )}
          </div>
        </div>
        <div className="issue-card-actions">
          <button
            className={`btn btn-sm ${issue.resolved_at ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => toggleResolved(issue)}
            title={issue.resolved_at ? 'Mark as open' : 'Mark as resolved'}
          >
            {issue.resolved_at ? 'Reopen' : '✓ Resolve'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(issue)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={() => deleteIssue(issue.id)}>✕</button>
        </div>
      </div>
    )
  }
}
