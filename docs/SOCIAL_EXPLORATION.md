# Rootsicle Social & Gamification — Exploration Doc

> **Status:** Early exploration / brainstorm
> **Date:** March 2026

---

## The Pitch

Rootsicle is a free garden tracker. You create beds, plant crops, and track your season. But the real hook is what comes next:

- A **social layer scoped by USDA grow zone** — you only see people who garden in the same climate as you, so every shared tip, planting date, and harvest photo is actually relevant.
- A **pixel-art virtual farm** (Stardew Valley–inspired) where you can walk around your garden, visit other growers' farms, and unlock cosmetic upgrades.
- An eventual **home automation bridge** that lets you trigger real-world watering from inside the app.

**The business model isn't selling things to users — it's the data they generate.**

Everything is free: the tracker, the social features, the pixel farm, the cosmetics. In exchange, users contribute photo-verified, zone-tagged crop data — planting dates, growth photos, harvest yields, pest sightings, success/failure outcomes — that trains a Rootsicle AI and builds a dataset no one else has. The AI helps users grow better (the free value loop), and the aggregated, anonymized dataset is the B2B product.

---

## Layer 0: Foundation (What Exists Today)

The current app already has the data model needed for social:

- Garden dimensions and bed layouts (with the new Konva map)
- Per-planting tracking: seeded → growing → harvested, with dates and ratings
- Location coordinates (for weather — already stored in `user_settings`)
- Pest & issue tracking with notes

**What's missing for social:**

- Grow zone derivation from coordinates (USDA API or lookup table)
- Privacy controls (what's shared, what isn't)
- User profiles (display name, avatar, zone badge)
- A feed / discovery mechanism

---

## Layer 1: Social — The Highest-Value, Lowest-Effort Win

### Why This Comes First

The grow-zone community doesn't exist anywhere else. Reddit's r/gardening is 5M people in every climate giving each other contradictory advice. Facebook groups are organized by topic, not by zone. A community where every post is from someone gardening in the same conditions as you is genuinely new.

### Core Features

**Profile & Privacy**
- Display name + optional avatar (no real name required)
- Grow zone auto-detected from saved coordinates (never expose lat/lon)
- Privacy toggle: "Share my garden data with my zone" (opt-in)
- Shared data: garden map, bed layouts, crop list, planting/harvest dates, issue logs, photos
- Never shared: location coordinates, email, account details

**Zone Feed**
- Posts from anyone in your grow zone who has sharing enabled
- Auto-generated activity: "Sarah planted Cherokee Purple tomatoes on Mar 15" / "Jake harvested 12 lbs of zucchini from a 4×8 bed"
- Manual posts: photos, questions, tips
- Issue board: "Anyone seeing aphids on peppers this week?" with photo attachments

**Garden Visiting (Data View)**
- Tap a user in your feed → see their garden map (read-only), bed list, crop timeline
- No location shown — just zone, bed dimensions, and planting data
- "What's working in Zone 7a right now" becomes answerable at a glance

**Following & Reputation**
- Follow growers whose data you find useful
- Simple reputation: "3rd season on Rootsicle" badges, harvest totals, helpfulness votes on answers

### Data Model Additions

```
profiles: user_id, display_name, avatar_url, grow_zone, sharing_enabled, created_at
zone_posts: id, user_id, grow_zone, type (auto|manual|question), content, media_urls[], created_at
zone_comments: id, post_id, user_id, content, created_at
follows: follower_id, following_id
```

### Grow Zone Detection

- USDA Plant Hardiness Zone API: https://phzmapi.org/
- Input: lat/lon (already stored) → Output: zone string like "7a"
- Run once on location setup, store on profile
- ~13 zones × 2 sub-zones = ~26 possible communities in the US
- Consider combining a/b sub-zones if communities are too small initially

### Open Questions

- Do we scope to USDA zones only, or also support international equivalents (RHS hardiness for UK)?
- Should "visiting" show real-time garden state or a snapshot?
- How do we handle moderation with no staff? Community flagging + auto-hide threshold?

---

## Layer 2: Pixel-Art Farm — The Viral Hook

### The Vision

Your Rootsicle garden isn't just a data grid — it's a little pixel-art farm. You have a character. You can walk around your beds. Your crops are rendered as pixel sprites that change with growth stage. The aesthetic is cozy, lo-fi, and Stardew-coded.

