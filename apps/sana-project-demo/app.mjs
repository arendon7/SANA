import { validateProjection } from '../sana-project-read/reader-v1.mjs';
import { createInterestFlow, openInterest, resetInterestFlow, submitInterest } from './interest-flow.mjs';
import { createSyntheticDueDiligence, displayProjectField, validateDossier } from './project-dossier.mjs';
import { projectionDisplayPolicy } from './presentation-policy.mjs';
import { clearParticipantSession, createParticipantSession, recordSimulatedInterest, recordSimulatedCommitment, simulateHumanReview } from './participant-session.mjs';
import { createParticipantFieldReading } from './participant-field-reading.mjs';
import { validateProjectCatalog } from './project-catalog.mjs';

const elements = {
  catalog: document.querySelector('#explore-view'),
  project: document.querySelector('#project-view'),
  participant: document.querySelector('#participant-view'),
  interest: document.querySelector('#interest-view'),
  confirmation: document.querySelector('#confirmation-view'),
  navExplore: document.querySelector('#nav-explore'),
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

const projectSections = [...document.querySelectorAll('.project-nav a')]
  .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter(({ section }) => section);
const projectSectionObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
    const current = entries
      .filter((entry) => entry.isIntersecting)
      .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];
    if (!current) return;
    projectSections.forEach(({ link, section }) => {
      if (section === current.target) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-120px 0px -62% 0px', threshold: 0 })
  : null;
projectSections.forEach(({ section }) => projectSectionObserver?.observe(section));
projectSections.forEach(({ link }) => link.addEventListener('click', () => {
  projectSections.forEach(({ link: candidate }) => candidate.removeAttribute('aria-current'));
  link.setAttribute('aria-current', 'location');
}));

function showView(step, { focus = false, historyAction = 'push' } = {}) {
  const views = {
    catalog: elements.catalog,
    project: elements.project,
    participant: elements.participant,
    interest: elements.interest,
    confirmation: elements.confirmation,
  };
  if (!Object.hasOwn(views, step)) step = 'catalog';
  Object.entries(views).forEach(([name, view]) => { view.hidden = name !== step; });
  elements.navExplore.setAttribute('aria-current', ['catalog', 'project', 'interest', 'confirmation'].includes(step) ? 'page' : 'false');
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
  document.querySelector('#session-commitment-count').textContent = formatCount(items.filter((item) => item.commitment).length);
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
    status.textContent = item.commitment
      ? 'Compromiso de muestra · sin efecto'
      : item.reviewStatus === 'SIMULATED_CONTINUE'
        ? 'Revisión simulada · sin efecto'
        : 'Interés ficticio · no enviado';
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
    stageValue.textContent = item.commitment
      ? 'Escenario de compromiso ficticio · no vinculante'
      : item.reviewStatus === 'SIMULATED_CONTINUE'
        ? 'Revisión representada en la demo · no realizada por una persona'
        : 'Revisión humana pendiente · no iniciada';
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
    disclosure.textContent = item.commitment
      ? 'El monto y las etapas son solo una simulación local. No hay solicitud recibida, contrato, obligación, pago ni aporte registrado; al recargar se borra.'
      : item.reviewStatus === 'SIMULATED_CONTINUE'
        ? 'La revisión se simuló con un botón para mostrar el recorrido. Nadie evaluó el proyecto y aún no existe solicitud ni compromiso.'
        : 'Esta selección no crea solicitud ni compromiso. Nadie la recibió; se borra al recargar o cerrar la demo.';
    const openProject = document.createElement('button');
    openProject.className = 'text-button';
    openProject.type = 'button';
    openProject.textContent = 'Abrir ficha completa ↗';
    openProject.addEventListener('click', () => selectProject(item.projectRef, 'project'));
    card.append(heading, projectFacts, details, fieldReading, renderParticipationStage(item), disclosure, openProject);
    list.append(card);
  });
}

