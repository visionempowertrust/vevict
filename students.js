const dbStore = window.VictSupabaseStore;
const locations = window.INDIA_LOCATIONS || {};
const states = window.INDIA_STATES || Object.keys(locations).sort((a, b) => a.localeCompare(b));
const yesNo = ["Yes", "No"];
const brailleLevels = ["Letters", "Words", "Sentences"];
const $ = (selector) => document.querySelector(selector);
let registeredStudents = [];

function isDbEnabled() {
  return Boolean(dbStore?.isEnabled());
}

function setOptions(select, options, selectedValue = "") {
  select.innerHTML = options.map((option) => {
    const selected = option === selectedValue ? " selected" : "";
    return `<option value="${escapeAttr(option)}"${selected}>${escapeHtml(option)}</option>`;
  }).join("");
}

function renderStateOptions(selectedValue = "") {
  setOptions($("#student-state"), states, selectedValue || states[0] || "");
  renderDistrictOptions();
}

function renderDistrictOptions(selectedValue = "") {
  const state = $("#student-state").value;
  const districts = locations[state] || [];
  setOptions($("#student-district"), districts, selectedValue || districts[0] || "");
}

function renderStaticOptions() {
  setOptions($("#student-grade"), Array.from({ length: 10 }, (_, index) => String(index + 1)));
  [
    "#other-physical-disabilities",
    "#cognitive-disabilities",
    "#is-braille-literate",
    "#knows-taylor-frame",
    "#knows-nemeth",
    "#knows-using-computer",
    "#knows-maths-on-computer"
  ].forEach((selector) => setOptions($(selector), yesNo, "No"));
  setOptions($("#braille-reading-level"), brailleLevels);
  setOptions($("#braille-writing-level"), brailleLevels);
}

async function loadStudents() {
  $("#students-status").textContent = "Loading...";
  if (!isDbEnabled()) {
    $("#students-status").textContent = "Supabase not configured";
    $("#registered-students-table").innerHTML = '<tr><td colspan="10" class="muted">Configure Supabase before registering students.</td></tr>';
    return;
  }
  try {
    registeredStudents = await dbStore.loadRegisteredStudents();
    renderStudentsTable();
    $("#students-status").textContent = "Ready";
  } catch (error) {
    $("#students-status").textContent = "Load failed";
    alert(`Could not load registered students: ${error.message}`);
  }
}

function renderStudentsTable() {
  $("#students-count").textContent = `${registeredStudents.length} student${registeredStudents.length === 1 ? "" : "s"}`;
  if (!registeredStudents.length) {
    $("#registered-students-table").innerHTML = '<tr><td colspan="10" class="muted">No students registered yet.</td></tr>';
    return;
  }
  $("#registered-students-table").innerHTML = registeredStudents.map((student) => `
    <tr>
      <td>${escapeHtml(student.state)}</td>
      <td>${escapeHtml(student.district)}</td>
      <td>${escapeHtml(student.school)}</td>
      <td>${escapeHtml(student.name)}</td>
      <td>${escapeHtml(student.gender)}</td>
      <td>${escapeHtml(student.grade)}</td>
      <td>${escapeHtml(student.visionLevel)}</td>
      <td>${escapeHtml(student.isBrailleLiterate)}; read ${escapeHtml(student.brailleReadingLevel)}; write ${escapeHtml(student.brailleWritingLevel)}</td>
      <td>${escapeHtml(student.knowsUsingComputer)}; maths ${escapeHtml(student.knowsMathsOnComputer)}</td>
      <td class="action-cell">
        <button class="table-button" type="button" data-edit-student="${escapeAttr(student.id)}">Edit</button>
        <button class="table-button" type="button" data-delete-student="${escapeAttr(student.id)}">Delete</button>
      </td>
    </tr>
  `).join("");
}

