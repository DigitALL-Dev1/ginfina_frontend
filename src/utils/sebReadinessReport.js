import { recordFields } from './siaCompletionReport';

export const READINESS_STATUSES = ['READY', 'CONDITIONAL', 'BLOCKED', 'NOT_APPLICABLE'];
export const readinessStatus = item => typeof item.discipline_readiness === 'string' ? item.discipline_readiness : item.discipline_readiness?.status;

export function buildSebReadinessReport({ baseline, revision, items }) {
  if (!baseline?.id || !revision?.id || revision.seb_id !== baseline.id)
    throw new Error('Select a matching SEB and revision to prepare the report.');
  if (!Array.isArray(items) || items.some(item => !item?.id || item.seb_id !== baseline.id || item.seb_revision_id !== revision.id))
    throw new Error('The readiness records do not match this SEB revision. Reload the report.');
  const counts = [{ label: 'Total items', value: items.length }, ...READINESS_STATUSES.map(status => ({ label: status.replaceAll('_', ' '), value: items.filter(item => readinessStatus(item) === status).length })),
    { label: 'Not assessed', value: items.filter(item => !READINESS_STATUSES.includes(readinessStatus(item))).length }];
  const sections = [
    { title: 'Readiness summary', fields: [
      { label: 'Revision status', value: revision.revision_status || 'Not provided' },
      { label: 'Report generated at (UTC)', value: new Date().toISOString() },
      ...counts.map(count => ({ label: count.label, value: String(count.value) })),
    ] },
    { title: 'SEB details', fields: recordFields(baseline) },
    { title: 'Revision details', fields: recordFields(revision) },
  ];
  const groups = new Map();
  for (const item of items) {
    const discipline = String(item.review_discipline || item.discipline || item.fact_data?.discipline || 'UNASSIGNED').toUpperCase();
    if (!groups.has(discipline)) groups.set(discipline, []);
    groups.get(discipline).push(item);
  }
  if (!items.length) sections.push({ title: 'Assessed items', fields: [{ label: 'Items', value: 'No reviewed SEB items returned for this revision.' }] });
  for (const [discipline, records] of groups) {
    sections.push({ title: `${discipline} — item readiness`, fields: records.map(item => ({ label: item.fact_name || item.fact_id || item.id, value: readinessStatus(item) || 'NOT_ASSESSED' })) });
    for (const item of records) {
      const { fact_data, discipline_readiness, ...details } = item;
      sections.push({ title: `Item: ${item.fact_name || item.fact_id || item.id}`, fields: recordFields(details) });
      sections.push({ title: 'Readiness, conditions and blockers', fields: discipline_readiness && typeof discipline_readiness === 'object'
        ? recordFields(discipline_readiness)
        : [{ label: 'Readiness', value: discipline_readiness || 'NOT_ASSESSED' }, { label: 'Condition / blocker details', value: 'No structured details returned for this item.' }] });
      sections.push({ title: 'Source fact / evidence references', fields: fact_data && typeof fact_data === 'object' && !Array.isArray(fact_data) && Object.keys(fact_data).length
        ? recordFields(fact_data) : [{ label: 'Source data', value: 'Fact details unavailable. Refer to the fact ID and collection above.' }] });
    }
  }
  return { code: `${baseline.seb_code || baseline.id}-${revision.revision_no || revision.id}`, counts, sections };
}
