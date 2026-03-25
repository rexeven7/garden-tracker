import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Open-Meteo WMO weather code → { label, emoji }
function interpretWeatherCode(code) {
  if (code === 0)               return { label: 'Clear sky',        emoji: '☀️' }
  if (code === 1)               return { label: 'Mainly clear',     emoji: '🌤' }
  if (code === 2)               return { label: 'Partly cloudy',    emoji: '⛅' }
  if (code === 3)               return { label: 'Overcast',         emoji: '☁️' }
  if ([45, 48].includes(code))  return { label: 'Foggy',            emoji: '🌫' }
  if ([51, 53, 55].includes(code)) return { label: 'Drizzle',       emoji: '🌦' }
  if ([61, 63, 65].includes(code)) return { label: 'Rain',          emoji: '🌧' }
  if ([71, 73, 75].includes(code)) return { label: 'Snow',          emoji: '❄️' }
  if ([77].includes(code))      return { label: 'Snow grains',      emoji: '🌨' }
  if ([80, 81, 82].includes(code)) return { label: 'Rain showers',  emoji: '🌦' }
  if ([85, 86].includes(code))  return { label: 'Snow showers',     emoji: '🌨' }
  if (code === 95)              return { label: 'Thunderstorm',     emoji: '⛈' }
  if ([96, 99].includes(code))  return { label: 'Thunderstorm',     emoji: '⛈' }
  return { label: 'Unknown', emoji: '🌡' }
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeatherWidget({ user }) {
  const [settings, setSettings]   = useState(null)   // null = not loaded yet
  const [weather, setWeather]     = useState(null)
  const [loadingWeather, setLoadingWeather] = useState(false)
  const [error, setError]         = useState(null)

  // Location setup state
  const [showSetup, setShowSetup] = useState(false)
  const [query, setQuery]         = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults]     = useState([])
  const [saving, setSaving]       = useState(false)

  // 1. Load saved settings
  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      setSettings(data || {})  // empty obj = no location saved yet
    }
    loadSettings()
  }, [user.id])

  // 2. Fetch weather once we have coordinates
  const fetchWeather = useCallback(async (lat, lon, unit = 'fahrenheit') => {
    setLoadingWeather(true)
    setError(null)
    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast')
      url.searchParams.set('latitude', lat)
      url.searchParams.set('longitude', lon)
      url.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,precipitation')
      url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum')
      url.searchParams.set('temperature_unit', unit)
      url.searchParams.set('wind_speed_unit', 'mph')
      url.searchParams.set('precipitation_unit', 'inch')
      url.searchParams.set('timezone', 'auto')
      url.searchParams.set('forecast_days', '5')

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Weather fetch failed')
      const data = await res.json()
      setWeather(data)
    } catch (e) {
      setError('Could not load weather. Try again later.')
    } finally {
      setLoadingWeather(false)
    }
  }, [])

  useEffect(() => {
    if (settings?.latitude && settings?.longitude) {
      fetchWeather(settings.latitude, settings.longitude, settings.temperature_unit || 'fahrenheit')
    }
  }, [settings, fetchWeather])

  // Location search via Open-Meteo geocoding
  async function searchLocation() {
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      )
      const data = await res.json()
      setResults(data.results || [])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  async function saveLocation(result) {
    setSaving(true)
    const locationName = [result.name, result.admin1, result.country].filter(Boolean).join(', ')
    const payload = {
      user_id: user.id,
      latitude: result.latitude,
      longitude: result.longitude,
      location_name: locationName,
      temperature_unit: 'fahrenheit',
      updated_at: new Date().toISOString(),
    }
    await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' })
    setSettings(payload)
    setShowSetup(false)
    setQuery('')
    setResults([])
    setSaving(false)
  }

  const degSymbol = settings?.temperature_unit === 'celsius' ? '°C' : '°F'

  // ── Not loaded yet ──────────────────────────────────────────
  if (settings === null) return null

  // ── No location saved ───────────────────────────────────────
  if (!settings.latitude) {
    return (
      <div className="weather-setup-banner">
        <span className="weather-setup-icon">🌤</span>
        <span>Add your location to see live weather on your dashboard.</span>
        <button className="btn btn-sm btn-primary" onClick={() => setShowSetup(true)}>Set Location</button>
        {showSetup && (
          <LocationSetupModal
            query={query} setQuery={setQuery}
            searching={searching} results={results}
            saving={saving}
            onSearch={searchLocation}
            onSave={saveLocation}
            onClose={() => { setShowSetup(false); setResults([]) }}
          />
        )}
      </div>
    )
  }

  // ── Weather loading / error ─────────────────────────────────
  if (loadingWeather) {
    return (
      <div className="weather-card">
        <p className="text-muted" style={{ padding: '1rem 0' }}>Loading weather for {settings.location_name}…</p>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="weather-card">
        <p className="text-muted">{error || 'No weather data.'}</p>
        <button className="btn btn-sm btn-secondary" style={{ marginTop: '0.5rem' }}
          onClick={() => fetchWeather(settings.latitude, settings.longitude, settings.temperature_unit)}>
          Retry
        </button>
      </div>
    )
  }

  // ── Main widget ─────────────────────────────────────────────
  const cur     = weather.current
  const daily   = weather.daily
  const curInfo = interpretWeatherCode(cur.weather_code)

  return (
    <div className="weather-card">
      {/* Current conditions */}
      <div className="weather-current">
        <div className="weather-main">
          <span className="weather-emoji">{curInfo.emoji}</span>
          <div>
            <div className="weather-temp">{Math.round(cur.temperature_2m)}{degSymbol}</div>
            <div className="weather-condition">{curInfo.label}</div>
          </div>
        </div>
        <div className="weather-details">
          <div className="weather-detail-item">
            <span className="weather-detail-icon">🌡</span>
            <span>Feels like {Math.round(cur.apparent_temperature)}{degSymbol}</span>
          </div>
          <div className="weather-detail-item">
            <span className="weather-detail-icon">💧</span>
            <span>{cur.relative_humidity_2m}% humidity</span>
          </div>
          <div className="weather-detail-item">
            <span className="weather-detail-icon">💨</span>
            <span>{Math.round(cur.wind_speed_10m)} mph wind</span>
          </div>
          {cur.precipitation > 0 && (
            <div className="weather-detail-item">
              <span className="weather-detail-icon">🌧</span>
              <span>{cur.precipitation}" precip</span>
            </div>
          )}
        </div>
        <div className="weather-location-row">
          <span className="weather-location">📍 {settings.location_name}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowSetup(true)}
            title="Change location"
          >
            Change
          </button>
        </div>
      </div>

      {/* 5-day forecast */}
      <div className="weather-forecast">
        {daily.time.map((dateStr, i) => {
          const d      = new Date(dateStr + 'T12:00:00')
          const info   = interpretWeatherCode(daily.weather_code[i])
          const isToday = i === 0
          return (
            <div key={dateStr} className={`weather-forecast-day ${isToday ? 'forecast-today' : ''}`}>
              <div className="forecast-day-label">{isToday ? 'Today' : DAYS[d.getDay()]}</div>
              <div className="forecast-emoji">{info.emoji}</div>
              <div className="forecast-temps">
                <span className="forecast-high">{Math.round(daily.temperature_2m_max[i])}°</span>
                <span className="forecast-low">{Math.round(daily.temperature_2m_min[i])}°</span>
              </div>
              {daily.precipitation_sum[i] > 0.01 && (
                <div className="forecast-precip">💧 {daily.precipitation_sum[i].toFixed(2)}"</div>
              )}
            </div>
          )
        })}
      </div>

      {showSetup && (
        <LocationSetupModal
          query={query} setQuery={setQuery}
          searching={searching} results={results}
          saving={saving}
          onSearch={searchLocation}
          onSave={saveLocation}
          onClose={() => { setShowSetup(false); setResults([]) }}
        />
      )}
    </div>
  )
}

function LocationSetupModal({ query, setQuery, searching, results, saving, onSearch, onSave, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Set Your Location</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
          Enter your city to get live weather on your dashboard. Your coordinates are saved to your account — no API key needed.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="e.g. Portland, Denver, Nashville…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch()}
            autoFocus
          />
          <button className="btn btn-primary" onClick={onSearch} disabled={searching} style={{ whiteSpace: 'nowrap' }}>
            {searching ? '…' : 'Search'}
          </button>
        </div>
        {results.length > 0 && (
          <div className="location-results">
            {results.map((r, i) => (
              <button
                key={i}
                className="location-result-item"
                onClick={() => onSave(r)}
                disabled={saving}
              >
                <span style={{ fontWeight: 500 }}>{r.name}</span>
                <span className="text-muted text-sm">{[r.admin1, r.country].filter(Boolean).join(', ')}</span>
              </button>
            ))}
          </div>
        )}
        {results.length === 0 && !searching && query && (
          <p className="text-muted text-sm">No results found. Try a different city name.</p>
        )}
      </div>
    </div>
  )
}
