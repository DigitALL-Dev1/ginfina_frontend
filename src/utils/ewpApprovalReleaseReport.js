import { recordFields } from './siaCompletionReport';

export function buildEwpApprovalReleaseReport({ context, ewpId, documentId, revisionId }) {
  const release = context?.release;
  if (!context || (context.status === 'RELEASED' && !release?.package))
    throw new Error('The saved approval package or frozen release is missing. Reload the report.');
  // A released report always uses the immutable package and approval in the release record.
  const pkg = release ? release.package : context.approval?.package || context.package;
  const approval = release ? release.approval : context.approval;
  if (!ewpId || !documentId || !revisionId || pkg?.ewp?.id !== ewpId ||
      pkg.document?.id !== documentId || pkg.revision?.id !== revisionId || !pkg.deliverable?.id)
    throw new Error('The saved package does not match the selected EWP, document and revision. Reload the report.');
  if (release && (release.ewp_id !== ewpId || release.document_id !== documentId ||
      release.revision_id !== revisionId || release.status !== 'RELEASED' || !release.release_hash || !approval))
    throw new Error('The frozen release references are missing or inconsistent. Reload the report.');
  for (const key of ['reviewers', 'comments', 'inputs', 'input_confirmations']) {
    if (!Array.isArray(pkg[key]) || pkg[key].some(row => !row || typeof row !== 'object'))
      throw new Error(`The saved ${key.replaceAll('_', ' ')} are incomplete. Reload the report.`);
  }
  if (pkg.reviewers.some(row => row.document_id !== documentId || row.revision_id !== revisionId) ||
      pkg.comments.some(row => row.document_id !== documentId) ||
      pkg.input_confirmations.some(row => row.ewp_id !== ewpId) ||
      pkg.inputs.some(row => !row.item || !row.release_item_id || row.freeze_snapshot_id !== pkg.seb_basis?.freeze_snapshot_id))
    throw new Error('The saved review or input references do not match this package. Reload the report.');

  const sections = [];
  const add = (title, data) => sections.push({ title, fields: recordFields(data) });
  add('Report summary', {
    generated_at_utc: new Date().toISOString(), revision_status: release ? release.status : context.status,
    report_basis: release ? 'Frozen release record' : 'Saved approval package - not yet released',
    current_revision: context.is_current,
    package_hash: release ? approval.package_hash : context.package_hash,
  });
  add('Engineering work package', pkg.ewp);
  add('Linked deliverable', pkg.deliverable);
  add('Document and reviewed revision', { document: pkg.document, revision: pkg.revision, prepared_by: pkg.prepared_by });
  add('Document file and integrity', pkg.file);
  add('Engineering review summary', {
    reviewers: pkg.reviewers.length, completed_reviewers: pkg.reviewers.filter(row => row.status === 'COMPLETED').length,
    ...Object.fromEntries(['ACCEPT', 'ACCEPT_WITH_COMMENT', 'CHANGE_REQUIRED', 'REJECT'].map(value => [value.toLowerCase(), pkg.reviewers.filter(row => row.decision === value).length])),
    total_comments: pkg.comments.length, open_comments: pkg.open_comments,
    closed_comments: pkg.comments.filter(row => row.status === 'CLOSED').length,
  });
  const addRows = (title, rows, empty) => {
    if (!rows.length) add(title, { details: empty });
    rows.forEach((row, index) => add(`${title} ${index + 1}`, row));
  };
  addRows('Reviewer', pkg.reviewers, 'No saved reviewers');
  addRows('Review comment and response', pkg.comments, 'No saved review comments');
  add('Frozen SEB design basis', pkg.seb_basis);
  addRows('Selected SEB input', pkg.inputs, 'No SEB inputs recorded');
  addRows('Engineering input confirmation', pkg.input_confirmations, 'No input confirmations recorded');
  const withoutPackage = ({ package: snapshot, ...record }) => record;
  add('Recorded approval and conditions', approval ? withoutPackage(approval) : { details: 'Approval not yet recorded' });
  if (release) {
    const { package: snapshot, approval: frozenApproval, ...record } = release;
    add('Controlled release record', record);
    add('Revision control', { details: 'This released revision is frozen. Engineering changes require a new revision.' });
  } else add('Controlled release record', { details: 'This revision has not been released' });
  return {
    code: `${pkg.document.code || documentId}-${pkg.revision.revision_no || revisionId}`, sections,
    counts: [{ label: 'Reviewers', value: pkg.reviewers.length }, { label: 'Open comments', value: pkg.open_comments },
      { label: 'SEB inputs', value: pkg.inputs.length }, { label: 'Revision status', value: release ? release.status : context.status }],
  };
}
