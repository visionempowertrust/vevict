const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
const questionLevels = {
  1: "1",
  2: "2",
  3: "3"
};
let assessments = [];
let childRows = [];
const ratingLabels = ["Missing", "Adequate", "Acquired"];

function scoreSummary(entry) {
  const scores = Array.isArray(entry.questionScores) ? entry.questionScores : [];
  const earned = scores.reduce((sum, item) => sum + Number(item.marks || 0), 0);
  const max = scores.reduce((sum, item) => sum + Number(item.maxMarks || 0), 0);
  return {
    earned,
    max,
    percent: max ? Math.round((earned / max) * 100) : 0
  };
}

function renderDashboard() {
  $("#assessment-summary-count").textContent = assessments.length;
  $("#assessment-summary-students").textContent = new Set(assessments.map((entry) => `${entry.state}|${entry.district}|${entry.school}|${entry.studentName}`)).size;
  const percents = assessments.map((entry) => scoreSummary(entry).percent);
  const average = percents.length ? Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length) : 0;
  $("#assessment-summary-average").textContent = `${average}%`;

  childRows = buildChildRows();
  $("#assessment-dashboard-table").innerHTML = childRows.length
    ? childRows.map((row) => {
      return `
        <tr>
          <td>${escapeHtml(row.state)}</td>
          <td>${escapeHtml(row.district)}</td>
          <td>${escapeHtml(row.school)}</td>
          <td>${escapeHtml(row.studentName)}</td>
          <td>${escapeHtml(row.assessmentCount)}</td>
          <td>${escapeHtml(row.latestDate)}</td>
          <td>${escapeHtml(row.levels)}</td>
          <td><button class="table-button" type="button" data-assessment-detail="${escapeAttr(row.key)}">Show</button></td>
        </tr>
      `;
    }).join("")
    : '<tr><td colspan="8" class="muted">No assessment entries have been saved yet.</td></tr>';
  renderAnalysisFilters();
  renderAssessmentAnalysis();
}

function buildChildRows() {
  const groups = new Map();
  assessments.forEach((entry) => {
    const key = [entry.state, entry.district, entry.school, entry.studentName].map((value) => String(value || "").trim().toLowerCase()).join("||");
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        state: entry.state,
        district: entry.district,
        school: entry.school,
        studentName: entry.studentName,
        entries: []
      });
    }
    groups.get(key).entries.push(entry);
  });
  return [...groups.values()].map((row) => {
    const sorted = row.entries.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    const levels = [...new Set(sorted.map((entry) => questionLevels[entry.assessmentLevel] || entry.assessmentLevel))].join(", ");
    return {
      ...row,
      entries: sorted,
      assessmentCount: sorted.length,
      latestDate: sorted[0]?.date || "",
      levels
    };
  }).sort((a, b) => a.state.localeCompare(b.state) || a.district.localeCompare(b.district) || a.school.localeCompare(b.school) || a.studentName.localeCompare(b.studentName));
}

function openAssessmentDetail(key) {
  const row = childRows.find((item) => item.key === key);
  if (!row) return;
  $("#assessment-detail-title").textContent = `${row.studentName} assessment history`;
  $("#assessment-detail-content").innerHTML = `
    <div class="profile-lines">
      <div><strong>State</strong><span>${escapeHtml(row.state)}</span></div>
      <div><strong>District</strong><span>${escapeHtml(row.district)}</span></div>
      <div><strong>School</strong><span>${escapeHtml(row.school)}</span></div>
      <div><strong>Student Name</strong><span>${escapeHtml(row.studentName)}</span></div>
      <div><strong>Assessments</strong><span>${escapeHtml(row.assessmentCount)}</span></div>
      <div><strong>Latest Assessment</strong><span>${escapeHtml(row.latestDate)}</span></div>
    </div>
    ${row.entries.map(renderAssessmentDetail).join("")}
  `;
  $("#assessment-detail-modal").classList.remove("hidden");
  $("#close-assessment-detail").focus();
}

