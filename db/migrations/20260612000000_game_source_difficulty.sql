-- migrate:up
alter table games add column if not exists source_url text;
alter table games add column if not exists difficulty_level text;

-- migrate:down
alter table games drop column if exists difficulty_level;
alter table games drop column if exists source_url;
