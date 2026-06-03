create extension if not exists pgcrypto;

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  school text,
  level text,
  access_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  session_date date not null,
  mode text,
  game text not null,
  category text,
  facilitator text,
  kli_evidence_items text[] not null default '{}',
  kli_evidence_notes text,
  kli_evidence text,
  observation text,
  scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sessions_student_date_idx on sessions(student_id, session_date desc);
create index if not exists students_school_idx on students(school);

create table if not exists skills (
  skill_code text primary key,
  skill_category text not null,
  skill_name text not null,
  sub_skills text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists skill_levels (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'FONS',
  skill_code text not null references skills(skill_code) on delete cascade,
  skill_name text not null,
  level text not null,
  key_learning_indicator_code text not null,
  key_learning_indicators text not null,
  created_at timestamptz not null default now()
);

create index if not exists skill_levels_skill_code_idx on skill_levels(skill_code, level);

create table if not exists games (
  game_code text primary key,
  category text,
  game text not null,
  general_information text,
  overview_rules text,
  play_session_plans text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_application_levels (
  id uuid primary key default gen_random_uuid(),
  game_code text not null references games(game_code) on delete cascade,
  category text,
  game text not null,
  skill_code text not null references skills(skill_code) on delete cascade,
  key_learning_indicator_codes text,
  game_application text,
  created_at timestamptz not null default now()
);

create index if not exists game_application_levels_game_code_idx on game_application_levels(game_code);
create index if not exists game_application_levels_skill_code_idx on game_application_levels(skill_code);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists students_set_updated_at on students;
create trigger students_set_updated_at
before update on students
for each row
execute function set_updated_at();

drop trigger if exists skills_set_updated_at on skills;
create trigger skills_set_updated_at
before update on skills
for each row
execute function set_updated_at();

drop trigger if exists games_set_updated_at on games;
create trigger games_set_updated_at
before update on games
for each row
execute function set_updated_at();

alter table students enable row level security;
alter table sessions enable row level security;
alter table skills enable row level security;
alter table skill_levels enable row level security;
alter table games enable row level security;
alter table game_application_levels enable row level security;

-- Development policy for this static prototype.
-- Replace with authenticated school/facilitator policies before using real student data.
drop policy if exists "prototype read students" on students;
create policy "prototype read students" on students for select using (true);

drop policy if exists "prototype write students" on students;
create policy "prototype write students" on students for all using (true) with check (true);

drop policy if exists "prototype read sessions" on sessions;
create policy "prototype read sessions" on sessions for select using (true);

drop policy if exists "prototype write sessions" on sessions;
create policy "prototype write sessions" on sessions for all using (true) with check (true);

drop policy if exists "prototype read skills" on skills;
create policy "prototype read skills" on skills for select using (true);

drop policy if exists "prototype write skills" on skills;
create policy "prototype write skills" on skills for all using (true) with check (true);

drop policy if exists "prototype read skill levels" on skill_levels;
create policy "prototype read skill levels" on skill_levels for select using (true);

drop policy if exists "prototype write skill levels" on skill_levels;
create policy "prototype write skill levels" on skill_levels for all using (true) with check (true);

drop policy if exists "prototype read games" on games;
create policy "prototype read games" on games for select using (true);

drop policy if exists "prototype write games" on games;
create policy "prototype write games" on games for all using (true) with check (true);

drop policy if exists "prototype read game application levels" on game_application_levels;
create policy "prototype read game application levels" on game_application_levels for select using (true);

drop policy if exists "prototype write game application levels" on game_application_levels;
create policy "prototype write game application levels" on game_application_levels for all using (true) with check (true);
