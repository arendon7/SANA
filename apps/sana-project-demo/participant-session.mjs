const ALLOWED_INTENTS = new Set([
  'project-structure',
  'agricultural-follow-up',
  'human-conversation',
]);

export function createParticipantSession() {
  return Object.freeze({ simulatedInterests: Object.freeze([]) });
}

export function recordSimulatedInterest(session, { projectRef, projectTitle, intent }) {
  if (!session || !Array.isArray(session.simulatedInterests)) {
    return Object.freeze({ ok: false, state: session, reason: 'INVALID_SESSION' });
  }
  if (typeof projectRef !== 'string' || !projectRef.trim() || typeof projectTitle !== 'string' || !projectTitle.trim()) {
    return Object.freeze({ ok: false, state: session, reason: 'PROJECT_REQUIRED' });
  }
  if (!ALLOWED_INTENTS.has(intent)) {
    return Object.freeze({ ok: false, state: session, reason: 'INTENT_REQUIRED' });
  }
  const item = Object.freeze({
    projectRef,
    projectTitle,
    intent,
    status: 'SIMULATED_HUMAN_REVIEW',
  });
  const previous = session.simulatedInterests.filter((entry) => entry.projectRef !== projectRef);
  const next = Object.freeze({ simulatedInterests: Object.freeze([...previous, item]) });
  return Object.freeze({ ok: true, state: next, item });
}

export function clearParticipantSession() {
  return createParticipantSession();
}
