const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
const questionLevels = {
  1: "1 - Beginners",
  2: "2 - Existing Students",
  3: "3 - Advanced"
};
let assessments = [];
let childRows = [];

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

function downloadCsv() {
  if (!assessments.length) {
    alert("No assessment data is available to download.");
    return;
  }
  const rows = [];
  assessments.forEach((entry) => {
    const score = scoreSummary(entry);
    const qualitative = (entry.qualitativeOutcomes || []).map((item) => `${item.outcomeCode} ${item.outcomeName}: ${item.rating}; suboutcomes: ${(item.suboutcomes || []).map((sub) => sub.suboutcomeCode).join("|")}`).join("; ");
    const base = {
      assessment_id: entry.id,
      date: entry.date,
      state: entry.state,
      district: entry.district,
      school: entry.school,
      student_name: entry.studentName,
      facilitator: entry.facilitator,
      level: questionLevels[entry.assessmentLevel] || entry.assessmentLevel,
      total_marks_obtained: score.earned,
      total_max_marks: score.max,
      score_percent: score.percent,
      free_play: entry.freePlayAssessment?.rating || "",
      qualitative_inputs: qualitative,
      other_observations: entry.otherObservations || "",
      accuracy_score: entry.accuracyScore
    };
    const questionRows = Array.isArray(entry.questionScores) && entry.questionScores.length ? entry.questionScores : [null];
    questionRows.forEach((question) => {
      rows.push({
        ...base,
        question_outcome: question ? [question.outcomeCode, question.outcomeName].filter(Boolean).join(" - ") : "",
        question: question?.questionText || "",
        question_marks: question?.marks ?? "",
        question_max_marks: question?.maxMarks ?? ""
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

$("#refresh-assessment-dashboard").addEventListener("click", refreshDashboard);
$("#download-assessment-csv").addEventListener("click", downloadCsv);
$("#assessment-dashboard-table").addEventListener("click", (event) => {
  const detail = event.target.closest("[data-assessment-detail]");
  if (detail) openAssessmentDetail(detail.dataset.assessmentDetail);
});
$("#close-assessment-detail").addEventListener("click", closeDetail);
$("#assessment-detail-modal").addEventListener("click", (event) => {
  if (event.target.id === "assessment-detail-modal") closeDetail();
});
refreshDashboard();
