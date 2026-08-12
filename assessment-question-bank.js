const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
const questionLevels = {
  1: "Level 1",
  2: "Level 2",
  3: "Level 3"
};
const defaultQuestionBankName = "CT Assessment Question Set 2026";
const questionBankAdminPasscode = "*";
const defaultQuestionBankLanguage = "English";
const questionBankLanguages = [
  "English",
  "Hindi",
  "Tamil",
  "Marathi",
  "Kannada",
  "Gujarathi",
  "Telugu",
  "Malayalam",
  "Odiya",
  "Bengali",
  "Assamese"
];
const questionBankLanguageCodes = {
  Hindi: "hi",
  Tamil: "ta",
  Marathi: "mr",
  Kannada: "kn",
  Gujarathi: "gu",
  Telugu: "te",
  Malayalam: "ml",
  Odiya: "or",
  Bengali: "bn",
  Assamese: "as"
};
let questions = [];
let questionBanks = [];
let outcomes = [];
let selectedQuestionBankId = "";
let selectedQuestionBankName = "";
let selectedQuestionBankLanguage = defaultQuestionBankLanguage;
let translationSourceBankId = "";
let isQuestionEntryOpen = false;

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

function confirmQuestionBankAdmin(actionLabel) {
  const passcode = prompt(`Enter admin passcode to ${actionLabel}:`);
  if (passcode === null) return false;
  if (passcode === questionBankAdminPasscode) return true;
  alert("Incorrect passcode. This action is not allowed.");
  return false;
}

function renderQuestions() {
  renderQuestionBankSummary();
  const currentQuestions = selectedQuestions();
  $("#question-count").textContent = selectedQuestionBankName
    ? `${currentQuestions.length} question${currentQuestions.length === 1 ? "" : "s"}`
    : "Select a question bank";
  $("#question-entry-panel").classList.toggle("hidden", !selectedQuestionBankName || !isQuestionEntryOpen);
  $("#question-entry-title").textContent = selectedQuestionBankName ? `${selectedQuestionBankName} - Question entry` : "Question entry";
  $("#question-detail-title").textContent = selectedQuestionBankName ? `${selectedQuestionBankName} - Details` : "Question bank details";
  $("#questions-by-level").innerHTML = selectedQuestionBankName
    ? [1, 2, 3].map((level) => renderLevelTable(level)).join("")
    : '<p class="muted">Enter a question bank name or click an existing question bank to view details.</p>';
}

function selectedQuestions() {
  return questions.filter((question) => question.questionBankId === selectedQuestionBankId);
}

function renderQuestionBankSummary() {
  const banks = questionBankSummaries();
  $("#question-bank-summary").innerHTML = banks.length ? banks.map((bank) => `
    <tr>
      <td><button class="link-button" type="button" data-question-bank-id="${escapeAttr(bank.id)}">${escapeHtml(bank.name)}</button></td>
      <td>${escapeHtml(bank.language)}</td>
      <td>${escapeHtml(bank.count)}</td>
      <td class="action-cell">${renderQuestionBankActions(bank)}</td>
    </tr>
  `).join("") : '<tr><td colspan="4" class="muted">No question banks found. Enter a name above to create one.</td></tr>';
}

function renderQuestionBankActions(bank) {
  if (normalizedQuestionBankLanguage(bank.language) !== defaultQuestionBankLanguage) return '<span class="muted">View only</span>';
  return `
    <button class="table-button" type="button" data-add-question-bank-id="${escapeAttr(bank.id)}">Add Question</button>
    <button class="table-button" type="button" data-translate-question-bank-id="${escapeAttr(bank.id)}">Translate and Save</button>
  `;
}

