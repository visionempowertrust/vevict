alter table assessment_entries
  add column if not exists duration_minutes integer;

alter table assessment_entries
  drop constraint if exists assessment_entries_duration_minutes_check;

alter table assessment_entries
  add constraint assessment_entries_duration_minutes_check
  check (duration_minutes is null or duration_minutes > 0);

notify pgrst, 'reload schema';
