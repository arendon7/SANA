import { validateProjection } from '../sana-project-read/reader-v1.mjs';
import { createInterestFlow, openInterest, resetInterestFlow, submitInterest } from './interest-flow.mjs';
import { displayProjectField, validateDossier } from './project-dossier.mjs';
import { projectionDisplayPolicy } from './presentation-policy.mjs';
import { clearParticipantSession, createParticipantSession, recordSimulatedInterest } from './participant-session.mjs';
import { createParticipantFieldReading } from './participant-field-reading.mjs';
import { validateProjectCatalog } from './project-catalog.mjs';

const elements = {
  catalog: document.querySelector('#explore-view'),
  project: document.querySelector('#project-view'),
  participant: document.querySelector('#participant-view'),
  interest: document.querySelector('#interest-view'),
  confirmation: document.querySelector('#confirmation-view'),
  navExplore: document.querySelector('#nav-explore'),
  navMethodology: document.querySelector('#nav-methodology'),
  navSpace: document.querySelector('#nav-space'),
  projectTitle: document.querySelector('#project-title'),
  exploreTitle: document.querySelector('#explore-title'),
  spaceTitle: document.querySelector('#space-title'),
  interestTitle: document.querySelector('#interest-title'),
  confirmationTitle: document.querySelector('#confirmation-title'),
  catalogCount: document.querySelector('#catalog-count'),
  catalogList: document.querySelector('#catalog-project-list'),
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
let participantSession = createParticipantSession();
let catalog;
let projectProfiles = [];
const participantFieldReadings = new Map();
let activeProject;
let selectionVersion = 0;
let catalogLoading = false;
const feedback = document.querySelector('#catalog-feedback');
const retryCatalog = document.querySelector('#retry-catalog');

function showCatalogFeedback(message, { loading = false } = {}) {
  Object.values({ catalog: elements.catalog, project: elements.project, participant: elements.participant,
    interest: elements.interest, confirmation: elements.confirmation }).forEach((view) => { view.hidden = true; });
  feedback.hidden = false;
  feedback.setAttribute('aria-busy', String(loading));
  document.querySelector('#catalog-feedback-title').textContent = loading
    ? 'Preparando los proyectos de muestra…' : 'Los proyectos no están disponibles';
  document.querySelector('#catalog-feedback-message').textContent = message;
  retryCatalog.hidden = loading;
  if (!loading) document.querySelector('#catalog-feedback-title').focus();
}

function catalogNotice(message) {
  const notice = document.querySelector('#catalog-notice');
  notice.textContent = message;
  notice.hidden = !message;
}

function showView(step, { focus = false, historyAction = 'push' } = {}) {
  const views = {
    catalog: elements.catalog,
    project: elements.project,
    participant: elements.participant,
    interest: elements.interest,
    confirmation: elements.confirmation,
  };
  if (!Object.hasOwn(views, step)) step = 'catalog';
  if (!activeProject) return;
  if (step === 'confirmation') {
    const interest = participantSession.simulatedInterests.find((item) => item.projectRef === activeProject.projectRef);
    if (!interest) step = 'project';
    else elements.confirmedIntent.textContent = intentLabel(interest.intent);
  }
  feedback.hidden = true;
  Object.entries(views).forEach(([name, view]) => { view.hidden = name !== step; });
  elements.navExplore.setAttribute('aria-current', ['catalog', 'project', 'interest', 'confirmation'].includes(step) ? 'page' : 'false');
  elements.navMethodology.setAttribute('aria-current', 'false');
  elements.navSpace.setAttribute('aria-current', step === 'participant' ? 'page' : 'false');
  if (historyAction !== 'none') {
    const url = new URL(window.location.href);
    url.searchParams.set('view', step);
    if (step === 'catalog' || !activeProject) url.searchParams.delete('project');
    else url.searchParams.set('project', activeProject.projectRef);
    url.hash = '';
    if (historyAction === 'replace') window.history.replaceState({ sanaView: step }, '', url);
    else window.history.pushState({ sanaView: step }, '', url);
  }
  if (focus) {
    const heading = ({
      catalog: elements.exploreTitle,
      project: elements.projectTitle,
      participant: elements.spaceTitle,
      interest: elements.interestTitle,
      confirmation: elements.confirmationTitle,
    })[step];
    heading?.focus();
  }
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function scrollToPublicSection(id, { updateHistory = true } = {}) {
  const target = document.getElementById(id);
  if (!target) return;
  if (updateHistory) {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'catalog');
    url.searchParams.delete('project');
    url.hash = id;
    window.history.replaceState({ sanaView: 'catalog' }, '', url);
  }
  elements.navExplore.setAttribute('aria-current', 'false');
  elements.navMethodology.setAttribute('aria-current', 'location');
  window.requestAnimationFrame(() => {
    target.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    target.querySelector('h2')?.focus({ preventScroll: true });
  });
}

function renderParticipantSpace() {
  const items = participantSession.simulatedInterests;
  const empty = document.querySelector('#empty-space');
  const sessionSpace = document.querySelector('#session-space');
  const list = document.querySelector('#session-space-list');
  const overview = document.querySelector('#session-overview');
  const readings = items.map((item) => participantFieldReadings.get(item.projectRef));
  const freshReadings = readings.filter((reading) => reading?.state === 'FRESH' && reading.summary).length;
  empty.hidden = items.length > 0;
  sessionSpace.hidden = items.length === 0;
  overview.hidden = items.length === 0;
  document.querySelector('#session-project-count').textContent = formatCount(items.length);
  document.querySelector('#session-reading-count').textContent = formatCount(freshReadings) + ' de ' + formatCount(items.length);
  list.replaceChildren();
  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'session-interest-card';
    const heading = document.createElement('div');
    heading.className = 'session-interest-card__heading';
    const copy = document.createElement('div');
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `SANA · ${item.projectRef.replace('sana-demo-project-', 'SANA-DEM-')}`;
    const title = document.createElement('h3');
    title.textContent = item.projectTitle;
    copy.append(eyebrow, title);
    const status = document.createElement('span');
    status.className = 'data-state data-state--synthetic';
    status.textContent = 'Interés ficticio · no enviado';
    heading.append(copy, status);
    const details = document.createElement('dl');
    details.className = 'session-interest-card__details';
    const reason = document.createElement('div');
    const reasonLabel = document.createElement('dt');
    reasonLabel.textContent = 'Te gustaría conocer';
    const reasonValue = document.createElement('dd');
    reasonValue.textContent = intentLabel(item.intent);
    reason.append(reasonLabel, reasonValue);
    const stage = document.createElement('div');
    const stageLabel = document.createElement('dt');
    stageLabel.textContent = 'Etapa representada';
    const stageValue = document.createElement('dd');
    stageValue.textContent = 'Revisión humana prevista · no iniciada';
    stage.append(stageLabel, stageValue);
    details.append(reason, stage);
    const profile = projectProfiles.find(({ entry }) => entry.projectRef === item.projectRef)?.profile;
    const projectFacts = document.createElement('dl');
    projectFacts.className = 'session-project-facts';
    const facts = [
      ['Cultivo', displayProjectField(profile?.crop, 'No informado')],
      ['Escala de muestra', displayProjectField(profile?.areaHa, 'Área no aportada') + ' · ' + displayProjectField(profile?.plantCount, 'Plantas no informadas')],
      ['Necesidad de muestra', formatCop(profile?.capitalNeed?.amount ?? null)],
    ];
    facts.forEach(([label, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      term.textContent = label;
      const detail = document.createElement('dd');
      detail.textContent = value;
      row.append(term, detail);
      projectFacts.append(row);
    });
    const fieldReading = renderParticipantFieldReading(participantFieldReadings.get(item.projectRef), item.projectRef);
    const disclosure = document.createElement('p');
    disclosure.className = 'session-interest-card__disclosure';
    disclosure.textContent = 'Esta selección no crea solicitud ni compromiso. Nadie la recibió; se borra al recargar o cerrar la demo.';
    const openProject = document.createElement('button');
    openProject.className = 'text-button';
    openProject.type = 'button';
    openProject.textContent = 'Abrir ficha completa ↗';
    openProject.addEventListener('click', () => selectProject(item.projectRef, 'project'));
    card.append(heading, projectFacts, details, fieldReading, disclosure, openProject);
    list.append(card);
  });
}

