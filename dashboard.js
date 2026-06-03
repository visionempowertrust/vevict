const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
let dashboardData = { sessions: [], statuses: [], skills: [], skillLevels: [] };

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
      <td>${escapeHtml(row.studentName)}</td>
      <td>${row.skillCount}</td>
      <td>${escapeHtml(row.skillsAcquired)}</td>
      <td>${row.gameCount}</td>
      <td>${escapeHtml(row.gamesPlayed)}</td>
      <td>${row.sessionCount}</td>
    </tr>
  `).join("");
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
        state: group.state,
        district: group.district,
        school: group.school,
        studentName: group.studentName,
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

$("#refresh-dashboard").addEventListener("click", refreshDashboard);
refreshDashboard();
