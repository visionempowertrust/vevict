const dbStore = window.VictSupabaseStore;
const locations = window.INDIA_LOCATIONS || {};
const states = window.INDIA_STATES || Object.keys(locations).sort((a, b) => a.localeCompare(b));
const $ = (selector) => document.querySelector(selector);
const questionLevels = {
  1: "1 - Beginners",
  2: "2 - Existing Students",
  3: "3 - Advanced"
};
let registeredStudents = [];
let facilitators = [];
let questions = [];
let outcomes = [];
let suboutcomes = [];
const qualitativeRatings = ["Adequate", "Missing", "Acquired"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function setOptions(select, options, selected = "") {
  select.innerHTML = options.map((option) => {
    const value = typeof option === "string" ? option : option.value;
    const label = typeof option === "string" ? option : option.label;
    return `<option value="${escapeAttr(value)}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function renderStateOptions(selected = "") {
  setOptions($("#assessment-state"), states, selected || states[0] || "");
  renderDistrictOptions();
}

function renderDistrictOptions(selected = "") {
  const districts = locations[$("#assessment-state").value] || [];
  setOptions($("#assessment-district"), districts, selected || districts[0] || "");
}

function filteredStudents() {
  const state = $("#assessment-state").value;
  const district = $("#assessment-district").value;
  const school = $("#assessment-school").value;
  return registeredStudents.filter((student) => student.state === state && student.district === district && student.school === school);
}

function renderSchoolOptions(selected = "") {
  const state = $("#assessment-state").value;
  const district = $("#assessment-district").value;
  const schools = uniqueSorted(registeredStudents
    .filter((student) => student.state === state && student.district === district)
    .map((student) => student.school));
  setOptions($("#assessment-school"), schools.length ? schools : [{ value: "", label: "No schools found" }], selected && schools.includes(selected) ? selected : schools[0] || "");
}

function renderStudentOptions(selected = "") {
  const students = filteredStudents();
  setOptions($("#assessment-student"), students.length ? students.map((student) => ({
    value: student.id,
    label: `${student.name} - Grade ${student.grade}`
  })) : [{ value: "", label: "No registered students found" }], selected && students.some((student) => student.id === selected) ? selected : students[0]?.id || "");
}

function renderFacilitatorOptions(selected = "") {
  const state = $("#assessment-state").value;
  const available = facilitators.filter((facilitator) => facilitator.state === state && facilitator.active !== false);
  setOptions($("#assessment-facilitator"), available.length ? available.map((facilitator) => ({
    value: facilitator.name,
    label: facilitator.name
  })) : [{ value: "", label: "No facilitators found for this state" }], selected && available.some((facilitator) => facilitator.name === selected) ? selected : available[0]?.name || "");
}

function selectedStudent() {
  return registeredStudents.find((student) => student.id === $("#assessment-student").value);
}

function levelQuestions() {
  const level = Number($("#assessment-level").value);
  return questions.filter((question) => Number(question.questionLevel) === level).sort(compareQuestions);
}

function renderQuestionSections() {
  const list = levelQuestions();
  $("#assessment-question-count").textContent = `${list.length} question${list.length === 1 ? "" : "s"}`;
  renderFreePlay();
  if (!list.length) {
    $("#assessment-questions").innerHTML = '<p class="muted">No questions found for this level. Add questions in the Question Bank first.</p>';
    return;
  }
  $("#assessment-questions").innerHTML = [...groupQuestionsByOutcome(list).entries()]
    .map(([outcomeCode, outcomeQuestions]) => renderOutcomeSection(outcomeCode, outcomeQuestions))
    .join("");
}

function renderFreePlay() {
  const showFreePlay = Number($("#assessment-level").value) !== 1;
  $("#free-play-section").classList.toggle("hidden", !showFreePlay);
  $("#free-play-assessment").required = showFreePlay;
}

function renderOutcomeSection(outcomeCode, outcomeQuestions) {
  const outcome = outcomes.find((item) => item.outcomeCode === outcomeCode);
  const relatedSuboutcomes = suboutcomes.filter((item) => item.outcomeCode === outcomeCode);
  return `
    <section class="assessment-outcome-section">
      <div class="section-heading compact">
        <h2>${escapeHtml(outcome ? `${outcome.outcomeCode} - ${outcome.outcomeName}` : outcomeCode || "Unmapped CT Outcome")}</h2>
        <span class="muted">${outcomeQuestions.length} question${outcomeQuestions.length === 1 ? "" : "s"}</span>
      </div>
      <div class="table-wrap">
        <table class="data-table assessment-entry-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Question</th>
              <th>Picture</th>
              <th>Max Marks</th>
              <th>Marks</th>
            </tr>
          </thead>
          <tbody>
            ${outcomeQuestions.map(renderQuestionRow).join("")}
          </tbody>
        </table>
      </div>
      <div class="qualitative-outcome">
        <div class="form-row">
          <div>
            <label for="qualitative-${escapeAttr(outcomeCode)}">Overall rating for this CT outcome</label>
            <select id="qualitative-${escapeAttr(outcomeCode)}" data-qualitative-outcome="${escapeAttr(outcomeCode)}" required>
              ${qualitativeRatingOptions()}
            </select>
          </div>
        </div>
        <div class="kli-checklist">
          ${relatedSuboutcomes.map((item) => `
            <div class="check-row">
              <input id="assessment-suboutcome-${escapeAttr(item.suboutcomeCode)}" type="checkbox" data-qualitative-suboutcome="${escapeAttr(item.suboutcomeCode)}">
              <label for="assessment-suboutcome-${escapeAttr(item.suboutcomeCode)}">
                ${escapeHtml(`${item.suboutcomeCode} - ${item.suboutcomeName}`)}
                <span>${escapeHtml(item.description)}</span>
              </label>
            </div>
          `).join("") || '<p class="muted">No subskills mapped for this CT outcome.</p>'}
        </div>
      </div>
    </section>
  `;
}

function groupQuestionsByOutcome(items) {
  const grouped = new Map();
  items.forEach((question) => {
    const key = question.outcomeCode || "";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(question);
  });
  return grouped;
}

function renderQuestionRow(question) {
  return `
    <tr>
      <td>${escapeHtml(question.questionOrder || "")}</td>
      <td>${escapeHtml(question.questionText)}</td>
      <td>${question.imageDataUrl ? `<img class="question-bank-thumb" src="${escapeAttr(question.imageDataUrl)}" alt="${escapeAttr(question.imageName || "Question image")}">` : '<span class="muted">No image</span>'}</td>
      <td>${escapeHtml(question.totalMarks)}</td>
      <td>
        <select data-question-score="${escapeAttr(question.id)}" required>
          <option value="">Select</option>
          <option value="1">1</option>
          <option value="0.5">0.5</option>
          <option value="0">0</option>
        </select>
      </td>
    </tr>
  `;
}

function compareQuestions(a, b) {
  return Number(a.questionOrder || 0) - Number(b.questionOrder || 0) ||
    String(a.outcomeCode || "").localeCompare(String(b.outcomeCode || "")) ||
    String(a.questionText || "").localeCompare(String(b.questionText || ""));
}

function qualitativeRatingOptions() {
  return `
    <option value="">Select rating</option>
    ${qualitativeRatings.map((rating) => `<option value="${escapeAttr(rating)}">${escapeHtml(rating)}</option>`).join("")}
  `;
}

function collectQuestionScores() {
  return levelQuestions().map((question) => {
    const marks = Number(document.querySelector(`[data-question-score="${cssEscape(question.id)}"]`)?.value || 0);
    const outcome = outcomes.find((item) => item.outcomeCode === question.outcomeCode);
    return {
      questionId: question.id,
      questionLevel: question.questionLevel,
      questionOrder: question.questionOrder,
      outcomeCode: question.outcomeCode,
      outcomeName: outcome?.outcomeName || "",
      questionText: question.questionText,
      imageName: question.imageName,
      maxMarks: Number(question.totalMarks),
      marks
    };
  });
}

function collectQualitativeOutcomes() {
  return Array.from(document.querySelectorAll("[data-qualitative-outcome]")).map((select) => {
    const outcome = outcomes.find((item) => item.outcomeCode === select.dataset.qualitativeOutcome);
    const rating = select.value;
    const selectedSuboutcomeCodes = new Set(Array.from(document.querySelectorAll("[data-qualitative-suboutcome]:checked")).map((checkbox) => checkbox.dataset.qualitativeSuboutcome));
    return {
      outcomeCode: outcome?.outcomeCode || "",
      outcomeName: outcome?.outcomeName || "",
      rating,
      suboutcomes: suboutcomes
        .filter((item) => item.outcomeCode === outcome?.outcomeCode && selectedSuboutcomeCodes.has(item.suboutcomeCode))
        .map((item) => ({
          suboutcomeCode: item.suboutcomeCode,
          suboutcomeName: item.suboutcomeName,
          description: item.description
        }))
    };
  });
}

async function saveAssessment(event) {
  event.preventDefault();
  const student = selectedStudent();
  if (!student) {
    alert("Choose a registered student before saving.");
    return;
  }
  const questionScores = collectQuestionScores();
  if (!questionScores.length) {
    alert("Add question bank questions for this level before saving an assessment.");
    return;
  }
  const entry = {
    state: $("#assessment-state").value,
    district: $("#assessment-district").value,
    school: $("#assessment-school").value,
    studentId: student.id,
    studentName: student.name,
    date: $("#assessment-date").value,
    facilitator: $("#assessment-facilitator").value,
    assessmentLevel: Number($("#assessment-level").value),
    questionScores,
    freePlayAssessment: {
      prompt: "Make a rangoli picture of your choice and describe about it.",
      rating: Number($("#assessment-level").value) === 1 ? "Not applicable" : $("#free-play-assessment").value
    },
    qualitativeOutcomes: collectQualitativeOutcomes(),
    otherObservations: $("#assessment-observations").value.trim(),
    accuracyScore: $("#assessment-accuracy").value
  };
  $("#assessment-entry-status").textContent = "Saving...";
  $("#assessment-entry-message").textContent = "";
  try {
    await dbStore.saveAssessmentEntry(entry);
    $("#assessment-entry-status").textContent = "Saved";
    $("#assessment-entry-message").textContent = "Assessment submitted successfully.";
    $("#assessment-observations").value = "";
    $("#assessment-accuracy").value = "High";
    if (Number($("#assessment-level").value) !== 1) $("#free-play-assessment").value = "Satisfactory";
    renderQuestionSections();
  } catch (error) {
    $("#assessment-entry-status").textContent = "Save failed";
    alert(`Could not save assessment: ${error.message}`);
  }
}

async function loadData() {
  if (!dbStore?.isEnabled()) {
    $("#assessment-entry-status").textContent = "Supabase not configured";
    return;
  }
  $("#assessment-entry-status").textContent = "Loading...";
  try {
    const data = await dbStore.loadAssessmentEntryData();
    registeredStudents = data.registeredStudents || [];
    facilitators = data.facilitators || [];
    questions = data.questions || [];
    outcomes = data.outcomes || [];
    suboutcomes = data.suboutcomes || [];
    renderSchoolOptions();
    renderStudentOptions();
    renderFacilitatorOptions();
    renderQuestionSections();
    $("#assessment-entry-status").textContent = "Ready";
  } catch (error) {
    $("#assessment-entry-status").textContent = "Load failed";
    alert(`Could not load assessment entry data: ${error.message}`);
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

$("#assessment-date").value = today();
renderStateOptions();
$("#assessment-state").addEventListener("change", () => {
  renderDistrictOptions();
  renderSchoolOptions();
  renderStudentOptions();
  renderFacilitatorOptions();
});
$("#assessment-district").addEventListener("change", () => {
  renderSchoolOptions();
  renderStudentOptions();
});
$("#assessment-school").addEventListener("change", renderStudentOptions);
$("#assessment-level").addEventListener("change", renderQuestionSections);
$("#assessment-entry-form").addEventListener("submit", saveAssessment);
loadData();
