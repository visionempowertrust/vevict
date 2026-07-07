-- Replace Logical Reasoning suboutcomes with the approved four-item master list.
delete from ct_suboutcomes where outcome_code = 'CT-LOG';

insert into ct_suboutcomes (suboutcome_code, outcome_code, suboutcome_name, suboutcome_description) values
  ('CT-LOG-SO1', 'CT-LOG', 'Classifies systematically', 'Sorts objects or states using a consistent property'),
  ('CT-LOG-SO2', 'CT-LOG', 'Identifies correlation', 'Analyzes the evidence to arrive at correlation among various properties'),
  ('CT-LOG-SO3', 'CT-LOG', 'Draws an inference', 'Reaches a reasonable conclusion from available evidence'),
  ('CT-LOG-SO4', 'CT-LOG', 'Compares strategies', 'Identifies strengths and limitations of various approaches');
