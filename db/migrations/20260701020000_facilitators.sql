-- Facilitators available for session entry, filtered by the selected state.
create table if not exists facilitators (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (state, name)
);

create index if not exists facilitators_state_idx on facilitators(state, active, name);

drop trigger if exists facilitators_set_updated_at on facilitators;
create trigger facilitators_set_updated_at
before update on facilitators
for each row
execute function set_updated_at();

alter table facilitators enable row level security;

drop policy if exists "prototype read facilitators" on facilitators;
create policy "prototype read facilitators" on facilitators for select using (true);

drop policy if exists "prototype write facilitators" on facilitators;
create policy "prototype write facilitators" on facilitators for all using (true) with check (true);

-- Add facilitators with, for example:
-- insert into facilitators (state, name) values ('Karnataka', 'Facilitator name');

-- rollback
-- drop table if exists facilitators;