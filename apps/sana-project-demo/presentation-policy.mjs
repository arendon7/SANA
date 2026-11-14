export function projectionDisplayPolicy(model) {
  if (model?.readOnly !== true) return { state: 'UNAVAILABLE', showSummary: false };
  if (model?.freshness?.status !== 'FRESH') return { state: 'STALE', showSummary: false };
  return { state: 'FRESH', showSummary: true };
}
