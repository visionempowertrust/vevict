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
