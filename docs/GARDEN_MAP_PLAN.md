# Garden Map Feature — Implementation Plan

## Overview

Add an interactive, overhead 2D garden map to the Garden Tracker app. Users define their garden's outer boundary, drag beds into position with real-world dimensions, and see plant icons where things are planted. The map supports toggleable information layers (status, tasks, dates, spacing) and hover cards with quick-action links into the rest of the app.

The map lives in a dedicated **Garden** tab (full editing capabilities) and is also available as a **Map View toggle** on the Dashboard (read-only / light interaction).

---

## Tech Stack Additions

| Package | Purpose |
|---|---|
| `react-konva` | React bindings for the Konva 2D canvas library — handles rendering, drag-and-drop, zoom, pan, and layers |
| `konva` | Peer dependency for react-konva |
| `use-image` | Lightweight hook for loading images onto Konva (for plant icons) |

Install:
```bash
npm install react-konva konva use-image
```

No other new dependencies are needed. The app already uses React 18, React Router 6, Vite, and Supabase.

---

## Database Changes

All changes are additive — no existing columns are dropped or renamed.

### New Table: `gardens`

```sql
create table gardens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'My Garden',
  width_ft numeric not null,        -- outer width in feet
  height_ft numeric not null,       -- outer height/depth in feet
  shape text not null default 'rectangle'
    check (shape in ('rectangle', 'l_shape', 'custom')),
  boundary_points jsonb,            -- array of {x, y} vertices (ft) for l_shape / custom
  background_color text default '#8B9E6B',  -- grass green default
  grid_spacing_ft numeric default 1,        -- snap grid increment
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table gardens enable row level security;
create policy "gardens_user" on gardens
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

> **Design note:** Most users will have exactly one garden. The schema supports multiple gardens for future flexibility (front yard vs backyard, community garden plot, etc.), but the UI defaults to a single-garden experience and only surfaces multi-garden selection if more than one exists.

### Alter Table: `beds`

```sql
-- Structured dimensions (replaces freeform size_sqft for spatial use)
alter table beds add column width_ft numeric;
alter table beds add column height_ft numeric;

-- Position within a garden (nullable — beds can exist without being placed)
alter table beds add column garden_id uuid references gardens(id) on delete set null;
alter table beds add column x numeric;           -- feet from garden left edge
alter table beds add column y numeric;           -- feet from garden top edge
alter table beds add column rotation_deg numeric default 0;

-- Custom shapes (for non-rectangular beds)
alter table beds add column shape text default 'rectangle'
  check (shape in ('rectangle', 'circle', 'custom'));
