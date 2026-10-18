import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProjection } from '../sana-project-read/reader-v1.mjs';
import { createInterestFlow, openInterest, resetInterestFlow, submitInterest } from './interest-flow.mjs';
import { createSyntheticDueDiligence, displayProjectField, validateDossier } from './project-dossier.mjs';
import { projectionDisplayPolicy } from './presentation-policy.mjs';
import { clearParticipantSession, createParticipantSession, recordSimulatedCommitment, recordSimulatedInterest, simulateHumanReview } from './participant-session.mjs';
import { createParticipantFieldReading } from './participant-field-reading.mjs';
import { validateProjectCatalog } from './project-catalog.mjs';

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

test('project story shows a synthetic plan without implying completed field activity', async () => {
  for (const filename of ['project-dossier-v1.json', 'project-dossier-002-v1.json']) {
    const dossier = JSON.parse(await read(filename));
    assert.equal(dossier.projectPlan.status, 'SYNTHETIC_VALUE');
    assert.ok(dossier.projectPlan.objective);
    assert.equal(dossier.projectPlan.phases.length, 3);
    assert.ok(dossier.projectPlan.phases.every((phase) => phase.name && phase.description && phase.timeframe));
    const invalidPlan = JSON.parse(JSON.stringify(dossier));
    invalidPlan.projectPlan.phases[0].timeframe = '';
    assert.equal(validateDossier(invalidPlan, dossier.projectRef).reason, 'PROJECT_PLAN_INVALID');
  }
  const html = await read('index.html');
  const app = await read('app.mjs');
  assert.match(html, /Cómo se desarrollaría el proyecto/);
  assert.match(html, /no describen actividades realizadas/);
  assert.match(app, /renderProjectPlan\(profile\.projectPlan\)/);
  assert.match(app, /timeframe\.textContent = phase\.timeframe/);
});

test('synthetic due diligence lists evidence to request without scoring or implying review', () => {
  for (const projectRef of ['sana-demo-project-001', 'sana-demo-project-002']) {
    const checklist = createSyntheticDueDiligence(projectRef);
    assert.equal(checklist.projectRef, projectRef);
    assert.equal(checklist.status, 'SYNTHETIC');
    assert.equal(checklist.overallStatus, 'NOT_ASSESSED');
    assert.equal(checklist.topics.length, 6);
    assert.equal(new Set(checklist.topics.map(({ id }) => id)).size, checklist.topics.length);
    assert.ok(checklist.topics.every((topic) => topic.status === 'NOT_ASSESSED'));
    assert.ok(checklist.topics.every((topic) => topic.question && topic.evidenceNeeded));
    assert.doesNotMatch(JSON.stringify(checklist), /score|riskRating|mitigation|approved/i);
    assert.equal(Object.isFrozen(checklist), true);
    assert.equal(Object.isFrozen(checklist.topics), true);
  }
  assert.throws(() => createSyntheticDueDiligence('../private-project'), /PROJECT_REF_INVALID/);
});

test('catalog binds each synthetic project to its own dossier and approved AgroWay projection', async () => {
  const catalog = JSON.parse(await read('project-catalog-v1.json'));
  const checkedCatalog = validateProjectCatalog(catalog);
  assert.equal(checkedCatalog.ok, true);
  assert.equal(catalog.projects.length, 2);
  assert.equal(new Set(catalog.projects.map((project) => project.projectRef)).size, 2);
  assert.equal(new Set(catalog.projects.map((project) => project.projectionPath)).size, 2);
  for (const entry of catalog.projects) {
    const dossier = JSON.parse(await read(entry.dossierPath.slice(2)));
    const checkedDossier = validateDossier(dossier, entry.projectRef);
    assert.equal(checkedDossier.ok, true, entry.projectRef);
    assert.equal(dossier.status, 'SYNTHETIC');
    const projection = JSON.parse(await read(entry.projectionPath.slice(2)));
    const checkedProjection = await validateProjection(projection, { expectedSanaProjectRef: entry.projectRef });
    assert.equal(checkedProjection.ok, true, entry.projectRef);
    assert.equal(projection.projectMapping.sanaProjectRef, entry.projectRef);
  }
  const second = JSON.parse(await read('project-dossier-002-v1.json'));
  assert.equal(second.crop.value, 'Café');
  assert.equal(second.areaHa.value, 2.4);
  assert.equal(second.plantCount.value, 4320);
  assert.equal(second.capitalNeed.amount, 56000000);
  assert.equal(second.productionEstimate.quantity, 1920);
  assert.equal(second.economicScenario.operatingSurplus, 21000000);
  assert.equal(second.netUtilityEstimate.amount, null);
});

