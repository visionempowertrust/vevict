alter table assessment_entries
add column if not exists question_alterations jsonb not null default '[]'::jsonb;
