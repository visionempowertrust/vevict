create table if not exists assessment_questions (
  id uuid primary key default gen_random_uuid(),
  question_level integer not null check (question_level in (1, 2, 3)),
  question_theme text not null default 'General',
  outcome_code text references ct_outcomes(outcome_code) on delete set null,
  question_text text not null,
  image_data_url text,
  image_name text,
  correct_answer text not null,
  total_marks numeric(8, 2) not null check (total_marks >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessment_questions_level_idx on assessment_questions(question_level, created_at desc);
create index if not exists assessment_questions_theme_idx on assessment_questions(question_level, question_theme);

drop trigger if exists assessment_questions_set_updated_at on assessment_questions;
create trigger assessment_questions_set_updated_at
before update on assessment_questions
for each row
execute function set_updated_at();

alter table assessment_questions enable row level security;

drop policy if exists "prototype read assessment questions" on assessment_questions;
create policy "prototype read assessment questions" on assessment_questions for select using (true);

drop policy if exists "prototype write assessment questions" on assessment_questions;
create policy "prototype write assessment questions" on assessment_questions for all using (true) with check (true);
