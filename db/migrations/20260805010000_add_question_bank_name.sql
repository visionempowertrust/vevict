alter table assessment_questions
add column if not exists question_bank_name text not null default 'CT Assessment Question Set 2026';

update assessment_questions
set question_bank_name = 'CT Assessment Question Set 2026'
where nullif(trim(question_bank_name), '') is null;

create index if not exists assessment_questions_bank_idx
on assessment_questions(question_bank_name);
