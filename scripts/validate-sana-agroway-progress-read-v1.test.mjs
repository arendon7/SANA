import assert from 'node:assert/strict';
import test from 'node:test';
import { applyProjection, createIdempotencyKey, markSourceUnavailable, validateProjection } from '../apps/sana-project-read/reader-v1.mjs';

const now = '2026-10-17T21:00:00.000Z';
const projectRef = 'sana-demo-project-001';

async function fixture(overrides = {}) {
  const base = {
    schema: 'greenatics.sana.agroway-progress-read/1.0.0',
    projectionId: 'aw-demo-project-001:cycle-2026-01:snapshot-0001',
    idempotencyKey: '',
    generatedAt: '2026-10-17T20:20:00.000Z',
    sourceAsOf: '2026-10-17T18:00:00.000Z',
    source: { product: 'AGROWAY_FIELD', version: '0.21.0-alpha10-reconstructed', commit: '1819f226390256b59dffdd117e853196304f49b9', contract: 'cycle-summary-v1' },
    projectMapping: { status: 'SYNTHETIC', sanaProjectRef: projectRef, agrowayProjectRef: 'aw-demo-project-001', cropCycleRef: 'aw-cycle-demo-001' },
    approval: { status: 'APPROVED_FOR_DEMO_ONLY', scope: 'SYNTHETIC_FIXTURE', approvalRef: 'SYNTHETIC-AGROWAY-SANA-001', reviewedAt: '2026-10-17T18:00:00.000Z' },
    freshness: { status: 'FRESH', sourceAsOf: '2026-10-17T18:00:00.000Z', maxAgeHours: 72 },
    cycle: { crop: 'cacao', state: 'ACTIVE', periodStart: '2026-02-18', periodEnd: null },
    completeness: { tasks: 'COMPLETE', alerts: 'COMPLETE', harvest: 'COMPLETE' },
    summary: {
      tasks: { planned: 1, inProgress: 0, done: 1, cancelled: 0 },
      alerts: { open: 1, acknowledged: 0, closed: 0 },
      harvest: { status: 'RECORDED', lotCount: 1, quantity: 12, unit: 'kg' },
    },
    milestones: [
      { eventRef: 'demo-cycle-started-001', kind: 'CROP_CYCLE_ACTIVE', status: 'OBSERVED', occurredAt: '2026-02-18T12:00:00.000Z', sourceRecordRef: 'demo-cycle-001' },
      { eventRef: 'demo-task-done-001', kind: 'FIELD_TASK_DONE', status: 'OBSERVED', occurredAt: '2026-10-02T15:30:00.000Z', sourceRecordRef: 'demo-execution-001' },
    ],
    sourceRecords: { taskRefs: ['demo-task-001'], executionRefs: ['demo-execution-001'], alertRefs: ['demo-alert-001'], harvestLotRefs: ['demo-harvest-001'], passportRef: null },
    supersedesProjectionId: null,
    ...overrides,
  };
  base.idempotencyKey = await createIdempotencyKey({ schema: base.schema, sanaProjectRef: base.projectMapping.sanaProjectRef, projectionId: base.projectionId, sourceAsOf: base.sourceAsOf });
  return base;
}

const options = { expectedSanaProjectRef: projectRef, now };

test('accepts only an approved synthetic projection and returns a sanitized read-only view', async () => {
  const checked = await validateProjection(await fixture(), options);
  assert.equal(checked.ok, true);
  assert.equal(checked.model.readOnly, true);
  assert.equal(checked.model.freshness.status, 'FRESH');
  assert.equal(checked.model.summary.harvest.quantity, 12);
  assert.equal('sourceRecords' in checked.model, false);
  assert.equal('agrowayProjectRef' in checked.model, false);
});

test('same snapshot is idempotent and does not grow history', async () => {
  const first = await applyProjection(null, await fixture(), options);
  const duplicate = await applyProjection(first.state, await fixture(), options);
  assert.equal(first.accepted, true);
  assert.equal(duplicate.outcome, 'duplicate');
  assert.equal(duplicate.state.history.length, 0);
});

test('a newer snapshot preserves the previous projection provenance', async () => {
  const first = await applyProjection(null, await fixture(), options);
  const nextInput = await fixture({
    projectionId: 'aw-demo-project-001:cycle-2026-01:snapshot-0002',
    generatedAt: '2026-10-17T21:20:00.000Z',
    sourceAsOf: '2026-10-17T21:00:00.000Z',
    freshness: { status: 'FRESH', sourceAsOf: '2026-10-17T21:00:00.000Z', maxAgeHours: 72 },
  });
  const next = await applyProjection(first.state, nextInput, { ...options, now: '2026-10-17T21:30:00.000Z' });
  assert.equal(next.accepted, true);
  assert.equal(next.state.latest.provenance.projectionId, nextInput.projectionId);
  assert.equal(next.state.history[0].projectionId, first.state.latest.provenance.projectionId);
  assert.equal(next.state.history[0].supersededBy, nextInput.projectionId);
});

