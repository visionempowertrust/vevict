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
  $("#summary-sessions").textContent = dashboardData.sessions.length;

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
      <td>${row.skillCount}</td>
      <td>${escapeHtml(row.skillsAcquired)}</td>
      <td>${row.gameCount}</td>
      <td>${escapeHtml(row.gamesPlayed)}</td>
      <td>${row.sessionCount}</td>
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
    const current = group.acquired.get(status.skill_code);
    const candidate = skillAcquisitionLabel(status.skill_code, status.key_learning_indicator_codes);
    if (!current || candidate.levelNumber > current.levelNumber) {
      group.acquired.set(status.skill_code, candidate);
    }
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
        skillCount: acquired.length,
        skillsAcquired: acquired.map((item) => item.label).join("; "),
        gameCount: group.games.size,
        gamesPlayed: Array.from(group.games).sort().join("; "),
        sessionCount: group.sessions.length
      };
    })
    .sort((a, b) => {
      return a.state.localeCompare(b.state) ||
        a.district.localeCompare(b.district) ||
        a.school.localeCompare(b.school) ||
        a.studentName.localeCompare(b.studentName);
    });
}

function skillAcquisitionLabel(skillCode, kliCodes) {
  const skill = dashboardData.skills.find((item) => item.skillCode === skillCode);
  const matchingLevels = splitCodes(kliCodes).map((code) => {
    return dashboardData.skillLevels.find((level) => {
      return level.skillCode === skillCode && level.kliCode === code;
    });
  }).filter(Boolean);
  const bestLevel = matchingLevels.sort((a, b) => levelNumber(b.level) - levelNumber(a.level))[0];
  const labelLevel = bestLevel?.level || "Level not mapped";
  return {
    skillName: skill?.skillName || skillCode,
    levelNumber: levelNumber(labelLevel),
    label: `${skill?.skillName || skillCode} (${labelLevel})`
  };
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
  const gameByCode = new Map(dashboardData.games.map((game) => [game.gameCode, game]));
  const history = row.sessions
    .slice()
    .sort((a, b) => String(b.session_date || "").localeCompare(String(a.session_date || "")));
  $("#history-table").innerHTML = history.length ? history.map((session) => {
    const game = gameByCode.get(session.game_code);
    return `
      <tr>
        <td>${escapeHtml(session.session_date)}</td>
        <td>Game</td>
        <td>${escapeHtml(game?.category || "")}</td>
        <td>${escapeHtml(session.game)}</td>
      </tr>
    `;
  }).join("") : '<tr><td colspan="4" class="muted">No session history available.</td></tr>';
  $("#history-modal").classList.remove("hidden");
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

function levelNumber(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
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
