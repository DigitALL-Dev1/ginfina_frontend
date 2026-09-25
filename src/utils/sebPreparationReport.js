import { recordFields } from './siaCompletionReport';

export function buildSebPreparationReport({ baseline, revision, siaCase, site, items, reviewed, submitted }) {
  if (!baseline?.id || !revision?.id || revision.seb_id !== baseline.id ||
      baseline.sia_case_id !== siaCase?.id || baseline.site_id !== site?.id ||
      (site.sia_case_id && site.sia_case_id !== siaCase.id)) {
    throw new Error('The report records do not match the selected SEB, revision, case and site.');
  }
  if (!Array.isArray(items) || items.some(item => !item?.id || item.seb_id !== baseline.id || item.seb_revision_id !== revision.id)) {
    throw new Error('The report items do not match this SEB revision. Reload the review items.');
  }
  const { sites, ...caseDetails } = siaCase;
  const sections = [
    { title: 'Preparation summary', fields: recordFields({
      revision_status: revision.revision_status,
      submission_this_session: submitted ? 'Submitted for engineering review' : 'Not submitted in this session',
      source_review_this_session: reviewed ? 'Confirmed' : 'Not confirmed',
      saved_seb_items: items.length,
      report_generated_at_utc: new Date().toISOString(),
    }) },
    { title: 'SEB details', fields: recordFields(baseline) },
    { title: 'Revision details', fields: recordFields(revision) },
    { title: 'SIA case / project reference', fields: recordFields(caseDetails) },
    { title: 'Site details', fields: recordFields(site) },
  ];
  if (!items.length) sections.push({ title: 'SEB items', fields: [{ label: 'Items', value: 'No saved review items were returned for this revision.' }] });
  for (const [index, item] of items.entries()) {
    const { fact_data, ...details } = item;
    sections.push({ title: `SEB item ${index + 1} of ${items.length}`, fields: recordFields(details) });
    sections.push({ title: `Source fact ${index + 1}`, fields: fact_data && typeof fact_data === 'object' && !Array.isArray(fact_data) && Object.keys(fact_data).length
      ? recordFields(fact_data)
      : [{ label: 'Source data', value: 'Fact details unavailable. Use the fact ID and collection reference above.' }] });
  }
  return { code: `${baseline.seb_code || baseline.id}-${revision.revision_no || revision.id}`, sections, itemCount: items.length };
}
