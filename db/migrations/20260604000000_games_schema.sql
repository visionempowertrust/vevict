-- migrate:up
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

drop trigger if exists games_set_updated_at on games;
create trigger games_set_updated_at
before update on games
for each row
execute function set_updated_at();

alter table games enable row level security;
alter table game_application_levels enable row level security;

drop policy if exists "prototype read games" on games;
create policy "prototype read games" on games for select using (true);

drop policy if exists "prototype write games" on games;
create policy "prototype write games" on games for all using (true) with check (true);

drop policy if exists "prototype read game application levels" on game_application_levels;
create policy "prototype read game application levels" on game_application_levels for select using (true);

drop policy if exists "prototype write game application levels" on game_application_levels;
create policy "prototype write game application levels" on game_application_levels for all using (true) with check (true);

-- migrate:down
drop table if exists game_application_levels;
drop table if exists games;
