const LAYER_DEFS = [
  { key: 'plants',  label: 'Plants',  icon: '🌱' },
  { key: 'status',  label: 'Status',  icon: '📊' },
  { key: 'tasks',   label: 'Tasks',   icon: '✅' },
  { key: 'spacing', label: 'Spacing', icon: '📏' },
  { key: 'dates',   label: 'Dates',   icon: '📅' },
  { key: 'grid',    label: 'Grid',    icon: '🔲' },
]

export default function LayerControls({ layers, onToggle }) {
  return (
    <div className="layer-controls">
      {LAYER_DEFS.map(def => (
        <button
          key={def.key}
          className={`layer-chip ${layers[def.key] ? 'active' : ''}`}
          onClick={() => onToggle(def.key)}
          title={`Toggle ${def.label} layer`}
        >
          {def.icon} {def.label}
          {layers[def.key] && <span className="layer-chip-check">✓</span>}
        </button>
      ))}
    </div>
  )
}
