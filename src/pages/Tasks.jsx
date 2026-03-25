import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns'

const TASK_ICONS = { water: '💧', fertilize: '🌿', thin: '✂️', prune: '🪴', treat: '🧪', harvest: '🧺', transplant: '🌱', other: '📋' }

export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([])
  const [plantings, setPlantings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [showDone, setShowDone] = useState(false)

  const emptyForm = { planting_id: '', title: '', task_type: 'water', due_date: '', notes: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { load() }, [])

  async function load() {
    const [tRes, pRes] = await Promise.all([
      supabase.from('tasks').select('*, plantings(custom_name, plants(name, variety), beds(name))').eq('user_id', user.id).order('due_date', { nullsLast: true }),
      supabase.from('plantings').select('id, custom_name, plants(name, variety), beds(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setTasks(tRes.data || [])
    setPlantings(pRes.data || [])
    setLoading(false)
  }

  async function save() {
    await supabase.from('tasks').insert({ ...form, user_id: user.id, planting_id: form.planting_id || null, due_date: form.due_date || null })
    setShowModal(false)
    setForm(emptyForm)
    load()
  }

  async function toggleDone(task) {
    const val = task.completed_at ? null : new Date().toISOString()
    await supabase.from('tasks').update({ completed_at: val }).eq('id', task.id)
    setTasks(t => t.map(x => x.id === task.id ? { ...x, completed_at: val } : x))
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(t => t.filter(x => x.id !== id))
  }

  function plantingName(p) {
    if (!p) return '—'
    const name = p.custom_name || p.plants?.name || '—'
    const bed = p.beds?.name
    return bed ? `${name} (${bed})` : name
  }

  function dueClass(due, done) {
    if (done) return ''
    if (!due) return ''
    const d = parseISO(due)
    if (isToday(d)) return 'today'
    if (isPast(d)) return 'overdue'
    return ''
  }

  const filtered = tasks.filter(t => {
    if (!showDone && t.completed_at) return false
    if (filterType !== 'all' && t.task_type !== filterType) return false
    return true
  })

  const overdue = filtered.filter(t => !t.completed_at && t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)))
  const today_ = filtered.filter(t => !t.completed_at && t.due_date && isToday(parseISO(t.due_date)))
  const upcoming = filtered.filter(t => !t.completed_at && (!t.due_date || isFuture(parseISO(t.due_date))))
  const done = filtered.filter(t => t.completed_at)

  function TaskGroup({ title, items, accent }) {
    if (!items.length) return null
    return (
      <div className="mb-2">
        <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: accent || 'var(--muted)', marginBottom: '0.5rem' }}>
          {title} · {items.length}
        </div>
        {items.map(task => (
          <div key={task.id} className={`task-item ${task.completed_at ? 'done' : ''}`}>
            <div className={`task-check ${task.completed_at ? 'checked' : ''}`} onClick={() => toggleDone(task)}>
              {task.completed_at && <span style={{ color: 'white', fontSize: '11px' }}>✓</span>}
            </div>
            <div className="task-type-icon">{TASK_ICONS[task.task_type] || '📋'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="task-title" style={{ fontWeight: 500 }}>{task.title}</div>
              <div className="text-sm text-muted">{plantingName(task.plantings)}</div>
              {task.notes && <div className="text-sm text-muted">{task.notes}</div>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {task.due_date && (
                <div className={`text-sm ${dueClass(task.due_date, task.completed_at)}`}>
                  {isToday(parseISO(task.due_date)) ? 'Today' : format(parseISO(task.due_date), 'MMM d')}
                </div>
              )}
              <button className="btn btn-danger btn-sm" onClick={() => deleteTask(task.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) return <div className="empty-state"><p>Loading tasks…</p></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="text-muted">Water, fertilize, thin, harvest — all in one place</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Task</button>
      </div>

      <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All types</option>
          {Object.keys(TASK_ICONS).map(t => <option key={t} value={t}>{TASK_ICONS[t]} {t}</option>)}
        </select>
        <label className="flex-center gap-1 text-sm" style={{ cursor: 'pointer' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={showDone} onChange={e => setShowDone(e.target.checked)} />
          Show completed
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No tasks</h3>
          <p>{tasks.length === 0 ? 'Add tasks to stay on top of your garden.' : 'No tasks matching current filter.'}</p>
          <button className="btn btn-primary mt-2" onClick={() => setShowModal(true)}>Add Task</button>
        </div>
      ) : (
        <>
          <TaskGroup title="Overdue" items={overdue} accent="var(--red)" />
          <TaskGroup title="Today" items={today_} accent="var(--amber)" />
          <TaskGroup title="Upcoming" items={upcoming} accent="var(--leaf)" />
          {showDone && <TaskGroup title="Completed" items={done} />}
        </>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Task</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Water tomatoes deeply" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={form.task_type} onChange={e => setForm({ ...form, task_type: e.target.value })}>
                  {Object.keys(TASK_ICONS).map(t => <option key={t} value={t}>{TASK_ICONS[t]} {t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Linked Planting (optional)</label>
              <select value={form.planting_id} onChange={e => setForm({ ...form, planting_id: e.target.value })}>
                <option value="">— Not linked —</option>
                {plantings.map(p => <option key={p.id} value={p.id}>{plantingName(p)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Add Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
