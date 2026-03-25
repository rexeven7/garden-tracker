import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { supabase } from './lib/supabase'
import { SpeedInsights } from '@vercel/speed-insights/react'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Plantings from './pages/Plantings'
import PlantLibrary from './pages/PlantLibrary'
import Rotation from './pages/Rotation'
import Tasks from './pages/Tasks'
import Admin from './pages/Admin'
import Issues from './pages/Issues'
import { Beds, Seasons } from './pages/BedsSeasons'
import './index.css'

const ADMIN_EMAIL = 'rexeven@gmail.com'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',     icon: '🏡', section: null },
  { id: 'plantings',  label: 'Plantings',      icon: '🌱', section: 'This Season' },
  { id: 'tasks',      label: 'Tasks',           icon: '✅', section: null },
  { id: 'issues',     label: 'Pest & Issues',   icon: '🐛', section: null },
  { id: 'rotation',   label: 'Crop Rotation',   icon: '🔄', section: null },
  { id: 'library',    label: 'Plant Library',   icon: '📚', section: 'Setup' },
  { id: 'beds',       label: 'Beds & Areas',    icon: '🪴', section: null },
  { id: 'seasons',    label: 'Seasons',         icon: '📅', section: null },
  { id: 'admin',      label: 'Admin',           icon: '🔧', section: null, adminOnly: true },
]

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) upsertProfile(data.session.user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) upsertProfile(session.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function upsertProfile(u) {
    await supabase.from('user_profiles').upsert({ id: u.id, email: u.email }, { onConflict: 'id' })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
          <p style={{ color: 'var(--muted)' }}>Loading your garden…</p>
        </div>
      </div>
    )
  }

  if (!session) return <AuthPage />

  const user = session.user

  function renderPage() {
    switch (page) {
      case 'dashboard': return <Dashboard user={user} />
      case 'plantings': return <Plantings user={user} />
      case 'tasks':     return <Tasks user={user} />
      case 'issues':    return <Issues user={user} />
      case 'rotation':  return <Rotation user={user} />
      case 'library':   return <PlantLibrary user={user} />
      case 'beds':      return <Beds user={user} />
      case 'seasons':   return <Seasons user={user} />
      case 'admin':     return <Admin user={user} />
      default:          return <Dashboard user={user} />
    }
  }

  let lastSection = null

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <span>🌿</span>
          Garden Tracker
        </div>
        <div className="flex-center gap-2">
          <span className="text-sm" style={{ color: 'rgba(250,246,238,0.6)', fontSize: '0.8rem' }}>{user.email}</span>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'rgba(250,246,238,0.7)', fontSize: '0.8rem' }}
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </header>

      <nav className="app-sidebar">
        {NAV.filter(item => !item.adminOnly || user.email === ADMIN_EMAIL).map(item => {
          const showSection = item.section && item.section !== lastSection
          if (item.section) lastSection = item.section
          return (
            <div key={item.id}>
              {showSection && <div className="nav-section">{item.section}</div>}
              <div
                className={`nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => setPage(item.id)}
              >
                <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                {item.label}
              </div>
            </div>
          )
        })}
      </nav>

      <main className="main-content">
        {renderPage()}
      </main>
      <SpeedInsights />
      <Analytics />
    </div>
  )
}
