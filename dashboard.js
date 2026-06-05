const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
let dashboardData = { sessions: [], statuses: [], skills: [], skillLevels: [], games: [] };
let dashboardRows = [];

function isDbEnabled() {
  return Boolean(dbStore?.isEnabled());
}

async function refreshDashboard() {
  if (!isDbEnabled()) {
    $("#dashboard-status").textContent = "Supabase not configured";
    $("#dashboard-table").innerHTML = '<tr><td colspan="9" class="muted">Configure Supabase to load dashboard data.</td></tr>';
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
  $("#summary-skills").textContent = rows.reduce((sum, row) => sum + row.skillCount, 0);

  if (!rows.length) {
    $("#dashboard-table").innerHTML = '<tr><td colspan="9" class="muted">No facilitator sessions have been entered yet.</td></tr>';
    return;
  }

  $("#dashboard-table").innerHTML = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.state)}</td>
      <td>${escapeHtml(row.district)}</td>
      <td>${escapeHtml(row.school)}</td>
      <td><button class="link-button" type="button" data-history-key="${escapeAttr(row.key)}">${escapeHtml(row.studentName)}</button></td>
      <td>${row.sessionCount}</td>
      <td>${row.skillCount}</td>
      <td>${escapeHtml(row.skillsAcquired)}</td>
      <td>${row.gameCount}</td>
      <td>${escapeHtml(row.gamesPlayed)}</td>
    </tr>
  `).join("");

  $("#dashboard-table").querySelectorAll("[data-history-key]").forEach((button) => {
    button.addEventListener("click", () => openHistory(button.dataset.historyKey));
  });
}

function buildRows() {
  const sessionsById = new Map(dashboardData.sessions.map((session) => [session.id, session]));
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
        games: new Set(),
        acquired: new Map()
      });
    }
    const group = groups.get(key);
    group.sessions.push(session);
    if (session.game) group.games.add(session.game);
  });

  dashboardData.statuses.forEach((status) => {
    if (status.status !== "Acquired") return;
    const session = sessionsById.get(status.session_id);
    if (!session) return;
    const key = [
      normalize(session.state),
      normalize(session.district),
      normalize(session.school),
      normalize(session.student_name)
    ].join("||");
    const group = groups.get(key);
    if (!group) return;
    skillAcquisitionsForStatus(status).forEach((candidate) => {
      if (!group.acquired.has(candidate.skillCode)) {
        group.acquired.set(candidate.skillCode, candidate);
      }
    });
  });

  return Array.from(groups.values())
    .map((group) => {
      const acquired = Array.from(group.acquired.values()).sort((a, b) => a.skillName.localeCompare(b.skillName));
      return {
        key: group.key,
        state: group.state,
        district: group.district,
        school: group.school,
        studentName: group.studentName,
        sessions: group.sessions,
        sessionCount: group.sessions.length,
        skillCount: acquired.length,
        skillsAcquired: acquired.map((item) => item.skillName).join("; "),
        gameCount: group.games.size,
        gamesPlayed: Array.from(group.games).sort().join("; ")
      };
    })
    .sort((a, b) => {
      return a.state.localeCompare(b.state) ||
        a.district.localeCompare(b.district) ||
        a.school.localeCompare(b.school) ||
        a.studentName.localeCompare(b.studentName);
    });
}

function skillAcquisitionsForStatus(status) {
  const candidates = splitCodes(status.key_learning_indicator_codes).map((code) => {
    const level = dashboardData.skillLevels.find((item) => item.kliCode === code);
    const skillCode = level?.skillCode || status.skill_code;
    const skill = dashboardData.skills.find((item) => item.skillCode === skillCode);
    return {
      skillCode,
      skillName: skill?.skillName || skillCode
    };
  });

  if (candidates.length) {
    return uniqueBySkill(candidates);
  }

  const skill = dashboardData.skills.find((item) => item.skillCode === status.skill_code);
  return [{
    skillCode: status.skill_code,
    skillName: skill?.skillName || status.skill_code
  }];
}

function uniqueBySkill(items) {
  const unique = new Map();
  items.forEach((item) => {
    if (item.skillCode) unique.set(item.skillCode, item);
  });
  return Array.from(unique.values());
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
  const statusesBySession = new Map();
  dashboardData.statuses.forEach((status) => {
    if (!statusesBySession.has(status.session_id)) statusesBySession.set(status.session_id, []);
    statusesBySession.get(status.session_id).push(status);
  });
  const history = row.sessions
    .slice()
    .sort((a, b) => String(b.session_date || "").localeCompare(String(a.session_date || "")));
  $("#history-table").innerHTML = history.length ? history.flatMap((session) => {
    const statuses = statusesBySession.get(session.id) || [];
    if (!statuses.length) return [renderSessionEntryRow(session, null)];
    return statuses.map((status) => renderSessionEntryRow(session, status));
  }).join("") : '<tr><td colspan="11" class="muted">No session history available.</td></tr>';
  $("#history-modal").classList.remove("hidden");
}

function renderSessionEntryRow(session, status) {
  return `
    <tr>
      <td>${escapeHtml(session.session_date)}</td>
      <td>${escapeHtml(session.state || "")}</td>
      <td>${escapeHtml(session.district || "")}</td>
      <td>${escapeHtml(session.school || "")}</td>
      <td>${escapeHtml(session.facilitator || "")}</td>
      <td>${escapeHtml(session.student_name || "")}</td>
      <td>${escapeHtml(session.game || "")}</td>
      <td>${escapeHtml(status?.game_application || status?.key_learning_indicator_codes || "")}</td>
      <td>${escapeHtml(status?.status || "")}</td>
      <td>${escapeHtml(session.comments || "")}</td>
      <td>${escapeHtml(session.confidence_score || "")}</td>
    </tr>
  `;
}

function closeHistory() {
  $("#history-modal").classList.add("hidden");
}

function splitCodes(value) {
  return String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
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
$("#history-modal").addEventListener("click", (event) => {
  if (event.target.id === "history-modal") closeHistory();
});
refreshDashboard();
