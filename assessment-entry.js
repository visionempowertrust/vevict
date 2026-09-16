const dbStore = window.VictSupabaseStore;
const locations = window.INDIA_LOCATIONS || {};
const states = window.INDIA_STATES || Object.keys(locations).sort((a, b) => a.localeCompare(b));
const $ = (selector) => document.querySelector(selector);
const questionLevels = {
  1: "Level 1",
  2: "Level 2",
  3: "Level 3"
};
const observationScaleOptions = [
  { value: "", label: "Select" },
  { value: "Low", label: "Low" },
  { value: "Moderate", label: "Moderate" },
  { value: "High", label: "High" }
];
const assessmentTemplateHeaders = {
  studentId: "Student ID (Mandatory)",
  date: "Assessment Date YYYY-MM-DD (Mandatory)",
  facilitators: "Facilitators separated by | (Mandatory)",
  level: "Level (Mandatory)",
  freePlay: "Free Play Assessment (Mandatory for Levels 2 and 3)",
  comprehension: "Comprehension: Low/Moderate/High (Mandatory)",
  creativity: "Creativity: Low/Moderate/High (Mandatory)",
  concentration: "Concentration: Low/Moderate/High (Mandatory)",
  speed: "Speed: Low/Moderate/High (Mandatory)",
  confidence: "Confidence: Low/Moderate/High (Mandatory)",
  accuracy: "Accuracy Score: High/Low (Mandatory)",
  gaps: "Noticeable Gaps (Optional)",
  support: "Suggested Support (Optional)",
  observations: "Other Observations (Optional)",
  alterations: "Question Alterations JSON (Optional)",
  duration: "Assessment Duration in Minutes (Mandatory)"
};
const assessmentCoreHeaderList = Object.values(assessmentTemplateHeaders);
const gradeOptions = Array.from({ length: 13 }, (_, index) => String(index));
let registeredStudents = [];
let registeredSchools = [];
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
  const schoolStates = uniqueSorted(registeredSchools.map((school) => school.state));
  const fallbackStates = schoolStates.length ? schoolStates : states;
  const selectedState = selected && fallbackStates.includes(selected) ? selected : fallbackStates[0] || "";
  setOptions($("#assessment-state"), fallbackStates.length ? fallbackStates : [{ value: "", label: "No registered school states found" }], selectedState);
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
  const schoolsFromRegistration = uniqueSorted(registeredSchools
    .filter((school) => school.state === state)
    .map((school) => school.name));
  const schools = schoolsFromRegistration.length ? schoolsFromRegistration : uniqueSorted(registeredStudents
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

function templateQuestionHeader(question) {
  return `Question Score [${question.id}] (Mandatory)`;
}

function questionsForLevel(level) {
  return questions.filter((question) => Number(question.questionLevel) === Number(level)).sort(compareQuestions);
}

function requireExcelLibrary() {
  if (window.XLSX) return true;
  alert("Excel support could not be loaded. Check the internet connection and reload the page.");
  return false;
}

function downloadAssessmentTemplate() {
  if (!requireExcelLibrary()) return;
  if (!questions.length) {
    alert("No assessment questions are available. Add questions before downloading the template.");
    return;
  }
  const workbook = XLSX.utils.book_new();
  const instructions = [
    ["VICT Assessment Entry Upload Template"],
    ["Fields containing (Mandatory) must be completed."],
    ["Enter one complete assessment per row on the sheet matching its level."],
    ["Student ID must already exist in Registrations."],
    ["Assessment Date format", "YYYY-MM-DD; future dates are not accepted."],
    ["Facilitators", "Separate multiple facilitator names with |."],
    ["Question scores", "Allowed values: 0, 0.25, 0.5, 0.75, or 1."],
    ["Qualitative observations", "Allowed values: Low, Moderate, or High."],
    ["Free Play Assessment", "Use Satisfactory or Needs improvement. Not required for Level 1."],
    ["Accuracy Score", "Use High or Low."],
    ["CSV upload", "Save one Level sheet as CSV without changing its header row."]
  ];
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
  instructionsSheet["!cols"] = [{ wch: 34 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

  [1, 2, 3].forEach((level) => {
    const levelQuestionList = questionsForLevel(level);
    const headers = [
      ...assessmentCoreHeaderList.filter((header) => header !== assessmentTemplateHeaders.duration),
      ...levelQuestionList.map(templateQuestionHeader),
      assessmentTemplateHeaders.duration
    ];
    const exampleRow = headers.map((header) => header === assessmentTemplateHeaders.level ? `Level ${level}` : "");
    const sheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    sheet["!cols"] = headers.map((header) => ({ wch: header.startsWith("Question Score") ? 42 : Math.min(42, Math.max(18, header.length + 2)) }));
    XLSX.utils.book_append_sheet(workbook, sheet, `Level ${level}`);
  });

  const referenceRows = [["Level", "Primary Outcome", "Question Order", "Question ID", "Question", "Maximum Marks"]];
  questions.slice().sort((a, b) => Number(a.questionLevel) - Number(b.questionLevel) || compareQuestions(a, b)).forEach((question) => {
    referenceRows.push([`Level ${question.questionLevel}`, question.outcomeCode || "", question.questionOrder || "", question.id, question.questionText, Number(question.totalMarks || 0)]);
  });
  const referenceSheet = XLSX.utils.aoa_to_sheet(referenceRows);
  referenceSheet["!cols"] = [{ wch: 12 }, { wch: 20 }, { wch: 16 }, { wch: 38 }, { wch: 100 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, referenceSheet, "Question Reference");
  XLSX.writeFile(workbook, "vict-assessment-entry-template.xlsx", { bookType: "xlsx" });
}

function normalizedUploadValue(value) {
  return String(value ?? "").trim();
}

function normalizedUploadHeader(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\u00a0/g, " ")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s*\((?:mandatory|optional)[^)]*\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function uploadCell(row, expectedHeader) {
  if (Object.prototype.hasOwnProperty.call(row, expectedHeader)) return row[expectedHeader];
  const expected = normalizedUploadHeader(expectedHeader);
  const matchingHeader = Object.keys(row).find((header) => normalizedUploadHeader(header) === expected);
  return matchingHeader === undefined ? "" : row[matchingHeader];
}

function hasUploadHeader(row, expectedHeader) {
  const expected = normalizedUploadHeader(expectedHeader);
  return Object.keys(row).some((header) => normalizedUploadHeader(header) === expected);
}

function requiredUploadValue(row, header) {
  const value = normalizedUploadValue(uploadCell(row, header));
  if (!value) throw new Error(`${header.replace(/\s*\(Mandatory.*$/i, "")} is required.`);
  return value;
}

function uploadLevel(value, sheetName) {
  const match = `${value || sheetName}`.match(/(?:level\s*)?([1-3])/i);
  if (!match) throw new Error("Level must be Level 1, Level 2, or Level 3.");
  return Number(match[1]);
}

function uploadRating(value, fieldName, allowed) {
  const normalized = normalizedUploadValue(value);
  const match = allowed.find((item) => item.toLowerCase() === normalized.toLowerCase());
  if (!match) throw new Error(`${fieldName} must be ${allowed.join(", ")}.`);
  return match;
}

function uploadAssessmentDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && window.XLSX?.SSF) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const text = normalizedUploadValue(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  throw new Error("Assessment Date must be a valid date using YYYY-MM-DD format.");
}

function questionScoreFromUpload(question, value) {
  const raw = normalizedUploadValue(value);
  if (raw === "") throw new Error(`A score is required for question ${question.questionOrder || question.id}.`);
  const marks = Number(raw);
  if (![0, 0.25, 0.5, 0.75, 1].includes(marks)) throw new Error(`Question ${question.questionOrder || question.id} score must be 0, 0.25, 0.5, 0.75, or 1.`);
  const maxMarks = Number(question.totalMarks || 0);
  if (marks > maxMarks) throw new Error(`Question ${question.questionOrder || question.id} score cannot exceed ${maxMarks}.`);
  return {
    questionId: question.id,
    questionLevel: question.questionLevel,
    questionOrder: question.questionOrder,
    outcomeCode: question.outcomeCode,
    outcomeName: outcomes.find((item) => item.outcomeCode === question.outcomeCode)?.outcomeName || "",
    questionText: question.questionText,
    imageName: question.imageName,
    maxMarks,
    marks,
    testedSuboutcomes: questionSuboutcomes(question).map((item) => ({
      suboutcomeCode: item.suboutcomeCode,
      suboutcomeName: item.suboutcomeName,
      description: item.description || ""
    }))
  };
}

function uploadDurationMinutes(value) {
  const duration = Number(normalizedUploadValue(value));
  if (!Number.isInteger(duration) || duration <= 0) throw new Error("Assessment Duration must be a positive whole number of minutes.");
  return duration;
}

function qualitativeOutcomesFromScores(questionScores) {
  return [...groupQuestionsByOutcome(questionScores).entries()].map(([outcomeCode, scores]) => {
    const earned = scores.reduce((sum, item) => sum + Number(item.marks || 0), 0);
    const max = scores.reduce((sum, item) => sum + Number(item.maxMarks || 0), 0);
    const mapped = new Map();
    scores.forEach((score) => (score.testedSuboutcomes || []).forEach((item) => mapped.set(item.suboutcomeCode, item)));
    return {
      outcomeCode,
      outcomeName: outcomes.find((item) => item.outcomeCode === outcomeCode)?.outcomeName || "",
      rating: qualitativeRatingForPercent(max ? (earned / max) * 100 : 0),
      scorePercent: Math.round(max ? (earned / max) * 100 : 0),
      earnedMarks: earned,
      maxMarks: max,
      suboutcomes: [...mapped.values()]
    };
  });
}

function assessmentEntryFromUpload(row, sheetName) {
  if (!hasUploadHeader(row, assessmentTemplateHeaders.level)) throw new Error(`Missing mandatory header: ${assessmentTemplateHeaders.level}.`);
  const level = uploadLevel(requiredUploadValue(row, assessmentTemplateHeaders.level), sheetName);
  const levelQuestionList = questionsForLevel(level);
  if (!levelQuestionList.length) throw new Error(`No questions are configured for Level ${level}.`);
  const mandatoryHeaders = [
    assessmentTemplateHeaders.studentId,
    assessmentTemplateHeaders.date,
    assessmentTemplateHeaders.facilitators,
    assessmentTemplateHeaders.level,
    assessmentTemplateHeaders.comprehension,
    assessmentTemplateHeaders.creativity,
    assessmentTemplateHeaders.concentration,
    assessmentTemplateHeaders.speed,
    assessmentTemplateHeaders.confidence,
    assessmentTemplateHeaders.accuracy,
    assessmentTemplateHeaders.duration,
    ...levelQuestionList.map(templateQuestionHeader)
  ];
  if (level !== 1) mandatoryHeaders.push(assessmentTemplateHeaders.freePlay);
  const missingHeaders = mandatoryHeaders.filter((header) => !hasUploadHeader(row, header));
  if (missingHeaders.length) throw new Error(`Missing mandatory header${missingHeaders.length === 1 ? "" : "s"}: ${missingHeaders.join(", ")}.`);

  const studentIdentifier = requiredUploadValue(row, assessmentTemplateHeaders.studentId);
  const matchingStudents = registeredStudents.filter((student) => normalizedUploadValue(student.studentIdentifier).toLowerCase() === studentIdentifier.toLowerCase());
  if (!matchingStudents.length) throw new Error(`Student ID ${studentIdentifier} is not registered.`);
  if (matchingStudents.length > 1) throw new Error(`Student ID ${studentIdentifier} has duplicate registration records. Run the Student ID deduplication migration first.`);
  const student = matchingStudents[0];
  requiredUploadValue(row, assessmentTemplateHeaders.date);
  const date = uploadAssessmentDate(uploadCell(row, assessmentTemplateHeaders.date));
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) throw new Error("Assessment Date must be a valid date using YYYY-MM-DD format.");
  if (isFutureAssessmentDate(date)) throw new Error("Assessment Date cannot be a future date.");
  const facilitatorText = requiredUploadValue(row, assessmentTemplateHeaders.facilitators);
  const facilitatorNames = facilitatorText.split("|").map((name) => name.trim()).filter(Boolean);
  const validFacilitators = new Set(facilitators
    .filter((facilitator) => toStateList(facilitator.state).includes(student.state) && facilitator.active !== false)
    .map((facilitator) => facilitator.name.toLowerCase()));
  const unknownFacilitators = facilitatorNames.filter((name) => !validFacilitators.has(name.toLowerCase()));
  if (unknownFacilitators.length) throw new Error(`Facilitator(s) not registered for ${student.state}: ${unknownFacilitators.join(", ")}.`);

  const questionScores = levelQuestionList.map((question) => questionScoreFromUpload(question, uploadCell(row, templateQuestionHeader(question))));
  const freePlay = level === 1
    ? "Not applicable"
    : uploadRating(uploadCell(row, assessmentTemplateHeaders.freePlay), "Free Play Assessment", ["Satisfactory", "Needs improvement"]);
  const alterationsText = normalizedUploadValue(uploadCell(row, assessmentTemplateHeaders.alterations));
  let questionAlterations = [];
  if (alterationsText) {
    try {
      questionAlterations = JSON.parse(alterationsText);
      if (!Array.isArray(questionAlterations)) throw new Error();
    } catch (error) {
      throw new Error("Question Alterations JSON must be a valid JSON array.");
    }
  }
  return {
    state: student.state,
    district: student.district || "",
    school: student.school,
    studentId: student.id,
    studentName: student.name,
    date,
    facilitator: facilitatorNames.join(", "),
    assessmentLevel: level,
    questionScores,
    freePlayAssessment: { prompt: "Make a rangoli picture of your choice and describe about it.", rating: freePlay },
    qualitativeOutcomes: qualitativeOutcomesFromScores(questionScores),
    observationDetails: {
      comprehension: uploadRating(uploadCell(row, assessmentTemplateHeaders.comprehension), "Comprehension", ["Low", "Moderate", "High"]),
      creativity: uploadRating(uploadCell(row, assessmentTemplateHeaders.creativity), "Creativity", ["Low", "Moderate", "High"]),
      concentration: uploadRating(uploadCell(row, assessmentTemplateHeaders.concentration), "Concentration", ["Low", "Moderate", "High"]),
      speed: uploadRating(uploadCell(row, assessmentTemplateHeaders.speed), "Speed", ["Low", "Moderate", "High"]),
      confidence: uploadRating(uploadCell(row, assessmentTemplateHeaders.confidence), "Confidence", ["Low", "Moderate", "High"]),
      noticeableGaps: normalizedUploadValue(uploadCell(row, assessmentTemplateHeaders.gaps)),
      suggestedSupport: normalizedUploadValue(uploadCell(row, assessmentTemplateHeaders.support))
    },
    otherObservations: normalizedUploadValue(uploadCell(row, assessmentTemplateHeaders.observations)),
    accuracyScore: uploadRating(uploadCell(row, assessmentTemplateHeaders.accuracy), "Accuracy Score", ["High", "Low"]),
    questionAlterations,
    durationMinutes: uploadDurationMinutes(uploadCell(row, assessmentTemplateHeaders.duration))
  };
}

async function uploadAssessmentEntries(file) {
  if (!file || !requireExcelLibrary()) return;
  if (!dbStore?.isEnabled()) {
    alert("Supabase is not configured.");
    return;
  }
  $("#assessment-entry-status").textContent = "Reading upload...";
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const entries = [];
    const errors = [];
    workbook.SheetNames
      .filter((sheetName) => !["Instructions", "Question Reference"].includes(sheetName))
      .forEach((sheetName) => {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: true })
          .filter((row) => Object.values(row).some((value) => normalizedUploadValue(value)));
        rows.forEach((row, index) => {
          try {
            entries.push(assessmentEntryFromUpload(row, sheetName));
          } catch (error) {
            errors.push(`${sheetName}, row ${index + 2}: ${error.message}`);
          }
        });
      });
    if (!entries.length && !errors.length) throw new Error("No assessment data rows were found in the uploaded file.");
    if (errors.length) {
      const shown = errors.slice(0, 25);
      throw new Error(`Correct ${errors.length} row${errors.length === 1 ? "" : "s"} before uploading:\n${shown.join("\n")}${errors.length > shown.length ? `\n...and ${errors.length - shown.length} more.` : ""}`);
    }
    if (!confirm(`Upload ${entries.length} completed assessment${entries.length === 1 ? "" : "s"} to the database?`)) {
      $("#assessment-entry-status").textContent = "Ready";
      return;
    }
    $("#assessment-entry-status").textContent = "Uploading...";
    for (const entry of entries) await dbStore.saveAssessmentEntry(entry);
    $("#assessment-entry-status").textContent = "Ready";
    alert(`Assessment upload successful. ${entries.length} assessment${entries.length === 1 ? " has" : "s have"} been saved.`);
  } catch (error) {
    $("#assessment-entry-status").textContent = "Upload failed";
    alert(`Could not upload assessments: ${error.message}`);
  }
}

