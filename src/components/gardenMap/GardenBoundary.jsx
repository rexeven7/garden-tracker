import { Rect, Line, Group } from 'react-konva'

export default function GardenBoundary({ garden, scale }) {
  const w = garden.width_ft * scale
  const h = garden.height_ft * scale

  if (garden.shape === 'rectangle' || !garden.boundary_points) {
    return (
      <Group>
        <Rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill={garden.background_color || '#8B9E6B'}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={2}
          shadowColor="rgba(0,0,0,0.3)"
          shadowBlur={8}
          shadowOffsetY={2}
        />
      </Group>
    )
  }

  if (garden.boundary_points && garden.boundary_points.length > 0) {
    const points = garden.boundary_points.flatMap(p => [p.x * scale, p.y * scale])
    return (
      <Group>
        <Line
          points={points}
          closed
          fill={garden.background_color || '#8B9E6B'}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={2}
        />
      </Group>
    )
  }

  return null
}
