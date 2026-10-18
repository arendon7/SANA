export const PROJECT_CATALOG_SCHEMA = 'sana.project-catalog/1.0.0';

const dossierPathPattern = /^\.\/project-dossier-[a-z0-9-]+\.json$/;
const projectionPathPattern = /^\.\/project-projection-[a-z0-9-]+\.json$/;

export function validateProjectCatalog(input) {
  if (!input || input.schema !== PROJECT_CATALOG_SCHEMA) return { ok: false, reason: 'SCHEMA_UNSUPPORTED' };
  if (input.status !== 'SYNTHETIC') return { ok: false, reason: 'CATALOG_NOT_SYNTHETIC' };
  if (!Array.isArray(input.projects) || input.projects.length === 0) return { ok: false, reason: 'PROJECTS_REQUIRED' };
  const refs = new Set();
  const dossiers = new Set();
  const projections = new Set();
  for (const project of input.projects) {
    if (!project || typeof project.projectRef !== 'string' || !/^sana-demo-project-[0-9]{3}$/.test(project.projectRef)) {
      return { ok: false, reason: 'PROJECT_REF_INVALID' };
    }
    if (refs.has(project.projectRef)) return { ok: false, reason: 'PROJECT_REF_DUPLICATED' };
    refs.add(project.projectRef);
    if (typeof project.dossierPath !== 'string' || !dossierPathPattern.test(project.dossierPath)) {
      return { ok: false, reason: 'DOSSIER_PATH_INVALID' };
    }
    if (dossiers.has(project.dossierPath)) return { ok: false, reason: 'DOSSIER_PATH_DUPLICATED' };
    dossiers.add(project.dossierPath);
    if (project.projectionPath !== null
      && (typeof project.projectionPath !== 'string' || !projectionPathPattern.test(project.projectionPath))) {
      return { ok: false, reason: 'PROJECTION_PATH_INVALID' };
    }
    if (project.projectionPath && projections.has(project.projectionPath)) return { ok: false, reason: 'PROJECTION_PATH_DUPLICATED' };
    if (project.projectionPath) projections.add(project.projectionPath);
  }
  if (!refs.has(input.defaultProjectRef)) return { ok: false, reason: 'DEFAULT_PROJECT_UNMAPPED' };
  return { ok: true, model: input };
}
