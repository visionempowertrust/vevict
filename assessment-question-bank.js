const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
const questionLevels = {
  1: "1",
  2: "2",
  3: "3"
};
const defaultQuestionBankName = "CT Assessment Question Set 2026";
let questions = [];
let outcomes = [];
let selectedQuestionBankName = "";

function setStatus(value) {
  $("#question-status").textContent = value;
}

function showMessage(value) {
  $("#question-message").textContent = value;
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => {
    $("#question-message").textContent = "";
  }, 3500);
}

function renderQuestions() {
  renderQuestionBankSummary();
  const currentQuestions = selectedQuestions();
  $("#question-count").textContent = selectedQuestionBankName
    ? `${currentQuestions.length} question${currentQuestions.length === 1 ? "" : "s"}`
    : "Select a question bank";
  $("#question-entry-panel").classList.toggle("hidden", !selectedQuestionBankName);
  $("#question-bank-status").textContent = selectedQuestionBankName ? `Selected: ${selectedQuestionBankName}` : "No question bank selected";
  $("#question-entry-title").textContent = selectedQuestionBankName ? `${selectedQuestionBankName} - Question entry` : "Question entry";
  $("#question-detail-title").textContent = selectedQuestionBankName ? `${selectedQuestionBankName} - Details` : "Question bank details";
  $("#questions-by-level").innerHTML = selectedQuestionBankName
    ? [1, 2, 3].map((level) => renderLevelTable(level)).join("")
    : '<p class="muted">Enter a question bank name or click an existing question bank to view details.</p>';
}

function selectedQuestions() {
  return questions.filter((question) => question.questionBankName === selectedQuestionBankName);
}

function renderQuestionBankSummary() {
  const banks = questionBankSummaries();
  $("#question-bank-summary").innerHTML = banks.length ? banks.map((bank) => `
    <tr>
      <td><button class="link-button" type="button" data-question-bank="${escapeAttr(bank.name)}">${escapeHtml(bank.name)}</button></td>
      <td>${escapeHtml(bank.count)}</td>
    </tr>
  `).join("") : '<tr><td colspan="2" class="muted">No question banks found. Enter a name above to create one.</td></tr>';
}

