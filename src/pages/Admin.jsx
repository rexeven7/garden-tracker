import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'

const ADMIN_EMAIL = 'rexeven@gmail.com'

export default function Admin({ user }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(null) // user id being reset
  const [exporting, setExporting] = useState(false)

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <h3>Access denied</h3>
        <p>This page is for admins only.</p>
      </div>
    )
  }

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  async function resetUser(targetId, email) {
    if (!window.confirm(`⚠️ This will permanently delete ALL data for ${email} — plants, beds, seasons, plantings, and tasks. This cannot be undone.\n\nType RESET to confirm.`)) return
    const input = window.prompt('Type RESET to confirm:')
    if (input !== 'RESET') { alert('Reset cancelled.'); return }

    setResetting(targetId)
    // Delete in order: tasks first (standalone), then seasons (cascades plantings → tasks), then plants and beds
    await supabase.from('tasks').delete().eq('user_id', targetId)
    await supabase.from('seasons').delete().eq('user_id', targetId)
    await supabase.from('plants').delete().eq('user_id', targetId)
    await supabase.from('beds').delete().eq('user_id', targetId)
    setResetting(null)
    alert(`✅ Account data for ${email} has been reset.`)
  }

  // ── Data export helpers ───────────────────────────────────────

  function toCSV(rows) {
    if (!rows || rows.length === 0) return ''
    const headers = Object.keys(rows[0])
    const escape = v => {
      if (v == null) return ''
      const s = String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }
    return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n')
  }

  function downloadBlob(content, filename, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  async function exportJSON() {
    setExporting(true)
    const [plants, beds, seasons, plantings, tasks] = await Promise.all([
      supabase.from('plants').select('*').eq('user_id', user.id),
      supabase.from('beds').select('*').eq('user_id', user.id),
      supabase.from('seasons').select('*').eq('user_id', user.id),
      supabase.from('plantings').select('*').eq('user_id', user.id),
      supabase.from('tasks').select('*').eq('user_id', user.id),
    ])
    const payload = {
      exported_at: new Date().toISOString(),
      user_email: user.email,
      plants: plants.data || [],
      beds: beds.data || [],
      seasons: seasons.data || [],
      plantings: plantings.data || [],
      tasks: tasks.data || [],
    }
    downloadBlob(JSON.stringify(payload, null, 2), `garden-export-${format(new Date(), 'yyyy-MM-dd')}.json`, 'application/json')
    setExporting(false)
  }

  async function exportCSV() {
    setExporting(true)
    const tables = ['plants', 'beds', 'seasons', 'plantings', 'tasks']
    for (const table of tables) {
      const { data } = await supabase.from(table).select('*').eq('user_id', user.id)
      if (data && data.length > 0) {
        // Small delay so browser allows multiple downloads
        await new Promise(r => setTimeout(r, 200))
        downloadBlob(toCSV(data), `garden-${table}-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv')
      }
    }
    setExporting(false)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin</h1>
          <p className="text-muted">User management and data tools</p>
        </div>
      </div>

      {/* Data export — for your own account */}
      <div className="card mb-2">
        <h3 style={{ marginBottom: '0.5rem' }}>📦 Export Your Data</h3>
        <p className="text-sm text-muted mb-2">Download a complete backup of your garden data.</p>
        <div className="flex gap-1">
          <button className="btn btn-secondary" onClick={exportJSON} disabled={exporting}>
            {exporting ? 'Exporting…' : '⬇ Download JSON'}
          </button>
          <button className="btn btn-secondary" onClick={exportCSV} disabled={exporting}>
            {exporting ? 'Exporting…' : '⬇ Download CSV (5 files)'}
          </button>
        </div>
      </div>

      {/* User management */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h3>👥 Registered Users</h3>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading users…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>No users found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      {u.email}
                      {u.email === ADMIN_EMAIL && <span className="pill" style={{ marginLeft: '0.5rem', background: 'var(--leaf)', color: 'white', fontSize: '0.7rem' }}>admin</span>}
                    </td>
                    <td className="text-sm text-muted">{u.created_at ? format(parseISO(u.created_at), 'MMM d, yyyy') : '—'}</td>
                    <td>
                      {u.email !== ADMIN_EMAIL && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => resetUser(u.id, u.email)}
                          disabled={resetting === u.id}
                        >
                          {resetting === u.id ? 'Resetting…' : '🗑 Reset Account'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
