# Automated regression tests

The Playwright suite covers the critical data journey with safe dummy data:

1. create a facilitator;
2. create a student;
3. submit an assessment;
4. verify dashboard totals and assessment details.

The suite replaces `supabase-store.js` in the browser with an in-memory/local-storage fixture. It never reads or writes the configured Supabase project.

## Run after a change

Install dependencies and the browser once:

```powershell
pnpm install
pnpm exec playwright install chromium
```

Run the suite after each change:

```powershell
pnpm test
```

For interactive debugging:

```powershell
pnpm run test:e2e:ui
```

Failure traces and screenshots are retained under `test-results`; the HTML report is written to `playwright-report`.
