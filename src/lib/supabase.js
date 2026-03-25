import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Default care frequencies by plant family ──────────────────
// water_frequency_days: how often to water (days)
// fertilize_frequency_weeks: how often to fertilize (weeks)
export const FAMILY_CARE_DEFAULTS = {
  'Nightshades (Solanaceae)':   { water_frequency_days: 3, fertilize_frequency_weeks: 2 },
  'Brassicas (Cruciferae)':     { water_frequency_days: 4, fertilize_frequency_weeks: 3 },
  'Legumes (Fabaceae)':         { water_frequency_days: 4, fertilize_frequency_weeks: 4 },
  'Cucurbits (Cucurbitaceae)':  { water_frequency_days: 3, fertilize_frequency_weeks: 2 },
  'Alliums (Amaryllidaceae)':   { water_frequency_days: 5, fertilize_frequency_weeks: 3 },
  'Umbellifers (Apiaceae)':     { water_frequency_days: 3, fertilize_frequency_weeks: 4 },
  'Asteraceae':                 { water_frequency_days: 2, fertilize_frequency_weeks: 3 },
  'Corn (Poaceae)':             { water_frequency_days: 4, fertilize_frequency_weeks: 2 },
  'Other / Flower':             { water_frequency_days: 3, fertilize_frequency_weeks: 3 },
}

// Per-plant overrides where the family default doesn't apply well
const PLANT_CARE_OVERRIDES = {
  'Potato':       { water_frequency_days: 4, fertilize_frequency_weeks: 3 },
  'Garlic':       { water_frequency_days: 7, fertilize_frequency_weeks: 4 }, // cure-style, mostly dry
  'Watermelon':   { water_frequency_days: 4, fertilize_frequency_weeks: 2 },
  'Pumpkin':      { water_frequency_days: 4, fertilize_frequency_weeks: 2 },
  'Carrot':       { water_frequency_days: 3, fertilize_frequency_weeks: 4 }, // N causes forking
  'Parsnip':      { water_frequency_days: 3, fertilize_frequency_weeks: 4 },
  'Basil':        { water_frequency_days: 2, fertilize_frequency_weeks: 4 }, // don't over-fertilize herbs
  'Mint':         { water_frequency_days: 2, fertilize_frequency_weeks: 4 },
  'Dill':         { water_frequency_days: 3, fertilize_frequency_weeks: 4 },
  'Parsley':      { water_frequency_days: 3, fertilize_frequency_weeks: 4 },
  'Cilantro':     { water_frequency_days: 3, fertilize_frequency_weeks: 4 },
  'Sweet Potato': { water_frequency_days: 5, fertilize_frequency_weeks: 4 }, // drought tolerant
  'Beet':         { water_frequency_days: 3, fertilize_frequency_weeks: 4 },
  'Sunflower':    { water_frequency_days: 4, fertilize_frequency_weeks: 3 },
}

