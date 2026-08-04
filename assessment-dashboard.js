const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
const questionLevels = {
  1: "1 - Beginners",
  2: "2 - Existing Students",
  3: "3 - Advanced"
};
let assessments = [];

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

  $("#assessment-dashboard-table").innerHTML = assessments.length
    ? assessments.map((entry) => {
      const score = scoreSummary(entry);
      return `
        <tr>
          <td>${escapeHtml(entry.date)}</td>
          <td>${escapeHtml(entry.state)}</td>
          <td>${escapeHtml(entry.district)}</td>
          <td>${escapeHtml(entry.school)}</td>
          <td>${escapeHtml(entry.studentName)}</td>
          <td>${escapeHtml(entry.facilitator)}</td>
          <td>${escapeHtml(questionLevels[entry.assessmentLevel] || entry.assessmentLevel)}</td>
          <td>${escapeHtml(`${score.earned}/${score.max} (${score.percent}%)`)}</td>
          <td>${escapeHtml(entry.freePlayAssessment?.rating || "")}</td>
          <td>${escapeHtml(entry.accuracyScore)}</td>
          <td><button class="table-button" type="button" data-assessment-detail="${escapeAttr(entry.id)}">Show</button></td>
        </tr>
      `;
    }).join("")
    : '<tr><td colspan="11" class="muted">No assessment entries have been saved yet.</td></tr>';
}

function openAssessmentDetail(id) {
  const entry = assessments.find((item) => item.id === id);
  if (!entry) return;
  const score = scoreSummary(entry);
  $("#assessment-detail-title").textContent = `${entry.studentName} assessment`;
  $("#assessment-detail-content").innerHTML = `
    <div class="profile-lines">
      <div><strong>Date</strong><span>${escapeHtml(entry.date)}</span></div>
      <div><strong>Level</strong><span>${escapeHtml(questionLevels[entry.assessmentLevel] || entry.assessmentLevel)}</span></div>
      <div><strong>School</strong><span>${escapeHtml(`${entry.school}, ${entry.district}, ${entry.state}`)}</span></div>
      <div><strong>Facilitator</strong><span>${escapeHtml(entry.facilitator)}</span></div>
      <div><strong>Score</strong><span>${escapeHtml(`${score.earned}/${score.max} (${score.percent}%)`)}</span></div>
      <div><strong>Accuracy</strong><span>${escapeHtml(entry.accuracyScore)}</span></div>
    </div>
    <section class="section-heading compact"><h2>Question scores</h2></section>
    <div class="table-wrap">
      <table class="data-table assessment-entry-table">
        <thead><tr><th>Theme</th><th>Outcome</th><th>Question</th><th>Marks</th><th>Max Marks</th></tr></thead>
        <tbody>${renderQuestionScores(entry.questionScores)}</tbody>
      </table>
    </div>
    <section class="section-heading compact"><h2>Free play</h2></section>
    <p>${escapeHtml(entry.freePlayAssessment?.rating || "")}</p>
    <section class="section-heading compact"><h2>Qualitative Assessment Inputs</h2></section>
    <div class="table-wrap">
      <table class="data-table assessment-entry-table">
        <thead><tr><th>Outcome</th><th>Rating</th><th>Selected Suboutcomes</th></tr></thead>
        <tbody>${renderQualitativeOutcomes(entry.qualitativeOutcomes)}</tbody>
      </table>
    </div>
    <section class="section-heading compact"><h2>Any other observations</h2></section>
    <p>${escapeHtml(entry.otherObservations || "")}</p>
  `;
  $("#assessment-detail-modal").classList.remove("hidden");
}

function renderQuestionScores(scores) {
  const rows = Array.isArray(scores) ? scores : [];
  return rows.length ? rows.map((item) => `
    <tr>
      <td>${escapeHtml(item.questionTheme || "")}</td>
      <td>${escapeHtml([item.outcomeCode, item.outcomeName].filter(Boolean).join(" - "))}</td>
      <td>${escapeHtml(item.questionText || "")}</td>
      <td>${escapeHtml(item.marks)}</td>
      <td>${escapeHtml(item.maxMarks)}</td>
    </tr>
  `).join("") : '<tr><td colspan="5" class="muted">No question scores recorded.</td></tr>';
}

function renderQualitativeOutcomes(items) {
  const rows = Array.isArray(items) ? items : [];
  return rows.length ? rows.map((item) => `
    <tr>
      <td>${escapeHtml([item.outcomeCode, item.outcomeName].filter(Boolean).join(" - "))}</td>
      <td>${escapeHtml(`${item.rating || ""} - ${item.scaleName || ""}`)}</td>
      <td>${escapeHtml((item.suboutcomes || []).map((sub) => `${sub.suboutcomeCode} - ${sub.suboutcomeName}`).join("; "))}</td>
    </tr>
  `).join("") : '<tr><td colspan="3" class="muted">No qualitative inputs recorded.</td></tr>';
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
$("#assessment-dashboard-table").addEventListener("click", (event) => {
  const detail = event.target.closest("[data-assessment-detail]");
  if (detail) openAssessmentDetail(detail.dataset.assessmentDetail);
});
$("#close-assessment-detail").addEventListener("click", closeDetail);
$("#assessment-detail-modal").addEventListener("click", (event) => {
  if (event.target.id === "assessment-detail-modal") closeDetail();
});
refreshDashboard();
