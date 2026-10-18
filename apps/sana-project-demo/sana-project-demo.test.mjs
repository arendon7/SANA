import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProjection } from '../sana-project-read/reader-v1.mjs';
import { createInterestFlow, openInterest, resetInterestFlow, submitInterest } from './interest-flow.mjs';
import { displayProjectField, validateDossier } from './project-dossier.mjs';
import { projectionDisplayPolicy } from './presentation-policy.mjs';
import { clearParticipantSession, createParticipantSession, recordSimulatedInterest } from './participant-session.mjs';

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

test('project dossier presents a fully synthetic, arithmetically consistent case without calling it a real offer', async () => {
  const dossier = JSON.parse(await read('project-dossier-v1.json'));
  const checked = validateDossier(dossier, 'sana-demo-project-001');
  assert.equal(checked.ok, true);
  assert.equal(dossier.status, 'SYNTHETIC');
  assert.match(dossier.promoter.value, /ficticio/i);
  assert.match(dossier.property.value, /ficticio/i);
  assert.equal(dossier.areaHa.value, 1.8);
  assert.equal(dossier.plantCount.value, 1980);
  assert.equal(dossier.capitalNeed.amount, 48000000);
  assert.equal(dossier.capitalNeed.useOfFunds.reduce((sum, row) => sum + row.amount, 0), 48000000);
  assert.equal(dossier.productionEstimate.quantity, 1530);
  assert.equal(dossier.productionEstimate.basis.areaHa * dossier.productionEstimate.basis.yieldKgPerHa, 1530);
  assert.equal(dossier.economicScenario.grossSales, 22950000);
  assert.equal(dossier.economicScenario.operatingSurplus, 10950000);
  assert.equal(dossier.netUtilityEstimate.amount, null);
  assert.equal(displayProjectField(dossier.productionEstimate, 'Sin modelo validado'), '1.530 kg de cacao seco/año');
  assert.equal(dossier.portfolio.status, 'PLANNED');
});

test('synthetic dossier rejects inconsistent capital or economic arithmetic', async () => {
  const dossier = JSON.parse(await read('project-dossier-v1.json'));
  const badCapital = { ...dossier, capitalNeed: { ...dossier.capitalNeed, amount: 49000000 } };
  const badProjection = { ...dossier, productionEstimate: { ...dossier.productionEstimate, quantity: 1600 } };
  assert.equal(validateDossier(badCapital, 'sana-demo-project-001').reason, 'SYNTHETIC_MODEL_INCONSISTENT');
  assert.equal(validateDossier(badProjection, 'sana-demo-project-001').reason, 'SYNTHETIC_MODEL_INCONSISTENT');
});

