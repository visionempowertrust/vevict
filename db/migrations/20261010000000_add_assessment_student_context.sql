alter table assessment_entries
  add column if not exists other_physical_disabilities text,
  add column if not exists cognitive_disabilities text,
  add column if not exists years_in_vict_program integer,
  add column if not exists level_selection_reason text;

alter table assessment_entries
  drop constraint if exists assessment_entries_other_physical_disabilities_check,
  drop constraint if exists assessment_entries_cognitive_disabilities_check,
  drop constraint if exists assessment_entries_years_in_vict_program_check,
  drop constraint if exists assessment_entries_level_selection_reason_check;

alter table assessment_entries
  add constraint assessment_entries_other_physical_disabilities_check
    check (other_physical_disabilities is null or other_physical_disabilities in ('Yes', 'No', 'Not known')),
  add constraint assessment_entries_cognitive_disabilities_check
    check (cognitive_disabilities is null or cognitive_disabilities in ('Yes', 'No', 'Not known')),
  add constraint assessment_entries_years_in_vict_program_check
    check (years_in_vict_program is null or years_in_vict_program >= 0),
  add constraint assessment_entries_level_selection_reason_check
    check (level_selection_reason is null or level_selection_reason in (
      'Based on number of years in VICT program',
      'Based on the grade',
      'Based on the perceived ability'
    ));

notify pgrst, 'reload schema';