function renderAssessmentDetail(entry) {
  const score = scoreSummary(entry);
  return `
    <section class="assessment-detail-block">
      <div class="section-heading compact">
        <h2>${escapeHtml(entry.date)} - ${escapeHtml(questionLevels[entry.assessmentLevel] || entry.assessmentLevel)}</h2>
        <span class="muted">${escapeHtml(`${score.earned}/${score.max} (${score.percent}%)`)}</span>
      </div>
      <div class="profile-lines">
        <div><strong>Facilitator</strong><span>${escapeHtml(entry.facilitator)}</span></div>
        <div><strong>Free play</strong><span>${escapeHtml(entry.freePlayAssessment?.rating || "")}</span></div>
        <div><strong>Accuracy</strong><span>${escapeHtml(entry.accuracyScore)}</span></div>
      </div>
      <div class="table-wrap">
        <table class="data-table assessment-entry-table">
          <thead><tr><th>Outcome</th><th>Question</th><th>Marks</th><th>Max Marks</th></tr></thead>
          <tbody>${renderQuestionScores(entry.questionScores)}</tbody>
        </table>
      </div>
      <section class="section-heading compact"><h2>Qualitative Assessment Inputs</h2></section>
      <div class="table-wrap">
        <table class="data-table assessment-entry-table">
          <thead><tr><th>Outcome</th><th>Rating</th><th>Selected Suboutcomes</th></tr></thead>
          <tbody>${renderQualitativeOutcomes(entry.qualitativeOutcomes)}</tbody>
        </table>
      </div>
      <section class="section-heading compact"><h2>Any other observations</h2></section>
      <p>${escapeHtml(entry.otherObservations || "")}</p>
    </section>
  `;
}

function renderQuestionScores(scores) {
  const rows = Array.isArray(scores) ? scores : [];
  return rows.length ? rows.map((item) => `
    <tr>
      <td>${escapeHtml([item.outcomeCode, item.outcomeName].filter(Boolean).join(" - "))}</td>
      <td>${escapeHtml(item.questionText || "")}</td>
      <td>${escapeHtml(item.marks)}</td>
      <td>${escapeHtml(item.maxMarks)}</td>
    </tr>
  `).join("") : '<tr><td colspan="4" class="muted">No question scores recorded.</td></tr>';
}

