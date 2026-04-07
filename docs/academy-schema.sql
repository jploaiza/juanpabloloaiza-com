-- ═══════════════════════════════════════════════════════════
-- JPL Academy — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Profiles (extends auth.users) ───────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        text not null default 'student' check (role in ('student', 'admin')),
  created_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Courses ──────────────────────────────────────────────────
create table public.courses (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  title                text not null,
  description          text not null default '',
  thumbnail_url        text,
  instructor_name      text not null default 'Juan Pablo Loaiza',
  instructor_bio       text not null default '',
  instructor_photo_url text,
  is_free              boolean not null default true,
  is_published         boolean not null default true,
  created_at           timestamptz not null default now()
);

-- ── Sections ─────────────────────────────────────────────────
create table public.sections (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,
  order_index integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ── Lessons ──────────────────────────────────────────────────
create table public.lessons (
  id               uuid primary key default gen_random_uuid(),
  section_id       uuid not null references public.sections(id) on delete cascade,
  course_id        uuid not null references public.courses(id) on delete cascade,
  slug             text not null unique,
  title            text not null,
  duration_seconds integer not null default 0,
  video_url        text,
  order_index      integer not null default 0,
  is_published     boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ── Enrollments ──────────────────────────────────────────────
create table public.enrollments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  course_id    uuid not null references public.courses(id) on delete cascade,
  enrolled_at  timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id, course_id)
);

-- ── Lesson Progress ──────────────────────────────────────────
create table public.lesson_progress (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  lesson_id        uuid not null references public.lessons(id) on delete cascade,
  course_id        uuid not null references public.courses(id) on delete cascade,
  watch_seconds    integer not null default 0,
  duration_seconds integer not null default 0,
  is_completed     boolean not null default false,
  completed_at     timestamptz,
  last_watched_at  timestamptz not null default now(),
  unique(user_id, lesson_id)
);

-- ── Notes ────────────────────────────────────────────────────
create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  lesson_id  uuid not null references public.lessons(id) on delete cascade,
  content    text not null default '',
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

-- ── Q&A ──────────────────────────────────────────────────────
create table public.questions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  course_id     uuid not null references public.courses(id) on delete cascade,
  content       text not null,
  answer        text,
  answered_by   uuid references public.profiles(id),
  answered_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- ── Certificates ─────────────────────────────────────────────
create table public.certificates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  course_id    uuid not null references public.courses(id) on delete cascade,
  verify_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  issued_at    timestamptz not null default now(),
  pdf_url      text,
  unique(user_id, course_id)
);

-- ═══════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.sections enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.notes enable row level security;
alter table public.questions enable row level security;
alter table public.certificates enable row level security;

-- Profiles
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Courses & Sections & Lessons (public read for published)
create policy "Anyone can read published courses" on public.courses
  for select using (is_published = true);
create policy "Anyone can read sections" on public.sections
  for select using (true);
create policy "Anyone can read published lessons" on public.lessons
  for select using (is_published = true);
create policy "Admins can manage courses" on public.courses
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admins can manage sections" on public.sections
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admins can manage lessons" on public.lessons
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Enrollments
create policy "Users can view own enrollments" on public.enrollments
  for select using (auth.uid() = user_id);
create policy "Users can enroll themselves" on public.enrollments
  for insert with check (auth.uid() = user_id);
create policy "Admins can view all enrollments" on public.enrollments
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Lesson Progress
create policy "Users can manage own progress" on public.lesson_progress
  for all using (auth.uid() = user_id);
create policy "Admins can view all progress" on public.lesson_progress
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Notes
create policy "Users can manage own notes" on public.notes
  for all using (auth.uid() = user_id);

-- Questions
create policy "Enrolled users can read questions" on public.questions
  for select using (
    exists (select 1 from public.enrollments where user_id = auth.uid() and course_id = questions.course_id)
  );
create policy "Enrolled users can post questions" on public.questions
  for insert with check (
    auth.uid() = user_id and
    exists (select 1 from public.enrollments where user_id = auth.uid() and course_id = questions.course_id)
  );
create policy "Admins can manage all questions" on public.questions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Certificates
create policy "Users can view own certificates" on public.certificates
  for select using (auth.uid() = user_id);
create policy "Certificates are publicly verifiable" on public.certificates
  for select using (true);
create policy "Admins can manage certificates" on public.certificates
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ═══════════════════════════════════════════════════════════
-- Useful views
-- ═══════════════════════════════════════════════════════════

create or replace view public.course_progress_summary as
select
  e.user_id,
  e.course_id,
  count(l.id) as total_lessons,
  count(lp.id) filter (where lp.is_completed = true) as completed_lessons,
  round(
    count(lp.id) filter (where lp.is_completed = true) * 100.0 / nullif(count(l.id), 0)
  ) as progress_percent
from public.enrollments e
join public.lessons l on l.course_id = e.course_id and l.is_published = true
left join public.lesson_progress lp on lp.lesson_id = l.id and lp.user_id = e.user_id
group by e.user_id, e.course_id;