function renderParticipantFieldReading(reading, projectRef) {
  const section = document.createElement('section');
  section.className = 'session-field-reading';
  section.setAttribute('aria-labelledby', `field-reading-${projectRef}`);
  const title = document.createElement('h4');
  title.id = `field-reading-${projectRef}`;
  title.textContent = 'Avance agrícola asociado';
  section.append(title);

  const source = document.createElement('p');
  source.className = 'session-field-reading__source';
  if (reading?.state === 'FRESH' && reading.summary) {
    source.textContent = `AgroWay FIELD · lectura sintética de solo lectura · corte ${formatDate(reading.sourceAsOf, { dateOnly: true })}`;
    const summary = reading.summary;
    const cycleNames = { PLANNED: 'Planeado', ACTIVE: 'Activo', PAUSED: 'En pausa', CLOSED: 'Cerrado' };
    const facts = document.createElement('dl');
    facts.className = 'session-field-reading__facts';
    const taskValue = summary.tasks.done === null || summary.tasks.planned === null
      ? 'Dato incompleto'
      : `${formatCount(summary.tasks.done)} de ${formatCount(summary.tasks.planned)} completadas`;
    const alertValue = summary.alerts.open === null
      ? 'Dato incompleto'
      : `${formatCount(summary.alerts.open)} ${summary.alerts.open === 1 ? 'abierta' : 'abiertas'}`;
    let harvestValue = 'Estado sin informar';
    if (summary.harvest.status === 'RECORDED') {
      harvestValue = summary.harvest.quantity === null
        ? 'Registrada · cantidad sin informar'
        : `${formatCount(summary.harvest.quantity)} ${summary.harvest.unit ?? ''}`.trim();
    } else if (summary.harvest.status === 'NONE' && summary.completeness.harvest === 'COMPLETE') {
      harvestValue = 'Sin cosecha registrada';
    }
    const values = [
      ['Ciclo', cycleNames[summary.cycleState] ?? 'Estado sin informar'],
      ['Labores del ciclo', taskValue],
      ['Alertas abiertas', alertValue],
      ['Cosecha del ciclo', harvestValue],
    ];
    values.forEach(([label, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      term.textContent = label;
      const detail = document.createElement('dd');
      detail.textContent = value;
      row.append(term, detail);
      facts.append(row);
    });
    section.append(source, facts);
    return section;
  }

  if (reading?.state === 'STALE') {
    source.textContent = reading.sourceAsOf
      ? `La lectura venció · último corte ${formatDate(reading.sourceAsOf, { dateOnly: true })}`
      : 'La lectura aprobada está vencida.';
    const message = document.createElement('p');
    message.textContent = 'Ocultamos sus indicadores hasta contar con una actualización aprobada.';
    section.append(source, message);
    return section;
  }

  source.textContent = 'No hay una lectura AgroWay aprobada disponible en esta sesión.';
  const message = document.createElement('p');
  message.textContent = 'No mostramos cifras que no hayan pasado la validación del proyecto.';
  section.append(source, message);
  return section;
}

function updateInterestErrors(reason) {
  const intentMissing = reason === 'INTENT_REQUIRED';
  const acknowledgmentMissing = reason === 'DEMO_ACKNOWLEDGMENT_REQUIRED';
  elements.formError.hidden = !intentMissing;
  elements.ackError.hidden = !acknowledgmentMissing;
  elements.fieldset.setAttribute('aria-invalid', String(intentMissing));
  elements.fieldset.querySelectorAll('input').forEach((input) => {
    if (intentMissing) input.setAttribute('aria-describedby', 'form-error');
    else input.removeAttribute('aria-describedby');
  });
  elements.acknowledgment.setAttribute('aria-invalid', String(acknowledgmentMissing));
  if (acknowledgmentMissing) elements.acknowledgment.setAttribute('aria-describedby', 'ack-error');
  else elements.acknowledgment.removeAttribute('aria-describedby');
}

function resetInterestForm() {
  document.querySelector('#interest-form').reset();
  updateInterestErrors(null);
}

function openInterestView() {
  if (!activeProject) return;
  resetInterestForm();
  flow = openInterest(resetInterestFlow());
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
  const projectCode = profile.projectRef.replace('sana-demo-project-', 'SANA-DEM-');
  const crop = displayProjectField(profile.crop, 'Cultivo no informado');
  elements.projectTitle.textContent = profile.title;
  document.querySelector('#profile-title').textContent = profile.title;
  document.querySelector('#project-summary').textContent = profile.summary;
  document.querySelector('#catalog-title').textContent = profile.title;
  document.querySelector('#catalog-project-ref').textContent = projectCode;
  document.querySelector('#catalog-crop').textContent = crop;
  document.querySelector('#detail-crop').textContent = crop;
  document.querySelector('#detail-project-ref').textContent = projectCode;
  document.querySelector('#panel-project-ref').textContent = projectCode;
  document.querySelector('#catalog-summary').textContent = profile.summary;
  document.querySelector('#catalog-promoter').textContent = displayProjectField(profile.promoter, 'Dato no incluido');
  document.querySelector('#catalog-property').textContent = displayProjectField(profile.property, 'Predio no informado');
  document.querySelector('#profile-promoter').textContent = displayProjectField(profile.promoter, 'Dato no incluido');
  document.querySelector('#profile-promoter-detail').textContent = displayProjectField(profile.promoter, 'Dato no incluido');
  document.querySelector('#profile-property').textContent = displayProjectField(profile.property, 'Predio no informado');
  document.querySelector('#profile-property-detail').textContent = displayProjectField(profile.property, 'Predio no informado');
  document.querySelector('#profile-location').textContent = displayProjectField(profile.location, 'No informada');
  document.querySelector('#profile-crop').textContent = crop;
  document.querySelector('#profile-area').textContent = displayProjectField(profile.areaHa, 'No aportada');
  document.querySelector('#profile-plants').textContent = displayProjectField(profile.plantCount, 'No informadas');
  document.querySelectorAll('.profile-area-copy').forEach((node) => { node.textContent = displayProjectField(profile.areaHa, 'No aportada'); });
  document.querySelectorAll('.profile-plants-copy').forEach((node) => { node.textContent = displayProjectField(profile.plantCount, 'No informadas'); });
  const scale = [displayProjectField(profile.areaHa, 'Área no aportada'), displayProjectField(profile.plantCount, 'Plantas no informadas')].join(' · ');
  document.querySelector('#catalog-scale').textContent = scale;

  const capital = profile.capitalNeed;
  const production = profile.productionEstimate;
  const economics = profile.economicScenario;
  document.querySelector('#product-use-status').textContent = profile.productUse.note;
  document.querySelector('#impact-assessment-status').textContent = profile.impactAssessment.status === 'NOT_CALCULATED'
    ? `No calculado. ${profile.impactAssessment.reason} El escenario de producción no es una medición de impacto.`
    : 'Estado de impacto no disponible.';
  const formattedCapital = formatCop(capital.amount);
  document.querySelector('#profile-capital').textContent = formattedCapital;
  document.querySelector('#panel-capital').textContent = formattedCapital;
  document.querySelector('#panel-capital-copy').textContent = formattedCapital;
  document.querySelector('#catalog-capital').textContent = formattedCapital;
  document.querySelector('#capital-period').textContent = capital.period;
  document.querySelector('#capital-period-copy').textContent = capital.period;
  const formattedProduction = `${formatCount(production.quantity)} ${production.unit} · ${production.period}`;
  document.querySelector('#profile-production').textContent = formattedProduction;
  document.querySelector('#catalog-production').textContent = `${formatCount(production.quantity)} ${production.unit}`;
  document.querySelector('#catalog-production-period').textContent = production.period;
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
    label.className = 'allocation-label';
    label.textContent = allocation.label;
    const amount = document.createElement('strong');
    amount.className = 'allocation-amount';
    amount.textContent = formatCop(allocation.amount);
    const track = document.createElement('span');
    track.className = 'allocation-track';
    track.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    const ratio = capital.amount > 0 ? (allocation.amount / capital.amount) * 100 : 0;
    fill.style.setProperty('--allocation-width', `${Math.max(0, Math.min(100, ratio))}%`);
    track.append(fill);
    item.append(label, amount, track);
    fundsList.append(item);
  });
}

