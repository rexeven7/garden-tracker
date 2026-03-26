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
import Garden from './pages/Garden'
import { Beds, Seasons } from './pages/BedsSeasons'
import './index.css'

const ADMIN_EMAIL = 'rexeven@gmail.com'

const NAV = [
  { id: 'garden',     label: 'Garden Map',      icon: '🗺️', section: null },
  { id: 'dashboard',  label: 'Dashboard',       icon: '🏡', section: 'This Season' },
  { id: 'plantings',  label: 'Plantings',       icon: '🌱', section: null },
  { id: 'tasks',      label: 'Tasks',            icon: '✅', section: null },
  { id: 'issues',     label: 'Pest & Issues',   icon: '🐛', section: null },
  { id: 'rotation',   label: 'Crop Rotation',   icon: '🔄', section: null },
  { id: 'library',    label: 'Plant Library',   icon: '📚', section: 'Setup' },
  { id: 'beds',       label: 'Beds & Areas',    icon: '🪴', section: null },
  { id: 'seasons',    label: 'Seasons',         icon: '📅', section: null },
  { id: 'admin',      label: 'Admin',           icon: '🔧', section: null, adminOnly: true },
]

// Bottom 4 tabs always visible on mobile
const BOTTOM_NAV = [
  { id: 'garden',    label: 'Garden',   icon: '🗺️' },
  { id: 'plantings', label: 'Plants',   icon: '🌱' },
  { id: 'tasks',     label: 'Tasks',    icon: '✅' },
  { id: 'issues',    label: 'Issues',   icon: '🐛' },
]

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('garden')
  const [pageParams, setPageParams] = useState({})
  const [showMore, setShowMore] = useState(false)

  function navigate(pageId, params = {}) {
    setPage(pageId)
    setPageParams(params)
    setShowMore(false)
  }

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
      case 'garden':    return <Garden user={user} navigate={navigate} params={pageParams} />
      case 'dashboard': return <Dashboard user={user} navigate={navigate} params={pageParams} />
      case 'plantings': return <Plantings user={user} params={pageParams} />
      case 'tasks':     return <Tasks user={user} params={pageParams} />
      case 'issues':    return <Issues user={user} />
      case 'rotation':  return <Rotation user={user} />
      case 'library':   return <PlantLibrary user={user} />
      case 'beds':      return <Beds user={user} />
      case 'seasons':   return <Seasons user={user} />
      case 'admin':     return <Admin user={user} />
      default:          return <Garden user={user} navigate={navigate} params={pageParams} />
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
                onClick={() => navigate(item.id)}
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

      {/* Mobile bottom tab bar */}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map(item => (
          <button
            key={item.id}
            className={`bottom-nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => { navigate(item.id); setShowMore(false) }}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ))}
        <button
          className={`bottom-nav-item ${showMore ? 'active' : ''}`}
          onClick={() => setShowMore(m => !m)}
        >
          <span className="bottom-nav-icon">☰</span>
          <span className="bottom-nav-label">More</span>
        </button>
      </nav>

      {/* More overlay */}
      {showMore && (
        <div className="more-overlay" onClick={() => setShowMore(false)}>
          <div className="more-sheet" onClick={e => e.stopPropagation()}>
            <div className="more-sheet-handle" />
            {NAV
              .filter(item => !BOTTOM_NAV.find(b => b.id === item.id))
              .filter(item => !item.adminOnly || user.email === ADMIN_EMAIL)
              .map(item => (
                <button
                  key={item.id}
                  className={`more-sheet-item ${page === item.id ? 'active' : ''}`}
                  onClick={() => { navigate(item.id); setShowMore(false) }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))
            }
            <div className="more-sheet-divider" />
            <button
              className="more-sheet-item"
              style={{ color: 'var(--muted)' }}
              onClick={() => supabase.auth.signOut()}
            >
              <span>🚪</span>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      <SpeedInsights />
      <Analytics />
    </div>
  )
}
