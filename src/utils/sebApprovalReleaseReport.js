import { recordFields } from './siaCompletionReport';

const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);

export function buildSebApprovalReleaseReport(summary, sebId, revisionId) {
  if (!sebId || !revisionId || summary?.seb?.id !== sebId || summary?.revision?.id !== revisionId || summary.revision.seb_id !== sebId)
    throw new Error('The report does not match the selected SEB and revision. Reload the report.');
  const released = summary.revision.revision_status === 'RELEASED';
  const { approval: revisionApproval, ...revisionDetails } = summary.revision;
  const release = summary.release;
  const frozen = release?.frozen_snapshot;
  if (released && (!release?.id || release.seb_revision_id !== revisionId || release.release_status !== 'RELEASED' ||
      !release.release_hash || !isRecord(frozen) || frozen.seb_id !== sebId || frozen.seb_revision_id !== revisionId))
    throw new Error('The released revision has no matching frozen release record. Reload the report.');

  const sections = [{ title: 'Report summary', fields: [
    { label: 'Report type', value: released ? 'Frozen release report' : 'Approval preview — not released' },
    { label: 'Revision status', value: summary.revision.revision_status || 'Not provided' },
    { label: 'Report generated at (UTC)', value: new Date().toISOString() },
  ] },
  { title: 'SEB context', fields: recordFields(summary.seb) },
  { title: 'Revision details', fields: recordFields(revisionDetails) }];
  const addRecord = (title, record, empty) => sections.push({ title, fields: isRecord(record) && Object.keys(record).length ? recordFields(record) : [{ label: 'Details', value: empty }] });
  function addRows(title, rows) {
    if (!Array.isArray(rows) || rows.some(row => !isRecord(row))) throw new Error(`The ${title.toLowerCase()} data is incomplete. Reload the report.`);
    if (!rows.length) sections.push({ title, fields: [{ label: 'Records', value: 'None recorded' }] });
    rows.forEach((row, index) => sections.push({ title: `${title} — ${index + 1} of ${rows.length}`, fields: recordFields(row) }));
  }
  let items, evidence;
  if (released) {
    items = frozen.items; evidence = frozen.evidence_references;
    if (!Array.isArray(items) || !Array.isArray(frozen.item_ids) || items.length !== frozen.item_ids.length ||
        new Set(frozen.item_ids).size !== frozen.item_ids.length || new Set(items.map(item => item?.seb_item_id)).size !== items.length || items.some(item => !item?.seb_item_id || !frozen.item_ids.includes(item.seb_item_id)))
      throw new Error('The frozen item list is incomplete. Reload the report.');
    // Frozen approvals, readiness, conditions and source references are authoritative after release.
    const { frozen_snapshot, ...releaseDetails } = release;
    const { items: frozenItems, evidence_references, item_sources, fact_source_references, approver, ...snapshotDetails } = frozen;
    addRecord('Release record', releaseDetails);
    addRecord('Frozen approval', approver, 'No approval details in the frozen snapshot.');
    addRecord('Frozen snapshot details', snapshotDetails);
    addRows('Frozen SEB items / readiness / conditions', items);
    addRows('Frozen fact references', fact_source_references);
    addRows('Frozen item sources', item_sources);
    addRows('Frozen evidence references', evidence);
  } else {
    items = summary.items; evidence = summary.evidence_references;
    addRecord('Saved engineering approval', summary.approval, 'No approval decision recorded.');
    addRecord('Engineering review totals', summary.engineering_review, 'No review totals returned.');
    for (const [title, rows] of [['Discipline readiness', summary.readiness], ['Conditions', summary.conditions], ['Blockers', summary.blockers],
      ['SEB items', items], ['Item sources', summary.item_sources], ['Evidence references', evidence], ['Review comments', summary.review_comments]]) addRows(title, rows);
  }
  const counts = [{ label: released ? 'Frozen items' : 'SEB items', value: items.length }, { label: 'Evidence references', value: evidence.length }];
  return { code: `${summary.seb.seb_code || sebId}-${summary.revision.revision_no || revisionId}`, sections, counts };
}