function collectQuestionAlterations() {
  return Array.from(document.querySelectorAll("[data-question-alteration-row]")).map((row) => {
    const outcomeSelect = row.querySelector("[data-alteration-outcome]");
    const questionSelect = row.querySelector("[data-alteration-question]");
    const question = questions.find((item) => item.id === questionSelect.value);
    const outcome = outcomes.find((item) => item.outcomeCode === outcomeSelect.value);
    return {
      outcomeCode: outcomeSelect.value,
      outcomeName: outcome?.outcomeName || "",
      questionId: questionSelect.value,
      questionNumber: String(question?.questionOrder || ""),
      questionText: question?.questionText || questionSelect.selectedOptions[0]?.textContent || "",
      alterationDetails: row.querySelector("[data-alteration-details]").value.trim(),
      reason: row.querySelector("[data-alteration-reason]").value.trim()
    };
  });
}

function renderQuestionAlterationState() {
  const hasRows = Boolean(document.querySelector("[data-question-alteration-row]"));
  $("#question-alterations-empty").classList.toggle("hidden", hasRows);
  $("#question-alterations-table").classList.toggle("hidden", !hasRows);
}

function alterationOutcomeOptions(selected = "") {
  const codes = uniqueSorted(levelQuestions().map((question) => question.outcomeCode));
  return codes.map((code) => {
    const outcome = outcomes.find((item) => item.outcomeCode === code);
    return {
      value: code,
      label: outcome ? `${outcome.outcomeCode} - ${outcome.outcomeName}` : code
    };
  });
}