test('dossier rejects a mismapped project or data not marked synthetic', async () => {
  const dossier = JSON.parse(await read('project-dossier-v1.json'));
  assert.equal(validateDossier({ ...dossier, projectRef: 'other-project' }, 'sana-demo-project-001').reason, 'PROJECT_UNMAPPED');
  assert.equal(validateDossier({ ...dossier, status: 'REAL' }, 'sana-demo-project-001').reason, 'NOT_SYNTHETIC');
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

test('stale AgroWay projection is hidden until a fresh approved read is available', async () => {
  const fixture = await loadFixture();
  const checked = await validateProjection({
    ...fixture,
    freshness: { ...fixture.freshness, status: 'STALE' },
  }, { expectedSanaProjectRef: 'sana-demo-project-001', now: Date.parse(fixture.generatedAt) });
  assert.equal(checked.ok, true);
  assert.equal(projectionDisplayPolicy(checked.model).state, 'STALE');
  assert.equal(projectionDisplayPolicy(checked.model).showSummary, false);
  assert.deepEqual(projectionDisplayPolicy({ ...checked.model, freshness: { ...checked.model.freshness, status: 'FRESH' } }), { state: 'FRESH', showSummary: true });
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

test('simulated interest appears in Mi espacio only in volatile session state', () => {
  const empty = createParticipantSession();
  assert.deepEqual(empty.simulatedInterests, []);
  const first = recordSimulatedInterest(empty, {
    projectRef: 'sana-demo-project-001',
    projectTitle: 'Cacao bajo sombra',
    intent: 'agricultural-follow-up',
  });
  assert.equal(first.ok, true);
  assert.equal(first.item.status, 'SIMULATED_HUMAN_REVIEW');
  assert.equal(first.state.simulatedInterests.length, 1);
  assert.equal(first.state.simulatedInterests[0].projectTitle, 'Cacao bajo sombra');
  const invalid = recordSimulatedInterest(first.state, {
    projectRef: 'sana-demo-project-001',
    projectTitle: 'Cacao bajo sombra',
    intent: 'invest-now',
  });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.reason, 'INTENT_REQUIRED');
  const replaced = recordSimulatedInterest(first.state, {
    projectRef: 'sana-demo-project-001',
    projectTitle: 'Cacao bajo sombra',
    intent: 'project-structure',
  });
  assert.equal(replaced.state.simulatedInterests.length, 1);
  assert.equal(replaced.state.simulatedInterests[0].intent, 'project-structure');
  assert.deepEqual(clearParticipantSession().simulatedInterests, []);
});

test('accessible screen states avoid real contact fields and disclose the synthetic, non-persistent action', async () => {
  const html = await read('index.html');
  const app = await read('app.mjs');
  const styles = await read('styles.css');
  const design = await read('DESIGN.md');
  const policy = await read('presentation-policy.mjs');
  assert.match(html, /<main\b/);
  assert.match(html, /id="explore-view"[^>]*aria-labelledby="explore-title"/);
  assert.match(html, /id="open-project-card"/);
  assert.match(html, /id="participant-view"[^>]*aria-labelledby="space-title"/);
  assert.match(html, /Sin proyectos asociados/);
  assert.match(html, /id="empty-space"/);
  assert.match(html, /id="session-space"/);
  assert.match(await read('server.mjs'), /participant-session\.mjs/);
  assert.match(app, /Nadie recibió esta selección/);
  assert.match(html, /commitments|Compromisos revisados/);
  assert.match(html, /aria-live|role="alert"/);
  assert.match(html, /id="source-status"[^>]*aria-live="polite"/);
  assert.match(html, /name="interest-intent"/);
  assert.doesNotMatch(html, /type="(?:email|password|file)"|name="(?:email|full-name|phone|document)"/i);
  assert.match(html, /mi selección no equivale a una solicitud o inversión/i);
  assert.match(html, /no llega a un servidor/i);
  assert.match(html, /Capital, producción y límites del modelo/);
  assert.match(html, /no son parámetros técnicos validados|no es un benchmark agronómico/i);
  assert.match(html, /Excedente operativo/);
  assert.match(html, /Diseño previsto/);
  assert.match(html, /Lecturas autorizadas/);
  assert.match(design, /Do not inherit GREENATICS website layouts/);
  assert.match(design, /catálogo editorial|project discovery/i);
  assert.match(app, /validateProjection/);
  assert.match(app, /fetch\('\.\/project-projection-v1\.json'/);
  assert.match(app, /fetch\('\.\/project-dossier-v1\.json'/);
  assert.match(app, /projectionDisplayPolicy\(model\)/);
  assert.match(app, /searchParams\.set\('view', step\)/);
  assert.match(app, /allocation-width/);
  assert.match(policy, /STALE.*showSummary: false/);
  assert.doesNotMatch(app, /localStorage|sessionStorage|fetch\(['"]https?:/i);
  assert.doesNotMatch(await read('participant-session.mjs'), /localStorage|sessionStorage|fetch\(/i);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /max-width: 1020px/);
  assert.match(styles, /max-width: 760px/);
  assert.match(styles, /scroll-margin-top/);
});
