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
}

function renderGames() {
  const table = $("#games-table");
  if (!data.games.length) {
    table.innerHTML = '<tr><td colspan="4" class="muted">No games loaded yet. Use Sync DB after seeding Supabase.</td></tr>';
    return;
  }

  table.innerHTML = data.games.map((game, index) => `
    <tr class="${game.gameCode === activeGameCode ? "active-row" : ""}">
      <td>${escapeHtml(game.gameCode)}</td>
      <td>${escapeHtml(game.category)}</td>
      <td>
        <span>${escapeHtml(game.game)}</span>
        <button class="table-button game-open" type="button" data-game-code="${escapeAttr(game.gameCode)}">Show levels</button>
      </td>
      <td><button class="table-button how-to-play-open" type="button" data-game-code="${escapeAttr(game.gameCode)}">Show</button></td>
    </tr>
  `).join("");

  table.querySelectorAll(".game-open").forEach((button) => {
    button.addEventListener("click", () => {
      openApplicationLevels(button.dataset.gameCode);
    });
  });
  table.querySelectorAll(".how-to-play-open").forEach((button) => {
    button.addEventListener("click", () => openHowToPlay(button.dataset.gameCode));
  });
}

function openApplicationLevels(gameCode) {
  activeGameCode = gameCode;
  const game = data.games.find((item) => item.gameCode === activeGameCode);
  $("#levels-title").textContent = game ? `${game.game} application levels` : "Game application levels";
  $("#levels-subtitle").textContent = game ? `Showing levels for ${game.gameCode}.` : "";
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
  $("#levels-modal").classList.remove("hidden");
}

function openHowToPlay(gameCode) {
  const game = data.games.find((item) => item.gameCode === gameCode);
  if (!game) return;
  $("#how-to-play-title").textContent = `${game.game} - How to Play`;
  $("#how-to-play-general").textContent = game.generalInformation || "No general information recorded.";
  $("#how-to-play-rules").textContent = game.overviewRules || "No overview or rules recorded.";
  $("#how-to-play-plans").textContent = game.playSessionPlans || "No play session plans recorded.";
  $("#how-to-play-modal").classList.remove("hidden");
}

function closeModal(id) {
  $(id).classList.add("hidden");
}

function skillLabel(skillCode) {
  const skill = data.skills.find((item) => item.skillCode === skillCode);
  return skill ? `${skill.skillCode} - ${skill.skillName}` : skillCode;
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

$("#sync-games").addEventListener("click", syncToSupabase);
$("#close-levels").addEventListener("click", () => closeModal("#levels-modal"));
$("#close-how-to-play").addEventListener("click", () => closeModal("#how-to-play-modal"));
$("#levels-modal").addEventListener("click", (event) => {
  if (event.target.id === "levels-modal") closeModal("#levels-modal");
});
$("#how-to-play-modal").addEventListener("click", (event) => {
  if (event.target.id === "how-to-play-modal") closeModal("#how-to-play-modal");
});

render();
if (isDbEnabled()) {
  syncFromSupabase();
}
