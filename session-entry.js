const statusOptions = ["Yet to start", "In Progress", "Acquired", "Not applicable"];
const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
let games = [];
let applicationLevels = [];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isDbEnabled() {
  return Boolean(dbStore?.isEnabled());
}

async function loadData() {
  $("#save-status").textContent = "Loading...";
  if (!isDbEnabled()) {
    $("#save-status").textContent = "Supabase not configured";
    $("#session-game").innerHTML = '<option value="">Configure Supabase first</option>';
    return;
  }
  try {
    const data = await dbStore.loadSessionEntryData();
    games = data.games || [];
    applicationLevels = data.applicationLevels || [];
    renderGames();
    renderApplicationLevels();
    $("#save-status").textContent = "Ready";
  } catch (error) {
    $("#save-status").textContent = "Load failed";
    alert(`Could not load games from Supabase: ${error.message}`);
  }
}

function renderGames() {
  if (!games.length) {
    $("#session-game").innerHTML = '<option value="">No games found</option>';
    return;
  }
  $("#session-game").innerHTML = games.map((game) => {
    return `<option value="${escapeAttr(game.gameCode)}">${escapeHtml(game.game)} (${escapeHtml(game.gameCode)})</option>`;
  }).join("");
}

function selectedGame() {
  return games.find((game) => game.gameCode === $("#session-game").value);
}

function selectedApplicationLevels() {
  const gameCode = $("#session-game").value;
  return applicationLevels.filter((level) => level.gameCode === gameCode);
}

function renderApplicationLevels() {
  const game = selectedGame();
  const levels = selectedApplicationLevels();
  $("#application-heading").textContent = game ? `${game.game} application levels` : "Game Application Levels";
  $("#application-count").textContent = `${levels.length} level${levels.length === 1 ? "" : "s"}`;
  if (!levels.length) {
    $("#application-status-table").innerHTML = '<tr><td colspan="4" class="muted">No game application levels are linked to this game yet.</td></tr>';
    return;
  }
  $("#application-status-table").innerHTML = levels.map((level) => `
    <tr data-application-level-id="${escapeAttr(level.id)}">
      <td>${escapeHtml(level.skillCode)}</td>
      <td>${escapeHtml(level.kliCodes)}</td>
      <td>${escapeHtml(level.gameApplication)}</td>
      <td>
        <select data-status-for="${escapeAttr(level.id)}">
          ${statusOptions.map((status) => `<option value="${status}">${status}</option>`).join("")}
        </select>
      </td>
    </tr>
  `).join("");
}

async function saveSession(event) {
  event.preventDefault();
  if (!isDbEnabled()) {
    alert("Supabase is not configured.");
    return;
  }
  const game = selectedGame();
  if (!game) {
    alert("Choose a game before saving.");
    return;
  }
  const levels = selectedApplicationLevels();
  const entry = {
    state: $("#session-state").value.trim(),
    district: $("#session-district").value.trim(),
    school: $("#session-school").value.trim(),
    date: $("#session-date").value,
    facilitator: $("#session-facilitator").value.trim(),
    studentName: $("#session-student").value.trim(),
    gameCode: game.gameCode,
    game: game.game,
    comments: $("#session-comments").value.trim(),
    confidenceScore: Number($("#confidence-score").value),
    levelStatuses: levels.map((level) => ({
      applicationLevelId: level.id,
      gameCode: level.gameCode,
      skillCode: level.skillCode,
      kliCodes: level.kliCodes,
      gameApplication: level.gameApplication,
      status: document.querySelector(`[data-status-for="${cssEscape(level.id)}"]`).value
    }))
  };

  if (!entry.studentName) {
    alert("Student Name is required.");
    return;
  }

  $("#save-status").textContent = "Saving...";
  try {
    await dbStore.saveFacilitatorSession(entry);
    $("#save-status").textContent = "Saved";
    $("#session-comments").value = "";
    renderApplicationLevels();
  } catch (error) {
    $("#save-status").textContent = "Save failed";
    alert(`Could not save session: ${error.message}`);
  }
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(value);
  return String(value).replace(/"/g, '\\"');
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

$("#session-date").value = today();
$("#session-game").addEventListener("change", renderApplicationLevels);
$("#facilitator-session-form").addEventListener("submit", saveSession);

loadData();
