const statusOptions = ["Yet to start", "In Progress", "Acquired", "Not applicable"];
const dbStore = window.VictSupabaseStore;
const locations = window.INDIA_LOCATIONS || {};
const states = window.INDIA_STATES || Object.keys(locations).sort((a, b) => a.localeCompare(b));
const $ = (selector) => document.querySelector(selector);
let games = [];
let applicationLevels = [];
let registeredStudents = [];

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
    registeredStudents = data.registeredStudents || [];
    renderSchoolOptions();
    renderStudentOptions();
    renderGames();
    renderApplicationLevels();
    $("#save-status").textContent = "Ready";
  } catch (error) {
    $("#save-status").textContent = "Load failed";
    alert(`Could not load games from Supabase: ${error.message}`);
  }
}

function setOptions(select, options, selectedValue = "") {
  select.innerHTML = options.map((option) => {
    const value = typeof option === "string" ? option : option.value;
    const label = typeof option === "string" ? option : option.label;
    const selected = value === selectedValue ? " selected" : "";
    return `<option value="${escapeAttr(value)}"${selected}>${escapeHtml(label)}</option>`;
  }).join("");
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function renderStateOptions(selectedValue = "") {
  setOptions($("#session-state"), states, selectedValue || states[0] || "");
  renderDistrictOptions();
}

function renderDistrictOptions(selectedValue = "") {
  const state = $("#session-state").value;
  const districts = locations[state] || [];
  setOptions($("#session-district"), districts, selectedValue || districts[0] || "");
}

function filteredStudents() {
  const state = $("#session-state").value;
  const district = $("#session-district").value;
  const school = $("#session-school").value;
  return registeredStudents.filter((student) => {
    return student.state === state &&
      (!district || student.district === district) &&
      (!school || student.school === school);
  });
}

function renderSchoolOptions(selectedValue = "") {
  const state = $("#session-state").value;
  const district = $("#session-district").value;
  const schools = uniqueSorted(registeredStudents
    .filter((student) => student.state === state && (!district || student.district === district))
    .map((student) => student.school));

  if (!schools.length) {
    setOptions($("#session-school"), [{ value: "", label: "No schools found for this state and district" }]);
    return;
  }
  setOptions($("#session-school"), schools, selectedValue && schools.includes(selectedValue) ? selectedValue : schools[0]);
}

function renderStudentOptions(selectedValue = "") {
  const students = filteredStudents();
  if (!students.length) {
    setOptions($("#session-student"), [{ value: "", label: "No registered students found" }]);
    return;
  }
  setOptions($("#session-student"), students.map((student) => ({
    value: student.id,
    label: `${student.name} - Grade ${student.grade}`
  })), selectedValue && students.some((student) => student.id === selectedValue) ? selectedValue : students[0].id);
}

function selectedStudent() {
  return registeredStudents.find((student) => student.id === $("#session-student").value);
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
  const student = selectedStudent();
  if (!game) {
    alert("Choose a game before saving.");
    return;
  }
  const levels = selectedApplicationLevels();
  const entry = {
    state: $("#session-state").value,
    district: $("#session-district").value,
    school: $("#session-school").value,
    date: $("#session-date").value,
    facilitator: $("#session-facilitator").value.trim(),
    studentName: student?.name || "",
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
    alert("Choose a registered student before saving.");
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
renderStateOptions();
$("#session-game").addEventListener("change", renderApplicationLevels);
$("#session-state").addEventListener("change", () => {
  renderDistrictOptions();
  renderSchoolOptions();
  renderStudentOptions();
});
$("#session-district").addEventListener("change", () => {
  renderSchoolOptions();
  renderStudentOptions();
});
$("#session-school").addEventListener("change", () => renderStudentOptions());
$("#facilitator-session-form").addEventListener("submit", saveSession);

loadData();
