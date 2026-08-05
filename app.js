const games = [
  ["Card Game 0", "Card Games"],
  ["Collaborative Sorting", "Card Games"],
  ["Equations", "Card Games"],
  ["Rummy", "Card Games"],
  ["Last Man Standing", "Card Games"],
  ["Go Fish", "Card Games"],
  ["I See 10", "Card Games"],
  ["Scoop", "Card Games"],
  ["Race to 27", "Card Games"],
  ["Grouping", "Pebble Games"],
  ["Counting", "Pebble Games"],
  ["Sorting", "Pebble Games"],
  ["Patterns", "Pebble Games"],
  ["Odd or Even", "Pebble Games"],
  ["Noughts & Crosses", "Board Games"],
  ["Pallaguzhi", "Board Games"],
  ["Ludo", "Board Games"],
  ["Connect Four", "Board Games"],
  ["Scrabble", "Board Games"],
  ["Snakes & Ladders", "Board Games"],
  ["Hop Scotch", "Spatial Games"],
  ["Market", "Spatial Games"],
  ["Treasure Hunt", "Spatial Games"],
  ["Steps to Treasure", "Spatial Games"],
  ["Tangrams - Create Shapes", "Jodogyan Games"],
  ["Ganitmala", "Jodogyan Games"],
  ["Place Value card", "Jodogyan Games"],
  ["Musical Numbers", "Memory & Music Games"],
  ["Sounds and Patterns", "Memory & Music Games"],
  ["Body Percussion", "Memory & Music Games"],
  ["Odd One Out", "Ice Breakers"],
  ["Game Birthday", "Ice Breakers"]
].map(([name, category]) => ({ name, category }));

const learningAreas = [
  "Number recognition",
  "Systematic counting",
  "Pattern recognition",
  "Sorting and classification",
  "Data recording",
  "Spatial reasoning",
  "Algorithmic thinking",
  "Collaboration"
];

const kliEvidenceItems = [
  {
    id: "recognizes-numbers",
    area: "Number recognition",
    label: "Recognizes numbers or quantities",
    detail: "Identifies cards, counts, dots, positions, or values during play."
  },
  {
    id: "counts-systematically",
    area: "Systematic counting",
    label: "Counts systematically",
    detail: "Uses one-to-one counting, keeps track, or avoids double counting."
  },
  {
    id: "finds-patterns",
    area: "Pattern recognition",
    label: "Finds or extends patterns",
    detail: "Notices repeated sounds, shapes, number sequences, or game states."
  },
  {
    id: "sorts-classifies",
    area: "Sorting and classification",
    label: "Sorts or classifies objects",
    detail: "Groups cards, pebbles, shapes, or choices using a clear rule."
  },
  {
    id: "records-data",
    area: "Data recording",
    label: "Records or compares data",
    detail: "Tracks scores, moves, attempts, wins, errors, or observations."
  },
  {
    id: "uses-space",
    area: "Spatial reasoning",
    label: "Uses spatial reasoning",
    detail: "Plans movement, position, direction, shape, distance, or layout."
  },
  {
    id: "plans-steps",
    area: "Algorithmic thinking",
    label: "Plans steps or strategy",
    detail: "Explains a sequence, tests a rule, predicts outcomes, or debugs a move."
  },
  {
    id: "collaborates",
    area: "Collaboration",
    label: "Collaborates during play",
    detail: "Takes turns, explains thinking, asks for help, or supports a peer."
  },
  {
    id: "increases-independence",
    area: "Independence",
    label: "Shows increased independence",
    detail: "Needs fewer prompts, initiates next step, or self-corrects."
  },
  {
    id: "uses-access-tools",
    area: "Access",
    label: "Uses access tools effectively",
    detail: "Uses tactile, Braille, auditory, peer, or low-vision supports."
  }
];

const gameFocus = {
  "Card Games": ["Number recognition", "Systematic counting", "Sorting and classification", "Data recording"],
  "Pebble Games": ["Systematic counting", "Pattern recognition", "Sorting and classification"],
  "Board Games": ["Spatial reasoning", "Algorithmic thinking", "Data recording", "Collaboration"],
  "Spatial Games": ["Spatial reasoning", "Algorithmic thinking", "Collaboration"],
  "Jodogyan Games": ["Number recognition", "Spatial reasoning", "Pattern recognition"],
  "Memory & Music Games": ["Pattern recognition", "Data recording", "Collaboration"],
  "Ice Breakers": ["Sorting and classification", "Collaboration", "Pattern recognition"]
};

