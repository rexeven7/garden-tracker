import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const SHAPES = [
  { value: 'rectangle', label: 'Rectangle', icon: '⬜', desc: 'A simple rectangular garden area' },
  { value: 'l_shape',   label: 'L-Shape',   icon: '🔲', desc: 'Two rectangles forming an L' },
  { value: 'custom',    label: 'Custom',    icon: '⬡', desc: 'Draw your own boundary' },
]

export default function GardenSetup({ user, onCreated }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: 'My Garden',
    width_ft: '',
    height_ft: '',
    shape: 'rectangle',
    background_color: '#8B9E6B',
    grid_spacing_ft: 1,
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  function next() {
    if (step === 1) {
      if (!form.name.trim() || !form.width_ft || !form.height_ft) {
        alert('Please fill in the garden name and dimensions.')
        return
      }
    }
    setStep(s => s + 1)
  }

  async function create() {
    setSaving(true)
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      width_ft: parseFloat(form.width_ft),
      height_ft: parseFloat(form.height_ft),
      shape: form.shape,
      background_color: form.background_color,
      grid_spacing_ft: parseFloat(form.grid_spacing_ft) || 1,
      notes: form.notes || null,
    }
    const { data, error } = await supabase.from('gardens').insert(payload).select().single()
    setSaving(false)
    if (error) { alert('Error creating garden: ' + error.message); return }
    onCreated(data)
  }

  return (
    <div className="garden-setup-overlay">
      <div className="garden-setup-modal">
        <div className="garden-setup-header">
          <h2>Set Up Your Garden Map</h2>
          <div className="setup-steps">
            {[1, 2, 3].map(n => (
              <div key={n} className={`setup-step-dot ${step === n ? 'active' : step > n ? 'done' : ''}`} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="setup-step-content">
            <h3>Garden Details</h3>
            <p className="text-muted mb-2">Tell us about your outdoor space.</p>
            <div className="form-group">
              <label>Garden Name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Backyard Garden, Front Yard"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Width (feet)</label>
                <input
                  type="number"
                  value={form.width_ft}
                  onChange={e => setForm({ ...form, width_ft: e.target.value })}
                  placeholder="e.g. 30"
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Depth (feet)</label>
                <input
                  type="number"
                  value={form.height_ft}
                  onChange={e => setForm({ ...form, height_ft: e.target.value })}
                  placeholder="e.g. 20"
                  min="1"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Anything to note about your garden space"
              />
            </div>
            <div className="setup-footer">
              <button className="btn btn-primary" onClick={next}>Next →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="setup-step-content">
            <h3>Garden Shape</h3>
            <p className="text-muted mb-2">What shape best describes your garden's outer boundary?</p>
            <div className="shape-options">
              {SHAPES.map(s => (
                <div
                  key={s.value}
                  className={`shape-option ${form.shape === s.value ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, shape: s.value })}
                >
                  <span className="shape-icon">{s.icon}</span>
                  <strong>{s.label}</strong>
                  <span className="text-sm text-muted">{s.desc}</span>
                </div>
              ))}
            </div>
            <div className="form-row mt-2">
              <div className="form-group">
                <label>Grass / Ground Color</label>
                <div className="color-picker-row">
                  <input
                    type="color"
                    value={form.background_color}
                    onChange={e => setForm({ ...form, background_color: e.target.value })}
                    style={{ width: 44, height: 36, padding: 2, borderRadius: 6, border: '1px solid var(--fog)', cursor: 'pointer' }}
                  />
                  <span className="text-sm text-muted">Background color for your garden map</span>
                </div>
              </div>
              <div className="form-group">
                <label>Grid Spacing (feet)</label>
                <select value={form.grid_spacing_ft} onChange={e => setForm({ ...form, grid_spacing_ft: e.target.value })}>
                  <option value="0.5">0.5 ft</option>
                  <option value="1">1 ft</option>
                  <option value="2">2 ft</option>
                  <option value="5">5 ft</option>
                </select>
              </div>
            </div>
            <div className="setup-footer">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={next}>Preview →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="setup-step-content">
            <h3>Preview</h3>
            <p className="text-muted mb-2">Here's your garden. You can resize and adjust everything later.</p>
            <div className="garden-preview">
              <div
                className="garden-preview-shape"
                style={{
                  background: form.background_color,
                  aspectRatio: `${form.width_ft} / ${form.height_ft}`,
                  maxWidth: '100%',
                  maxHeight: 260,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 8,
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  border: '3px solid rgba(255,255,255,0.3)',
                }}
              >
                <strong style={{ fontSize: '1.2rem' }}>{form.name}</strong>
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{form.width_ft} ft × {form.height_ft} ft</span>
              </div>
            </div>
            <div className="setup-footer">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary" onClick={create} disabled={saving}>
                {saving ? 'Creating…' : '🗺️ Create Garden'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