When you visit another grower's farm, you walk around *their* pixel world and see what they've planted.

### Why This Is Layer 2, Not Layer 1

- Building a 2D tile-based world renderer is a significant engineering lift
- The social features are valuable even without the pixel art
- The pixel art is valuable even without the social (it makes the solo experience more engaging)
- Sequencing them lets each layer validate before investing in the next

### Technical Approach

**Engine Options:**
| Option | Pros | Cons |
|---|---|---|
| Phaser.js | Mature 2D game engine, tilesets, sprites, camera | Heavy dependency, learning curve |
| PixiJS | Lightweight WebGL renderer, good for sprites | More DIY for game mechanics |
| Extend existing Konva canvas | Already in the app, familiar | Not built for game-style rendering |
| CSS pixel-art grid | Lightest weight, works everywhere | Limited animation, no real "walking" |

**Recommended:** PixiJS or Phaser for the full vision. Start with a CSS/canvas proof-of-concept to validate the vibe before committing to a game engine.

### Scope for MVP

- Fixed isometric or top-down camera (no free roam initially — just a visual representation)
- Beds rendered as pixel-art plots with crop sprites based on plant category (tomato, leafy green, root veg, herb, etc.)
- Growth stage reflected: empty → seedling → growing → harvestable → harvested
- Character stands in the garden (no movement yet — just visual presence)
- Tap a bed → same data panel as today

### Scope for Full Vision

- WASD / tap-to-move character navigation
- Animated crop growth (subtle sway, color changes)
- Day/night cycle based on real time
- Weather overlay matching real weather data
- Visit other farms: your character appears in their world
- Interaction prompts: "Water this bed?" → triggers a cute animation (and optionally, real automation)

### Sprite & Asset Requirements

- Character sprites: idle, walk (4 directions), interact — 16×16 or 32×32
- Crop sprites: ~10 categories × 4 growth stages = ~40 sprites
- Bed sprites: soil, mulch, raised wood, raised metal — 4 base types
- Decoration sprites: fencing, paths, compost bin, tool shed, greenhouse
- Environment: grass tiles, dirt paths, water feature, trees

Could commission a pixel artist or use/adapt open-source sprite sheets (OpenGameArt).

---

## Layer 3: Free Cosmetics as Engagement Fuel + The Data Flywheel

### The Insight

Cosmetics aren't the business — they're the engagement mechanism. Give everything away for free. Beds, greenhouses, decorations, character outfits, farm themes — all of it. Users decorate their farms, spend more time in the app, log more data, upload more photos. That data is the product.

### Free Cosmetics Catalog

All earned through activity, unlocked by milestones, or given out seasonally:

- **Garden Beds:** cedar, stone, wicker, copper-edge, seasonal themes (pumpkin-border, snowflake-edge)
- **Structures:** glass greenhouse, hoop house, cold frame, potting shed
- **Decorations:** scarecrows, bird baths, gnomes, fairy lights, wind chimes, seasonal items
- **Character:** outfits, hats, boots, gloves, fancy tools
- **Farm Themes:** "Cottage Garden," "Japanese Zen," "Desert Xeriscaping," "Urban Rooftop"

**Unlock triggers that also generate data:**
- Log your first planting → unlock a scarecrow
- Upload 10 growth photos → unlock greenhouse
- Complete a full season (seed to harvest) with photos → unlock a farm theme
- Answer 5 community questions → unlock character outfits
- Share your garden publicly → unlock premium bed styles

Every unlock incentivizes exactly the behavior that generates valuable data.

### The Data Asset

What Rootsicle accumulates that nobody else has:

| Data Point | How It's Captured | Why It's Valuable |
|---|---|---|
| Planting dates by zone | Auto-logged when user records seeding/transplant | Seed companies and extension services rely on decades-old averages |
| Photo-verified growth stages | Users upload progress photos (incentivized by cosmetic unlocks) | Visual ML training data for crop health, growth prediction |
| Actual yield by variety + zone | Harvest logging with quantity | Real-world performance data, not trial-plot extrapolations |
| Pest/disease sightings by zone + date | Issue tracker with photos | Early warning systems, regional outbreak detection |
| Success/failure rates | Planting status + taste ratings + whether user replants next season | "What actually works in Zone 7a" — answered with data, not opinions |
| Bed dimensions + crop density | Garden map data | Space-efficiency benchmarks |
| Watering patterns (with HA integration) | Automation logs | Water usage optimization per crop per zone |

