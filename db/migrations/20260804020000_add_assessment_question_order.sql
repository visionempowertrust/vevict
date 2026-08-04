alter table assessment_questions
add column if not exists question_order integer not null default 1 check (question_order >= 1);

create index if not exists assessment_questions_order_idx
on assessment_questions(question_level, question_order);