function renderProjectShelf(activeRef) {
  const alternatives = projectProfiles.filter(({ profile }) => profile.projectRef !== activeRef);
  elements.catalogCount.textContent = `${projectProfiles.length} ${projectProfiles.length === 1 ? 'proyecto · Ficticio' : 'proyectos · Ficticios'}`;
  elements.catalogList.replaceChildren();
  alternatives.forEach(({ profile }) => {
    const projectCode = profile.projectRef.replace('sana-demo-project-', 'SANA-DEM-');
    const row = document.createElement('article');
    row.className = 'project-shelf-row';
    const copy = document.createElement('div');
    copy.className = 'project-shelf-row__copy';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `FICHA SANA · ${projectCode} · ${displayProjectField(profile.crop, 'Cultivo')}`;
    const title = document.createElement('h3');
    title.textContent = profile.title;
    const description = document.createElement('p');
    description.textContent = profile.summary;
    copy.append(eyebrow, title, description);
    const facts = document.createElement('dl');
    facts.className = 'project-shelf-row__facts';
    [
      ['Escala', `${displayProjectField(profile.areaHa, 'Sin dato')} · ${displayProjectField(profile.plantCount, 'Sin dato')}`],
      ['Necesidad de muestra', formatCop(profile.capitalNeed.amount)],
      ['Producción estimada', `${formatCount(profile.productionEstimate.quantity)} ${profile.productionEstimate.unit}`],
    ].forEach(([label, value]) => {
      const item = document.createElement('div');
      const term = document.createElement('dt');
      term.textContent = label;
      const detail = document.createElement('dd');
      detail.textContent = value;
      item.append(term, detail);
      facts.append(item);
    });
    const open = document.createElement('button');
    open.className = 'text-button project-shelf-row__open';
    open.type = 'button';
    open.textContent = 'Abrir ficha';
    open.setAttribute('aria-label', `Abrir ficha de ${profile.title}`);
    open.addEventListener('click', () => selectProject(profile.projectRef, 'project'));
    row.append(copy, facts, open);
    elements.catalogList.append(row);
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
  const crop = displayProjectField(projectProfiles.find(({ profile }) => profile.projectRef === activeProject.projectRef)?.profile.crop, `${cycle.crop[0].toUpperCase()}${cycle.crop.slice(1)}`);
  document.querySelector('#cycle-label').textContent = `${crop} · ${cycle.state === 'ACTIVE' ? 'ciclo activo' : 'estado no disponible'}`;
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

async function loadProjection(entry, version) {
  elements.readLoading.hidden = false;
  elements.readError.hidden = true;
  elements.readContent.hidden = true;
  elements.sourceStatus.textContent = 'Validando lectura';
  elements.sourceStatus.dataset.state = 'loading';
  elements.readError.textContent = 'No se pudo validar la lectura de este proyecto. Vuelve a abrir su ficha para intentarlo de nuevo.';
  elements.readLoading.textContent = 'Validando la lectura AgroWay sintética de este proyecto…';
  if (!entry.projectionPath) {
    participantFieldReadings.set(entry.projectRef, createParticipantFieldReading(null));
    elements.sourceStatus.className = 'data-state data-state--stale';
    elements.sourceStatus.dataset.state = 'unavailable';
    elements.sourceStatus.textContent = 'Sin lectura disponible';
    elements.readLoading.hidden = true;
    elements.readContent.hidden = true;
    elements.readError.textContent = 'Este proyecto no tiene una lectura AgroWay aprobada para mostrar.';
    elements.readError.hidden = false;
    return false;
  }
  try {
    const response = await fetch(entry.projectionPath, { cache: 'no-store' });
    if (!response.ok) throw new Error('FIXTURE_UNAVAILABLE');
    const input = await response.json();
    const checked = await validateProjection(input, { expectedSanaProjectRef: entry.projectRef });
    if (version !== selectionVersion) return false;
    if (!checked.ok) throw new Error('FIXTURE_NOT_APPROVED');
    participantFieldReadings.set(entry.projectRef, createParticipantFieldReading(checked));
    renderProjection(input, checked.model);
    return true;
  } catch {
    if (version !== selectionVersion) return false;
    participantFieldReadings.set(entry.projectRef, createParticipantFieldReading(null));
    elements.sourceStatus.className = 'data-state data-state--error';
    elements.sourceStatus.dataset.state = 'error';
    elements.sourceStatus.textContent = 'Lectura no disponible';
    elements.readLoading.hidden = true;
    elements.readError.hidden = false;
    elements.readContent.hidden = true;
    return false;
  }
}

async function selectProject(projectRef, view = 'project', { historyAction = 'push' } = {}) {
  const available = projectProfiles.find(({ entry }) => entry.projectRef === projectRef);
  if (!available) {
    catalogNotice('La ficha solicitada no está disponible. Puedes explorar los proyectos validados.');
    showView('catalog', { focus: true, historyAction: 'replace' });
    return false;
  }
  const { entry, profile } = available;
  const version = ++selectionVersion;
  activeProject = entry;
  renderDossier(profile);
  elements.projectProfileStatus.textContent = 'Proyecto ficticio · sin oferta de inversión';
  elements.projectProfileStatus.dataset.state = 'synthetic';
  elements.projectProfileStatus.classList.remove('data-state--error');
  renderProjectShelf(projectRef);
  if (view === 'interest') {
    resetInterestForm();
    flow = openInterest(resetInterestFlow());
  }
  showView(view, { focus: true, historyAction });
  await loadProjection(entry, version);
  return true;
}

async function loadCatalog() {
  if (catalogLoading) return false;
  catalogLoading = true;
  activeProject = undefined;
  projectProfiles = [];
  ++selectionVersion;
  showCatalogFeedback('Validamos cada ficha antes de mostrar sus cifras.', { loading: true });
  try {
    const response = await fetch('./project-catalog-v1.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('CATALOG_UNAVAILABLE');
    const checkedCatalog = validateProjectCatalog(await response.json());
    if (!checkedCatalog.ok) throw new Error(checkedCatalog.reason);
    catalog = checkedCatalog.model;
    const validated = await Promise.all(catalog.projects.map(async (entry) => {
      try {
        const response = await fetch(entry.dossierPath, { cache: 'no-store' });
        if (!response.ok) return null;
        const checked = validateDossier(await response.json(), entry.projectRef);
        return checked.ok ? { entry, profile: checked.model } : null;
      } catch {
        return null;
      }
    }));
    projectProfiles = validated.filter(Boolean);
    if (!projectProfiles.length) throw new Error('NO_VALID_PROJECTS');
    const defaultEntry = projectProfiles.find(({ entry }) => entry.projectRef === catalog.defaultProjectRef)?.entry ?? projectProfiles[0].entry;
    catalogNotice(projectProfiles.length < catalog.projects.length
      ? 'Algunas fichas no están disponibles. Solo mostramos proyectos que se pudieron validar.' : '');
    const requestedProject = new URLSearchParams(window.location.search).get('project');
    const initialEntry = projectProfiles.find(({ entry }) => entry.projectRef === requestedProject)?.entry ?? defaultEntry;
    if (requestedProject && requestedProject !== initialEntry.projectRef) catalogNotice('La ficha solicitada no está disponible. Mostramos una alternativa de muestra validada.');
    selectProject(initialEntry.projectRef, 'catalog', { historyAction: 'none' });
    renderProjectShelf(initialEntry.projectRef);
    return true;
  } catch {
    elements.projectProfileStatus.dataset.state = 'error';
    elements.projectProfileStatus.textContent = 'Catálogo de muestra no disponible';
    elements.projectProfileStatus.classList.add('data-state--error');
    showCatalogFeedback('No pudimos validar las fichas. Vuelve a cargar los proyectos para intentarlo de nuevo.');
    return false;
  } finally {
    catalogLoading = false;
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
document.querySelector('#open-project-card').addEventListener('click', () => { if (activeProject) selectProject(activeProject.projectRef); });
document.querySelectorAll('[data-view-link]').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  if (link.dataset.viewLink === 'participant') renderParticipantSpace();
  const anchorId = link.dataset.viewAnchor;
  showView(link.dataset.viewLink, { focus: !anchorId });
  if (anchorId) scrollToPublicSection(anchorId);
}));
document.querySelector('#back-to-catalog').addEventListener('click', () => showView('catalog', { focus: true }));
document.querySelector('#back-to-catalog-space').addEventListener('click', () => showView('catalog', { focus: true }));
document.querySelector('#back-to-projects-empty').addEventListener('click', () => showView('catalog', { focus: true }));
document.querySelector('#open-participant-space').addEventListener('click', () => { renderParticipantSpace(); showView('participant', { focus: true }); });
document.querySelectorAll('#back-to-project, #cancel-interest').forEach((button) => button.addEventListener('click', () => showView('project', { focus: true })));
document.querySelector('#interest-form').addEventListener('change', (event) => {
  if (event.target.name === 'interest-intent' || event.target.id === 'demo-acknowledgment') updateInterestErrors(null);
});
function handleInterestSubmission(event) {
  event.preventDefault();
  if (!activeProject) return;
  const intent = document.querySelector('input[name="interest-intent"]:checked')?.value;
  const result = submitInterest(flow, { intent, acknowledged: elements.acknowledgment.checked });
  updateInterestErrors(result.reason);
  if (!result.ok) {
    const firstMissing = result.reason === 'INTENT_REQUIRED' ? elements.fieldset.querySelector('input') : elements.acknowledgment;
    firstMissing.focus();
    return;
  }
  flow = result.state;
  elements.confirmedIntent.textContent = intentLabel(flow.intent);
  const recorded = recordSimulatedInterest(participantSession, {
    projectRef: activeProject.projectRef,
    projectTitle: document.querySelector('#profile-title').textContent,
    intent: flow.intent,
  });
  if (recorded.ok) participantSession = recorded.state;
  renderParticipantSpace();
  showView('confirmation', { focus: true });
}
const interestForm = document.querySelector('#interest-form');
interestForm.addEventListener('submit', handleInterestSubmission);
document.querySelector('#view-demo-space').addEventListener('click', () => {
  renderParticipantSpace();
  showView('participant', { focus: true });
});
document.querySelector('#continue-exploring').addEventListener('click', () => showView('catalog', { focus: true }));
document.querySelector('#restart-demo').addEventListener('click', () => {
  flow = resetInterestFlow();
  participantSession = clearParticipantSession();
  resetInterestForm();
  showView('catalog', { focus: true });
});

window.addEventListener('popstate', async () => {
  const requested = new URLSearchParams(window.location.search).get('view');
  const allowed = ['catalog', 'project', 'participant', 'interest', 'confirmation'];
  const requestedProject = new URLSearchParams(window.location.search).get('project');
  if (!activeProject) return;
  if (requestedProject && requestedProject !== activeProject.projectRef) { await selectProject(requestedProject, requested, { historyAction: 'none' }); return; }
  if (requested === 'interest') { resetInterestForm(); flow = openInterest(resetInterestFlow()); }
  if (requested === 'participant') renderParticipantSpace();
  const publicAnchor = requested === 'catalog' && window.location.hash === '#ecosystem-overview';
  showView(allowed.includes(requested) ? requested : 'catalog', { focus: !publicAnchor, historyAction: 'none' });
  if (publicAnchor) scrollToPublicSection('ecosystem-overview', { updateHistory: false });
});

async function startCatalog() {
  const requestedView = new URLSearchParams(window.location.search).get('view');
  const publicHash = window.location.hash;
  const loaded = await loadCatalog();
  if (!loaded) return;
  if (requestedView === 'participant') renderParticipantSpace();
  showView(['project', 'participant'].includes(requestedView) ? requestedView : 'catalog', { historyAction: 'replace' });
  if (!['project', 'participant'].includes(requestedView) && publicHash === '#ecosystem-overview') {
    scrollToPublicSection('ecosystem-overview', { updateHistory: false });
  }
}
retryCatalog.addEventListener('click', startCatalog);
startCatalog();
