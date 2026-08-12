create table if not exists assessment_question_banks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  language text not null default 'English',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessment_question_banks_language_idx
on assessment_question_banks(language);

drop trigger if exists assessment_question_banks_set_updated_at on assessment_question_banks;
create trigger assessment_question_banks_set_updated_at
before update on assessment_question_banks
for each row
execute function set_updated_at();

alter table assessment_question_banks enable row level security;

drop policy if exists "prototype read assessment question banks" on assessment_question_banks;
create policy "prototype read assessment question banks" on assessment_question_banks
for select using (true);

drop policy if exists "prototype write assessment question banks" on assessment_question_banks;
create policy "prototype write assessment question banks" on assessment_question_banks
for all using (true) with check (true);

insert into assessment_question_banks (name, language)
values ('CT Assessment Question Set 2026', 'English')
on conflict (name) do nothing;

alter table assessment_questions
add column if not exists question_bank_name text not null default 'CT Assessment Question Set 2026',
add column if not exists question_bank_language text not null default 'English';

insert into assessment_question_banks (name, language)
select distinct
  coalesce(nullif(trim(question_bank_name), ''), 'CT Assessment Question Set 2026') as name,
  coalesce(nullif(trim(question_bank_language), ''), 'English') as language
from assessment_questions
where question_bank_name is not null
on conflict (name) do update
set
  language = excluded.language,
  updated_at = now();

alter table assessment_questions
add column if not exists question_bank_id uuid;

update assessment_questions questions
set question_bank_id = banks.id
from assessment_question_banks banks
where
  questions.question_bank_id is null
  and banks.name = coalesce(nullif(trim(questions.question_bank_name), ''), 'CT Assessment Question Set 2026');

update assessment_questions
set question_bank_id = (select id from assessment_question_banks where name = 'CT Assessment Question Set 2026')
where question_bank_id is null;

alter table assessment_questions
alter column question_bank_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessment_questions_question_bank_id_fkey'
  ) then
    alter table assessment_questions
    add constraint assessment_questions_question_bank_id_fkey
    foreign key (question_bank_id)
    references assessment_question_banks(id)
    on delete cascade;
  end if;
end $$;

drop index if exists assessment_questions_bank_language_idx;
drop index if exists assessment_questions_bank_idx;

create index if not exists assessment_questions_bank_idx
on assessment_questions(question_bank_id);

alter table assessment_questions
drop column if exists question_bank_name,
drop column if exists question_bank_language;
