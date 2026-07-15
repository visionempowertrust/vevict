const dbStore = window.VictSupabaseStore;
const $ = (selector) => document.querySelector(selector);
let faqs = [];

function setStatus(value) {
  $("#faq-status").textContent = value;
}

function showMessage(value) {
  $("#faq-message").textContent = value;
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => {
    $("#faq-message").textContent = "";
  }, 3500);
}

function renderFaqs() {
  $("#faq-count").textContent = `${faqs.length} FAQ${faqs.length === 1 ? "" : "s"}`;
  $("#faqs-table").innerHTML = faqs.length
    ? faqs.map((faq) => `
      <tr>
        <td>${escapeHtml(faq.displayOrder)}</td>
        <td>${escapeHtml(faq.category || "")}</td>
        <td>${escapeHtml(faq.question)}</td>
        <td>${escapeHtml(faq.answer)}</td>
        <td>${escapeHtml(faq.isActive)}</td>
        <td class="action-cell">
          <button class="table-button" type="button" data-edit-faq="${escapeAttr(faq.id)}">Edit</button>
          <button class="table-button" type="button" data-delete-faq="${escapeAttr(faq.id)}">Delete</button>
        </td>
      </tr>
    `).join("")
    : '<tr><td colspan="6" class="muted">No FAQs added yet.</td></tr>';
}

function resetFaqForm() {
  $("#faq-form").reset();
  $("#faq-id").value = "";
  $("#faq-display-order").value = "0";
  $("#faq-active").value = "Yes";
  $("#save-faq").textContent = "Add FAQ";
}

function readFaqForm() {
  return {
    id: $("#faq-id").value || undefined,
    category: $("#faq-category").value.trim(),
    question: $("#faq-question").value.trim(),
    answer: $("#faq-answer").value.trim(),
    displayOrder: Number($("#faq-display-order").value) || 0,
    isActive: $("#faq-active").value
  };
}

async function saveFaq(event) {
  event.preventDefault();
  if (!dbStore?.isEnabled()) {
    alert("Supabase is not configured yet.");
    return;
  }
  const faq = readFaqForm();
  setStatus("Saving...");
  try {
    await dbStore.saveFaq(faq);
    resetFaqForm();
    await loadFaqs();
    showMessage("FAQ saved");
  } catch (error) {
    setStatus("Save failed");
    alert(`Could not save FAQ: ${error.message}`);
  }
}

function editFaq(id) {
  const faq = faqs.find((item) => item.id === id);
  if (!faq) return;
  $("#faq-id").value = faq.id;
  $("#faq-category").value = faq.category || "";
  $("#faq-question").value = faq.question;
  $("#faq-answer").value = faq.answer;
  $("#faq-display-order").value = String(faq.displayOrder ?? 0);
  $("#faq-active").value = faq.isActive;
  $("#save-faq").textContent = "Update FAQ";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteFaq(id) {
  const faq = faqs.find((item) => item.id === id);
  if (!faq || !confirm(`Delete FAQ: ${faq.question}?`)) return;
  setStatus("Deleting...");
  try {
    await dbStore.deleteFaq(id);
    await loadFaqs();
    showMessage("FAQ deleted");
  } catch (error) {
    setStatus("Delete failed");
    alert(`Could not delete FAQ: ${error.message}`);
  }
}

async function loadFaqs() {
  if (!dbStore?.isEnabled()) {
    setStatus("Supabase not configured");
    return;
  }
  setStatus("Loading...");
  try {
    faqs = await dbStore.loadFaqs();
    renderFaqs();
    setStatus("Ready");
  } catch (error) {
    setStatus("Load failed");
    alert(`Could not load FAQs: ${error.message}`);
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

$("#faq-form").addEventListener("submit", saveFaq);
$("#clear-faq").addEventListener("click", resetFaqForm);
$("#faqs-table").addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-faq]");
  const del = event.target.closest("[data-delete-faq]");
  if (edit) editFaq(edit.dataset.editFaq);
  if (del) deleteFaq(del.dataset.deleteFaq);
});

resetFaqForm();
loadFaqs();
