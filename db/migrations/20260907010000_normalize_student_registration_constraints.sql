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
  drop constraint if exists registered_students_gender_check,
  drop constraint if exists registered_students_vision_level_check,
  drop constraint if exists registered_students_other_physical_disabilities_check,
  drop constraint if exists registered_students_cognitive_disabilities_check,
  drop constraint if exists registered_students_is_braille_literate_check,
  drop constraint if exists registered_students_braille_reading_level_check,
  drop constraint if exists registered_students_braille_writing_level_check,
  drop constraint if exists registered_students_knows_taylor_frame_check,
  drop constraint if exists registered_students_knows_nemeth_check,
  drop constraint if exists registered_students_knows_using_computer_check,
  drop constraint if exists registered_students_knows_maths_on_computer_check;

alter table registered_students
  add constraint registered_students_gender_check check (gender is null or gender in ('Male', 'Female')),
  add constraint registered_students_vision_level_check check (vision_level is null or vision_level in ('Completely blind', 'Low Vision')),
  add constraint registered_students_other_physical_disabilities_check check (other_physical_disabilities is null or other_physical_disabilities in ('Yes', 'No')),
  add constraint registered_students_cognitive_disabilities_check check (cognitive_disabilities is null or cognitive_disabilities in ('Yes', 'No')),
  add constraint registered_students_is_braille_literate_check check (is_braille_literate is null or is_braille_literate in ('Yes', 'No')),
  add constraint registered_students_braille_reading_level_check check (braille_reading_level is null or braille_reading_level in ('Letters', 'Words', 'Sentences')),
  add constraint registered_students_braille_writing_level_check check (braille_writing_level is null or braille_writing_level in ('Letters', 'Words', 'Sentences')),
  add constraint registered_students_knows_taylor_frame_check check (knows_taylor_frame is null or knows_taylor_frame in ('Yes', 'No')),
  add constraint registered_students_knows_nemeth_check check (knows_nemeth is null or knows_nemeth in ('Yes', 'No')),
  add constraint registered_students_knows_using_computer_check check (knows_using_computer is null or knows_using_computer in ('Yes', 'No')),
  add constraint registered_students_knows_maths_on_computer_check check (knows_maths_on_computer is null or knows_maths_on_computer in ('Yes', 'No'));
