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
    const [{ data: games, error: gamesError }, { data: applicationLevels, error: levelsError }, { data: skills, error: skillsError }] = await Promise.all([
      client.from("games").select("*").order("game_code", { ascending: true }),
      client.from("game_application_levels").select("*").order("game_code", { ascending: true }),
      client.from("skills").select("skill_code,skill_name").order("skill_name", { ascending: true })
    ]);

    if (gamesError || levelsError || skillsError) {
      throw gamesError || levelsError || skillsError;
    }

    return {
      games: (games || []).map(fromGameRow),
      applicationLevels: (applicationLevels || []).map(fromGameApplicationLevelRow),
      skills: (skills || []).map(fromSkillRow)
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

  async function loadSessionEntryData() {
    if (!client) return null;
    const [{ data: games, error: gamesError }, { data: applicationLevels, error: levelsError }] = await Promise.all([
      client.from("games").select("*").order("game_code", { ascending: true }),
      client.from("game_application_levels").select("*").order("game_code", { ascending: true })
    ]);

    if (gamesError || levelsError) {
      throw gamesError || levelsError;
    }

    return {
      games: (games || []).map(fromGameRow),
      applicationLevels: (applicationLevels || []).map(fromGameApplicationLevelRow)
    };
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
      play_session_plans: game.playSessionPlans || null
    };
  }

  function fromGameRow(row) {
    return {
      gameCode: row.game_code || "",
      category: row.category || "",
      game: row.game || "",
      generalInformation: row.general_information || "",
      overviewRules: row.overview_rules || "",
      playSessionPlans: row.play_session_plans || ""
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
      confidence_score: Number(entry.confidenceScore)
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
    saveGame,
    deleteGame,
    saveGameApplicationLevel,
    deleteGameApplicationLevel,
    saveGamesData,
    loadSessionEntryData,
    saveFacilitatorSession
  };
})();
