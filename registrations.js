const dbStore = window.VictSupabaseStore;
const locations = window.INDIA_LOCATIONS || {};
const states = window.INDIA_STATES || Object.keys(locations).sort((a, b) => a.localeCompare(b));
const yesNo = ["Yes", "No"];
const brailleLevels = ["Letters", "Words", "Sentences"];
const $ = (selector) => document.querySelector(selector);
let schools = [];
let facilitators = [];
let students = [];

function setOptions(select, options, selected = "") {
  select.innerHTML = options.map((option) => {
    const value = typeof option === "string" ? option : option.value;
    const label = typeof option === "string" ? option : option.label;
    return `<option value="${escapeAttr(value)}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
}

function setStatus(value) { $("#registration-status").textContent = value; }
function showMessage(value) {
  $("#registration-message").textContent = value;
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => { $("#registration-message").textContent = ""; }, 3500);
}
function makeId(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

function renderView() {
  const type = $("#registration-type").value;
  ["schools", "facilitators", "students"].forEach((name) => {
    $(`#${name}-registration`).classList.toggle("hidden", name !== type);
  });
  history.replaceState(null, "", `#${type}`);
}

function renderStateSelect(selector, selected = "") {
  setOptions($(selector), states, selected || states[0] || "");
}

function renderDistrictSelect(stateSelector, districtSelector, selected = "") {
  const districts = locations[$(stateSelector).value] || [];
  setOptions($(districtSelector), districts, selected || districts[0] || "");
}

function renderStudentSchools(selected = "") {
  const state = $("#student-state").value;
  const district = $("#student-district").value;
  const available = schools.filter((school) => school.state === state && school.district === district);
  if (selected && !available.some((school) => school.name === selected)) available.push({ name: selected });
  setOptions($("#student-school"), available.length
    ? available.map((school) => ({ value: school.name, label: school.name }))
    : [{ value: "", label: "Register a school first" }], selected);
}

function renderSchools() {
  $("#schools-count").textContent = `${schools.length} school${schools.length === 1 ? "" : "s"}`;
  $("#schools-table").innerHTML = schools.length ? schools.map((school) => `
    <tr><td>${escapeHtml(school.state)}</td><td>${escapeHtml(school.district)}</td><td>${escapeHtml(school.name)}</td>
    <td>${escapeHtml(school.address || "")}</td><td>${escapeHtml(school.schoolType)}</td><td class="action-cell">
    <button class="table-button" type="button" data-edit-school="${escapeAttr(school.id)}">Edit</button>
    <button class="table-button" type="button" data-delete-school="${escapeAttr(school.id)}">Delete</button></td></tr>`).join("")
    : '<tr><td colspan="6" class="muted">No schools registered yet.</td></tr>';
  renderStudentSchools();
}

function renderFacilitators() {
  $("#facilitators-count").textContent = `${facilitators.length} facilitator${facilitators.length === 1 ? "" : "s"}`;
  $("#facilitators-table").innerHTML = facilitators.length ? facilitators.map((item) => `
    <tr><td>${escapeHtml(item.state)}</td><td>${escapeHtml(`${item.firstName} ${item.lastName}`)}</td>
    <td>${escapeHtml(item.email)}<br>${escapeHtml(item.phone)}${item.alternatePhone ? `<br>${escapeHtml(item.alternatePhone)}` : ""}</td>
    <td>${escapeHtml(item.designation || "")}</td><td>${escapeHtml(item.qualification || "")}</td>
    <td>Special Educator: ${escapeHtml(item.isSpecialEducator)}<br>Educator: ${escapeHtml(item.isEducator)}</td><td class="action-cell">
    <button class="table-button" type="button" data-edit-facilitator="${escapeAttr(item.id)}">Edit</button>
    <button class="table-button" type="button" data-delete-facilitator="${escapeAttr(item.id)}">Delete</button></td></tr>`).join("")
    : '<tr><td colspan="7" class="muted">No facilitators registered yet.</td></tr>';
}

function renderStudents() {
  $("#students-count").textContent = `${students.length} student${students.length === 1 ? "" : "s"}`;
  $("#students-table").innerHTML = students.length ? students.map((student) => `
    <tr><td>${escapeHtml(student.state)}</td><td>${escapeHtml(student.district)}</td><td>${escapeHtml(student.school)}</td>
    <td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.gender)}</td><td>${escapeHtml(student.grade)}</td>
    <td>${escapeHtml(student.visionLevel)}</td><td>${escapeHtml(student.isBrailleLiterate)}; read ${escapeHtml(student.brailleReadingLevel)}; write ${escapeHtml(student.brailleWritingLevel)}</td>
    <td>${escapeHtml(student.knowsUsingComputer)}; maths ${escapeHtml(student.knowsMathsOnComputer)}</td><td class="action-cell">
    <button class="table-button" type="button" data-edit-student="${escapeAttr(student.id)}">Edit</button>
    <button class="table-button" type="button" data-delete-student="${escapeAttr(student.id)}">Delete</button></td></tr>`).join("")
    : '<tr><td colspan="10" class="muted">No students registered yet.</td></tr>';
}

