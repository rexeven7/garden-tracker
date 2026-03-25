import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Plant families that should NOT follow themselves
const ROTATION_CONFLICTS = {
  'Nightshades (Solanaceae)': ['Nightshades (Solanaceae)'],
  'Brassicas (Cruciferae)': ['Brassicas (Cruciferae)'],
  'Legumes (Fabaceae)': ['Legumes (Fabaceae)'],
  'Cucurbits (Cucurbitaceae)': ['Cucurbits (Cucurbitaceae)'],
  'Alliums (Amaryllidaceae)': ['Alliums (Amaryllidaceae)'],
  'Corn (Poaceae)': ['Corn (Poaceae)'],
}

// What grows well AFTER each family
const GOOD_FOLLOWS = {
  'Nightshades (Solanaceae)': 'Follow with: Brassicas, Legumes',
  'Brassicas (Cruciferae)': 'Follow with: Legumes (restores nitrogen)',
  'Legumes (Fabaceae)': 'Follow with: Corn, Nightshades (benefits from N)',
  'Cucurbits (Cucurbitaceae)': 'Follow with: Legumes, Alliums',
  'Alliums (Amaryllidaceae)': 'Follow with: Brassicas, Cucurbits',
  'Corn (Poaceae)': 'Follow with: Legumes, then Nightshades',
}

