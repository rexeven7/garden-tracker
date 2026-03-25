# 🌿 Garden Tracker

Application documentation · Version 1.1 · 2026

+-----------------------------------------------------------------------+
| **What this app does**                                                |
|                                                                       |
| A simple, purpose-built web app that replaces the multiple Excel      |
| spreadsheets previously used to track a vegetable garden. It logs     |
| what was planted, where, and when --- and surfaces upcoming tasks on  |
| a clean dashboard. A crop rotation board tracks plant families across |
| beds and years, catching repeat-family conflicts automatically.       |
+-----------------------------------------------------------------------+

  ----------------------- ----------------------- -----------------------
  **Frontend**            **Database & Auth**     **Hosting**

  React 18                Supabase (Postgres +    Vercel
                          RLS)

  Vite 5                  Row-level security per  Free hobby tier
                          user

  react-router-dom        Email auth (magic link) Auto-deploy from GitHub

  date-fns                Free tier (~500MB)      $0 / month total

  Custom CSS (no UI
  framework)
  ----------------------- ----------------------- -----------------------

## 1. Overview

### 1.1 Purpose

Garden Tracker was built to replace a collection of Excel spreadsheets
used to manage a home vegetable garden. The spreadsheets tracked plants,
planting dates, and timing but were difficult to maintain and offered no
task management or rotation history. This app consolidates everything
into a single, easy-to-use browser application.

### 1.2 Primary Users

A single household. The app uses Supabase email auth so multiple family
members can share one account or each have their own.

### 1.3 Design Principles

- Simple first --- every screen should be immediately usable without
  training

- Data from her spreadsheet imported automatically on first launch

- Tasks visible on the dashboard without navigating anywhere

- Rotation warnings are automatic --- no manual checking required

- Free to host indefinitely on Vercel + Supabase free tiers

## 2. Features

### 2.1 Dashboard

The landing page after login. Designed to answer "what do I need to do
today?" without any clicks.

  ------------------ ----------------------------------------------------
  **Element**        **Description**

  Stats row          4 cards: Beds & Areas · Active Plantings · Tasks
                     This Week · Harvested

  Upcoming Tasks     All tasks due within 7 days, sorted by date. Overdue
                     shown in red, today in amber. One-click checkbox to
                     mark complete.

  Recent Plantings   Last 5 plantings added, with status badge, bed name,
                     and date.
  ------------------ ----------------------------------------------------

### 2.2 Plantings

The core log of what is actually in the ground each season.

  ------------------ ----------------------------------------------------
  **Feature**        **Detail**

  Add planting       Choose from the plant library or enter a custom
                     name. Assign to a bed, season, and plant family (for
                     rotation).

  Timeline fields    Date seeded · Date transplanted · First harvest date
                     · Last harvest date

  Quick status       Inline dropdown on every row: Planned → Seeded →
                     Transplanted → Growing → Harvested → Failed

  Task shortcut      📋 button on each row opens Add Task pre-linked to
                     that planting

  Filters            Filter by status and/or bed. Live count shown.

  Harvest log        Harvest quantity and notes fields on each planting
                     record.
  ------------------ ----------------------------------------------------

### 2.3 Tasks

A dedicated task manager linked to plantings.

  ------------------ ----------------------------------------------------
  **Feature**        **Detail**

  Task types         💧 Water · 🌿 Fertilize · ✂️ Thin · 🪴 Prune · 🧪
                     Treat · 🧺 Harvest · 🌱 Transplant · 📋 Other

  Grouping           Tasks automatically sorted into: Overdue (red) ·
                     Today (amber) · Upcoming (green)

  Completion         Checkbox marks done with timestamp. Toggle "Show
                     completed" to view history.

  Linking            Each task can be linked to a specific planting for
                     context.

  Dashboard mirror   Tasks due this week appear on the dashboard
                     automatically --- no separate visit needed.
  ------------------ ----------------------------------------------------

### 2.4 Crop Rotation

