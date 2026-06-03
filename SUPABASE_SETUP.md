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
7. Use `Sync DB` on the Skills page to save the seeded skills and skill levels to Supabase.
8. Use the Session Entry page to save facilitator session records and per-application-level status into Supabase.
9. Use `Refresh DB` on the dashboard page to load the latest Supabase data.

The schema includes:

- `skills`
- `skill_levels`
- `games`
- `game_application_levels`
- `facilitator_sessions`
- `facilitator_session_level_statuses`
- `students`
- `sessions`

The schema currently includes prototype row-level security policies that allow public read/write access through the anon key. Replace those policies with authenticated facilitator/school policies before storing real student data.

Do not put the PostgreSQL database password in browser files. The browser app only needs the Supabase project URL and public anon key.
