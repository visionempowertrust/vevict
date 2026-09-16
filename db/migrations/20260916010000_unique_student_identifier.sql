-- Retain the earliest student row for each case-insensitive, trimmed Student ID.
-- Assessment records linked to duplicates are redirected before deletion.
with ranked_students as (
  select
    id,
    first_value(id) over (
      partition by lower(btrim(student_identifier))
      order by created_at nulls last, id
    ) as retained_id,
    row_number() over (
      partition by lower(btrim(student_identifier))
      order by created_at nulls last, id
    ) as duplicate_rank
  from registered_students
  where nullif(btrim(student_identifier), '') is not null
)
update assessment_entries as assessments
set student_id = ranked.retained_id
from ranked_students as ranked
where ranked.duplicate_rank > 1
  and assessments.student_id = ranked.id;

with ranked_students as (
  select
    id,
    row_number() over (
      partition by lower(btrim(student_identifier))
      order by created_at nulls last, id
    ) as duplicate_rank
  from registered_students
  where nullif(btrim(student_identifier), '') is not null
)
delete from registered_students as students
using ranked_students as ranked
where students.id = ranked.id
  and ranked.duplicate_rank > 1;

drop index if exists registered_students_identifier_idx;

create unique index if not exists registered_students_identifier_unique_idx
on registered_students (lower(btrim(student_identifier)))
where nullif(btrim(student_identifier), '') is not null;
