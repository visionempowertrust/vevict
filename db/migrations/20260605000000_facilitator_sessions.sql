-- migrate:up
create table if not exists facilitator_sessions (
  id uuid primary key default gen_random_uuid(),
  state text,
  district text,
  school text,
  session_date date not null,
  facilitator text,
  student_name text not null,
  game_code text not null references games(game_code) on delete restrict,
  game text not null,
  comments text,
  confidence_score integer not null check (confidence_score between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists facilitator_session_level_statuses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references facilitator_sessions(id) on delete cascade,
  game_application_level_id uuid references game_application_levels(id) on delete set null,
  game_code text not null,
  skill_code text not null references skills(skill_code) on delete restrict,
  key_learning_indicator_codes text,
  game_application text,
  status text not null check (status in ('Yet to start', 'In Progress', 'Acquired', 'Not applicable')),
  created_at timestamptz not null default now()
);

create index if not exists facilitator_sessions_student_date_idx on facilitator_sessions(student_name, session_date desc);
create index if not exists facilitator_sessions_game_code_idx on facilitator_sessions(game_code);
create index if not exists facilitator_session_statuses_session_idx on facilitator_session_level_statuses(session_id);

alter table facilitator_sessions enable row level security;
alter table facilitator_session_level_statuses enable row level security;

drop policy if exists "prototype read facilitator sessions" on facilitator_sessions;
create policy "prototype read facilitator sessions" on facilitator_sessions for select using (true);

drop policy if exists "prototype write facilitator sessions" on facilitator_sessions;
create policy "prototype write facilitator sessions" on facilitator_sessions for all using (true) with check (true);

drop policy if exists "prototype read facilitator session statuses" on facilitator_session_level_statuses;
create policy "prototype read facilitator session statuses" on facilitator_session_level_statuses for select using (true);

drop policy if exists "prototype write facilitator session statuses" on facilitator_session_level_statuses;
create policy "prototype write facilitator session statuses" on facilitator_session_level_statuses for all using (true) with check (true);

-- migrate:down
drop table if exists facilitator_session_level_statuses;
drop table if exists facilitator_sessions;