const storageKey = "vict-progress-tracker-v2";
let state = loadState();
let activeStudentId = state.students[0]?.id || null;

const $ = (selector) => document.querySelector(selector);
const studentList = $("#student-list");
const studentTemplate = $("#student-template");
const emptyState = $("#empty-state");
const workspace = $("#student-workspace");
const sessionDate = $("#session-date");
const gameSelect = $("#game-select");
const scoreControls = $("#score-controls");
const kliChecklist = $("#kli-checklist");
const dbStore = window.VictSupabaseStore;

function setTrackerStatus(message) {
  const status = $("#tracker-sync-status");
  if (status) status.textContent = message;
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || { students: [] };
  } catch {
    return { students: [] };
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function isDbEnabled() {
  return Boolean(dbStore?.isEnabled());
}

function saveLocalState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

async function syncFromSupabase() {
  if (!isDbEnabled()) {
    setTrackerStatus("Supabase is not configured yet.");
    return;
  }
  try {
    const remoteState = await dbStore.loadState();
    state = remoteState || { students: [] };
    activeStudentId = state.students[0]?.id || null;
    saveLocalState();
    render();
    setTrackerStatus("Loaded latest data from Supabase.");
  } catch (error) {
    setTrackerStatus(`Could not load from Supabase: ${error.message}`);
  }
}

async function syncToSupabase() {
  if (!isDbEnabled()) {
    setTrackerStatus("Supabase is not configured yet.");
    return;
  }
  try {
    await dbStore.saveAll(state);
    setTrackerStatus("Saved tracker data to Supabase.");
  } catch (error) {
    setTrackerStatus(`Could not save to Supabase: ${error.message}`);
  }
}

function saveRemote(task) {
  if (!isDbEnabled()) return;
  task().catch((error) => {
    console.error("Supabase save failed", error);
  });
}

function id() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function activeStudent() {
  return state.students.find((student) => student.id === activeStudentId);
}

function seedControls() {
  sessionDate.value = today();
  gameSelect.innerHTML = games
    .map((game) => `<option value="${game.name}">${game.name} (${game.category})</option>`)
    .join("");

  scoreControls.innerHTML = learningAreas
    .map((area) => `
      <div class="score-row">
        <label for="score-${slug(area)}">${area}</label>
        <input id="score-${slug(area)}" type="range" min="0" max="4" step="1" value="2" data-area="${area}">
        <span class="score-value" id="value-${slug(area)}">2</span>
      </div>
    `)
    .join("");

  scoreControls.addEventListener("input", (event) => {
    if (event.target.matches("input[type='range']")) {
      $(`#value-${slug(event.target.dataset.area)}`).textContent = event.target.value;
    }
  });

  kliChecklist.innerHTML = kliEvidenceItems
    .map((item) => `
      <div class="check-row">
        <input id="kli-${item.id}" type="checkbox" value="${item.id}">
        <label for="kli-${item.id}">
          ${item.label}
          <span>${item.detail}</span>
        </label>
      </div>
    `)
    .join("");
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function render() {
  saveState();
  renderStudents();
  const student = activeStudent();
  emptyState.classList.toggle("hidden", Boolean(student));
  workspace.classList.toggle("hidden", !student);
  if (!student) return;

  $("#student-name").value = student.name;
  $("#school-name").value = student.school || "";
  $("#grade-level").value = student.level || "";
  $("#support-needs").value = student.accessNotes || "";
  renderMetrics(student);
  renderGrowth(student);
  renderCoverage(student);
  renderHistory(student);
}

function renderStudents() {
  studentList.innerHTML = "";
  state.students.forEach((student) => {
    const button = studentTemplate.content.firstElementChild.cloneNode(true);
    button.classList.toggle("active", student.id === activeStudentId);
    button.innerHTML = `${escapeHtml(student.name)}<span>${escapeHtml(student.school || "No school set")}</span>`;
    button.addEventListener("click", () => {
      activeStudentId = student.id;
      render();
    });
    studentList.append(button);
  });
}

function renderMetrics(student) {
  const sessions = student.sessions || [];
  const latestScores = latestAreaScores(sessions);
  const average = averageOf(Object.values(latestScores));
  $("#metric-sessions").textContent = sessions.length;
  $("#metric-games").textContent = new Set(sessions.map((session) => session.game)).size;
  $("#metric-growth").textContent = average.toFixed(1);
  $("#metric-kli").textContent = sessions.filter((session) => getKliEvidenceText(session).trim()).length;
}

function latestAreaScores(sessions) {
  const scores = Object.fromEntries(learningAreas.map((area) => [area, 0]));
  sessions.forEach((session) => {
    Object.assign(scores, session.scores);
  });
  return scores;
}

function averageOf(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

function renderGrowth(student) {
  const scores = latestAreaScores(student.sessions || []);
  $("#growth-bars").innerHTML = learningAreas.map((area) => {
    const value = Number(scores[area] || 0);
    const width = (value / 4) * 100;
    return `
      <div class="bar-row">
        <div class="bar-label"><strong>${area}</strong><span>${value}/4</span></div>
        <div class="bar-track"><div class="bar-fill" style="width: ${width}%"></div></div>
      </div>
    `;
  }).join("");
}

function renderCoverage(student) {
  const counts = new Map();
  games.forEach((game) => counts.set(game.name, 0));
  (student.sessions || []).forEach((session) => {
    counts.set(session.game, (counts.get(session.game) || 0) + 1);
  });
  $("#coverage-list").innerHTML = games.map((game) => `
    <div class="coverage-pill">
      <div><strong>${escapeHtml(game.name)}</strong><span>${escapeHtml(game.category)}</span></div>
      <strong>${counts.get(game.name)}</strong>
    </div>
  `).join("");
}

function renderHistory(student) {
  const sessions = [...(student.sessions || [])].sort((a, b) => b.date.localeCompare(a.date));
  if (!sessions.length) {
    $("#session-history").innerHTML = "<p>No sessions recorded yet.</p>";
    return;
  }

  $("#session-history").innerHTML = sessions.map((session) => {
    const focus = gameFocus[session.category] || [];
    const scores = Object.entries(session.scores)
      .filter(([, score]) => Number(score) > 0)
      .map(([area, score]) => `<span class="tag">${escapeHtml(area)} ${score}/4</span>`)
      .join("");
    return `
      <article class="history-item">
        <div class="history-meta"><span>${escapeHtml(session.date)} | ${escapeHtml(session.mode)}</span><span>${escapeHtml(session.facilitator || "No facilitator")}</span></div>
        <strong>${escapeHtml(session.game)}</strong>
        <span>${escapeHtml(session.category)} | focus: ${focus.map(escapeHtml).join(", ")}</span>
        ${renderKliEvidence(session)}
        ${session.observation ? `<p><strong>Observation</strong><br>${escapeHtml(session.observation)}</p>` : ""}
        <div class="tag-list">${scores}</div>
      </article>
    `;
  }).join("");
}

function renderKliEvidence(session) {
  const selectedItems = (session.kliEvidenceItems || [])
    .map((itemId) => kliEvidenceItems.find((item) => item.id === itemId))
    .filter(Boolean);
  const notes = session.kliEvidenceNotes || (!selectedItems.length ? session.kliEvidence : "");
  if (!selectedItems.length && !notes) return "";

  const selectedTags = selectedItems
    .map((item) => `<span class="tag">${escapeHtml(item.label)}</span>`)
    .join("");
  const notesMarkup = notes ? `<p><strong>KLI notes</strong><br>${escapeHtml(notes)}</p>` : "";
  return `
    <p><strong>KLI evidence</strong></p>
    ${selectedTags ? `<div class="tag-list">${selectedTags}</div>` : ""}
    ${notesMarkup}
  `;
}

function addStudent() {
  const student = {
    id: id(),
    name: `Student ${state.students.length + 1}`,
    school: "",
    level: "",
    accessNotes: "",
    sessions: []
  };
  state.students.push(student);
  activeStudentId = student.id;
  render();
  saveRemote(() => dbStore.saveStudent(student));
  $("#student-name").focus();
}

function recordSession(event) {
  event.preventDefault();
  const student = activeStudent();
  if (!student) return;
  const game = games.find((item) => item.name === gameSelect.value);
  const scores = {};
  scoreControls.querySelectorAll("input[type='range']").forEach((input) => {
    scores[input.dataset.area] = Number(input.value);
  });
  const selectedKliItems = Array.from(kliChecklist.querySelectorAll("input[type='checkbox']:checked"))
    .map((input) => input.value);
  const session = {
    id: id(),
    date: sessionDate.value,
    mode: $("#session-mode").value,
    game: game.name,
    category: game.category,
    facilitator: $("#facilitator").value.trim(),
    kliEvidenceItems: selectedKliItems,
    kliEvidenceNotes: $("#kli-notes").value.trim(),
    kliEvidence: selectedKliItems.map(kliLabelFor).join("; "),
    observation: $("#observation").value.trim(),
    scores
  };
  student.sessions.push(session);
  saveRemote(async () => {
    await dbStore.saveStudent(student);
    await dbStore.saveSession(student.id, session);
  });
  kliChecklist.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.checked = false;
  });
  $("#kli-notes").value = "";
  $("#observation").value = "";
  render();
}

function kliLabelFor(itemId) {
  return kliEvidenceItems.find((item) => item.id === itemId)?.label || itemId;
}

function getKliEvidenceText(session) {
  const labels = (session.kliEvidenceItems || []).map(kliLabelFor);
  const notes = session.kliEvidenceNotes || "";
  if (labels.length || notes) {
    return [...labels, notes].filter(Boolean).join("; ");
  }
  return session.kliEvidence || "";
}

function saveProfile(event) {
  event.preventDefault();
  const student = activeStudent();
  if (!student) return;
  student.name = $("#student-name").value.trim() || "Unnamed student";
  student.school = $("#school-name").value.trim();
  student.level = $("#grade-level").value.trim();
  student.accessNotes = $("#support-needs").value.trim();
  render();
  saveRemote(() => dbStore.saveStudent(student));
}

function clearSessions() {
  const student = activeStudent();
  if (!student || !student.sessions.length) return;
  if (confirm(`Clear all sessions for ${student.name}?`)) {
    student.sessions = [];
    render();
    saveRemote(() => dbStore.replaceStudentSessions(student));
  }
}

function download(name, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const rows = [[
    "student", "school", "level", "date", "mode", "game", "category", "facilitator",
    "kliEvidence", "kliEvidenceNotes", "observation", ...learningAreas
  ]];
  state.students.forEach((student) => {
    (student.sessions || []).forEach((session) => {
      rows.push([
        student.name, student.school, student.level, session.date, session.mode, session.game,
        session.category, session.facilitator, getKliEvidenceText(session), session.kliEvidenceNotes || "", session.observation,
        ...learningAreas.map((area) => session.scores[area] ?? "")
      ]);
    });
  });
  download("vict-progress-sessions.csv", "text/csv", rows.map(toCsvRow).join("\n"));
}

function toCsvRow(values) {
  return values.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",");
}

function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported.students)) throw new Error("Missing students array");
      state = imported;
      activeStudentId = state.students[0]?.id || null;
      render();
      saveRemote(() => dbStore.saveAll(state));
    } catch (error) {
      alert(`Could not import file: ${error.message}`);
    }
  };
  reader.readAsText(file);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

$("#add-student").addEventListener("click", addStudent);
$("#empty-add-student").addEventListener("click", addStudent);
$("#student-form").addEventListener("submit", saveProfile);
$("#session-form").addEventListener("submit", recordSession);
$("#clear-sessions").addEventListener("click", clearSessions);
$("#export-json").addEventListener("click", () => {
  download("vict-progress-tracker.json", "application/json", JSON.stringify(state, null, 2));
});
$("#export-csv").addEventListener("click", exportCsv);
$("#import-json").addEventListener("change", importJson);
$("#sync-supabase").addEventListener("click", syncToSupabase);

seedControls();
render();
if (isDbEnabled()) {
  syncFromSupabase();
}
