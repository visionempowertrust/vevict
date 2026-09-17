const dbStore = window.VictSupabaseStore;
const yesNo = ["Yes", "No"];
const brailleLevels = ["Letters", "Words", "Sentences"];
const optionalYesNo = ["", ...yesNo];
const optionalBrailleLevels = ["", ...brailleLevels];
const $ = (selector) => document.querySelector(selector);
const registrationAdminPasscode = "*";
let schools = [];
let facilitators = [];
let students = [];
let studentsPage = 1;
const studentsPageSize = 100;
const registrationTemplates = {
  schools: {
    label: "schools",
    fileName: "vict-school-registration-template.xlsx",
    headers: ["State", "District", "School name", "Address", "School type"],
    requiredHeaders: ["State", "School name"],
    toItem: (row) => ({
      id: makeId("school"),
      state: cell(row, "State"),
      district: cell(row, "District"),
      name: cell(row, "School name"),
      address: cell(row, "Address"),
      schoolType: cell(row, "School type")
    }),
    save: (item) => dbStore.saveRegistrationSchool(item)
  },
  facilitators: {
    label: "facilitators",
    fileName: "vict-facilitator-registration-template.xlsx",
    headers: ["States", "First name", "Last name", "Email ID", "Phone number", "Alternate phone number", "Designation", "Qualification", "Special Educator", "Educator"],
    requiredHeaders: ["States", "First name", "Last name", "Email ID", "Phone number"],
    toItem: (row) => ({
      id: makeId("facilitator"),
      state: cell(row, "States") || cell(row, "State"),
      firstName: cell(row, "First name"),
      lastName: cell(row, "Last name"),
      email: cell(row, "Email ID"),
      phone: cell(row, "Phone number"),
      alternatePhone: cell(row, "Alternate phone number"),
      designation: cell(row, "Designation"),
      qualification: cell(row, "Qualification"),
      isSpecialEducator: yesNoValue(cell(row, "Special Educator")),
      isEducator: yesNoValue(cell(row, "Educator"))
    }),
    save: (item) => dbStore.saveRegistrationFacilitator(item)
  },
  students: {
    label: "students",
    fileName: "vict-student-registration-template.xlsx",
    headers: ["State", "District", "School", "Student ID", "Name", "Gender", "Grade", "Board Of Education", "Vision level", "Regional Language", "Other Physical Disabilities", "Any Cognitive Disabilities", "Is Braille Literate", "Braille Reading Level", "Braille Writing Level", "Knows Taylor Frame", "Knows Nemeth", "Knows using Computer", "Knows Maths on Computer"],
    requiredHeaders: ["State", "School", "Student ID", "Name", "Grade"],
    toItem: (row) => ({
      id: undefined,
      state: cell(row, "State"),
      district: cell(row, "District"),
      school: cell(row, "School"),
      studentIdentifier: cell(row, "Student ID"),
      name: cell(row, "Name"),
      gender: optionalGenderValue(cell(row, "Gender")),
      grade: gradeValue(cell(row, "Grade")),
      boardOfEducation: cell(row, "Board Of Education"),
      visionLevel: optionalVisionLevelValue(cell(row, "Vision level")),
      regionalLanguage: cell(row, "Regional Language"),
      otherPhysicalDisabilities: optionalYesNoValue(cell(row, "Other Physical Disabilities")),
      cognitiveDisabilities: optionalYesNoValue(cell(row, "Any Cognitive Disabilities")),
      isBrailleLiterate: optionalYesNoValue(cell(row, "Is Braille Literate")),
      brailleReadingLevel: optionalBrailleLevelValue(cell(row, "Braille Reading Level")),
      brailleWritingLevel: optionalBrailleLevelValue(cell(row, "Braille Writing Level")),
      knowsTaylorFrame: optionalYesNoValue(cell(row, "Knows Taylor Frame")),
      knowsNemeth: optionalYesNoValue(cell(row, "Knows Nemeth")),
      knowsUsingComputer: optionalYesNoValue(cell(row, "Knows using Computer")),
      knowsMathsOnComputer: optionalYesNoValue(cell(row, "Knows Maths on Computer"))
    }),
    save: (item) => dbStore.saveRegisteredStudent(item)
  }
};

