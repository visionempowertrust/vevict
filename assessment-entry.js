const dbStore = window.VictSupabaseStore;
const locations = window.INDIA_LOCATIONS || {};
const states = window.INDIA_STATES || Object.keys(locations).sort((a, b) => a.localeCompare(b));
const $ = (selector) => document.querySelector(selector);
const questionLevels = {
  1: "Level 1",
  2: "Level 2",
  3: "Level 3"
};
const gradeOptions = Array.from({ length: 10 }, (_, index) => String(index + 1));
let registeredStudents = [];
let facilitators = [];
let questions = [];
let outcomes = [];
let suboutcomes = [];
const draftStorageKey = "vict-assessment-entry-draft";
let restoringDraft = false;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function configureAssessmentDateLimit() {
  $("#assessment-date").max = today();
}

function isFutureAssessmentDate(value) {
  return value && value > today();
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

function toStateList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function renderStateOptions(selected = "") {
  setOptions($("#assessment-state"), states, selected || states[0] || "");
}

function filteredStudents() {
  const state = $("#assessment-state").value;
  const school = $("#assessment-school").value;
  const grade = $("#assessment-grade").value;
  return registeredStudents.filter((student) =>
    student.state === state &&
    student.school === school &&
    String(student.grade) === grade
  );
}

function renderSchoolOptions(selected = "") {
  const state = $("#assessment-state").value;
  const schools = uniqueSorted(registeredStudents
    .filter((student) => student.state === state)
    .map((student) => student.school));
  setOptions($("#assessment-school"), schools.length ? schools : [{ value: "", label: "No schools found" }], selected && schools.includes(selected) ? selected : schools[0] || "");
}

function renderGradeOptions(selected = "") {
  const state = $("#assessment-state").value;
  const school = $("#assessment-school").value;
  const availableGrades = new Set(registeredStudents
    .filter((student) => student.state === state && student.school === school)
    .map((student) => String(student.grade)));
  const fallback = gradeOptions.find((grade) => availableGrades.has(grade)) || gradeOptions[0];
  const selectedGrade = selected && gradeOptions.includes(String(selected)) ? String(selected) : fallback;
  setOptions($("#assessment-grade"), gradeOptions.map((grade) => ({
    value: grade,
    label: `Grade ${grade}`
  })), selectedGrade);
}

function renderStudentOptions(selected = "") {
  const students = filteredStudents();
  setOptions($("#assessment-student"), students.length ? students.map((student) => ({
    value: student.id,
    label: `${student.name}${student.studentIdentifier ? ` (${student.studentIdentifier})` : ""} - Grade ${student.grade}`
  })) : [{ value: "", label: "No registered students found" }], selected && students.some((student) => student.id === selected) ? selected : students[0]?.id || "");
}

function renderFacilitatorOptions(selected = []) {
  const state = $("#assessment-state").value;
  const available = facilitators.filter((facilitator) => toStateList(facilitator.state).includes(state) && facilitator.active !== false);
  const selectedNames = Array.isArray(selected) ? selected : String(selected || "").split(",").map((name) => name.trim()).filter(Boolean);
  const effectiveSelectedNames = selectedNames.length ? selectedNames : available.length === 1 ? [available[0].name] : [];
  $("#assessment-facilitator").innerHTML = available.length ? available.map((facilitator) => {
    const isSelected = effectiveSelectedNames.includes(facilitator.name) ? " selected" : "";
    return `<option value="${escapeAttr(facilitator.name)}"${isSelected}>${escapeHtml(facilitator.name)}</option>`;
  }).join("") : '<option value="" disabled>No facilitators found for this state</option>';
}

function selectedStudent() {
  return registeredStudents.find((student) => student.id === $("#assessment-student").value);
}

function selectedFacilitators() {
  return Array.from($("#assessment-facilitator").selectedOptions)
    .map((option) => option.value)
    .filter(Boolean);
}

function selectedQuestionScores() {
  const scores = {};
  document.querySelectorAll("[data-question-score]").forEach((select) => {
    scores[select.dataset.questionScore] = select.value;
  });
  return scores;
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
              <th>Subskills Tested</th>
              <th>Max Marks</th>
              <th>Marks</th>
            </tr>
          </thead>
          <tbody>
            ${outcomeQuestions.map(renderQuestionRow).join("")}
          </tbody>
        </table>
      </div>
      <p class="muted">Overall rating for this CT outcome will be calculated from the marks scored for the questions above.</p>
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
      <td>${renderQuestionSuboutcomes(question)}</td>
      <td>${escapeHtml(question.totalMarks)}</td>
      <td>
        <select data-question-score="${escapeAttr(question.id)}" aria-label="${escapeAttr(`Marks for question ${question.questionOrder || ""}: ${question.questionText}`)}" required>
          <option value="">Select</option>
          <option value="0">0</option>
          <option value="0.25">0.25</option>
          <option value="0.5">0.5</option>
          <option value="0.75">0.75</option>
          <option value="1">1</option>
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

function renderQuestionSuboutcomes(question) {
  const mapped = questionSuboutcomes(question);
  if (!mapped.length) return '<span class="muted">Not mapped</span>';
  return `<ul class="compact-list">${mapped.map((item) => `<li>${escapeHtml([item.suboutcomeCode, item.suboutcomeName].filter(Boolean).join(" - "))}</li>`).join("")}</ul>`;
}

function questionSuboutcomes(question) {
  const codes = Array.isArray(question.testedSuboutcomeCodes) ? question.testedSuboutcomeCodes : [];
  return codes.map((code) => suboutcomes.find((item) => item.suboutcomeCode === code) || {
    suboutcomeCode: code,
    outcomeCode: question.outcomeCode,
    suboutcomeName: "",
    description: ""
  }).filter((item) => item.suboutcomeCode);
}

function qualitativeRatingForPercent(percent) {
  if (percent > 75) return "Acquired";
  if (percent > 30) return "Adequate";
  return "Missing";
}

function saveDraft() {
  if (restoringDraft) return;
  const draft = {
    state: $("#assessment-state").value,
    school: $("#assessment-school").value,
    grade: $("#assessment-grade").value,
    studentId: $("#assessment-student").value,
    date: $("#assessment-date").value,
    facilitators: selectedFacilitators(),
    assessmentLevel: $("#assessment-level").value,
    questionScores: selectedQuestionScores(),
    freePlayAssessment: $("#free-play-assessment").value,
    otherObservations: $("#assessment-observations").value,
    accuracyScore: $("#assessment-accuracy").value
  };
  try {
    sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
  } catch (error) {
    // Draft persistence is helpful, but should never block assessment entry.
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(draftStorageKey);
  } catch (error) {
    // Ignore storage cleanup failures.
  }
}

function loadDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(draftStorageKey) || "null");
  } catch (error) {
    return null;
  }
}

