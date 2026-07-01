-- Shared school and facilitator registration tables used by the STEM Lab and VICT.
create table if not exists stemlab_schools (
  id text primary key,
  state text not null,
  district text not null,
  school_name text not null,
  address text,
  school_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stemlab_facilitators (
  id text primary key,
  state text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  alternate_phone text,
  designation text,
  qualification text,
  is_special_educator boolean not null default false,
  is_educator boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stemlab_schools_location_idx on stemlab_schools(state, district, school_name);
create index if not exists stemlab_facilitators_state_idx on stemlab_facilitators(state, first_name, last_name);

alter table stemlab_schools enable row level security;
alter table stemlab_facilitators enable row level security;



-- This migration does not create public access policies. Reuse the existing STEM Lab
-- policies in the shared project or add authenticated role policies before use.
