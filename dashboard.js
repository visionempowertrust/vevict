const learningAreas = [
  "Number recognition",
  "Systematic counting",
  "Pattern recognition",
  "Sorting and classification",
  "Data recording",
  "Spatial reasoning",
  "Algorithmic thinking",
  "Collaboration"
];

const kliEvidenceItems = [
  ["recognizes-numbers", "Recognizes numbers or quantities"],
  ["counts-systematically", "Counts systematically"],
  ["finds-patterns", "Finds or extends patterns"],
  ["sorts-classifies", "Sorts or classifies objects"],
  ["records-data", "Records or compares data"],
  ["uses-space", "Uses spatial reasoning"],
  ["plans-steps", "Plans steps or strategy"],
  ["collaborates", "Collaborates during play"],
  ["increases-independence", "Shows increased independence"],
  ["uses-access-tools", "Uses access tools effectively"]
].map(([id, label]) => ({ id, label }));

const storageKey = "vict-progress-tracker-v1";
const $ = (selector) => document.querySelector(selector);
const dbStore = window.VictSupabaseStore;
let state = loadState();
let activeStudentId = state.students[0]?.id || null;

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || { students: [] };
  } catch {
    return { students: [] };
  }
}

function render() {
  renderSummary();
  renderStudentList();
  renderDetail();
}

function isDbEnabled() {
  return Boolean(dbStore?.isEnabled());
}

async function refreshFromSupabase() {
  if (!isDbEnabled()) {
    alert("Supabase is not configured yet. Update supabase-config.js after creating the database.");
    return;
  }
  try {
    const remoteState = await dbStore.loadState();
    state = remoteState || { students: [] };
    localStorage.setItem(storageKey, JSON.stringify(state));
    activeStudentId = state.students[0]?.id || null;
    render();
  } catch (error) {
    alert(`Could not refresh from Supabase: ${error.message}`);
  }
}

function renderSummary() {
  const students = state.students || [];
  const totalSessions = students.reduce((sum, student) => sum + (student.sessions || []).length, 0);
  $("#student-count").textContent = `${students.length} student${students.length === 1 ? "" : "s"}`;
  $("#summary-students").textContent = students.length;
  $("#summary-active").textContent = students.filter((student) => (student.sessions || []).length).length;
  $("#summary-sessions").textContent = totalSessions;
}

function renderStudentList() {
  const list = $("#dashboard-list");
  const students = [...(state.students || [])].sort((a, b) => {
    const aDate = latestSession(a)?.date || "";
    const bDate = latestSession(b)?.date || "";
    return bDate.localeCompare(aDate) || a.name.localeCompare(b.name);
  });

  if (!students.length) {
    list.innerHTML = '<p class="muted">No students have been added yet. Add students from the session entry page.</p>';
    return;
  }

  list.innerHTML = students.map((student) => {
    const latest = latestSession(student);
    const status = studentStatus(student);
    const average = averageLatestScore(student);
    return `
      <button class="dashboard-card ${student.id === activeStudentId ? "active" : ""}" type="button" data-student-id="${student.id}">
        <div class="card-top">
          <div>
            <strong>${escapeHtml(student.name)}</strong>
            <span>${escapeHtml([student.school, student.level].filter(Boolean).join(" | ") || "No school or level set")}</span>
          </div>
          <span class="status-badge ${latest ? "" : "empty"}">${status}</span>
        </div>
        <div class="status-line">
          <span>${latest ? `Latest: ${escapeHtml(latest.game)} on ${escapeHtml(latest.date)}` : "No sessions recorded"}</span>
          <strong>${average.toFixed(1)}/4</strong>
        </div>
      </button>
    `;
  }).join("");

  list.querySelectorAll("[data-student-id]").forEach((button) => {
    button.addEventListener("click", () => {
      activeStudentId = button.dataset.studentId;
      render();
    });
  });
}

