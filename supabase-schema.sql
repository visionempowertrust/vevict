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

create table if not exists ct_outcomes (
  outcome_code text primary key,
  outcome_name text not null,
  emerging_description text not null,
  developing_description text not null,
  independent_description text not null,
  extending_description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ct_suboutcomes (
  suboutcome_code text primary key,
  outcome_code text not null references ct_outcomes(outcome_code) on delete cascade,
  suboutcome_name text not null,
  suboutcome_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assessment_rubric (
  scale integer primary key check (scale between 1 and 4),
  scale_name text not null,
  meaning text not null,
  general_marking_principle text not null,
  field_observation_guidance text not null
);

create table if not exists general_outcomes (
  outcome_code text primary key,
  outcome_name text not null unique,
  display_order integer not null
);

create table if not exists other_outcomes (
  outcome_code text primary key,
  outcome_name text not null unique,
  display_order integer not null
);

create table if not exists games (
  game_code text primary key,
  category text,
  game text not null,
  general_information text,
  overview_rules text,
  play_session_plans text,
  source_url text,
  difficulty_level text,
  primary_ct_outcome_code text references ct_outcomes(outcome_code) on delete set null,
  primary_ct_observation text,
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
  common_observations jsonb not null default '{}'::jsonb,
  general_outcome_ratings jsonb not null default '{}'::jsonb,
  primary_ct_rating jsonb not null default '{}'::jsonb,
  selected_ct_suboutcomes jsonb not null default '[]'::jsonb,
  other_outcome_ratings jsonb not null default '{}'::jsonb,
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
create index if not exists ct_suboutcomes_outcome_code_idx on ct_suboutcomes(outcome_code);
create index if not exists games_primary_ct_outcome_code_idx on games(primary_ct_outcome_code);

create table if not exists registered_students (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  district text not null,
  school text not null,
  name text not null,
  gender text not null check (gender in ('Male', 'Female')),
  grade integer not null check (grade between 1 and 10),
  board_of_education text,
  vision_level text not null check (vision_level in ('Completely blind', 'Low Vision')),
  regional_language text,
  other_physical_disabilities text not null check (other_physical_disabilities in ('Yes', 'No')),
  cognitive_disabilities text not null check (cognitive_disabilities in ('Yes', 'No')),
  is_braille_literate text not null check (is_braille_literate in ('Yes', 'No')),
  braille_reading_level text not null check (braille_reading_level in ('Letters', 'Words', 'Sentences')),
  braille_writing_level text not null check (braille_writing_level in ('Letters', 'Words', 'Sentences')),
  knows_taylor_frame text not null check (knows_taylor_frame in ('Yes', 'No')),
  knows_nemeth text not null check (knows_nemeth in ('Yes', 'No')),
  knows_using_computer text not null check (knows_using_computer in ('Yes', 'No')),
  knows_maths_on_computer text not null check (knows_maths_on_computer in ('Yes', 'No')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists registered_students_location_idx on registered_students(state, district, school);
create index if not exists registered_students_name_idx on registered_students(name);
-- Shared school and facilitator registration tables used by the STEM Lab and VICT.
create table if not exists stemlab_schools (
  id text primary key,
  state text not null,
  district text not null,
  school_name text not null,
  address text,
  school_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stemlab_facilitators (
  id text primary key,
  state text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  alternate_phone text,
  designation text,
  qualification text,
  is_special_educator boolean not null default false,
  is_educator boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stemlab_schools_location_idx on stemlab_schools(state, district, school_name);
create index if not exists stemlab_facilitators_state_idx on stemlab_facilitators(state, first_name, last_name);

alter table stemlab_schools enable row level security;
alter table stemlab_facilitators enable row level security;

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  category text,
  question text not null,
  answer text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faqs_order_idx on faqs(display_order, question);
create index if not exists faqs_active_idx on faqs(is_active, display_order);

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

drop trigger if exists ct_outcomes_set_updated_at on ct_outcomes;
create trigger ct_outcomes_set_updated_at
before update on ct_outcomes
for each row
execute function set_updated_at();

drop trigger if exists ct_suboutcomes_set_updated_at on ct_suboutcomes;
create trigger ct_suboutcomes_set_updated_at
before update on ct_suboutcomes
for each row
execute function set_updated_at();

drop trigger if exists registered_students_set_updated_at on registered_students;
create trigger registered_students_set_updated_at
before update on registered_students
for each row
execute function set_updated_at();

drop trigger if exists facilitators_set_updated_at on facilitators;
create trigger facilitators_set_updated_at
before update on facilitators
for each row
execute function set_updated_at();

drop trigger if exists faqs_set_updated_at on faqs;
create trigger faqs_set_updated_at
before update on faqs
for each row
execute function set_updated_at();

drop trigger if exists assessment_questions_set_updated_at on assessment_questions;
create trigger assessment_questions_set_updated_at
before update on assessment_questions
for each row
execute function set_updated_at();

drop trigger if exists assessment_entries_set_updated_at on assessment_entries;
create trigger assessment_entries_set_updated_at
before update on assessment_entries
for each row
execute function set_updated_at();
alter table students enable row level security;
alter table sessions enable row level security;
alter table skills enable row level security;
alter table skill_levels enable row level security;
alter table games enable row level security;
alter table game_application_levels enable row level security;
alter table facilitator_sessions enable row level security;
alter table facilitator_session_level_statuses enable row level security;
alter table registered_students enable row level security;
alter table facilitators enable row level security;
alter table ct_outcomes enable row level security;
alter table ct_suboutcomes enable row level security;
alter table assessment_rubric enable row level security;
alter table general_outcomes enable row level security;
alter table other_outcomes enable row level security;
alter table faqs enable row level security;
alter table assessment_questions enable row level security;
alter table assessment_entries enable row level security;

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

drop policy if exists "prototype read facilitator sessions" on facilitator_sessions;
create policy "prototype read facilitator sessions" on facilitator_sessions for select using (true);

drop policy if exists "prototype write facilitator sessions" on facilitator_sessions;
create policy "prototype write facilitator sessions" on facilitator_sessions for all using (true) with check (true);

drop policy if exists "prototype read facilitator session statuses" on facilitator_session_level_statuses;
create policy "prototype read facilitator session statuses" on facilitator_session_level_statuses for select using (true);

drop policy if exists "prototype write facilitator session statuses" on facilitator_session_level_statuses;
create policy "prototype write facilitator session statuses" on facilitator_session_level_statuses for all using (true) with check (true);

drop policy if exists "prototype read registered students" on registered_students;
create policy "prototype read registered students" on registered_students for select using (true);

drop policy if exists "prototype write registered students" on registered_students;
create policy "prototype write registered students" on registered_students for all using (true) with check (true);
drop policy if exists "prototype read facilitators" on facilitators;
create policy "prototype read facilitators" on facilitators for select using (true);

drop policy if exists "prototype write facilitators" on facilitators;
create policy "prototype write facilitators" on facilitators for all using (true) with check (true);

drop policy if exists "prototype read ct outcomes" on ct_outcomes;
create policy "prototype read ct outcomes" on ct_outcomes for select using (true);
drop policy if exists "prototype write ct outcomes" on ct_outcomes;
create policy "prototype write ct outcomes" on ct_outcomes for all using (true) with check (true);

drop policy if exists "prototype read ct suboutcomes" on ct_suboutcomes;
create policy "prototype read ct suboutcomes" on ct_suboutcomes for select using (true);
drop policy if exists "prototype write ct suboutcomes" on ct_suboutcomes;
create policy "prototype write ct suboutcomes" on ct_suboutcomes for all using (true) with check (true);

drop policy if exists "prototype read assessment rubric" on assessment_rubric;
create policy "prototype read assessment rubric" on assessment_rubric for select using (true);
drop policy if exists "prototype write assessment rubric" on assessment_rubric;
create policy "prototype write assessment rubric" on assessment_rubric for all using (true) with check (true);

drop policy if exists "prototype read general outcomes" on general_outcomes;
create policy "prototype read general outcomes" on general_outcomes for select using (true);
drop policy if exists "prototype write general outcomes" on general_outcomes;
create policy "prototype write general outcomes" on general_outcomes for all using (true) with check (true);

drop policy if exists "prototype read other outcomes" on other_outcomes;
create policy "prototype read other outcomes" on other_outcomes for select using (true);
drop policy if exists "prototype write other outcomes" on other_outcomes;
create policy "prototype write other outcomes" on other_outcomes for all using (true) with check (true);

drop policy if exists "prototype read faqs" on faqs;
create policy "prototype read faqs" on faqs for select using (true);
drop policy if exists "prototype write faqs" on faqs;
create policy "prototype write faqs" on faqs for all using (true) with check (true);

drop policy if exists "prototype read assessment questions" on assessment_questions;
create policy "prototype read assessment questions" on assessment_questions for select using (true);
drop policy if exists "prototype write assessment questions" on assessment_questions;
create policy "prototype write assessment questions" on assessment_questions for all using (true) with check (true);

drop policy if exists "prototype read assessment entries" on assessment_entries;
create policy "prototype read assessment entries" on assessment_entries for select using (true);
drop policy if exists "prototype write assessment entries" on assessment_entries;
create policy "prototype write assessment entries" on assessment_entries for all using (true) with check (true);
