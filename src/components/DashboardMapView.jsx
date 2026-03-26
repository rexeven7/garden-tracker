import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import GardenCanvas from './gardenMap/GardenCanvas'

const MAP_LAYERS = { plants: true, status: true, grid: true, spacing: false, tasks: false, dates: false }

export default function DashboardMapView({ user, navigate }) {
  const [loading, setLoading] = useState(true)
  const [garden, setGarden] = useState(null)
  const [beds, setBeds] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    const { data: gardens } = await supabase
      .from('gardens').select('*').eq('user_id', user.id).order('created_at').limit(1)
    const g = gardens?.[0] || null
    setGarden(g)
    if (g) {
      const { data } = await supabase
        .from('beds')
        .select(`
          *,
          plantings (
            id, status, custom_name, position_x, position_y,
            plants ( id, name, variety, category, spacing_inches )
          )
        `)
        .eq('garden_id', g.id)
        .eq('user_id', user.id)
        .order('name')
      setBeds(data || [])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="dashboard-map-view dashboard-map-loading">
        <span style={{ fontSize: '1.5rem' }}>🗺️</span>
        <p className="text-muted text-sm">Loading map…</p>
      </div>
    )
  }

  if (!garden) {
    return (
      <div className="dashboard-map-view dashboard-map-empty">
        <div style={{ fontSize: '2.5rem' }}>🌱</div>
        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No garden yet</p>
        <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
          Set up your garden to see it here
        </p>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('garden')}>
          Create Garden →
        </button>
      </div>
    )
  }

  return (
    <div className="dashboard-map-view">
      <div className="dashboard-map-header">
        <div>
          <span className="dashboard-map-title">{garden.name}</span>
          <span className="text-muted text-sm" style={{ marginLeft: '0.5rem' }}>
            {garden.width_ft} × {garden.height_ft} ft · {beds.length} bed{beds.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('garden')}
        >
          Edit Garden →
        </button>
      </div>
      <div className="dashboard-map-canvas">
        <GardenCanvas
          garden={garden}
          beds={beds}
          layers={MAP_LAYERS}
          editMode={false}
          compact
        />
      </div>
    </div>
  )
}
