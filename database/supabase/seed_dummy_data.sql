-- Run in Supabase → SQL Editor after `schema.sql`.
-- Backend reads/writes `chat_ratings` when SUPABASE_* env vars are set.

insert into public.chat_ratings (id, created_at, session_id, user_id, stars)
values
  ('rating_demo_1', now() - interval '2 days', 'sess_demo_1', 'user_demo_1', 5),
  ('rating_demo_2', now() - interval '1 day',  'sess_demo_1', 'user_demo_2', 4),
  ('rating_demo_3', now() - interval '6 hours','sess_demo_2', 'user_demo_3', 3)
on conflict (id) do nothing;

-- Optional: `approved_cvs` table exists for persistence, but the current API
-- still lists approved CVs from in-memory storage. Inserts here are only useful
-- if you extend the backend to read from Supabase.
--
-- insert into public.approved_cvs (
--   id, job_title, candidate_email, score, years_detected,
--   file_name, file_size_kb, session_id, uploaded_by_user_id,
--   extracted_text_preview, pdf_sha256, storage_path
-- ) values (
--   'cv_demo_1',
--   'Senior Full-Stack Developer',
--   'candidate@example.com',
--   85,
--   5,
--   'demo-cv.pdf',
--   120,
--   'sess_demo_1',
--   'hr_demo_1',
--   'Dummy preview text for HR dashboard experiments...',
--   repeat('0', 64),
--   'demo/cv_demo_1.pdf'
-- ) on conflict (id) do nothing;
