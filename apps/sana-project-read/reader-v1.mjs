const SCHEMA = 'greenatics.sana.agroway-progress-read/1.0.0';
const ROOT_KEYS = ['schema', 'projectionId', 'idempotencyKey', 'generatedAt', 'sourceAsOf', 'source', 'projectMapping', 'approval', 'freshness', 'cycle', 'completeness', 'summary', 'milestones', 'sourceRecords', 'supersedesProjectionId'];
const FRESHNESS_KEYS = ['status', 'sourceAsOf', 'maxAgeHours'];

class ContractError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function ensure(ok, code) {
  if (!ok) throw new ContractError(code);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function onlyKeys(value, keys, code) {
  ensure(isRecord(value), code);
  ensure(Object.keys(value).every((key) => keys.includes(key)), code);
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function exactKeys(value, required, code) {
  onlyKeys(value, required, code);
  ensure(required.every((key) => Object.hasOwn(value, key)), code);
}

function isoInstant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  const parsed = new Date(value);
  const normalized = value.includes('.') ? value : value.replace(/Z$/, '.000Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === normalized;
}

function isoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function demoRef(value, prefix) {
  return nonEmpty(value) && value.startsWith(`${prefix}-demo-`);
}

function sourceRecordRef(value) {
  return nonEmpty(value) && value.startsWith('demo-');
}

function cycleRef(value) {
  return nonEmpty(value) && /^(?:aw|agroway)-cycle-demo-[a-z0-9-]+$/.test(value);
}

function boundedCount(value, completeness) {
  if (value === null) {
    ensure(completeness !== 'COMPLETE', 'COMPLETE_VALUE_MISSING');
    return null;
  }
  ensure(Number.isSafeInteger(value) && value >= 0, 'INVALID_COUNT');
  return value;
}

function validateCounts(input) {
  exactKeys(input.completeness, ['tasks', 'alerts', 'harvest'], 'INVALID_COMPLETENESS');
  const levels = new Set(['COMPLETE', 'PARTIAL', 'UNKNOWN']);
  ensure(Object.values(input.completeness).every((value) => levels.has(value)), 'INVALID_COMPLETENESS');

  exactKeys(input.summary, ['tasks', 'alerts', 'harvest'], 'INVALID_SUMMARY');
  exactKeys(input.summary.tasks, ['planned', 'inProgress', 'done', 'cancelled'], 'INVALID_TASK_SUMMARY');
  exactKeys(input.summary.alerts, ['open', 'acknowledged', 'closed'], 'INVALID_ALERT_SUMMARY');
  exactKeys(input.summary.harvest, ['status', 'lotCount', 'quantity', 'unit'], 'INVALID_HARVEST_SUMMARY');

  const tasks = Object.fromEntries(Object.entries(input.summary.tasks).map(([key, value]) => [key, boundedCount(value, input.completeness.tasks)]));
  const alerts = Object.fromEntries(Object.entries(input.summary.alerts).map(([key, value]) => [key, boundedCount(value, input.completeness.alerts)]));
  const harvest = input.summary.harvest;
  ensure(['RECORDED', 'NONE', 'UNKNOWN'].includes(harvest.status), 'INVALID_HARVEST_STATUS');
  const lotCount = boundedCount(harvest.lotCount, input.completeness.harvest);
  const quantity = harvest.quantity === null
    ? boundedCount(null, input.completeness.harvest)
    : harvest.quantity;
  if (quantity !== null) ensure(typeof quantity === 'number' && Number.isFinite(quantity) && quantity >= 0, 'INVALID_HARVEST_QUANTITY');
  if (harvest.unit !== null) ensure(nonEmpty(harvest.unit), 'INVALID_HARVEST_UNIT');
  ensure(harvest.status !== 'RECORDED' || input.completeness.harvest !== 'COMPLETE' || (lotCount > 0 && quantity !== null && harvest.unit !== null), 'INCOMPLETE_RECORDED_HARVEST');

  return { tasks, alerts, harvest: { status: harvest.status, lotCount, quantity, unit: harvest.unit } };
}

async function sha256Hex(value) {
  let subtle = globalThis.crypto?.subtle;
  if (!subtle && typeof process !== 'undefined' && process.versions?.node) {
    subtle = (await import('node:crypto')).webcrypto.subtle;
  }
  ensure(subtle, 'CRYPTO_UNAVAILABLE');
  const bytes = await subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function createIdempotencyKey({ schema = SCHEMA, sanaProjectRef, projectionId, sourceAsOf }) {
  return sha256Hex(`${schema}|${sanaProjectRef}|${projectionId}|${sourceAsOf}`);
}

function provenance(model) {
  return {
    projectionId: model.projectionId,
    idempotencyKey: model.idempotencyKey,
    sourceAsOf: model.sourceAsOf,
    generatedAt: model.generatedAt,
    sourceCommit: model.source.commit,
  };
}

export async function validateProjection(input, { expectedSanaProjectRef, now = Date.now() } = {}) {
  try {
    exactKeys(input, ROOT_KEYS, 'INVALID_ENVELOPE');
    ensure(input.schema === SCHEMA, 'UNKNOWN_SCHEMA');
    ensure(demoRef(expectedSanaProjectRef, 'sana'), 'INVALID_DEMO_PROJECT_CONFIG');
    ensure(demoRef(input.projectionId, 'aw'), 'INVALID_PROJECTION_ID');
    ensure(isoInstant(input.generatedAt) && isoInstant(input.sourceAsOf), 'INVALID_TIMESTAMP');
    ensure(Date.parse(input.sourceAsOf) <= Date.parse(input.generatedAt), 'SOURCE_AFTER_GENERATION');

    exactKeys(input.source, ['product', 'version', 'commit', 'contract'], 'INVALID_SOURCE');
    ensure(input.source.product === 'AGROWAY_FIELD' && nonEmpty(input.source.version), 'INVALID_SOURCE');
    ensure(/^[a-f0-9]{40}$/.test(input.source.commit), 'INVALID_SOURCE_COMMIT');
    ensure(input.source.contract === 'cycle-summary-v1', 'UNKNOWN_SOURCE_CONTRACT');

    exactKeys(input.projectMapping, ['status', 'sanaProjectRef', 'agrowayProjectRef', 'cropCycleRef'], 'INVALID_PROJECT_MAPPING');
    ensure(input.projectMapping.status === 'SYNTHETIC', 'NON_SYNTHETIC_MAPPING');
    ensure(input.projectMapping.sanaProjectRef === expectedSanaProjectRef, 'PROJECT_UNMAPPED');
    ensure(demoRef(input.projectMapping.agrowayProjectRef, 'aw') && cycleRef(input.projectMapping.cropCycleRef), 'INVALID_DEMO_MAPPING');

    exactKeys(input.approval, ['status', 'scope', 'approvalRef', 'reviewedAt'], 'INVALID_APPROVAL');
    ensure(input.approval.status === 'APPROVED_FOR_DEMO_ONLY' && input.approval.scope === 'SYNTHETIC_FIXTURE', 'NOT_APPROVED_FOR_DEMO');
    ensure(nonEmpty(input.approval.approvalRef) && input.approval.approvalRef.startsWith('SYNTHETIC-'), 'INVALID_DEMO_APPROVAL_REF');
    ensure(isoInstant(input.approval.reviewedAt) && Date.parse(input.approval.reviewedAt) <= Date.parse(input.generatedAt), 'INVALID_APPROVAL_TIME');

    exactKeys(input.freshness, FRESHNESS_KEYS, 'INVALID_FRESHNESS');
    ensure(['FRESH', 'STALE'].includes(input.freshness.status), 'INVALID_FRESHNESS');
    ensure(input.freshness.sourceAsOf === input.sourceAsOf && Number.isFinite(input.freshness.maxAgeHours) && input.freshness.maxAgeHours > 0 && input.freshness.maxAgeHours <= 720, 'INVALID_FRESHNESS');

    exactKeys(input.cycle, ['crop', 'state', 'periodStart', 'periodEnd'], 'INVALID_CYCLE');
    ensure(nonEmpty(input.cycle.crop) && ['PLANNED', 'ACTIVE', 'PAUSED', 'CLOSED'].includes(input.cycle.state), 'INVALID_CYCLE');
    ensure(isoDate(input.cycle.periodStart) && (input.cycle.periodEnd === null || isoDate(input.cycle.periodEnd)), 'INVALID_CYCLE_DATES');
    ensure(input.cycle.periodEnd === null || input.cycle.periodEnd >= input.cycle.periodStart, 'INVALID_CYCLE_DATES');

    const summary = validateCounts(input);
    ensure(Array.isArray(input.milestones) && input.milestones.length <= 200, 'INVALID_MILESTONES');
    const seenEvents = new Set();
    const milestones = input.milestones.map((item) => {
      exactKeys(item, ['eventRef', 'kind', 'status', 'occurredAt', 'sourceRecordRef'], 'INVALID_MILESTONE');
      ensure(sourceRecordRef(item.eventRef) && sourceRecordRef(item.sourceRecordRef), 'INVALID_MILESTONE_REF');
      ensure(nonEmpty(item.kind) && nonEmpty(item.status) && isoInstant(item.occurredAt) && Date.parse(item.occurredAt) <= Date.parse(input.generatedAt), 'INVALID_MILESTONE');
      ensure(!seenEvents.has(item.eventRef), 'DUPLICATE_MILESTONE');
      seenEvents.add(item.eventRef);
      return { eventRef: item.eventRef, kind: item.kind, status: item.status, occurredAt: item.occurredAt };
    });

    exactKeys(input.sourceRecords, ['taskRefs', 'executionRefs', 'alertRefs', 'harvestLotRefs', 'passportRef'], 'INVALID_SOURCE_RECORDS');
    for (const key of ['taskRefs', 'executionRefs', 'alertRefs', 'harvestLotRefs']) {
      ensure(Array.isArray(input.sourceRecords[key]) && input.sourceRecords[key].length <= 500 && input.sourceRecords[key].every(sourceRecordRef), 'INVALID_SOURCE_RECORDS');
    }
    ensure(input.sourceRecords.passportRef === null || sourceRecordRef(input.sourceRecords.passportRef), 'INVALID_SOURCE_RECORDS');
    ensure(input.supersedesProjectionId === null || demoRef(input.supersedesProjectionId, 'aw'), 'INVALID_SUPERSEDES_REF');

    const expectedKey = await createIdempotencyKey({
      schema: input.schema,
      sanaProjectRef: input.projectMapping.sanaProjectRef,
      projectionId: input.projectionId,
      sourceAsOf: input.sourceAsOf,
    });
    ensure(input.idempotencyKey === expectedKey, 'IDEMPOTENCY_KEY_MISMATCH');

    const timestamp = typeof now === 'string' ? Date.parse(now) : now instanceof Date ? now.getTime() : now;
    ensure(Number.isFinite(timestamp), 'INVALID_CLOCK');
    const sourceTimestamp = Date.parse(input.sourceAsOf);
    ensure(sourceTimestamp <= timestamp + 5 * 60 * 1000, 'FUTURE_SOURCE_DATA');
    const ageHours = Math.max(0, (timestamp - sourceTimestamp) / 3_600_000);
    const stale = input.freshness.status === 'STALE' || ageHours > input.freshness.maxAgeHours;

    return {
      ok: true,
      model: {
        schema: SCHEMA,
        projectRef: input.projectMapping.sanaProjectRef,
        cycle: { crop: input.cycle.crop, state: input.cycle.state, periodStart: input.cycle.periodStart, periodEnd: input.cycle.periodEnd },
        completeness: { ...input.completeness },
        summary,
        milestones,
        provenance: provenance(input),
        freshness: { status: stale ? 'STALE' : 'FRESH', sourceAsOf: input.sourceAsOf, ageHours, maxAgeHours: input.freshness.maxAgeHours },
        readOnly: true,
      },
      reason: null,
    };
  } catch (error) {
    return { ok: false, model: null, reason: error instanceof ContractError ? error.code : 'INVALID_ENVELOPE' };
  }
}

export async function applyProjection(currentState, input, options = {}) {
  const checked = await validateProjection(input, options);
  if (!checked.ok) return { accepted: false, outcome: 'rejected', reason: checked.reason, state: currentState ?? null };

  const next = checked.model;
  if (!currentState?.latest) {
    if (input.supersedesProjectionId !== null) return { accepted: false, outcome: 'rejected', reason: 'UNKNOWN_CORRECTION_TARGET', state: currentState ?? null };
    return { accepted: true, outcome: next.freshness.status.toLowerCase(), reason: null, state: { latest: next, history: [], sourceStatus: 'AVAILABLE' } };
  }

  const allKeys = [currentState.latest.provenance.idempotencyKey, ...(currentState.history ?? []).map((item) => item.idempotencyKey)];
  if (allKeys.includes(next.provenance.idempotencyKey) || currentState.latest.provenance.projectionId === next.provenance.projectionId) {
    return { accepted: false, outcome: 'duplicate', reason: 'DUPLICATE_PROJECTION', state: currentState };
  }

  const currentId = currentState.latest.provenance.projectionId;
  const currentTime = Date.parse(currentState.latest.provenance.sourceAsOf);
  const nextTime = Date.parse(next.provenance.sourceAsOf);
  if (input.supersedesProjectionId !== null && input.supersedesProjectionId !== currentId) {
    return { accepted: false, outcome: 'rejected', reason: 'CORRECTION_TARGET_MISMATCH', state: currentState };
  }
  if (nextTime < currentTime) return { accepted: false, outcome: 'rejected', reason: 'OUT_OF_ORDER_PROJECTION', state: currentState };
  if (nextTime === currentTime && input.supersedesProjectionId === null) {
    return { accepted: false, outcome: 'rejected', reason: 'SOURCE_TIME_CONFLICT', state: currentState };
  }

  const previous = currentState.latest.provenance;
  const history = [...(currentState.history ?? []), {
    ...previous,
    supersededBy: next.provenance.projectionId,
  }];
  return {
    accepted: true,
    outcome: next.freshness.status.toLowerCase(),
    reason: null,
    state: { latest: next, history, sourceStatus: 'AVAILABLE' },
  };
}

export function markSourceUnavailable(currentState) {
  if (!currentState) return { latest: null, history: [], sourceStatus: 'UNAVAILABLE' };
  return { ...currentState, sourceStatus: 'UNAVAILABLE' };
}
