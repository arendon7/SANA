# AGROWAY FIELD — Harvest / Sale / Settlement v0.21.0-alpha7

The seventh FIELD vertical closes the crop-cycle output chain without turning offline field activity into canonical production or accounting records.

Information hierarchy:

`cycle context -> harvest output -> local sellable balance -> buyer/PO/sale -> settlement -> canonical acceptance boundary -> Passport projection`.

## Determinism

Harvest and sale quantities are normalized to integer grams. Price is entered as whole COP/kg and converted to integer COP minor units. Sale total is deterministically rounded from integer grams × integer price-per-kg minor units. Settlement amount and currency are inherited from the sale and cannot be overridden.

## Guardrails

- positive harvest quantity only;
- sale quantity cannot exceed local unsold harvest;
- no duplicate local settlement for one sale;
- exact tenant/farm/plot/cycle/evidence linkage;
- local harvest/sale/settlement never mutate canonical Production/Commerce;
- AI cannot approve price, sale or settlement;
- local harvest makes Passport `harvest_output=LOCAL_PENDING` only; canonical acceptance is required for `COMPLETE_CANONICAL`.
