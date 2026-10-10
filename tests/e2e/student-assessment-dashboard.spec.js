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
    await expect(page.locator('#registration-type option[value="schools"]')).toHaveCount(0);
    await expect(page.locator("#schools-registration")).toBeHidden();
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
    await expect(page.locator("#assessment-physical-disabilities")).toHaveValue("Not known");
    await expect(page.locator("#assessment-cognitive-disabilities")).toHaveValue("Not known");
    await page.fill("#assessment-vict-years", "2");
    await page.selectOption("#assessment-level-reason", "Based on number of years in VICT program");
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
    await expect(page.locator("#assessment-detail-content")).toContainText("E2E-STUDENT-001");
    await expect(page.locator("#assessment-detail-content")).toContainText("Grade 5");
    await expect(page.locator("#assessment-detail-content")).toContainText("Not known");
    await expect(page.locator("#assessment-detail-content")).toContainText("Based on number of years in VICT program");
    await expect(page.locator("#assessment-detail-content")).toContainText("1/1 (100%)");
    await expect(page.locator("#assessment-detail-content")).toContainText("20 minutes");
  });

  await test.step("edit the assessment without creating a duplicate", async () => {
    await page.click('#assessment-detail-content a[href*="assessment-entry.html?edit="]');
    await expect(page.locator("#assessment-entry-status")).toHaveText("Ready");
    await expect(page.locator("#assessment-vict-years")).toHaveValue("2");
    await expect(page.locator("#assessment-level-reason")).toHaveValue("Based on number of years in VICT program");
    await expect(page.locator('[data-question-score="question-e2e-1"]')).toHaveValue("1");
    await page.fill("#assessment-vict-years", "3");
    await page.click("#save-assessment");
    await expect(page).toHaveURL(/assessment-dashboard\.html$/);
    await expect(page.locator("#assessment-summary-count")).toHaveText("1");
    await page.click("[data-assessment-detail]");
    await expect(page.locator("#assessment-detail-content")).toContainText("Years in VICT program");
    await expect(page.locator("#assessment-detail-content")).toContainText("3");
  });

  await test.step("show grade in analysis and export one CSV row per assessment", async () => {
    await page.click("#close-assessment-detail");
    await page.selectOption("#assessment-analysis-level", "ve");
    await expect(page.locator("#assessment-analysis-output")).toContainText("Grade 5");
    const downloadPromise = page.waitForEvent("download");
    await page.click("#download-assessment-csv");
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    let csv = "";
    for await (const chunk of stream) csv += chunk.toString("utf8");
    const lines = csv.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("questions_and_scoring_json");
    expect(lines[0]).toContain("total_marks_scored");
    expect(lines[0]).toContain("total_marks_available");
    expect(lines[0]).toContain("total_score_percent");
    expect(lines[0]).toContain("ct_outcome_ct1_level");
    expect(lines[1]).toContain("assessment-e2e-1");
  });
});

test("the selected site language controls download from the single English question bank", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("vict-site-language", "hi"));
  await page.goto("/assessment-question-bank.html");
  await expect(page.locator("#question-status")).toHaveText("Ready");
  await expect(page.locator("#site-language")).toHaveValue("hi");
  await expect(page.locator('[data-download-question-bank-id="bank-e2e-english"]')).toBeVisible();
  await expect(page.locator('[data-download-question-bank-csv-id="bank-e2e-english"]')).toBeVisible();
  await expect(page.locator("#question-bank-summary tr")).toHaveCount(1);
});

test("VICT Portal Updates is linked from Home and ordered newest first", async ({ page }) => {
  await page.goto("/index.html");
  const updateLinks = page.getByRole("link", { name: /VICT Portal Updates/ });
  await expect(updateLinks).toHaveCount(2);
  await expect(page.locator('[aria-labelledby="about-vict-title"] .home-card').last()).toHaveAttribute("href", "updates.html");
  await expect(page.locator('[aria-labelledby="monitoring-title"] .home-card').last()).toHaveAttribute("href", "updates.html");
  await expect(page.locator("[data-site-copyright]")).toContainText("Vision Empower");
  await updateLinks.first().click();
  await expect(page).toHaveURL(/updates\.html$/);
  await expect(page.getByRole("heading", { name: "VICT Portal Updates" })).toBeVisible();
  await expect(page.locator(".updates-timeline")).toContainText("b31188e");
  await expect(page.locator(".updates-timeline")).toContainText("09a662f");
  const dates = await page.locator(".updates-timeline time").evaluateAll((items) => items.map((item) => item.dateTime));
  expect(dates).toEqual(dates.slice().sort((a, b) => b.localeCompare(a)));
});
