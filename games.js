const storageKey = "vict-games-v1";
const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
let data = { games: [], applicationLevels: [], skills: [] };
let activeGameCode = "";

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function loadLocalData() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (stored?.games) return stored;
  } catch {
    return { games: [], applicationLevels: [], skills: [] };
  }
  return { games: [], applicationLevels: [], skills: [] };
}

function saveLocalData() {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function isDbEnabled() {
  return Boolean(dbStore?.isEnabled());
}

async function syncFromSupabase() {
  if (!isDbEnabled()) {
    alert("Supabase is not configured yet.");
    return;
  }
  try {
    const remote = await dbStore.loadGamesData();
    data = remote || loadLocalData();
    activeGameCode = data.games[0]?.gameCode || "";
    saveLocalData();
    render();
  } catch (error) {
    alert(`Could not load games from Supabase: ${error.message}`);
  }
}

async function syncToSupabase() {
  if (!isDbEnabled()) {
    alert("Supabase is not configured yet.");
    return;
  }
  try {
    await dbStore.saveGamesData(data);
    alert("Games and application levels saved to Supabase.");
  } catch (error) {
    alert(`Could not save games to Supabase: ${error.message}`);
  }
}

function render() {
  saveLocalData();
  renderGames();
  renderApplicationLevels();
}

function renderGames() {
  const table = $("#games-table");
  if (!data.games.length) {
    table.innerHTML = '<tr><td colspan="7" class="muted">No games loaded yet. Use Sync DB after seeding Supabase.</td></tr>';
    return;
  }

  table.innerHTML = data.games.map((game, index) => `
    <tr class="${game.gameCode === activeGameCode ? "active-row" : ""}">
      <td><input data-game-field="gameCode" data-index="${index}" value="${escapeAttr(game.gameCode)}"></td>
      <td><input data-game-field="category" data-index="${index}" value="${escapeAttr(game.category)}"></td>
      <td>
        <input data-game-field="game" data-index="${index}" value="${escapeAttr(game.game)}">
        <button class="table-button game-open" type="button" data-game-code="${escapeAttr(game.gameCode)}">Show levels</button>
      </td>
      <td><textarea data-game-field="generalInformation" data-index="${index}">${escapeHtml(game.generalInformation)}</textarea></td>
      <td><textarea data-game-field="overviewRules" data-index="${index}">${escapeHtml(game.overviewRules)}</textarea></td>
      <td><textarea data-game-field="playSessionPlans" data-index="${index}">${escapeHtml(game.playSessionPlans)}</textarea></td>
      <td><button class="table-button remove-game" type="button" data-index="${index}">Remove</button></td>
    </tr>
  `).join("");

  table.querySelectorAll("[data-game-field]").forEach((input) => input.addEventListener("change", updateGame));
  table.querySelectorAll(".game-open").forEach((button) => {
    button.addEventListener("click", () => {
      activeGameCode = button.dataset.gameCode;
      render();
    });
  });
  table.querySelectorAll(".remove-game").forEach((button) => {
    button.addEventListener("click", () => removeGame(Number(button.dataset.index)));
  });
}

function renderApplicationLevels() {
  const game = data.games.find((item) => item.gameCode === activeGameCode);
  $("#applications-heading").textContent = game ? `${game.game} application levels` : "Game application levels";
  $("#applications-subtitle").textContent = game ? `Showing levels for ${game.gameCode}.` : "Click a game above to view linked skills and application indicators.";
  const rows = data.applicationLevels
    .filter((level) => level.gameCode === activeGameCode)
    .map((level) => ({ level, index: data.applicationLevels.indexOf(level) }));

  if (!rows.length) {
    $("#application-levels-table").innerHTML = '<tr><td colspan="6" class="muted">No application levels recorded for this game yet.</td></tr>';
    return;
  }

  $("#application-levels-table").innerHTML = rows.map(({ level }) => `
    <tr>
      <td>${escapeHtml(level.gameCode)}</td>
      <td>${escapeHtml(level.category)}</td>
      <td>${escapeHtml(level.game)}</td>
      <td>${escapeHtml(skillLabel(level.skillCode))}</td>
      <td>${escapeHtml(level.kliCodes)}</td>
      <td>${escapeHtml(level.gameApplication)}</td>
    </tr>
  `).join("");
}

function skillLabel(skillCode) {
  const skill = data.skills.find((item) => item.skillCode === skillCode);
  return skill ? `${skill.skillCode} - ${skill.skillName}` : skillCode;
}

function updateGame(event) {
  const index = Number(event.target.dataset.index);
  const field = event.target.dataset.gameField;
  const previousCode = data.games[index].gameCode;
  data.games[index][field] = event.target.value.trim();
  if (field === "gameCode") {
    data.applicationLevels.forEach((level) => {
      if (level.gameCode === previousCode) level.gameCode = data.games[index].gameCode;
    });
    activeGameCode = data.games[index].gameCode;
  }
  if (field === "game" || field === "category") {
    data.applicationLevels.forEach((level) => {
      if (level.gameCode === data.games[index].gameCode) {
        level.game = data.games[index].game;
        level.category = data.games[index].category;
      }
    });
  }
  render();
}

function addGame() {
  const game = {
    gameCode: `G${data.games.length + 1}`,
    category: "",
    game: "New Game",
    generalInformation: "",
    overviewRules: "",
    playSessionPlans: ""
  };
  data.games.push(game);
  activeGameCode = game.gameCode;
  render();
}

function removeGame(index) {
  const game = data.games[index];
  if (!game || !confirm(`Remove ${game.game} and its application levels?`)) return;
  data.games.splice(index, 1);
  data.applicationLevels = data.applicationLevels.filter((level) => level.gameCode !== game.gameCode);
  activeGameCode = data.games[0]?.gameCode || "";
  render();
  if (isDbEnabled()) {
    dbStore.deleteGame(game.gameCode).catch((error) => {
      alert(`Could not remove game from Supabase: ${error.message}`);
    });
  }
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

data = loadLocalData();
activeGameCode = data.games[0]?.gameCode || "";

$("#add-game").addEventListener("click", addGame);
$("#sync-games").addEventListener("click", syncToSupabase);

render();
if (isDbEnabled()) {
  syncFromSupabase();
}
