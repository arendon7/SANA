function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-CO')
    .trim();
}

export function matchesProjectSearch(profile, query) {
  const needle = normalize(query);
  if (!needle) return true;
  const fields = [
    profile?.title, profile?.summary, profile?.projectRef,
    profile?.crop?.value, profile?.promoter?.value, profile?.property?.value,
    profile?.location?.value, profile?.areaHa?.value, profile?.areaHa?.unit,
    profile?.plantCount?.value, profile?.plantCount?.unit,
    profile?.capitalNeed?.amount, profile?.capitalNeed?.period,
    profile?.productionEstimate?.quantity, profile?.productionEstimate?.unit,
    profile?.productionEstimate?.period,
  ];
  return fields.some((field) => normalize(field).includes(needle));
}
