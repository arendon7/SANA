const ALLOWED_INTENTS = new Set([
  'project-structure',
  'agricultural-follow-up',
  'human-conversation',
]);

const SAMPLE_COMMITMENT_AMOUNTS = new Set([500_000, 1_000_000, 2_500_000]);

function freezeSession(simulatedInterests) {
  return Object.freeze({ simulatedInterests: Object.freeze(simulatedInterests.map((item) => Object.freeze(item))) });
}

function findInterest(session, projectRef) {
  return session?.simulatedInterests?.find((entry) => entry.projectRef === projectRef);
}

export function createParticipantSession() {
  return freezeSession([]);
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
    reviewStatus: 'PENDING',
    commitment: null,
  });
  const previous = session.simulatedInterests.filter((entry) => entry.projectRef !== projectRef);
  const next = freezeSession([...previous, item]);
  return Object.freeze({ ok: true, state: next, item });
}

export function simulateHumanReview(session, projectRef) {
  if (!session || !Array.isArray(session.simulatedInterests)) {
    return Object.freeze({ ok: false, state: session, reason: 'INVALID_SESSION' });
  }
  const item = findInterest(session, projectRef);
  if (!item) return Object.freeze({ ok: false, state: session, reason: 'PROJECT_NOT_TRACKED' });
  if (item.reviewStatus !== 'PENDING') return Object.freeze({ ok: false, state: session, reason: 'REVIEW_ALREADY_SIMULATED' });
  const next = freezeSession(session.simulatedInterests.map((entry) => entry.projectRef === projectRef
    ? { ...entry, reviewStatus: 'SIMULATED_CONTINUE' }
    : entry));
  return Object.freeze({ ok: true, state: next, item: findInterest(next, projectRef) });
}

export function recordSimulatedCommitment(session, { projectRef, amount }) {
  if (!session || !Array.isArray(session.simulatedInterests)) {
    return Object.freeze({ ok: false, state: session, reason: 'INVALID_SESSION' });
  }
  const item = findInterest(session, projectRef);
  if (!item) return Object.freeze({ ok: false, state: session, reason: 'PROJECT_NOT_TRACKED' });
  if (item.reviewStatus !== 'SIMULATED_CONTINUE') {
    return Object.freeze({ ok: false, state: session, reason: 'SIMULATED_REVIEW_REQUIRED' });
  }
  if (!SAMPLE_COMMITMENT_AMOUNTS.has(amount)) {
    return Object.freeze({ ok: false, state: session, reason: 'SAMPLE_AMOUNT_INVALID' });
  }
  if (item.commitment) return Object.freeze({ ok: false, state: session, reason: 'COMMITMENT_ALREADY_SIMULATED' });
  const commitment = Object.freeze({ amount, currency: 'COP', status: 'SAMPLE_ONLY' });
  const next = freezeSession(session.simulatedInterests.map((entry) => entry.projectRef === projectRef
    ? { ...entry, commitment }
    : entry));
  return Object.freeze({ ok: true, state: next, item: findInterest(next, projectRef) });
}

export function clearParticipantSession() {
  return createParticipantSession();
}
