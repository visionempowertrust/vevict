const { defineConfig } = require("@playwright/test");
const port = Number(process.env.VICT_TEST_PORT || 4173);

module.exports = defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 5_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "node tests/server.cjs",
    env: { ...process.env, PORT: String(port) },
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
    timeout: 10_000
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }]
});
