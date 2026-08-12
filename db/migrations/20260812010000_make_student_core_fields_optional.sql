-- migrate:up

alter table registered_students
  alter column district drop not null,
  alter column gender drop not null,
  alter column vision_level drop not null;

alter table assessment_entries
  alter column district drop not null;

-- migrate:down

update registered_students
set
  district = coalesce(district, ''),
  gender = coalesce(gender, 'Female'),
  vision_level = coalesce(vision_level, 'Completely blind');

alter table registered_students
  alter column district set not null,
  alter column gender set not null,
  alter column vision_level set not null;

update assessment_entries
set district = coalesce(district, '');

alter table assessment_entries
  alter column district set not null;