function renderAlterationQuestionOptions(row, selectedQuestionId = "", legacyQuestionNumber = "") {
  const outcomeCode = row.querySelector("[data-alteration-outcome]").value;
  const available = levelQuestions().filter((question) => question.outcomeCode === outcomeCode);
  const questionSelect = row.querySelector("[data-alteration-question]");
  const matchingLegacyQuestion = available.find((question) => String(question.questionOrder || "") === String(legacyQuestionNumber || ""));
  const selected = available.some((question) => question.id === selectedQuestionId)
    ? selectedQuestionId
    : matchingLegacyQuestion?.id || available[0]?.id || "";
  setOptions(questionSelect, available.length ? available.map((question) => ({
    value: question.id,
    label: `Question ${question.questionOrder || ""} - ${question.questionText}`
  })) : [{ value: "", label: "No questions found for this outcome" }], selected);
}

function addQuestionAlteration(alteration = {}, focus = true) {
  const availableOutcomes = alterationOutcomeOptions();
  const selectedOutcome = availableOutcomes.some((item) => item.value === alteration.outcomeCode)
    ? alteration.outcomeCode
    : availableOutcomes[0]?.value || "";
  const row = document.createElement("tr");
  row.dataset.questionAlterationRow = "";
  row.innerHTML = `
    <td><select data-alteration-outcome aria-label="Outcome for altered question" required></select></td>
    <td><select data-alteration-question aria-label="Altered question" required></select></td>
    <td><textarea data-alteration-details rows="2" aria-label="Details of alteration" required>${escapeHtml(alteration.alterationDetails || "")}</textarea></td>
    <td><textarea data-alteration-reason rows="2" aria-label="Reason for alteration" required>${escapeHtml(alteration.reason || "")}</textarea></td>
    <td><button class="table-button" type="button" data-remove-question-alteration>Remove</button></td>
  `;
  $("#question-alterations-rows").appendChild(row);
  setOptions(row.querySelector("[data-alteration-outcome]"), availableOutcomes.length ? availableOutcomes : [{ value: "", label: "No outcomes found for this level" }], selectedOutcome);
  renderAlterationQuestionOptions(row, alteration.questionId, alteration.questionNumber);
  renderQuestionAlterationState();
  if (focus) row.querySelector("[data-alteration-outcome]").focus();
}