test('catalog rejects project injection targets and duplicate fixture paths', () => {
  const catalog = {
    schema: 'sana.project-catalog/1.0.0', status: 'SYNTHETIC', defaultProjectRef: 'sana-demo-project-001',
    projects: [
      { projectRef: 'sana-demo-project-001', dossierPath: './project-dossier-v1.json', projectionPath: './project-projection-v1.json' },
      { projectRef: 'sana-demo-project-002', dossierPath: '../private.json', projectionPath: './project-projection-002-v1.json' },
    ],
  };
  assert.equal(validateProjectCatalog(catalog).reason, 'DOSSIER_PATH_INVALID');
  catalog.projects[1].dossierPath = './project-dossier-v1.json';
  assert.equal(validateProjectCatalog(catalog).reason, 'DOSSIER_PATH_DUPLICATED');
  catalog.projects[1].dossierPath = './project-dossier-002-v1.json';
  catalog.projects[1].projectionPath = './project-projection-v1.json';
  assert.equal(validateProjectCatalog(catalog).reason, 'PROJECTION_PATH_DUPLICATED');
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

test('Mi espacio shows a fresh read-only AgroWay summary for each linked synthetic project', async () => {
  const catalog = JSON.parse(await read('project-catalog-v1.json'));
  for (const entry of catalog.projects) {
    const fixture = JSON.parse(await read(entry.projectionPath.slice(2)));
    const checked = await validateProjection(fixture, {
      expectedSanaProjectRef: entry.projectRef,
      now: Date.parse(fixture.generatedAt) + 60 * 60 * 1000,
    });
    const reading = createParticipantFieldReading(checked);
    assert.equal(reading.state, 'FRESH', entry.projectRef);
    assert.equal(reading.summary.cycleState, 'ACTIVE');
    assert.equal(reading.summary.harvest.quantity, fixture.summary.harvest.quantity);
    assert.equal(reading.summary.harvest.unit, fixture.summary.harvest.unit);
    assert.equal(Object.isFrozen(reading.summary), true);
  }
});

test('Mi espacio hides stale or unapproved readings and preserves unknown quantities', async () => {
  const fixture = await loadFixture();
  const stale = await validateProjection({
    ...fixture,
    freshness: { ...fixture.freshness, status: 'STALE' },
  }, { expectedSanaProjectRef: 'sana-demo-project-001', now: Date.parse(fixture.generatedAt) });
  assert.equal(createParticipantFieldReading(stale).state, 'STALE');
  assert.equal(createParticipantFieldReading(stale).summary, null);
  assert.deepEqual(createParticipantFieldReading({ ok: false, model: null }).summary, null);

  const partial = await validateProjection({
    ...fixture,
    completeness: { tasks: 'PARTIAL', alerts: 'PARTIAL', harvest: 'PARTIAL' },
    summary: {
      tasks: { ...fixture.summary.tasks, done: null },
      alerts: { ...fixture.summary.alerts, open: null },
      harvest: { status: 'UNKNOWN', lotCount: null, quantity: null, unit: null },
    },
  }, { expectedSanaProjectRef: 'sana-demo-project-001', now: Date.parse(fixture.generatedAt) });
  assert.equal(partial.ok, true);
  const reading = createParticipantFieldReading(partial);
  assert.equal(reading.summary.tasks.done, null);
  assert.equal(reading.summary.alerts.open, null);
  assert.equal(reading.summary.harvest.quantity, null);
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
  const second = recordSimulatedInterest(first.state, {
    projectRef: 'sana-demo-project-002',
    projectTitle: 'Café de ladera y poscosecha comunitaria',
    intent: 'project-structure',
  });
  assert.equal(second.ok, true);
  assert.equal(second.state.simulatedInterests.length, 2);
  assert.deepEqual(second.state.simulatedInterests.map((item) => item.projectRef), ['sana-demo-project-001', 'sana-demo-project-002']);
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

test('SANA demo keeps review and commitment stages synthetic, ordered, and isolated by project', () => {
  let session = createParticipantSession();
  for (const [projectRef, projectTitle] of [
    ['sana-demo-project-001', 'Cacao bajo sombra'],
    ['sana-demo-project-002', 'Café de ladera y poscosecha comunitaria'],
  ]) {
    const result = recordSimulatedInterest(session, { projectRef, projectTitle, intent: 'project-structure' });
    assert.equal(result.ok, true);
    session = result.state;
  }

  const premature = recordSimulatedCommitment(session, { projectRef: 'sana-demo-project-001', amount: 1_000_000 });
  assert.equal(premature.ok, false);
  assert.equal(premature.reason, 'SIMULATED_REVIEW_REQUIRED');
  assert.equal(simulateHumanReview(session, 'unknown-project').reason, 'PROJECT_NOT_TRACKED');

  const reviewed = simulateHumanReview(session, 'sana-demo-project-001');
  assert.equal(reviewed.ok, true);
  assert.equal(reviewed.item.reviewStatus, 'SIMULATED_CONTINUE');
  assert.equal(reviewed.state.simulatedInterests[1].reviewStatus, 'PENDING');
  assert.equal(simulateHumanReview(reviewed.state, 'sana-demo-project-001').reason, 'REVIEW_ALREADY_SIMULATED');

  const invalidAmount = recordSimulatedCommitment(reviewed.state, { projectRef: 'sana-demo-project-001', amount: 1 });
  assert.equal(invalidAmount.reason, 'SAMPLE_AMOUNT_INVALID');
  const committed = recordSimulatedCommitment(reviewed.state, { projectRef: 'sana-demo-project-001', amount: 1_000_000 });
  assert.equal(committed.ok, true);
  assert.deepEqual(committed.item.commitment, { amount: 1_000_000, currency: 'COP', status: 'SAMPLE_ONLY' });
  assert.equal(committed.state.simulatedInterests[1].commitment, null);
  assert.equal(Object.isFrozen(committed.state.simulatedInterests[0].commitment), true);
  assert.equal(recordSimulatedCommitment(committed.state, { projectRef: 'sana-demo-project-001', amount: 1_000_000 }).reason, 'COMMITMENT_ALREADY_SIMULATED');
  assert.deepEqual(clearParticipantSession().simulatedInterests, []);
});

test('accessible screen states avoid real contact fields and disclose the synthetic, non-persistent action', async () => {
  const html = await read('index.html');
  const app = await read('app.mjs');
  const styles = await read('styles.css');
  const design = await read('DESIGN.md');
  const policy = await read('presentation-policy.mjs');
  const server = await read('server.mjs');
  assert.match(html, /<main\b/);
  assert.match(html, /id="explore-view"[^>]*aria-labelledby="explore-title"/);
  assert.match(html, /id="open-project-card"/);
  assert.match(html, /project-compare-grid/);
  assert.match(html, /id="catalog-surplus"/);
  assert.match(html, /Conoce el proyecto detrás de cada cultivo/);
  assert.match(html, /Explorar proyectos de muestra/);
  assert.match(html, /aria-label="Secciones de la ficha del proyecto"/);
  assert.match(html, /id="profile-production-quick"/);
  for (const anchor of ['project-structure', 'capital-model', 'due-diligence', 'field-reading', 'participant-space']) {
    assert.match(html, new RegExp(`href="#${anchor}"`));
    assert.match(html, new RegExp(`id="${anchor}"`));
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size, 'HTML views must not duplicate element IDs');
  assert.match(html, /persona productora, el predio asociado y la escala del cultivo/);
  assert.match(html, /No se envió al equipo, no crea una solicitud ni representa una inversión/);
  assert.match(html, /id="participant-view"[^>]*aria-labelledby="space-title"/);
  assert.match(html, /El seguimiento de cada proyecto vive aquí/);
  assert.match(html, /Aquí empieza tu seguimiento/);
  assert.match(html, /id="empty-space"/);
  assert.match(html, /id="session-space"/);
  assert.match(server, /participant-session\.mjs/);
  assert.match(app, /Nadie la recibió/);
  assert.match(html, /id="session-overview"/);
  assert.match(html, /id="session-project-count"/);
  assert.match(html, /id="session-reading-count"/);
  assert.match(html, /id="session-commitment-count"/);
  assert.match(html, /Compromisos ficticios/);
  assert.match(app, /Simular revisión humana/);
  assert.match(app, /Simular compromiso ficticio/);
  assert.match(app, /no hay pago ni conciliación registrados/i);
  assert.match(app, /simulateHumanReview/);
  assert.match(app, /recordSimulatedCommitment/);
  assert.doesNotMatch(app, /localStorage/);
  assert.match(html, /aria-live|role="alert"/);
  assert.match(html, /id="source-status"[^>]*aria-live="polite"/);
  assert.match(html, /name="interest-intent"/);
  assert.doesNotMatch(html, /type="(?:email|password|file)"|name="(?:email|full-name|phone|document)"/i);
  assert.match(html, /mi selección no equivale a una solicitud o inversión/i);
  assert.match(html, /no llega a un servidor/i);
  assert.match(html, /Qué falta comprobar antes de decidir/);
  assert.match(html, /seis áreas permanecen sin evaluar/);
  assert.match(app, /createSyntheticDueDiligence/);
  assert.match(app, /project-shelf-row__art/);
  assert.match(app, /project-shelf-row__disclosure/);
  assert.match(app, /profile\.economicScenario\.operatingSurplus/);
  assert.match(app, /Plantas asociadas/);
  assert.match(app, /Excedente operativo/);
  assert.match(styles, /\.project-compare-grid/);
  assert.match(app, /Evidencia por solicitar/);
  assert.match(app, /createElement\('details'\)/);
  assert.match(app, /profile-production-quick/);
  assert.match(styles, /data-state--unassessed/);
  assert.match(html, /En qué se usaría y qué podría producir/);
  assert.match(html, /no un pronóstico ni una promesa/i);
  assert.match(html, /Excedente operativo/);
  assert.match(html, /De conocerlo a acompañar su avance/);
  assert.match(html, /Ensayo de revisión y consulta de material disponible/);
  assert.match(html, /lectura AgroWay por proyecto/);
  assert.match(design, /Do not inherit GREENATICS website layouts/);
  assert.match(design, /catálogo editorial|project discovery/i);
  assert.match(app, /validateProjection/);
  assert.match(app, /validateProjectCatalog/);
  assert.match(app, /catalog\.projects\.find/);
  assert.match(app, /entry\.projectionPath/);
  assert.match(app, /entry\.dossierPath/);
  assert.match(html, /id="catalog-project-list"/);
  assert.match(html, /id="catalog-count"/);
  assert.match(app, /projectionDisplayPolicy\(model\)/);
  assert.match(app, /renderParticipantFieldReading/);
  assert.match(server, /participant-field-reading\.mjs/);
  assert.match(app, /searchParams\.set\('view', step\)/);
  assert.match(app, /allocation-width/);
  assert.match(policy, /STALE.*showSummary: false/);
  assert.doesNotMatch(app, /localStorage|sessionStorage|fetch\(['"]https?:/i);
  assert.doesNotMatch(app, /innerHTML/);
  assert.doesNotMatch(await read('participant-session.mjs'), /localStorage|sessionStorage|fetch\(/i);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /max-width: 1020px/);
  assert.match(styles, /max-width: 760px/);
  assert.match(styles, /scroll-margin-top/);
});