A visual grid showing which plant families have been grown in each bed
across multiple seasons.

  ------------------ ----------------------------------------------------
  **Feature**        **Detail**

  Grid layout        Rows = beds, Columns = seasons (years). Each cell
                     shows what was planted and its family color chip.

  Conflict detection Automatic ⚠️ warning when the same plant family
                     appears in the same bed in consecutive years.

  Rotation hints     Empty cells show a suggested follow-up family based
                     on what was grown the prior year (e.g. "Follow
                     with: Legumes").

  Year selector      Checkboxes to show/hide individual years. Defaults
                     to the most recent 4.

  Rotation guide     Reference panel below the grid explaining what grows
                     well after each plant family and why.
  ------------------ ----------------------------------------------------

Plant families tracked for rotation:

  --------------------- --------------------- ----------------------------
  **Family**            **Examples**          **Rotation note**

  Nightshades           Tomato, pepper,       Rest 3+ years. Follow with
  (Solanaceae)          potato                Brassicas or Legumes.

  Brassicas             Kale, bok choy,       Heavy N feeder. Follow with
  (Cruciferae)          collards              Legumes.

  Legumes (Fabaceae)    Beans, peas           Nitrogen fixer. Great before
                                              heavy feeders.

  Cucurbits             Squash, cucumber,     Heavy feeder. Rotate every
  (Cucurbitaceae)       melon                 year.

  Alliums               Onion, garlic         Light feeder. Avoid near
  (Amaryllidaceae)                            beans/peas.

  Umbellifers           Carrot                Light feeder. Good rotation
  (Apiaceae)                                  crop.

  Asteraceae            Lettuce, sunflower,   Light feeder. Good gap
                        zinnia                filler.

  Corn (Poaceae)        Corn                  Heavy N feeder. Plant after
                                              Legumes.
  --------------------- --------------------- ----------------------------

### 2.5 Plant Library

A reference catalog of all plants with timing and variety information.

- 40 plants pre-loaded from the existing spreadsheet via one-click
  import

- Fields: name, variety, plant family, category
  (vegetable/herb/flower/fruit)

- Timing: sow indoors, direct sow/transplant, in-ground start/end dates,
  days to harvest

- Seed quantity and freeform notes

- Search by name or variety. Filter by plant family.

- Add new plants or edit/delete any entry

### 2.6 Beds & Areas

Named locations in the garden. Used to assign plantings and power the
rotation grid.

- Name, description, size (sq ft), location notes

- Each planting is assigned to a bed --- drives rotation tracking across
  years

### 2.7 Seasons

Annual growing seasons with frost date records.

- Year · Spring frost start/end dates · Fall frost start/end dates ·
  Notes

- Her 2025 dates pre-populated as a reference: Spring April 18--30, Fall
  Oct 3--21

- Past seasons enable multi-year rotation history in the rotation grid

## 3. Data Model

All data is stored in Supabase (Postgres). Row-level security ensures
each user only sees their own data.

  ---------------- ------------------------------------------------------
  **Table**        **Key fields**

  plant_families   name, description, rotation_notes, color (hex). Global
                   --- shared across all users.

  plants           user_id, name, variety, family_id, category,
                   sow_indoors_timing, direct_sow_timing,
                   days_to_harvest, in_ground_start/end, seed_quantity,
                   notes

  beds             user_id, name, description, size_sqft, location_notes

  seasons          user_id, year (unique per user), spring/fall frost
                   start/end dates, notes

  plantings        user_id, season_id, plant_id (optional), bed_id,
                   custom_name, custom_family_id, date_seeded,
                   date_transplanted, date_first/last_harvest, status,
                   harvest_quantity, harvest_notes, notes

  tasks            user_id, planting_id (optional), title, task_type,
                   due_date, completed_at, notes
  ---------------- ------------------------------------------------------

### Planting Status States

  -------------- ---------------------------------------------------------
  **Status**     **Meaning**

  planned        Added but not yet started

  seeded         Seeds sown indoors or direct-sown

  transplanted   Moved from indoors to the garden bed

  growing        In the ground, actively growing

  harvested      Season complete

  failed         Did not survive --- logged for reference
  -------------- ---------------------------------------------------------

## 4. Architecture

### 4.1 File Structure

  ---------------------------- -------------------------------------------
  **Path**                     **Purpose**

  vite.config.js               Vite build config (React plugin)

  index.html                   App entry point (root level, Vite standard)

  src/lib/supabase.js          Supabase client + SEED_PLANTS array (her 40
                               spreadsheet plants)

  src/App.jsx                  Shell layout, sidebar nav, auth guard, page
                               routing

  src/index.css                All styles. CSS custom properties. No UI
                               framework dependency.

  src/pages/Dashboard.jsx      Stats, task list, recent plantings

  src/pages/Plantings.jsx      Planting CRUD, quick status, task shortcut

  src/pages/Tasks.jsx          Task management, grouped by urgency

  src/pages/Rotation.jsx       Rotation grid, conflict detection, rotation
                               guide

  src/pages/PlantLibrary.jsx   Plant catalog CRUD + one-click spreadsheet
                               import

  src/pages/BedsSeasons.jsx    Beds management + Seasons management (two
                               exports)

  src/pages/AuthPage.jsx       Login / signup form

  supabase/schema.sql          Full Postgres schema with RLS policies +
                               family seed data

  DEPLOY.md                    Step-by-step deploy guide (Supabase +
                               GitHub + Vercel)
  ---------------------------- -------------------------------------------

### 4.2 Auth Flow

1.  User opens the app URL

2.  Supabase session check on load --- if no session, AuthPage renders

3.  User signs up with email + password → Supabase sends confirmation
    email

4.  User clicks confirmation link → redirected back, now authenticated

5.  Session persists in localStorage --- stays logged in across visits

6.  Sign Out button clears session

### 4.3 Data Access Pattern

All database reads/writes go through the Supabase JS client directly
from the browser. There is no separate API server. Row-level security in
Postgres ensures users can only touch their own rows --- enforced at the
database level regardless of what the frontend sends.

### 4.4 Rotation Logic

The rotation conflict detection is calculated client-side in
Rotation.jsx:

1. For each bed + year combination, fetch all plantings in that season
2. For each planting, resolve the plant family (from plant library or
   `custom_family_id`)
3. Compare to the same bed's plantings in the prior year
4. If any family in year N matches a family in year N-1 per the
   `ROTATION_CONFLICTS` map, flag as conflict
5. Display ⚠️ warning and highlight the cell in amber

Rotation suggestions are generated by looking at the previous year's
families and returning the GOOD_FOLLOWS string for that family.

## 5. Setup & Deployment

Full step-by-step instructions are in DEPLOY.md inside the project.
Summary below.

### 5.1 Prerequisites

- Free Supabase account at supabase.com

- Free GitHub account

- Free Vercel account (sign up with GitHub)

- Node.js 18+ for local development (optional --- not needed just to
  deploy)

### 5.2 Deploy Steps

  -------- ------------------- ----------------------------------------------
  **#**    **Step**            **Detail**

  1        Create Supabase     supabase.com → New Project → run
           project             supabase/schema.sql in SQL Editor

  2        Copy API keys       Settings → API → copy Project URL and anon
                               public key

  3        Push to GitHub      git init → git add . → git commit → push to
                               new repo

  4        Import to Vercel    vercel.com → Add New Project → select repo

  5        Add env vars        VITE_SUPABASE_URL and
                               VITE_SUPABASE_ANON_KEY

  6        Deploy              Vercel builds automatically. Live URL in ~2
                               minutes. Output directory: dist/
  -------- ------------------- ----------------------------------------------

### 5.3 First-Run Setup Order

After first login, set up in this order to avoid broken references:

1. Seasons --- add 2026 (and past years for rotation history)
2. Beds & Areas --- add each raised bed by name
3. Plant Library → click "Import from Spreadsheet" to load all 40 plants
4. Plantings --- add her 2026 seedlings already started:

  ------------------------ ------------------- ---------------- ------------
  **Plant**                **Variety/Notes**   **Date Seeded**  **Status**

  Onions                   ---                 Feb 15, 2026     seeded

  Sweet Bell Peppers       ---                 Mar 16, 2026     seeded

  Tomatoes                 ---                 Mar 16, 2026     seeded

  Bunching Onions          ---                 Mar 23, 2026     seeded

  Potatoes                 ---                 Mar 23, 2026     seeded

  Sweet Peppers            From saved seed     Mar 23, 2026     seeded
  ------------------------ ------------------- ---------------- ------------

## 6. Future Enhancements

Not currently built. Ranked by likely usefulness:

  ------- ------------------- ------------------------------------------------
  **P**   **Feature**         **Description**

  1       Photo log           Attach photos to plantings --- document plant
                              health, pest damage, harvest size over time

  1       Harvest totals      Dashboard widget summing harvest quantity by
                              plant across the season

  2       Mobile PWA          Make it installable on phone for quick updates
                              while in the garden

  2       Recurring tasks     Set a task to repeat weekly (e.g. "Water
                              tomatoes every Monday")

  2       Frost date alerts   Banner on dashboard when frost is within 2 weeks
                              of the stored spring/fall dates

  3       Garden map          Visual drag-and-drop grid showing which plants
                              are in which bed positions

  3       Year-over-year      What grew, what failed, what yielded most ---
          report              printable end-of-season summary

  3       Companion planting  Warn when incompatible plants are assigned to
          hints               the same bed
  ------- ------------------- ------------------------------------------------

## 7. Known Limitations

- No offline support --- requires internet connection

- No email/push reminders --- tasks must be checked manually in the app

- Rotation history only works for seasons and plantings entered in the
  app --- not retroactively inferred from the spreadsheet

- No bulk import for plantings --- each planting must be added
  individually

- Mobile layout collapses sidebar --- works but is not optimized for
  phone use

## 8. Changelog

  ------------- ------------- ------------------------------------------------
  **Version**   **Date**      **Changes**

  1.1           March 2026    Migrated from Create React App to Vite 5.
                              Renamed env vars from REACT_APP_* to VITE_*.
                              Removed react-scripts dependency.

  1.0           March 2026    Initial release. All 7 pages. 40 plants
                              imported. Full rotation grid with conflict
                              detection. Supabase + Vercel deploy.
  ------------- ------------- ------------------------------------------------

------------------------------------------------------------------------

Garden Tracker v1.1 · Built March 2026 · Powered by React + Vite + Supabase +
Vercel