function resetSchool() {
  $("#school-form").reset(); $("#school-id").value = ""; renderStateSelect("#school-state"); renderDistrictSelect("#school-state", "#school-district"); $("#save-school").textContent = "Add school";
}
function resetFacilitator() {
  $("#facilitator-form").reset(); $("#facilitator-id").value = ""; renderStateSelect("#facilitator-state"); $("#save-facilitator").textContent = "Add facilitator";
}
function resetStudent() {
  $("#student-registration-form").reset(); $("#student-id").value = ""; renderStateSelect("#student-state"); renderDistrictSelect("#student-state", "#student-district"); renderStudentSchools(); $("#save-student").textContent = "Add student";
}

async function saveSchool(event) {
  event.preventDefault();
  const item = { id: $("#school-id").value || makeId("school"), state: $("#school-state").value, district: $("#school-district").value,
    name: $("#school-name").value.trim(), address: $("#school-address").value.trim(), schoolType: $("#school-type").value };
  setStatus("Saving...");
  try { await dbStore.saveRegistrationSchool(item); resetSchool(); await loadAll(); showMessage("School saved"); }
  catch (error) { setStatus("Save failed"); alert(`Could not save school: ${error.message}`); }
}

async function saveFacilitator(event) {
  event.preventDefault();
  const item = { id: $("#facilitator-id").value || makeId("facilitator"), state: $("#facilitator-state").value,
    firstName: $("#facilitator-first-name").value.trim(), lastName: $("#facilitator-last-name").value.trim(), email: $("#facilitator-email").value.trim(),
    phone: $("#facilitator-phone").value.trim(), alternatePhone: $("#facilitator-alternate-phone").value.trim(), designation: $("#facilitator-designation").value.trim(),
    qualification: $("#facilitator-qualification").value.trim(), isSpecialEducator: $("#facilitator-special-educator").value, isEducator: $("#facilitator-educator").value };
  setStatus("Saving...");
  try { await dbStore.saveRegistrationFacilitator(item); resetFacilitator(); await loadAll(); showMessage("Facilitator saved"); }
  catch (error) { setStatus("Save failed"); alert(`Could not save facilitator: ${error.message}`); }
}

async function saveStudent(event) {
  event.preventDefault();
  const item = { id: $("#student-id").value || undefined, state: $("#student-state").value, district: $("#student-district").value, school: $("#student-school").value,
    name: $("#student-name").value.trim(), gender: $("#student-gender").value, grade: Number($("#student-grade").value), boardOfEducation: $("#board-of-education").value.trim(),
    visionLevel: $("#vision-level").value, regionalLanguage: $("#regional-language").value.trim(), otherPhysicalDisabilities: $("#other-physical-disabilities").value,
    cognitiveDisabilities: $("#cognitive-disabilities").value, isBrailleLiterate: $("#is-braille-literate").value, brailleReadingLevel: $("#braille-reading-level").value,
    brailleWritingLevel: $("#braille-writing-level").value, knowsTaylorFrame: $("#knows-taylor-frame").value, knowsNemeth: $("#knows-nemeth").value,
    knowsUsingComputer: $("#knows-using-computer").value, knowsMathsOnComputer: $("#knows-maths-on-computer").value };
  setStatus("Saving...");
  try { await dbStore.saveRegisteredStudent(item); resetStudent(); await loadAll(); showMessage("Student saved"); }
  catch (error) { setStatus("Save failed"); alert(`Could not save student: ${error.message}`); }
}