function collectForm() {
  return {
    id: $("#student-id").value || undefined,
    state: $("#student-state").value,
    district: $("#student-district").value,
    school: $("#student-school").value.trim(),
    name: $("#student-name").value.trim(),
    gender: $("#student-gender").value,
    grade: Number($("#student-grade").value),
    boardOfEducation: $("#board-of-education").value.trim(),
    visionLevel: $("#vision-level").value,
    regionalLanguage: $("#regional-language").value.trim(),
    otherPhysicalDisabilities: $("#other-physical-disabilities").value,
    cognitiveDisabilities: $("#cognitive-disabilities").value,
    isBrailleLiterate: $("#is-braille-literate").value,
    brailleReadingLevel: $("#braille-reading-level").value,
    brailleWritingLevel: $("#braille-writing-level").value,
    knowsTaylorFrame: $("#knows-taylor-frame").value,
    knowsNemeth: $("#knows-nemeth").value,
    knowsUsingComputer: $("#knows-using-computer").value,
    knowsMathsOnComputer: $("#knows-maths-on-computer").value
  };
}

async function saveStudent(event) {
  event.preventDefault();
  if (!isDbEnabled()) {
    alert("Supabase is not configured.");
    return;
  }
  const student = collectForm();
  if (!student.name || !student.school) {
    alert("Student name and school are required.");
    return;
  }
  $("#students-status").textContent = "Saving...";
  try {
    await dbStore.saveRegisteredStudent(student);
    resetForm();
    await loadStudents();
    $("#students-status").textContent = "Saved";
  } catch (error) {
    $("#students-status").textContent = "Save failed";
    alert(`Could not save student: ${error.message}`);
  }
}

function editStudent(studentId) {
  const student = registeredStudents.find((item) => item.id === studentId);
  if (!student) return;
  $("#student-id").value = student.id;
  renderStateOptions(student.state);
  renderDistrictOptions(student.district);
  $("#student-school").value = student.school;
  $("#student-name").value = student.name;
  $("#student-gender").value = student.gender;
  $("#student-grade").value = String(student.grade);
  $("#board-of-education").value = student.boardOfEducation;
  $("#vision-level").value = student.visionLevel;
  $("#regional-language").value = student.regionalLanguage;
  $("#other-physical-disabilities").value = student.otherPhysicalDisabilities;
  $("#cognitive-disabilities").value = student.cognitiveDisabilities;
  $("#is-braille-literate").value = student.isBrailleLiterate;
  $("#braille-reading-level").value = student.brailleReadingLevel;
  $("#braille-writing-level").value = student.brailleWritingLevel;
  $("#knows-taylor-frame").value = student.knowsTaylorFrame;
  $("#knows-nemeth").value = student.knowsNemeth;
  $("#knows-using-computer").value = student.knowsUsingComputer;
  $("#knows-maths-on-computer").value = student.knowsMathsOnComputer;
  $("#save-student").textContent = "Update student";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteStudent(studentId) {
  const student = registeredStudents.find((item) => item.id === studentId);
  if (!student) return;
  if (!confirm(`Delete ${student.name} from registered students?`)) return;
  $("#students-status").textContent = "Deleting...";
  try {
    await dbStore.deleteRegisteredStudent(studentId);
    await loadStudents();
    $("#students-status").textContent = "Deleted";
  } catch (error) {
    $("#students-status").textContent = "Delete failed";
    alert(`Could not delete student: ${error.message}`);
  }
}

function resetForm() {
  $("#student-registration-form").reset();
  $("#student-id").value = "";
  renderStateOptions();
  $("#save-student").textContent = "Add student";
}

function handleTableClick(event) {
  const editButton = event.target.closest("[data-edit-student]");
  const deleteButton = event.target.closest("[data-delete-student]");
  if (editButton) editStudent(editButton.dataset.editStudent);
  if (deleteButton) deleteStudent(deleteButton.dataset.deleteStudent);
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

renderStaticOptions();
renderStateOptions();
$("#student-state").addEventListener("change", () => renderDistrictOptions());
$("#student-registration-form").addEventListener("submit", saveStudent);
$("#reset-student-form").addEventListener("click", resetForm);
$("#registered-students-table").addEventListener("click", handleTableClick);

loadStudents();
