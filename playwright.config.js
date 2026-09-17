const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 5_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "node tests/server.cjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 10_000
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }]
});
