-- Merge Evaluation into Logical Reasoning and preserve its observable subskills.
update games
set primary_ct_outcome_code = 'CT-LOG'
where primary_ct_outcome_code = 'CT-EVA';

insert into ct_suboutcomes (suboutcome_code, outcome_code, suboutcome_name, suboutcome_description) values
  ('CT-LOG-SO5', 'CT-LOG', 'Checks against the goal', 'Compares the result with the game objective or success condition'),
  ('CT-LOG-SO6', 'CT-LOG', 'Compares strategies', 'Identifies strengths and limitations of two approaches'),
  ('CT-LOG-SO7', 'CT-LOG', 'Considers efficiency', 'Notices time, number of moves, effort or materials used'),
  ('CT-LOG-SO8', 'CT-LOG', 'Considers accessibility and fairness', 'Notices whether rules, materials and participation work for everyone')
on conflict (suboutcome_code) do update set
  outcome_code = excluded.outcome_code,
  suboutcome_name = excluded.suboutcome_name,
  suboutcome_description = excluded.suboutcome_description;

update facilitator_sessions
set primary_ct_rating = jsonb_set(
  jsonb_set(primary_ct_rating, '{outcomeCode}', '"CT-LOG"'::jsonb),
  '{outcomeName}', '"Logical Reasoning"'::jsonb
)
where primary_ct_rating->>'outcomeCode' = 'CT-EVA';

delete from ct_suboutcomes where outcome_code = 'CT-EVA';
delete from ct_outcomes where outcome_code = 'CT-EVA';
