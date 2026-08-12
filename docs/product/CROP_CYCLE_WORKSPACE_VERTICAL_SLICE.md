# AGROWAY FIELD — Crop Cycle Workspace v0.21.0-alpha2

## Product intent

The second FIELD vertical turns `Plot -> Crop Cycle` into a longitudinal operating workspace rather than another KPI dashboard.

Information hierarchy:

`identity/stage -> exception -> active plan -> normalized facts -> deterministic decisions -> evidence history`.

## Design direction

Selected: **longitudinal-crop-workspace**.

Rejected directions:

- **cycle-kpi-dashboard:** too snapshot-oriented; obscures why an action is due.
- **agronomy-notebook:** good narrative continuity but too slow for daily exception handling and execution.

The workspace inherits the SANA/AGROWAY semantic token system, density/motion profile and anti-slop rules established in rc6.

## Functional slice

- navigation from FIELD_HOME to the selected lot/cycle;
- crop-cycle identity, area, plant count, stage and next milestone;
- phenological stage rail;
- active agronomic plan across water, nutrition and plant health;
- local evidence capture against plan actions;
- monitoring facts contrasted with target ranges;
- deterministic decision explanation;
- keyboard-accessible cycle tabs;
- evidence/event-time history combining reconstructed baseline with local device evidence;
- Copilot evidence disclosure with `DRAFT_SUGGESTION` boundary;
- Traceability Passport preview that explicitly refuses to claim real certification;
- offline queue preserved across FIELD_HOME and crop-cycle workspace.

## Trust boundary

All values in this preview are reconstructed demonstrative data. The surface does not claim live backend sync, live provider telemetry, production agronomic approval, final Traceability Passport certification or AI execution authority.

## Next verticals

1. Dedicated task execution + photo/measurement evidence capture.
2. Inventory consumption + application workflow.
3. Monitoring incidents + deterministic alert resolution.
4. Traceability Passport assembly.
