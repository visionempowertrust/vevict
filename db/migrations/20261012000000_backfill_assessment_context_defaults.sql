begin;

alter table assessment_entries
  drop constraint if exists assessment_entries_level_selection_reason_check;

update assessment_entries
set
  other_physical_disabilities = coalesce(other_physical_disabilities, 'Not known'),
  cognitive_disabilities = coalesce(cognitive_disabilities, 'Not known'),
  years_in_vict_program = coalesce(years_in_vict_program, 0),
  level_selection_reason = coalesce(level_selection_reason, 'Not known')
where other_physical_disabilities is null
   or cognitive_disabilities is null
   or years_in_vict_program is null
   or level_selection_reason is null;

alter table assessment_entries
  alter column other_physical_disabilities set default 'Not known',
  alter column cognitive_disabilities set default 'Not known',
  alter column years_in_vict_program set default 0,
  alter column level_selection_reason set default 'Not known';

alter table assessment_entries
  add constraint assessment_entries_level_selection_reason_check
    check (level_selection_reason is null or level_selection_reason in (
      'Not known',
      'Based on number of years in VICT program',
      'Based on the grade',
      'Based on the perceived ability'
    ));

notify pgrst, 'reload schema';

commit;
