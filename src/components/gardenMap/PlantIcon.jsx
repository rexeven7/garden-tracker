import { Group, Text, Circle } from 'react-konva'

// Category-based defaults
const CATEGORY_EMOJI = {
  vegetable: '🥬',
  herb:      '🌿',
  flower:    '🌸',
  fruit:     '🍓',
}

// Specific plant overrides
const PLANT_EMOJI = {
  tomato:     '🍅',
  corn:       '🌽',
  carrot:     '🥕',
  cucumber:   '🥒',
  pepper:     '🌶️',
  eggplant:   '🍆',
  squash:     '🎃',
  zucchini:   '🥒',
  pumpkin:    '🎃',
  potato:     '🥔',
  strawberry: '🍓',
  watermelon: '🍉',
  lettuce:    '🥬',
  kale:       '🥬',
  spinach:    '🥬',
  broccoli:   '🥦',
  cabbage:    '🥬',
  pea:        '🫛',
  bean:       '🫘',
  garlic:     '🧄',
  onion:      '🧅',
  sunflower:  '🌻',
  lavender:   '💜',
  basil:      '🌿',
  mint:       '🌿',
  dill:       '🌿',
  parsley:    '🌿',
}

function getEmoji(plant) {
  if (!plant) return '🌱'
  const nameLower = (plant.name || '').toLowerCase()
  for (const [key, emoji] of Object.entries(PLANT_EMOJI)) {
    if (nameLower.includes(key)) return emoji
  }
  return CATEGORY_EMOJI[plant.category] || '🌱'
}

// Heuristic spacing defaults (inches) for common plants — used when spacing_inches is not set on the plant record
const SPACING_DEFAULTS = {
  tomato: 24, corn: 12, carrot: 3, cucumber: 12, pepper: 18,
  eggplant: 18, squash: 36, zucchini: 24, pumpkin: 36, potato: 12,
  strawberry: 12, watermelon: 36, lettuce: 8, kale: 12, spinach: 6,
  broccoli: 18, cabbage: 18, pea: 4, bean: 6, garlic: 6, onion: 4,
  sunflower: 12, lavender: 18, basil: 8, mint: 12, dill: 6, parsley: 8,
}

function getSpacingInches(plant) {
  if (!plant) return 0
  if (plant.spacing_inches) return Number(plant.spacing_inches)
  const nameLower = (plant.name || '').toLowerCase()
  for (const [key, inches] of Object.entries(SPACING_DEFAULTS)) {
    if (nameLower.includes(key)) return inches
  }
  return 6 // default fallback: 6 inches
}

const STATUS_RING = {
  planned:      '#94a3b8',
  seeded:       '#60a5fa',
  transplanted: '#34d399',
  growing:      '#4ade80',
  harvested:    '#fbbf24',
  failed:       '#f87171',
}

export default function PlantIcon({
  planting,
  x,
  y,
  iconSize = 20,
  showLabel,
  showStatus,
  showSpacing,
  scale,
  onHover,
  onHoverEnd,
  onClick,
}) {
  const emoji = getEmoji(planting.plants)
  const statusColor = STATUS_RING[planting.status] || '#94a3b8'
  const spacingIn = getSpacingInches(planting.plants)
  const spacing_px = spacingIn > 0 ? (spacingIn / 12) * scale / 2 : 0

  return (
    <Group
      x={x}
      y={y}
      onClick={() => onClick?.(planting)}
      onTap={() => onClick?.(planting)}
      onMouseEnter={e => { e.target.getStage().container().style.cursor = 'pointer'; onHover?.(planting, e) }}
      onMouseLeave={e => { e.target.getStage().container().style.cursor = 'move'; onHoverEnd?.() }}
    >
      {/* Spacing circle */}
      {showSpacing && spacing_px > 0 && (
        <Circle
          radius={spacing_px}
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1}
          listening={false}
        />
      )}

      {/* Status ring */}
      {showStatus && (
        <Circle
          radius={iconSize / 2 + 3}
          fill="transparent"
          stroke={statusColor}
          strokeWidth={2}
          listening={false}
        />
      )}

      {/* Plant emoji */}
      <Text
        text={emoji}
        x={-iconSize / 2}
        y={-iconSize / 2}
        fontSize={iconSize}
        listening={false}
      />

      {/* Name label */}
      {showLabel && (
        <Text
          text={planting.custom_name || planting.plants?.name || ''}
          x={-40}
          y={iconSize / 2 + 2}
          width={80}
          align="center"
          fontSize={8}
          fontFamily="DM Sans, sans-serif"
          fill="white"
          shadowColor="rgba(0,0,0,0.6)"
          shadowBlur={2}
          listening={false}
          ellipsis
          wrap="none"
        />
      )}
    </Group>
  )
}

export { getEmoji }
