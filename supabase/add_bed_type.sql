-- Run this in your Supabase SQL Editor to add bed types
alter table beds
  add column if not exists type text default 'raised_bed'
  check (type in ('raised_bed', 'in_ground', 'container', 'seed_tray', 'greenhouse', 'other'));