function restoreDraft() {
  const draft = loadDraft();
  if (!draft) return;
  restoringDraft = true;
  if (draft.state) {
    $("#assessment-state").value = draft.state;
    renderSchoolOptions(draft.school);
    renderGradeOptions(draft.grade);
    renderStudentOptions(draft.studentId);
    renderFacilitatorOptions(draft.facilitators);
  }
  $("#assessment-date").value = draft.date || today();
  $("#assessment-level").value = draft.assessmentLevel || "1";
  renderQuestionSections();
  Object.entries(draft.questionScores || {}).forEach(([questionId, value]) => {
    const score = document.querySelector(`[data-question-score="${cssEscape(questionId)}"]`);
    if (score) score.value = value;
  });
  $("#free-play-assessment").value = draft.freePlayAssessment || "Satisfactory";
  $("#assessment-observations").value = draft.otherObservations || "";
  $("#assessment-accuracy").value = draft.accuracyScore || "High";
  restoringDraft = false;
  $("#assessment-entry-message").textContent = "Restored unsaved assessment draft.";
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
      marks,
      testedSuboutcomes: questionSuboutcomes(question).map((item) => ({
        suboutcomeCode: item.suboutcomeCode,
        suboutcomeName: item.suboutcomeName,
        description: item.description || ""
      }))
    };
  });
}

function collectQualitativeOutcomes() {
  return [...groupQuestionsByOutcome(collectQuestionScores()).entries()].map(([outcomeCode, questionScores]) => {
    const outcome = outcomes.find((item) => item.outcomeCode === outcomeCode);
    const earned = questionScores.reduce((sum, item) => sum + Number(item.marks || 0), 0);
    const max = questionScores.reduce((sum, item) => sum + Number(item.maxMarks || 0), 0);
    const percent = max ? (earned / max) * 100 : 0;
    const mappedSuboutcomes = new Map();
    questionScores.forEach((score) => {
      (score.testedSuboutcomes || []).forEach((item) => {
        if (!mappedSuboutcomes.has(item.suboutcomeCode)) mappedSuboutcomes.set(item.suboutcomeCode, item);
      });
    });
    return {
      outcomeCode: outcome?.outcomeCode || "",
      outcomeName: outcome?.outcomeName || "",
      rating: qualitativeRatingForPercent(percent),
      scorePercent: Math.round(percent),
      earnedMarks: earned,
      maxMarks: max,
      suboutcomes: [...mappedSuboutcomes.values()]
    };
  });
}

