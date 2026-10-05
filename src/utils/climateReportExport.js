const columns = ['id', 'site_id', 'resource_type', 'parameter_name', 'parameter_value', 'parameter_text', 'unit', 'period_from', 'period_to', 'source_name', 'reliability_status', 'remarks'];
const label = key => key.replaceAll('_', ' ');

export function climateCsv(resources) {
  const cell = value => {
    let text = String(value ?? '');
    if (typeof value === 'string' && /^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return '\uFEFF' + [columns, ...resources.map(row => columns.map(key => row[key]))]
    .map(row => row.map(cell).join(',')).join('\r\n');
}

export function climatePdfReport(siteId, summary, resources) {
  const fields = row => Object.entries(row).map(([key, value]) => ({
    label: label(key), value: value == null || value === '' ? 'Not provided' : String(value),
  }));
  return { code: siteId, sections: [
    { title: 'Summary', fields: fields({ total_resources: resources.length, resource_types: summary.length }) },
    ...summary.map(row => ({ title: row.resource_type || 'Resource summary', fields: fields(row) })),
    ...resources.map((row, index) => ({ title: `${index + 1}. ${row.parameter_name || row.resource_type || 'Climate resource'}`, fields: fields(row) })),
  ] };
}
