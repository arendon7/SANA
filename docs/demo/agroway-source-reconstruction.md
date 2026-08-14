# AGROWAY source-driven reconstruction for SANA DEMO V3

This document records the historical AGROWAY materials used to reconstruct product behavior in the SANA DEMO branch. It is a source map, not a claim that every historical function was production-ready or field-validated.

## Historical sources reviewed

1. `Módulos que conforman la plataforma .docx` — SharePoint site AGROWAY / 1. MODELO DE NEGOCIO AGROWAY.
   - Describes crop-plan design, plant-material inventory, mother plants, propagation, cuttings, seeds, crop management, environmental/phenological/fertigation follow-up, phenology, fertigation, pests/diseases, plant-material life cycle, final disposition, agronomist chat, inventory, operators, reports, IoT, mobile offline, API/CMS/ERP integration and SANA integration.
2. `LINEAMIENTOS ESTRATEGICOS AGROWAY.docx` — SharePoint site AGROWAY / 2. PLANEACIÓN ESTRATÉGICA.
   - Defines AGROWAY as an integrated and synchronized family of applications intended to trace and automate field operations, centralize cultivation information, reduce the rural digital gap and accompany cultivation from seed to harvest.
3. `1. PROPUESTA DE IMPLEMENTACION TRAZABILIDAD Y GESTION DE RESIDUOS.docx` — SharePoint site AGROWAY / PROYECTOS.
   - Describes characterization, crop models, agricultural-residue identification, biological transformation, circular agriculture, IoT-assisted monitoring, traceability, training and final-disposition management.

## Source-driven features currently represented in SANA DEMO V3

- Crop plans and versioned technical protocols.
- Plant-material inventory and propagation context.
- Phenology, nutrition/fertigation, health and operational activities.
- Inventories, spaces/tanks and team/productivity.
- Mobile/offline-first capture with explicit `LOCAL_ONLY ≠ SYNCED ≠ ACK` states.
- Reports and per-unit economics (DEMO only).
- Technical accompaniment and evidence/Passport.
- IoT source matrix:
  - Water: temperature, pH, electrical conductivity.
  - Environment: temperature, relative humidity, CO2, direct and indirect solar radiation.
  - Soil: temperature, humidity, electrical conductivity, phosphorus, potassium and nitrogen.
- Circularity and agricultural-residue traceability:
  - origin/lot,
  - residual stream,
  - quantity,
  - destination,
  - transformation/disposition state,
  - evidence,
  - responsible person.
- Integration with SANA Impact and Capital Readiness without presenting DEMO information as certification, eligibility or investment recommendation.

## Interpretation rules

- Historical documents are used as product requirements/context, not as proof that a feature was technically complete or deployed.
- Exact historical capacities, performance claims or project-specific deliverables are not silently applied to the current synthetic farm.
- Synthetic examples are labeled DEMO.
- No historical language is used to weaken the current CONTROL boundary.
- Production execution, D10, canonical mutation, external ACK, financial custody and movement remain disabled in this branch.

## Next reconstruction targets

1. Agronomist conversation/technical support as a case-based workflow rather than a generic chat.
2. Input projections by crop and cycle tied to inventory and plan versions.
3. Custom reports with explicit source/version/cutoff metadata.
4. Plant-material life-cycle chain through propagation → crop → harvest → final disposition.
5. Training/onboarding workflows suitable for low-connectivity and low-digital-literacy field contexts.
