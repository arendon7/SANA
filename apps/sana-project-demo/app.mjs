import { validateProjection } from '../sana-project-read/reader-v1.mjs';
import { createInterestFlow, openInterest, resetInterestFlow, submitInterest } from './interest-flow.mjs';

const PROJECT_REF = 'sana-demo-project-001';
const elements = {
  project: document.querySelector('#project-view'),
  interest: document.querySelector('#interest-view'),
  confirmation: document.querySelector('#confirmation-view'),
  interestTitle: document.querySelector('#interest-title'),
  confirmationTitle: document.querySelector('#confirmation-title'),
  sourceStatus: document.querySelector('#source-status'),
  readLoading: document.querySelector('#read-loading'),
  readError: document.querySelector('#read-error'),
  readContent: document.querySelector('#read-content'),
  formError: document.querySelector('#form-error'),
  ackError: document.querySelector('#ack-error'),
  fieldset: document.querySelector('#intent-fieldset'),
  acknowledgment: document.querySelector('#demo-acknowledgment'),
  confirmedIntent: document.querySelector('#confirmed-intent'),
};
let flow = createInterestFlow();

function updateJourney(step) {
  document.querySelectorAll('[data-step]').forEach((node) => {
    const active = node.dataset.step === step;
    node.classList.toggle('is-active', active);
    if (active) node.setAttribute('aria-current', 'step');
    else node.removeAttribute('aria-current');
  });
}

function showView(step, { focus = false } = {}) {
  elements.project.hidden = step !== 'project';
  elements.interest.hidden = step !== 'interest';
  elements.confirmation.hidden = step !== 'confirmation';
  updateJourney(step === 'confirmation' ? 'interest' : step);
  if (focus) {
    const heading = step === 'interest' ? elements.interestTitle : step === 'confirmation' ? elements.confirmationTitle : document.querySelector('#project-title');
    heading.focus();
  }
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function openInterestView() {
  flow = openInterest(flow);
  showView('interest', { focus: true });
}

function formatCount(value) {
  return value === null || value === undefined ? 'Sin dato disponible' : new Intl.NumberFormat('es-CO').format(value);
}

function formatDate(value, { dateOnly = false } = {}) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    ...(dateOnly ? {} : { timeStyle: 'short' }),
    timeZone: 'America/Bogota',
  }).format(date);
}

function humanize(value) {
  const labels = new Map([
    ['CROP_CYCLE_ACTIVE', 'Ciclo agrícola activo'],
    ['FIELD_TASK_DONE', 'Labor completada'],
  ]);
  return labels.get(value) ?? 'Actualización agrícola';
}

function appendMilestone(list, milestone) {
  const item = document.createElement('li');
  const date = document.createElement('time');
  date.dateTime = milestone.occurredAt;
  date.textContent = formatDate(milestone.occurredAt, { dateOnly: true });
  const title = document.createElement('strong');
  title.textContent = humanize(milestone.kind);
  const status = document.createElement('span');
  status.textContent = 'Incluido en la muestra sintética';
  item.append(date, title, status);
  list.append(item);
}

function renderProjection(input, model) {
  const harvest = model.summary.harvest;
  const harvestText = harvest.quantity === null || harvest.unit === null
    ? 'Sin dato disponible'
    : `${formatCount(harvest.quantity)} ${harvest.unit}`;
  document.querySelector('#tasks-done').textContent = formatCount(model.summary.tasks.done);
  document.querySelector('#alerts-open').textContent = formatCount(model.summary.alerts.open);
  document.querySelector('#harvest-summary').textContent = harvestText;
  const milestoneList = document.querySelector('#milestones-list');
  milestoneList.replaceChildren();
  if (model.milestones.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Esta proyección no contiene hitos aprobados para mostrar.';
    milestoneList.append(empty);
  } else {
    model.milestones.forEach((milestone) => appendMilestone(milestoneList, milestone));
  }
  const sourceDate = formatDate(input.sourceAsOf);
  const generatedDate = formatDate(input.generatedAt);
  document.querySelector('#source-provenance').textContent = `Fuente: AgroWay FIELD · contrato de lectura v1 · solo datos sintéticos. Actualización de origen: ${sourceDate}. Proyección preparada: ${generatedDate}.`;
  elements.sourceStatus.dataset.state = model.freshness.status === 'FRESH' ? 'fresh' : 'stale';
  elements.sourceStatus.textContent = model.freshness.status === 'FRESH' ? 'Lectura dentro del plazo de demo' : 'Lectura de demo antigua';
  elements.readLoading.hidden = true;
  elements.readError.hidden = true;
  elements.readContent.hidden = false;
}

async function loadProjection() {
  try {
    const response = await fetch('./project-projection-v1.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('FIXTURE_UNAVAILABLE');
    const input = await response.json();
    const checked = await validateProjection(input, { expectedSanaProjectRef: PROJECT_REF });
    if (!checked.ok) throw new Error('FIXTURE_NOT_APPROVED');
    renderProjection(input, checked.model);
  } catch {
    elements.sourceStatus.dataset.state = 'error';
    elements.sourceStatus.textContent = 'Lectura no disponible';
    elements.readLoading.hidden = true;
    elements.readError.hidden = false;
    elements.readContent.hidden = true;
  }
}

function intentLabel(value) {
  return new Map([
    ['project-structure', 'Conocer cómo se estructura'],
    ['agricultural-follow-up', 'Explorar el seguimiento agrícola'],
    ['human-conversation', 'Solicitar una conversación de ejemplo'],
  ]).get(value) ?? 'Motivo no disponible';
}

document.querySelectorAll('#open-interest, #open-interest-secondary').forEach((button) => button.addEventListener('click', openInterestView));
document.querySelectorAll('#back-to-project, #cancel-interest').forEach((button) => button.addEventListener('click', () => showView('project', { focus: true })));
document.querySelector('#interest-form').addEventListener('change', (event) => {
  if (event.target.name === 'interest-intent') elements.formError.hidden = true;
  if (event.target.id === 'demo-acknowledgment') elements.ackError.hidden = true;
});
document.querySelector('#interest-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const intent = document.querySelector('input[name="interest-intent"]:checked')?.value;
  const result = submitInterest(flow, { intent, acknowledged: elements.acknowledgment.checked });
  elements.formError.hidden = result.reason !== 'INTENT_REQUIRED';
  elements.ackError.hidden = result.reason !== 'DEMO_ACKNOWLEDGMENT_REQUIRED';
  if (!result.ok) {
    const firstMissing = result.reason === 'INTENT_REQUIRED' ? elements.fieldset.querySelector('input') : elements.acknowledgment;
    firstMissing.focus();
    return;
  }
  flow = result.state;
  elements.confirmedIntent.textContent = intentLabel(flow.intent);
  showView('confirmation', { focus: true });
});
document.querySelector('#restart-demo').addEventListener('click', () => {
  flow = resetInterestFlow();
  document.querySelector('#interest-form').reset();
  elements.formError.hidden = true;
  elements.ackError.hidden = true;
  showView('project', { focus: true });
});

loadProjection();