function questionBankSummaries() {
  const counts = new Map();
  questions.forEach((question) => {
    const name = question.questionBankName || defaultQuestionBankName;
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  if (!counts.has(defaultQuestionBankName)) counts.set(defaultQuestionBankName, 0);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function renderLevelTable(level) {
  const levelQuestions = selectedQuestions()
    .filter((question) => Number(question.questionLevel) === level)
    .sort(compareQuestions);
  const grouped = groupQuestionsByOutcome(levelQuestions);
  return `
    <section class="question-bank-level">
      <div class="section-heading compact">
        <h2>${escapeHtml(questionLevels[level])}</h2>
        <span class="muted">${levelQuestions.length} question${levelQuestions.length === 1 ? "" : "s"}</span>
      </div>
      <div class="table-wrap">
        <table class="data-table question-bank-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Primary Outcome</th>
              <th>Question</th>
              <th>Picture</th>
              <th>Correct Answer</th>
              <th>Total Marks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${levelQuestions.length ? [...grouped.entries()].map(([outcomeCode, rows]) => renderOutcomeGroup(outcomeCode, rows)).join("") : '<tr><td colspan="7" class="muted">No assessment questions added for this level.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderOutcomeGroup(outcomeCode, rows) {
  return `
    <tr class="group-row"><td colspan="7">${escapeHtml(outcomeLabel(outcomeCode))}</td></tr>
    ${rows.map((question) => `
      <tr>
        <td>${escapeHtml(question.questionOrder)}</td>
        <td>${escapeHtml(outcomeLabel(question.outcomeCode))}</td>
        <td>${escapeHtml(question.questionText)}</td>
        <td>${renderImageCell(question)}</td>
        <td>${escapeHtml(question.correctAnswer)}</td>
        <td>${escapeHtml(question.totalMarks)}</td>
        <td class="action-cell">
          <button class="table-button" type="button" data-edit-question="${escapeAttr(question.id)}">Edit</button>
          <button class="table-button" type="button" data-delete-question="${escapeAttr(question.id)}">Delete</button>
        </td>
      </tr>
    `).join("")}
  `;
}

function compareQuestions(a, b) {
  return Number(a.questionOrder || 0) - Number(b.questionOrder || 0) ||
    String(a.outcomeCode || "").localeCompare(String(b.outcomeCode || "")) ||
    String(a.questionText || "").localeCompare(String(b.questionText || ""));
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

function renderOutcomeOptions(selected = "") {
  $("#question-outcome").innerHTML = outcomes.length
    ? outcomes.map((outcome) => `<option value="${escapeAttr(outcome.outcomeCode)}"${outcome.outcomeCode === selected ? " selected" : ""}>${escapeHtml(outcome.outcomeName)}</option>`).join("")
    : '<option value="">No CT outcomes found</option>';
  updateOutcomeQuestionCount();
}

function outcomeLabel(outcomeCode) {
  const outcome = outcomes.find((item) => item.outcomeCode === outcomeCode);
  return outcome ? `${outcome.outcomeCode} - ${outcome.outcomeName}` : outcomeCode || "";
}

function renderImageCell(question) {
  if (!question.imageDataUrl) return '<span class="muted">No image</span>';
  return `<img class="question-bank-thumb" src="${escapeAttr(question.imageDataUrl)}" alt="${escapeAttr(question.imageName || "Question image")}">`;
}

function resetQuestionForm() {
  $("#question-form").reset();
  $("#question-id").value = "";
  $("#question-image-data").value = "";
  $("#question-image-name").value = "";
  $("#question-level").value = "1";
  $("#question-marks").value = "1";
  renderOutcomeOptions();
  $("#question-order").value = nextQuestionOrder();
  $("#save-question").textContent = "Add question";
  renderImagePreview();
  updateOutcomeQuestionCount();
}

function readQuestionForm() {
  return {
    id: $("#question-id").value || undefined,
    questionBankName: selectedQuestionBankName,
    questionLevel: Number($("#question-level").value),
    questionOrder: Number($("#question-order").value),
    questionTheme: "General",
    outcomeCode: $("#question-outcome").value,
    questionText: $("#question-text").value.trim(),
    imageDataUrl: $("#question-image-data").value,
    imageName: $("#question-image-name").value,
    correctAnswer: $("#question-answer").value.trim(),
    totalMarks: Number($("#question-marks").value)
  };
}

function renderImagePreview() {
  const dataUrl = $("#question-image-data").value;
  const imageName = $("#question-image-name").value;
  $("#question-image-label").textContent = imageName || "No image selected.";
  $("#question-image-preview").classList.toggle("hidden", !dataUrl);
  $("#remove-question-image").classList.toggle("hidden", !dataUrl);
  if (dataUrl) $("#question-image-preview").src = dataUrl;
  else $("#question-image-preview").removeAttribute("src");
}

function setQuestionImage(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    $("#question-image").value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    $("#question-image-data").value = reader.result;
    $("#question-image-name").value = file.name;
    renderImagePreview();
  };
  reader.onerror = () => alert("Could not read the selected image.");
  reader.readAsDataURL(file);
}

async function saveQuestion(event) {
  event.preventDefault();
  if (!selectedQuestionBankName) {
    alert("Enter or select a question bank first.");
    return;
  }
  if (!dbStore?.isEnabled()) {
    alert("Supabase is not configured yet.");
    return;
  }
  const question = readQuestionForm();
  setStatus("Saving...");
  try {
    await dbStore.saveAssessmentQuestion(question);
    await loadQuestions();
    resetQuestionForm();
    showMessage("Question saved");
  } catch (error) {
    setStatus("Save failed");
    alert(`Could not save question: ${error.message}`);
  }
}

function editQuestion(id) {
  const question = selectedQuestions().find((item) => item.id === id);
  if (!question) return;
  $("#question-id").value = question.id;
  $("#question-level").value = String(question.questionLevel);
  $("#question-order").value = String(question.questionOrder || 1);
  renderOutcomeOptions(question.outcomeCode || "");
  $("#question-text").value = question.questionText;
  $("#question-image-data").value = question.imageDataUrl || "";
  $("#question-image-name").value = question.imageName || "";
  $("#question-answer").value = question.correctAnswer;
  $("#question-marks").value = String(question.totalMarks);
  $("#save-question").textContent = "Update question";
  renderImagePreview();
  updateOutcomeQuestionCount();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteQuestion(id) {
  const question = selectedQuestions().find((item) => item.id === id);
  if (!question || !confirm("Delete this assessment question?")) return;
  setStatus("Deleting...");
  try {
    await dbStore.deleteAssessmentQuestion(id);
    await loadQuestions();
    showMessage("Question deleted");
  } catch (error) {
    setStatus("Delete failed");
    alert(`Could not delete question: ${error.message}`);
  }
}

async function loadQuestions() {
  if (!dbStore?.isEnabled()) {
    setStatus("Supabase not configured");
    return;
  }
  setStatus("Loading...");
  try {
    const data = await dbStore.loadAssessmentQuestionBankData();
    questions = data.questions || [];
    outcomes = data.outcomes || [];
    if (!selectedQuestionBankName && questions.some((question) => question.questionBankName === defaultQuestionBankName)) {
      selectedQuestionBankName = defaultQuestionBankName;
      $("#question-bank-name").value = defaultQuestionBankName;
    }
    renderOutcomeOptions();
    renderQuestions();
    setStatus("Ready");
  } catch (error) {
    setStatus("Load failed");
    alert(`Could not load questions: ${error.message}`);
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

$("#question-form").addEventListener("submit", saveQuestion);
$("#clear-question").addEventListener("click", resetQuestionForm);
$("#question-image").addEventListener("change", (event) => setQuestionImage(event.target.files[0]));
$("#remove-question-image").addEventListener("click", () => {
  $("#question-image").value = "";
  $("#question-image-data").value = "";
  $("#question-image-name").value = "";
  renderImagePreview();
});
$("#questions-by-level").addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-question]");
  const del = event.target.closest("[data-delete-question]");
  if (edit) editQuestion(edit.dataset.editQuestion);
  if (del) deleteQuestion(del.dataset.deleteQuestion);
});

$("#question-bank-summary").addEventListener("click", (event) => {
  const button = event.target.closest("[data-question-bank]");
  if (!button) return;
  openQuestionBank(button.dataset.questionBank);
});

$("#question-bank-form").addEventListener("submit", (event) => {
  event.preventDefault();
  openQuestionBank($("#question-bank-name").value.trim());
});

function openQuestionBank(name) {
  selectedQuestionBankName = name || defaultQuestionBankName;
  $("#question-bank-name").value = selectedQuestionBankName;
  resetQuestionForm();
  renderQuestions();
}

$("#question-level").addEventListener("change", () => {
  if (!$("#question-id").value) $("#question-order").value = nextQuestionOrder();
  updateOutcomeQuestionCount();
});
$("#question-outcome").addEventListener("change", () => {
  if (!$("#question-id").value) $("#question-order").value = nextQuestionOrder();
  updateOutcomeQuestionCount();
});

function nextQuestionOrder() {
  const level = Number($("#question-level")?.value || 1);
  const outcomeCode = $("#question-outcome")?.value || "";
  const orders = selectedQuestions()
    .filter((question) => Number(question.questionLevel) === level && question.outcomeCode === outcomeCode)
    .map((question) => Number(question.questionOrder || 0));
  return String((orders.length ? Math.max(...orders) : 0) + 1);
}

function updateOutcomeQuestionCount() {
  const countEl = $("#question-outcome-count");
  if (!countEl) return;
  const level = Number($("#question-level")?.value || 1);
  const outcomeCode = $("#question-outcome")?.value || "";
  const count = selectedQuestions()
    .filter((question) => Number(question.questionLevel) === level && question.outcomeCode === outcomeCode)
    .length;
  const outcome = outcomes.find((item) => item.outcomeCode === outcomeCode);
  const outcomeText = outcome?.outcomeName ? ` for ${outcome.outcomeName}` : "";
  countEl.textContent = `${count} question${count === 1 ? "" : "s"} already added in ${questionLevels[level] || `Level ${level}`}${outcomeText}.`;
}

resetQuestionForm();
loadQuestions();
