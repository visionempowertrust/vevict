const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
let dashboardData = { sessions: [] };
let dashboardRows = [];

function isDbEnabled() {
  return Boolean(dbStore?.isEnabled());
}

async function refreshDashboard() {
  if (!isDbEnabled()) {
    $("#dashboard-status").textContent = "Supabase not configured";
    $("#dashboard-table").innerHTML = '<tr><td colspan="7" class="muted">Configure Supabase to load dashboard data.</td></tr>';
    return;
  }

  $("#dashboard-status").textContent = "Loading...";
  try {
    dashboardData = await dbStore.loadDashboardData();
    renderDashboard();
    $("#dashboard-status").textContent = "Ready";
  } catch (error) {
    $("#dashboard-status").textContent = "Load failed";
    alert(`Could not load dashboard data: ${error.message}`);
  }
}

function renderDashboard() {
  const rows = buildRows();
  dashboardRows = rows;
  $("#summary-students").textContent = rows.length;

  if (!rows.length) {
    $("#dashboard-table").innerHTML = '<tr><td colspan="7" class="muted">No facilitator sessions have been entered yet.</td></tr>';
    return;
  }

  $("#dashboard-table").innerHTML = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.state)}</td>
      <td>${escapeHtml(row.district)}</td>
      <td>${escapeHtml(row.school)}</td>
      <td><button class="link-button" type="button" data-history-key="${escapeAttr(row.key)}">${escapeHtml(row.studentName)}</button></td>
      <td>${row.sessionCount}</td>
      <td>${row.gameCount}</td>
      <td><button type="button" data-analysis-key="${escapeAttr(row.key)}">Analyze</button></td>
    </tr>
  `).join("");

  $("#dashboard-table").querySelectorAll("[data-history-key]").forEach((button) => {
    button.addEventListener("click", () => openHistory(button.dataset.historyKey));
  });
  $("#dashboard-table").querySelectorAll("[data-analysis-key]").forEach((button) => {
    button.addEventListener("click", () => openAnalysis(button.dataset.analysisKey));
  });
}

function ratingValues(session) {
  const values = [];
  [generalRatingsForSession(session), session.other_outcome_ratings].forEach((ratings) => {
    if (!ratings || typeof ratings !== "object") return;
    Object.values(ratings).forEach((item) => {
      const value = Number(item?.rating);
      if (value) values.push(value);
    });
  });
  const primary = Number(session.primary_ct_rating?.rating);
  if (primary) values.push(primary);
  return values;
}

function sessionAverage(session) {
  const values = ratingValues(session);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function openAnalysis(key) {
  const row = dashboardRows.find((item) => item.key === key);
  if (!row) return;
  const history = row.sessions.slice().sort((a, b) => String(a.session_date || "").localeCompare(String(b.session_date || "")));
  const scored = history.map((session) => ({ session, average: sessionAverage(session) })).filter((item) => item.average !== null);
  const first = scored[0];
  const latest = scored[scored.length - 1];
  const change = first && latest ? latest.average - first.average : 0;
  const direction = change > 0.15 ? "improving" : change < -0.15 ? "needs renewed support" : "broadly steady";
  const subskills = new Set(history.flatMap((session) => Array.isArray(session.selected_ct_suboutcomes)
    ? session.selected_ct_suboutcomes.map((item) => item.suboutcomeCode).filter(Boolean)
    : []));
  const primarySkills = new Set(history.map((session) => session.primary_ct_rating?.outcomeName).filter(Boolean));
  const latestSession = history[history.length - 1];

  $("#analysis-title").textContent = `${row.studentName} progress analysis`;
  $("#analysis-content").innerHTML = history.length ? `
    <div class="profile-lines">
      <div><strong>Period reviewed</strong><span>${escapeHtml(history[0].session_date)} to ${escapeHtml(latestSession.session_date)}</span></div>
      <div><strong>Sessions</strong><span>${history.length}</span></div>
      <div><strong>Games</strong><span>${row.gameCount}</span></div>
      <div><strong>CT skills observed</strong><span>${primarySkills.size}</span></div>
      <div><strong>Subskills observed</strong><span>${subskills.size}</span></div>
    </div>
    <section class="analysis-summary">
      <h3>Summary</h3>
      <p>${scored.length > 1
        ? `Across ${scored.length} scored sessions, performance is <strong>${direction}</strong>. The average rubric rating moved from ${first.average.toFixed(1)} to ${latest.average.toFixed(1)} (${change >= 0 ? "+" : ""}${change.toFixed(1)}).`
        : "More scored sessions are needed to identify a performance trend."}</p>
      <p>${primarySkills.size ? `Primary CT skills observed: ${escapeHtml([...primarySkills].join(", "))}.` : "No primary CT skill ratings have been recorded."}</p>
      <p>${subskills.size ? `${subskills.size} distinct CT subskills have been observed during play.` : "No CT subskills have been selected yet."}</p>
      <p>Latest session: ${escapeHtml(latestSession.game || "Game not recorded")} on ${escapeHtml(latestSession.session_date || "date not recorded")}${latestSession.comments ? `. Facilitator note: ${escapeHtml(latestSession.comments)}` : "."}</p>
    </section>
  ` : '<p class="muted">No session history is available for analysis.</p>';
  $("#analysis-modal").classList.remove("hidden");
}
function buildRows() {
  const groups = new Map();

  dashboardData.sessions.forEach((session) => {
    const key = [
      normalize(session.state),
      normalize(session.district),
      normalize(session.school),
      normalize(session.student_name)
    ].join("||");
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        state: session.state || "",
        district: session.district || "",
        school: session.school || "",
        studentName: session.student_name || "",
        sessions: [],
        games: new Set()
      });
    }
    const group = groups.get(key);
    group.sessions.push(session);
    if (session.game) group.games.add(session.game);
  });

  return Array.from(groups.values())
    .map((group) => {
      return {
        key: group.key,
        state: group.state,
        district: group.district,
        school: group.school,
        studentName: group.studentName,
        sessions: group.sessions,
        sessionCount: group.sessions.length,
        gameCount: group.games.size
      };
    })
    .sort((a, b) => {
      return a.state.localeCompare(b.state) ||
        a.district.localeCompare(b.district) ||
        a.school.localeCompare(b.school) ||
        a.studentName.localeCompare(b.studentName);
    });
}

function openHistory(key) {
  const row = dashboardRows.find((item) => item.key === key);
  if (!row) return;
  $("#history-title").textContent = `${row.studentName} progress history`;
  $("#history-profile").innerHTML = `
    <div><strong>State</strong><span>${escapeHtml(row.state)}</span></div>
    <div><strong>District</strong><span>${escapeHtml(row.district)}</span></div>
    <div><strong>School</strong><span>${escapeHtml(row.school)}</span></div>
    <div><strong>Student Name</strong><span>${escapeHtml(row.studentName)}</span></div>
  `;
  const history = row.sessions
    .slice()
    .sort((a, b) => String(b.session_date || "").localeCompare(String(a.session_date || "")));
  $("#history-table").innerHTML = history.length
    ? history.map(renderSessionEntryRow).join("")
    : '<tr><td colspan="13" class="muted">No session history available.</td></tr>';
  $("#history-modal").classList.remove("hidden");
}

function renderSessionEntryRow(session) {
  return `
    <tr>
      <td>${escapeHtml(session.session_date)}</td>
      <td>${escapeHtml(session.state || "")}</td>
      <td>${escapeHtml(session.district || "")}</td>
      <td>${escapeHtml(session.school || "")}</td>
      <td>${escapeHtml(session.facilitator || "")}</td>
      <td>${escapeHtml(session.student_name || "")}</td>
      <td>${escapeHtml(session.game || "")}</td>
      <td>${escapeHtml(formatRatingMap(generalRatingsForSession(session)))}</td>
      <td>${escapeHtml(formatPrimaryCtRating(session.primary_ct_rating))}</td>
      <td>${escapeHtml(formatSuboutcomes(session.selected_ct_suboutcomes))}</td>
      <td>${escapeHtml(formatRatingMap(session.other_outcome_ratings))}</td>
      <td>${escapeHtml(session.comments || "")}</td>
      <td>${escapeHtml(formatObservationAccuracy(session.confidence_score))}</td>
    </tr>
  `;
}

function generalRatingsForSession(session) {
  const current = session.general_outcome_ratings;
  if (current && typeof current === "object" && Object.keys(current).length) return current;
  return session.common_observations;
}

function formatRatingMap(ratings) {
  if (!ratings || typeof ratings !== "object") return "";
  return Object.values(ratings)
    .filter((item) => item && item.rating)
    .map((item) => `${item.outcomeName || item.area}: ${item.rating} - ${item.scaleName || item.level}`)
    .join("; ");
}

function formatPrimaryCtRating(rating) {
  if (!rating?.outcomeCode) return "";
  return `${rating.outcomeCode} - ${rating.outcomeName}: ${rating.rating} - ${rating.scaleName}. ${rating.description}`;
}

function formatObservationAccuracy(score) {
  if (score === null || score === undefined || score === "") return "";
  return Number(score) >= 4 ? "High" : "Low";
}
function formatSuboutcomes(items) {
  if (!Array.isArray(items)) return "";
  return items.map((item) => `${item.suboutcomeCode} - ${item.suboutcomeName}`).join("; ");
}

function closeHistory() {
  $("#history-modal").classList.add("hidden");
}

function closeAnalysis() {
  $("#analysis-modal").classList.add("hidden");
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
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

$("#refresh-dashboard").addEventListener("click", refreshDashboard);
$("#close-history").addEventListener("click", closeHistory);
$("#close-analysis").addEventListener("click", closeAnalysis);
$("#history-modal").addEventListener("click", (event) => {
  if (event.target.id === "history-modal") closeHistory();
});
$("#analysis-modal").addEventListener("click", (event) => {
  if (event.target.id === "analysis-modal") closeAnalysis();
});
refreshDashboard();
