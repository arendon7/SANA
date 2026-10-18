export const PROJECT_DOSSIER_SCHEMA = 'sana.project-dossier/1.0.0';

const requiredFieldStatuses = {
  crop: ['NOT_PROVIDED', 'SYNTHETIC_VALUE', 'AVAILABLE'],
  promoter: ['NOT_INCLUDED', 'NOT_PROVIDED', 'SYNTHETIC_VALUE', 'AVAILABLE'],
  property: ['NOT_PROVIDED', 'SYNTHETIC_VALUE', 'AVAILABLE'],
  location: ['NOT_PROVIDED', 'SYNTHETIC_VALUE', 'AVAILABLE'],
  areaHa: ['NOT_PROVIDED', 'SYNTHETIC_VALUE', 'AVAILABLE'],
  plantCount: ['NOT_PROVIDED', 'SYNTHETIC_VALUE', 'AVAILABLE'],
  capitalNeed: ['NOT_STRUCTURED', 'SYNTHETIC_VALUE', 'AVAILABLE'],
  productionEstimate: ['NOT_MODELED', 'SYNTHETIC_VALUE', 'AVAILABLE'],
  netUtilityEstimate: ['NOT_CALCULATED', 'SYNTHETIC_VALUE', 'AVAILABLE'],
};

function isFiniteNonNegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function validateSyntheticModel(model) {
  const hasSyntheticModel = model.capitalNeed.status === 'SYNTHETIC_VALUE'
    || model.productionEstimate.status === 'SYNTHETIC_VALUE'
    || model.economicScenario?.status === 'SYNTHETIC_VALUE';
  if (!hasSyntheticModel) return true;
  const funds = model.capitalNeed.useOfFunds;
  const fundsTotal = Array.isArray(funds) ? funds.reduce((sum, row) => sum + row.amount, 0) : NaN;
  const basis = model.productionEstimate.basis;
  const productionMatches = basis
    && basis.areaHa === model.areaHa.value
    && Math.abs(basis.areaHa * basis.yieldKgPerHa - model.productionEstimate.quantity) < 0.001;
  const plantCountMatches = model.plantCount.value === model.areaHa.value * model.plantCount.densityPlantsPerHa;
  const economics = model.economicScenario;
  return Number.isFinite(fundsTotal)
    && fundsTotal === model.capitalNeed.amount
    && productionMatches
    && plantCountMatches
    && economics?.status === 'SYNTHETIC_VALUE'
    && economics.grossSales === model.productionEstimate.quantity * economics.pricePerKg
    && economics.operatingSurplus === economics.grossSales - economics.operatingCosts
    && model.netUtilityEstimate?.amount === null
    && model.netUtilityEstimate.status === 'NOT_CALCULATED';
}

export function validateDossier(input, expectedProjectRef) {
  if (!input || input.schema !== PROJECT_DOSSIER_SCHEMA) return { ok: false, reason: 'SCHEMA_UNSUPPORTED' };
  if (input.projectRef !== expectedProjectRef) return { ok: false, reason: 'PROJECT_UNMAPPED' };
  if (input.status !== 'SYNTHETIC') return { ok: false, reason: 'NOT_SYNTHETIC' };
  if (typeof input.title !== 'string' || typeof input.summary !== 'string') return { ok: false, reason: 'PROFILE_INCOMPLETE' };
  for (const [name, allowedStatuses] of Object.entries(requiredFieldStatuses)) {
    const field = input[name];
    if (!field || !allowedStatuses.includes(field.status)) return { ok: false, reason: `FIELD_STATUS_INVALID:${name}` };
  }
  if (input.promoter.status === 'SYNTHETIC_VALUE' && !input.promoter.value?.includes('ficticio')) return { ok: false, reason: 'SYNTHETIC_PERSON_NOT_LABELED' };
  if (input.property?.status === 'SYNTHETIC_VALUE' && !input.property.value?.includes('ficticio')) return { ok: false, reason: 'SYNTHETIC_PROPERTY_NOT_LABELED' };
  if (input.location.status === 'SYNTHETIC_VALUE' && !input.location.value?.includes('ilustrativa')) return { ok: false, reason: 'SYNTHETIC_LOCATION_NOT_LABELED' };
  for (const name of ['areaHa', 'plantCount', 'capitalNeed', 'productionEstimate']) {
    const field = input[name];
    if (field.status === 'SYNTHETIC_VALUE') {
      const value = name === 'capitalNeed' ? field.amount : name === 'productionEstimate' ? field.quantity : field.value;
      if (!isFiniteNonNegative(value)) return { ok: false, reason: `SYNTHETIC_VALUE_INVALID:${name}` };
    }
  }
  if (!validateSyntheticModel(input)) return { ok: false, reason: 'SYNTHETIC_MODEL_INCONSISTENT' };
  if (input.portfolio?.status !== 'PLANNED' || typeof input.portfolio.description !== 'string') {
    return { ok: false, reason: 'PORTFOLIO_NOT_PLANNED' };
  }
  return { ok: true, model: input };
}

