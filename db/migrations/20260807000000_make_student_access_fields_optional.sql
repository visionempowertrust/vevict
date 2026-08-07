-- migrate:up

alter table registered_students
  alter column other_physical_disabilities drop not null,
  alter column cognitive_disabilities drop not null,
  alter column is_braille_literate drop not null,
  alter column braille_reading_level drop not null,
  alter column braille_writing_level drop not null,
  alter column knows_taylor_frame drop not null,
  alter column knows_nemeth drop not null,
  alter column knows_using_computer drop not null,
  alter column knows_maths_on_computer drop not null;

-- migrate:down

update registered_students
set
  other_physical_disabilities = coalesce(other_physical_disabilities, 'No'),
  cognitive_disabilities = coalesce(cognitive_disabilities, 'No'),
  is_braille_literate = coalesce(is_braille_literate, 'No'),
  braille_reading_level = coalesce(braille_reading_level, 'Letters'),
  braille_writing_level = coalesce(braille_writing_level, 'Letters'),
  knows_taylor_frame = coalesce(knows_taylor_frame, 'No'),
  knows_nemeth = coalesce(knows_nemeth, 'No'),
  knows_using_computer = coalesce(knows_using_computer, 'No'),
  knows_maths_on_computer = coalesce(knows_maths_on_computer, 'No');

alter table registered_students
  alter column other_physical_disabilities set not null,
  alter column cognitive_disabilities set not null,
  alter column is_braille_literate set not null,
  alter column braille_reading_level set not null,
  alter column braille_writing_level set not null,
  alter column knows_taylor_frame set not null,
  alter column knows_nemeth set not null,
  alter column knows_using_computer set not null,
  alter column knows_maths_on_computer set not null;
