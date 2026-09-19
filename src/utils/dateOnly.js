/** Preserve a calendar day without converting it through UTC. */
export function normalizeDateOnly(value) {
  if (!value) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return `${String(value.getFullYear()).padStart(4, '0')}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  if (typeof value !== 'string') return '';
  const input = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(input);
  const legacy = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/.exec(input);
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const year = Number(iso?.[1] ?? legacy?.[3]);
  const month = iso ? Number(iso[2]) : legacy ? months.indexOf(legacy[2].toLowerCase()) + 1 : 0;
  const day = Number(iso?.[3] ?? legacy?.[1]);
  const check = new Date(0);
  check.setFullYear(year, month - 1, day);
  if (!month || check.getFullYear() !== year || check.getMonth() !== month - 1 || check.getDate() !== day) return '';
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
