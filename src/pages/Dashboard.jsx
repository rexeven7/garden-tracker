import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, isToday, isPast, parseISO, addDays } from 'date-fns'
import WeatherWidget from '../components/WeatherWidget'
import DashboardMapView from '../components/DashboardMapView'

function StarRating({ value }) {
  const n = parseInt(value) || 0
  return (
    <span className="star-rating-sm">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= n ? '#D4A853' : '#E8DDD0', fontSize: '0.8rem' }}>★</span>
      ))}
    </span>
  )
}

const TASK_ICONS = { water: '💧', fertilize: '🌿', thin: '✂️', prune: '🪴', treat: '🧪', harvest: '🧺', transplant: '🌱', other: '📋' }
const STATUS_ORDER = ['seeded', 'transplanted', 'growing', 'planned']

export default function Dashboard({ user, navigate }) {
  const [stats, setStats] = useState({ beds: 0, plantings: 0, tasks_due: 0, harvests: 0 })
  const [tasks, setTasks] = useState([])
  const [recent, setRecent] = useState([])
  const [harvested, setHarvested] = useState([])
  const [loading, setLoading] = useState(true)
  const [dashView, setDashView] = useState('list') // 'list' | 'map'

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    const today = format(new Date(), 'yyyy-MM-dd')
    const weekOut = format(addDays(new Date(), 7), 'yyyy-MM-dd')

    const [bedsRes, plantingsRes, tasksRes, harvestedRes] = await Promise.all([
      supabase.from('beds').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('plantings').select('id, status, custom_name, date_seeded, date_transplanted, plants(name, variety), beds(name)', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('tasks').select('*, plantings(custom_name, plants(name))').eq('user_id', user.id).is('completed_at', null).lte('due_date', weekOut).order('due_date'),
      supabase.from('plantings').select('id, custom_name, harvest_quantity, taste_rating, plants(name, variety)').eq('user_id', user.id).eq('status', 'harvested').order('date_last_harvest', { ascending: false }),
    ])

    setStats({
      beds: bedsRes.count || 0,
      plantings: plantingsRes.count || 0,
      tasks_due: tasksRes.data?.length || 0,
      harvests: harvestedRes.data?.length || 0,
    })
    setTasks(tasksRes.data || [])
    setRecent(plantingsRes.data || [])
    setHarvested(harvestedRes.data || [])
    setLoading(false)
  }

  async function completeTask(id) {
    await supabase.from('tasks').update({ completed_at: new Date().toISOString() }).eq('id', id)
    setTasks(t => t.filter(x => x.id !== id))
    setStats(s => ({ ...s, tasks_due: s.tasks_due - 1 }))
  }

  function taskDueClass(due) {
    if (!due) return ''
    const d = parseISO(due)
    if (isToday(d)) return 'today'
    if (isPast(d)) return 'overdue'
    return ''
  }

  if (loading) return <div className="empty-state"><p>Loading your garden…</p></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Good morning 🌤</h1>
          <p className="text-muted">Here's what's happening in your garden today</p>
        </div>
        <div className="dashboard-view-toggle">
          <button
            className={`toggle-btn ${dashView === 'list' ? 'active' : ''}`}
            onClick={() => setDashView('list')}
          >
            ☰ List
          </button>
          <button
            className={`toggle-btn ${dashView === 'map' ? 'active' : ''}`}
            onClick={() => setDashView('map')}
          >
            🗺️ Map
          </button>
        </div>
      </div>

      {dashView === 'map' && <DashboardMapView user={user} navigate={navigate} />}

      <WeatherWidget user={user} />

      {/* Stats */}
      <div className="grid-4 mb-2">
        <div className="stat-card">
          <div className="stat-value">{stats.beds}</div>
          <div className="stat-label">Beds & Areas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.plantings}</div>
          <div className="stat-label">Active Plantings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: tasks.length ? 'var(--amber)' : 'var(--leaf)' }}>{stats.tasks_due}</div>
          <div className="stat-label">Tasks This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.harvests}</div>
          <div className="stat-label">Harvested</div>
        </div>
      </div>

      {/* Harvest totals */}
      {harvested.length > 0 && (
        <div className="card mb-2">
          <div className="card-header">
            <h2>🧺 Season Harvest</h2>
            <span className="pill">{harvested.length} crop{harvested.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="harvest-grid">
            {harvested.map(p => {
              const name = p.custom_name || p.plants?.name || '—'
              const variety = p.plants?.variety
              return (
                <div key={p.id} className="harvest-item">
                  <div className="harvest-item-name">
                    {name}{variety ? <span className="text-muted"> — {variety}</span> : ''}
                  </div>
                  {p.harvest_quantity && (
                    <div className="harvest-item-qty">{p.harvest_quantity}</div>
                  )}
                  {p.taste_rating && <StarRating value={p.taste_rating} />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Upcoming tasks */}
        <div className="card">
          <div className="card-header">
            <h2>Upcoming Tasks</h2>
            <span className="pill">{tasks.length} this week</span>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-icon">✅</div>
              <p>All caught up! No tasks due this week.</p>
            </div>
          ) : (
            tasks.map(task => {
              const name = task.plantings?.custom_name || task.plantings?.plants?.name || 'Plant'
              return (
                <div key={task.id} className="task-item">
                  <div
                    className={`task-check ${task.completed_at ? 'checked' : ''}`}
                    onClick={() => completeTask(task.id)}
                    title="Mark complete"
                  >
                    {task.completed_at && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                  </div>
                  <div className="task-type-icon">{TASK_ICONS[task.task_type] || '📋'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="task-title" style={{ fontWeight: 500, fontSize: '0.9rem' }}>{task.title}</div>
                    <div className="text-sm text-muted">{name}</div>
                  </div>
                  {task.due_date && (
                    <div className={`text-sm ${taskDueClass(task.due_date)}`}>
                      {isToday(parseISO(task.due_date)) ? 'Today' : format(parseISO(task.due_date), 'MMM d')}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-header">
            <h2>Recent Plantings</h2>
          </div>

          {recent.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-icon">🌱</div>
              <p>No plantings yet. Add your first planting!</p>
            </div>
          ) : (
            <div>
              {recent.map(p => {
                const name = p.custom_name || p.plants?.name || '—'
                const variety = p.plants?.variety
                const bedName = p.beds?.name
                const date = p.date_seeded || p.date_transplanted
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid var(--fog)' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {p.status === 'harvested' ? '🧺' : p.status === 'growing' ? '🌿' : p.status === 'seeded' ? '🫘' : '🌱'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{name}{variety ? ` — ${variety}` : ''}</div>
                      <div className="text-sm text-muted">{bedName && `${bedName} · `}{date && format(parseISO(date), 'MMM d')}</div>
                    </div>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
