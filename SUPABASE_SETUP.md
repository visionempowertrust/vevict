# Supabase Setup

1. Use the Supabase project `yhaloppwmvdyzssknkpc`.
2. Open the Supabase SQL editor.
3. Run the SQL in `supabase-schema.sql`.
4. Open `supabase-config.js`.
5. Set:

```js
window.VICT_SUPABASE_CONFIG = {
  enabled: true,
  url: "https://yhaloppwmvdyzssknkpc.supabase.co",
  anonKey: "YOUR-SUPABASE-ANON-KEY"
};
```

6. Refresh the tracker app.
7. Apply all migrations in `db/migrations` to seed CT outcomes, suboutcomes, rubric levels, general outcomes, other outcomes, and game mappings.
8. Use the Session Entry page to save facilitator ratings and selected CT suboutcomes into Supabase.
9. Use `Refresh DB` on the dashboard page to load the latest Supabase data.

The schema includes:

- `skills`
- `skill_levels`
- `games`
- `game_application_levels`
- `ct_outcomes`
- `ct_suboutcomes`
- `assessment_rubric`
- `general_outcomes`
- `other_outcomes`
- `facilitators`
- `registered_students`
- `facilitator_sessions`
- `facilitator_session_level_statuses`
- `students`
- `sessions`


Add active facilitators before using Session Entry. Facilitator names are filtered by the selected state:

```sql
insert into facilitators (state, name)
values ('Karnataka', 'Facilitator name');
```
The schema currently includes prototype row-level security policies that allow public read/write access through the anon key. Replace those policies with authenticated facilitator/school policies before storing real student data.

Do not put the PostgreSQL database password in browser files. The browser app only needs the Supabase project URL and public anon key.
