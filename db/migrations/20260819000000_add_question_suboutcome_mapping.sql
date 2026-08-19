alter table assessment_questions
add column if not exists tested_suboutcome_codes jsonb not null default '[]'::jsonb;

create index if not exists assessment_questions_tested_suboutcomes_idx
on assessment_questions using gin (tested_suboutcome_codes);
