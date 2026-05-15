# AI Recruitment Chatbot

Monorepo for a recruitment assistant: React (Vite) candidate chat + HR dashboards, Express API on Node, optional Supabase/Prisma persistence, and deploy support for Vercel (static UI + serverless API).

## Overview

Candidates chat about open roles, upload a CV (PDF), and receive an automated screening outcome. HR can open password-gated dashboards for ratings, approved CVs, and CV screening metrics (including manual labels for precision/recall-style evaluation).

## Main features

- **Candidate chat widget** — job discovery, conversational AI (Gemini / Groq / xAI via configuration), PDF upload and text extraction (`pdf-parse` v1.x for Node/serverless compatibility).
- **HR dashboard** (`/#/hr`) — approved CVs, CV decision history, optional accuracy metrics when HR labels ground truth.
- **Ratings dashboard** (`/#/ratings`) — chat session ratings summary.
- **Persistence** — Supabase REST for runtime tables when configured; in-memory fallbacks where applicable; Prisma for schema migrations and seed data.
- **Optional Streamlit demo** — Python UI under `resources/streamlit_recruitment/` (independent of the main app).

## Tech stack

| Area | Stack |
|------|--------|
| UI | React 18, TypeScript, Vite |
| API | Express, TypeScript, Multer (uploads) |
| Database | Supabase (Postgres) + Prisma ORM (v5.22.x) |
| Deploy | Vercel (`public/` static + `api/` serverless export) |
| Email | Nodemailer (Gmail SMTP in `.env`) |

## Folder structure

```
.
├─ api/                    # Vercel serverless entry → Express app
├─ backend/
│  ├─ prisma/              # Schema, migrations, seed
│  ├─ scripts/             # build helpers (tsc via node)
│  └─ src/
│     ├─ app.ts            # createApp() + default export for Vercel
│     ├─ server.ts         # local HTTP server entry
│     ├─ middleware/       # e.g. simpleAuth
│     ├─ routes/           # Express routers: chat, jobs, HR APIs
│     └─ services/         # AI, email, Supabase stores, ratings/CV persistence
├─ frontend/
│  ├─ scripts/             # Vite build via node (Vercel-friendly)
│  └─ src/
│     ├─ main.tsx          # demo shell (local index.html)
│     ├─ embed.tsx         # `window.initRecruitmentChatbot` embed entry
│     ├─ components/       # ChatWidget, ChatContext
│     └─ pages/            # App, HrDashboard, RatingsDashboard
├─ database/               # Reference SQL for Supabase editor (see database/README.md)
├─ docs/                   # Deployment & methodology notes
├─ resources/              # Optional extras (Streamlit)
├─ tests/                  # Placeholder — see tests/README.md
├─ public/                 # Production frontend build output (gitignored)
├─ vercel.json             # Build + /api rewrite to serverless
└─ package.json            # npm workspaces: backend, frontend
```

## Prerequisites

- **Node.js** 18+ (20+ recommended).
- **npm** 9+.
- **Supabase** project (optional for full persistence; app degrades to in-memory where coded).
- **Python 3** + Streamlit (only if you run the optional demo).

## Installation

Clone the repository and install workspaces from the repo root:

```bash
npm install
```

## Environment variables

Copy examples and fill real values — **never commit secrets**.

| File | Purpose |
|------|--------|
| `.env.example` | High-level pointers for the monorepo |
| `backend/.env.example` | Backend: DB, Supabase, SMTP, AI keys, `HR_DASHBOARD_PASSWORD` |
| `frontend/.env.example` | Optional `VITE_API_BASE_URL` when API is not same-origin |

**Backend highlights** (see `backend/.env.example` for the full list):

- `DATABASE_URL` — direct Postgres URL for Prisma (`sslmode=require` as required by Supabase).
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — server-side Supabase client.
- `HR_DASHBOARD_PASSWORD` — gate for HR routes and `#/hr` / `#/ratings` flows.
- `GEMINI_API_KEY` / `GROQ_API_KEY` / `XAI_API_KEY` — conversational AI (see comments in example file).

## Database setup