function buildAssessmentPreview(entry, includeSubmitPrompt = true) {
  const scoreCount = entry.questionScores.length;
  const qualitative = entry.qualitativeOutcomes.map((item) => {
    return `${item.outcomeName || item.outcomeCode}: ${item.rating} (${item.earnedMarks}/${item.maxMarks}, ${item.scorePercent}%)`;
  }).join("\n");
  const preview = [
    "Please confirm the assessment submission:",
    "",
    `Student: ${entry.studentName}`,
    `Date: ${entry.date}`,
    `State: ${entry.state}`,
    `District: ${entry.district}`,
    `School: ${entry.school}`,
    `Facilitator(s): ${entry.facilitator}`,
    `Level: ${questionLevels[entry.assessmentLevel] || entry.assessmentLevel}`,
    `Question scores entered: ${scoreCount}`,
    `Free play: ${entry.freePlayAssessment.rating}`,
    `Accuracy score: ${entry.accuracyScore}`,
    "",
    "Qualitative ratings:",
    qualitative || "No qualitative ratings recorded."
  ].join("\n");
  return includeSubmitPrompt ? `${preview}\n\nSubmit this assessment?` : preview;
}

function buildAssessmentEntry() {
  saveDraft();
  const student = selectedStudent();
  if (!student) {
    alert("Choose a registered student before saving.");
    return null;
  }
  const facilitatorNames = selectedFacilitators();
  if (!facilitatorNames.length) {
    alert("Choose at least one facilitator before saving.");
    return null;
  }
  if (isFutureAssessmentDate($("#assessment-date").value)) {
    alert("Assessment Date cannot be a future date.");
    $("#assessment-date").focus();
    return null;
  }
  const questionScores = collectQuestionScores();
  if (!questionScores.length) {
    alert("Add question bank questions for this level before saving an assessment.");
    return null;
  }
  return {
    state: $("#assessment-state").value,
    district: student.district || "",
    school: $("#assessment-school").value,
    studentId: student.id,
    studentName: student.name,
    date: $("#assessment-date").value,
    facilitator: facilitatorNames.join(", "),
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
}

function previewAssessment() {
  const entry = buildAssessmentEntry();
  if (!entry) return;
  alert(buildAssessmentPreview(entry, false));
}

async function saveAssessment(event) {
  event.preventDefault();
  const entry = buildAssessmentEntry();
  if (!entry) return;
  if (!confirm(buildAssessmentPreview(entry))) {
    $("#assessment-entry-status").textContent = "Ready";
    $("#assessment-entry-message").textContent = "Submission cancelled. Your entered data is still available.";
    saveDraft();
    return;
  }
  $("#assessment-entry-status").textContent = "Saving...";
  $("#assessment-entry-message").textContent = "";
  try {
    await dbStore.saveAssessmentEntry(entry);
    $("#assessment-entry-status").textContent = "Saved";
    alert("Assessment Submitted Successfully");
    clearDraft();
    $("#assessment-entry-message").textContent = "";
    $("#assessment-observations").value = "";
    $("#assessment-accuracy").value = "High";
    if (Number($("#assessment-level").value) !== 1) $("#free-play-assessment").value = "Satisfactory";
    renderQuestionSections();
  } catch (error) {
    $("#assessment-entry-status").textContent = "Save failed";
    saveDraft();
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
    renderGradeOptions();
    renderStudentOptions();
    renderFacilitatorOptions();
    renderQuestionSections();
    restoreDraft();
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

configureAssessmentDateLimit();
$("#assessment-date").value = today();
renderStateOptions();
$("#assessment-state").addEventListener("change", () => {
  renderSchoolOptions();
  renderGradeOptions();
  renderStudentOptions();
  renderFacilitatorOptions();
});
$("#assessment-school").addEventListener("change", () => {
  renderGradeOptions();
  renderStudentOptions();
});
$("#assessment-grade").addEventListener("change", renderStudentOptions);
$("#assessment-level").addEventListener("change", renderQuestionSections);
$("#assessment-entry-form").addEventListener("input", saveDraft);
$("#assessment-entry-form").addEventListener("change", saveDraft);
$("#preview-assessment").addEventListener("click", previewAssessment);
$("#assessment-entry-form").addEventListener("submit", saveAssessment);
loadData();
