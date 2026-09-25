const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);
const labels = { id: 'Record ID', sia_case_id: 'SIA case ID', site_id: 'Site ID', project_id: 'Project ID', poi_id: 'POI ID' };
export const completionReportLabel = key => labels[key] || key.replace(/^sia_/, '').split('_')
  .map(word => ['ai', 'sia', 'seb', 'gis', 'hse', 'scada', 'rfi', 'qa', 'id'].includes(word.toLowerCase()) ? word.toUpperCase() : word)
  .join(' ').replace(/^./, c => c.toUpperCase());

export function validateCompletionPackage(data, caseId, siteId) {
  if (!isRecord(data) || data.sia_case_id !== caseId || data.site_id !== siteId || data.case?.id !== caseId || data.site?.id !== siteId || data.site?.sia_case_id !== caseId)
    throw new Error('The completion package does not match the selected SIA case and site.');
  if (!isRecord(data.modules) || Object.values(data.modules).some(rows => !Array.isArray(rows) || rows.some(row => !isRecord(row) || !row.id)))
    throw new Error('The completion package is incomplete. Reload the package to try again.');
}

// Render nested record fields as labeled values instead of raw JSON.
export function recordFields(record) {
  const result = [];
  function add(value, path) {
    if (Array.isArray(value) && value.length) {
      value.forEach((item, index) => add(item, `${path} / ${index + 1}`));
    } else if (isRecord(value) && Object.keys(value).length) {
      Object.entries(value).forEach(([key, item]) => add(item, path ? `${path} / ${completionReportLabel(key)}` : completionReportLabel(key)));
    } else {
      const display = value === null || value === undefined || value === '' ? 'Not provided'
        : typeof value === 'boolean' ? value ? 'Yes' : 'No'
          : Array.isArray(value) || isRecord(value) ? 'No entries' : String(value);
      result.push({ label: path, value: display });
    }
  }
  Object.entries(record).forEach(([key, value]) => add(value, completionReportLabel(key)));
  return result;
}

export function buildCompletionReport(packageData, { caseId, siteId, notes = '', completeConfirmed = false, readinessConfirmed = false }) {
  validateCompletionPackage(packageData, caseId, siteId);
  const verified = String(packageData.case.status).toLowerCase() === 'verified' && String(packageData.site.status).toLowerCase() === 'verified';
  const entries = Object.entries(packageData.modules);
  const sections = [
    { title: 'Completion summary', fields: [
      { label: 'Verification status', value: verified ? 'Verified for SEB input' : 'Not verified for SEB input' },
      { label: 'Package loaded at', value: packageData.loaded_at || 'Not provided' },
      { label: 'Report generated at (UTC)', value: new Date().toISOString() },
      { label: 'Module groups returned', value: String(entries.length) },
      { label: 'Related records returned', value: String(entries.reduce((sum, [, rows]) => sum + rows.length, 0)) },
    ] },
    { title: 'Case details', fields: recordFields(packageData.case) },
    { title: 'Site details', fields: recordFields(packageData.site) },
    { title: 'Local review', fields: [
      { label: 'Completeness confirmation (this session)', value: completeConfirmed ? 'Confirmed' : 'Not confirmed' },
      { label: 'SEB readiness confirmation (this session)', value: readinessConfirmed ? 'Confirmed' : 'Not confirmed' },
      { label: 'Review notes (local, not saved)', value: notes || 'No local review notes.' },
    ] },
  ];
  if (!entries.length) sections.push({ title: 'Related SIA records', fields: [{ label: 'Records', value: 'No related SIA module records were returned for this package.' }] });
  for (const [name, rows] of entries) {
    const title = completionReportLabel(name);
    if (!rows.length) sections.push({ title: `${title} (0)`, fields: [{ label: 'Records', value: 'No records returned for this module.' }] });
    rows.forEach((row, index) => {
      // Verification returns updated case/site records. Keep their repeated entries consistent.
      const current = name === 'sia_case' && row.id === caseId ? { ...row, ...packageData.case }
        : name === 'sia_site' && row.id === siteId ? { ...row, ...packageData.site } : row;
      sections.push({ title: `${title} — ${index + 1} of ${rows.length}`, fields: recordFields(current) });
    });
  }
  return { code: `${packageData.case.case_code || caseId}-${packageData.site.site_code || siteId}`, sections,
    counts: entries.map(([key, rows]) => ({ key, label: completionReportLabel(key), value: rows.length })) };
}
