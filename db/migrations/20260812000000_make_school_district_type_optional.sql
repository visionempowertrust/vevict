-- migrate:up

alter table stemlab_schools
  alter column district drop not null,
  alter column school_type drop not null;

-- migrate:down

update stemlab_schools
set
  district = coalesce(district, ''),
  school_type = coalesce(school_type, 'Government');

alter table stemlab_schools
  alter column district set not null,
  alter column school_type set not null;