function refreshQuestionAlterationChoices() {
  const alterations = collectQuestionAlterations();
  clearQuestionAlterations();
  alterations.forEach((alteration) => addQuestionAlteration(alteration, false));
}

function clearQuestionAlterations() {
  $("#question-alterations-rows").innerHTML = "";
  renderQuestionAlterationState();
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
    refreshQuestionAlterationChoices();
    return;
  }
  $("#assessment-questions").innerHTML = [...groupQuestionsByOutcome(list).entries()]
    .map(([outcomeCode, outcomeQuestions]) => renderOutcomeSection(outcomeCode, outcomeQuestions))
    .join("");
  updateAllOutcomeRatingDisplays();
  refreshQuestionAlterationChoices();
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
              <th>Max Marks</th>
              <th>Marks</th>
            </tr>
          </thead>
          <tbody>
            ${outcomeQuestions.map(renderQuestionRow).join("")}
          </tbody>
        </table>
      </div>
      <p class="muted">
        Overall rating for this CT outcome:
        <strong id="outcome-rating-${escapeAttr(outcomeCode)}" data-outcome-rating="${escapeAttr(outcomeCode)}">Missing</strong>
        <span id="outcome-rating-percent-${escapeAttr(outcomeCode)}" data-outcome-rating-percent="${escapeAttr(outcomeCode)}">(0%)</span>
      </p>
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
        <select data-question-score="${escapeAttr(question.id)}" data-question-score-outcome="${escapeAttr(question.outcomeCode || "")}" data-question-score-max="${escapeAttr(question.totalMarks || 0)}" aria-label="${escapeAttr(`Marks for question ${question.questionOrder || ""}: ${question.questionText}`)}" required>
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

