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
  const spacing_px = planting.plants?.spacing_inches
    ? (planting.plants.spacing_inches / 12) * scale / 2
    : 0

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
