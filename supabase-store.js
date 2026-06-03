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

  window.VictSupabaseStore = {
    isEnabled,
    loadState,
    saveStudent,
    saveSession,
    replaceStudentSessions,
    saveAll
  };
})();