function outcomeScoreSummary(outcomeCode) {
  const scores = Array.from(document.querySelectorAll(`[data-question-score-outcome="${cssEscape(outcomeCode)}"]`));
  const earned = scores.reduce((sum, select) => sum + Number(select.value || 0), 0);
  const max = scores.reduce((sum, select) => sum + Number(select.dataset.questionScoreMax || 0), 0);
  const percent = max ? Math.round((earned / max) * 100) : 0;
  return {
    earned,
    max,
    percent,
    rating: qualitativeRatingForPercent(percent)
  };
}

function updateOutcomeRatingDisplay(outcomeCode) {
  const rating = document.querySelector(`[data-outcome-rating="${cssEscape(outcomeCode)}"]`);
  const percent = document.querySelector(`[data-outcome-rating-percent="${cssEscape(outcomeCode)}"]`);
  if (!rating || !percent) return;
  const summary = outcomeScoreSummary(outcomeCode);
  rating.textContent = summary.rating;
  percent.textContent = `(${summary.earned}/${summary.max}, ${summary.percent}%)`;
}

function updateAllOutcomeRatingDisplays() {
  document.querySelectorAll("[data-outcome-rating]").forEach((element) => {
    updateOutcomeRatingDisplay(element.dataset.outcomeRating);
  });
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
    observationDetails: collectObservationDetails(),
    otherObservations: $("#assessment-observations").value,
    accuracyScore: $("#assessment-accuracy").value,
    questionAlterations: collectQuestionAlterations(),
    durationMinutes: $("#assessment-duration").value
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
    renderStateOptions(draft.state);
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
  updateAllOutcomeRatingDisplays();
  $("#free-play-assessment").value = draft.freePlayAssessment || "Satisfactory";
  restoreObservationDetails(draft.observationDetails || {});
  $("#assessment-observations").value = draft.otherObservations || "";
  $("#assessment-accuracy").value = draft.accuracyScore || "High";
  $("#assessment-duration").value = draft.durationMinutes || "";
  clearQuestionAlterations();
  (draft.questionAlterations || []).forEach((alteration) => addQuestionAlteration(alteration, false));
  restoringDraft = false;
  $("#assessment-entry-message").textContent = "Restored unsaved assessment draft.";
}

