# 🌱 Rootsicle — Garden Tracker

A full-featured garden management app that replaces spreadsheets with an interactive visual planner. Track plantings, manage tasks, visualize your garden layout on a drag-and-drop canvas, and catch crop rotation conflicts automatically.

Built for home gardeners who want a single place to answer: *What did I plant, where, when — and what do I need to do today?*

**Live at:** [garden-tracker.vercel.app](https://garden-tracker-rexeven7s-projects.vercel.app)

---

## Features

### Interactive Garden Map
A 2D canvas (powered by [Konva](https://konvajs.org/)) where you lay out your garden to scale. Drag beds into position, resize with handles, and toggle informational layers on and off:

- **Plants** 🌱 — emoji icons for each planting, auto-laid out or manually positioned
- **Status** 📊 — color-coded bed overlays showing planting health at a glance
- **Tasks** ✅ — red/yellow badges on beds with overdue or pending tasks
- **Spacing** 📏 — faint circles showing each plant's spacing radius
- **Dates** 📅 — seeded, transplanted, and harvest date labels
- **Grid** 🔲 — configurable snap grid (0.5–5 ft)

Hover over any bed or plant to get a quick-info card with details and action buttons. A first-time setup wizard walks you through creating your garden dimensions and shape (rectangle, L-shape, or custom polygon).

### Dashboard
The landing page answers "what do I need to do today?" without any clicks. At a glance you get stat cards (beds, active plantings, weekly tasks, harvests), a task list grouped by urgency, a season harvest summary with taste ratings, a weather widget (via Open-Meteo), and recent plantings.

### Plantings
The core log of what's in the ground each season. Add from your plant library or enter a custom name, assign to a bed and season, then track through the full lifecycle: planned → seeded → transplanted → growing → harvested (or failed). Log harvests with quantity, notes, and a 1–5 taste rating.

### Crop Rotation
A grid of beds × years that automatically warns you (⚠️) when the same plant family appears in the same bed in consecutive years. Includes rotation suggestions for empty cells and a reference guide for plant family groupings.

### Tasks
Eight task types (water, fertilize, thin, prune, treat, harvest, transplant, other) with emoji indicators. Tasks auto-group by urgency — overdue, today, upcoming — and can be linked to specific plantings for context. Complete them with one click from the dashboard or tasks page.

### Plant Library
A reference catalog pre-loaded with 40 common vegetable varieties organized by plant family. Each entry includes variety, sow timing, days to harvest, seed quantity, and notes. One-click spreadsheet import to get started instantly.

### Pest & Issues
Log problems (pest, disease, environmental, other), link them to specific plantings, and track resolution.

### Beds & Seasons
Define your garden beds with dimensions and location notes. Set annual frost dates per season (spring/fall start and end) to enable multi-year rotation history and timing calculations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Canvas | react-konva + Konva |
| Routing | react-router-dom 6 |
| Database & Auth | Supabase (Postgres + Row-Level Security) |
| Hosting | Vercel (free tier) |
| Styling | Custom CSS with design tokens (no UI framework) |
| Fonts | Nunito (display) + Lato (body) |

Total hosting cost: **$0/month** on Supabase + Vercel free tiers.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A free [Supabase](https://supabase.com) account
- (Optional) A free [Vercel](https://vercel.com) account for deployment

### 1. Clone the repo

```bash
git clone https://github.com/rexeven7/garden-tracker.git
cd garden-tracker
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** and run the contents of `supabase/schema.sql` — this creates all tables, RLS policies, and seed data
3. Go to **Settings → API** and copy your **Project URL** and **anon public key**

### 3. Configure environment

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

### 4. Run locally

```bash
npm start
```

The app starts on [http://localhost:5173](http://localhost:5173).

### 5. Deploy to Vercel

See [DEPLOY.md](DEPLOY.md) for a full walkthrough — it takes about 20 minutes and costs nothing. The short version:

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Set the framework preset to **Vite**
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables
5. Deploy — Vercel auto-redeploys on every push to `main`

---

## First-Run Setup

After signing up in the app, follow this order to get the most out of every feature:

### Step 1 — Seasons
Go to **Seasons** in the sidebar and add the current year. Enter your local frost dates (spring and fall start/end). This unlocks rotation history and helps with planting timing.

### Step 2 — Beds & Areas
Go to **Beds & Areas** and add each of your garden beds by name. Include dimensions (width × height in feet) — these are used to render beds on the garden map to scale.

### Step 3 — Garden Map
Open the **Garden Map**. If this is your first visit, a setup wizard will walk you through entering your garden's overall dimensions and shape. Once created, use the bed sidebar to place your beds onto the canvas. Toggle **Edit Layout** to drag and resize them into position.

### Step 4 — Plant Library
Go to **Plant Library** and click **"Import from Spreadsheet"** to load all 40 pre-configured plant varieties (tomatoes, peppers, squash, herbs, and more). You can also add your own entries manually.

### Step 5 — Plantings
Head to **Plantings** and start logging what you've planted this season. Select a plant from your library (or enter a custom name), assign it to a bed and season, set the status, and enter any dates you know. The dashboard, garden map, and rotation board all pull from this data.

### Step 6 — Tasks
Add tasks from the **Tasks** page or use the quick-add button (📋) on any planting row. Tasks appear on your dashboard grouped by urgency so nothing slips through the cracks.

---

## Project Structure

```
garden-tracker/
├── src/
│   ├── pages/              # Top-level page components
│   │   ├── Dashboard.jsx   # Stats, tasks, weather, recent plantings
│   │   ├── Garden.jsx      # Interactive garden map (Konva canvas)
│   │   ├── Plantings.jsx   # Planting log & status management
│   │   ├── Rotation.jsx    # Crop rotation grid
│   │   ├── Tasks.jsx       # Task manager
│   │   ├── PlantLibrary.jsx
│   │   ├── BedsSeasons.jsx
│   │   ├── Issues.jsx
│   │   └── AuthPage.jsx
│   ├── components/
│   │   ├── gardenMap/      # Konva canvas components
│   │   │   ├── GardenCanvas.jsx
│   │   │   ├── BedShape.jsx
│   │   │   ├── BedSidebar.jsx
│   │   │   ├── HoverCard.jsx
│   │   │   ├── LayerControls.jsx
│   │   │   ├── PlantIcon.jsx
│   │   │   ├── GardenBoundary.jsx
│   │   │   └── GardenSetup.jsx
│   │   ├── DashboardMapView.jsx
│   │   └── WeatherWidget.jsx
│   ├── lib/
│   │   └── supabase.js     # Supabase client + seed plant data
│   ├── App.jsx             # Shell, routing, sidebar nav
│   ├── index.jsx           # Entry point
│   └── index.css           # All styles (CSS custom properties)
├── supabase/
│   └── schema.sql          # Full Postgres schema + RLS policies
├── docs/                   # Feature documentation
├── public/                 # Static assets & favicons
├── vite.config.js
├── vercel.json
└── DEPLOY.md               # Step-by-step deployment guide
```

---

## Documentation

- **[DEPLOY.md](DEPLOY.md)** — Full deployment walkthrough (Supabase → GitHub → Vercel) in ~20 minutes
- **[docs/garden-tracker-docs.md](docs/garden-tracker-docs.md)** — Complete feature documentation, data model, architecture, and changelog

---

## Screenshots

<!-- Add screenshots here -->
<!-- ![Dashboard](docs/screenshots/dashboard.png) -->
<!-- ![Garden Map](docs/screenshots/garden-map.png) -->
<!-- ![Plantings](docs/screenshots/plantings.png) -->
<!-- ![Crop Rotation](docs/screenshots/rotation.png) -->

*Screenshots coming soon — contributions welcome!*

---

## Contributing

This is a personal project, but if you'd like to use it for your own garden:

1. Fork the repo
2. Set up your own Supabase project and run `schema.sql`
3. Deploy to Vercel with your own environment variables
4. Customize the seed plant data in `src/lib/supabase.js` to match your garden

Bug reports and feature suggestions are welcome via [Issues](https://github.com/rexeven7/garden-tracker/issues).

---

## License

This project is open source. Feel free to fork and adapt for your own garden.

---

Built with 🌿 by a gardener who got tired of spreadsheets.
