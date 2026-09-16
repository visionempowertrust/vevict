alter table assessment_entries
  add column if not exists observation_details jsonb not null default '{}'::jsonb;
