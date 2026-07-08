-- Replace the Other Outcomes master with the approved mathematics areas.
delete from other_outcomes;

insert into other_outcomes (outcome_code, outcome_name, display_order) values
  ('OO-01', 'Number Sense', 1),
  ('OO-02', 'Basic Arithmetic', 2),
  ('OO-03', 'Advanced Arithmetic', 3),
  ('OO-04', 'Algebra', 4),
  ('OO-05', 'Measurement and Estimation', 5),
  ('OO-06', 'Money', 6),
  ('OO-07', 'Calendar - Date/ Time', 7),
  ('OO-08', 'Fractions', 8),
  ('OO-09', 'Geometry', 9),
  ('OO-10', 'Mensuration', 10),
  ('OO-11', 'Statistics/ Probability', 11);
