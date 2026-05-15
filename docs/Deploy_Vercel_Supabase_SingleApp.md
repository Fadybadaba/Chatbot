## Deploy: Single Vercel App (Frontend + Backend) + Supabase (DB)

This project is set up to deploy as **one Vercel project**:
- Frontend is built to the repo-root `public/` folder (see `frontend/vite.config.ts` and root `vercel.json`).
- Backend runs as a **Vercel Serverless Function** at `api/index.ts` and serves `/api/*`

### 0) Prerequisites
- A Supabase account
- A Vercel account
- Your repo pushed to GitHub (recommended)

---

## 1) Create Supabase project
1. Supabase → **New project**
2. Save these values:
   - **Project URL** → `SUPABASE_URL`
   - **Service role key** → `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

---

## 2) Create database tables (SQL)
Supabase → **SQL Editor** → Run:

```sql
create table if not exists jobs (
  id text primary key,
  title text not null,
  location text not null,
  department text not null,
  employment_type text not null,
  status text not null check (status in ('open','closed')),
  created_at timestamptz not null default now()
);

create table if not exists chat_ratings (
  id text primary key,
  created_at timestamptz not null,
  session_id text not null,
  user_id text not null,
  stars int not null check (stars between 1 and 5)
);

create index if not exists chat_ratings_created_at_idx on chat_ratings(created_at);
```

### Seed dummy jobs (optional)
```sql
insert into jobs (id, title, location, department, employment_type, status)
values
('job_1', 'Backend Engineer', 'Berlin', 'Engineering', 'full-time', 'open'),
('job_2', 'HR Generalist', 'Remote', 'People', 'full-time', 'open')
on conflict (id) do update set
title=excluded.title,
location=excluded.location,
department=excluded.department,
employment_type=excluded.employment_type,
status=excluded.status;
```

---

## 3) Configure Vercel project (single app)

### 3.1 Import repository
Vercel → **New Project** → Import your repo.

### 3.2 Build settings
Set:
- **Build Command**: `npm run build`
- **Output Directory**: `public`

This matches `vercel.json` and `frontend/vite.config.ts` (production build writes to the repo-root `public/` folder).

### 3.3 Environment variables (Vercel → Project → Settings → Environment Variables)
Add:
- `SUPABASE_URL` = your Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY` = your Supabase Service Role Key
- `HR_DASHBOARD_PASSWORD` = (example) `123`
- (Optional) AI keys:
  - `GROQ_API_KEY` and `AI_PROVIDER=groq`
  - or `GEMINI_API_KEY`

---

## 4) Deploy
Click **Deploy**.

After deploy:
- Frontend: `https://<your-project>.vercel.app/`
- Backend health: `https://<your-project>.vercel.app/api/health`

---

## 5) Verify ratings persistence
1. Open the site
2. Open chat → send a message → close chat → rate with stars
3. Go to Ratings Dashboard (top-left) → enter HR password
4. You should see the rating and average (stored in Supabase)

---

## Notes / Architecture
- Vercel routing is configured in `vercel.json`
  - `/api/*` → serverless function (`api/index.ts`) which runs the Express app
  - everything else → static files in `public/` (`index.html` for SPA)
- Locally, backend still runs with `backend/src/server.ts`

