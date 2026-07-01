const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
let outcomes = [];
let suboutcomes = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function render() {
  $("#outcomes-table").innerHTML = outcomes.length ? outcomes.map((outcome) => `
    <tr>
      <td>${escapeHtml(outcome.outcomeCode)}</td>
      <td>${escapeHtml(outcome.outcomeName)}</td>
      ${outcome.levels.map((level) => `<td>${escapeHtml(level)}</td>`).join("")}
    </tr>
  `).join("") : '<tr><td colspan="6" class="muted">No CT outcomes found.</td></tr>';

  const outcomeNames = new Map(outcomes.map((outcome) => [outcome.outcomeCode, outcome.outcomeName]));
  $("#suboutcomes-table").innerHTML = suboutcomes.length ? suboutcomes.map((suboutcome) => `
    <tr>
      <td>${escapeHtml(suboutcome.outcomeCode)}</td>
      <td>${escapeHtml(outcomeNames.get(suboutcome.outcomeCode) || "")}</td>
      <td>${escapeHtml(suboutcome.suboutcomeCode)}</td>
      <td>${escapeHtml(suboutcome.suboutcomeName)}</td>
      <td>${escapeHtml(suboutcome.description)}</td>
    </tr>
  `).join("") : '<tr><td colspan="5" class="muted">No CT suboutcomes found.</td></tr>';
  $("#suboutcomes-count").textContent = `${suboutcomes.length} suboutcomes`;
}

async function loadOutcomes() {
  $("#outcomes-status").textContent = "Loading...";
  if (!dbStore?.isEnabled()) {
    $("#outcomes-status").textContent = "Supabase not configured";
    render();
    return;
  }
  try {
    const data = await dbStore.loadOutcomesData();
    outcomes = data?.outcomes || [];
    suboutcomes = data?.suboutcomes || [];
    render();
    $("#outcomes-status").textContent = `${outcomes.length} outcomes`;
  } catch (error) {
    $("#outcomes-status").textContent = "Load failed";
    alert(`Could not load outcomes: ${error.message}`);
  }
}

$("#refresh-outcomes").addEventListener("click", loadOutcomes);
loadOutcomes();