const registrationCsvExports = {
  schools: {
    fileName: "vict-schools.csv",
    headers: registrationTemplates.schools.headers,
    rows: () => schools.map((school) => [school.state, school.district, school.name, school.address, school.schoolType])
  },
  facilitators: {
    fileName: "vict-facilitators.csv",
    headers: registrationTemplates.facilitators.headers,
    rows: () => facilitators.map((item) => [
      statesText(item.state), item.firstName, item.lastName, item.email, item.phone, item.alternatePhone,
      item.designation, item.qualification, item.isSpecialEducator, item.isEducator
    ])
  },
  students: {
    fileName: "vict-students.csv",
    headers: registrationTemplates.students.headers,
    rows: () => students.map((student) => [
      student.state, student.district, student.school, student.studentIdentifier, student.name, student.gender,
      student.grade, student.boardOfEducation, student.visionLevel, student.regionalLanguage,
      student.otherPhysicalDisabilities, student.cognitiveDisabilities, student.isBrailleLiterate,
      student.brailleReadingLevel, student.brailleWritingLevel, student.knowsTaylorFrame, student.knowsNemeth,
      student.knowsUsingComputer, student.knowsMathsOnComputer
    ])
  }
};

function setOptions(select, options, selected = "") {
  select.innerHTML = options.map((option) => {
    const value = typeof option === "string" ? option : option.value;
    const label = typeof option === "string" ? option : option.label;
    return `<option value="${escapeAttr(value)}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
}

function uniqueSorted(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function setMultiOptions(select, options, selected = []) {
  const selectedValues = new Set(toStateList(selected));
  select.innerHTML = options.map((option) => {
    const value = typeof option === "string" ? option : option.value;
    const label = typeof option === "string" ? option : option.label;
    return `<option value="${escapeAttr(value)}"${selectedValues.has(value) ? " selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
}

function setStatus(value) { $("#registration-status").textContent = value; }
function showMessage(value, timeout = 3500) {
  $("#registration-message").textContent = value;
  clearTimeout(showMessage.timer);
  if (timeout > 0) {
    showMessage.timer = setTimeout(() => { $("#registration-message").textContent = ""; }, timeout);
  }
}
function makeId(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

function cell(row, header) {
  return String(row[header] ?? "").trim();
}

function hasHeader(row, header) {
  if (header === "States") return "States" in row || "State" in row;
  return header in row;
}

function toStateList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function selectedStateList(selector) {
  return Array.from($(selector).selectedOptions).map((option) => option.value).filter(Boolean);
}

function statesText(value) {
  return toStateList(value).join(", ");
}

function confirmSuccess(message) {
  showMessage(message, 10000);
  alert(message);
}

function confirmRegistrationAdmin(actionLabel) {
  const passcode = prompt(`Enter admin passcode to ${actionLabel}:`);
  if (passcode === null) return false;
  if (passcode === registrationAdminPasscode) return true;
  alert("Incorrect passcode. This action is not allowed.");
  return false;
}

function yesNoValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(normalized)) return "Yes";
  if (["no", "n", "false", "0", ""].includes(normalized)) return "No";
  throw new Error(`Expected Yes or No. Received "${value}".`);
}

function optionalYesNoValue(value) {
  if (isBlankMarker(value)) return "";
  return yesNoValue(value);
}

function optionalBrailleLevelValue(value) {
  if (isBlankMarker(value)) return "";
  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, " ");
  if (["zero", "level 0", "level zero", "0"].includes(normalized)) return "";
  if (["letter", "letters", "level 1", "level one", "1"].includes(normalized)) return "Letters";
  if (["word", "words", "level 2", "level two", "2"].includes(normalized)) return "Words";
  if (["sentence", "sentences", "level 3", "level three", "3"].includes(normalized)) return "Sentences";
  throw new Error(`Braille level must be Letters, Words, Sentences, or blank. Received "${value}".`);
}

function optionalGenderValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (isBlankMarker(value)) return "";
  if (["male", "m", "boy"].includes(normalized)) return "Male";
  if (["female", "f", "girl"].includes(normalized)) return "Female";
  throw new Error(`Gender must be Male, Female, M, F, or blank. Received "${value}".`);
}

