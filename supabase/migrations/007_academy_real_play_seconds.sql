alter table public.lesson_progress
  add column if not exists real_play_seconds integer not null default 0;