function editSchool(id) {
  const item = schools.find((school) => school.id === id); if (!item) return; $("#school-id").value = item.id; renderStateSelect("#school-state", item.state);
  renderDistrictSelect("#school-state", "#school-district", item.district); $("#school-name").value = item.name; $("#school-address").value = item.address;
  $("#school-type").value = item.schoolType; $("#save-school").textContent = "Update school"; window.scrollTo({ top: 0, behavior: "smooth" });
}
function editFacilitator(id) {
  const item = facilitators.find((entry) => entry.id === id); if (!item) return; $("#facilitator-id").value = item.id; renderStateSelect("#facilitator-state", item.state);
  $("#facilitator-first-name").value = item.firstName; $("#facilitator-last-name").value = item.lastName; $("#facilitator-email").value = item.email;
  $("#facilitator-phone").value = item.phone; $("#facilitator-alternate-phone").value = item.alternatePhone; $("#facilitator-designation").value = item.designation;
  $("#facilitator-qualification").value = item.qualification; $("#facilitator-special-educator").value = item.isSpecialEducator; $("#facilitator-educator").value = item.isEducator;
  $("#save-facilitator").textContent = "Update facilitator"; window.scrollTo({ top: 0, behavior: "smooth" });
}
function editStudent(id) {
  const item = students.find((student) => student.id === id); if (!item) return; $("#student-id").value = item.id; renderStateSelect("#student-state", item.state);
  renderDistrictSelect("#student-state", "#student-district", item.district); renderStudentSchools(item.school); $("#student-name").value = item.name; $("#student-gender").value = item.gender;
  $("#student-grade").value = String(item.grade); $("#board-of-education").value = item.boardOfEducation; $("#vision-level").value = item.visionLevel; $("#regional-language").value = item.regionalLanguage;
  $("#other-physical-disabilities").value = item.otherPhysicalDisabilities; $("#cognitive-disabilities").value = item.cognitiveDisabilities; $("#is-braille-literate").value = item.isBrailleLiterate;
  $("#braille-reading-level").value = item.brailleReadingLevel; $("#braille-writing-level").value = item.brailleWritingLevel; $("#knows-taylor-frame").value = item.knowsTaylorFrame;
  $("#knows-nemeth").value = item.knowsNemeth; $("#knows-using-computer").value = item.knowsUsingComputer; $("#knows-maths-on-computer").value = item.knowsMathsOnComputer;
  $("#save-student").textContent = "Update student"; window.scrollTo({ top: 0, behavior: "smooth" });
}

async function remove(kind, id, label) {
  if (!confirm(`Delete ${label}?`)) return;
  setStatus("Deleting...");
  try {
    if (kind === "school") await dbStore.deleteRegistrationSchool(id);
    if (kind === "facilitator") await dbStore.deleteRegistrationFacilitator(id);
    if (kind === "student") await dbStore.deleteRegisteredStudent(id);
    await loadAll(); showMessage(`${label} deleted`);
  } catch (error) { setStatus("Delete failed"); alert(`Could not delete ${label}: ${error.message}`); }
}

async function loadAll() {
  if (!dbStore?.isEnabled()) { setStatus("Supabase not configured"); return; }
  setStatus("Loading...");
  try {
    const data = await dbStore.loadRegistrationsData(); schools = data.schools; facilitators = data.facilitators; students = data.students;
    renderSchools(); renderFacilitators(); renderStudents(); setStatus("Ready");
  } catch (error) { setStatus("Load failed"); alert(`Could not load registrations: ${error.message}`); }
}

function escapeHtml(value) { return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function escapeAttr(value) { return escapeHtml(value).replace(/\n/g, " "); }

renderStateSelect("#school-state"); renderDistrictSelect("#school-state", "#school-district"); renderStateSelect("#facilitator-state");
renderStateSelect("#student-state"); renderDistrictSelect("#student-state", "#student-district");
setOptions($("#student-grade"), Array.from({ length: 10 }, (_, index) => String(index + 1)));
["#other-physical-disabilities", "#cognitive-disabilities", "#is-braille-literate", "#knows-taylor-frame", "#knows-nemeth", "#knows-using-computer", "#knows-maths-on-computer"].forEach((selector) => setOptions($(selector), yesNo, "No"));
setOptions($("#braille-reading-level"), brailleLevels); setOptions($("#braille-writing-level"), brailleLevels);
const initialType = ["schools", "facilitators", "students"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "schools";
$("#registration-type").value = initialType; renderView();
$("#registration-type").addEventListener("change", renderView); $("#school-state").addEventListener("change", () => renderDistrictSelect("#school-state", "#school-district"));
$("#student-state").addEventListener("change", () => { renderDistrictSelect("#student-state", "#student-district"); renderStudentSchools(); });
$("#student-district").addEventListener("change", () => renderStudentSchools());
$("#school-form").addEventListener("submit", saveSchool); $("#facilitator-form").addEventListener("submit", saveFacilitator); $("#student-registration-form").addEventListener("submit", saveStudent);
$("#clear-school").addEventListener("click", resetSchool); $("#clear-facilitator").addEventListener("click", resetFacilitator); $("#clear-student").addEventListener("click", resetStudent);
$("#schools-table").addEventListener("click", (event) => { const edit = event.target.closest("[data-edit-school]"); const del = event.target.closest("[data-delete-school]"); if (edit) editSchool(edit.dataset.editSchool); if (del) remove("school", del.dataset.deleteSchool, "school"); });
$("#facilitators-table").addEventListener("click", (event) => { const edit = event.target.closest("[data-edit-facilitator]"); const del = event.target.closest("[data-delete-facilitator]"); if (edit) editFacilitator(edit.dataset.editFacilitator); if (del) remove("facilitator", del.dataset.deleteFacilitator, "facilitator"); });
$("#students-table").addEventListener("click", (event) => { const edit = event.target.closest("[data-edit-student]"); const del = event.target.closest("[data-delete-student]"); if (edit) editStudent(edit.dataset.editStudent); if (del) remove("student", del.dataset.deleteStudent, "student"); });
loadAll();
