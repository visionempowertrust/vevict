# Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run the SQL in `supabase-schema.sql`.
4. Open `supabase-config.js`.
5. Set:

```js
window.VICT_SUPABASE_CONFIG = {
  enabled: true,
  url: "https://YOUR-PROJECT-REF.supabase.co",
  anonKey: "YOUR-SUPABASE-ANON-KEY"
};
```

6. Refresh the tracker app.
7. Use `Sync DB` on the session-entry page to save current local records to Supabase.
8. Use `Refresh DB` on the dashboard page to load the latest Supabase data.

The schema currently includes prototype row-level security policies that allow public read/write access through the anon key. Replace those policies with authenticated facilitator/school policies before storing real student data.