function optionalVisionLevelValue(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (isBlankMarker(value)) return "";
  if (["completely blind", "complete blind", "blind", "totally blind", "total blind"].includes(normalized)) return "Completely blind";
  if (["low vision", "lowvision", "partially sighted", "partial sight"].includes(normalized)) return "Low Vision";
  throw new Error(`Vision level must be Completely blind, Low Vision, or blank. Received "${value}".`);
}

function isBlankMarker(value) {
  return ["", "n/a", "na", "not applicable", "not available", "nil", "none", "-"].includes(String(value || "").trim().toLowerCase());
}

function gradeValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const match = normalized.match(/^(?:grade\s*)?(1[0-2]|[0-9])$/);
  if (match) return Number(match[1]);
  throw new Error(`Grade must be a number from 0 to 12. Received "${value}".`);
}

function validateRegistrationItem(type, item) {
  const requiredFields = {
    schools: [["State", item.state], ["School name", item.name]],
    facilitators: [["States", item.state], ["First name", item.firstName], ["Last name", item.lastName], ["Email ID", item.email], ["Phone number", item.phone]],
    students: [["State", item.state], ["School", item.school], ["Student ID", item.studentIdentifier], ["Name", item.name], ["Grade", item.grade]]
  };
  const missing = (requiredFields[type] || []).filter(([, value]) => value === "" || value === null || value === undefined || Number.isNaN(value)).map(([label]) => label);
  if (missing.length) throw new Error(`Required field${missing.length === 1 ? "" : "s"} missing: ${missing.join(", ")}.`);
  return item;
}

function normalizedStudentIdentifier(value) {
  return String(value || "").trim().toLowerCase();
}

function isDuplicateStudentIdentifierError(error) {
  return error?.code === "23505" || /student_identifier.*unique|duplicate key/i.test(String(error?.message || ""));
}

