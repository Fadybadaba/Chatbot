# Database assets

This folder holds **reference SQL** you can paste into the Supabase SQL editor.

- **`supabase/schema.sql`** — table definitions (historical / manual setup).
- **`supabase/seed_dummy_data.sql`** — sample inserts for local experiments.

**Authoritative migrations** for the Node backend live with Prisma:

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/`

Use `npm --prefix backend run db:migrate` / `db:migrate:deploy` and `db:seed` for the Prisma workflow.