function questionBankSummaries() {
  const counts = new Map();
  questions.forEach((question) => {
    counts.set(question.questionBankId, (counts.get(question.questionBankId) || 0) + 1);
  });
  return questionBanks
    .map((bank) => ({
      id: bank.id,
      name: bank.name,
      language: bank.language || defaultQuestionBankLanguage,
      count: counts.get(bank.id) || 0
    }))
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

function renderQuestionBankLanguageOptions(selected = defaultQuestionBankLanguage) {
  $("#question-bank-language").innerHTML = questionBankLanguages.map((language) =>
    `<option value="${escapeAttr(language)}"${language === selected ? " selected" : ""}>${escapeHtml(language)}</option>`
  ).join("");
}

function renderTranslationLanguageOptions(bank) {
  const options = untranslatedLanguagesFor(bank);
  $("#question-bank-translation-language").innerHTML = options.length
    ? options.map((language) => `<option value="${escapeAttr(language)}">${escapeHtml(language)}</option>`).join("")
    : '<option value="">All configured languages have been translated</option>';
  $("#translate-question-bank").disabled = !options.length;
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
    questionBankId: selectedQuestionBankId,
    questionBankName: selectedQuestionBankName,
    questionBankLanguage: selectedQuestionBankLanguage,
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
  if (!selectedQuestionBankId) {
    alert("Open or create a question bank before adding questions.");
    return;
  }
  if (!dbStore?.isEnabled()) {
    alert("Supabase is not configured yet.");
    return;
  }
  const question = readQuestionForm();
  if (question.id && !confirmQuestionBankAdmin("update this question")) return;
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
  if (!confirmQuestionBankAdmin("edit this question")) return;
  const question = selectedQuestions().find((item) => item.id === id);
  if (!question) return;
  isQuestionEntryOpen = true;
  renderQuestions();
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
  if (!confirmQuestionBankAdmin("delete this question")) return;
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
    questionBanks = data.questionBanks || [];
    questions = data.questions || [];
    outcomes = data.outcomes || [];
    if (!selectedQuestionBankId) {
      const defaultBank = questionBanks.find((bank) => bank.name === defaultQuestionBankName) || questionBanks[0];
      if (defaultBank) selectQuestionBank(defaultBank);
    } else {
      const selectedBank = questionBanks.find((bank) => bank.id === selectedQuestionBankId);
      if (selectedBank) selectQuestionBank(selectedBank);
    }
    ensureDefaultQuestionBankPlaceholder();
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
  const add = event.target.closest("[data-add-question-bank-id]");
  if (add) {
    const bank = questionBanks.find((item) => item.id === add.dataset.addQuestionBankId);
    if (bank) openQuestionEntry(bank);
    return;
  }
  const translate = event.target.closest("[data-translate-question-bank-id]");
  if (translate) {
    const bank = questionBanks.find((item) => item.id === translate.dataset.translateQuestionBankId);
    if (bank) openTranslationPanel(bank);
    return;
  }
  const button = event.target.closest("[data-question-bank-id]");
  if (!button) return;
  const bank = questionBanks.find((item) => item.id === button.dataset.questionBankId);
  if (bank) openQuestionBank(bank);
});

$("#question-bank-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await openOrCreateQuestionBank();
});

$("#show-question-bank-create").addEventListener("click", openCreateQuestionBankPanel);
$("#close-question-bank-create").addEventListener("click", closeCreateQuestionBankPanel);
$("#close-question-bank-translation").addEventListener("click", closeTranslationPanel);
$("#translate-question-bank").addEventListener("click", translateSelectedQuestionBank);

function openQuestionBank(bank) {
  selectQuestionBank(bank);
  isQuestionEntryOpen = false;
  resetQuestionForm();
  renderQuestions();
}

