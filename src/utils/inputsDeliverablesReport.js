import { recordFields } from './siaCompletionReport';

export function buildInputsDeliverablesReport(context, workItemId) {
  const { ewp, work_item: work, inputs, confirmation, deliverables } = context || {};
  if (!workItemId || !ewp?.id || work?.id !== workItemId || work.ewp_id !== ewp.id)
    throw new Error('The saved report does not match the selected engineering activity. Reload the report.');
  for (const [label, rows] of [['inputs', inputs], ['deliverables', deliverables]]) {
    if (!Array.isArray(rows) || rows.some(row => !row?.id || row.ewp_id !== ewp.id) || new Set(rows.map(row => row.id)).size !== rows.length)
      throw new Error(`The saved ${label} are incomplete or belong to another EWP. Reload the report.`);
  }
  if (inputs.some(input => input.seb_id !== ewp.seb_id || input.seb_revision_id !== ewp.seb_revision_id || input.freeze_snapshot_id !== ewp.freeze_snapshot_id) ||
      deliverables.some(item => item.engineering_work_item_id !== workItemId))
    throw new Error('The saved inputs or deliverables do not match this activity and its frozen SEB basis.');
  if (confirmation && (confirmation.ewp_id !== ewp.id || confirmation.engineering_work_item_id !== workItemId ||
      !Array.isArray(confirmation.input_ids) || confirmation.input_ids.some(id => !inputs.some(input => input.id === id)) ||
      (confirmation.confirmed && inputs.some(input => input.required && !confirmation.input_ids.includes(input.id)))))
    throw new Error('The saved input confirmation does not match this activity. Reload the report.');
  const confirmedIds = new Set(confirmation?.confirmed ? confirmation.input_ids : []);
  const ready = deliverables.filter(item => item.status === 'READY_FOR_REVIEW').length;
  const sections = [];
  const add = (title, record) => sections.push({ title, fields: recordFields(record) });
  add('Report summary', {
    report_generated_at_utc: new Date().toISOString(),
    required_inputs_confirmed: Boolean(confirmation?.confirmed),
    deliverables_ready_for_review: ready,
    next_module: ready ? `${ready} deliverable(s) ready for Documents & Reviews` : 'No deliverables are READY_FOR_REVIEW yet',
  });
  add('Saved EWP and controlled SEB basis', ewp);
  add('Linked engineering activity', work);
  add('Saved input confirmation', confirmation || { details: 'Required inputs have not been confirmed' });
  add('Deliverable preparation summary', {
    total: deliverables.length,
    ...Object.fromEntries(['NOT_STARTED', 'DRAFT', 'IN_PROGRESS', 'READY_FOR_REVIEW'].map(status => [status.toLowerCase(), deliverables.filter(item => item.status === status).length])),
    review_required: deliverables.filter(item => item.review_required).length,
    approval_required: deliverables.filter(item => item.approval_required).length,
  });
  if (!inputs.length) add('Engineering inputs', { details: 'No saved engineering inputs' });
  inputs.forEach((input, index) => add(`Engineering input ${index + 1} - ${input.name || input.id}`, { ...input, confirmed_for_this_activity: confirmedIds.has(input.id) }));
  if (!deliverables.length) add('Deliverable register', { details: 'No saved deliverables yet' });
  deliverables.forEach((item, index) => add(`Deliverable ${index + 1} - ${item.code || item.id}`, item));
  return {
    code: `${ewp.ewp_code || ewp.id}-${work.work_code || work.id}`, sections,
    counts: [{ label: 'Engineering inputs', value: inputs.length }, { label: 'Confirmed inputs', value: confirmedIds.size },
      { label: 'Deliverables', value: deliverables.length }, { label: 'Ready for review', value: ready }],
  };
}