export default function Rotation({ user }) {
  const [beds, setBeds] = useState([])
  const [seasons, setSeasons] = useState([])
  const [plantings, setPlantings] = useState([])
  const [families, setFamilies] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedYears, setSelectedYears] = useState([])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [bRes, sRes, pRes, fRes] = await Promise.all([
      supabase.from('beds').select('*').eq('user_id', user.id).order('name'),
      supabase.from('seasons').select('*').eq('user_id', user.id).order('year'),
      supabase.from('plantings')
        .select('*, plants(name, family_id, plant_families(name,color)), plant_families!custom_family_id(name,color), beds(name), seasons(year)')
        .eq('user_id', user.id),
      supabase.from('plant_families').select('*').order('name'),
    ])

    const allSeasons = sRes.data || []
    setBeds(bRes.data || [])
    setSeasons(allSeasons)
    setPlantings(pRes.data || [])
    setFamilies(fRes.data || [])

    // Default: show last 3 years
    const years = allSeasons.map(s => s.year).sort()
    setSelectedYears(years.slice(-4))
    setLoading(false)
  }

  // Get family info for a planting
  function getFamily(planting) {
    if (planting.plant_families) return planting.plant_families
    if (planting.plants?.plant_families) return planting.plants.plant_families
    return null
  }

  // Get all plantings for a bed in a given season year
  function getBedSeasonPlantings(bedId, year) {
    const season = seasons.find(s => s.year === year)
    if (!season) return []
    return plantings.filter(p => p.bed_id === bedId && p.season_id === season.id)
  }

  // Check if there's a rotation conflict between consecutive years
  function hasConflict(bedId, year) {
    const prev = getBedSeasonPlantings(bedId, year - 1)
    const curr = getBedSeasonPlantings(bedId, year)
    if (!prev.length || !curr.length) return false

    for (const prevP of prev) {
      const prevFamily = getFamily(prevP)?.name
      for (const currP of curr) {
        const currFamily = getFamily(currP)?.name
        if (prevFamily && currFamily && ROTATION_CONFLICTS[prevFamily]?.includes(currFamily)) {
          return true
        }
      }
    }
    return false
  }

  // Get rotation suggestion for a bed
  function getRotationSuggestion(bedId, year) {
    const prev = getBedSeasonPlantings(bedId, year - 1)
    if (!prev.length) return null
    const families = [...new Set(prev.map(p => getFamily(p)?.name).filter(Boolean))]
    if (!families.length) return null
    const suggestions = families.map(f => GOOD_FOLLOWS[f]).filter(Boolean)
    return suggestions[0] || null
  }

  const displayYears = selectedYears.sort((a, b) => a - b)

  const familyLegend = families.filter(f => f.name !== 'Other / Flower')

  if (loading) return <div className="empty-state"><p>Loading rotation data…</p></div>

  if (seasons.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔄</div>
        <h3>No seasons yet</h3>
        <p>Add seasons first in the Seasons page, then add plantings to enable rotation tracking.</p>
      </div>
    )
  }

  if (beds.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🌿</div>
        <h3>No beds yet</h3>
        <p>Add your raised beds or areas first to see the rotation board.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Crop Rotation</h1>
          <p className="text-muted">Track plant families across beds and years. Avoid planting the same family in the same bed consecutively.</p>
        </div>
      </div>

      {/* Year selector */}
      <div className="card mb-2">
        <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--muted)' }}>Show years:</span>
          {seasons.map(s => (
            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={selectedYears.includes(s.year)}
                onChange={e => {
                  if (e.target.checked) setSelectedYears(y => [...y, s.year])
                  else setSelectedYears(y => y.filter(x => x !== s.year))
                }}
              />
              {s.year}
            </label>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="card mb-2">
        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plant Families</div>
        <div className="flex" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          {familyLegend.map(f => (
            <span key={f.id} className="family-chip" style={{ background: f.color }}>
              {f.name.split(' (')[0]}
            </span>
          ))}
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)', alignSelf: 'center', marginLeft: '0.5rem' }}>
            ⚠️ = same family two years in a row
          </span>
        </div>
      </div>

      {/* Rotation grid */}
      {displayYears.length === 0 ? (
        <div className="empty-state">
          <p>Select at least one year above to see the rotation board.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
          <div
            className="rotation-grid"
            style={{ '--years': displayYears.length }}
          >
            {/* Header row */}
            <div className="rotation-cell rotation-header" style={{ background: 'var(--soil)', color: 'var(--straw)' }}>
              Bed / Area
            </div>
            {displayYears.map(year => (
              <div key={year} className="rotation-cell rotation-header" style={{ background: 'var(--soil)', color: 'var(--straw)', textAlign: 'center' }}>
                {year}
              </div>
            ))}

            {/* Data rows */}
            {beds.map(bed => (
              <>
                <div key={`label-${bed.id}`} className="rotation-cell rotation-bed-label">
                  {bed.name}
                  {bed.description && <div style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 400 }}>{bed.description}</div>}
                </div>

                {displayYears.map(year => {
                  const cellPlantings = getBedSeasonPlantings(bed.id, year)
                  const conflict = hasConflict(bed.id, year)
                  const suggestion = getRotationSuggestion(bed.id, year)

                  return (
                    <div
                      key={`${bed.id}-${year}`}
                      className="rotation-cell"
                      style={{ background: conflict ? '#fff7ed' : 'white' }}
                    >
                      {cellPlantings.length === 0 ? (
                        <span style={{ color: 'var(--fog)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                          {suggestion ? suggestion : 'Empty'}
                        </span>
                      ) : (
                        <>
                          {cellPlantings.map(p => {
                            const family = getFamily(p)
                            const name = p.custom_name || p.plants?.name || '?'
                            return (
                              <div key={p.id} style={{ marginBottom: '2px' }}>
                                <div style={{ fontWeight: 500, fontSize: '0.8rem' }}>{name}</div>
                                {family && (
                                  <span className="family-chip" style={{ background: family.color }}>
                                    {family.name.split(' (')[0]}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                          {conflict && (
                            <div className="warning-chip">⚠️ Same family as last year</div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {/* Rotation guide */}
      <div className="mt-2">
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Rotation Guide</h2>
          <div className="grid-2">
            {Object.entries(GOOD_FOLLOWS).map(([family, advice]) => {
              const f = families.find(x => x.name === family)
              return (
                <div key={family} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.5rem 0', borderBottom: '1px solid var(--fog)' }}>
                  {f && <span className="family-chip" style={{ background: f.color, flexShrink: 0 }}>{family.split(' (')[0]}</span>}
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{advice}</div>
                    {f?.rotation_notes && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>{f.rotation_notes}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