function openQuestionEntry(bank) {
  selectQuestionBank(bank);
  isQuestionEntryOpen = true;
  resetQuestionForm();
  renderQuestions();
  $("#question-entry-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function openTranslationPanel(bank) {
  closeQuestionEntry();
  const sourceQuestions = questions.filter((question) => question.questionBankId === bank.id);
  if (normalizedQuestionBankLanguage(bank.language) !== defaultQuestionBankLanguage) {
    alert("Translate and Save is available only for English question banks.");
    return;
  }
  if (!sourceQuestions.length) {
    alert("Add questions to this English question bank before translating it.");
    return;
  }
  translationSourceBankId = bank.id;
  $("#question-bank-translation-title").textContent = `Translate ${bank.name}`;
  $("#question-bank-translation-help").textContent = "Select a language that has not yet been created for this question bank.";
  $("#question-bank-translation-status").textContent = "";
  renderTranslationLanguageOptions(bank);
  $("#question-bank-translation-panel").classList.remove("hidden");
  $("#question-bank-translation-language").focus();
}

function closeTranslationPanel() {
  translationSourceBankId = "";
  $("#question-bank-translation-panel").classList.add("hidden");
  $("#question-bank-translation-status").textContent = "";
}

function closeQuestionEntry() {
  isQuestionEntryOpen = false;
  renderQuestions();
}

function selectQuestionBank(bank) {
  selectedQuestionBankId = bank.id || "";
  selectedQuestionBankName = bank.name || defaultQuestionBankName;
  selectedQuestionBankLanguage = normalizedQuestionBankLanguage(bank.language || defaultQuestionBankLanguage);
}

async function openOrCreateQuestionBank() {
  if (!dbStore?.isEnabled()) {
    alert("Supabase is not configured yet.");
    return;
  }
  const name = $("#question-bank-name").value.trim() || defaultQuestionBankName;
  const language = normalizedQuestionBankLanguage($("#question-bank-language").value);
  setStatus("Saving question bank...");
  try {
    const bank = await dbStore.saveAssessmentQuestionBank({ name, language });
    await loadQuestions();
    const savedBank = questionBanks.find((item) => item.id === bank.id) || bank;
    closeCreateQuestionBankPanel();
    openQuestionBank(savedBank);
    showMessage("Question bank saved");
  } catch (error) {
    setStatus("Save failed");
    alert(`Could not save question bank: ${error.message}`);
  }
}

function openCreateQuestionBankPanel() {
  closeTranslationPanel();
  $("#question-bank-name").value = "";
  renderQuestionBankLanguageOptions(defaultQuestionBankLanguage);
  $("#question-bank-create-panel").classList.remove("hidden");
  $("#question-bank-name").focus();
}

function closeCreateQuestionBankPanel() {
  $("#question-bank-create-panel").classList.add("hidden");
}

function questionBankLanguageFor(id) {
  const bank = questionBanks.find((item) => item.id === id);
  return bank?.language || defaultQuestionBankLanguage;
}

function normalizedQuestionBankLanguage(language) {
  return questionBankLanguages.includes(language) ? language : defaultQuestionBankLanguage;
}

function translatedQuestionBankName(sourceName, language) {
  return `${sourceName} - ${language}`;
}

function untranslatedLanguagesFor(bank) {
  const translatedNames = new Set(questionBanks.map((item) => item.name));
  return questionBankLanguages
    .filter((language) => language !== defaultQuestionBankLanguage)
    .filter((language) => !translatedNames.has(translatedQuestionBankName(bank.name, language)));
}

async function translateSelectedQuestionBank() {
  const sourceBank = questionBanks.find((bank) => bank.id === translationSourceBankId);
  const targetLanguage = $("#question-bank-translation-language").value;
  if (!sourceBank || !targetLanguage) return;
  if (!confirm(`Translate and save ${sourceBank.name} to ${targetLanguage}?`)) return;
  const sourceQuestions = questions
    .filter((question) => question.questionBankId === sourceBank.id)
    .sort(compareQuestions);
  if (!sourceQuestions.length) {
    alert("No questions found to translate.");
    return;
  }
  $("#translate-question-bank").disabled = true;
  $("#question-bank-translation-status").textContent = `Translating ${sourceQuestions.length} question${sourceQuestions.length === 1 ? "" : "s"}...`;
  try {
    const targetBank = await dbStore.saveAssessmentQuestionBank({
      name: translatedQuestionBankName(sourceBank.name, targetLanguage),
      language: targetLanguage
    });
    const cache = new Map();
    for (let index = 0; index < sourceQuestions.length; index += 1) {
      const question = sourceQuestions[index];
      $("#question-bank-translation-status").textContent = `Translating question ${index + 1} of ${sourceQuestions.length}...`;
      const [translatedQuestion, translatedAnswer] = await Promise.all([
        translateText(question.questionText, targetLanguage, cache),
        translateText(question.correctAnswer, targetLanguage, cache)
      ]);
      await dbStore.saveAssessmentQuestion({
        questionBankId: targetBank.id,
        questionBankName: targetBank.name,
        questionBankLanguage: targetBank.language,
        questionLevel: question.questionLevel,
        questionOrder: question.questionOrder,
        questionTheme: question.questionTheme || "General",
        outcomeCode: question.outcomeCode,
        questionText: translatedQuestion,
        imageDataUrl: question.imageDataUrl,
        imageName: question.imageName,
        correctAnswer: translatedAnswer,
        totalMarks: question.totalMarks
      });
    }
    await loadQuestions();
    const savedBank = questionBanks.find((bank) => bank.id === targetBank.id) || targetBank;
    openQuestionBank(savedBank);
    closeTranslationPanel();
    showMessage(`Translated question bank saved in ${targetLanguage}`);
  } catch (error) {
    $("#question-bank-translation-status").textContent = "Translation failed";
    $("#translate-question-bank").disabled = false;
    alert(`Could not translate question bank: ${error.message}`);
  }
}

async function translateText(text, targetLanguage, cache) {
  const sourceText = String(text || "").trim();
  if (!sourceText) return "";
  const cacheKey = `${targetLanguage}||${sourceText}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const languageCode = questionBankLanguageCodes[targetLanguage];
  if (!languageCode) throw new Error(`No translation code configured for ${targetLanguage}.`);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(languageCode)}&dt=t&q=${encodeURIComponent(sourceText)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Translation service returned ${response.status}.`);
  const data = await response.json();
  const translated = Array.isArray(data?.[0])
    ? data[0].map((part) => part?.[0] || "").join("")
    : "";
  if (!translated) throw new Error("Translation service returned an empty response.");
  cache.set(cacheKey, translated);
  return translated;
}

function ensureDefaultQuestionBankPlaceholder() {
  if (questionBanks.length) return;
  selectedQuestionBankId = "";
  selectedQuestionBankName = "";
  selectedQuestionBankLanguage = defaultQuestionBankLanguage;
  $("#question-bank-name").value = "";
  renderQuestionBankLanguageOptions(defaultQuestionBankLanguage);
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

renderQuestionBankLanguageOptions();
resetQuestionForm();
loadQuestions();