function collectObservationDetails() {
  return {
    comprehension: $("#observation-comprehension").value,
    creativity: $("#observation-creativity").value,
    concentration: $("#observation-concentration").value,
    speed: $("#observation-speed").value,
    confidence: $("#observation-confidence").value,
    noticeableGaps: $("#observation-gaps").value.trim(),
    suggestedSupport: $("#observation-support").value.trim()
  };
}

function restoreObservationDetails(details = {}) {
  $("#observation-comprehension").value = details.comprehension || "";
  $("#observation-creativity").value = details.creativity || "";
  $("#observation-concentration").value = details.concentration || "";
  $("#observation-speed").value = details.speed || "";
  $("#observation-confidence").value = details.confidence || "";
  $("#observation-gaps").value = details.noticeableGaps || "";
  $("#observation-support").value = details.suggestedSupport || "";
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
    `Observation scales: Comprehension ${entry.observationDetails.comprehension || "Not recorded"}; Creativity ${entry.observationDetails.creativity || "Not recorded"}; Concentration ${entry.observationDetails.concentration || "Not recorded"}; Speed ${entry.observationDetails.speed || "Not recorded"}; Confidence ${entry.observationDetails.confidence || "Not recorded"}`,
    `Noticeable gaps: ${entry.observationDetails.noticeableGaps || "None recorded"}`,
    `Suggested support: ${entry.observationDetails.suggestedSupport || "None recorded"}`,
    `Other observations: ${entry.otherObservations || "None recorded"}`,
    `Accuracy score: ${entry.accuracyScore}`,
    `Question alterations: ${entry.questionAlterations.length}`,
    `Assessment duration: ${entry.durationMinutes} minutes`,
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
    observationDetails: collectObservationDetails(),
    otherObservations: $("#assessment-observations").value.trim(),
    accuracyScore: $("#assessment-accuracy").value,
    questionAlterations: collectQuestionAlterations(),
    durationMinutes: Number($("#assessment-duration").value)
  };
}

