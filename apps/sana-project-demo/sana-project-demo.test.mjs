import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProjection } from '../sana-project-read/reader-v1.mjs';
import { createInterestFlow, openInterest, resetInterestFlow, submitInterest } from './interest-flow.mjs';

const appDirectory = fileURLToPath(new URL('.', import.meta.url));
const read = (path) => readFile(resolve(appDirectory, path), 'utf8');

async function loadFixture() {
  return JSON.parse(await read('project-projection-v1.json'));
}

test('project projection is exact, approved only for demo, and read-only', async () => {
  const fixture = await loadFixture();
  const checked = await validateProjection(fixture, {
    expectedSanaProjectRef: 'sana-demo-project-001',
    now: Date.parse(fixture.generatedAt) + 60 * 60 * 1000,
  });
  assert.equal(checked.ok, true);
  assert.equal(checked.model.readOnly, true);
  assert.equal(checked.model.freshness.status, 'FRESH');
  assert.equal(checked.model.summary.harvest.quantity, 12);
  assert.equal(fixture.approval.scope, 'SYNTHETIC_FIXTURE');
  assert.equal(fixture.projectMapping.status, 'SYNTHETIC');
});

test('unknown or mismapped project fails closed without showing agricultural data', async () => {
  const fixture = await loadFixture();
  const checked = await validateProjection({
    ...fixture,
    projectMapping: { ...fixture.projectMapping, sanaProjectRef: 'sana-demo-project-other' },
  }, { expectedSanaProjectRef: 'sana-demo-project-001', now: Date.parse(fixture.generatedAt) });
  assert.equal(checked.ok, false);
  assert.equal(checked.reason, 'PROJECT_UNMAPPED');
});

test('interest flow requires an explicit motive and demo acknowledgment', () => {
  const initial = createInterestFlow();
  assert.equal(initial.step, 'project');
  assert.equal(submitInterest(initial, { intent: 'project-structure', acknowledged: true }).reason, 'FLOW_NOT_READY');

  const started = openInterest(initial);
  assert.equal(started.step, 'interest');
  assert.equal(submitInterest(started, { intent: null, acknowledged: true }).reason, 'INTENT_REQUIRED');
  assert.equal(submitInterest(started, { intent: 'project-structure', acknowledged: false }).reason, 'DEMO_ACKNOWLEDGMENT_REQUIRED');
});

test('accepted intent reaches human-review-pending without persistence or external side effects', async () => {
  const started = openInterest(createInterestFlow());
  const result = submitInterest(started, { intent: 'agricultural-follow-up', acknowledged: true });
  assert.equal(result.ok, true);
  assert.deepEqual(result.state, {
    step: 'confirmation',
    status: 'simulated',
    intent: 'agricultural-follow-up',
    review: 'human-review-pending',
  });
  assert.equal(submitInterest(result.state, { intent: 'human-conversation', acknowledged: true }).state, result.state);
  assert.deepEqual(resetInterestFlow(), createInterestFlow());
});

test('accessible screen states avoid real contact fields and disclose the synthetic, non-persistent action', async () => {
  const html = await read('index.html');
  const app = await read('app.mjs');
  const styles = await read('styles.css');
  assert.match(html, /<main\b/);
  assert.match(html, /aria-live|role="alert"/);
  assert.match(html, /name="interest-intent"/);
  assert.doesNotMatch(html, /type="(?:email|password|file)"|name="(?:email|full-name|phone|document)"/i);
  assert.match(html, /no se envían ni se guardan datos/i);
  assert.match(html, /nada se transmite a un servidor/i);
  assert.match(app, /validateProjection/);
  assert.match(app, /fetch\('\.\/project-projection-v1\.json'/);
  assert.doesNotMatch(app, /localStorage|sessionStorage|fetch\(['"]https?:/i);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /max-width: 820px/);
  assert.match(styles, /max-width: 560px/);
});
