const storageKey = "vict-games-v1";
const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
let data = { games: [], outcomes: [] };

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function loadLocalData() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (stored?.games) return stored;
  } catch {
    return { games: [], outcomes: [] };
  }
  return { games: [], outcomes: [] };
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
    alert("Games saved to Supabase.");
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
    table.innerHTML = '<tr><td colspan="7" class="muted">No games loaded yet. Use Sync DB after seeding Supabase.</td></tr>';
    return;
  }

  table.innerHTML = data.games.map((game) => `
    <tr>
      <td>${escapeHtml(game.gameCode)}</td>
      <td>${escapeHtml(game.category)}</td>
      <td>${escapeHtml(game.game)}</td>
      <td>${escapeHtml(game.difficultyLevel || "")}</td>
      <td>${escapeHtml(outcomeLabel(game.primaryCtOutcomeCode))}</td>
      <td>${escapeHtml(game.primaryCtObservation || "")}</td>
      <td><button class="table-button how-to-play-open" type="button" data-game-code="${escapeAttr(game.gameCode)}">Show</button></td>
    </tr>
  `).join("");

  table.querySelectorAll(".how-to-play-open").forEach((button) => {
    button.addEventListener("click", () => openHowToPlay(button.dataset.gameCode));
  });
}

function outcomeLabel(outcomeCode) {
  const outcome = (data.outcomes || []).find((item) => item.outcomeCode === outcomeCode);
  return outcome ? `${outcome.outcomeCode} - ${outcome.outcomeName}` : outcomeCode;
}

function openHowToPlay(gameCode) {
  const game = data.games.find((item) => item.gameCode === gameCode);
  if (!game) return;
  $("#how-to-play-title").textContent = `${game.game} - How to Play`;
  $("#how-to-play-general").textContent = game.generalInformation || "No general information recorded.";
  $("#how-to-play-rules").textContent = game.overviewRules || "No overview or rules recorded.";
  $("#how-to-play-plans").textContent = game.playSessionPlans || "No play session plans recorded.";
  $("#how-to-play-source").textContent = game.sourceUrl || "No source URL recorded.";
  $("#how-to-play-difficulty").textContent = game.difficultyLevel || "No difficulty level recorded.";
  $("#how-to-play-modal").classList.remove("hidden");
}

function closeModal(id) {
  $(id).classList.add("hidden");
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

$("#sync-games").addEventListener("click", syncToSupabase);
$("#close-how-to-play").addEventListener("click", () => closeModal("#how-to-play-modal"));
$("#how-to-play-modal").addEventListener("click", (event) => {
  if (event.target.id === "how-to-play-modal") closeModal("#how-to-play-modal");
});

render();
if (isDbEnabled()) {
  syncFromSupabase();
}
