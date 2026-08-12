-- Consolidated VICT Supabase migrations - UP ONLY
-- Run in Supabase SQL Editor. Generated from db/migrations in timestamp order.
-- Excludes any -- migrate:down rollback sections to avoid destructive drops.
-- Note: includes prototype public read/write RLS policies used by the current frontend-only app.


-- ============================================================================
-- Migration: 20260603000000_vict_schema.sql
-- ============================================================================
create extension if not exists pgcrypto;

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  school text,
  level text,
  access_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  session_date date not null,
  mode text,
  game text not null,
  category text,
  facilitator text,
  kli_evidence_items text[] not null default '{}',
  kli_evidence_notes text,
  kli_evidence text,
  observation text,
  scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sessions_student_date_idx on sessions(student_id, session_date desc);
create index if not exists students_school_idx on students(school);

create table if not exists skills (
  skill_code text primary key,
  skill_category text not null,
  skill_name text not null,
  sub_skills text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists skill_levels (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'FONS',
  skill_code text not null references skills(skill_code) on delete cascade,
  skill_name text not null,
  level text not null,
  key_learning_indicator_code text not null,
  key_learning_indicators text not null,
  created_at timestamptz not null default now()
);

create index if not exists skill_levels_skill_code_idx on skill_levels(skill_code, level);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists students_set_updated_at on students;
create trigger students_set_updated_at
before update on students
for each row
execute function set_updated_at();

drop trigger if exists skills_set_updated_at on skills;
create trigger skills_set_updated_at
before update on skills
for each row
execute function set_updated_at();

alter table students enable row level security;
alter table sessions enable row level security;
alter table skills enable row level security;
alter table skill_levels enable row level security;

drop policy if exists "prototype read students" on students;
create policy "prototype read students" on students for select using (true);

drop policy if exists "prototype write students" on students;
create policy "prototype write students" on students for all using (true) with check (true);

drop policy if exists "prototype read sessions" on sessions;
create policy "prototype read sessions" on sessions for select using (true);

drop policy if exists "prototype write sessions" on sessions;
create policy "prototype write sessions" on sessions for all using (true) with check (true);

drop policy if exists "prototype read skills" on skills;
create policy "prototype read skills" on skills for select using (true);

drop policy if exists "prototype write skills" on skills;
create policy "prototype write skills" on skills for all using (true) with check (true);

drop policy if exists "prototype read skill levels" on skill_levels;
create policy "prototype read skill levels" on skill_levels for select using (true);

drop policy if exists "prototype write skill levels" on skill_levels;
create policy "prototype write skill levels" on skill_levels for all using (true) with check (true);


-- ============================================================================
-- Migration: 20260604000000_games_schema.sql
-- ============================================================================
create table if not exists games (
  game_code text primary key,
  category text,
  game text not null,
  general_information text,
  overview_rules text,
  play_session_plans text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_application_levels (
  id uuid primary key default gen_random_uuid(),
  game_code text not null references games(game_code) on delete cascade,
  category text,
  game text not null,
  skill_code text not null references skills(skill_code) on delete cascade,
  key_learning_indicator_codes text,
  game_application text,
  created_at timestamptz not null default now()
);

create index if not exists game_application_levels_game_code_idx on game_application_levels(game_code);
create index if not exists game_application_levels_skill_code_idx on game_application_levels(skill_code);

drop trigger if exists games_set_updated_at on games;
create trigger games_set_updated_at
before update on games
for each row
execute function set_updated_at();

alter table games enable row level security;
alter table game_application_levels enable row level security;

drop policy if exists "prototype read games" on games;
create policy "prototype read games" on games for select using (true);

drop policy if exists "prototype write games" on games;
create policy "prototype write games" on games for all using (true) with check (true);

drop policy if exists "prototype read game application levels" on game_application_levels;
create policy "prototype read game application levels" on game_application_levels for select using (true);

drop policy if exists "prototype write game application levels" on game_application_levels;
create policy "prototype write game application levels" on game_application_levels for all using (true) with check (true);


-- ============================================================================
-- Migration: 20260605000000_facilitator_sessions.sql
-- ============================================================================
create table if not exists facilitator_sessions (
  id uuid primary key default gen_random_uuid(),
  state text,
  district text,
  school text,
  session_date date not null,
  facilitator text,
  student_name text not null,
  game_code text not null references games(game_code) on delete restrict,
  game text not null,
  comments text,
  confidence_score integer not null check (confidence_score between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists facilitator_session_level_statuses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references facilitator_sessions(id) on delete cascade,
  game_application_level_id uuid references game_application_levels(id) on delete set null,
  game_code text not null,
  skill_code text not null references skills(skill_code) on delete restrict,
  key_learning_indicator_codes text,
  game_application text,
  status text not null check (status in ('Yet to start', 'In Progress', 'Acquired', 'Not applicable')),
  created_at timestamptz not null default now()
);

create index if not exists facilitator_sessions_student_date_idx on facilitator_sessions(student_name, session_date desc);
create index if not exists facilitator_sessions_game_code_idx on facilitator_sessions(game_code);
create index if not exists facilitator_session_statuses_session_idx on facilitator_session_level_statuses(session_id);

alter table facilitator_sessions enable row level security;
alter table facilitator_session_level_statuses enable row level security;

drop policy if exists "prototype read facilitator sessions" on facilitator_sessions;
create policy "prototype read facilitator sessions" on facilitator_sessions for select using (true);

drop policy if exists "prototype write facilitator sessions" on facilitator_sessions;
create policy "prototype write facilitator sessions" on facilitator_sessions for all using (true) with check (true);

drop policy if exists "prototype read facilitator session statuses" on facilitator_session_level_statuses;
create policy "prototype read facilitator session statuses" on facilitator_session_level_statuses for select using (true);

drop policy if exists "prototype write facilitator session statuses" on facilitator_session_level_statuses;
create policy "prototype write facilitator session statuses" on facilitator_session_level_statuses for all using (true) with check (true);


-- ============================================================================
-- Migration: 20260606000000_registered_students.sql
-- ============================================================================
create table if not exists registered_students (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  district text,
  school text not null,
  student_identifier text,
  name text not null,
  gender text check (gender in ('Male', 'Female')),
  grade integer not null check (grade between 1 and 10),
  board_of_education text,
  vision_level text check (vision_level in ('Completely blind', 'Low Vision')),
  regional_language text,
  other_physical_disabilities text check (other_physical_disabilities in ('Yes', 'No')),
  cognitive_disabilities text check (cognitive_disabilities in ('Yes', 'No')),
  is_braille_literate text check (is_braille_literate in ('Yes', 'No')),
  braille_reading_level text check (braille_reading_level in ('Letters', 'Words', 'Sentences')),
  braille_writing_level text check (braille_writing_level in ('Letters', 'Words', 'Sentences')),
  knows_taylor_frame text check (knows_taylor_frame in ('Yes', 'No')),
  knows_nemeth text check (knows_nemeth in ('Yes', 'No')),
  knows_using_computer text check (knows_using_computer in ('Yes', 'No')),
  knows_maths_on_computer text check (knows_maths_on_computer in ('Yes', 'No')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists registered_students_location_idx on registered_students(state, district, school);
create index if not exists registered_students_name_idx on registered_students(name);
create index if not exists registered_students_identifier_idx on registered_students(student_identifier);

drop trigger if exists registered_students_set_updated_at on registered_students;
create trigger registered_students_set_updated_at
before update on registered_students
for each row
execute function set_updated_at();

alter table registered_students enable row level security;

drop policy if exists "prototype read registered students" on registered_students;
create policy "prototype read registered students" on registered_students for select using (true);

drop policy if exists "prototype write registered students" on registered_students;
create policy "prototype write registered students" on registered_students for all using (true) with check (true);


-- ============================================================================
-- Migration: 20260612000000_game_source_difficulty.sql
-- ============================================================================
alter table games add column if not exists source_url text;
alter table games add column if not exists difficulty_level text;


-- ============================================================================
-- Migration: 20260630000000_common_game_observations.sql
-- ============================================================================
alter table facilitator_sessions
add column if not exists common_observations jsonb not null default '{}'::jsonb;


-- ============================================================================
-- Migration: 20260701000000_ct_outcomes_assessment.sql
-- ============================================================================
create table if not exists ct_outcomes (
  outcome_code text primary key,
  outcome_name text not null,
  emerging_description text not null,
  developing_description text not null,
  independent_description text not null,
  extending_description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ct_suboutcomes (
  suboutcome_code text primary key,
  outcome_code text not null references ct_outcomes(outcome_code) on delete cascade,
  suboutcome_name text not null,
  suboutcome_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assessment_rubric (
  scale integer primary key check (scale between 1 and 4),
  scale_name text not null,
  meaning text not null,
  general_marking_principle text not null,
  field_observation_guidance text not null
);

create table if not exists general_outcomes (
  outcome_code text primary key,
  outcome_name text not null unique,
  display_order integer not null
);

create table if not exists other_outcomes (
  outcome_code text primary key,
  outcome_name text not null unique,
  display_order integer not null
);

alter table games add column if not exists primary_ct_outcome_code text references ct_outcomes(outcome_code) on delete set null;
alter table games add column if not exists primary_ct_observation text;

alter table facilitator_sessions add column if not exists general_outcome_ratings jsonb not null default '{}'::jsonb;
alter table facilitator_sessions add column if not exists primary_ct_rating jsonb not null default '{}'::jsonb;
alter table facilitator_sessions add column if not exists selected_ct_suboutcomes jsonb not null default '[]'::jsonb;
alter table facilitator_sessions add column if not exists other_outcome_ratings jsonb not null default '{}'::jsonb;

insert into ct_outcomes (
  outcome_code, outcome_name, emerging_description, developing_description,
  independent_description, extending_description
) values
  ('CT-DEC', 'Decomposition', 'Needs support to identify the game goal or parts; sees the task as one whole action.', 'With prompts, identifies some parts or steps but may miss inputs, outputs, or dependencies.', 'Breaks the task into meaningful parts and follows them in order with minimal support.', 'Explains the parts to peers, identifies dependencies, and can create/adapt a similar decomposed plan.'),
  ('CT-PR', 'Pattern Recognition', 'Does not yet notice relevant similarities, differences, or repeated patterns without adult help.', 'Recognises simple patterns or similarities with prompts or after peer demonstration.', 'Identifies relevant patterns independently and uses them to continue, match, or predict.', 'Explains the pattern rule, applies it to new situations, or creates a new pattern for others.'),
  ('CT-ABS', 'Abstraction', 'Attends to many details and needs help identifying what information matters.', 'Selects some relevant clues with prompts but may be distracted by irrelevant information.', 'Identifies relevant information and uses an appropriate representation with minimal support.', 'States the key rule/idea clearly and helps others ignore irrelevant details.'),
  ('CT-ALG', 'Algorithmic Thinking', 'Needs step-by-step adult guidance to follow the procedure.', 'Follows the sequence with reminders; may miss conditional rules or repetitions.', 'Follows and repeats the procedure independently and applies simple if-then rules.', 'Explains a reproducible procedure to peers or creates a clear set of instructions.'),
  ('CT-LOG', 'Logical Reasoning', 'Sorts, reasons, or chooses mostly randomly; needs help to identify the rule.', 'Uses a logical rule with prompts and gives partial reasons for choices.', 'Classifies, infers, or chooses systematically and gives a reasonable justification.', 'Compares options, explains cause-effect, and supports peers with logical reasoning.'),
  ('CT-DAT', 'Data Skills', 'Does not yet track or use game information consistently.', 'Tracks simple counts, scores, or requests with prompts.', 'Collects/organises useful game information and uses it for decisions independently.', 'Creates or explains a simple record/tally and interprets it to guide strategy.'),
  ('CT-DBG', 'Debugging', 'Needs adult help to notice that something is wrong.', 'Detects an error with prompts but may not locate or revise the cause independently.', 'Detects an error, locates the cause, and changes the relevant step.', 'Retests the correction, confirms whether it works, and explains the debugging process.'),
  ('CT-GEN', 'Generalisation', 'Uses a strategy only in the exact situation shown, with support.', 'Recognises a similar situation with prompts and tries a known rule.', 'Applies a known rule or strategy to a new but related game situation.', 'Adapts the strategy creatively and generates another example where it applies.'),
  ('CT-MOD', 'Modelling and Simulation', 'Needs help to represent the game situation or outcome.', 'Builds a simple model/role-play scenario with prompts.', 'Uses objects, roles, positions, or descriptions to represent and test a scenario independently.', 'Changes one element, predicts the result, and refines the model when it does not match play.'),
  ('CT-SPA', 'Spatial Reasoning', 'Needs help understanding positions, directions, shapes, or arrangements.', 'Uses simple positional language or follows routes with prompts.', 'Plans routes or manipulates shapes/arrangements independently using spatial relationships.', 'Mentally transforms objects/routes and clearly explains spatial strategy to others.')
on conflict (outcome_code) do update set
  outcome_name = excluded.outcome_name,
  emerging_description = excluded.emerging_description,
  developing_description = excluded.developing_description,
  independent_description = excluded.independent_description,
  extending_description = excluded.extending_description;

insert into ct_suboutcomes (suboutcome_code, outcome_code, suboutcome_name, suboutcome_description) values
  ('CT-DEC-SO1', 'CT-DEC', 'Identifies the goal', 'States what must be achieved or completed in the game'),
  ('CT-DEC-SO2', 'CT-DEC', 'Identifies component tasks', 'Separates the game into smaller actions or decisions'),
  ('CT-DEC-SO3', 'CT-DEC', 'Identifies inputs and outputs', 'Recognises information, materials or moves needed and the expected result'),
  ('CT-DEC-SO4', 'CT-DEC', 'Recognises dependencies', 'Notices that some actions must happen before others'),
  ('CT-PR-SO1', 'CT-PR', 'Finds similarities', 'Groups game states, objects or moves that share relevant features'),
  ('CT-PR-SO2', 'CT-PR', 'Finds differences', 'Distinguishes game states, objects or moves using relevant attributes'),
  ('CT-PR-SO3', 'CT-PR', 'Detects repetition', 'Recognises recurring sequences, moves, sounds, shapes or outcomes'),
  ('CT-PR-SO4', 'CT-PR', 'Predicts pattern continuation', 'Uses a recognised pattern to predict what may happen next'),
  ('CT-ABS-SO1', 'CT-ABS', 'Selects relevant information', 'Identifies clues and features that affect the current decision'),
  ('CT-ABS-SO2', 'CT-ABS', 'Ignores irrelevant information', 'Avoids distraction by details that do not affect the solution'),
  ('CT-ABS-SO3', 'CT-ABS', 'Creates a representation', 'Uses words, objects, tactile marks, diagrams, positions or symbols to represent the problem'),
  ('CT-ABS-SO4', 'CT-ABS', 'States a general rule', 'Summarises the important relationship as a concise rule'),
  ('CT-ALG-SO1', 'CT-ALG', 'Sequences actions', 'Places actions in a workable order'),
  ('CT-ALG-SO2', 'CT-ALG', 'Uses conditional decisions', 'Chooses an action based on an if-then condition'),
  ('CT-ALG-SO3', 'CT-ALG', 'Uses repetition efficiently', 'Repeats a useful action or procedure until a condition is met'),
  ('CT-ALG-SO4', 'CT-ALG', 'Explains a reproducible procedure', 'Gives instructions another person can follow'),
  ('CT-LOG-SO1', 'CT-LOG', 'Classifies systematically', 'Sorts objects or states using a consistent property'),
  ('CT-LOG-SO2', 'CT-LOG', 'Identifies correlation', 'Analyzes the evidence to arrive at correlation among various properties'),
  ('CT-LOG-SO3', 'CT-LOG', 'Draws an inference', 'Reaches a reasonable conclusion from available evidence'),
  ('CT-LOG-SO4', 'CT-LOG', 'Compares strategies', 'Identifies strengths and limitations of various approaches'),
  ('CT-DBG-SO1', 'CT-DBG', 'Detects an error', 'Recognises that the result or game state is not as expected'),
  ('CT-DBG-SO2', 'CT-DBG', 'Locates the cause', 'Traces an error to a specific action, assumption or step'),
  ('CT-DBG-SO3', 'CT-DBG', 'Revises the approach', 'Changes the relevant step rather than restarting without a plan'),
  ('CT-DBG-SO4', 'CT-DBG', 'Retests and confirms', 'Repeats the relevant procedure to check whether the correction works'),
  ('CT-GEN-SO1', 'CT-GEN', 'Recognises transfer opportunity', 'Notices that a previous strategy may help in a new game state'),
  ('CT-GEN-SO2', 'CT-GEN', 'Applies a reusable rule', 'Uses the same underlying rule across multiple examples'),
  ('CT-GEN-SO3', 'CT-GEN', 'Adapts a strategy', 'Modifies a known strategy when conditions change'),
  ('CT-GEN-SO4', 'CT-GEN', 'Generates examples', 'Creates another situation where the same idea applies'),
  ('CT-MOD-SO1', 'CT-MOD', 'Builds a model', 'Represents the relevant parts of a game situation using objects, positions, symbols or description'),
  ('CT-MOD-SO2', 'CT-MOD', 'Tests scenarios', 'Changes one element and observes the result'),
  ('CT-MOD-SO3', 'CT-MOD', 'Makes a prediction', 'Uses the model to anticipate a likely outcome'),
  ('CT-MOD-SO4', 'CT-MOD', 'Refines the model', 'Updates a representation when it does not match observed play'),
  ('CT-SPA-SO1', 'CT-SPA', 'Uses positional language', 'Accurately describes relative position and direction'),
  ('CT-SPA-SO2', 'CT-SPA', 'Plans a route', 'Chooses a sequence of movements to reach a target'),
  ('CT-SPA-SO3', 'CT-SPA', 'Recognises shapes and arrangements', 'Identifies spatial properties and relationships among objects'),
  ('CT-SPA-SO4', 'CT-SPA', 'Mentally transforms objects', 'Predicts the result of turning, flipping, moving or combining objects')
on conflict (suboutcome_code) do update set
  outcome_code = excluded.outcome_code,
  suboutcome_name = excluded.suboutcome_name,
  suboutcome_description = excluded.suboutcome_description;

insert into assessment_rubric (scale, scale_name, meaning, general_marking_principle, field_observation_guidance) values
  (1, 'Emerging', 'Needs significant support', 'Child shows the behaviour only with repeated adult/peer support.', 'Mark 1 when the facilitator has to lead most of the step.'),
  (2, 'Developing', 'Performs with prompts', 'Child shows the behaviour with reminders, hints, or after watching others.', 'Mark 2 when the child participates but still depends on prompts.'),
  (3, 'Independent', 'Performs independently', 'Child shows the behaviour during play with minimal support.', 'Mark 3 when the child applies the skill on their own in the game.'),
  (4, 'Extending', 'Explains, adapts, or supports others', 'Child explains the thinking, improves the strategy, transfers the idea, or helps peers.', 'Mark 4 when the child goes beyond doing and shows understanding/leadership.')
on conflict (scale) do update set
  scale_name = excluded.scale_name,
  meaning = excluded.meaning,
  general_marking_principle = excluded.general_marking_principle,
  field_observation_guidance = excluded.field_observation_guidance;

insert into general_outcomes (outcome_code, outcome_name, display_order) values
  ('GO-01', 'Understanding of Game objectives', 1),
  ('GO-02', 'How to handle materials', 2),
  ('GO-03', 'Understanding of and respects rules of play', 3),
  ('GO-04', 'Team work, taking turns', 4),
  ('GO-05', 'Strategy and planning', 5),
  ('GO-06', 'Focus and participation', 6),
  ('GO-07', 'Communication and listening', 7),
  ('GO-08', 'Problem-solving and decision-making (individual and collaborative)', 8),
  ('GO-09', 'Confidence and willingness to try again even after losing or making mistakes', 9),
  ('GO-10', 'Fair play and sportsmanship', 10)
on conflict (outcome_code) do update set
  outcome_name = excluded.outcome_name,
  display_order = excluded.display_order;

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
  ('OO-11', 'Statistics/ Probability', 11)
on conflict (outcome_code) do update set
  outcome_name = excluded.outcome_name,
  display_order = excluded.display_order;

update games as game
set primary_ct_outcome_code = mapping.outcome_code,
    primary_ct_observation = mapping.observation
from (values
  ('BODY PERCUSSION', 'CT-PR', 'Child detects repeated sound/body patterns, predicts the next beat/action, and groups similar sounds/actions.'),
  ('CARD GAME 0', 'CT-LOG', 'Child classifies cards by suit/number/tactile feature, gives the rule, and infers matches from card properties.'),
  ('COLLABORATIVE SORTING', 'CT-LOG', 'Child applies a shared classification rule with peers, justifies placements, and resolves misplaced cards logically.'),
  ('CONNECT FOUR', 'CT-LOG', 'Child checks possible lines of four, compares own and opponent opportunities, and selects efficient moves to win or block.'),
  ('COUNTING', 'CT-ALG', 'Child follows a count-touch-move sequence, repeats the counting procedure accurately, and can tell another child the steps.'),
  ('EQUATIONS', 'CT-DBG', 'Child detects when an equation is incorrect, identifies the operation/number causing the error, and revises it.'),
  ('GAME BIRTHDAY', 'CT-ALG', 'Child orders days/months/events, applies before-after-if clues, and explains the sequence.'),
  ('GANITMALA', 'CT-ALG', 'Child uses number order, repeats forward/backward movement, and explains the procedure for locating/comparing numbers.'),
  ('GO FISH', 'CT-DAT', 'Child tracks requests/responses, organises remembered card information, and uses it to decide what to ask next.'),
  ('GROUPING', 'CT-DEC', 'Child breaks a total into smaller groups, recognises the needed counters/cards, and notices which grouping step depends on the previous one.'),
  ('HOP SCOTCH', 'CT-SPA', 'Child uses positional words, plans a movement route, and recognises spatial layout/positions on the path.'),
  ('I SEE 10', 'CT-PR', 'Child recognises number-pair similarities that make 10, recalls repeated combinations, and predicts matching partners for a card.'),
  ('LAST MAN STANDING', 'CT-LOG', 'Child checks number formation against win condition, compares arrangements, and chooses efficient place-value strategy.'),
  ('LUDO', 'CT-ALG', 'Child follows ordered turn steps, makes if-then token decisions based on dice/position, and explains movement rules.'),
  ('MARKET', 'CT-MOD', 'Child models a buying/selling situation, tests quantities/prices/change scenarios, and predicts cost/payment outcomes.'),
  ('MUSICAL NUMBERS', 'CT-PR', 'Child recognises number-rhythm repetitions, predicts next number/sound, and identifies similar rhythm-number patterns.'),
  ('NOUGHTS & CROSSES', 'CT-LOG', 'Child checks moves against the goal of making a line, compares available moves, and chooses an efficient blocking/winning move.'),
  ('ODD ONE OUT', 'CT-LOG', 'Child classifies common features, infers the item that does not fit, and justifies the choice.'),
  ('ODD OR EVEN', 'CT-LOG', 'Child pairs objects systematically, infers odd/even based on leftover/no leftover, and justifies the decision.'),
  ('PALLAGUZHI', 'CT-ALG', 'Child distributes counters in order, repeats the sowing process, and makes conditional decisions based on empty/filled pits.'),
  ('PATTERNS', 'CT-PR', 'Child notices repetition, predicts what comes next, and groups similar pattern elements.'),
  ('PLACE VALUE CARD', 'CT-DEC', 'Child decomposes numbers into place-value parts, identifies digits/cards needed, and follows dependencies from highest to lower place.'),
  ('RACE TO 27', 'CT-LOG', 'Child checks running total against 27, compares possible cards/moves, and chooses efficient moves toward the target.'),
  ('RUMMY', 'CT-PR', 'Child finds similarities among cards, detects repeated set/sequence structures, and predicts useful cards needed to complete them.'),
  ('SCOOP', 'CT-ALG', 'Child orders cards in sequence, chooses action based on required card/suit, and explains the collection procedure.'),
  ('SCRABBLE', 'CT-DEC', 'Child breaks letters into possible word parts, identifies usable letters/board spaces, and keeps the goal of forming a valid word.'),
  ('SNAKES & LADDERS', 'CT-ALG', 'Child follows roll-count-move-check sequence, applies if-then rules for snake/ladder, and repeats the procedure each turn.'),
  ('SORTING', 'CT-LOG', 'Child groups items/cards using one consistent property, states the sorting rule, and explains why an item belongs in a group.'),
  ('SOUNDS & PATTERNS', 'CT-PR', 'Child identifies repeated sound patterns, predicts or continues them, and recognises similar sound groups.'),
  ('STEPS TO TREASURE', 'CT-ALG', 'Child sequences movement instructions, gives reproducible directions, and uses if-then corrections when path conditions change.'),
  ('TANGRAMS', 'CT-SPA', 'Child recognises shapes/arrangements, mentally turns or combines pieces, and describes position/direction of pieces.'),
  ('TREASURE HUNT', 'CT-ABS', 'Child selects relevant clues, ignores distractions, and represents the route/object using words, tactile cues, or positions.')
) as mapping(game_name, outcome_code, observation)
where upper(trim(game.game)) = upper(trim(mapping.game_name));

create index if not exists ct_suboutcomes_outcome_code_idx on ct_suboutcomes(outcome_code);
create index if not exists games_primary_ct_outcome_code_idx on games(primary_ct_outcome_code);

alter table ct_outcomes enable row level security;
alter table ct_suboutcomes enable row level security;
alter table assessment_rubric enable row level security;
alter table general_outcomes enable row level security;
alter table other_outcomes enable row level security;

drop policy if exists "prototype read ct outcomes" on ct_outcomes;
create policy "prototype read ct outcomes" on ct_outcomes for select using (true);
drop policy if exists "prototype write ct outcomes" on ct_outcomes;
create policy "prototype write ct outcomes" on ct_outcomes for all using (true) with check (true);

drop policy if exists "prototype read ct suboutcomes" on ct_suboutcomes;
create policy "prototype read ct suboutcomes" on ct_suboutcomes for select using (true);
drop policy if exists "prototype write ct suboutcomes" on ct_suboutcomes;
create policy "prototype write ct suboutcomes" on ct_suboutcomes for all using (true) with check (true);

drop policy if exists "prototype read assessment rubric" on assessment_rubric;
create policy "prototype read assessment rubric" on assessment_rubric for select using (true);
drop policy if exists "prototype write assessment rubric" on assessment_rubric;
create policy "prototype write assessment rubric" on assessment_rubric for all using (true) with check (true);

drop policy if exists "prototype read general outcomes" on general_outcomes;
create policy "prototype read general outcomes" on general_outcomes for select using (true);
drop policy if exists "prototype write general outcomes" on general_outcomes;
create policy "prototype write general outcomes" on general_outcomes for all using (true) with check (true);

drop policy if exists "prototype read other outcomes" on other_outcomes;
create policy "prototype read other outcomes" on other_outcomes for select using (true);
drop policy if exists "prototype write other outcomes" on other_outcomes;
create policy "prototype write other outcomes" on other_outcomes for all using (true) with check (true);


-- ============================================================================
-- Migration: 20260701010000_backfill_general_outcomes.sql
-- ============================================================================
update facilitator_sessions
set general_outcome_ratings = common_observations
where general_outcome_ratings = '{}'::jsonb
  and common_observations <> '{}'::jsonb;


-- ============================================================================
-- Migration: 20260701020000_facilitators.sql
-- ============================================================================
-- Facilitators available for session entry, filtered by the selected state.
create table if not exists facilitators (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (state, name)
);

create index if not exists facilitators_state_idx on facilitators(state, active, name);

drop trigger if exists facilitators_set_updated_at on facilitators;
create trigger facilitators_set_updated_at
before update on facilitators
for each row
execute function set_updated_at();

alter table facilitators enable row level security;

drop policy if exists "prototype read facilitators" on facilitators;
create policy "prototype read facilitators" on facilitators for select using (true);

drop policy if exists "prototype write facilitators" on facilitators;
create policy "prototype write facilitators" on facilitators for all using (true) with check (true);

-- Add facilitators with, for example:
-- insert into facilitators (state, name) values ('Karnataka', 'Facilitator name');

-- rollback
-- drop table if exists facilitators;


-- ============================================================================
-- Migration: 20260701030000_shared_registrations.sql
-- ============================================================================
-- Shared school and facilitator registration tables used by the STEM Lab and VICT.
create table if not exists stemlab_schools (
  id text primary key,
  state text not null,
  district text,
  school_name text not null,
  address text,
  school_type text,
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


-- ============================================================================
-- Migration: 20260707000000_merge_evaluation_into_logical_reasoning.sql
-- ============================================================================
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


-- ============================================================================
-- Migration: 20260707010000_replace_logical_reasoning_suboutcomes.sql
-- ============================================================================
-- Replace Logical Reasoning suboutcomes with the approved four-item master list.
delete from ct_suboutcomes where outcome_code = 'CT-LOG';

insert into ct_suboutcomes (suboutcome_code, outcome_code, suboutcome_name, suboutcome_description) values
  ('CT-LOG-SO1', 'CT-LOG', 'Classifies systematically', 'Sorts objects or states using a consistent property'),
  ('CT-LOG-SO2', 'CT-LOG', 'Identifies correlation', 'Analyzes the evidence to arrive at correlation among various properties'),
  ('CT-LOG-SO3', 'CT-LOG', 'Draws an inference', 'Reaches a reasonable conclusion from available evidence'),
  ('CT-LOG-SO4', 'CT-LOG', 'Compares strategies', 'Identifies strengths and limitations of various approaches');


-- ============================================================================
-- Migration: 20260708000000_standardize_unique_game_codes.sql
-- ============================================================================
-- Standardize every game to a unique, zero-padded VICT game code.
begin;

create temporary table game_code_mapping (
  old_code text primary key,
  new_code text not null unique
) on commit drop;

insert into game_code_mapping (old_code, new_code) values
  ('G1', 'VICT-G001'), ('G2', 'VICT-G002'), ('G3', 'VICT-G003'), ('G4', 'VICT-G004'),
  ('G5', 'VICT-G005'), ('G6', 'VICT-G006'), ('G7', 'VICT-G007'), ('G8', 'VICT-G008'),
  ('G9', 'VICT-G009'), ('G10', 'VICT-G010'), ('G11', 'VICT-G011'), ('G12', 'VICT-G012'),
  ('G13', 'VICT-G013'), ('G14', 'VICT-G014'), ('G15', 'VICT-G015'), ('G16', 'VICT-G016'),
  ('G17', 'VICT-G017'), ('G18', 'VICT-G018'), ('G19', 'VICT-G019'), ('G20', 'VICT-G020'),
  ('G21', 'VICT-G021'), ('G22', 'VICT-G022'), ('G23', 'VICT-G023'), ('G24', 'VICT-G024'),
  ('G25', 'VICT-G025'), ('G26', 'VICT-G026'), ('G27', 'VICT-G027'), ('G28', 'VICT-G028'),
  ('G29', 'VICT-G029'), ('G30', 'VICT-G030'), ('G31', 'VICT-G031'), ('G32', 'VICT-G032');

alter table game_application_levels drop constraint if exists game_application_levels_game_code_fkey;
alter table facilitator_sessions drop constraint if exists facilitator_sessions_game_code_fkey;

update games as game
set game_code = mapping.new_code
from game_code_mapping as mapping
where game.game_code = mapping.old_code;

update game_application_levels as application
set game_code = mapping.new_code
from game_code_mapping as mapping
where application.game_code = mapping.old_code;

update facilitator_sessions as session
set game_code = mapping.new_code
from game_code_mapping as mapping
where session.game_code = mapping.old_code;

update facilitator_session_level_statuses as status
set game_code = mapping.new_code
from game_code_mapping as mapping
where status.game_code = mapping.old_code;

alter table game_application_levels
  add constraint game_application_levels_game_code_fkey
  foreign key (game_code) references games(game_code) on update cascade on delete cascade;

alter table facilitator_sessions
  add constraint facilitator_sessions_game_code_fkey
  foreign key (game_code) references games(game_code) on update cascade on delete restrict;

commit;


-- ============================================================================
-- Migration: 20260708010000_replace_other_outcomes.sql
-- ============================================================================
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


-- ============================================================================
-- Migration: 20260715000000_create_faqs.sql
-- ============================================================================
create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  category text,
  question text not null,
  answer text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faqs_order_idx on faqs(display_order, question);
create index if not exists faqs_active_idx on faqs(is_active, display_order);

drop trigger if exists faqs_set_updated_at on faqs;
create trigger faqs_set_updated_at
before update on faqs
for each row
execute function set_updated_at();

alter table faqs enable row level security;

drop policy if exists "prototype read faqs" on faqs;
create policy "prototype read faqs" on faqs for select using (true);

drop policy if exists "prototype write faqs" on faqs;
create policy "prototype write faqs" on faqs for all using (true) with check (true);


-- ============================================================================
-- Migration: 20260804000000_create_assessment_questions.sql
-- ============================================================================
create table if not exists assessment_question_banks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  language text not null default 'English',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessment_question_banks_language_idx on assessment_question_banks(language);

insert into assessment_question_banks (name, language)
values ('CT Assessment Question Set 2026', 'English')
on conflict (name) do nothing;

create table if not exists assessment_questions (
  id uuid primary key default gen_random_uuid(),
  question_bank_id uuid not null references assessment_question_banks(id) on delete cascade,
  question_level integer not null check (question_level in (1, 2, 3)),
  question_order integer not null default 1 check (question_order >= 1),
  question_theme text not null default 'General',
  outcome_code text references ct_outcomes(outcome_code) on delete set null,
  question_text text not null,
  image_data_url text,
  image_name text,
  correct_answer text not null,
  total_marks numeric(8, 2) not null check (total_marks >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessment_questions_level_idx on assessment_questions(question_level, created_at desc);
create index if not exists assessment_questions_bank_idx on assessment_questions(question_bank_id);
create index if not exists assessment_questions_order_idx on assessment_questions(question_level, question_order);
create index if not exists assessment_questions_theme_idx on assessment_questions(question_level, question_theme);

drop trigger if exists assessment_question_banks_set_updated_at on assessment_question_banks;
create trigger assessment_question_banks_set_updated_at
before update on assessment_question_banks
for each row
execute function set_updated_at();

drop trigger if exists assessment_questions_set_updated_at on assessment_questions;
create trigger assessment_questions_set_updated_at
before update on assessment_questions
for each row
execute function set_updated_at();

alter table assessment_question_banks enable row level security;
alter table assessment_questions enable row level security;

drop policy if exists "prototype read assessment question banks" on assessment_question_banks;
create policy "prototype read assessment question banks" on assessment_question_banks for select using (true);

drop policy if exists "prototype write assessment question banks" on assessment_question_banks;
create policy "prototype write assessment question banks" on assessment_question_banks for all using (true) with check (true);

drop policy if exists "prototype read assessment questions" on assessment_questions;
create policy "prototype read assessment questions" on assessment_questions for select using (true);

drop policy if exists "prototype write assessment questions" on assessment_questions;
create policy "prototype write assessment questions" on assessment_questions for all using (true) with check (true);


-- ============================================================================
-- Migration: 20260804010000_create_assessment_entries.sql
-- ============================================================================
alter table assessment_questions
add column if not exists question_theme text not null default 'General';

alter table assessment_questions
add column if not exists outcome_code text references ct_outcomes(outcome_code) on delete set null;

create index if not exists assessment_questions_theme_idx on assessment_questions(question_level, question_theme);

create table if not exists assessment_entries (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  district text,
  school text not null,
  student_id uuid references registered_students(id) on delete set null,
  student_name text not null,
  assessment_date date not null,
  facilitator text,
  assessment_level integer not null check (assessment_level in (1, 2, 3)),
  question_scores jsonb not null default '[]'::jsonb,
  free_play_assessment jsonb not null default '{}'::jsonb,
  qualitative_outcomes jsonb not null default '[]'::jsonb,
  other_observations text,
  accuracy_score text not null check (accuracy_score in ('High', 'Low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessment_entries_student_date_idx on assessment_entries(student_name, assessment_date desc);
create index if not exists assessment_entries_location_idx on assessment_entries(state, district, school);

drop trigger if exists assessment_entries_set_updated_at on assessment_entries;
create trigger assessment_entries_set_updated_at
before update on assessment_entries
for each row
execute function set_updated_at();

alter table assessment_entries enable row level security;

drop policy if exists "prototype read assessment entries" on assessment_entries;
create policy "prototype read assessment entries" on assessment_entries for select using (true);

drop policy if exists "prototype write assessment entries" on assessment_entries;
create policy "prototype write assessment entries" on assessment_entries for all using (true) with check (true);


-- ============================================================================
-- Migration: 20260804020000_add_assessment_question_order.sql
-- ============================================================================
alter table assessment_questions
add column if not exists question_order integer not null default 1 check (question_order >= 1);

create index if not exists assessment_questions_order_idx
on assessment_questions(question_level, question_order);


-- ============================================================================
-- Migration: 20260805000000_replace_game_activity_outcome_text.sql
-- ============================================================================
update ct_outcomes
set
  emerging_description = regexp_replace(regexp_replace(regexp_replace(regexp_replace(emerging_description, '\mGames\M', 'Games/activities', 'g'), '\mgames\M', 'games/activities', 'g'), '\mGame\M', 'Game/activity', 'g'), '\mgame\M', 'game/activity', 'g'),
  developing_description = regexp_replace(regexp_replace(regexp_replace(regexp_replace(developing_description, '\mGames\M', 'Games/activities', 'g'), '\mgames\M', 'games/activities', 'g'), '\mGame\M', 'Game/activity', 'g'), '\mgame\M', 'game/activity', 'g'),
  independent_description = regexp_replace(regexp_replace(regexp_replace(regexp_replace(independent_description, '\mGames\M', 'Games/activities', 'g'), '\mgames\M', 'games/activities', 'g'), '\mGame\M', 'Game/activity', 'g'), '\mgame\M', 'game/activity', 'g'),
  extending_description = regexp_replace(regexp_replace(regexp_replace(regexp_replace(extending_description, '\mGames\M', 'Games/activities', 'g'), '\mgames\M', 'games/activities', 'g'), '\mGame\M', 'Game/activity', 'g'), '\mgame\M', 'game/activity', 'g')
where
  emerging_description ~* '\mgames?\M' or
  developing_description ~* '\mgames?\M' or
  independent_description ~* '\mgames?\M' or
  extending_description ~* '\mgames?\M';

update ct_suboutcomes
set suboutcome_description = regexp_replace(regexp_replace(regexp_replace(regexp_replace(suboutcome_description, '\mGames\M', 'Games/activities', 'g'), '\mgames\M', 'games/activities', 'g'), '\mGame\M', 'Game/activity', 'g'), '\mgame\M', 'game/activity', 'g')
where suboutcome_description ~* '\mgames?\M';

update ct_outcomes
set
  emerging_description = replace(replace(replace(replace(emerging_description, 'Games/activities/activities', 'Games/activities'), 'games/activities/activities', 'games/activities'), 'Game/activity/activity', 'Game/activity'), 'game/activity/activity', 'game/activity'),
  developing_description = replace(replace(replace(replace(developing_description, 'Games/activities/activities', 'Games/activities'), 'games/activities/activities', 'games/activities'), 'Game/activity/activity', 'Game/activity'), 'game/activity/activity', 'game/activity'),
  independent_description = replace(replace(replace(replace(independent_description, 'Games/activities/activities', 'Games/activities'), 'games/activities/activities', 'games/activities'), 'Game/activity/activity', 'Game/activity'), 'game/activity/activity', 'game/activity'),
  extending_description = replace(replace(replace(replace(extending_description, 'Games/activities/activities', 'Games/activities'), 'games/activities/activities', 'games/activities'), 'Game/activity/activity', 'Game/activity'), 'game/activity/activity', 'game/activity');

update ct_suboutcomes
set suboutcome_description = replace(replace(replace(replace(suboutcome_description, 'Games/activities/activities', 'Games/activities'), 'games/activities/activities', 'games/activities'), 'Game/activity/activity', 'Game/activity'), 'game/activity/activity', 'game/activity');


-- ============================================================================
-- Migration: 20260805010000_add_question_bank_name.sql
-- ============================================================================
alter table assessment_questions
add column if not exists question_bank_name text not null default 'CT Assessment Question Set 2026';

update assessment_questions
set question_bank_name = 'CT Assessment Question Set 2026'
where nullif(trim(question_bank_name), '') is null;

create index if not exists assessment_questions_bank_idx
on assessment_questions(question_bank_name);


-- ============================================================================
-- Migration: 20260812030000_normalize_assessment_question_banks.sql
-- ============================================================================
create table if not exists assessment_question_banks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  language text not null default 'English',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessment_question_banks_language_idx
on assessment_question_banks(language);

drop trigger if exists assessment_question_banks_set_updated_at on assessment_question_banks;
create trigger assessment_question_banks_set_updated_at
before update on assessment_question_banks
for each row
execute function set_updated_at();

alter table assessment_question_banks enable row level security;

drop policy if exists "prototype read assessment question banks" on assessment_question_banks;
create policy "prototype read assessment question banks" on assessment_question_banks
for select using (true);

drop policy if exists "prototype write assessment question banks" on assessment_question_banks;
create policy "prototype write assessment question banks" on assessment_question_banks
for all using (true) with check (true);

insert into assessment_question_banks (name, language)
values ('CT Assessment Question Set 2026', 'English')
on conflict (name) do nothing;

alter table assessment_questions
add column if not exists question_bank_name text not null default 'CT Assessment Question Set 2026',
add column if not exists question_bank_language text not null default 'English';

insert into assessment_question_banks (name, language)
select distinct
  coalesce(nullif(trim(question_bank_name), ''), 'CT Assessment Question Set 2026') as name,
  coalesce(nullif(trim(question_bank_language), ''), 'English') as language
from assessment_questions
where question_bank_name is not null
on conflict (name) do update
set
  language = excluded.language,
  updated_at = now();

alter table assessment_questions
add column if not exists question_bank_id uuid;

update assessment_questions questions
set question_bank_id = banks.id
from assessment_question_banks banks
where
  questions.question_bank_id is null
  and banks.name = coalesce(nullif(trim(questions.question_bank_name), ''), 'CT Assessment Question Set 2026');

update assessment_questions
set question_bank_id = (select id from assessment_question_banks where name = 'CT Assessment Question Set 2026')
where question_bank_id is null;

alter table assessment_questions
alter column question_bank_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessment_questions_question_bank_id_fkey'
  ) then
    alter table assessment_questions
    add constraint assessment_questions_question_bank_id_fkey
    foreign key (question_bank_id)
    references assessment_question_banks(id)
    on delete cascade;
  end if;
end $$;

drop index if exists assessment_questions_bank_language_idx;
drop index if exists assessment_questions_bank_idx;

create index if not exists assessment_questions_bank_idx
on assessment_questions(question_bank_id);

alter table assessment_questions
drop column if exists question_bank_name,
drop column if exists question_bank_language;


-- ============================================================================
-- Migration: 20260812040000_add_registered_student_identifier.sql
-- ============================================================================
alter table registered_students
add column if not exists student_identifier text;

create index if not exists registered_students_identifier_idx
on registered_students(student_identifier);

