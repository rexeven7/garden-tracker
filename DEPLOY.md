# 🌱 Garden Tracker — Deploy Guide
## From zero to live in ~20 minutes, completely free

---

## What you're deploying

A full-stack React app with:
- **Frontend** → Vercel (free, instant deploy from GitHub)
- **Database + Auth** → Supabase (free tier: 500MB database, unlimited auth users)
- **No credit card required for either**

---

## Step 1 — Set up Supabase (10 min)

1. Go to **https://supabase.com** → Sign up (free)
2. Click **"New Project"** → give it a name like `garden-tracker`
3. Choose a region close to you → click **"Create project"** (takes ~2 min to provision)

### Run the database schema

4. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
5. Click **"New query"**
6. Open the file `supabase/schema.sql` from this project
7. Paste the entire contents into the SQL editor
8. Click **"Run"** — you should see "Success. No rows returned"

### Get your API keys

9. Go to **Settings → API** in the sidebar
10. Copy these two values — you'll need them in Step 3:
    - **Project URL** (looks like `https://abcdefgh.supabase.co`)
    - **anon public** key (long string starting with `eyJ...`)

---

## Step 2 — Push to GitHub (5 min)

1. Go to **https://github.com** → sign in or create account
2. Click **"New repository"** → name it `garden-tracker` → **Create repository**
3. In your terminal, from the `garden-app` folder:

```bash
git init
git add .
git commit -m "Initial garden tracker app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/garden-tracker.git
git push -u origin main
```

---

## Step 3 — Deploy to Vercel (5 min)

1. Go to **https://vercel.com** → Sign up with GitHub (free)
2. Click **"Add New Project"**
3. Find and import your `garden-tracker` repository
4. Before clicking Deploy, click **"Environment Variables"** and add:

   | Name | Value |
   |------|-------|
   | `REACT_APP_SUPABASE_URL` | Your Supabase Project URL |
   | `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anon public key |

5. Click **"Deploy"**

Vercel will build and deploy the app. In ~2 minutes you'll get a live URL like:
`https://garden-tracker-yourname.vercel.app`

---

## Step 4 — First run setup (5 min)

1. Open your live URL
2. Click **"Sign Up"** → enter your email and a password → check email for confirmation link
3. Once logged in, start with **Setup** in the sidebar:

### Recommended order:
1. **Seasons** → Add `2026` (and any past years you want for rotation history)
   - Her frost dates: Spring April 18–30, Fall Oct 3–21
2. **Beds & Areas** → Add each of her raised beds by name
3. **Plant Library** → Click **"Import from Spreadsheet"** to load all 40 plants from her spreadsheet automatically
4. **Plantings** → Add what she's already started:
   - Onions → Feb 15, 2026 (seeded)
   - Sweet bell peppers → Mar 16, 2026 (seeded)
   - Tomatoes → Mar 16, 2026 (seeded)
   - Bunching onions → Mar 23, 2026 (seeded)
   - Potatoes → Mar 23, 2026 (seeded)
   - Sweet peppers from saved seed → Mar 23, 2026 (seeded)

---

## Using the app

### Dashboard
- See stats at a glance
- Tasks due this week shown front and center
- Click the checkbox on any task to mark it done

### Plantings
- Add a planting from the plant library or with a custom name
- Quick-change status inline (seeded → transplanted → growing → harvested)
- Click 📋 on any row to add a task linked to that planting

### Crop Rotation
- Shows a grid: beds vs. years
- ⚠️ warning appears when the same plant family is in the same bed two years in a row
- Shows rotation suggestions for empty cells
- Use the year checkboxes to show/hide years

### Tasks
- Grouped by: Overdue / Today / Upcoming
- Check off tasks right on the dashboard or tasks page
- Link tasks to specific plantings for context

---

## Updating the app later

Any time you push a change to GitHub, Vercel automatically rebuilds and redeploys. No manual steps needed.

---

## Cost

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby (free) | $0/month |
| Supabase | Free tier | $0/month |
| **Total** | | **$0/month** |

Supabase free tier limits: 500MB database (way more than enough), 50,000 monthly active users. You'd have to be running a commercial operation to outgrow the free tier.

---

## Troubleshooting

**"Missing Supabase env vars"** → Check that you added both environment variables in Vercel (Settings → Environment Variables), then redeploy.

**Auth email not arriving** → Check spam folder. Supabase sends from `noreply@supabase.io`.

**"relation does not exist" errors** → The schema SQL didn't run fully. Go back to Supabase SQL Editor and re-run `schema.sql`.

**Rotation board is empty** → You need seasons AND beds AND plantings all linked together. Make sure each planting has a season and bed assigned.
