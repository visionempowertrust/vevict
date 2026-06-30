-- migrate:up
alter table facilitator_sessions
add column if not exists common_observations jsonb not null default '{}'::jsonb;

-- migrate:down
alter table facilitator_sessions drop column if exists common_observations;