function renderParticipationStage(item) {
  const section = document.createElement('section');
  section.className = 'participation-stage';
  section.setAttribute('aria-label', `Etapa de participación de muestra para ${item.projectTitle}`);
  const heading = document.createElement('h4');
  heading.textContent = item.commitment ? 'Tu escenario de muestra' : 'Siguiente paso del recorrido';
  section.append(heading);

  if (!item.commitment && item.reviewStatus === 'PENDING') {
    const copy = document.createElement('p');
    copy.textContent = 'En una operación real, una persona revisaría la identidad del proyecto, su presupuesto y sus soportes antes de cualquier acuerdo. Aquí puedes recorrer una revisión ficticia.';
    const review = document.createElement('button');
    review.className = 'button button-secondary';
    review.type = 'button';
    review.dataset.simulationAction = 'review';
    review.dataset.projectRef = item.projectRef;
    review.textContent = 'Simular revisión humana';
    section.append(copy, review);
    return section;
  }

  if (!item.commitment) {
    const copy = document.createElement('p');
    copy.textContent = 'La revisión no ocurrió: esta acción solo avanza la demostración. Consulta el contenido disponible antes de ensayar un compromiso sin efecto.';
    const documents = document.createElement('ul');
    documents.className = 'sample-document-list';
    [
      ['Ficha del proyecto', 'Resumen, productor y predio ficticios.'],
      ['Presupuesto y producción', 'Supuestos didácticos visibles en la ficha.'],
      ['Acuerdo firmado', 'No disponible; exigiría estructura y revisión legal.'],
    ].forEach(([name, detail]) => {
      const row = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = name;
      const small = document.createElement('small');
      small.textContent = detail;
      row.append(strong, small);
      documents.append(row);
    });
    const label = document.createElement('label');
    label.className = 'commitment-choice';
    label.textContent = 'Monto hipotético para el ejercicio';
    const select = document.createElement('select');
    select.dataset.projectRef = item.projectRef;
    select.setAttribute('aria-label', `Monto hipotético para ${item.projectTitle}`);
    [500_000, 1_000_000, 2_500_000].forEach((amount) => {
      const option = document.createElement('option');
      option.value = String(amount);
      option.textContent = formatCop(amount);
      select.append(option);
    });
    label.append(select);
    const commitment = document.createElement('button');
    commitment.className = 'button button-primary';
    commitment.type = 'button';
    commitment.dataset.simulationAction = 'commitment';
    commitment.dataset.projectRef = item.projectRef;
    commitment.textContent = 'Simular compromiso ficticio';
    section.append(copy, documents, label, commitment);
    return section;
  }

  const amount = document.createElement('p');
  amount.className = 'sample-commitment-amount';
  amount.textContent = `${formatCop(item.commitment.amount)} · escenario elegido en la demo`;
  const status = document.createElement('p');
  status.className = 'contribution-status';
  status.textContent = 'Aportes: no hay pago ni conciliación registrados. Si existieran en el futuro, se gestionarían por un canal externo y con revisión humana.';
  const documents = document.createElement('ul');
  documents.className = 'sample-document-list';
  [
    ['Ficha y presupuesto', 'Material representado en esta demo.'],
    ['Acuerdo del proyecto', 'No disponible; no se ha generado ni firmado.'],
    ['Aportes conciliados', 'Ninguno; esta aplicación no procesa pagos.'],
  ].forEach(([name, detail]) => {
    const row = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = name;
    const small = document.createElement('small');
    small.textContent = detail;
    row.append(strong, small);
    documents.append(row);
  });
  section.append(amount, status, documents);
  return section;
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

function resetInterestForm() {
  document.querySelector('#interest-form').reset();
  elements.formError.hidden = true;
  elements.ackError.hidden = true;
}

function openInterestView() {
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

function renderDueDiligence(projectRef) {
  const model = createSyntheticDueDiligence(projectRef);
  const list = document.querySelector('#due-diligence-list');
  list.replaceChildren();
  model.topics.forEach((topic, index) => {
    const item = document.createElement('li');
    item.className = 'due-diligence-item';
    const details = document.createElement('details');
    details.open = index === 0;
    const heading = document.createElement('div');
    heading.className = 'due-diligence-item__heading';
    const title = document.createElement('h3');
    title.textContent = topic.title;
    const status = document.createElement('span');
    status.className = 'data-state data-state--unassessed';
    status.textContent = 'Sin evaluar';
    heading.append(title, status);
    const summary = document.createElement('summary');
    summary.append(heading);
    const question = document.createElement('p');
    question.className = 'due-diligence-item__question';
    question.textContent = topic.question;
    const evidence = document.createElement('p');
    evidence.className = 'due-diligence-item__evidence';
    const evidenceLabel = document.createElement('strong');
    evidenceLabel.textContent = 'Evidencia por solicitar';
    const evidenceText = document.createElement('span');
    evidenceText.textContent = topic.evidenceNeeded;
    evidence.append(evidenceLabel, evidenceText);
    const content = document.createElement('div');
    content.className = 'due-diligence-item__content';
    content.append(question, evidence);
    details.append(summary, content);
    item.append(details);
    list.append(item);
  });
}

function renderProjectPlan(plan) {
  const objective = document.querySelector('#project-plan-objective');
  const phases = document.querySelector('#project-plan-phases');
  objective.textContent = plan?.objective ?? 'El plan productivo aún no está incluido en esta ficha.';
  phases.replaceChildren();
  if (!Array.isArray(plan?.phases)) return;

  plan.phases.forEach((phase, index) => {
    const item = document.createElement('li');
    const number = document.createElement('span');
    number.className = 'project-plan__number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(index + 1).padStart(2, '0');
    const content = document.createElement('div');
    content.className = 'project-plan__content';
    const title = document.createElement('strong');
    title.textContent = phase.name;
    const description = document.createElement('p');
    description.textContent = phase.description;
    const timeframe = document.createElement('small');
    timeframe.textContent = phase.timeframe;
    content.append(title, description, timeframe);
    item.append(number, content);
    phases.append(item);
  });
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
  renderProjectPlan(profile.projectPlan);

  const capital = profile.capitalNeed;
  const production = profile.productionEstimate;
  const economics = profile.economicScenario;
  const formattedCapital = formatCop(capital.amount);
  document.querySelector('#profile-capital').textContent = formattedCapital;
  document.querySelector('#panel-capital').textContent = formattedCapital;
  document.querySelector('#panel-capital-copy').textContent = formattedCapital;
  document.querySelector('#catalog-capital').textContent = formattedCapital;
  document.querySelector('#capital-period').textContent = capital.period;
  document.querySelector('#capital-period-copy').textContent = capital.period;
  const formattedProduction = `${formatCount(production.quantity)} ${production.unit} · ${production.period}`;
  document.querySelector('#profile-production').textContent = formattedProduction;
  document.querySelector('#profile-production-quick').textContent = `${formatCount(production.quantity)} ${production.unit}`;
  document.querySelector('#catalog-production').textContent = `${formatCount(production.quantity)} ${production.unit}`;
  document.querySelector('#catalog-production-period').textContent = production.period;
  document.querySelector('#catalog-surplus').textContent = `${formatCop(economics.operatingSurplus)}/año`;
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
  renderDueDiligence(profile.projectRef);
}

function renderProjectShelf(activeRef) {
  const alternatives = projectProfiles.filter(({ profile }) => profile.projectRef !== activeRef);
  elements.catalogCount.textContent = `${projectProfiles.length} proyectos · Ficticios`;
  elements.catalogList.replaceChildren();
  alternatives.forEach(({ profile }) => {
    const projectCode = profile.projectRef.replace('sana-demo-project-', 'SANA-DEM-');
    const row = document.createElement('article');
    row.className = 'project-shelf-row';
    const art = document.createElement('div');
    art.className = 'project-shelf-row__art';
    art.setAttribute('aria-hidden', 'true');
    const artCrop = document.createElement('span');
    artCrop.textContent = displayProjectField(profile.crop, 'Cultivo');
    const artCode = document.createElement('span');
    artCode.textContent = projectCode;
    art.append(artCrop, artCode);
    const copy = document.createElement('div');
    copy.className = 'project-shelf-row__copy';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `PROYECTO DE MUESTRA · ${projectCode}`;
    const title = document.createElement('h3');
    title.textContent = profile.title;
    const description = document.createElement('p');
    description.textContent = profile.summary;
    const promoter = document.createElement('p');
    promoter.className = 'project-shelf-row__promoter';
    promoter.textContent = `${displayProjectField(profile.promoter, 'Productor/a no informado')} · ${displayProjectField(profile.property, 'Predio no informado')}`;
    copy.append(eyebrow, title, promoter, description);
    const facts = document.createElement('dl');
    facts.className = 'project-shelf-row__facts';
    [
      ['Área productiva', displayProjectField(profile.areaHa, 'Sin dato')],
      ['Plantas asociadas', displayProjectField(profile.plantCount, 'Sin dato')],
      ['Necesidad de muestra', formatCop(profile.capitalNeed.amount)],
      ['Producción estimada', `${formatCount(profile.productionEstimate.quantity)} ${profile.productionEstimate.unit} · ${profile.productionEstimate.period}`],
      ['Excedente operativo', `${formatCop(profile.economicScenario.operatingSurplus)}/año · escenario didáctico`],
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
    open.textContent = 'Explorar proyecto ↗';
    open.setAttribute('aria-label', `Abrir ficha de ${profile.title}`);
    open.addEventListener('click', () => selectProject(profile.projectRef, 'project'));
    const disclosure = document.createElement('p');
    disclosure.className = 'project-shelf-row__disclosure';
    disclosure.textContent = 'Cifras ficticias. El excedente no es utilidad neta ni retorno; el resultado neto no está calculado.';
    row.append(art, copy, facts, disclosure, open);
    elements.catalogList.append(row);
  });
  document.querySelector('#catalog-art-title').textContent = `Diagrama de un proyecto agrícola de muestra ${activeRef.slice(-3)}`;
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

async function loadDossier(entry) {
  try {
    const response = await fetch(entry.dossierPath, { cache: 'no-store' });
    if (!response.ok) throw new Error('DOSSIER_UNAVAILABLE');
    const profile = await response.json();
    const checked = validateDossier(profile, entry.projectRef);
    if (!checked.ok) throw new Error(checked.reason);
    renderDossier(checked.model);
    elements.projectProfileStatus.dataset.state = 'synthetic';
    elements.projectProfileStatus.classList.remove('data-state--error');
    return checked.model;
  } catch {
    elements.projectProfileStatus.dataset.state = 'error';
    elements.projectProfileStatus.textContent = 'Ficha de muestra no disponible';
    elements.projectProfileStatus.classList.add('data-state--error');
    return null;
  }
}

async function loadProjection(entry) {
  elements.readLoading.hidden = false;
  elements.readError.hidden = true;
  elements.readContent.hidden = true;
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
    if (!checked.ok) throw new Error('FIXTURE_NOT_APPROVED');
    participantFieldReadings.set(entry.projectRef, createParticipantFieldReading(checked));
    renderProjection(input, checked.model);
    return true;
  } catch {
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
  const entry = catalog?.projects.find((project) => project.projectRef === projectRef);
  if (!entry) return;
  const profile = await loadDossier(entry);
  if (!profile) return;
  activeProject = entry;
  renderProjectShelf(projectRef);
  await loadProjection(entry);
  if (view === 'interest') {
    resetInterestForm();
    flow = openInterest(resetInterestFlow());
  }
  showView(view, { focus: true, historyAction });
}

async function loadCatalog() {
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
    const defaultEntry = catalog.projects.find((entry) => entry.projectRef === catalog.defaultProjectRef);
    if (!defaultEntry || !projectProfiles.some(({ entry }) => entry.projectRef === defaultEntry.projectRef)) throw new Error('DEFAULT_PROJECT_UNAVAILABLE');
    const requestedProject = new URLSearchParams(window.location.search).get('project');
    const initialEntry = catalog.projects.find((entry) => entry.projectRef === requestedProject)
      ?? defaultEntry;
    await selectProject(initialEntry.projectRef, 'catalog', { historyAction: 'none' });
    renderProjectShelf(initialEntry.projectRef);
    return true;
  } catch {
    elements.projectProfileStatus.dataset.state = 'error';
    elements.projectProfileStatus.textContent = 'Catálogo de muestra no disponible';
    elements.projectProfileStatus.classList.add('data-state--error');
    elements.catalogList.textContent = 'No se pudieron validar los proyectos de muestra. Recarga para intentarlo de nuevo.';
    return false;
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
document.querySelector('#open-project-card').addEventListener('click', () => showView('project', { focus: true }));
document.querySelectorAll('[data-view-link]').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  if (link.dataset.viewLink === 'participant') renderParticipantSpace();
  showView(link.dataset.viewLink, { focus: true });
}));
document.querySelector('#back-to-catalog').addEventListener('click', () => showView('catalog', { focus: true }));
document.querySelector('#back-to-catalog-space').addEventListener('click', () => showView('catalog', { focus: true }));
document.querySelector('#back-to-projects-empty').addEventListener('click', () => showView('catalog', { focus: true }));
document.querySelector('#open-participant-space').addEventListener('click', () => { renderParticipantSpace(); showView('participant', { focus: true }); });
document.querySelector('#session-space-list').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-simulation-action]');
  if (!button) return;
  const projectRef = button.dataset.projectRef;
  const result = button.dataset.simulationAction === 'review'
    ? simulateHumanReview(participantSession, projectRef)
    : recordSimulatedCommitment(participantSession, {
      projectRef,
      amount: Number(button.closest('.session-interest-card')?.querySelector('select')?.value),
    });
  if (!result.ok) return;
  participantSession = result.state;
  renderParticipantSpace();
});
document.querySelectorAll('#back-to-project, #cancel-interest').forEach((button) => button.addEventListener('click', () => showView('project', { focus: true })));
document.querySelector('#interest-form').addEventListener('change', (event) => {
  if (event.target.name === 'interest-intent') elements.formError.hidden = true;
  if (event.target.id === 'demo-acknowledgment') elements.ackError.hidden = true;
});
function handleInterestSubmission(event) {
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
interestForm.querySelector('button[type="submit"]').addEventListener('click', handleInterestSubmission);
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
  if (requestedProject && requestedProject !== activeProject?.projectRef) await selectProject(requestedProject, 'catalog', { historyAction: 'none' });
  if (requested === 'participant') renderParticipantSpace();
  showView(allowed.includes(requested) ? requested : 'catalog', { focus: true, historyAction: 'none' });
});

const requestedView = new URLSearchParams(window.location.search).get('view');
loadCatalog().then((loaded) => {
  if (!loaded) return;
  if (requestedView === 'participant') renderParticipantSpace();
  showView(['project', 'participant'].includes(requestedView) ? requestedView : 'catalog', { historyAction: 'replace' });
});