function previewAssessment() {
  if (!$("#assessment-entry-form").reportValidity()) return;
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
    restoreObservationDetails();
    $("#assessment-observations").value = "";
    $("#assessment-accuracy").value = "High";
    $("#assessment-duration").value = "";
    clearQuestionAlterations();
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
    registeredSchools = data.schools || [];
    facilitators = data.facilitators || [];
    questions = data.questions || [];
    outcomes = data.outcomes || [];
    suboutcomes = data.suboutcomes || [];
    renderStateOptions($("#assessment-state").value);
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
document.querySelectorAll("[data-observation-scale]").forEach((select) => setOptions(select, observationScaleOptions));
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
$("#assessment-questions").addEventListener("change", (event) => {
  if (event.target.matches("[data-question-score]")) {
    updateOutcomeRatingDisplay(event.target.dataset.questionScoreOutcome);
  }
});
$("#add-question-alteration").addEventListener("click", () => addQuestionAlteration());
$("#question-alterations-rows").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-question-alteration]");
  if (!button) return;
  button.closest("[data-question-alteration-row]").remove();
  renderQuestionAlterationState();
  saveDraft();
});
$("#question-alterations-rows").addEventListener("change", (event) => {
  if (!event.target.matches("[data-alteration-outcome]")) return;
  renderAlterationQuestionOptions(event.target.closest("[data-question-alteration-row]"));
});
$("#assessment-entry-form").addEventListener("input", saveDraft);
$("#assessment-entry-form").addEventListener("change", saveDraft);
$("#download-assessment-template").addEventListener("click", downloadAssessmentTemplate);
$("#upload-assessment-template").addEventListener("click", () => $("#assessment-upload-file").click());
$("#assessment-upload-file").addEventListener("change", (event) => {
  uploadAssessmentEntries(event.target.files[0]);
  event.target.value = "";
});
$("#preview-assessment").addEventListener("click", previewAssessment);
$("#assessment-entry-form").addEventListener("submit", saveAssessment);
loadData();