function renderDetail() {
  const student = (state.students || []).find((item) => item.id === activeStudentId);
  $("#detail-empty").classList.toggle("hidden", Boolean(student));
  $("#student-detail").classList.toggle("hidden", !student);
  if (!student) return;

  const sessions = sortedSessions(student);
  const latest = sessions[0];
  $("#detail-name").textContent = student.name;
  $("#detail-meta").textContent = [student.school, student.level, student.accessNotes].filter(Boolean).join(" | ") || "Profile details not set";
  $("#detail-status").textContent = studentStatus(student);
  $("#detail-status").classList.toggle("empty", !latest);
  $("#latest-status").innerHTML = renderLatestStatus(student, latest);
  $("#detail-history").innerHTML = renderHistory(sessions);
}

function renderLatestStatus(student, latest) {
  if (!latest) {
    return "<p>No session entries yet.</p>";
  }

  const scores = latestAreaScores(student.sessions || []);
  const strongest = Object.entries(scores)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3)
    .map(([area, score]) => `<span class="tag">${escapeHtml(area)} ${score}/4</span>`)
    .join("");

  return `
    <div class="history-meta"><span>${escapeHtml(latest.date)} | ${escapeHtml(latest.mode)}</span><span>${escapeHtml(latest.facilitator || "No facilitator")}</span></div>
    <p><strong>Latest game</strong><br>${escapeHtml(latest.game)} (${escapeHtml(latest.category)})</p>
    <p><strong>Latest average score</strong><br>${averageLatestScore(student).toFixed(1)}/4 across learning areas</p>
    <div class="tag-list">${strongest}</div>
  `;
}

function renderHistory(sessions) {
  if (!sessions.length) {
    return "<p>No sessions recorded yet.</p>";
  }

  return sessions.map((session) => {
    const scores = Object.entries(session.scores || {})
      .filter(([, score]) => Number(score) > 0)
      .map(([area, score]) => `<span class="tag">${escapeHtml(area)} ${score}/4</span>`)
      .join("");
    const kli = getKliEvidenceText(session);
    return `
      <article class="history-item">
        <div class="history-meta"><span>${escapeHtml(session.date)} | ${escapeHtml(session.mode)}</span><span>${escapeHtml(session.facilitator || "No facilitator")}</span></div>
        <strong>${escapeHtml(session.game)}</strong>
        <span>${escapeHtml(session.category || "Uncategorized")}</span>
        ${kli ? `<p><strong>KLI evidence</strong><br>${escapeHtml(kli)}</p>` : ""}
        ${session.observation ? `<p><strong>Observation</strong><br>${escapeHtml(session.observation)}</p>` : ""}
        <div class="tag-list">${scores}</div>
      </article>
    `;
  }).join("");
}

function sortedSessions(student) {
  return [...(student.sessions || [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

function latestSession(student) {
  return sortedSessions(student)[0];
}

function studentStatus(student) {
  const sessions = student.sessions || [];
  if (!sessions.length) return "Not started";
  const average = averageLatestScore(student);
  if (average >= 3.4) return "Strong progress";
  if (average >= 2.4) return "Developing";
  return "Needs support";
}

function averageLatestScore(student) {
  const scores = Object.values(latestAreaScores(student.sessions || []));
  if (!scores.length) return 0;
  return scores.reduce((sum, score) => sum + Number(score || 0), 0) / scores.length;
}

function latestAreaScores(sessions) {
  const scores = Object.fromEntries(learningAreas.map((area) => [area, 0]));
  sessions.forEach((session) => {
    Object.assign(scores, session.scores || {});
  });
  return scores;
}

function getKliEvidenceText(session) {
  const labels = (session.kliEvidenceItems || []).map((itemId) => {
    return kliEvidenceItems.find((item) => item.id === itemId)?.label || itemId;
  });
  const notes = session.kliEvidenceNotes || "";
  if (labels.length || notes) {
    return [...labels, notes].filter(Boolean).join("; ");
  }
  return session.kliEvidence || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

$("#refresh-dashboard").addEventListener("click", refreshFromSupabase);

render();
if (isDbEnabled()) {
  refreshFromSupabase();
}