export function displayProjectField(field, fallback, unit) {
  if (!field) return fallback;
  const value = field.value ?? field.amount ?? field.quantity;
  if (value === null || value === undefined) return fallback;
  const formatted = typeof value === 'number' ? new Intl.NumberFormat('es-CO').format(value) : String(value);
  return [formatted, unit || field.unit || field.currency].filter(Boolean).join(' ');
}

export function displayProjectEstimate(field, fallback) {
  if (!field || field.quantity === null || field.quantity === undefined) return fallback;
  const amount = displayProjectField(field, fallback);
  return [amount, field.period].filter(Boolean).join(' · ');
}


const dueDiligenceTopics = [
  { id: 'promoter-and-organization', title: 'Productor y organización', question: '¿Quién propone el proyecto y quién puede representarlo?', evidenceNeeded: 'Identidad y autorización de las personas responsables; estructura del grupo y consentimiento para compartir información.' },
  { id: 'land-and-water', title: 'Predio, agua y permisos', question: '¿El área, el uso del suelo y el acceso al agua corresponden al proyecto?', evidenceNeeded: 'Soporte de tenencia o uso, ubicación verificable, disponibilidad de agua y permisos aplicables.' },
  { id: 'agronomic-plan', title: 'Plan agronómico', question: '¿El cultivo y sus actividades responden a condiciones observadas del predio?', evidenceNeeded: 'Diagnóstico y plan por ciclo, densidad y estado de plantas, necesidades de suelo y agua, y revisión técnica. AgroWay aportaría registros de campo autorizados; estos no sustituyen esa revisión.' },
  { id: 'budget-and-production', title: 'Presupuesto y producción', question: '¿Las necesidades y los supuestos pueden reconstruirse con fuentes y periodos claros?', evidenceNeeded: 'Presupuesto por actividad, cotizaciones, costos completos, base del rendimiento estimado y escenarios que expliquen variaciones.' },
  { id: 'market-and-operations', title: 'Comercialización y logística', question: '¿Cómo se recibiría, acondicionaría y vendería la producción?', evidenceNeeded: 'Canal comercial, requisitos de calidad, volúmenes, transporte, almacenamiento y fuente de los precios asumidos.' },
  { id: 'governance-and-terms', title: 'Gobierno y condiciones', question: '¿Cómo se revisarían los recursos, las decisiones y los derechos de cada parte?', evidenceNeeded: 'Estructura jurídica y financiera, responsabilidades, controles de uso, manejo de cambios y mecanismos de atención de desacuerdos.' },
];

export function createSyntheticDueDiligence(projectRef) {
  if (typeof projectRef !== 'string' || !/^sana-demo-project-\d{3}$/.test(projectRef)) {
    throw new TypeError('PROJECT_REF_INVALID');
  }
  const topics = dueDiligenceTopics.map((topic) => Object.freeze({ ...topic, status: 'NOT_ASSESSED' }));
  return Object.freeze({
    schema: 'sana.due-diligence/1.0.0',
    projectRef,
    status: 'SYNTHETIC',
    overallStatus: 'NOT_ASSESSED',
    topics: Object.freeze(topics),
  });
}