alter table beds add column boundary_points jsonb;  -- for custom polygon shapes
```

> **Backward compatibility:** The existing `size_sqft` column is kept. When `width_ft` and `height_ft` are set, `size_sqft` can be auto-computed (or left as a manual override for non-rectangular beds). Beds with no `garden_id` simply aren't shown on the map — they still appear in the Beds & Areas list page as they always have.

### Alter Table: `plantings`

```sql
-- Optional position within a bed (for precise plant placement on the map)
alter table plantings add column position_x numeric;  -- feet from bed left edge
alter table plantings add column position_y numeric;  -- feet from bed top edge
```

> **Design note:** Position is optional. Plantings without a position are rendered in an auto-layout grid within their bed. Plantings WITH a position are rendered at that exact spot. This means users don't have to micromanage placement — the map is useful even if they never drag a single plant.

### Migration File

Create a single migration: `supabase/migrations/YYYYMMDDHHMMSS_add_garden_map.sql` containing all of the above. Apply via the Supabase MCP `apply_migration` tool.

---

## File Structure

All new files go under `src/`. Follow the existing project conventions (named exports from page files, CSS in `index.css`, Supabase client from `lib/supabase`).

```
src/
├── pages/
│   └── Garden.jsx              # The "Garden" tab — full map editor
├── components/
│   ├── gardenMap/
│   │   ├── GardenCanvas.jsx    # Core Konva Stage + zoom/pan/grid
│   │   ├── GardenBoundary.jsx  # Renders the garden outline shape
│   │   ├── BedShape.jsx        # Single bed on canvas (drag, resize, rotate)
│   │   ├── PlantIcon.jsx       # Single plant icon within a bed
│   │   ├── HoverCard.jsx       # Floating info card (pure React, positioned over canvas)
│   │   ├── LayerControls.jsx   # Toggle buttons for layer visibility
│   │   ├── BedSidebar.jsx      # Side panel: bed list, drag-to-add, bed properties
│   │   ├── GardenSetup.jsx     # First-time setup wizard (name, dimensions, shape)
│   │   └── PlantPlacement.jsx  # Zoomed-in bed view for placing plants
│   └── dashboard/
│       └── DashboardMapView.jsx # Read-only map view for the Dashboard toggle
```

---

## Implementation Phases

### Phase 1 — Garden Canvas & Bed Layout Editor

**Goal:** Users can create a garden, define its dimensions, and drag beds into position. This is the spatial foundation everything else builds on.

#### 1A. Garden Setup Flow (`GardenSetup.jsx`)

Shown when the user navigates to the Garden tab and has no garden yet.

- **Step 1:** Enter garden name, width (ft), and height (ft)
- **Step 2:** Choose shape — rectangle (default), L-shape, or freehand polygon
  - Rectangle: done, boundary is computed from dimensions
  - L-shape: show a simple L-shape editor where the user adjusts the two rectangles that form the L (drag corner handles)
  - Custom: click-to-place vertices on a grid, close the polygon
- **Step 3:** Preview on canvas → "Create Garden" button

Implementation details:
- Store `boundary_points` as a JSONB array of `{x: number, y: number}` in feet
- For rectangles, compute from `width_ft` / `height_ft` (no need to store points)
- The setup flow is a modal or full-page overlay, not a separate route

#### 1B. Core Canvas (`GardenCanvas.jsx`)

The heart of the feature. A Konva `Stage` that renders the garden.

- **Coordinate system:** 1 foot = N pixels (computed from canvas size and garden dimensions to fit the viewport). Store a `scale` factor and expose zoom controls.
- **Zoom:** Mouse wheel / pinch gesture. Clamp between 0.25x and 4x. Show current zoom level.
- **Pan:** Click-and-drag on empty space (not on a bed). Touch: two-finger pan.
- **Grid:** Optional snap grid rendered as faint lines at `grid_spacing_ft` intervals (default 1ft). Toggle-able.
- **Garden boundary:** Rendered as the outermost shape (green fill for grass, darker stroke for border). Everything outside is a muted/clipped area.

Konva layer structure (bottom to top):
```
Layer 0 — Background (garden fill, grid lines)
Layer 1 — Beds (rectangles/shapes, draggable)
Layer 2 — Plants (icons inside beds)
Layer 3 — Overlays (status colors, task indicators, date labels, spacing circles)
Layer 4 — Interaction (selection outlines, resize handles, drag ghosts)
```

#### 1C. Bed Sidebar (`BedSidebar.jsx`)

A side panel (desktop) or bottom drawer (mobile) that appears alongside the canvas in the Garden tab.

**"Your Beds" tab:**
- Lists all beds owned by the user (fetched from Supabase)
- Beds already placed in the garden show a checkmark and their position
- Beds NOT yet placed show a "drag to add" affordance or an "Add to Garden" button
- Clicking a placed bed selects it on the canvas and scrolls/zooms to it

**"Add Bed" button:**
- Opens the existing bed creation modal (reuse the form from `BedsSeasons.jsx`) with two additional fields: `width_ft` and `height_ft`
- After creation, the new bed appears in the sidebar ready to be placed

**"Bed Properties" panel (shown when a bed is selected on canvas):**
- Edit name, dimensions, position (x, y), rotation
- Fields update the canvas in real-time (controlled inputs)
- "Remove from Garden" button (keeps the bed in the DB, just nulls out `garden_id`, `x`, `y`)
- "Delete Bed" button (deletes from DB entirely)

#### 1D. Bed Interaction on Canvas (`BedShape.jsx`)

Each bed is a Konva `Group` containing:
- A `Rect` (or `Line` for custom shapes) with fill color based on bed type
- A `Text` label showing the bed name (auto-sized, centered)
- Resize handles at corners and edges (small squares, visible when selected)

Interactions:
- **Drag:** Move beds freely within garden boundary. Snap to grid if enabled. Constrain to garden bounds (prevent dragging outside).
- **Resize:** Drag corner/edge handles. Updates `width_ft` / `height_ft` in real-time. Minimum size: 1ft x 1ft.
- **Rotate:** A rotation handle above the bed (small circle connected by a line). Drag to rotate freely, snap to 15° increments if grid snap is on.
- **Select:** Click to select. Selected bed shows handles and the properties panel. Click empty space to deselect.
- **Multi-select:** Shift+click or lasso select for group move (stretch goal, not Phase 1).

Auto-save: Debounce position/dimension changes and save to Supabase every 500ms after the last change. Show a subtle "Saving..." / "Saved" indicator.

#### 1E. Bed Colors by Type

Use the existing `type` field on beds to assign default fill colors:
```
raised_bed   → warm wood brown (#A0845C)
in_ground    → dark soil (#6B5B4E)
container    → terracotta (#C67B4B)
seed_tray    → light gray (#B8B8B8)
greenhouse   → translucent green (#8DB58040)
other        → medium gray (#9CA3AF)
```

These are defaults — a future enhancement could let users pick custom colors per bed.

---

### Phase 2 — Plants on the Map

**Goal:** Show what's planted where. Hover for info, click for quick actions.

#### 2A. Plant Icons (`PlantIcon.jsx`)

Each planting in a bed is rendered as a small icon on the canvas inside its bed.

**Icon strategy (in order of preference):**
1. **Emoji rendered as Konva `Text`** — simplest, no asset management. Use category-based emoji:
   - vegetable: 🥬, herb: 🌿, flower: 🌸, fruit: 🍓
   - Override with specific emoji per plant name where it makes sense (🍅 for tomato, 🌽 for corn, 🥕 for carrot, etc.)
2. **Future:** Custom SVG icons loaded via `use-image`. But emoji-first gets us shipping faster.

**Layout within a bed:**
- If planting has `position_x` / `position_y` → render at that exact position
- If no position → auto-layout in a grid pattern within the bed bounds, evenly spaced
- Auto-layout recalculates when bed is resized or plantings change
- Show plant name as a small label below the icon (toggleable via layers)

#### 2B. Hover Card (`HoverCard.jsx`)

When the user hovers over (desktop) or long-presses (mobile) a plant icon or bed:

- A floating card appears, rendered as a **React `div` positioned absolutely over the canvas** (not inside Konva — this gives us full CSS styling, links, buttons)
- Position is calculated from the Konva node's screen coordinates

**Card content for a planting:**
```
┌──────────────────────────────┐
│ 🍅 Tomato — Cherokee Purple  │
│ Bed: Raised Bed 1            │
│ Status: Growing 🌿           │
│ Planted: Mar 15              │
│                              │
│ [View Planting] [Add Task]   │
│ [Log Harvest]  [Plant Info]  │
└──────────────────────────────┘
```

**Card content for a bed:**
```
┌──────────────────────────────┐
│ 🪵 Raised Bed 1  (4×8 ft)   │
│ 5 plantings this season      │
│                              │
│ [View Bed] [Add Planting]    │
└──────────────────────────────┘
```

The action buttons use the existing `setPage()` navigation pattern from `App.jsx` — they navigate to the relevant page with a filter/selection parameter. This requires a small addition to the routing system (see Phase 2D).

#### 2C. Fetching Plant Data for the Map

Create a single efficient query that loads everything the map needs:

```js
// In Garden.jsx or a custom hook useGardenMapData(userId, gardenId)
const { data } = await supabase
  .from('beds')
  .select(`
    *,
    plantings (
      id, status, custom_name, position_x, position_y,
      date_seeded, date_transplanted, date_first_harvest,
      plants ( name, variety, category, family_id ),
      tasks ( id, title, task_type, due_date, completed_at )
    )
  `)
  .eq('garden_id', gardenId)
  .eq('user_id', userId)
```

This gives us beds → plantings → plant details → tasks in one round trip. Filter to current season on the client or via an additional `.eq('plantings.season_id', currentSeasonId)`.

#### 2D. Navigation Integration

Currently, `App.jsx` uses a simple `page` state string for routing. For hover card actions to work (e.g., "View Planting" should navigate to the Plantings page with that planting selected), add lightweight parameter passing:

```jsx
// In App.jsx, extend the page state:
const [page, setPage] = useState('dashboard')
const [pageParams, setPageParams] = useState({})

function navigate(pageId, params = {}) {
  setPage(pageId)
  setPageParams(params)
}

// Pass to pages:
case 'plantings': return <Plantings user={user} params={pageParams} />
```

Then the hover card can call `navigate('plantings', { highlightId: planting.id })` and the Plantings page can scroll to / highlight that row.

---

### Phase 3 — Information Layers

**Goal:** Toggleable overlays that add context to the map without cluttering the base view.

#### 3A. Layer Controls (`LayerControls.jsx`)

A horizontal bar of toggle chips rendered above the canvas:

```
[🌱 Plants ✓] [📊 Status] [✅ Tasks] [📏 Spacing] [📅 Dates] [🔲 Grid ✓]
```

Each chip toggles a Konva `Layer`'s `visible` property. Active chips are filled, inactive are outlined. Plants and Grid are on by default.

#### 3B. Layer Definitions

**Plants Layer** (default ON):
- Plant icons and name labels within beds
- Controlled by `plantsLayerRef.current.visible()`

**Status Layer:**
- Semi-transparent color overlay on each bed based on the "worst" status of its plantings:
  - All harvested → gold tint
  - Any growing → green tint
  - Any seeded/transplanted → blue tint
  - Any planned → gray tint
  - Any failed → red tint
- Additionally, individual plant icons get a colored ring matching their status

**Tasks Layer:**
- Shows a badge on each bed indicating the number of pending tasks
- Overdue tasks show a red badge; upcoming tasks show an amber badge
- Small task-type icons (💧🪴✂️) appear near the relevant planting if the planting has a position

**Spacing Layer:**
- Draws a translucent circle around each plant representing its recommended spacing
  - Spacing data comes from the `plants` table (we may need to add a `spacing_inches` column, or derive from `days_to_harvest` / category heuristics as a v1)
  - Overlapping circles highlight in red/orange to indicate overcrowding
- Shows the bed's total capacity vs. current plant count as a label

**Dates Layer:**
- Shows key dates near each planting icon:
  - `date_seeded` with 🫘 icon
  - `date_transplanted` with 🌱 icon
  - `date_first_harvest` with 🧺 icon
- Dates formatted as "Mar 15" (short month + day)

**Grid Layer** (default ON):
- Faint lines at the configured `grid_spacing_ft` interval
- Helps with alignment and spatial reasoning

---

### Phase 4 — Dashboard Integration

**Goal:** The Dashboard gets a toggle to show the map in a read-only (or light-interaction) mode.

#### 4A. Dashboard Map View Toggle

Add a toggle button group to the Dashboard header area:

```
[📋 List View] [🗺️ Map View]
```

- **List View** = the current Dashboard (stats, tasks, harvests, recent plantings) — this remains the default
- **Map View** = a read-only rendering of the garden map with hover cards enabled

The toggle state can be stored in `localStorage` so it persists between sessions.

#### 4B. `DashboardMapView.jsx`

A simplified version of the garden map:
- Renders the canvas with beds and plants (read-only — no drag/resize)
- Hover cards work and link to other pages
- Layer toggles are available
- A "Edit Garden" button links to the full Garden tab
- If no garden exists yet, show a friendly empty state: "Set up your garden map to see an overhead view! → Go to Garden tab"

This component reuses `GardenCanvas`, `BedShape`, `PlantIcon`, `HoverCard`, and `LayerControls` — just with drag/resize disabled via a `readOnly` prop.

---

## Navigation Changes in `App.jsx`

Add the Garden tab to the navigation:

```js
// In the NAV array, insert after 'beds':
{ id: 'garden', label: 'Garden Map', icon: '🗺️', section: 'Setup' },
```

Add to the mobile bottom nav (replace one of the existing 4 or add it to the "More" sheet):
```js
// Option A: Replace 'Home' with 'Garden' in bottom nav (map IS the home)
// Option B: Keep current bottom nav and put Garden in the "More" sheet
// Recommendation: Put it in bottom nav as the first item, since it's the new star feature
const BOTTOM_NAV = [
  { id: 'garden',    label: 'Garden',  icon: '🗺️' },
  { id: 'plantings', label: 'Plants',  icon: '🌱' },
  { id: 'tasks',     label: 'Tasks',   icon: '✅' },
  { id: 'issues',    label: 'Issues',  icon: '🐛' },
]
```

Add the route in `renderPage()`:
```js
case 'garden': return <Garden user={user} navigate={navigate} />
```

---

## Mobile Considerations

The map must work well on phones. Key adaptations:

- **Touch gestures:** Pinch-to-zoom, two-finger pan (Konva handles this natively with `Stage` `draggable` and `onTouchMove`)
- **Bed sidebar** becomes a bottom drawer that slides up, showing the bed list and properties
- **Hover cards** activate on long-press instead of hover (detect `onTouchStart` with a 300ms timer)
- **Bed editing:** Tap to select, double-tap to open properties. Drag to move (after selection). Resize handles need to be larger on touch (minimum 44x44px tap target)
- **Layer controls** scroll horizontally if they overflow the screen width
- **Canvas sizing:** Fill the available viewport height minus the header and bottom nav. Use `ResizeObserver` to adapt to orientation changes.

---

## State Management

No new state management library is needed. Use React hooks:

- `useGardenMap(userId)` — custom hook that loads garden + beds + plantings and provides CRUD operations
- Canvas interaction state (selected bed, zoom level, pan offset, active layers) lives in `Garden.jsx` via `useState` / `useReducer`
- Debounced saves via `useRef` + `setTimeout` pattern for position/dimension changes

---

## Performance Notes

- **Initial load:** One Supabase query for beds+plantings (see Phase 2C). Garden boundary is a separate lightweight query. Total: 2 queries.
- **Canvas rendering:** Konva is highly optimized for 2D canvas. A garden with 20 beds and 100+ plantings will render at 60fps easily.
- **Save debouncing:** Batch position/dimension updates with a 500ms debounce to avoid excessive Supabase writes during drag operations.
- **Image caching:** If we move to SVG plant icons later, `use-image` caches them after first load.

---

## Future Enhancements (Not in Scope Now, but Enabled by This Architecture)

These are all unlocked by having spatial data on beds and plantings:

- **Sunlight tracking:** Add `sun_hours` per bed or per garden region. Show a heatmap overlay.
- **Companion planting:** Highlight good/bad plant neighbors based on proximity.
- **Planting density advisor:** Compare actual vs. recommended spacing and suggest thinning.
- **Irrigation zones:** Group beds into watering zones, show which zones need attention.
- **Season timelapse:** Animate the garden map across the season to see planting progression.
- **Garden templates:** Share/import garden layouts.
- **Print view:** Generate a clean PDF of the garden map for posting in the shed.
- **Raised bed construction plans:** From dimensions, generate cut lists and material estimates.
- **3D view:** Konva is 2D, but the spatial data could feed a Three.js renderer later.

---

## Implementation Order (Suggested for Claude Code Sessions)

Each of these is a natural session boundary — complete one before starting the next.

1. **Database migration** — Create the `gardens` table, alter `beds` and `plantings`. Apply via Supabase MCP.
2. **Garden Setup + Empty Canvas** — `GardenSetup.jsx`, `GardenCanvas.jsx`, `GardenBoundary.jsx`. Get a garden created and a zoomable/pannable canvas rendering.
3. **Bed Sidebar + Drag-to-Place** — `BedSidebar.jsx`, `BedShape.jsx`. Drag existing beds onto the canvas, save positions. Update the bed creation form to include `width_ft` / `height_ft`.
4. **Bed Interaction** — Resize handles, rotation, snap-to-grid, selection, auto-save.
5. **Plant Icons + Hover Cards** — `PlantIcon.jsx`, `HoverCard.jsx`. Render plantings in beds, show info on hover.
6. **Navigation integration** — Add Garden tab to `App.jsx`, wire up hover card action buttons to navigate.
7. **Information Layers** — `LayerControls.jsx` + all layer overlays (status, tasks, spacing, dates).
8. **Dashboard Map View** — `DashboardMapView.jsx`, list/map toggle on Dashboard.
9. **Mobile polish** — Touch gesture tuning, bottom drawer sidebar, long-press hover cards, responsive sizing.
10. **QA pass** — Test with real data, verify save/load round-trips, performance check, edge cases (empty garden, beds with no plantings, plantings with no position, etc.).