### Photo Verification Strategy

Photos are the key to data quality. Unverified self-reported data is noisy. Photos let us:

1. **Confirm growth stage** — a photo tagged "6 weeks after planting" with a visual of the plant is ground truth
2. **Train crop identification models** — user labels the photo (variety, stage), we get labeled training data for free
3. **Detect pests/diseases visually** — builds toward "take a photo, we'll diagnose it"
4. **Prove yields** — a photo of a harvest with a claimed weight is more credible than a number alone

**Incentive structure:** cosmetic unlocks are gated behind photo milestones, not just data entry. "Upload 5 photos of your tomatoes across the season" → unlock a tomato-themed decoration. This naturally generates a labeled, time-series photo dataset per planting.

### The AI Product

The data flywheel feeds a Rootsicle AI that becomes the primary user-facing feature:

**For Users (free):**
- "What should I plant in Zone 6b in April?" → answers based on what thousands of real Zone 6b users successfully grew
- "My tomato leaves look like this" → photo diagnosis trained on community pest/disease images
- "How much will I harvest from a 4×8 bed of zucchini?" → prediction based on actual reported yields in the user's zone
- Personalized planting calendar based on zone peers' actual timing, not generic guides
- Smart watering recommendations based on crop, zone, weather, and community benchmarks

**For B2B (the revenue):**
- **Seed companies:** real-world variety performance data by zone (which tomato varieties actually perform in Zone 5a vs 8b?)
- **Agricultural extension services:** modernized, real-time planting data replacing slow survey-based collection
- **Climate researchers:** longitudinal data on how growing patterns shift with changing conditions
- **Garden product companies:** what products (beds, soil, tools) correlate with better outcomes?
- **Pest/disease monitoring:** regional outbreak detection weeks before traditional reporting
- **Insurance/ag-finance:** crop performance prediction models

### Data Ethics & Privacy

This only works if users trust it. Non-negotiable rules:

- **Anonymized and aggregated** — B2B customers get zone-level statistics, never individual user data
- **Explicit opt-in** — data sharing is a conscious choice, not a buried TOS clause
- **Users see what they contribute** — a "My Data" page showing exactly what's shared and with whom
- **No selling PII, ever** — coordinates, email, name never leave the platform
- **Users can delete** — full data deletion at any time, no "we keep it for 90 days" games
- **Transparent AI training** — "Your photos help train Rootsicle's plant AI. Here's what that means."

### Revenue Model

| Channel | When | Revenue Potential |
|---|---|---|
| API access to aggregated zone data | 10K+ active users with data | Subscription SaaS to ag companies |
| Licensed variety performance reports | 5K+ completed grow seasons | Per-report or annual license to seed companies |
| AI-powered crop advisory API | AI trained on sufficient data | SaaS to garden centers, nurseries, extension services |
| Sponsored variety trials | Established user base | Seed companies pay to distribute trial seeds, users report results |
| White-label AI for garden retailers | Mature AI model | License the "ask about your garden" AI to Home Depot, Lowe's, etc. |

### The Moat

This is the critical part: **the data flywheel is the moat.** Someone can clone the app, but they can't clone 3 seasons of photo-verified crop data from 50,000 growers across every USDA zone. Every user who logs a season makes the AI better, which makes the app more useful, which attracts more users, which generates more data. Classic network effect, but with a data asset that compounds over time.

Speed to market matters because the first app to accumulate this dataset wins. The second app to try starts with zero data and an AI that can't answer anything.

---

## Layer 4: Home Automation — The Moonshot

### The Idea

You're looking at your pixel-art garden. You tap "Water Bed A." Your real-world irrigation valve opens and waters Bed A.

### Why It's a Moonshot

- IoT is fragmented: Rachio, OpenSprinkler, Orbit B-hyve, Hunter Hydrawise, SmartThings, Home Assistant, Hubitat — each has its own API/protocol
- Reliability expectations are high (nobody wants their garden flooded because of a bug)
- Hardware setup varies wildly between users
- Liability questions if automation damages property

### Viable First Step

**Home Assistant integration** — the most hackable platform with the largest DIY gardener overlap.

