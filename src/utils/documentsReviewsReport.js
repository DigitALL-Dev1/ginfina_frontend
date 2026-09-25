import { recordFields } from './siaCompletionReport';

export function buildDocumentsReviewsReport({ document, deliverable, ewpId, documentId }) {
  if (!documentId || document?.id !== documentId || !ewpId || document.ewp_id !== ewpId ||
      !deliverable?.id || document.deliverable_id !== deliverable.id || deliverable.ewp?.id !== ewpId)
    throw new Error('The saved document does not match the selected EWP and deliverable. Reload the report.');
  const { revisions, reviewers, comments, ...documentDetails } = document;
  for (const [label, rows] of [['revision history', revisions], ['reviewers', reviewers], ['comments', comments]]) {
    if (!Array.isArray(rows) || rows.some(row => !row?.id || row.document_id !== documentId) || new Set(rows.map(row => row.id)).size !== rows.length)
      throw new Error(`The saved ${label} are incomplete or belong to another document. Reload the report.`);
  }
  const current = revisions.find(row => row.id === document.current_revision_id);
  if (!current || reviewers.some(row => row.revision_id !== current.id) || comments.some(row => !revisions.some(revision => revision.id === row.revision_id)))
    throw new Error('The current revision or its review references are missing or inconsistent. Reload the report.');
  const { ewp, ...deliverableDetails } = deliverable;
  const sections = [];
  const add = (title, record) => sections.push({ title, fields: recordFields(record) });
  add('Report summary', {
    generated_at_utc: new Date().toISOString(), document_status: document.status,
    current_revision: current.revision_no, current_revision_status: current.status,
    review_completed_at: current.review_completed_at || null,
    scope: 'Current revision reviewer assignments and decisions; saved comments and revision history returned for this document.',
  });
  add('EWP context', ewp);
  add('Linked deliverable', deliverableDetails);
  add('Document details', documentDetails);
  // Server storage paths are implementation details; retain user-facing file metadata.
  const revisionDetails = ({ storage_path, ...record }) => record;
  add('Current revision and file', revisionDetails(current));
  add('Technical review summary', {
    assigned_reviewers: reviewers.length,
    completed_reviewers: reviewers.filter(row => row.status === 'COMPLETED').length,
    ...Object.fromEntries(['ACCEPT', 'ACCEPT_WITH_COMMENT', 'CHANGE_REQUIRED', 'REJECT'].map(decision => [decision.toLowerCase(), reviewers.filter(row => row.decision === decision).length])),
    total_comments: comments.length,
    open_comments: comments.filter(row => row.status !== 'CLOSED').length,
    closed_comments: comments.filter(row => row.status === 'CLOSED').length,
  });
  if (!reviewers.length) add('Current revision reviewers', { details: 'No reviewers assigned to the current revision' });
  reviewers.forEach((row, index) => add(`Current revision reviewer ${index + 1}`, row));
  if (!comments.length) add('Review comments and responses', { details: 'No saved review comments' });
  comments.forEach((row, index) => add(`Comment ${index + 1} - ${revisions.find(revision => revision.id === row.revision_id).revision_no}`, row));
  revisions.forEach(row => add(`Revision history - ${row.revision_no || row.id}`, revisionDetails(row)));
  return {
    code: `${document.document_code || documentId}-${current.revision_no || current.id}`, sections,
    counts: [{ label: 'Revisions', value: revisions.length }, { label: 'Current reviewers', value: reviewers.length },
      { label: 'Completed reviewers', value: reviewers.filter(row => row.status === 'COMPLETED').length },
      { label: 'Open comments', value: comments.filter(row => row.status !== 'CLOSED').length }],
  };
}
