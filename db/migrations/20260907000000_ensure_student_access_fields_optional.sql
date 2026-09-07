alter table registered_students
  alter column district drop not null,
  alter column gender drop not null,
  alter column vision_level drop not null,
  alter column other_physical_disabilities drop not null,
  alter column cognitive_disabilities drop not null,
  alter column is_braille_literate drop not null,
  alter column braille_reading_level drop not null,
  alter column braille_writing_level drop not null,
  alter column knows_taylor_frame drop not null,
  alter column knows_nemeth drop not null,
  alter column knows_using_computer drop not null,
  alter column knows_maths_on_computer drop not null;

alter table registered_students
  drop constraint if exists registered_students_gender_check;

alter table registered_students
  add constraint registered_students_gender_check
  check (gender is null or gender in ('Male', 'Female'));
