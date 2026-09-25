// Presentation only: retain the original records for API calls and validation.
export function isInternalIdField(key) {
  const normalized = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replaceAll(' ', '_');
  return /(^|_)(ids?|uuids?|guids?)$/i.test(normalized);
}

const isOpaqueId = value => typeof value === 'string' &&
  /^(?:[a-f0-9]{24}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.test(value);

export function displayRecord(value) {
  if (isOpaqueId(value)) return undefined;
  if (Array.isArray(value)) return value.map(displayRecord).filter(item => item !== undefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !isInternalIdField(key))
      .map(([key, item]) => [key, displayRecord(item)])
      .filter(([, item]) => item !== undefined));
  }
  return value;
}

export function completionRecordName(record, type) {
  const details = displayRecord(record || {});
  const keys = type === 'case' ? ['case_code', 'case_name', 'name', 'title'] : ['site_name', 'site_code', 'name'];
  return keys.map(key => details[key]).find(value => typeof value === 'string' && value.trim()) ||
    (type === 'case' ? 'Active SIA case' : 'Active site');
}
