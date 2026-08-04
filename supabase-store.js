(function () {
  const config = window.VICT_SUPABASE_CONFIG || {};
  const isConfigured = Boolean(
    config.enabled &&
    config.url &&
    config.anonKey &&
    !config.url.includes("YOUR-PROJECT-REF") &&
    !config.anonKey.includes("YOUR-SUPABASE-ANON-KEY") &&
    window.supabase
  );

  const client = isConfigured ? window.supabase.createClient(config.url, config.anonKey) : null;

  function isEnabled() {
    return Boolean(client);
  }

  async function loadState() {
    if (!client) return null;
    const [{ data: students, error: studentsError }, { data: sessions, error: sessionsError }] = await Promise.all([
      client.from("students").select("*").order("name", { ascending: true }),
      client.from("sessions").select("*").order("session_date", { ascending: false })
    ]);

    if (studentsError || sessionsError) {
      throw studentsError || sessionsError;
    }

    const sessionsByStudent = new Map();
    (sessions || []).forEach((row) => {
      const session = fromSessionRow(row);
      if (!sessionsByStudent.has(row.student_id)) sessionsByStudent.set(row.student_id, []);
      sessionsByStudent.get(row.student_id).push(session);
    });

    return {
      students: (students || []).map((row) => ({
        id: row.id,
        name: row.name,
        school: row.school || "",
        level: row.level || "",
        accessNotes: row.access_notes || "",
        sessions: sessionsByStudent.get(row.id) || []
      }))
    };
  }

  async function saveStudent(student) {
    if (!client) return;
    const { error } = await client.from("students").upsert(toStudentRow(student));
    if (error) throw error;
  }

  async function saveSession(studentId, session) {
    if (!client) return;
    const { error } = await client.from("sessions").upsert(toSessionRow(studentId, session));
    if (error) throw error;
  }

  async function replaceStudentSessions(student) {
    if (!client) return;
    await saveStudent(student);
    const { error: deleteError } = await client.from("sessions").delete().eq("student_id", student.id);
    if (deleteError) throw deleteError;
    const rows = (student.sessions || []).map((session) => toSessionRow(student.id, session));
    if (!rows.length) return;
    const { error: insertError } = await client.from("sessions").upsert(rows);
    if (insertError) throw insertError;
  }

  async function saveAll(state) {
    if (!client) return;
    for (const student of state.students || []) {
      await replaceStudentSessions(student);
    }
  }

  async function loadSkillsData() {
    if (!client) return null;
    const [{ data: skills, error: skillsError }, { data: levels, error: levelsError }] = await Promise.all([
      client.from("skills").select("*").order("skill_name", { ascending: true }),
      client.from("skill_levels").select("*").order("skill_code", { ascending: true })
    ]);

    if (skillsError || levelsError) {
      throw skillsError || levelsError;
    }

    return {
      skills: (skills || []).map(fromSkillRow),
      levels: (levels || []).map(fromSkillLevelRow)
    };
  }

  async function saveSkill(skill) {
    if (!client) return;
    const { error } = await client.from("skills").upsert(toSkillRow(skill));
    if (error) throw error;
  }

  async function deleteSkill(skillCode) {
    if (!client) return;
    const { error } = await client.from("skills").delete().eq("skill_code", skillCode);
    if (error) throw error;
  }

  async function saveSkillLevel(level) {
    if (!client) return;
    const { error } = await client.from("skill_levels").upsert(toSkillLevelRow(level));
    if (error) throw error;
  }

  async function deleteSkillLevel(levelId) {
    if (!client) return;
    const { error } = await client.from("skill_levels").delete().eq("id", levelId);
    if (error) throw error;
  }

  async function saveSkillsData(data) {
    if (!client) return;
    const { error: skillsError } = await client.from("skills").upsert((data.skills || []).map(toSkillRow));
    if (skillsError) throw skillsError;
    const { error: levelsError } = await client.from("skill_levels").upsert((data.levels || []).map(toSkillLevelRow));
    if (levelsError) throw levelsError;
  }

  async function loadGamesData() {
    if (!client) return null;
    const [{ data: games, error: gamesError }, { data: outcomes, error: outcomesError }] = await Promise.all([
      client.from("games").select("*").order("game_code", { ascending: true }),
      client.from("ct_outcomes").select("*").order("outcome_code", { ascending: true })
    ]);

    if (gamesError || outcomesError) {
      throw gamesError || outcomesError;
    }

    return {
      games: (games || []).map(fromGameRow),
      outcomes: (outcomes || []).map(fromCtOutcomeRow)
    };
  }

  async function loadOutcomesData() {
    if (!client) return null;
    const [{ data: outcomes, error: outcomesError }, { data: suboutcomes, error: suboutcomesError }] = await Promise.all([
      client.from("ct_outcomes").select("*").order("outcome_code", { ascending: true }),
      client.from("ct_suboutcomes").select("*").order("outcome_code", { ascending: true }).order("suboutcome_code", { ascending: true })
    ]);
    if (outcomesError || suboutcomesError) throw outcomesError || suboutcomesError;
    return {
      outcomes: (outcomes || []).map(fromCtOutcomeRow),
      suboutcomes: (suboutcomes || []).map(fromCtSuboutcomeRow)
    };
  }

  async function saveGame(game) {
    if (!client) return;
    const { error } = await client.from("games").upsert(toGameRow(game));
    if (error) throw error;
  }

  async function deleteGame(gameCode) {
    if (!client) return;
    const { error } = await client.from("games").delete().eq("game_code", gameCode);
    if (error) throw error;
  }

  async function saveGameApplicationLevel(level) {
    if (!client) return;
    const { error } = await client.from("game_application_levels").upsert(toGameApplicationLevelRow(level));
    if (error) throw error;
  }

  async function deleteGameApplicationLevel(levelId) {
    if (!client) return;
    const { error } = await client.from("game_application_levels").delete().eq("id", levelId);
    if (error) throw error;
  }

  async function saveGamesData(data) {
    if (!client) return;
    const { error: gamesError } = await client.from("games").upsert((data.games || []).map(toGameRow));
    if (gamesError) throw gamesError;
    const rows = (data.applicationLevels || []).map(toGameApplicationLevelRow);
    if (!rows.length) return;
    const { error: levelsError } = await client.from("game_application_levels").upsert(rows);
    if (levelsError) throw levelsError;
  }

  async function loadRegistrationsData() {
    if (!client) return null;
    const [schoolsResult, facilitatorsResult, studentsResult] = await Promise.all([
      client.from("stemlab_schools").select("*").order("state", { ascending: true }).order("school_name", { ascending: true }),
      client.from("stemlab_facilitators").select("*").order("state", { ascending: true }).order("first_name", { ascending: true }),
      client.from("registered_students").select("*").order("state", { ascending: true }).order("school", { ascending: true }).order("name", { ascending: true })
    ]);
    const error = schoolsResult.error || facilitatorsResult.error || studentsResult.error;
    if (error) throw error;
    return {
      schools: (schoolsResult.data || []).map(fromRegistrationSchoolRow),
      facilitators: (facilitatorsResult.data || []).map(fromRegistrationFacilitatorRow),
      students: (studentsResult.data || []).map(fromRegisteredStudentRow)
    };
  }

  async function saveRegistrationSchool(school) {
    if (!client) return;
    const { error } = await client.from("stemlab_schools").upsert(toRegistrationSchoolRow(school));
    if (error) throw error;
  }

  async function deleteRegistrationSchool(id) {
    if (!client) return;
    const { error } = await client.from("stemlab_schools").delete().eq("id", id);
    if (error) throw error;
  }

  async function saveRegistrationFacilitator(facilitator) {
    if (!client) return;
    const { error } = await client.from("stemlab_facilitators").upsert(toRegistrationFacilitatorRow(facilitator));
    if (error) throw error;
  }

  async function deleteRegistrationFacilitator(id) {
    if (!client) return;
    const { error } = await client.from("stemlab_facilitators").delete().eq("id", id);
    if (error) throw error;
  }
  async function loadSessionEntryData() {
    if (!client) return null;
    const [
      { data: games, error: gamesError },
      { data: registeredStudents, error: registeredStudentsError },
      { data: outcomes, error: outcomesError },
      { data: suboutcomes, error: suboutcomesError },
      { data: rubric, error: rubricError },
      { data: generalOutcomes, error: generalOutcomesError },
      { data: otherOutcomes, error: otherOutcomesError },
      { data: facilitators, error: facilitatorsError }
    ] = await Promise.all([
      client.from("games").select("*").order("game_code", { ascending: true }),
      client.from("registered_students").select("*").order("state", { ascending: true }).order("school", { ascending: true }).order("name", { ascending: true }),
      client.from("ct_outcomes").select("*").order("outcome_code", { ascending: true }),
      client.from("ct_suboutcomes").select("*").order("outcome_code", { ascending: true }).order("suboutcome_code", { ascending: true }),
      client.from("assessment_rubric").select("*").order("scale", { ascending: true }),
      client.from("general_outcomes").select("*").order("display_order", { ascending: true }),
      client.from("other_outcomes").select("*").order("display_order", { ascending: true }),
      client.from("stemlab_facilitators").select("*").order("state", { ascending: true }).order("first_name", { ascending: true })
    ]);

    if (gamesError || registeredStudentsError || outcomesError || suboutcomesError || rubricError || generalOutcomesError || otherOutcomesError || facilitatorsError) {
      throw gamesError || registeredStudentsError || outcomesError || suboutcomesError || rubricError || generalOutcomesError || otherOutcomesError || facilitatorsError;
    }

    return {
      games: (games || []).map(fromGameRow),
      registeredStudents: (registeredStudents || []).map(fromRegisteredStudentRow),
      outcomes: (outcomes || []).map(fromCtOutcomeRow),
      suboutcomes: (suboutcomes || []).map(fromCtSuboutcomeRow),
      rubric: rubric || [],
      generalOutcomes: generalOutcomes || [],
      otherOutcomes: otherOutcomes || [],
      facilitators: (facilitators || []).map(fromRegistrationFacilitatorRow)
    };
  }

  async function loadRegisteredStudents() {
    if (!client) return null;
    const { data, error } = await client
      .from("registered_students")
      .select("*")
      .order("state", { ascending: true })
      .order("district", { ascending: true })
      .order("school", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return (data || []).map(fromRegisteredStudentRow);
  }

  async function saveRegisteredStudent(student) {
    if (!client) return;
    const { error } = await client.from("registered_students").upsert(toRegisteredStudentRow(student)).select("id").single();
    if (error) throw error;
  }

  async function deleteRegisteredStudent(studentId) {
    if (!client) return;
    const { error } = await client.from("registered_students").delete().eq("id", studentId);
    if (error) throw error;
  }

  async function saveFacilitatorSession(entry) {
    if (!client) return;
    const sessionRow = toFacilitatorSessionRow(entry);
    const { data: savedSession, error: sessionError } = await client
      .from("facilitator_sessions")
      .insert(sessionRow)
      .select("id")
      .single();
    if (sessionError) throw sessionError;

    const statusRows = (entry.levelStatuses || []).map((status) => {
      return toFacilitatorSessionStatusRow(savedSession.id, status);
    });
    if (!statusRows.length) return savedSession.id;
    const { error: statusesError } = await client.from("facilitator_session_level_statuses").insert(statusRows);
    if (statusesError) throw statusesError;
    return savedSession.id;
  }

  async function loadDashboardData() {
    if (!client) return null;
    const [
      { data: sessions, error: sessionsError },
      { data: statuses, error: statusesError },
      { data: skills, error: skillsError },
      { data: skillLevels, error: skillLevelsError },
      { data: games, error: gamesError }
    ] = await Promise.all([
      client.from("facilitator_sessions").select("*").order("session_date", { ascending: false }),
      client.from("facilitator_session_level_statuses").select("*"),
      client.from("skills").select("skill_code,skill_name"),
      client.from("skill_levels").select("skill_code,level,key_learning_indicator_code"),
      client.from("games").select("game_code,category,game")
    ]);

    if (sessionsError || statusesError || skillsError || skillLevelsError || gamesError) {
      throw sessionsError || statusesError || skillsError || skillLevelsError || gamesError;
    }

    return {
      sessions: sessions || [],
      statuses: statuses || [],
      skills: (skills || []).map(fromSkillRow),
      skillLevels: (skillLevels || []).map(fromSkillLevelRow),
      games: (games || []).map(fromGameRow)
    };
  }

  async function loadFaqs() {
    if (!client) return null;
    const { data, error } = await client
      .from("faqs")
      .select("*")
      .order("display_order", { ascending: true })
      .order("question", { ascending: true });
    if (error) throw error;
    return (data || []).map(fromFaqRow);
  }

  async function saveFaq(faq) {
    if (!client) return;
    const { error } = await client.from("faqs").upsert(toFaqRow(faq));
    if (error) throw error;
  }

  async function deleteFaq(id) {
    if (!client) return;
    const { error } = await client.from("faqs").delete().eq("id", id);
    if (error) throw error;
  }

  async function loadAssessmentQuestions() {
    if (!client) return null;
    const { data, error } = await client
      .from("assessment_questions")
      .select("*")
      .order("question_level", { ascending: true })
      .order("question_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(fromAssessmentQuestionRow);
  }

  async function loadAssessmentQuestionBankData() {
    if (!client) return null;
    const [{ data: questions, error: questionsError }, { data: outcomes, error: outcomesError }] = await Promise.all([
      client.from("assessment_questions").select("*").order("question_level", { ascending: true }).order("question_order", { ascending: true }).order("created_at", { ascending: false }),
      client.from("ct_outcomes").select("*").order("outcome_code", { ascending: true })
    ]);
    if (questionsError || outcomesError) throw questionsError || outcomesError;
    return {
      questions: (questions || []).map(fromAssessmentQuestionRow),
      outcomes: (outcomes || []).map(fromCtOutcomeRow)
    };
  }

  async function saveAssessmentQuestion(question) {
    if (!client) return;
    const { error } = await client.from("assessment_questions").upsert(toAssessmentQuestionRow(question));
    if (error) throw error;
  }

  async function deleteAssessmentQuestion(id) {
    if (!client) return;
    const { error } = await client.from("assessment_questions").delete().eq("id", id);
    if (error) throw error;
  }

  async function loadAssessmentEntryData() {
    if (!client) return null;
    const [
      studentsResult,
      facilitatorsResult,
      questionsResult,
      outcomesResult,
      suboutcomesResult,
      rubricResult
    ] = await Promise.all([
      client.from("registered_students").select("*").order("state", { ascending: true }).order("school", { ascending: true }).order("name", { ascending: true }),
      client.from("stemlab_facilitators").select("*").order("state", { ascending: true }).order("first_name", { ascending: true }),
      client.from("assessment_questions").select("*").order("question_level", { ascending: true }).order("question_order", { ascending: true }).order("created_at", { ascending: true }),
      client.from("ct_outcomes").select("*").order("outcome_code", { ascending: true }),
      client.from("ct_suboutcomes").select("*").order("outcome_code", { ascending: true }).order("suboutcome_code", { ascending: true }),
      client.from("assessment_rubric").select("*").order("scale", { ascending: true })
    ]);
    const error = studentsResult.error || facilitatorsResult.error || questionsResult.error || outcomesResult.error || suboutcomesResult.error || rubricResult.error;
    if (error) throw error;
    return {
      registeredStudents: (studentsResult.data || []).map(fromRegisteredStudentRow),
      facilitators: (facilitatorsResult.data || []).map(fromRegistrationFacilitatorRow),
      questions: (questionsResult.data || []).map(fromAssessmentQuestionRow),
      outcomes: (outcomesResult.data || []).map(fromCtOutcomeRow),
      suboutcomes: (suboutcomesResult.data || []).map(fromCtSuboutcomeRow),
      rubric: rubricResult.data || []
    };
  }

  async function saveAssessmentEntry(entry) {
    if (!client) return;
    const { error } = await client.from("assessment_entries").insert(toAssessmentEntryRow(entry));
    if (error) throw error;
  }

  async function loadAssessmentDashboardData() {
    if (!client) return null;
    const { data, error } = await client
      .from("assessment_entries")
      .select("*")
      .order("assessment_date", { ascending: false });
    if (error) throw error;
    return (data || []).map(fromAssessmentEntryRow);
  }

  function toRegistrationSchoolRow(item) {
    return { id: item.id, state: item.state, district: item.district, school_name: item.name,
      address: item.address || null, school_type: item.schoolType };
  }

  function fromRegistrationSchoolRow(row) {
    return { id: row.id, state: row.state || "", district: row.district || "", name: row.school_name || "",
      address: row.address || "", schoolType: row.school_type || "" };
  }

  function toRegistrationFacilitatorRow(item) {
    return { id: item.id, state: item.state, first_name: item.firstName, last_name: item.lastName,
      email: item.email, phone: item.phone, alternate_phone: item.alternatePhone || null,
      designation: item.designation || null, qualification: item.qualification || null,
      is_special_educator: item.isSpecialEducator === "Yes", is_educator: item.isEducator === "Yes" };
  }

  function fromRegistrationFacilitatorRow(row) {
    return { id: row.id, state: row.state || "", firstName: row.first_name || "", lastName: row.last_name || "",
      name: [row.first_name, row.last_name].filter(Boolean).join(" "), email: row.email || "", phone: row.phone || "",
      alternatePhone: row.alternate_phone || "", designation: row.designation || "", qualification: row.qualification || "",
      isSpecialEducator: row.is_special_educator ? "Yes" : "No", isEducator: row.is_educator ? "Yes" : "No", active: true };
  }
  function toStudentRow(student) {
    return {
      id: student.id,
      name: student.name || "Unnamed student",
      school: student.school || null,
      level: student.level || null,
      access_notes: student.accessNotes || null
    };
  }

  function toSessionRow(studentId, session) {
    return {
      id: session.id,
      student_id: studentId,
      session_date: session.date,
      mode: session.mode || null,
      game: session.game,
      category: session.category || null,
      facilitator: session.facilitator || null,
      kli_evidence_items: session.kliEvidenceItems || [],
      kli_evidence_notes: session.kliEvidenceNotes || null,
      kli_evidence: session.kliEvidence || null,
      observation: session.observation || null,
      scores: session.scores || {}
    };
  }

  function fromSessionRow(row) {
    return {
      id: row.id,
      date: row.session_date,
      mode: row.mode || "",
      game: row.game,
      category: row.category || "",
      facilitator: row.facilitator || "",
      kliEvidenceItems: row.kli_evidence_items || [],
      kliEvidenceNotes: row.kli_evidence_notes || "",
      kliEvidence: row.kli_evidence || "",
      observation: row.observation || "",
      scores: row.scores || {}
    };
  }

  function toSkillRow(skill) {
    return {
      skill_code: skill.skillCode,
      skill_category: skill.skillCategory,
      skill_name: skill.skillName,
      sub_skills: skill.subSkills || null
    };
  }

  function fromSkillRow(row) {
    return {
      skillCategory: row.skill_category || "",
      skillName: row.skill_name || "",
      skillCode: row.skill_code || "",
      subSkills: row.sub_skills || ""
    };
  }

  function toSkillLevelRow(level) {
    return {
      id: level.id,
      source: level.source || "FONS",
      skill_code: level.skillCode,
      skill_name: level.skillName,
      level: level.level,
      key_learning_indicator_code: level.kliCode,
      key_learning_indicators: level.indicator
    };
  }

  function fromSkillLevelRow(row) {
    return {
      id: row.id,
      source: row.source || "FONS",
      skillName: row.skill_name || "",
      skillCode: row.skill_code || "",
      level: row.level || "",
      kliCode: row.key_learning_indicator_code || "",
      indicator: row.key_learning_indicators || ""
    };
  }

  function toGameRow(game) {
    return {
      game_code: game.gameCode,
      category: game.category || null,
      game: game.game,
      general_information: game.generalInformation || null,
      overview_rules: game.overviewRules || null,
      play_session_plans: game.playSessionPlans || null,
      source_url: game.sourceUrl || null,
      difficulty_level: game.difficultyLevel || null,
      primary_ct_outcome_code: game.primaryCtOutcomeCode || null,
      primary_ct_observation: game.primaryCtObservation || null
    };
  }

  function fromGameRow(row) {
    return {
      gameCode: row.game_code || "",
      category: row.category || "",
      game: row.game || "",
      generalInformation: row.general_information || "",
      overviewRules: row.overview_rules || "",
      playSessionPlans: row.play_session_plans || "",
      sourceUrl: row.source_url || "",
      difficultyLevel: row.difficulty_level || "",
      primaryCtOutcomeCode: row.primary_ct_outcome_code || "",
      primaryCtObservation: row.primary_ct_observation || ""
    };
  }

  function fromCtOutcomeRow(row) {
    return {
      outcomeCode: row.outcome_code || "",
      outcomeName: row.outcome_name || "",
      levels: [
        row.emerging_description || "",
        row.developing_description || "",
        row.independent_description || "",
        row.extending_description || ""
      ]
    };
  }

  function fromCtSuboutcomeRow(row) {
    return {
      suboutcomeCode: row.suboutcome_code || "",
      outcomeCode: row.outcome_code || "",
      suboutcomeName: row.suboutcome_name || "",
      description: row.suboutcome_description || ""
    };
  }

  function toGameApplicationLevelRow(level) {
    return {
      id: level.id,
      game_code: level.gameCode,
      category: level.category || null,
      game: level.game,
      skill_code: level.skillCode,
      key_learning_indicator_codes: level.kliCodes || null,
      game_application: level.gameApplication || null
    };
  }

  function fromGameApplicationLevelRow(row) {
    return {
      id: row.id,
      gameCode: row.game_code || "",
      category: row.category || "",
      game: row.game || "",
      skillCode: row.skill_code || "",
      kliCodes: row.key_learning_indicator_codes || "",
      gameApplication: row.game_application || ""
    };
  }

  function toFacilitatorSessionRow(entry) {
    return {
      state: entry.state || null,
      district: entry.district || null,
      school: entry.school || null,
      session_date: entry.date,
      facilitator: entry.facilitator || null,
      student_name: entry.studentName,
      game_code: entry.gameCode,
      game: entry.game,
      comments: entry.comments || null,
      confidence_score: entry.observationAccuracyScore === "Low" ? 1 : 5,
      common_observations: entry.generalOutcomeRatings || {},
      general_outcome_ratings: entry.generalOutcomeRatings || {},
      primary_ct_rating: entry.primaryCtRating || {},
      selected_ct_suboutcomes: entry.selectedCtSuboutcomes || [],
      other_outcome_ratings: entry.otherOutcomeRatings || {}
    };
  }

  function toFacilitatorSessionStatusRow(sessionId, status) {
    return {
      session_id: sessionId,
      game_application_level_id: status.applicationLevelId || null,
      game_code: status.gameCode,
      skill_code: status.skillCode,
      key_learning_indicator_codes: status.kliCodes || null,
      game_application: status.gameApplication || null,
      status: status.status
    };
  }

  function toRegisteredStudentRow(student) {
    return {
      id: student.id || undefined,
      state: student.state,
      district: student.district,
      school: student.school,
      name: student.name,
      gender: student.gender,
      grade: Number(student.grade),
      board_of_education: student.boardOfEducation || null,
      vision_level: student.visionLevel,
      regional_language: student.regionalLanguage || null,
      other_physical_disabilities: student.otherPhysicalDisabilities,
      cognitive_disabilities: student.cognitiveDisabilities,
      is_braille_literate: student.isBrailleLiterate,
      braille_reading_level: student.brailleReadingLevel,
      braille_writing_level: student.brailleWritingLevel,
      knows_taylor_frame: student.knowsTaylorFrame,
      knows_nemeth: student.knowsNemeth,
      knows_using_computer: student.knowsUsingComputer,
      knows_maths_on_computer: student.knowsMathsOnComputer
    };
  }

  function fromRegisteredStudentRow(row) {
    return {
      id: row.id,
      state: row.state || "",
      district: row.district || "",
      school: row.school || "",
      name: row.name || "",
      gender: row.gender || "",
      grade: row.grade || "",
      boardOfEducation: row.board_of_education || "",
      visionLevel: row.vision_level || "",
      regionalLanguage: row.regional_language || "",
      otherPhysicalDisabilities: row.other_physical_disabilities || "",
      cognitiveDisabilities: row.cognitive_disabilities || "",
      isBrailleLiterate: row.is_braille_literate || "",
      brailleReadingLevel: row.braille_reading_level || "",
      brailleWritingLevel: row.braille_writing_level || "",
      knowsTaylorFrame: row.knows_taylor_frame || "",
      knowsNemeth: row.knows_nemeth || "",
      knowsUsingComputer: row.knows_using_computer || "",
      knowsMathsOnComputer: row.knows_maths_on_computer || ""
    };
  }

  function toFaqRow(faq) {
    return {
      id: faq.id || undefined,
      category: faq.category || null,
      question: faq.question,
      answer: faq.answer,
      display_order: Number(faq.displayOrder) || 0,
      is_active: faq.isActive !== "No"
    };
  }

  function fromFaqRow(row) {
    return {
      id: row.id,
      category: row.category || "",
      question: row.question || "",
      answer: row.answer || "",
      displayOrder: row.display_order ?? 0,
      isActive: row.is_active ? "Yes" : "No"
    };
  }

  function toAssessmentQuestionRow(question) {
    return {
      id: question.id || undefined,
      question_level: Number(question.questionLevel),
      question_order: Number(question.questionOrder),
      question_theme: question.questionTheme || "General",
      outcome_code: question.outcomeCode || null,
      question_text: question.questionText,
      image_data_url: question.imageDataUrl || null,
      image_name: question.imageName || null,
      correct_answer: question.correctAnswer,
      total_marks: Number(question.totalMarks)
    };
  }

  function fromAssessmentQuestionRow(row) {
    return {
      id: row.id,
      questionLevel: row.question_level,
      questionOrder: row.question_order ?? 0,
      questionTheme: row.question_theme || "",
      outcomeCode: row.outcome_code || "",
      questionText: row.question_text || "",
      imageDataUrl: row.image_data_url || "",
      imageName: row.image_name || "",
      correctAnswer: row.correct_answer || "",
      totalMarks: row.total_marks ?? 0
    };
  }

  function toAssessmentEntryRow(entry) {
    return {
      state: entry.state,
      district: entry.district,
      school: entry.school,
      student_id: entry.studentId || null,
      student_name: entry.studentName,
      assessment_date: entry.date,
      facilitator: entry.facilitator,
      assessment_level: Number(entry.assessmentLevel),
      question_scores: entry.questionScores || [],
      free_play_assessment: entry.freePlayAssessment || {},
      qualitative_outcomes: entry.qualitativeOutcomes || [],
      other_observations: entry.otherObservations || null,
      accuracy_score: entry.accuracyScore
    };
  }

  function fromAssessmentEntryRow(row) {
    return {
      id: row.id,
      state: row.state || "",
      district: row.district || "",
      school: row.school || "",
      studentId: row.student_id || "",
      studentName: row.student_name || "",
      date: row.assessment_date || "",
      facilitator: row.facilitator || "",
      assessmentLevel: row.assessment_level,
      questionScores: row.question_scores || [],
      freePlayAssessment: row.free_play_assessment || {},
      qualitativeOutcomes: row.qualitative_outcomes || [],
      otherObservations: row.other_observations || "",
      accuracyScore: row.accuracy_score || ""
    };
  }

  window.VictSupabaseStore = {
    isEnabled,
    loadState,
    saveStudent,
    saveSession,
    replaceStudentSessions,
    saveAll,
    loadSkillsData,
    saveSkill,
    deleteSkill,
    saveSkillLevel,
    deleteSkillLevel,
    saveSkillsData,
    loadGamesData,
    loadOutcomesData,
    saveGame,
    deleteGame,
    saveGameApplicationLevel,
    deleteGameApplicationLevel,
    saveGamesData,
    loadRegistrationsData,
    saveRegistrationSchool,
    deleteRegistrationSchool,
    saveRegistrationFacilitator,
    deleteRegistrationFacilitator,
    loadSessionEntryData,
    loadRegisteredStudents,
    saveRegisteredStudent,
    deleteRegisteredStudent,
    saveFacilitatorSession,
    loadDashboardData,
    loadFaqs,
    saveFaq,
    deleteFaq,
    loadAssessmentQuestionBankData,
    loadAssessmentQuestions,
    saveAssessmentQuestion,
    deleteAssessmentQuestion,
    loadAssessmentEntryData,
    saveAssessmentEntry,
    loadAssessmentDashboardData
  };
})();
