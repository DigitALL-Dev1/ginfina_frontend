import { recordFields } from './siaCompletionReport';

export function buildQuantitiesProcurementReport({ register, ewp, ewpId, registerId }) {
  if (!ewpId || !registerId || ewp?.id !== ewpId || register?.id !== registerId || register.ewp_id !== ewpId)
    throw new Error('The saved quantity register does not match the selected EWP. Reload the report.');
  const { items, boqs, history, handoff, ...details } = register;
  if (![items, boqs, history].every(Array.isArray) || history.some(row => !row || typeof row !== 'object'))
    throw new Error('The saved quantities, BOQ history or activity history are incomplete. Reload the report.');
  const validateItems = rows => {
    if (!Array.isArray(rows) || rows.some(row => !row?.id || !Number.isFinite(row.quantity) || row.quantity <= 0 || !row.unit ||
      !row.source?.revision_id || !row.source.release_id || !row.source.document_id) || new Set(rows.map(row => row.id)).size !== rows.length)
      throw new Error('Quantity items or their released source references are incomplete. Reload the report.');
  };
  validateItems(items);
  if (boqs.some(row => !row?.id || row.ewp_id !== ewpId) || new Set(boqs.map(row => row.id)).size !== boqs.length)
    throw new Error('The saved BOQ / EBOM snapshots do not match this EWP. Reload the report.');
  boqs.forEach(row => validateItems(row.items));
  const current = boqs.find(row => row.id === register.current_boq_id);
  if (register.current_boq_id && !current)
    throw new Error('The current BOQ / EBOM snapshot is missing. Reload the report.');
  if (handoff && (!current || handoff.ewp_id !== ewpId || handoff.boq_id !== current.id || handoff.boq_content_hash !== current.content_hash ||
      !Array.isArray(handoff.quantity_item_ids) || new Set(handoff.quantity_item_ids).size !== current.items.length ||
      current.items.some(item => !handoff.quantity_item_ids.includes(item.id)) ||
      !Array.isArray(handoff.source_release_ids) || current.items.some(item => !handoff.source_release_ids.includes(item.source.release_id))))
    throw new Error('The procurement handoff does not match its saved quantity snapshot. Reload the report.');

  const sections = [];
  const add = (title, data) => sections.push({ title, fields: recordFields(data) });
  const totals = rows => Object.entries(rows.reduce((result, row) => {
    result[row.unit] = (result[row.unit] || 0) + row.quantity;
    return result;
  }, Object.create(null))).map(([unit, quantity]) => ({ unit, quantity: Number(quantity.toPrecision(12)) }));
  add('Report summary', {
    generated_at_utc: new Date().toISOString(), register_status: register.status,
    current_quantity_set: current ? `${current.type} / ${current.revision_no}` : 'Not generated',
    procurement_status: handoff?.status || 'Not referenced',
    procurement_tracking_complete: handoff?.status === 'COMPLETED',
    scope: 'Saved quantity take-off, BOQ / EBOM snapshots and procurement tracking. Source references remain tied to their recorded engineering releases.',
  });
  add('Engineering work package', ewp);
  add('Quantity register', details);
  add('Take-off totals by unit', { totals: totals(items) });
  if (!items.length) add('Quantity take-off items', { details: 'No saved quantity items' });
  items.forEach((item, index) => add(`Take-off item ${index + 1} - ${item.item}`, item));
  if (!boqs.length) add('BOQ / EBOM register', { details: 'No BOQ / EBOM has been generated' });
  // Each historical snapshot retains its own quantities and sources, even after the take-off is edited.
  boqs.forEach(snapshot => {
    const { items: snapshotItems, ...metadata } = snapshot;
    const title = `${snapshot.type} / ${snapshot.revision_no}${snapshot.id === current?.id ? ' (current)' : ' (history)'}`;
    add(title, metadata);
    add(`${title} - totals by unit`, { totals: totals(snapshotItems) });
    snapshotItems.forEach((item, index) => add(`${title} - item ${index + 1}`, item));
  });
  add('Procurement handoff and tracking', handoff || { details: 'No procurement reference recorded' });
  if (!history.length) add('Activity history', { details: 'No recorded activities' });
  history.forEach((entry, index) => add(`Activity ${index + 1}`, entry));
  return {
    code: `${ewp.code || ewpId}-${register.name || registerId}-${register.id}`, sections,
    counts: [{ label: 'Quantity items', value: items.length }, { label: 'BOQ / EBOM snapshots', value: boqs.length },
      { label: 'Take-off source releases', value: new Set(items.map(row => row.source.release_id)).size },
      { label: 'Procurement status', value: handoff?.status || 'NOT_REFERENCED' }],
  };
}
