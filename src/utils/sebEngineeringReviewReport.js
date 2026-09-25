import { recordFields } from './siaCompletionReport';

export const REVIEW_DECISIONS = ['ACCEPT', 'ACCEPT_WITH_CONDITION', 'CHANGE_REQUIRED', 'REJECT'];

export function buildSebEngineeringReviewReport({ baseline, revision, items, sessionReviews = {} }) {
  if (!baseline?.id || !revision?.id || revision.seb_id !== baseline.id)
    throw new Error('Select a matching SEB and revision to prepare the report.');
  if (!Array.isArray(items) || items.some(item => !item?.id || item.seb_id !== baseline.id || item.seb_revision_id !== revision.id))
    throw new Error('The review records do not match the selected SEB revision. Reload the report.');
  const counts = REVIEW_DECISIONS.map(decision => ({ label: decision.replaceAll('_', ' '), value: items.filter(item => item.decision === decision).length }));
  const pending = items.filter(item => !REVIEW_DECISIONS.includes(item.decision)).length;
  counts.unshift({ label: 'Total items', value: items.length });
  counts.push({ label: 'Pending decision', value: pending });
  const sections = [
    { title: 'Engineering review summary', fields: [
      { label: 'Revision status', value: revision.revision_status || 'Not provided' },
      { label: 'Report generated at (UTC)', value: new Date().toISOString() },
      ...counts.map(count => ({ label: count.label, value: String(count.value) })),
    ] },
    { title: 'SEB details', fields: recordFields(baseline) },
    { title: 'Revision details', fields: recordFields(revision) },
  ];
  if (!items.length) sections.push({ title: 'Review items', fields: [{ label: 'Items', value: 'No review items returned for this revision.' }] });
  for (const [index, item] of items.entries()) {
    const session = sessionReviews[item.id];
    const saved = session?.seb_id === baseline.id && session?.seb_revision_id === revision.id && session?.decision === item.decision ? session : null;
    const { fact_data, ...details } = item;
    const reviewer = item.reviewer !== undefined ? item.reviewer : saved?.reviewer;
    const comment = item.review_comment !== undefined ? item.review_comment : saved?.comment;
    sections.push({ title: `Item ${index + 1}: ${item.fact_name || item.fact_id}`, fields: [
      ...recordFields(details),
      { label: 'Reviewer', value: reviewer === undefined ? 'Not returned by the API' : reviewer || 'Not provided' },
      { label: 'Review comment', value: comment === undefined ? 'Not returned by the API' : comment || 'No comment recorded' },
      ...(saved ? [{ label: 'Review detail source', value: 'Reviewer and comment retained from a successful save in this session.' }] : []),
    ] });
    sections.push({ title: `Source fact ${index + 1}`, fields: fact_data && typeof fact_data === 'object' && !Array.isArray(fact_data) && Object.keys(fact_data).length
      ? recordFields(fact_data) : [{ label: 'Source data', value: 'Fact details unavailable. Refer to the fact ID and collection above.' }] });
  }
  return { code: `${baseline.seb_code || baseline.id}-${revision.revision_no || revision.id}`, counts, sections };
}
