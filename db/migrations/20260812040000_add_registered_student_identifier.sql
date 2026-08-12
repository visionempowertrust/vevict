alter table registered_students
add column if not exists student_identifier text;

create index if not exists registered_students_identifier_idx
on registered_students(student_identifier);
