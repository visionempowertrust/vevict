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

alter table students enable row level security;
alter table sessions enable row level security;

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
