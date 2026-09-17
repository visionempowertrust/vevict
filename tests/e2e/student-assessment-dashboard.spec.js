const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const mockStore = fs.readFileSync(path.join(__dirname, "..", "fixtures", "mock-supabase-store.js"), "utf8");

test.beforeEach(async ({ page }) => {
  await page.route("**/supabase-store.js*", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript",
    body: mockStore
  }));
  await page.route("https://**/*", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript",
    body: ""
  }));
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("vict-e2e-initialized")) {
      localStorage.removeItem("vict-e2e-database");
      sessionStorage.setItem("vict-e2e-initialized", "true");
    }
  });
  page.on("dialog", async (dialog) => {
    if (dialog.type() === "prompt") await dialog.accept("*");
    else await dialog.accept();
  });
});

test("student, facilitator and assessment entries appear correctly on the dashboard", async ({ page }) => {
  await test.step("create a facilitator", async () => {
    await page.goto("/registrations.html#facilitators");
    await expect(page.locator("#registration-status")).toHaveText("Ready");
    await page.locator("#facilitator-state").evaluate((select) => {
      if (![...select.options].some((option) => option.value === "Karnataka")) select.add(new Option("Karnataka", "Karnataka"));
    });
    await page.selectOption("#facilitator-state", "Karnataka");
    await page.fill("#facilitator-first-name", "Asha");
    await page.fill("#facilitator-last-name", "Tester");
    await page.fill("#facilitator-email", "asha.tester@example.org");
    await page.fill("#facilitator-phone", "9000000001");
    await page.click("#save-facilitator");
    await expect(page.locator("#facilitators-table")).toContainText("Asha Tester");
    await expect(page.locator("#facilitators-count")).toHaveText("1 facilitator");
  });

  await test.step("create a student", async () => {
    await page.selectOption("#registration-type", "students");
    await page.locator("#student-state").evaluate((select) => {
      if (![...select.options].some((option) => option.value === "Karnataka")) select.add(new Option("Karnataka", "Karnataka"));
    });
    await page.selectOption("#student-state", "Karnataka");
    await page.locator("#student-district").evaluate((select) => {
      if (![...select.options].some((option) => option.value === "Bengaluru Urban")) select.add(new Option("Bengaluru Urban", "Bengaluru Urban"));
    });
    await page.selectOption("#student-district", "Bengaluru Urban");
    await page.locator("#student-school").evaluate((select) => {
      if (![...select.options].some((option) => option.value === "VICT Test School")) select.add(new Option("VICT Test School", "VICT Test School"));
    });
    await page.selectOption("#student-school", { label: "VICT Test School" });
    await page.fill("#student-identifier", "E2E-STUDENT-001");
    await page.fill("#student-name", "Ravi Test Student");
    await page.selectOption("#student-gender", "Male");
    await page.selectOption("#student-grade", "5");
    await page.click("#save-student");
    await expect(page.locator("#students-table")).toContainText("E2E-STUDENT-001");
    await expect(page.locator("#students-table")).toContainText("Ravi Test Student");
    await expect(page.locator("#students-count")).toHaveText("1 student");
  });

  await test.step("submit an assessment", async () => {
    await page.goto("/assessment-entry.html");
    await expect(page.locator("#assessment-entry-status")).toHaveText("Ready");
    await page.selectOption("#assessment-grade", "5");
    await expect(page.locator("#assessment-student")).toContainText("Ravi Test Student");
    await expect(page.locator("#assessment-facilitator")).toContainText("Asha Tester");
    await page.selectOption("#assessment-student", "student-e2e-1");
    await page.selectOption("#assessment-facilitator", "Asha Tester");
    await page.selectOption('[data-question-score="question-e2e-1"]', "1");
    for (const id of ["comprehension", "creativity", "concentration", "speed", "confidence"]) {
      await page.selectOption(`#observation-${id}`, "High");
    }
    await page.fill("#assessment-duration", "20");
    const invalidFields = await page.locator("#assessment-entry-form").evaluate((form) =>
      [...form.elements].filter((element) => !element.checkValidity()).map((element) => element.id || element.name)
    );
    expect(invalidFields).toEqual([]);
    await page.click('button[type="submit"]');
    await expect(page.locator("#assessment-entry-status")).toHaveText("Saved");
  });

  await test.step("verify dashboard totals and assessment details", async () => {
    await page.goto("/assessment-dashboard.html");
    await expect(page.locator("#assessment-dashboard-status")).toHaveText("Ready");
    await expect(page.locator("#assessment-summary-count")).toHaveText("1");
    await expect(page.locator("#assessment-summary-students")).toHaveText("1");
    await expect(page.locator("#assessment-summary-average")).toHaveText("100%");
    await expect(page.locator("#assessment-dashboard-table")).toContainText("Ravi Test Student");
    await page.click("[data-assessment-detail]");
    await expect(page.locator("#assessment-detail-title")).toContainText("Ravi Test Student");
    await expect(page.locator("#assessment-detail-content")).toContainText("Asha Tester");
    await expect(page.locator("#assessment-detail-content")).toContainText("1/1 (100%)");
    await expect(page.locator("#assessment-detail-content")).toContainText("20 minutes");
  });
});