// ── Plant seed data from her spreadsheet ──────────────────────
export const SEED_PLANTS = [
  // Nightshades
  { name: 'Corn (Pole Tomato)', variety: 'Beefstock', family: 'Nightshades (Solanaceae)', category: 'vegetable', sow_indoors_timing: '4-6 weeks before frost', direct_sow_timing: 'Transplant 1-2 weeks after frost', days_to_harvest: '96', in_ground_start: 'May 1st', seed_quantity: '25 seeds', notes: null },
  { name: 'Roma Tomato', variety: 'Italian Roma', family: 'Nightshades (Solanaceae)', category: 'vegetable', sow_indoors_timing: '4-6 weeks before frost', direct_sow_timing: 'Transplant 1-2 weeks after frost', days_to_harvest: '80', in_ground_start: 'May 1st', seed_quantity: '25 seeds', notes: null },
  { name: 'Tomato', variety: 'Heirloom', family: 'Nightshades (Solanaceae)', category: 'vegetable', sow_indoors_timing: '6-8 weeks before frost', direct_sow_timing: '1 week after frost', days_to_harvest: '82', in_ground_start: 'May 1st', seed_quantity: '1/10 gram', notes: null },
  { name: 'Cherry Tomato', variety: 'Cherry', family: 'Nightshades (Solanaceae)', category: 'vegetable', sow_indoors_timing: '6-8 weeks before frost', direct_sow_timing: '1 week after frost', days_to_harvest: '65', in_ground_start: 'May 1st', seed_quantity: '1/10 gram', notes: 'Trellis, center of row' },
  { name: 'Sweet Pepper Red/Green', variety: 'California Wonder', family: 'Nightshades (Solanaceae)', category: 'vegetable', sow_indoors_timing: '8-10 weeks before frost', direct_sow_timing: 'Transplant 2-4 weeks after frost', days_to_harvest: '75 from transplanting', in_ground_start: 'May 1st', seed_quantity: '30 seeds', notes: 'Red and green color' },
  { name: 'Sweet Pepper Yellow', variety: 'Golden Cal Wonder', family: 'Nightshades (Solanaceae)', category: 'vegetable', sow_indoors_timing: '8-10 weeks before frost', direct_sow_timing: 'Transplant 2-4 weeks after frost', days_to_harvest: '75 from transplanting', in_ground_start: 'May 1st', seed_quantity: '20 seeds', notes: 'Green to yellow with tint of orange' },
  { name: 'Sweet Pepper Red', variety: 'California Wonder', family: 'Nightshades (Solanaceae)', category: 'vegetable', sow_indoors_timing: '6-8 weeks before frost', direct_sow_timing: null, days_to_harvest: '60 green / 80 red', in_ground_start: 'May 1st', seed_quantity: '1/64 ounce', notes: null },
  { name: 'Hot Pepper', variety: 'Jalapeño Early', family: 'Nightshades (Solanaceae)', category: 'vegetable', sow_indoors_timing: '8 weeks before frost', direct_sow_timing: 'After frost', days_to_harvest: '72-75', in_ground_start: 'May 1st', seed_quantity: '1.2g', notes: 'Harden outside for a week before transplanting' },
  { name: 'Hot Pepper', variety: 'Jalapeño Gigantia', family: 'Nightshades (Solanaceae)', category: 'vegetable', sow_indoors_timing: '8 weeks before frost', direct_sow_timing: 'After frost', days_to_harvest: '70', in_ground_start: 'May 1st', seed_quantity: '170mg', notes: 'Harden outside for a week before transplanting' },
  // Brassicas
  { name: 'Kale', variety: 'Premier', family: 'Brassicas (Cruciferae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: 'Early spring', days_to_harvest: '55-65', in_ground_start: 'Early spring', in_ground_end: 'Mid-summer', seed_quantity: '2g', notes: null },
  { name: 'Bok Choy', variety: 'White Stem', family: 'Brassicas (Cruciferae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: 'Early spring', days_to_harvest: '50', in_ground_start: 'Early spring', seed_quantity: '50mg', notes: null },
  { name: 'Collards', variety: 'Georgia', family: 'Brassicas (Cruciferae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: 'Early spring', days_to_harvest: '65', in_ground_start: 'Early spring', in_ground_end: 'Mid-summer', seed_quantity: '3g', notes: null },
  { name: 'Broccoli', variety: 'Calabrese', family: 'Brassicas (Cruciferae)', category: 'vegetable', sow_indoors_timing: '4-6 weeks before frost', direct_sow_timing: '2-4 weeks before frost', days_to_harvest: '65', in_ground_start: 'April 1st', in_ground_end: 'May 15th', seed_quantity: '1g', notes: 'Direct sow for fall crop late July' },
  { name: 'Cabbage', variety: 'Golden Acre', family: 'Brassicas (Cruciferae)', category: 'vegetable', sow_indoors_timing: '6-8 weeks before frost', direct_sow_timing: '2-4 weeks before frost', days_to_harvest: '63', in_ground_start: 'April 1st', seed_quantity: '1g', notes: 'Harvest when heads feel firm' },
  { name: 'Cauliflower', variety: 'Snowball', family: 'Brassicas (Cruciferae)', category: 'vegetable', sow_indoors_timing: '4-6 weeks before frost', direct_sow_timing: '2-4 weeks before frost', days_to_harvest: '68', in_ground_start: 'April 1st', seed_quantity: '1g', notes: 'Blanch by tying outer leaves over curd when 2-3in' },
  { name: 'Radish', variety: 'Cherry Belle', family: 'Brassicas (Cruciferae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '4-6 weeks before frost', days_to_harvest: '22', in_ground_start: 'March 15th', in_ground_end: 'April 30th', seed_quantity: '3g', notes: 'Succession sow every 2 weeks, harvest before bolting' },
  { name: 'Turnip', variety: 'Purple Top White Globe', family: 'Brassicas (Cruciferae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '4-6 weeks before frost', days_to_harvest: '55', in_ground_start: 'March 15th', seed_quantity: '3g', notes: 'Also good for fall sowing' },
  // Legumes
  { name: 'Bush Bean', variety: 'Jade', family: 'Legumes (Fabaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: 'Right after no frost danger', days_to_harvest: '55', in_ground_start: 'Frost date', seed_quantity: '1 ounce', notes: null },
  { name: 'Pole Bean', variety: 'Kentucky Wonder', family: 'Legumes (Fabaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: '63', in_ground_start: 'Frost date', seed_quantity: '25g', notes: 'Succession planting 7-14 days until mid-Aug' },
  { name: 'Pea', variety: 'Sugar Snap', family: 'Legumes (Fabaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '4-6 weeks before frost', days_to_harvest: '62', in_ground_start: 'March 15th', in_ground_end: 'June 1st', seed_quantity: '1 ounce', notes: 'Frost tolerant, trellis to 6ft, pick frequently' },
  { name: 'Pea', variety: 'Snow Pea Oregon Giant', family: 'Legumes (Fabaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '4-6 weeks before frost', days_to_harvest: '60', in_ground_start: 'March 15th', in_ground_end: 'June 1st', seed_quantity: '1 ounce', notes: 'Flat edible pod, trellis needed' },
  // Cucurbits
  { name: 'Squash Yellow', variety: "Max's Gold", family: 'Cucurbits (Cucurbitaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: '55', in_ground_start: 'May 1st', seed_quantity: '12 seeds', notes: null },
  { name: 'Squash Green', variety: 'Black Beauty', family: 'Cucurbits (Cucurbitaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: '55', in_ground_start: 'May 1st', seed_quantity: '4g', notes: null },
  { name: 'Zucchini', variety: 'Cocozelle', family: 'Cucurbits (Cucurbitaceae)', category: 'vegetable', sow_indoors_timing: '3-4 weeks before frost', direct_sow_timing: '1 week after frost', days_to_harvest: '58', in_ground_start: null, seed_quantity: '1/8 ounce', notes: 'Center of bed' },
  { name: 'Cucumber', variety: 'Marketmore', family: 'Cucurbits (Cucurbitaceae)', category: 'vegetable', sow_indoors_timing: '2-4 weeks before frost', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: '60', in_ground_start: 'May 1st', seed_quantity: '1.5g', notes: 'Sows up to 20ft of trellised cucumbers' },
  { name: 'Cucumber', variety: 'Green Finger', family: 'Cucurbits (Cucurbitaceae)', category: 'vegetable', sow_indoors_timing: '3-4 weeks before frost', direct_sow_timing: '1 week after frost', days_to_harvest: null, in_ground_start: 'May 1st', seed_quantity: '1/16 ounce', notes: 'One row in center of bed, 6-10in tall' },
  { name: 'Cucumber', variety: 'National Pickling', family: 'Cucurbits (Cucurbitaceae)', category: 'vegetable', sow_indoors_timing: '3-4 weeks before frost', direct_sow_timing: '1 week after frost', days_to_harvest: null, in_ground_start: 'May 1st', seed_quantity: '1/16 ounce', notes: 'One row in center of bed, 5-6in long' },
  { name: 'Cantaloupe', variety: "Hale's Best Jumbo", family: 'Cucurbits (Cucurbitaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: '85', in_ground_start: 'May 1st', seed_quantity: '1g', notes: null },
  { name: 'Watermelon', variety: 'Sugar Baby', family: 'Cucurbits (Cucurbitaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: '80', in_ground_start: 'May 1st', seed_quantity: '1.5g', notes: null },
  { name: 'Watermelon', variety: 'Blacktail', family: 'Cucurbits (Cucurbitaceae)', category: 'vegetable', sow_indoors_timing: 'April 1st', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: '76', in_ground_start: 'May 1st', seed_quantity: '1/16 ounce', notes: 'One row in center of bed or hills, 8in across' },
  { name: 'Pumpkin', variety: "Jack O'Lantern", family: 'Cucurbits (Cucurbitaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '2-4 weeks after frost', days_to_harvest: '105', in_ground_start: 'May 1st', seed_quantity: '4g', notes: null },
  { name: 'Pumpkin', variety: 'Jack Be Little', family: 'Cucurbits (Cucurbitaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: '95', in_ground_start: 'May 1st', seed_quantity: '1/8 ounce', notes: '3in wide x 2in tall' },
  { name: 'Pumpkin', variety: 'Cinderella', family: 'Cucurbits (Cucurbitaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: 'After frost', days_to_harvest: '100', in_ground_start: 'May 1st', seed_quantity: '1/8 ounce', notes: 'One row in the center of bed, 5-8 pounds' },
  { name: 'Pumpkin', variety: 'Small Sugar', family: 'Cucurbits (Cucurbitaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: 'After frost', days_to_harvest: '100', in_ground_start: 'May 1st', seed_quantity: '2.2g', notes: '5-8 pounds' },
  // Nightshades (additions)
  { name: 'Potato', variety: 'Yukon Gold', family: 'Nightshades (Solanaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '2-4 weeks before last frost', days_to_harvest: '70-90', in_ground_start: 'April 1st', in_ground_end: 'May 1st', seed_quantity: '5 lbs seed potatoes', notes: 'Plant eyes-up 4in deep, hill as they grow' },
  { name: 'Potato', variety: 'Red Norland', family: 'Nightshades (Solanaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '2-4 weeks before last frost', days_to_harvest: '70', in_ground_start: 'April 1st', seed_quantity: '5 lbs seed potatoes', notes: 'Early season, plant eyes-up 4in deep' },
  { name: 'Eggplant', variety: 'Black Beauty', family: 'Nightshades (Solanaceae)', category: 'vegetable', sow_indoors_timing: '8-10 weeks before frost', direct_sow_timing: 'Transplant 2-3 weeks after frost', days_to_harvest: '74', in_ground_start: 'May 15th', seed_quantity: '20 seeds', notes: 'Needs warm soil, harvest when glossy' },
  // Alliums
  { name: 'Onion', variety: 'Yellow Sweet Spanish', family: 'Alliums (Amaryllidaceae)', category: 'vegetable', sow_indoors_timing: '10-12 weeks before frost', direct_sow_timing: '4-6 weeks before frost', days_to_harvest: '110', in_ground_start: 'April 1st', seed_quantity: '1/16 ounce', notes: 'Long day onion, cure 2-4 weeks after harvest' },
  { name: 'Onion', variety: 'Red Wethersfield', family: 'Alliums (Amaryllidaceae)', category: 'vegetable', sow_indoors_timing: '10-12 weeks before frost', direct_sow_timing: '4-6 weeks before frost', days_to_harvest: '100', in_ground_start: 'April 1st', seed_quantity: '1/16 ounce', notes: 'Long day red onion, good storage' },
  { name: 'Bunching Onion', variety: 'Parade', family: 'Alliums (Amaryllidaceae)', category: 'vegetable', sow_indoors_timing: '8-10 weeks before frost', direct_sow_timing: 'Workable soil', days_to_harvest: '70', in_ground_start: 'March 1st', seed_quantity: '100 seeds', notes: null },
  { name: 'Garlic', variety: 'Hardneck', family: 'Alliums (Amaryllidaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: 'Plant cloves in fall (Oct)', days_to_harvest: '240', in_ground_start: 'October', in_ground_end: 'July', seed_quantity: '1 bulb (8-10 cloves)', notes: 'Plant pointed-end up 2in deep, mulch heavily for winter' },
  { name: 'Leek', variety: 'American Flag', family: 'Alliums (Amaryllidaceae)', category: 'vegetable', sow_indoors_timing: '10-12 weeks before frost', direct_sow_timing: '4-6 weeks before frost', days_to_harvest: '120', in_ground_start: 'April 1st', seed_quantity: '1g', notes: 'Transplant when pencil-thin, bury deep for blanching' },
  // Umbellifers
  { name: 'Carrot', variety: 'Scarlet', family: 'Umbellifers (Apiaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '2-4 weeks before frost', days_to_harvest: '65', in_ground_start: 'March 15 - April 1', seed_quantity: '800mg', notes: null },
  { name: 'Carrot', variety: 'Danvers 126', family: 'Umbellifers (Apiaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '2-4 weeks before frost', days_to_harvest: '75', in_ground_start: 'March 15 - April 1', seed_quantity: '1g', notes: 'Tolerates heavy soil, good storage carrot' },
  { name: 'Dill', variety: 'Bouquet', family: 'Umbellifers (Apiaceae)', category: 'herb', sow_indoors_timing: 'Not recommended', direct_sow_timing: 'After frost', days_to_harvest: '40-60', in_ground_start: 'May 1st', seed_quantity: '2g', notes: 'Self-seeds readily, succession sow every 3 weeks' },
  { name: 'Parsley', variety: 'Italian Flat Leaf', family: 'Umbellifers (Apiaceae)', category: 'herb', sow_indoors_timing: '8-10 weeks before frost', direct_sow_timing: '4-6 weeks before frost', days_to_harvest: '70-90', in_ground_start: 'April 1st', seed_quantity: '1g', notes: 'Slow to germinate, soak seeds overnight before planting' },
  { name: 'Cilantro', variety: 'Santo', family: 'Umbellifers (Apiaceae)', category: 'herb', sow_indoors_timing: 'Not recommended', direct_sow_timing: '2 weeks before frost', days_to_harvest: '50', in_ground_start: 'April 1st', in_ground_end: 'June 1st', seed_quantity: '3g', notes: 'Bolts in heat — succession sow every 3 weeks, do a fall planting' },
  { name: 'Parsnip', variety: 'Hollow Crown', family: 'Umbellifers (Apiaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '2-4 weeks before frost', days_to_harvest: '120', in_ground_start: 'April 1st', seed_quantity: '3g', notes: 'Sweeter after frost, can overwinter in ground' },
  // Asteraceae
  { name: 'Iceberg Lettuce', variety: 'Crispino', family: 'Asteraceae', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: 'Last frost', days_to_harvest: '57', in_ground_start: 'Frost date', in_ground_end: 'Late summer', seed_quantity: '1/32 ounce', notes: 'Sow every 3 weeks from spring to late summer' },
  { name: 'Romaine Lettuce', variety: 'Parris Island Cos', family: 'Asteraceae', category: 'vegetable', sow_indoors_timing: '4-6 weeks before frost', direct_sow_timing: '2-4 weeks before frost', days_to_harvest: '21-68', in_ground_start: 'April 1st', in_ground_end: 'Sept 1st', seed_quantity: '2g', notes: 'Frost tolerant, 10-12in' },
  { name: 'Spinach', variety: 'Bloomsdale', family: 'Asteraceae', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '4-6 weeks before frost', days_to_harvest: '28-45', in_ground_start: 'March 15', in_ground_end: 'Sept 1', seed_quantity: '3g', notes: 'Frost tolerant, good for container' },
  { name: 'Spinach', variety: 'Salad Sensation', family: 'Asteraceae', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: 'Early spring', days_to_harvest: '22-55', in_ground_start: 'Early spring', in_ground_end: 'Mid-summer', seed_quantity: '2.5g', notes: null },
  { name: 'Sunflower', variety: 'Lemon Queen', family: 'Asteraceae', category: 'flower', sow_indoors_timing: 'Not recommended', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: null, in_ground_start: 'May 1st', seed_quantity: '1.5g', notes: "5-7ft tall, succession 2-4 weeks until July" },
  { name: 'Sunflower', variety: 'Sunny Bouquet', family: 'Asteraceae', category: 'flower', sow_indoors_timing: 'Not recommended', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: null, in_ground_start: 'May 1st', seed_quantity: '3g', notes: null },
  // Corn
  { name: 'Corn', variety: 'Buttergold Sweet', family: 'Corn (Poaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: 'Sow seed 1-2 weeks after frost', days_to_harvest: '63', in_ground_start: 'May 1st', in_ground_end: 'June 1st', seed_quantity: '10g', notes: null },
  { name: 'Corn', variety: 'Honey and Cream', family: 'Corn (Poaceae)', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: 'Sow seed 1-2 weeks after frost', days_to_harvest: '63', in_ground_start: 'May 1st', in_ground_end: 'June 1st', seed_quantity: '10g', notes: null },
  // Other
  { name: 'Zinnia', variety: 'California Giants', family: 'Other / Flower', category: 'flower', sow_indoors_timing: '4-6 weeks before frost', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: null, in_ground_start: 'May 1st', seed_quantity: '1.5g', notes: "24-48in tall, blooms to frost" },
  { name: 'Zinnia', variety: 'Cut and Come Again', family: 'Other / Flower', category: 'flower', sow_indoors_timing: '4-6 weeks before frost', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: null, in_ground_start: 'May 1st', seed_quantity: '4g', notes: "18-30in tall, blooms to frost" },
  { name: 'Morning Glory', variety: 'Something Old/New', family: 'Other / Flower', category: 'flower', sow_indoors_timing: '4-6 weeks before frost', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: null, in_ground_start: 'May 1st', seed_quantity: '6g', notes: "8-15ft vines, blooms to frost" },
  { name: 'Catnip', variety: 'Nepeta', family: 'Other / Flower', category: 'herb', sow_indoors_timing: '6-8 weeks before frost', direct_sow_timing: '2-4 weeks before frost', days_to_harvest: null, in_ground_start: 'April 1st', seed_quantity: '350mg', notes: null },
  { name: 'Basil', variety: 'Genovese', family: 'Other / Flower', category: 'herb', sow_indoors_timing: '4-6 weeks before frost', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: '60-90', in_ground_start: 'May 15th', seed_quantity: '1g', notes: 'Pinch flowers to extend harvest, plant near tomatoes' },
  { name: 'Basil', variety: 'Thai', family: 'Other / Flower', category: 'herb', sow_indoors_timing: '4-6 weeks before frost', direct_sow_timing: '1-2 weeks after frost', days_to_harvest: '60', in_ground_start: 'May 15th', seed_quantity: '500mg', notes: 'Anise-like flavor, more heat tolerant than Genovese' },
  { name: 'Mint', variety: 'Spearmint', family: 'Other / Flower', category: 'herb', sow_indoors_timing: '8-10 weeks before frost', direct_sow_timing: 'After frost', days_to_harvest: '90', in_ground_start: 'May 1st', seed_quantity: '200mg', notes: 'Spreads aggressively — grow in containers or with a root barrier' },
  { name: 'Swiss Chard', variety: 'Rainbow', family: 'Other / Flower', category: 'vegetable', sow_indoors_timing: '3-4 weeks before frost', direct_sow_timing: '2-3 weeks before frost', days_to_harvest: '50-60', in_ground_start: 'April 1st', in_ground_end: 'Oct 1st', seed_quantity: '3g', notes: 'Cut outer leaves, productive all season' },
  { name: 'Beet', variety: 'Detroit Dark Red', family: 'Other / Flower', category: 'vegetable', sow_indoors_timing: 'Not recommended', direct_sow_timing: '3-4 weeks before frost', days_to_harvest: '60', in_ground_start: 'March 15th', seed_quantity: '5g', notes: 'Greens are edible too, thin to 3in apart' },
  { name: 'Sweet Potato', variety: 'Beauregard', family: 'Other / Flower', category: 'vegetable', sow_indoors_timing: 'Start slips 6-8 weeks before planting', direct_sow_timing: 'Plant slips 2-4 weeks after frost', days_to_harvest: '90-100', in_ground_start: 'May 15th', seed_quantity: '3-5 slips', notes: 'Needs warm soil, harvest before frost, cure at 85°F for a week' },
]
