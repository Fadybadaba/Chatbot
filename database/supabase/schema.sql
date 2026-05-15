-- Run this in Supabase SQL Editor to create the tables this project uses.

-- 1) Ratings (already used by backend when SUPABASE_* env vars are set)
create table if not exists public.chat_ratings (
  id text primary key,
  created_at timestamptz not null default now(),
  session_id text not null,
  user_id text not null,
  stars int not null check (stars between 1 and 5)
);

create index if not exists chat_ratings_created_at_idx
  on public.chat_ratings (created_at desc);

-- 2) Approved CVs (serverless-safe persistence for HR dashboard)
create table if not exists public.approved_cvs (
  id text primary key,
  created_at timestamptz not null default now(),
  job_title text not null,
  candidate_email text,
  score int,
  years_detected int,
  file_name text not null,
  file_size_kb int not null,
  session_id text not null,
  uploaded_by_user_id text not null,
  extracted_text_preview text not null,
  pdf_sha256 text not null,
  storage_bucket text not null default 'approved-cvs',
  storage_path text not null
);

create index if not exists approved_cvs_created_at_idx
  on public.approved_cvs (created_at desc);

-- Optional: allow storing multiple approvals of same PDF per job title if you want.
-- The backend currently de-dupes in memory only; in Supabase we keep by id.
