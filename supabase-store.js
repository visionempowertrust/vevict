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
    saveSkillsData
  };
})();
