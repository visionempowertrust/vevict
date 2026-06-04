-- migrate:up
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

drop trigger if exists registered_students_set_updated_at on registered_students;
create trigger registered_students_set_updated_at
before update on registered_students
for each row
execute function set_updated_at();

alter table registered_students enable row level security;

drop policy if exists "prototype read registered students" on registered_students;
create policy "prototype read registered students" on registered_students for select using (true);

drop policy if exists "prototype write registered students" on registered_students;
create policy "prototype write registered students" on registered_students for all using (true) with check (true);

-- migrate:down
drop table if exists registered_students;