test('a correction must explicitly supersede the current projection', async () => {
  const first = await applyProjection(null, await fixture(), options);
  const correction = await fixture({
    projectionId: 'aw-demo-project-001:cycle-2026-01:correction-0001',
    generatedAt: '2026-10-17T21:20:00.000Z',
    supersedesProjectionId: first.state.latest.provenance.projectionId,
  });
  const result = await applyProjection(first.state, correction, { ...options, now: '2026-10-17T21:30:00.000Z' });
  assert.equal(result.accepted, true);
  assert.equal(result.state.history[0].supersededBy, correction.projectionId);
});

test('rejects unknown schema, unapproved data and an unmapped project without replacing current data', async () => {
  const first = await applyProjection(null, await fixture(), options);
  for (const [input, expectedReason] of [
    [await fixture({ schema: 'greenatics.sana.agroway-progress-read/9.0.0' }), 'UNKNOWN_SCHEMA'],
    [await fixture({ approval: { status: 'APPROVED', scope: 'REAL_DATA', approvalRef: 'not-synthetic', reviewedAt: '2026-10-17T18:00:00.000Z' } }), 'NOT_APPROVED_FOR_DEMO'],
    [await fixture({ projectMapping: { status: 'SYNTHETIC', sanaProjectRef: 'sana-demo-other-project', agrowayProjectRef: 'aw-demo-project-001', cropCycleRef: 'aw-cycle-demo-001' } }), 'PROJECT_UNMAPPED'],
  ]) {
    const result = await applyProjection(first.state, input, options);
    assert.equal(result.accepted, false);
    assert.equal(result.reason, expectedReason);
    assert.equal(result.state, first.state);
  }
});

test('stale data stays visible as stale and incomplete values remain null', async () => {
  const staleInput = await fixture({
    freshness: { status: 'FRESH', sourceAsOf: '2026-10-17T18:00:00.000Z', maxAgeHours: 1 },
    completeness: { tasks: 'PARTIAL', alerts: 'UNKNOWN', harvest: 'PARTIAL' },
    summary: {
      tasks: { planned: 1, inProgress: null, done: null, cancelled: 0 },
      alerts: { open: null, acknowledged: null, closed: null },
      harvest: { status: 'UNKNOWN', lotCount: null, quantity: null, unit: null },
    },
  });
  const checked = await validateProjection(staleInput, options);
  assert.equal(checked.ok, true);
  assert.equal(checked.model.freshness.status, 'STALE');
  assert.equal(checked.model.summary.tasks.done, null);
  assert.equal(checked.model.summary.harvest.quantity, null);
});

test('rejects additional fields, future timestamps and complete summaries with missing values', async () => {
  const extra = await fixture(); extra.operatorName = 'not allowed';
  assert.equal((await validateProjection(extra, options)).reason, 'INVALID_ENVELOPE');
  const future = await fixture({ sourceAsOf: '2026-10-17T23:00:00.000Z', generatedAt: '2026-10-17T23:10:00.000Z', freshness: { status: 'FRESH', sourceAsOf: '2026-10-17T23:00:00.000Z', maxAgeHours: 72 } });
  assert.equal((await validateProjection(future, options)).reason, 'FUTURE_SOURCE_DATA');
  const missing = await fixture({ summary: { tasks: { planned: 1, inProgress: 0, done: null, cancelled: 0 }, alerts: { open: 0, acknowledged: 0, closed: 0 }, harvest: { status: 'NONE', lotCount: 0, quantity: 0, unit: 'kg' } } });
  assert.equal((await validateProjection(missing, options)).reason, 'COMPLETE_VALUE_MISSING');
});

test('source unavailability retains the last accepted snapshot unchanged', async () => {
  const first = await applyProjection(null, await fixture(), options);
  const unavailable = markSourceUnavailable(first.state);
  assert.equal(unavailable.sourceStatus, 'UNAVAILABLE');
  assert.equal(unavailable.latest, first.state.latest);
  assert.equal(unavailable.latest.summary.tasks.done, 1);
});


test('accepts ISO UTC timestamps without milliseconds used by the synthetic contract', async () => {
  const input = await fixture({
    generatedAt: '2026-10-17T20:20:00Z',
    sourceAsOf: '2026-10-17T18:00:00Z',
    approval: { status: 'APPROVED_FOR_DEMO_ONLY', scope: 'SYNTHETIC_FIXTURE', approvalRef: 'SYNTHETIC-AGROWAY-SANA-001', reviewedAt: '2026-10-17T18:00:00Z' },
    freshness: { status: 'FRESH', sourceAsOf: '2026-10-17T18:00:00Z', maxAgeHours: 72 },
    milestones: [{ eventRef: 'demo-cycle-started-001', kind: 'CROP_CYCLE_ACTIVE', status: 'OBSERVED', occurredAt: '2026-02-18T12:00:00Z', sourceRecordRef: 'demo-cycle-001' }],
  });
  const checked = await validateProjection(input, options);
  assert.equal(checked.ok, true);
});
