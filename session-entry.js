const dbStore = window.VictSupabaseStore;
const locations = window.INDIA_LOCATIONS || {};
const states = window.INDIA_STATES || Object.keys(locations).sort((a, b) => a.localeCompare(b));
const $ = (selector) => document.querySelector(selector);

let games = [];
let registeredStudents = [];
let outcomes = [];
let suboutcomes = [];
let rubric = [];
let generalOutcomes = [];
let otherOutcomes = [];
let facilitators = [];

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
    registeredStudents = data.registeredStudents || [];
    outcomes = data.outcomes || [];
    suboutcomes = data.suboutcomes || [];
    rubric = data.rubric || [];
    generalOutcomes = data.generalOutcomes || [];
    otherOutcomes = data.otherOutcomes || [];
    facilitators = data.facilitators || [];
    renderSchoolOptions();
    renderStudentOptions();
    renderFacilitatorOptions();
    renderGames();
    renderAssessmentSections();
    $("#save-status").textContent = "Ready";
  } catch (error) {
    $("#save-status").textContent = "Load failed";
    alert(`Could not load assessment data from Supabase: ${error.message}`);
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

function renderFacilitatorOptions(selectedValue = "") {
  const state = $("#session-state").value;
  const available = facilitators.filter((facilitator) => facilitator.state === state && facilitator.active !== false);
  if (!available.length) {
    setOptions($("#session-facilitator"), [{ value: "", label: "No facilitators found for this state" }]);
    return;
  }
  setOptions($("#session-facilitator"), available.map((facilitator) => ({
    value: facilitator.name,
    label: facilitator.name
  })), selectedValue && available.some((facilitator) => facilitator.name === selectedValue) ? selectedValue : available[0].name);
}
function selectedStudent() {
  return registeredStudents.find((student) => student.id === $("#session-student").value);
}

function renderGames() {
  if (!games.length) {
    $("#session-game").innerHTML = '<option value="">No games found</option>';
    return;
  }
  setOptions($("#session-game"), games.map((game) => ({
    value: game.gameCode,
    label: `${game.game} (${game.gameCode})`
  })));
}

function selectedGame() {
  return games.find((game) => game.gameCode === $("#session-game").value);
}

function selectedPrimaryOutcome() {
  const game = selectedGame();
  return outcomes.find((outcome) => outcome.outcomeCode === game?.primaryCtOutcomeCode);
}

function commonRatingOptions() {
  return `
    <option value="">Select rating</option>
    ${rubric.map((level) => `
      <option value="${level.scale}">${escapeHtml(`${level.scale} - ${level.scale_name} - ${level.meaning}`)}</option>
    `).join("")}
  `;
}

function primaryRatingOptions(outcome) {
  return `
    <option value="">Select rating</option>
    ${outcome.levels.map((description, index) => {
      const scale = rubric.find((level) => Number(level.scale) === index + 1);
      return `<option value="${index + 1}">${escapeHtml(`${index + 1} - ${scale?.scale_name || ""} - ${description}`)}</option>`;
    }).join("")}
  `;
}

function renderOutcomeRows(containerSelector, outcomesList, dataAttribute, required = true) {
  $(containerSelector).innerHTML = outcomesList.length ? outcomesList.map((outcome) => `
    <tr>
      <td>${escapeHtml(outcome.outcome_code)}</td>
      <td>${escapeHtml(outcome.outcome_name)}</td>
      <td>
        <select ${dataAttribute}="${escapeAttr(outcome.outcome_code)}" aria-label="${escapeAttr(outcome.outcome_name)} rating"${required ? " required" : ""}>
          ${commonRatingOptions()}
        </select>
      </td>
    </tr>
  `).join("") : '<tr><td colspan="3" class="muted">No outcomes found.</td></tr>';
}

function renderAssessmentSections() {
  renderOutcomeRows("#general-outcomes-table", generalOutcomes, "data-general-outcome");
  renderOutcomeRows("#other-outcomes-table", otherOutcomes, "data-other-outcome", false);

  const game = selectedGame();
  const primaryOutcome = selectedPrimaryOutcome();
  if (!game || !primaryOutcome) {
    $("#primary-ct-table").innerHTML = '<tr><td colspan="4" class="muted">No primary CT skill is mapped to this game.</td></tr>';
    $("#primary-ct-status").textContent = "Not mapped";
    $("#ct-suboutcomes").innerHTML = '<p class="muted">No suboutcomes available.</p>';
    $("#suboutcomes-count").textContent = "0 available";
    return;
  }

  $("#primary-ct-status").textContent = `${primaryOutcome.outcomeCode} - ${primaryOutcome.outcomeName}`;
  $("#primary-ct-table").innerHTML = `
    <tr>
      <td>${escapeHtml(primaryOutcome.outcomeCode)}</td>
      <td>${escapeHtml(primaryOutcome.outcomeName)}</td>
      <td>${escapeHtml(game.primaryCtObservation)}</td>
      <td>
        <select id="primary-ct-rating" aria-label="Primary CT skill rating" required>
          ${primaryRatingOptions(primaryOutcome)}
        </select>
      </td>
    </tr>
  `;

  const availableSuboutcomes = suboutcomes.filter((item) => item.outcomeCode === primaryOutcome.outcomeCode);
  $("#suboutcomes-count").textContent = `${availableSuboutcomes.length} available`;
  $("#ct-suboutcomes").innerHTML = availableSuboutcomes.map((item) => `
    <div class="check-row">
      <input id="suboutcome-${escapeAttr(item.suboutcomeCode)}" type="checkbox" data-ct-suboutcome="${escapeAttr(item.suboutcomeCode)}">
      <label for="suboutcome-${escapeAttr(item.suboutcomeCode)}">
        ${escapeHtml(`${item.suboutcomeCode} - ${item.suboutcomeName}`)}
        <span>${escapeHtml(item.description)}</span>
      </label>
    </div>
  `).join("");
}

function collectCommonRatings(outcomesList, attribute) {
  return Object.fromEntries(outcomesList.map((outcome) => {
    const select = document.querySelector(`[${attribute}="${outcome.outcome_code}"]`);
    const rating = Number(select?.value || 0);
    const scale = rubric.find((item) => Number(item.scale) === rating);
    return rating ? [outcome.outcome_code, {
      outcomeCode: outcome.outcome_code,
      outcomeName: outcome.outcome_name,
      rating,
      scaleName: scale?.scale_name || "",
      meaning: scale?.meaning || ""
    }] : null;
  }).filter(Boolean));
}

function collectPrimaryCtRating() {
  const game = selectedGame();
  const outcome = selectedPrimaryOutcome();
  const rating = Number($("#primary-ct-rating")?.value || 0);
  const scale = rubric.find((item) => Number(item.scale) === rating);
  return {
    outcomeCode: outcome?.outcomeCode || "",
    outcomeName: outcome?.outcomeName || "",
    rating,
    scaleName: scale?.scale_name || "",
    description: rating ? outcome?.levels[rating - 1] || "" : "",
    observation: game?.primaryCtObservation || ""
  };
}

function collectSelectedSuboutcomes() {
  const selectedCodes = new Set(Array.from(document.querySelectorAll("[data-ct-suboutcome]:checked"))
    .map((checkbox) => checkbox.dataset.ctSuboutcome));
  return suboutcomes
    .filter((item) => selectedCodes.has(item.suboutcomeCode))
    .map((item) => ({
      suboutcomeCode: item.suboutcomeCode,
      outcomeCode: item.outcomeCode,
      suboutcomeName: item.suboutcomeName,
      description: item.description
    }));
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
  if (!student) {
    alert("Choose a registered student before saving.");
    return;
  }

  const entry = {
    state: $("#session-state").value,
    district: $("#session-district").value,
    school: $("#session-school").value,
    date: $("#session-date").value,
    facilitator: $("#session-facilitator").value,
    studentName: student.name,
    gameCode: game.gameCode,
    game: game.game,
    comments: $("#session-comments").value.trim(),
    observationAccuracyScore: $("#observation-accuracy-score").value,
    generalOutcomeRatings: collectCommonRatings(generalOutcomes, "data-general-outcome"),
    primaryCtRating: collectPrimaryCtRating(),
    selectedCtSuboutcomes: collectSelectedSuboutcomes(),
    otherOutcomeRatings: collectCommonRatings(otherOutcomes, "data-other-outcome"),
    levelStatuses: []
  };

  $("#save-status").textContent = "Saving...";
  try {
    await dbStore.saveFacilitatorSession(entry);
    $("#save-status").textContent = "Saved";
    $("#session-comments").value = "";
    renderAssessmentSections();
  } catch (error) {
    $("#save-status").textContent = "Save failed";
    alert(`Could not save session: ${error.message}`);
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

$("#session-date").value = today();
renderStateOptions();
$("#session-game").addEventListener("change", renderAssessmentSections);
$("#session-state").addEventListener("change", () => {
  renderDistrictOptions();
  renderSchoolOptions();
  renderStudentOptions();
  renderFacilitatorOptions();
});
$("#session-district").addEventListener("change", () => {
  renderSchoolOptions();
  renderStudentOptions();
});
$("#session-school").addEventListener("change", renderStudentOptions);
$("#facilitator-session-form").addEventListener("submit", saveSession);

loadData();
