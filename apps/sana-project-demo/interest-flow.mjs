const ALLOWED_INTENTS = new Set([
  'project-structure',
  'agricultural-follow-up',
  'human-conversation',
]);

export function createInterestFlow() {
  return Object.freeze({ step: 'project', status: 'idle', intent: null, review: null });
}

export function openInterest(state) {
  if (state.status === 'simulated') return state;
  return Object.freeze({ ...state, step: 'interest' });
}

export function submitInterest(state, { intent, acknowledged }) {
  if (state.status === 'simulated') return Object.freeze({ ok: true, state });
  if (state.step !== 'interest') return Object.freeze({ ok: false, state, reason: 'FLOW_NOT_READY' });
  if (!ALLOWED_INTENTS.has(intent)) return Object.freeze({ ok: false, state, reason: 'INTENT_REQUIRED' });
  if (acknowledged !== true) return Object.freeze({ ok: false, state, reason: 'DEMO_ACKNOWLEDGMENT_REQUIRED' });
  return Object.freeze({
    ok: true,
    state: Object.freeze({ step: 'confirmation', status: 'simulated', intent, review: 'human-review-pending' }),
  });
}

export function resetInterestFlow() {
  return createInterestFlow();
}