1. **Prisma (recommended for migrations)**  
   From repo root:

   ```bash
   cd backend
   cp .env.example .env
   # Set DATABASE_URL, SUPABASE_*, etc.
   npm run db:migrate        # dev
   npm run db:migrate:deploy # CI / production
   npm run db:seed           # optional seed data
   ```

2. **Manual SQL**  
   Reference scripts live in `database/supabase/`. Prisma remains the source of truth for the Node app schema.

If migrations fail on a non-empty database (`P3005`), baseline with `prisma migrate resolve` for your init migration before deploying new ones (see Prisma docs and project history).

## Run locally

**Option A — frontend only (proxies `/api` to backend):**

```bash
npm run dev
```

Starts Vite; by default it can spawn the backend on port **4000** (see `frontend/vite.config.ts`, disable with `VITE_SPAWN_BACKEND=false`).

**Option B — backend + frontend separately:**

```bash
npm run dev:split
```

Or individually:

```bash
npm run dev:backend
npm run dev:frontend   # in another terminal
```

**Streamlit (optional):**

```bash
cd resources/streamlit_recruitment
python -m venv .venv
# activate venv, then:
pip install -r requirements.txt
streamlit run app.py
```

## Build and deploy

**Production build (root):**

```bash
npm run build
```

- Frontend output: repo-root `public/` (ignored by git).
- Backend: compiles to `backend/dist/` and runs `prisma generate`.

**Vercel:**

- Root directory: repository root (same level as `vercel.json`).
- Set environment variables in the Vercel project to match `backend/.env` (and any `VITE_*` if needed).
- See `docs/Deploy_Vercel_Supabase_SingleApp.md`.

**Start compiled backend only:**

```bash
npm start
```

## API overview

Base path: `/api` (rewritten to the serverless function on Vercel).

| Method / path | Description |
|---------------|-------------|
| `GET /api/health` | Health check |
| `POST /api/chat/...` | Chat, uploads (see `backend/src/routes/chatbot.ts`) |
| `GET /api/jobs/...` | Sample job listings |
| `GET/POST /api/hr/...` | HR dashboard APIs (ratings, CV decisions, metrics, auth check) |

Example health check:

```bash
curl -s https://<your-deployment>.vercel.app/api/health
```

## Troubleshooting

| Symptom | Things to check |
|--------|------------------|
| Vercel build `126` / “Permission denied” on `tsc` or `vite` | Root build uses `node` runners in `backend/scripts/compile-tsc.cjs` and `frontend/scripts/run-vite-build.cjs`. |
| “No Output Directory” / empty site | `vercel.json` expects `public/` after `npm run build`. |
| CV upload `500` / `ENOENT` / PDF test path | Ensure deployed code includes empty-buffer checks and `pdf-parse@1.1.x` (not v2). |
| `P1001` / `P1000` Prisma errors | Direct `DATABASE_URL`, firewall, correct Supabase credentials; pooler vs direct host. |
| `PGRST205` missing table | Run migrations or use fallback behavior until `cv_decisions` (and related) exist in Supabase. |
| AI not answering | At least one AI key and optional `AI_PROVIDER` in `backend/.env`. |

## Naming and code organization

- **`routes/**`** — HTTP routers only; they delegate to **`services/**`** for integrations and persistence.
- **`middleware/**`** — cross-cutting Express behavior.
- **`components/**` vs `pages/**`** — reusable UI vs route-level screens in the frontend.

**Possible duplicate logic to refactor later:** job titles/criteria appear in the in-memory `jobs` router, Prisma seed data, and the Streamlit demo. Consolidating a single source (for example DB-backed jobs + shared types) would reduce drift.

## Future improvements

- Automated tests (Vitest / Supertest) under `tests/` and package-local `__tests__`.
- Shared `types/` package for API DTOs between frontend and backend.
- Structured logging and request IDs for production.
- Hardening auth beyond the demo header + HR password gate.

## License / sharing

The repository is intended to be clonable with no machine-specific paths. Add your own `.env` files locally; `public/` and `node_modules/` are gitignored. **Confirm with your team before deleting** any committed build artifacts (for example stale `backend/dist` if it was ever tracked).
