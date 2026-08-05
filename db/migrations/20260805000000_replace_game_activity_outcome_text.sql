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
