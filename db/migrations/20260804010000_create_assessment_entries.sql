alter table assessment_questions
add column if not exists question_theme text not null default 'General';

alter table assessment_questions
add column if not exists outcome_code text references ct_outcomes(outcome_code) on delete set null;

create index if not exists assessment_questions_theme_idx on assessment_questions(question_level, question_theme);

create table if not exists assessment_entries (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  district text not null,
  school text not null,
  student_id uuid references registered_students(id) on delete set null,
  student_name text not null,
  assessment_date date not null,
  facilitator text,
  assessment_level integer not null check (assessment_level in (1, 2, 3)),
  question_scores jsonb not null default '[]'::jsonb,
  free_play_assessment jsonb not null default '{}'::jsonb,
  qualitative_outcomes jsonb not null default '[]'::jsonb,
  other_observations text,
  accuracy_score text not null check (accuracy_score in ('High', 'Low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessment_entries_student_date_idx on assessment_entries(student_name, assessment_date desc);
create index if not exists assessment_entries_location_idx on assessment_entries(state, district, school);

drop trigger if exists assessment_entries_set_updated_at on assessment_entries;
create trigger assessment_entries_set_updated_at
before update on assessment_entries
for each row
execute function set_updated_at();

alter table assessment_entries enable row level security;

drop policy if exists "prototype read assessment entries" on assessment_entries;
create policy "prototype read assessment entries" on assessment_entries for select using (true);

drop policy if exists "prototype write assessment entries" on assessment_entries;
create policy "prototype write assessment entries" on assessment_entries for all using (true) with check (true);
