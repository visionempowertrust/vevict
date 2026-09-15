-- Require Student ID for all new and updated registrations while retaining
-- legacy rows that may not have an identifier yet.
alter table registered_students
  drop constraint if exists registered_students_student_identifier_required;

alter table registered_students
  add constraint registered_students_student_identifier_required
  check (nullif(btrim(student_identifier), '') is not null)
  not valid;
