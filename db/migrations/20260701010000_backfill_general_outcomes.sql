-- migrate:up
update facilitator_sessions
set general_outcome_ratings = common_observations
where general_outcome_ratings = '{}'::jsonb
  and common_observations <> '{}'::jsonb;

-- migrate:down
-- Data backfill is intentionally retained.
