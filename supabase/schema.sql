-- ============================================================
-- GARDEN TRACKER - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- ============================================================
-- PLANT FAMILIES (for rotation tracking)
-- ============================================================
create table plant_families (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  rotation_notes text,
  color text default '#6B7280', -- hex color for UI
  created_at timestamptz default now()
);

-- ============================================================
-- PLANT LIBRARY (reference catalog)
-- ============================================================
create table plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  variety text,
  family_id uuid references plant_families(id),
  category text, -- vegetable, herb, flower, fruit
  sow_indoors_timing text,       -- e.g. "4-6 WEEKS before frost"
  direct_sow_timing text,        -- e.g. "1-2 weeks after frost"
  days_to_harvest text,          -- e.g. "65" or "63-80"
  in_ground_start text,          -- e.g. "May 1st"
  in_ground_end text,
  seed_quantity text,
  notes text,
  info text,
  created_at timestamptz default now()
);

-- ============================================================
-- GARDEN BEDS / AREAS
-- ============================================================
create table beds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  size_sqft numeric,
  location_notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- SEASONS
-- ============================================================
create table seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  year integer not null,
  spring_frost_start date,
  spring_frost_end date,
  fall_frost_start date,
  fall_frost_end date,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, year)
);

-- ============================================================
-- PLANTINGS (what's actually in the ground each season)
-- ============================================================
create table plantings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  season_id uuid references seasons(id) on delete cascade,
  plant_id uuid references plants(id),
  bed_id uuid references beds(id),
  -- Custom override fields (if not using library plant)
  custom_name text,
  custom_family_id uuid references plant_families(id),
  -- Timeline
  date_seeded date,
  date_transplanted date,
  date_first_harvest date,
  date_last_harvest date,
  -- Status
  status text default 'planned' check (status in ('planned','seeded','transplanted','growing','harvested','failed')),
  -- Harvest log
  harvest_notes text,
  harvest_quantity text,
  -- General
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- TASKS
-- ============================================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  planting_id uuid references plantings(id) on delete cascade,
  title text not null,
  task_type text check (task_type in ('water','fertilize','thin','prune','treat','harvest','transplant','other')),
  due_date date,
  completed_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table plants enable row level security;
alter table beds enable row level security;
alter table seasons enable row level security;
alter table plantings enable row level security;
alter table tasks enable row level security;
alter table plant_families enable row level security;

-- Plant families are readable by all authenticated users
create policy "plant_families_read" on plant_families for select to authenticated using (true);

-- Users can only see/edit their own data
create policy "plants_user" on plants for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "beds_user" on beds for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "seasons_user" on seasons for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "plantings_user" on plantings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tasks_user" on tasks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- SEED DATA: Plant Families
-- ============================================================
insert into plant_families (name, description, rotation_notes, color) values
('Nightshades (Solanaceae)', 'Tomatoes, peppers, potatoes, eggplant', 'Heavy feeders. Do not follow with other nightshades. Susceptible to blight. Rest bed 3+ years between plantings.', '#DC2626'),
('Brassicas (Cruciferae)', 'Kale, collards, bok choy, cabbage, broccoli', 'Heavy feeders on nitrogen. Follow with legumes to restore soil. Avoid planting after other brassicas.', '#16A34A'),
('Legumes (Fabaceae)', 'Beans, peas', 'Nitrogen fixers — great before heavy feeders. Do not follow themselves.', '#2563EB'),
('Cucurbits (Cucurbitaceae)', 'Squash, zucchini, cucumber, melon, pumpkin', 'Heavy feeders. Prone to powdery mildew. Rotate every year.', '#D97706'),
('Alliums (Amaryllidaceae)', 'Onions, garlic, leeks', 'Light feeders. Good after heavy feeders. Inhibit beans/peas nearby.', '#7C3AED'),
('Umbellifers (Apiaceae)', 'Carrots, parsnip, dill', 'Light feeders. Good rotation crop.', '#0891B2'),
('Asteraceae', 'Lettuce, sunflower, zinnia', 'Light feeders. Good gap fillers and companion plants.', '#65A30D'),
('Corn (Poaceae)', 'Corn', 'Heavy feeder on nitrogen. Plant after legumes.', '#CA8A04'),
('Other / Flower', 'Morning glory, catnip and other non-vegetable plants', 'No specific rotation constraints.', '#9CA3AF');

-- ============================================================
-- SEED DATA: Plants from her spreadsheet
-- ============================================================
-- (Run after you have plant_families inserted and know the IDs)
-- This will be handled by the app's seed script