function downloadRegistrationTemplate(type) {
  const template = registrationTemplates[type];
  if (!template) return;
  if (!window.XLSX) {
    alert("Excel download library could not be loaded. Please check the internet connection and reload the page.");
    return;
  }
  const worksheet = XLSX.utils.aoa_to_sheet([template.headers]);
  worksheet["!cols"] = template.headers.map((header) => ({ wch: Math.max(14, header.length + 2) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Registration");
  XLSX.writeFile(workbook, template.fileName, { bookType: "xlsx" });
}

function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadRegistrationCsv(type) {
  const exportConfig = registrationCsvExports[type];
  if (!exportConfig) return;
  const rows = exportConfig.rows();
  if (!rows.length) {
    alert(`No ${type} data is available to download.`);
    return;
  }
  const csv = [exportConfig.headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = exportConfig.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function uploadRegistrationTemplate(type, file) {
  const template = registrationTemplates[type];
  if (!template || !file) return;
  if (["schools", "students"].includes(type) && !confirmRegistrationAdmin(`upload ${template.label}`)) return;
  if (!dbStore?.isEnabled()) {
    alert("Supabase is not configured.");
    return;
  }
  if (!window.XLSX) {
    alert("Excel upload library could not be loaded. Please check the internet connection and reload the page.");
    return;
  }
  setStatus("Reading upload...");
  try {
    const fileBuffer = await file.arrayBuffer();
    const fileStart = new TextDecoder().decode(fileBuffer.slice(0, 4096));
    if (/<html[\s>]/i.test(fileStart) && /_files[\\/]sheet\d+\.htm/i.test(fileStart)) {
      throw new Error("This .xls file is an Excel Web Page whose data is stored in a separate companion folder. Open it in Excel and use Save As > Excel Workbook (.xlsx), then upload the saved .xlsx file.");
    }
    const workbook = XLSX.read(fileBuffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }).filter((row) =>
      template.headers.some((header) => cell(row, header))
    );
    if (!rows.length) {
      alert("No data rows found in the uploaded file.");
      setStatus("Ready");
      return;
    }
    const missingHeaders = template.requiredHeaders.filter((header) => !hasHeader(rows[0], header));
    if (missingHeaders.length) {
      alert(`The uploaded file is missing these headers: ${missingHeaders.join(", ")}`);
      setStatus("Ready");
      return;
    }
    if (!confirm(`Upload ${rows.length} ${template.label} row${rows.length === 1 ? "" : "s"} into the database?`)) {
      setStatus("Ready");
      return;
    }
    const items = [];
    const validationErrors = [];
    const duplicateStudentIds = new Set();
    const knownStudentIds = type === "students"
      ? new Set(students.map((student) => normalizedStudentIdentifier(student.studentIdentifier)).filter(Boolean))
      : new Set();
    rows.forEach((row, index) => {
      const uploadedStudentId = type === "students" ? cell(row, "Student ID") : "";
      const normalizedUploadedId = normalizedStudentIdentifier(uploadedStudentId);
      if (normalizedUploadedId && knownStudentIds.has(normalizedUploadedId)) {
        duplicateStudentIds.add(uploadedStudentId);
        console.warn(`Skipped duplicate Student ID during upload: ${uploadedStudentId}`);
        return;
      }
      try {
        const item = validateRegistrationItem(type, template.toItem(row));
        items.push(item);
        if (type === "students") knownStudentIds.add(normalizedStudentIdentifier(item.studentIdentifier));
      } catch (error) {
        const studentName = type === "students" ? cell(row, "Name") : "";
        const rowLabel = studentName ? ` (Student: ${studentName})` : "";
        validationErrors.push(`Row ${index + 2}${rowLabel}: ${error.message}`);
      }
    });
    if (validationErrors.length) {
      const displayedErrors = validationErrors.slice(0, 20);
      const remaining = validationErrors.length - displayedErrors.length;
      throw new Error(`Please correct ${validationErrors.length} row${validationErrors.length === 1 ? "" : "s"} before uploading:\n${displayedErrors.join("\n")}${remaining ? `\n...and ${remaining} more.` : ""}`);
    }
    setStatus("Uploading...");
    let savedCount = 0;
    for (const [index, item] of items.entries()) {
      try {
        await template.save(item);
        savedCount += 1;
      } catch (error) {
        if (type === "students" && isDuplicateStudentIdentifierError(error)) {
          duplicateStudentIds.add(item.studentIdentifier);
          console.warn(`Skipped duplicate Student ID reported by the database: ${item.studentIdentifier}`);
          continue;
        }
        const studentName = type === "students" ? item.name : "";
        const rowLabel = studentName ? ` (Student: ${studentName})` : "";
        throw new Error(`Row ${index + 2}${rowLabel}: ${error.message}`);
      }
    }
    await loadAll();
    const duplicateSummary = duplicateStudentIds.size
      ? `\n\nSkipped ${duplicateStudentIds.size} duplicate Student ID${duplicateStudentIds.size === 1 ? "" : "s"} already present in the system or repeated in the file:\n${[...duplicateStudentIds].join(", ")}`
      : "";
    const successMessage = `Upload complete. ${savedCount} ${template.label} row${savedCount === 1 ? " has" : "s have"} been saved to the database.${duplicateSummary}`;
    showMessage(successMessage, 10000);
    alert(successMessage);
    setStatus("Ready");
  } catch (error) {
    setStatus("Upload failed");
    alert(`Could not upload ${template.label}: ${error.message}`);
  }
}

function renderView() {
  const type = $("#registration-type").value;
  ["schools", "facilitators", "students"].forEach((name) => {
    $(`#${name}-registration`).classList.toggle("hidden", name !== type);
  });
  history.replaceState(null, "", `#${type}`);
}

function renderStateSelect(selector, selected = "") {
  const states = uniqueSorted(students.map((student) => student.state));
  setOptions($(selector), states.length ? states : [{ value: "", label: "No student states found" }],
    selected && states.includes(selected) ? selected : states[0] || "");
}

function renderStateMultiSelect(selector, selected = []) {
  const states = uniqueSorted(students.map((student) => student.state));
  setMultiOptions($(selector), states, selected);
}

function renderDistrictSelect(stateSelector, districtSelector, selected = "") {
  const state = $(stateSelector).value;
  const districts = uniqueSorted(students.filter((student) => student.state === state).map((student) => student.district));
  setOptions($(districtSelector), districts.length ? districts : [{ value: "", label: "No student districts found" }],
    selected && districts.includes(selected) ? selected : districts[0] || "");
}

function renderStudentSchools(selected = "") {
  const state = $("#student-state").value;
  const district = $("#student-district").value;
  const available = uniqueSorted(students
    .filter((student) => student.state === state && student.district === district)
    .map((student) => student.school));
  setOptions($("#student-school"), available.length
    ? available
    : [{ value: "", label: "No student schools found" }], selected && available.includes(selected) ? selected : available[0] || "");
}

function uniqueValues(items, field) {
  return [...new Set(items.map((item) => String(item[field] || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function refreshListingFilters() {
  const schoolState = $("#schools-filter-state").value;
  const schoolName = $("#schools-filter-school").value;
  setOptions($("#schools-filter-state"), [{ value: "", label: "All states" }, ...uniqueValues(schools, "state")], schoolState);
  const schoolsInState = schoolState ? schools.filter((school) => school.state === schoolState) : schools;
  setOptions($("#schools-filter-school"), [{ value: "", label: "All schools" }, ...uniqueValues(schoolsInState, "name")], schoolName);

  const studentState = $("#students-filter-state").value;
  const studentSchool = $("#students-filter-school").value;
  setOptions($("#students-filter-state"), [{ value: "", label: "All states" }, ...uniqueValues(students, "state")], studentState);
  const studentsInState = studentState ? students.filter((student) => student.state === studentState) : students;
  setOptions($("#students-filter-school"), [{ value: "", label: "All schools" }, ...uniqueValues(studentsInState, "school")], studentSchool);
}

function filteredSchools() {
  const state = $("#schools-filter-state").value;
  const schoolName = $("#schools-filter-school").value;
  return schools.filter((school) => (!state || school.state === state) && (!schoolName || school.name === schoolName));
}

function filteredStudents() {
  const state = $("#students-filter-state").value;
  const school = $("#students-filter-school").value;
  return students.filter((student) => (!state || student.state === state) && (!school || student.school === school));
}

function renderSchools() {
  const visibleSchools = filteredSchools();
  $("#schools-count").textContent = visibleSchools.length === schools.length
    ? `${schools.length} school${schools.length === 1 ? "" : "s"}`
    : `${visibleSchools.length} of ${schools.length} schools`;
  $("#schools-table").innerHTML = visibleSchools.length ? visibleSchools.map((school) => `
    <tr><td>${escapeHtml(school.state)}</td><td>${escapeHtml(school.district)}</td><td>${escapeHtml(school.name)}</td>
    <td>${escapeHtml(school.address || "")}</td><td>${escapeHtml(school.schoolType)}</td><td class="action-cell">
    <button class="table-button" type="button" data-edit-school="${escapeAttr(school.id)}">Edit</button>
    <button class="table-button" type="button" data-delete-school="${escapeAttr(school.id)}">Delete</button></td></tr>`).join("")
    : `<tr><td colspan="6" class="muted">${schools.length ? "No schools match the selected filters." : "No schools registered yet."}</td></tr>`;
  renderStudentSchools();
}

function renderFacilitators() {
  $("#facilitators-count").textContent = `${facilitators.length} facilitator${facilitators.length === 1 ? "" : "s"}`;
  $("#facilitators-table").innerHTML = facilitators.length ? facilitators.map((item) => `
    <tr><td>${escapeHtml(statesText(item.state))}</td><td>${escapeHtml(`${item.firstName} ${item.lastName}`)}</td>
    <td>${escapeHtml(item.email)}<br>${escapeHtml(item.phone)}${item.alternatePhone ? `<br>${escapeHtml(item.alternatePhone)}` : ""}</td>
    <td>${escapeHtml(item.designation || "")}</td><td>${escapeHtml(item.qualification || "")}</td>
    <td>Special Educator: ${escapeHtml(item.isSpecialEducator)}<br>Educator: ${escapeHtml(item.isEducator)}</td><td class="action-cell">
    <button class="table-button" type="button" data-edit-facilitator="${escapeAttr(item.id)}">Edit</button>
    <button class="table-button" type="button" data-delete-facilitator="${escapeAttr(item.id)}">Delete</button></td></tr>`).join("")
    : '<tr><td colspan="7" class="muted">No facilitators registered yet.</td></tr>';
}

function renderStudents() {
  const visibleStudents = filteredStudents();
  const totalPages = Math.max(1, Math.ceil(visibleStudents.length / studentsPageSize));
  studentsPage = Math.min(Math.max(1, studentsPage), totalPages);
  const start = (studentsPage - 1) * studentsPageSize;
  const pageStudents = visibleStudents.slice(start, start + studentsPageSize);
  const rangeText = visibleStudents.length
    ? `${start + 1}-${start + pageStudents.length} of ${visibleStudents.length}`
    : "0 of 0";
  $("#students-count").textContent = visibleStudents.length === students.length
    ? `${students.length} student${students.length === 1 ? "" : "s"}`
    : `${visibleStudents.length} of ${students.length} students`;
  $("#students-page-status").textContent = `Page ${studentsPage} of ${totalPages} (${rangeText})`;
  $("#students-prev-page").disabled = studentsPage <= 1;
  $("#students-next-page").disabled = studentsPage >= totalPages;
  $("#students-table").innerHTML = pageStudents.length ? pageStudents.map((student) => `
    <tr><td>${escapeHtml(student.state)}</td><td>${escapeHtml(student.district)}</td><td>${escapeHtml(student.school)}</td>
    <td>${escapeHtml(student.studentIdentifier)}</td>
    <td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.gender)}</td><td>${escapeHtml(student.grade)}</td>
    <td>${escapeHtml(student.visionLevel)}</td><td>${escapeHtml(student.isBrailleLiterate)}; read ${escapeHtml(student.brailleReadingLevel)}; write ${escapeHtml(student.brailleWritingLevel)}</td>
    <td>${escapeHtml(student.knowsUsingComputer)}; maths ${escapeHtml(student.knowsMathsOnComputer)}</td><td class="action-cell">
    <button class="table-button" type="button" data-edit-student="${escapeAttr(student.id)}">Edit</button>
    <button class="table-button" type="button" data-delete-student="${escapeAttr(student.id)}">Delete</button></td></tr>`).join("")
    : `<tr><td colspan="11" class="muted">${students.length ? "No students match the selected filters." : "No students registered yet."}</td></tr>`;
}

function resetSchool() {
  $("#school-form").reset(); $("#school-id").value = ""; renderStateSelect("#school-state"); renderDistrictSelect("#school-state", "#school-district"); $("#save-school").textContent = "Add school";
}
function resetFacilitator() {
  $("#facilitator-form").reset(); $("#facilitator-id").value = ""; renderStateMultiSelect("#facilitator-state"); $("#save-facilitator").textContent = "Add facilitator";
}
function resetStudent() {
  $("#student-registration-form").reset(); $("#student-id").value = ""; renderStateSelect("#student-state"); renderDistrictSelect("#student-state", "#student-district"); renderStudentSchools(); $("#save-student").textContent = "Add student";
}

async function saveSchool(event) {
  event.preventDefault();
  if (!$("#school-id").value && !confirmRegistrationAdmin("add a school")) return;
  const item = { id: $("#school-id").value || makeId("school"), state: $("#school-state").value, district: $("#school-district").value,
    name: $("#school-name").value.trim(), address: $("#school-address").value.trim(), schoolType: $("#school-type").value };
  setStatus("Saving...");
  try { await dbStore.saveRegistrationSchool(item); resetSchool(); await loadAll(); confirmSuccess("School saved successfully."); }
  catch (error) { setStatus("Save failed"); alert(`Could not save school: ${error.message}`); }
}

async function saveFacilitator(event) {
  event.preventDefault();
  const item = { id: $("#facilitator-id").value || makeId("facilitator"), state: selectedStateList("#facilitator-state").join(", "),
    firstName: $("#facilitator-first-name").value.trim(), lastName: $("#facilitator-last-name").value.trim(), email: $("#facilitator-email").value.trim(),
    phone: $("#facilitator-phone").value.trim(), alternatePhone: $("#facilitator-alternate-phone").value.trim(), designation: $("#facilitator-designation").value.trim(),
    qualification: $("#facilitator-qualification").value.trim(), isSpecialEducator: $("#facilitator-special-educator").value, isEducator: $("#facilitator-educator").value };
  setStatus("Saving...");
  try { await dbStore.saveRegistrationFacilitator(item); resetFacilitator(); await loadAll(); confirmSuccess("Facilitator saved successfully."); }
  catch (error) { setStatus("Save failed"); alert(`Could not save facilitator: ${error.message}`); }
}

async function saveStudent(event) {
  event.preventDefault();
  if (!$("#student-id").value && !confirmRegistrationAdmin("add a student")) return;
  const item = { id: $("#student-id").value || undefined, state: $("#student-state").value, district: $("#student-district").value, school: $("#student-school").value,
    studentIdentifier: $("#student-identifier").value.trim(), name: $("#student-name").value.trim(), gender: $("#student-gender").value, grade: Number($("#student-grade").value), boardOfEducation: $("#board-of-education").value.trim(),
    visionLevel: $("#vision-level").value, regionalLanguage: $("#regional-language").value.trim(), otherPhysicalDisabilities: $("#other-physical-disabilities").value,
    cognitiveDisabilities: $("#cognitive-disabilities").value, isBrailleLiterate: $("#is-braille-literate").value, brailleReadingLevel: $("#braille-reading-level").value,
    brailleWritingLevel: $("#braille-writing-level").value, knowsTaylorFrame: $("#knows-taylor-frame").value, knowsNemeth: $("#knows-nemeth").value,
    knowsUsingComputer: $("#knows-using-computer").value, knowsMathsOnComputer: $("#knows-maths-on-computer").value };
  const duplicate = students.find((student) => student.id !== item.id
    && normalizedStudentIdentifier(student.studentIdentifier) === normalizedStudentIdentifier(item.studentIdentifier));
  if (duplicate) {
    alert(`Student ID ${item.studentIdentifier} is already registered for ${duplicate.name}. Use a unique Student ID.`);
    $("#student-identifier").focus();
    return;
  }
  setStatus("Saving...");
  try { await dbStore.saveRegisteredStudent(item); resetStudent(); await loadAll(); confirmSuccess("Student saved successfully."); }
  catch (error) {
    setStatus("Save failed");
    if (isDuplicateStudentIdentifierError(error)) {
      alert(`Student ID ${item.studentIdentifier} is already registered. Use a unique Student ID.`);
      $("#student-identifier").focus();
      return;
    }
    alert(`Could not save student: ${error.message}`);
  }
}

function editSchool(id) {
  const item = schools.find((school) => school.id === id); if (!item) return; $("#school-id").value = item.id; renderStateSelect("#school-state", item.state);
  renderDistrictSelect("#school-state", "#school-district", item.district); $("#school-name").value = item.name; $("#school-address").value = item.address;
  $("#school-type").value = item.schoolType; $("#save-school").textContent = "Update school"; window.scrollTo({ top: 0, behavior: "smooth" });
}
function editFacilitator(id) {
  const item = facilitators.find((entry) => entry.id === id); if (!item) return; $("#facilitator-id").value = item.id; renderStateMultiSelect("#facilitator-state", item.state);
  $("#facilitator-first-name").value = item.firstName; $("#facilitator-last-name").value = item.lastName; $("#facilitator-email").value = item.email;
  $("#facilitator-phone").value = item.phone; $("#facilitator-alternate-phone").value = item.alternatePhone; $("#facilitator-designation").value = item.designation;
  $("#facilitator-qualification").value = item.qualification; $("#facilitator-special-educator").value = item.isSpecialEducator; $("#facilitator-educator").value = item.isEducator;
  $("#save-facilitator").textContent = "Update facilitator"; window.scrollTo({ top: 0, behavior: "smooth" });
}
function editStudent(id) {
  const item = students.find((student) => student.id === id); if (!item) return; $("#student-id").value = item.id; renderStateSelect("#student-state", item.state);
  renderDistrictSelect("#student-state", "#student-district", item.district); renderStudentSchools(item.school); $("#student-identifier").value = item.studentIdentifier; $("#student-name").value = item.name; $("#student-gender").value = item.gender;
  $("#student-grade").value = String(item.grade); $("#board-of-education").value = item.boardOfEducation; $("#vision-level").value = item.visionLevel; $("#regional-language").value = item.regionalLanguage;
  $("#other-physical-disabilities").value = item.otherPhysicalDisabilities; $("#cognitive-disabilities").value = item.cognitiveDisabilities; $("#is-braille-literate").value = item.isBrailleLiterate;
  $("#braille-reading-level").value = item.brailleReadingLevel; $("#braille-writing-level").value = item.brailleWritingLevel; $("#knows-taylor-frame").value = item.knowsTaylorFrame;
  $("#knows-nemeth").value = item.knowsNemeth; $("#knows-using-computer").value = item.knowsUsingComputer; $("#knows-maths-on-computer").value = item.knowsMathsOnComputer;
  $("#save-student").textContent = "Update student"; window.scrollTo({ top: 0, behavior: "smooth" });
}

async function remove(kind, id, label) {
  if (["school", "student"].includes(kind) && !confirmRegistrationAdmin(`delete this ${label}`)) return;
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
    studentsPage = Math.min(studentsPage, Math.max(1, Math.ceil(students.length / studentsPageSize)));
    renderStateSelect("#school-state"); renderDistrictSelect("#school-state", "#school-district");
    renderStateMultiSelect("#facilitator-state"); renderStateSelect("#student-state");
    renderDistrictSelect("#student-state", "#student-district");
    refreshListingFilters(); renderSchools(); renderFacilitators(); renderStudents(); setStatus("Ready");
  } catch (error) { setStatus("Load failed"); alert(`Could not load registrations: ${error.message}`); }
}

function changeStudentsPage(delta) {
  const totalPages = Math.max(1, Math.ceil(filteredStudents().length / studentsPageSize));
  studentsPage = Math.min(Math.max(1, studentsPage + delta), totalPages);
  renderStudents();
}

function escapeHtml(value) { return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function escapeAttr(value) { return escapeHtml(value).replace(/\n/g, " "); }

renderStateSelect("#school-state"); renderDistrictSelect("#school-state", "#school-district"); renderStateMultiSelect("#facilitator-state");
renderStateSelect("#student-state"); renderDistrictSelect("#student-state", "#student-district");
setOptions($("#student-grade"), Array.from({ length: 13 }, (_, index) => String(index)));
["#other-physical-disabilities", "#cognitive-disabilities", "#is-braille-literate", "#knows-taylor-frame", "#knows-nemeth", "#knows-using-computer", "#knows-maths-on-computer"].forEach((selector) => setOptions($(selector), optionalYesNo));
setOptions($("#braille-reading-level"), optionalBrailleLevels); setOptions($("#braille-writing-level"), optionalBrailleLevels);
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
$("#students-prev-page").addEventListener("click", () => changeStudentsPage(-1));
$("#students-next-page").addEventListener("click", () => changeStudentsPage(1));
$("#schools-filter-state").addEventListener("change", () => { $("#schools-filter-school").value = ""; refreshListingFilters(); renderSchools(); });
$("#schools-filter-school").addEventListener("change", renderSchools);
$("#clear-schools-filters").addEventListener("click", () => { $("#schools-filter-state").value = ""; $("#schools-filter-school").value = ""; refreshListingFilters(); renderSchools(); });
$("#students-filter-state").addEventListener("change", () => { $("#students-filter-school").value = ""; studentsPage = 1; refreshListingFilters(); renderStudents(); });
$("#students-filter-school").addEventListener("change", () => { studentsPage = 1; renderStudents(); });
$("#clear-students-filters").addEventListener("click", () => { $("#students-filter-state").value = ""; $("#students-filter-school").value = ""; studentsPage = 1; refreshListingFilters(); renderStudents(); });
document.addEventListener("click", (event) => {
  const download = event.target.closest("[data-download-template]");
  const csvDownload = event.target.closest("[data-download-csv]");
  const upload = event.target.closest("[data-upload-template]");
  if (download) downloadRegistrationTemplate(download.dataset.downloadTemplate);
  if (csvDownload) downloadRegistrationCsv(csvDownload.dataset.downloadCsv);
  if (upload) $(`#${upload.dataset.uploadTemplate}-upload`)?.click();
});
document.addEventListener("change", (event) => {
  const input = event.target.closest("[data-upload-input]");
  if (!input) return;
  uploadRegistrationTemplate(input.dataset.uploadInput, input.files[0]);
  input.value = "";
});
loadAll();
