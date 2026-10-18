import { projectionDisplayPolicy } from './presentation-policy.mjs';

export function createParticipantFieldReading(checkedProjection) {
  const model = checkedProjection?.ok === true && checkedProjection.model?.readOnly === true
    ? checkedProjection.model
    : null;
  if (!model) {
    return Object.freeze({ state: 'UNAVAILABLE', sourceAsOf: null, summary: null });
  }

  const policy = projectionDisplayPolicy(model);
  const sourceAsOf = model.provenance?.sourceAsOf ?? model.freshness?.sourceAsOf ?? null;
  if (!policy.showSummary) {
    return Object.freeze({ state: policy.state, sourceAsOf, summary: null });
  }

  return Object.freeze({
    state: 'FRESH',
    sourceAsOf,
    summary: Object.freeze({
      crop: model.cycle.crop,
      cycleState: model.cycle.state,
      completeness: Object.freeze({ ...model.completeness }),
      tasks: Object.freeze({ ...model.summary.tasks }),
      alerts: Object.freeze({ ...model.summary.alerts }),
      harvest: Object.freeze({ ...model.summary.harvest }),
    }),
  });
}
