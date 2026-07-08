-- migrate:up
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

-- migrate:down
alter table facilitator_sessions drop column if exists other_outcome_ratings;
alter table facilitator_sessions drop column if exists selected_ct_suboutcomes;
alter table facilitator_sessions drop column if exists primary_ct_rating;
alter table facilitator_sessions drop column if exists general_outcome_ratings;
alter table games drop column if exists primary_ct_observation;
alter table games drop column if exists primary_ct_outcome_code;
drop table if exists other_outcomes;
drop table if exists general_outcomes;
drop table if exists assessment_rubric;
drop table if exists ct_suboutcomes;
drop table if exists ct_outcomes;
