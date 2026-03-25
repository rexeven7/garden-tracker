import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO, isToday, isPast, isFuture, addDays, startOfMonth, endOfMonth, getDay, getDaysInMonth } from 'date-fns'

const TASK_ICONS = { water: '💧', fertilize: '🌿', thin: '✂️', prune: '🪴', treat: '🧪', harvest: '🧺', transplant: '🌱', other: '📋' }

const RECUR_OPTIONS = [
  { value: 'daily',    label: 'Daily',       days: 1  },
  { value: 'weekly',   label: 'Weekly',      days: 7  },
  { value: 'biweekly', label: 'Every 2 weeks', days: 14 },
  { value: 'monthly',  label: 'Monthly',     days: 30 },
  { value: 'custom',   label: 'Custom…',     days: null },
]

function getIntervalDays(recur_type, recur_interval_days) {
  const opt = RECUR_OPTIONS.find(o => o.value === recur_type)
  return opt?.days ?? (recur_interval_days || 7)
}

function CompletionLogFields({ taskType, form, setForm }) {
  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  if (taskType === 'water') return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label>Amount</label>
          <select value={form.log_amount} onChange={e => f('log_amount', e.target.value)}>
            <option value="">— Select —</option>
            <option>Light (surface only)</option>
            <option>Moderate</option>
            <option>Deep soak</option>
          </select>
        </div>
        <div className="form-group">
          <label>Method</label>
          <select value={form.log_method} onChange={e => f('log_method', e.target.value)}>
            <option value="">— Select —</option>
            <option>Hand watering</option>
            <option>Drip irrigation</option>
            <option>Soaker hose</option>
            <option>Rain</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Notes (optional)</label>
        <input placeholder="e.g. soil was very dry" value={form.completion_notes} onChange={e => f('completion_notes', e.target.value)} />
      </div>
    </>
  )

  if (taskType === 'fertilize') return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label>Fertilizer / product</label>
          <input placeholder="e.g. fish emulsion, 10-10-10" value={form.log_product} onChange={e => f('log_product', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Method</label>
          <select value={form.log_method} onChange={e => f('log_method', e.target.value)}>
            <option value="">— Select —</option>
            <option>Top-dress</option>
            <option>Liquid drench</option>
            <option>Foliar spray</option>
            <option>Side-dress</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Amount</label>
        <input placeholder="e.g. 1 tbsp per gallon, handful" value={form.log_amount} onChange={e => f('log_amount', e.target.value)} />
      </div>
    </>
  )

  if (taskType === 'treat') return (
    <>
      <div className="form-group">
        <label>Product used</label>
        <input placeholder="e.g. neem oil, insecticidal soap" value={form.log_product} onChange={e => f('log_product', e.target.value)} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Amount / concentration</label>
          <input placeholder="e.g. 2% dilution" value={form.log_amount} onChange={e => f('log_amount', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Method</label>
          <select value={form.log_method} onChange={e => f('log_method', e.target.value)}>
            <option value="">— Select —</option>
            <option>Foliar spray</option>
            <option>Soil drench</option>
            <option>Dusting</option>
            <option>Hand removal</option>
          </select>
        </div>
      </div>
    </>
  )

  if (taskType === 'prune' || taskType === 'thin') return (
    <>
      <div className="form-group">
        <label>Amount removed</label>
        <input placeholder="e.g. 3 stems, thinned to 6 inches" value={form.log_amount} onChange={e => f('log_amount', e.target.value)} />
      </div>
      <div className="form-group">
        <label>Notes (optional)</label>
        <input placeholder="e.g. removed diseased branches" value={form.completion_notes} onChange={e => f('completion_notes', e.target.value)} />
      </div>
    </>
  )

  // Default for harvest, transplant, other
  return (
    <div className="form-group">
      <label>Completion notes (optional)</label>
      <textarea rows={2} placeholder="Any observations, quantities, issues…" value={form.completion_notes} onChange={e => f('completion_notes', e.target.value)} />
    </div>
  )
}

export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([])
  const [plantings, setPlantings] = useState([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('list') // 'list' | 'calendar'
  const [filterType, setFilterType] = useState('all')
  const [showDone, setShowDone] = useState(false)

  // Completion log modal
  const [completingTask, setCompletingTask] = useState(null)
  const emptyLog = { log_method: '', log_amount: '', log_product: '', completion_notes: '' }
  const [logForm, setLogForm] = useState(emptyLog)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const emptyForm = { planting_id: '', title: '', task_type: 'water', due_date: '', notes: '', recurs: false, recur_type: 'weekly', recur_interval_days: '', recur_end_date: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [tRes, pRes] = await Promise.all([
      supabase.from('tasks').select('*, plantings(custom_name, plants(name, variety), beds(name))').eq('user_id', user.id).order('due_date', { nullsLast: true }),
      supabase.from('plantings').select('id, custom_name, plants(name, variety), beds(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setTasks(tRes.data || [])
    setPlantings(pRes.data || [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(task) {
    setEditing(task.id)
    setForm({
      planting_id: task.planting_id || '',
      title: task.title,
      task_type: task.task_type || 'other',
      due_date: task.due_date || '',
      notes: task.notes || '',
      recurs: !!task.recur_type,
      recur_type: task.recur_type || 'weekly',
      recur_interval_days: task.recur_interval_days || '',
      recur_end_date: task.recur_end_date || '',
    })
    setShowModal(true)
  }

  async function save() {
    const payload = {
      user_id: user.id,
      planting_id: form.planting_id || null,
      title: form.title,
      task_type: form.task_type,
      due_date: form.due_date || null,
      notes: form.notes || null,
      recur_type: form.recurs ? form.recur_type : null,
      recur_interval_days: (form.recurs && form.recur_type === 'custom') ? (parseInt(form.recur_interval_days) || null) : null,
      recur_end_date: form.recurs ? (form.recur_end_date || null) : null,
    }
    if (editing) {
      await supabase.from('tasks').update(payload).eq('id', editing)
    } else {
      await supabase.from('tasks').insert(payload)
    }
    setShowModal(false)
    setForm(emptyForm)
    load()
  }

  function startComplete(task) {
    if (task.completed_at) {
      // Uncomplete — no log needed
      toggleDone(task, {})
      return
    }
    setLogForm(emptyLog)
    setCompletingTask(task)
  }

  async function toggleDone(task, logData = {}) {
    const val = task.completed_at ? null : new Date().toISOString()
    await supabase.from('tasks').update({
      completed_at: val,
      ...(!task.completed_at ? logData : {}),
    }).eq('id', task.id)

    // Generate next occurrence when completing a recurring task
    if (!task.completed_at && task.recur_type && task.due_date) {
      const interval = getIntervalDays(task.recur_type, task.recur_interval_days)
      const nextDue = addDays(parseISO(task.due_date), interval)
      const withinEnd = !task.recur_end_date || nextDue <= parseISO(task.recur_end_date)
      if (withinEnd) {
        await supabase.from('tasks').insert({
          user_id: task.user_id,
          planting_id: task.planting_id,
          title: task.title,
          task_type: task.task_type,
          notes: task.notes,
          due_date: format(nextDue, 'yyyy-MM-dd'),
          recur_type: task.recur_type,
          recur_interval_days: task.recur_interval_days,
          recur_end_date: task.recur_end_date,
        })
      }
    }
    load()
  }

  async function submitLog() {
    const logData = {
      log_method:        logForm.log_method || null,
      log_amount:        logForm.log_amount || null,
      log_product:       logForm.log_product || null,
      completion_notes:  logForm.completion_notes || null,
    }
    await toggleDone(completingTask, logData)
    setCompletingTask(null)
  }

  async function deleteTask(id) {
    if (!window.confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(t => t.filter(x => x.id !== id))
  }

  function plantingName(p) {
    if (!p) return '—'
    const name = p.custom_name || p.plants?.name || '—'
    const bed = p.beds?.name
    return bed ? `${name} (${bed})` : name
  }

  function recurLabel(task) {
    if (!task.recur_type) return null
    const opt = RECUR_OPTIONS.find(o => o.value === task.recur_type)
    if (task.recur_type === 'custom' && task.recur_interval_days) return `🔁 every ${task.recur_interval_days}d`
    return `🔁 ${opt?.label?.toLowerCase() || task.recur_type}`
  }

  function dueClass(due, done) {
    if (done || !due) return ''
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

  const overdue  = filtered.filter(t => !t.completed_at && t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)))
  const today_   = filtered.filter(t => !t.completed_at && t.due_date && isToday(parseISO(t.due_date)))
  const upcoming = filtered.filter(t => !t.completed_at && (!t.due_date || isFuture(parseISO(t.due_date))))
  const done     = filtered.filter(t => t.completed_at)

  function TaskRow({ task }) {
    return (
      <div className={`task-item ${task.completed_at ? 'done' : ''}`}>
        <div className={`task-check ${task.completed_at ? 'checked' : ''}`} onClick={() => startComplete(task)}>
          {task.completed_at && <span style={{ color: 'white', fontSize: '11px' }}>✓</span>}
        </div>
        <div className="task-type-icon">{TASK_ICONS[task.task_type] || '📋'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="task-title" style={{ fontWeight: 500 }}>{task.title}</div>
          <div className="text-sm text-muted">
            {plantingName(task.plantings)}
            {recurLabel(task) && <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>{recurLabel(task)}</span>}
          </div>
          {task.notes && <div className="text-sm text-muted">{task.notes}</div>}
          {task.completed_at && (task.log_amount || task.log_method || task.log_product || task.completion_notes) && (
            <div className="task-log-summary">
              {task.log_amount && <span>📏 {task.log_amount}</span>}
              {task.log_method && <span>🔧 {task.log_method}</span>}
              {task.log_product && <span>🧴 {task.log_product}</span>}
              {task.completion_notes && <span>📝 {task.completion_notes}</span>}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          {task.due_date && (
            <div className={`text-sm ${dueClass(task.due_date, task.completed_at)}`}>
              {isToday(parseISO(task.due_date)) ? 'Today' : format(parseISO(task.due_date), 'MMM d')}
            </div>
          )}
          <div className="flex gap-1">
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(task)}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteTask(task.id)}>✕</button>
          </div>
        </div>
      </div>
    )
  }

  function TaskGroup({ title, items, accent }) {
    if (!items.length) return null
    return (
      <div className="mb-2">
        <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: accent || 'var(--muted)', marginBottom: '0.5rem' }}>
          {title} · {items.length}
        </div>
        {items.map(task => <TaskRow key={task.id} task={task} />)}
      </div>
    )
  }

  // ── Calendar View ──────────────────────────────────────────────
  function CalendarView() {
    const [viewDate, setViewDate] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState(null)

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = startOfMonth(viewDate)
    const daysInMonth = getDaysInMonth(viewDate)
    const startPad = getDay(firstDay) // 0 = Sunday

    const cells = []
    for (let i = 0; i < startPad; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    // Index tasks by day-of-month for this month
    const tasksByDay = {}
    tasks.forEach(t => {
      if (!t.due_date) return
      const d = parseISO(t.due_date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate()
        if (!tasksByDay[key]) tasksByDay[key] = []
        tasksByDay[key].push(t)
      }
    })

    const selectedTasks = selectedDay ? (tasksByDay[selectedDay] || []) : []

    function dotColor(task, day) {
      if (task.completed_at) return '#86efac'
      const d = new Date(year, month, day)
      if (isPast(d) && !isToday(d)) return 'var(--red)'
      return 'var(--leaf)'
    }

    return (
      <div>
        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setViewDate(new Date(year, month - 1)); setSelectedDay(null) }}>‹ Prev</button>
          <strong style={{ flex: 1, textAlign: 'center' }}>{format(firstDay, 'MMMM yyyy')}</strong>
          <button className="btn btn-ghost btn-sm" onClick={() => { setViewDate(new Date(year, month + 1)); setSelectedDay(null) }}>Next ›</button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600, padding: '2px 0' }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} />
            const dayTasks = tasksByDay[day] || []
            const isSelected = selectedDay === day
            const isCurrentDay = isToday(new Date(year, month, day))
            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                style={{
                  minHeight: '56px', padding: '4px 6px', borderRadius: '6px', cursor: 'pointer',
                  background: isSelected ? '#ecfdf5' : 'white',
                  border: isCurrentDay ? '2px solid var(--leaf)' : '1px solid var(--border)',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: isCurrentDay ? 700 : 400, color: isCurrentDay ? 'var(--leaf)' : 'inherit' }}>{day}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: '3px' }}>
                  {dayTasks.slice(0, 5).map(t => (
                    <div key={t.id} style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotColor(t, day), flexShrink: 0 }} title={t.title} />
                  ))}
                  {dayTasks.length > 5 && <span style={{ fontSize: '0.6rem', color: 'var(--muted)', lineHeight: '7px' }}>+{dayTasks.length - 5}</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected day task list */}
        {selectedDay && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>
              {format(new Date(year, month, selectedDay), 'EEEE, MMMM d')}
              <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                {selectedTasks.length === 0 ? 'No tasks' : `${selectedTasks.length} task${selectedTasks.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            {selectedTasks.length === 0
              ? <p className="text-sm text-muted">Nothing scheduled for this day.</p>
              : selectedTasks.map(task => <TaskRow key={task.id} task={task} />)
            }
          </div>
        )}
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
        <button className="btn btn-primary" onClick={openNew}>+ Add Task</button>
      </div>

      {/* Controls */}
      <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        {/* View toggle */}
        <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setView('list')}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', background: view === 'list' ? 'var(--leaf)' : 'white', color: view === 'list' ? 'white' : 'inherit', border: 'none', cursor: 'pointer' }}
          >☰ List</button>
          <button
            onClick={() => setView('calendar')}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', background: view === 'calendar' ? 'var(--leaf)' : 'white', color: view === 'calendar' ? 'white' : 'inherit', border: 'none', cursor: 'pointer' }}
          >📅 Calendar</button>
        </div>

        {view === 'list' && (
          <>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 'auto' }}>
              <option value="all">All types</option>
              {Object.keys(TASK_ICONS).map(t => <option key={t} value={t}>{TASK_ICONS[t]} {t}</option>)}
            </select>
            <label className="flex-center gap-1 text-sm" style={{ cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={showDone} onChange={e => setShowDone(e.target.checked)} />
              Show completed
            </label>
          </>
        )}
      </div>

      {/* Views */}
      {view === 'calendar' ? (
        <div className="card"><CalendarView /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No tasks</h3>
          <p>{tasks.length === 0 ? 'Add tasks to stay on top of your garden.' : 'No tasks matching current filter.'}</p>
          <button className="btn btn-primary mt-2" onClick={openNew}>Add Task</button>
        </div>
      ) : (
        <>
          <TaskGroup title="Overdue"   items={overdue}   accent="var(--red)" />
          <TaskGroup title="Today"     items={today_}    accent="var(--amber)" />
          <TaskGroup title="Upcoming"  items={upcoming}  accent="var(--leaf)" />
          {showDone && <TaskGroup title="Completed" items={done} />}
        </>
      )}

      {/* Add / Edit modal */}
      {/* Completion log modal */}
      {completingTask && (
        <div className="modal-backdrop" onClick={() => setCompletingTask(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Log completion</h2>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.1rem' }}>{completingTask.title}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setCompletingTask(null)}>✕</button>
            </div>

            <CompletionLogFields
              taskType={completingTask.task_type}
              form={logForm}
              setForm={setLogForm}
            />

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { toggleDone(completingTask, {}); setCompletingTask(null) }}>Skip log</button>
              <button className="btn btn-primary" onClick={submitLog}>Mark complete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Task' : 'Add Task'}</h2>
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

            {/* Recurrence */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <label className="flex-center gap-1 text-sm" style={{ cursor: 'pointer', marginBottom: '0.75rem' }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={form.recurs} onChange={e => setForm({ ...form, recurs: e.target.checked })} />
                <strong>Repeating task</strong>
              </label>

              {form.recurs && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Repeat frequency</label>
                      <select value={form.recur_type} onChange={e => setForm({ ...form, recur_type: e.target.value })}>
                        {RECUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    {form.recur_type === 'custom' && (
                      <div className="form-group">
                        <label>Every X days</label>
                        <input type="number" min="1" value={form.recur_interval_days} onChange={e => setForm({ ...form, recur_interval_days: e.target.value })} placeholder="e.g. 3" />
                      </div>
                    )}
                    <div className="form-group">
                      <label>Stop repeating after</label>
                      <input type="date" value={form.recur_end_date} onChange={e => setForm({ ...form, recur_end_date: e.target.value })} />
                    </div>
                  </div>
                  <p className="text-sm text-muted" style={{ marginTop: '-0.5rem' }}>
                    When you check this task off, the next occurrence is automatically created.
                  </p>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editing ? 'Save Changes' : 'Add Task'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
