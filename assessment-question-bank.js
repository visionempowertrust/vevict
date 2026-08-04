const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
const questionLevels = {
  1: "1 - Beginners",
  2: "2 - Existing Students",
  3: "3 - Advanced"
};
let questions = [];
let outcomes = [];

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
  $("#question-count").textContent = `${questions.length} question${questions.length === 1 ? "" : "s"}`;
  $("#questions-table").innerHTML = questions.length
    ? questions.map((question) => `
      <tr>
        <td>${escapeHtml(questionLevels[question.questionLevel] || question.questionLevel)}</td>
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
    `).join("")
    : '<tr><td colspan="7" class="muted">No assessment questions added yet.</td></tr>';
}

function renderOutcomeOptions(selected = "") {
  $("#question-outcome").innerHTML = outcomes.length
    ? outcomes.map((outcome) => `<option value="${escapeAttr(outcome.outcomeCode)}"${outcome.outcomeCode === selected ? " selected" : ""}>${escapeHtml(`${outcome.outcomeCode} - ${outcome.outcomeName}`)}</option>`).join("")
    : '<option value="">No CT outcomes found</option>';
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
  renderOutcomeOptions();
  $("#save-question").textContent = "Add question";
  renderImagePreview();
}

function readQuestionForm() {
  return {
    id: $("#question-id").value || undefined,
    questionLevel: Number($("#question-level").value),
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
  if (!dbStore?.isEnabled()) {
    alert("Supabase is not configured yet.");
    return;
  }
  const question = readQuestionForm();
  setStatus("Saving...");
  try {
    await dbStore.saveAssessmentQuestion(question);
    resetQuestionForm();
    await loadQuestions();
    showMessage("Question saved");
  } catch (error) {
    setStatus("Save failed");
    alert(`Could not save question: ${error.message}`);
  }
}

function editQuestion(id) {
  const question = questions.find((item) => item.id === id);
  if (!question) return;
  $("#question-id").value = question.id;
  $("#question-level").value = String(question.questionLevel);
  renderOutcomeOptions(question.outcomeCode || "");
  $("#question-text").value = question.questionText;
  $("#question-image-data").value = question.imageDataUrl || "";
  $("#question-image-name").value = question.imageName || "";
  $("#question-answer").value = question.correctAnswer;
  $("#question-marks").value = String(question.totalMarks);
  $("#save-question").textContent = "Update question";
  renderImagePreview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteQuestion(id) {
  const question = questions.find((item) => item.id === id);
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
$("#questions-table").addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-question]");
  const del = event.target.closest("[data-delete-question]");
  if (edit) editQuestion(edit.dataset.editQuestion);
  if (del) deleteQuestion(del.dataset.deleteQuestion);
});

resetQuestionForm();
loadQuestions();