- Home Assistant has a REST API and WebSocket API
- Users already define their irrigation zones in HA
- Rootsicle could map beds → HA entity IDs
- "Water this bed" sends a `services/switch/turn_on` call to their local HA instance
- Requires the user to expose HA (via Nabu Casa or similar) — Rootsicle never controls hardware directly

### Data Flow

```
Rootsicle app → Rootsicle API → User's Home Assistant → Irrigation controller → Solenoid valve → Water
```

### Scope for MVP

- Settings page: "Connect Home Assistant" → enter HA URL + long-lived access token
- Map each bed to an HA switch/valve entity
- "Water" button on bed detail → calls HA API with configurable duration
- Status indicator: "Bed A was last watered 2 hours ago"
- No scheduling (use HA's own automations for that)

### Longer Term

- Smart scheduling: Rootsicle knows your soil type, crop water needs, recent rainfall (from weather API), and zone peers' practices → suggests optimal watering schedule → executes via HA
- Sensor integration: soil moisture sensors, temperature probes, rain gauges feeding data back into the app
- Community benchmarks: "Growers in Zone 7a water tomatoes 1.2 inches/week on average"

---

## Phasing & Priorities

| Phase | Focus | Effort | User Value | Data Value |
|---|---|---|---|---|
| **1** | Social: profiles, grow zone, zone feed, garden visiting | Medium | High — unique differentiator | Unlocks data sharing consent |
| **2a** | Photo milestones + cosmetic unlocks (all free) | Medium | High — engagement loop | Generates labeled photo dataset |
| **2b** | Pixel-art: static farm view, crop sprites, bed art | Medium-High | High — identity & stickiness | Time-in-app → more data logged |
| **3** | Rootsicle AI v1: zone-specific planting advice, photo diagnosis | High | Killer feature — "ask your garden AI" | Validates data quality, feedback loop |
| **4** | Pixel-art: walkable farm, visiting, full cosmetic catalog | High | Viral — "come see my farm" | Social sharing → user acquisition |
| **5** | Home automation: HA integration, sensor data | Medium | Niche but passionate | Watering + soil data = richer models |
| **6** | B2B data products: API, reports, white-label AI | Medium | Indirect (funds the platform) | Revenue from the data asset |

---

## Competitive Landscape

| App | Tracking | Social | Gamification | AI/Data | Automation |
|---|---|---|---|---|---|
| Planta | ✅ (houseplants) | ❌ | ❌ | Basic ID | ❌ |
| Gardenize | ✅ | Limited | ❌ | ❌ | ❌ |
| From Seed to Spoon | ✅ | ❌ | ❌ | ❌ | ❌ |
| Stardew Valley | ❌ (game) | Multiplayer | ✅✅✅ | N/A | N/A |
| Google/Plant ID apps | ❌ | ❌ | ❌ | Photo ID only | ❌ |
| **Rootsicle** | ✅ | ✅ (zone-scoped) | ✅ (pixel farm) | ✅ (trained on user data) | ✅ (HA bridge) |

Nobody is combining real garden tracking with zone-scoped community and gamification. The closest analog is Stardew Valley making farming feel cozy and social — Rootsicle does that with real plants.

**The data angle is the real gap.** Plant ID apps can tell you what a plant is. Extension services can give you generic advice. Nobody has a model trained on "what 10,000 real people in your exact zone actually grew this year, with photos and yields." That's the product.

---

## Open Questions for Next Steps

1. **Platform priority:** Web-first (current) or native mobile? Photo capture argues for mobile. Pixel farm works on both.
2. **Art pipeline:** Commission a pixel artist upfront, or prototype with placeholder art?
3. **Zone scoping:** US-only at launch, or international from day one?
4. **Moderation:** Community self-policing, or need a reporting/moderation system from the start?
5. **Privacy & consent UX:** How do we make data sharing feel good, not extractive? The opt-in flow needs to feel like joining a community, not signing a waiver.
6. **Photo incentive balance:** How aggressive with photo-gating cosmetic unlocks before it feels like a chore?
7. **AI training timeline:** How many seasons of data before the AI is useful enough to feature? Can we bootstrap with public ag data + community data?
8. **B2B validation:** Talk to a seed company or extension service before building the data pipeline — would they actually pay for this?
9. **Technical validation:** Should we prototype the pixel farm in a standalone canvas before integrating?
10. **Speed to market:** What's the minimum slice of social + photo milestones we can ship in 4 weeks to start accumulating data?
