alter table registered_students
  drop constraint if exists registered_students_grade_check;

alter table registered_students
  add constraint registered_students_grade_check
  check (grade between 0 and 12);