function renderQualitativeOutcomes(items) {
  const rows = Array.isArray(items) ? items : [];
  return rows.length ? rows.map((item) => `
    <tr>
      <td>${escapeHtml([item.outcomeCode, item.outcomeName].filter(Boolean).join(" - "))}</td>
      <td>${escapeHtml(item.rating || "")}</td>
      <td>${escapeHtml((item.suboutcomes || []).map((sub) => `${sub.suboutcomeCode} - ${sub.suboutcomeName}`).join("; "))}</td>
    </tr>
  `).join("") : '<tr><td colspan="3" class="muted">No qualitative inputs recorded.</td></tr>';
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function studentKey(entry) {
  return [entry.state, entry.district, entry.school, entry.studentId || entry.studentName]
    .map((value) => String(value || "").trim().toLowerCase())
    .join("||");
}

function optionList(values, selected = "") {
  return values.map((value) => `<option value="${escapeAttr(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
}

function renderAnalysisFilters() {
  const level = $("#assessment-analysis-level").value;
  const current = currentAnalysisFilters();
  const states = uniqueSorted(assessments.map((entry) => entry.state));
  const selectedState = states.includes(current.state) ? current.state : states[0] || "";
  const districts = uniqueSorted(assessments.filter((entry) => entry.state === selectedState).map((entry) => entry.district));
  const selectedDistrict = districts.includes(current.district) ? current.district : districts[0] || "";
  const schools = uniqueSorted(assessments
    .filter((entry) => entry.state === selectedState && (!selectedDistrict || entry.district === selectedDistrict))
    .map((entry) => entry.school));
  const selectedSchool = schools.includes(current.school) ? current.school : schools[0] || "";
  const students = uniqueSorted(assessments
    .filter((entry) => entry.state === selectedState && entry.district === selectedDistrict && entry.school === selectedSchool)
    .map((entry) => entry.studentName));
  const selectedStudent = students.includes(current.student) ? current.student : students[0] || "";
  const filters = [];
  if (["student", "school", "state"].includes(level)) {
    filters.push(`<div><label for="analysis-state">State</label><select id="analysis-state">${optionList(states, selectedState)}</select></div>`);
  }
  if (["student", "school"].includes(level)) {
    filters.push(`<div><label for="analysis-district">District</label><select id="analysis-district">${optionList(districts, selectedDistrict)}</select></div>`);
    filters.push(`<div><label for="analysis-school">School</label><select id="analysis-school">${optionList(schools, selectedSchool)}</select></div>`);
  }
  if (level === "student") {
    filters.push(`<div><label for="analysis-student">Student</label><select id="analysis-student">${optionList(students, selectedStudent)}</select></div>`);
  }
  $("#assessment-analysis-filters").innerHTML = filters.join("");
}

function currentAnalysisFilters() {
  return {
    state: $("#analysis-state")?.value || "",
    district: $("#analysis-district")?.value || "",
    school: $("#analysis-school")?.value || "",
    student: $("#analysis-student")?.value || ""
  };
}

function filteredAnalysisEntries() {
  const level = $("#assessment-analysis-level").value;
  const filters = currentAnalysisFilters();
  return assessments.filter((entry) => {
    if ((level === "student" || level === "school" || level === "state") && entry.state !== filters.state) return false;
    if ((level === "student" || level === "school") && entry.district !== filters.district) return false;
    if ((level === "student" || level === "school") && entry.school !== filters.school) return false;
    if (level === "student" && entry.studentName !== filters.student) return false;
    return true;
  });
}

function latestAssessmentEntries(entries) {
  const latest = new Map();
  entries.forEach((entry) => {
    const key = studentKey(entry);
    const current = latest.get(key);
    if (!current || compareAssessmentDateDesc(entry, current) < 0) latest.set(key, entry);
  });
  return [...latest.values()].sort(compareAssessmentDateDesc);
}

function compareAssessmentDateDesc(a, b) {
  return String(b.date || "").localeCompare(String(a.date || "")) ||
    String(b.id || "").localeCompare(String(a.id || ""));
}

function renderAssessmentAnalysis() {
  const level = $("#assessment-analysis-level").value;
  const entries = filteredAnalysisEntries();
  const latestEntries = latestAssessmentEntries(entries);
  $("#assessment-analysis-status").textContent = `${latestEntries.length} latest assessment${latestEntries.length === 1 ? "" : "s"} selected`;
  if (!assessments.length) {
    $("#assessment-analysis-output").innerHTML = '<p class="muted">No assessment entries have been saved yet.</p>';
    return;
  }
  if (!entries.length) {
    $("#assessment-analysis-output").innerHTML = '<p class="muted">No assessments match the selected filters.</p>';
    return;
  }
  const renderers = {
    student: renderStudentAnalysis,
    school: renderSchoolAnalysis,
    state: renderStateAnalysis,
    ve: renderVeAnalysis
  };
  $("#assessment-analysis-output").innerHTML = renderers[level](latestEntries);
}

function renderStudentAnalysis(entries) {
  const sorted = latestAssessmentEntries(entries);
  return `
    <div class="table-wrap">
      <table class="data-table assessment-dashboard-table">
        <thead><tr><th>Latest Assessment Date</th><th>Level</th><th>Score</th><th>Qualitative Ratings</th><th>Details</th></tr></thead>
        <tbody>${sorted.map((entry) => {
          const score = scoreSummary(entry);
          return `
            <tr>
              <td><button class="table-button" type="button" data-analysis-assessment="${escapeAttr(entry.id)}">${escapeHtml(entry.date)}</button></td>
              <td>${escapeHtml(questionLevels[entry.assessmentLevel] || entry.assessmentLevel)}</td>
              <td>${escapeHtml(`${score.earned}/${score.max} (${score.percent}%)`)}</td>
              <td>${escapeHtml(ratingSummary(entry.qualitativeOutcomes))}</td>
              <td><button class="table-button" type="button" data-analysis-assessment="${escapeAttr(entry.id)}">Show</button></td>
            </tr>
          `;
        }).join("")}</tbody>
      </table>
    </div>
    <p class="muted">Analysis uses only the latest completed assessment for the selected student.</p>
    ${renderAnalysisSummary("Student Level", entries)}
  `;
}

function renderSchoolAnalysis(entries) {
  const rows = aggregateOutcomeRatings(entries, false);
  return `
    <div class="table-wrap">
      <table class="data-table assessment-dashboard-table">
        <thead><tr><th>Level</th><th>CT Skill</th><th>Assessments</th><th>Students</th><th>Missing</th><th>Adequate</th><th>Acquired</th></tr></thead>
        <tbody>${rows.length ? rows.map(renderOutcomeAggregateRow).join("") : '<tr><td colspan="7" class="muted">No qualitative CT outcome ratings recorded for this filter.</td></tr>'}</tbody>
      </table>
    </div>
    <p class="muted">Analysis uses only each student's latest completed assessment, so students with multiple assessments are counted once.</p>
    ${renderAnalysisSummary("School Level", entries)}
  `;
}

function renderStateAnalysis(entries) {
  const rows = aggregateOutcomeRatings(entries, true);
  const schoolCount = new Set(entries.map((entry) => `${entry.district || ""}|${entry.school || ""}`).filter((key) => key !== "|")).size;
  const studentCount = new Set(entries.map(studentKey)).size;
  return `
    <div class="metrics-grid dashboard-summary" aria-label="State assessment analysis summary">
      <div class="metric"><span>${escapeHtml(schoolCount)}</span><p>Schools</p></div>
      <div class="metric"><span>${escapeHtml(studentCount)}</span><p>Students assessed</p></div>
      <div class="metric"><span>${escapeHtml(entries.length)}</span><p>Latest assessments</p></div>
    </div>
    <div class="table-wrap">
      <table class="data-table assessment-dashboard-table">
        <thead><tr><th>School</th><th>Level</th><th>CT Skill</th><th>Assessments</th><th>Students</th><th>Missing</th><th>Adequate</th><th>Acquired</th></tr></thead>
        <tbody>${rows.length ? rows.map(renderOutcomeAggregateRow).join("") : '<tr><td colspan="8" class="muted">No qualitative CT outcome ratings recorded for this filter.</td></tr>'}</tbody>
      </table>
    </div>
    <p class="muted">Analysis uses only each student's latest completed assessment, so students with multiple assessments are counted once.</p>
    ${renderAnalysisSummary("State Level", entries)}
  `;
}

function renderVeAnalysis(entries) {
  const rows = aggregateOutcomeRatings(entries, false);
  return `
    <div class="metrics-grid dashboard-summary" aria-label="VE assessment analysis">
      <div class="metric"><span>${escapeHtml(new Set(entries.map(studentKey)).size)}</span><p>Students assessed</p></div>
      <div class="metric"><span>${escapeHtml(new Set(entries.map((entry) => `${entry.state}|${entry.district}|${entry.school}`)).size)}</span><p>Schools</p></div>
      <div class="metric"><span>${escapeHtml(new Set(entries.map((entry) => entry.state).filter(Boolean)).size)}</span><p>States</p></div>
      <div class="metric"><span>${escapeHtml(entries.length)}</span><p>Assessments</p></div>
    </div>
    <div class="table-wrap">
      <table class="data-table assessment-dashboard-table">
        <thead><tr><th>Level</th><th>CT Skill</th><th>Assessments</th><th>Students</th><th>Missing</th><th>Adequate</th><th>Acquired</th></tr></thead>
        <tbody>${rows.length ? rows.map(renderOutcomeAggregateRow).join("") : '<tr><td colspan="7" class="muted">No qualitative CT outcome ratings recorded yet.</td></tr>'}</tbody>
      </table>
    </div>
    <p class="muted">Analysis uses only each student's latest completed assessment, so students with multiple assessments are counted once.</p>
  `;
}

function aggregateOutcomeRatings(entries, includeSchool) {
  const groups = new Map();
  entries.forEach((entry) => {
    (entry.qualitativeOutcomes || []).forEach((outcome) => {
      const level = questionLevels[entry.assessmentLevel] || entry.assessmentLevel || "";
      const skill = [outcome.outcomeCode, outcome.outcomeName].filter(Boolean).join(" - ") || "Unmapped CT Outcome";
      const key = [includeSchool ? entry.school : "", level, skill].join("||");
      if (!groups.has(key)) {
        groups.set(key, {
          school: includeSchool ? entry.school : "",
          level,
          skill,
          assessments: 0,
          students: new Set(),
          Missing: new Set(),
          Adequate: new Set(),
          Acquired: new Set()
        });
      }
      const group = groups.get(key);
      const rating = normalizeRating(outcome.rating);
      const keyStudent = studentKey(entry);
      group.assessments += 1;
      group.students.add(keyStudent);
      if (group[rating]) group[rating].add(keyStudent);
    });
  });
  return [...groups.values()].sort((a, b) =>
    a.school.localeCompare(b.school) ||
    String(a.level).localeCompare(String(b.level)) ||
    a.skill.localeCompare(b.skill)
  );
}

function renderOutcomeAggregateRow(row) {
  const schoolCell = row.school ? `<td>${escapeHtml(row.school)}</td>` : "";
  return `
    <tr>
      ${schoolCell}
      <td>${escapeHtml(row.level)}</td>
      <td>${escapeHtml(row.skill)}</td>
      <td>${escapeHtml(row.assessments)}</td>
      <td>${escapeHtml(row.students.size)}</td>
      <td>${escapeHtml(row.Missing.size)}</td>
      <td>${escapeHtml(row.Adequate.size)}</td>
      <td>${escapeHtml(row.Acquired.size)}</td>
    </tr>
  `;
}

function ratingSummary(items) {
  const counts = { Missing: 0, Adequate: 0, Acquired: 0 };
  (items || []).forEach((item) => {
    const rating = normalizeRating(item.rating);
    counts[rating] += 1;
  });
  return ratingLabels.map((rating) => `${rating}: ${counts[rating]}`).join(", ");
}

function renderAnalysisSummary(label, entries) {
  const latestByStudentOutcome = new Map();
  entries.slice().sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))).forEach((entry) => {
    (entry.qualitativeOutcomes || []).forEach((outcome) => {
      const key = `${studentKey(entry)}||${outcome.outcomeCode || outcome.outcomeName}`;
      latestByStudentOutcome.set(key, { entry, outcome, rating: normalizeRating(outcome.rating) });
    });
  });
  const totals = { Missing: 0, Adequate: 0, Acquired: 0 };
  latestByStudentOutcome.forEach((item) => {
    totals[item.rating] += 1;
  });
  const strongest = strongestOutcome(entries);
  const parts = [
    `${label} analysis is based on ${entries.length} assessment${entries.length === 1 ? "" : "s"} across ${new Set(entries.map(studentKey)).size} student${new Set(entries.map(studentKey)).size === 1 ? "" : "s"}.`,
    `Latest observed CT outcome ratings show ${totals.Acquired} acquired, ${totals.Adequate} adequate, and ${totals.Missing} missing observations.`,
    strongest ? `The strongest visible area is ${strongest.skill}, with ${strongest.acquired} student${strongest.acquired === 1 ? "" : "s"} at acquired level.` : "More qualitative outcome data is needed before a reliable growth pattern can be summarized."
  ];
  return `<section class="analysis-summary"><h2>AI analysis summary</h2><p>${escapeHtml(parts.join(" "))}</p></section>`;
}

function strongestOutcome(entries) {
  const rows = aggregateOutcomeRatings(entries, false);
  return rows.reduce((best, row) => {
    const acquired = row.Acquired.size;
    if (!best || acquired > best.acquired) return { skill: row.skill, acquired };
    return best;
  }, null);
}

function normalizeRating(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "acquired") return "Acquired";
  if (text === "adequate") return "Adequate";
  return "Missing";
}

function openSingleAssessmentDetail(id) {
  const entry = assessments.find((item) => item.id === id);
  if (!entry) return;
  $("#assessment-detail-title").textContent = `${entry.studentName} - ${entry.date}`;
  $("#assessment-detail-content").innerHTML = renderAssessmentDetail(entry);
  $("#assessment-detail-modal").classList.remove("hidden");
  $("#close-assessment-detail").focus();
}

function downloadCsv() {
  if (!assessments.length) {
    alert("No assessment data is available to download.");
    return;
  }
  const rows = [];
  assessments
    .slice()
    .sort((a, b) =>
      String(a.state || "").localeCompare(String(b.state || "")) ||
      String(a.district || "").localeCompare(String(b.district || "")) ||
      String(a.school || "").localeCompare(String(b.school || "")) ||
      String(a.studentName || "").localeCompare(String(b.studentName || "")) ||
      String(b.date || "").localeCompare(String(a.date || ""))
    )
    .forEach((entry) => {
    const score = scoreSummary(entry);
    const qualitative = (entry.qualitativeOutcomes || []).map((item) => `${item.outcomeCode} ${item.outcomeName}: ${item.rating}; suboutcomes: ${(item.suboutcomes || []).map((sub) => `${sub.suboutcomeCode} ${sub.suboutcomeName}`).join("|")}`).join("; ");
    const base = {
      assessment_id: entry.id,
      assessment_date: entry.date,
      state: entry.state,
      district: entry.district,
      school: entry.school,
      student_id: entry.studentId,
      student_name: entry.studentName,
      facilitator: entry.facilitator,
      level: questionLevels[entry.assessmentLevel] || entry.assessmentLevel,
      total_marks_obtained: score.earned,
      total_max_marks: score.max,
      score_percent: score.percent,
      free_play_prompt: entry.freePlayAssessment?.prompt || "",
      free_play_rating: entry.freePlayAssessment?.rating || "",
      qualitative_inputs: qualitative,
      other_observations: entry.otherObservations || "",
      accuracy_score: entry.accuracyScore
    };
    const questionRows = Array.isArray(entry.questionScores) && entry.questionScores.length ? entry.questionScores : [null];
    questionRows.forEach((question) => {
      const matchingQualitative = question ? (entry.qualitativeOutcomes || []).find((item) => item.outcomeCode === question.outcomeCode) : null;
      rows.push({
        ...base,
        question_id: question?.questionId || "",
        question_level: question?.questionLevel || "",
        question_order: question?.questionOrder || "",
        question_outcome: question ? [question.outcomeCode, question.outcomeName].filter(Boolean).join(" - ") : "",
        question: question?.questionText || "",
        question_marks: question?.marks ?? "",
        question_max_marks: question?.maxMarks ?? "",
        outcome_rating_for_question: matchingQualitative?.rating || "",
        selected_suboutcomes_for_question: matchingQualitative ? (matchingQualitative.suboutcomes || []).map((sub) => `${sub.suboutcomeCode} - ${sub.suboutcomeName}`).join("; ") : ""
      });
    });
  });
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))
  ].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vict-assessments-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function refreshDashboard() {
  if (!dbStore?.isEnabled()) {
    $("#assessment-dashboard-status").textContent = "Supabase not configured";
    return;
  }
  $("#assessment-dashboard-status").textContent = "Loading...";
  try {
    assessments = await dbStore.loadAssessmentDashboardData();
    renderDashboard();
    $("#assessment-dashboard-status").textContent = "Ready";
  } catch (error) {
    $("#assessment-dashboard-status").textContent = "Load failed";
    alert(`Could not load assessment dashboard: ${error.message}`);
  }
}

function closeDetail() {
  $("#assessment-detail-modal").classList.add("hidden");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/\n/g, " ");
}

$("#download-assessment-csv").addEventListener("click", downloadCsv);
$("#assessment-dashboard-table").addEventListener("click", (event) => {
  const detail = event.target.closest("[data-assessment-detail]");
  if (detail) openAssessmentDetail(detail.dataset.assessmentDetail);
});
$("#assessment-analysis-level").addEventListener("change", () => {
  renderAnalysisFilters();
  renderAssessmentAnalysis();
});
$("#assessment-analysis-filters").addEventListener("change", () => {
  renderAnalysisFilters();
  renderAssessmentAnalysis();
});
$("#run-assessment-analysis").addEventListener("click", renderAssessmentAnalysis);
$("#assessment-analysis-output").addEventListener("click", (event) => {
  const detail = event.target.closest("[data-analysis-assessment]");
  if (detail) openSingleAssessmentDetail(detail.dataset.analysisAssessment);
});
$("#close-assessment-detail").addEventListener("click", closeDetail);
$("#assessment-detail-modal").addEventListener("click", (event) => {
  if (event.target.id === "assessment-detail-modal") closeDetail();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("#assessment-detail-modal").classList.contains("hidden")) closeDetail();
});
refreshDashboard();
