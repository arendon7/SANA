import { validateProjection } from '../sana-project-read/reader-v1.mjs';
import { createInterestFlow, openInterest, resetInterestFlow, submitInterest } from './interest-flow.mjs';
import { displayProjectField, validateDossier } from './project-dossier.mjs';
import { projectionDisplayPolicy } from './presentation-policy.mjs';

const PROJECT_REF = 'sana-demo-project-001';
const elements = {
  project: document.querySelector('#project-view'),
  interest: document.querySelector('#interest-view'),
  confirmation: document.querySelector('#confirmation-view'),
  projectTitle: document.querySelector('#project-title'),
  interestTitle: document.querySelector('#interest-title'),
  confirmationTitle: document.querySelector('#confirmation-title'),
  projectProfileStatus: document.querySelector('#project-profile-status'),
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

function showView(step, { focus = false } = {}) {
  elements.project.hidden = step !== 'project';
  elements.interest.hidden = step !== 'interest';
  elements.confirmation.hidden = step !== 'confirmation';
  if (focus) {
    const heading = step === 'interest'
      ? elements.interestTitle
      : step === 'confirmation'
        ? elements.confirmationTitle
        : elements.projectTitle;
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

function formatCop(value) {
  return value === null || value === undefined ? 'No calculado' : `COP ${new Intl.NumberFormat('es-CO').format(value)}`;
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

function renderDossier(profile) {
  elements.projectTitle.textContent = profile.title;
  document.querySelector('#profile-title').textContent = profile.title;
  document.querySelector('#project-summary').textContent = profile.summary;
  document.querySelector('#profile-promoter').textContent = displayProjectField(profile.promoter, 'Dato no incluido');
  document.querySelector('#profile-property').textContent = displayProjectField(profile.property, 'Predio no informado');
  document.querySelector('#profile-location').textContent = displayProjectField(profile.location, 'No informada');
  document.querySelector('#profile-area').textContent = displayProjectField(profile.areaHa, 'No aportada');
  document.querySelector('#profile-plants').textContent = displayProjectField(profile.plantCount, 'No informadas');

  const capital = profile.capitalNeed;
  const production = profile.productionEstimate;
  const economics = profile.economicScenario;
  document.querySelector('#profile-capital').textContent = formatCop(capital.amount);
  document.querySelector('#panel-capital').textContent = formatCop(capital.amount);
  document.querySelector('#capital-period').textContent = capital.period;
  document.querySelector('#profile-production').textContent = `${formatCount(production.quantity)} ${production.unit} · ${production.period}`;
  document.querySelector('#production-basis').textContent = `${new Intl.NumberFormat('es-CO').format(production.basis.areaHa)} ha × ${new Intl.NumberFormat('es-CO').format(production.basis.yieldKgPerHa)} kg/ha/año = ${formatCount(production.quantity)} kg/año · supuesto didáctico`;
  document.querySelector('#price-per-kg').textContent = `${formatCop(economics.pricePerKg)}/kg`;
  document.querySelector('#gross-sales').textContent = `${formatCop(economics.grossSales)}/año`;
  document.querySelector('#operating-costs').textContent = `${formatCop(economics.operatingCosts)}/año`;
  document.querySelector('#operating-surplus').textContent = `${formatCop(economics.operatingSurplus)}/año`;
  document.querySelector('#profile-utility').textContent = displayProjectField(profile.netUtilityEstimate, 'No calculada');

  const fundsList = document.querySelector('#capital-use-list');
  fundsList.replaceChildren();
  capital.useOfFunds.forEach((allocation) => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = allocation.label;
    const amount = document.createElement('strong');
    amount.textContent = formatCop(allocation.amount);
    item.append(label, amount);
    fundsList.append(item);
  });
}

function humanizeMilestone(value) {
  const labels = new Map([
    ['CROP_CYCLE_ACTIVE', 'Ciclo agrícola iniciado'],
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
  title.textContent = humanizeMilestone(milestone.kind);
  const status = document.createElement('span');
  status.textContent = 'Evento observado en la proyección sintética';
  item.append(date, title, status);
  list.append(item);
}

function renderProjection(input, model) {
  const policy = projectionDisplayPolicy(model);
  if (!policy.showSummary) {
    elements.sourceStatus.className = 'data-state data-state--stale';
    elements.sourceStatus.dataset.state = 'stale';
    elements.sourceStatus.textContent = 'Lectura vencida';
    elements.readLoading.hidden = true;
    elements.readContent.hidden = true;
    elements.readError.textContent = `La lectura AgroWay de ${formatDate(input.sourceAsOf)} superó su vigencia. Se ocultan sus cifras e hitos hasta recibir una actualización fresca.`;
    elements.readError.hidden = false;
    return;
  }
  const harvest = model.summary.harvest;
  const harvestText = harvest.quantity === null || harvest.unit === null
    ? 'Sin dato disponible'
    : `${formatCount(harvest.quantity)} ${harvest.unit}`;
  document.querySelector('#tasks-done').textContent = formatCount(model.summary.tasks.done);
  document.querySelector('#alerts-open').textContent = formatCount(model.summary.alerts.open);
  document.querySelector('#harvest-summary').textContent = harvestText;
  const cycle = input.cycle;
  document.querySelector('#cycle-label').textContent = `${cycle.crop[0].toUpperCase()}${cycle.crop.slice(1)} · ${cycle.state === 'ACTIVE' ? 'ciclo activo' : 'estado no disponible'}`;
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
  elements.sourceStatus.className = 'data-state data-state--synthetic';
  elements.sourceStatus.dataset.state = 'fresh';
  elements.sourceStatus.textContent = 'Lectura aprobada para demo';
  elements.readLoading.hidden = true;
  elements.readError.hidden = true;
  elements.readContent.hidden = false;
}

async function loadDossier() {
  try {
    const response = await fetch('./project-dossier-v1.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('DOSSIER_UNAVAILABLE');
    const profile = await response.json();
    const checked = validateDossier(profile, PROJECT_REF);
    if (!checked.ok) throw new Error(checked.reason);
    renderDossier(checked.model);
  } catch {
    elements.projectProfileStatus.dataset.state = 'error';
    elements.projectProfileStatus.textContent = 'Ficha de muestra no disponible';
    elements.projectProfileStatus.classList.add('data-state--error');
  }
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
    elements.sourceStatus.className = 'data-state data-state--error';
    elements.sourceStatus.dataset.state = 'error';
    elements.sourceStatus.textContent = 'Lectura no disponible';
    elements.readLoading.hidden = true;
    elements.readError.hidden = false;
    elements.readContent.hidden = true;
  }
}

function intentLabel(value) {
  return new Map([
    ['project-structure', 'La estructura del proyecto'],
    ['agricultural-follow-up', 'El seguimiento agrícola'],
    ['human-conversation', 'Una conversación con el equipo'],
  ]).get(value) ?? 'Motivo no disponible';
}

document.querySelectorAll('#open-interest, #open-interest-secondary, #open-interest-panel').forEach((button) => button.addEventListener('click', openInterestView));
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

loadDossier();
loadProjection();
