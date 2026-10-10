(function () {
  const storageKey = "vict-e2e-database";
  const seed = {
    schools: [{
      id: "school-e2e",
      state: "Karnataka",
      district: "Bengaluru Urban",
      name: "VICT Test School",
      address: "Test address",
      schoolType: "Special School"
    }],
    facilitators: [],
    students: [],
    assessments: []
  };
  const questions = [{
    id: "question-e2e-1",
    questionBankId: "bank-e2e-english",
    questionBankName: "CT Assessment Question Set 2026",
    questionBankLanguage: "English",
    questionLevel: 1,
    questionOrder: 1,
    outcomeCode: "CT1",
    questionText: "Identify the repeating pattern.",
    totalMarks: 1,
    imageName: "",
    imageDataUrl: "",
    testedSuboutcomeCodes: ["CT1.1"]
  }];
  const questionBanks = [
    { id: "bank-e2e-english", name: "CT Assessment Question Set 2026", language: "English" },
    { id: "bank-e2e-hindi", name: "CT Assessment Question Set 2026 - Hindi", language: "Hindi" }
  ];
  const outcomes = [{ outcomeCode: "CT1", outcomeName: "Pattern recognition" }];
  const suboutcomes = [{
    outcomeCode: "CT1",
    suboutcomeCode: "CT1.1",
    suboutcomeName: "Recognises patterns",
    description: "Recognises a repeating pattern"
  }];

  function read() {
    const value = localStorage.getItem(storageKey);
    if (value) return JSON.parse(value);
    localStorage.setItem(storageKey, JSON.stringify(seed));
    return JSON.parse(JSON.stringify(seed));
  }
  function write(data) {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }
  function upsert(list, item) {
    const index = list.findIndex((current) => current.id === item.id);
    if (index >= 0) list[index] = item;
    else list.push(item);
  }

  window.VictSupabaseStore = {
    isEnabled: () => true,
    async loadRegistrationsData() {
      const data = read();
      return { schools: data.schools, facilitators: data.facilitators, students: data.students };
    },
    async saveRegistrationSchool(item) {
      const data = read(); upsert(data.schools, item); write(data);
    },
    async saveRegistrationFacilitator(item) {
      const data = read();
      upsert(data.facilitators, { ...item, name: `${item.firstName} ${item.lastName}`.trim(), active: true });
      write(data);
    },
    async saveRegisteredStudent(item) {
      const data = read();
      upsert(data.students, { ...item, id: item.id || "student-e2e-1" });
      write(data);
    },
    async deleteRegistrationSchool(id) {
      const data = read(); data.schools = data.schools.filter((item) => item.id !== id); write(data);
    },
    async deleteRegistrationFacilitator(id) {
      const data = read(); data.facilitators = data.facilitators.filter((item) => item.id !== id); write(data);
    },
    async deleteRegisteredStudent(id) {
      const data = read(); data.students = data.students.filter((item) => item.id !== id); write(data);
    },
    async loadAssessmentEntryData() {
      const data = read();
      return {
        registeredStudents: data.students,
        schools: data.schools,
        facilitators: data.facilitators,
        questions,
        outcomes,
        suboutcomes,
        rubric: []
      };
    },
    async saveAssessmentEntry(entry) {
      const data = read();
      if (entry.id) upsert(data.assessments, entry);
      else data.assessments.push({ ...entry, id: `assessment-e2e-${data.assessments.length + 1}` });
      write(data);
    },
    async loadAssessmentEntry(id) {
      return read().assessments.find((entry) => entry.id === id) || null;
    },
    async loadAssessmentDashboardData() {
      return read().assessments;
    },
    async loadRegisteredStudents() {
      return read().students;
    },
    async loadAssessmentQuestionBankData() {
      return { questionBanks, questions, outcomes, suboutcomes };
    }
  };
})();
