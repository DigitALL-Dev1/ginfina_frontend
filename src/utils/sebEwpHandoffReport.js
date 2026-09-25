import { recordFields } from './siaCompletionReport';

export function buildSebEwpHandoffReport({ handoff, snapshot, acceptance, items, sebId, revisionId }) {
  const link = handoff?.permanent_link;
  if (!handoff?.id || handoff.handoff_status !== 'ACCEPTED' || !link?.is_permanent ||
      link.seb_id !== sebId || link.seb_revision_id !== revisionId || handoff.seb_revision_id !== revisionId ||
      !acceptance?.id || acceptance.id !== link.acceptance_id || acceptance.ewb_handoff_id !== handoff.id)
    throw new Error('A saved acceptance and matching permanent EWP link are required for this report.');
  if (!snapshot?.id || snapshot.ewb_handoff_id !== handoff.id || snapshot.status !== 'RELEASED' ||
      snapshot.seb?.id !== sebId || snapshot.released_revision?.id !== revisionId ||
      snapshot.released_revision.release_id !== link.seb_release_id || !snapshot.snapshot_hash)
    throw new Error('The frozen snapshot does not match this handoff and released revision.');
  const frozen = snapshot.released_seb_items;
  if (!Array.isArray(frozen) || frozen.length !== snapshot.item_count ||
      new Set(frozen.map(item => item?.seb_item_id)).size !== frozen.length ||
      !Array.isArray(items) || !items.length || new Set(items.map(item => item?.seb_item_id)).size !== items.length ||
      items.some(item => !item?.seb_item_id || item.ewb_handoff_id !== handoff.id || !frozen.some(fact => fact.seb_item_id === item.seb_item_id)))
    throw new Error('The saved handoff item list is incomplete or does not match the frozen release. Reload the report.');

  const sections = [{ title: 'Report summary', fields: [
    { label: 'Report generated at (UTC)', value: new Date().toISOString() },
    { label: 'Scope', value: 'Selected handoff items from the frozen released SEB revision' },
  ] }];
  const add = (title, record) => sections.push({ title, fields: recordFields(record) });
  const { released_seb_items, ...snapshotDetails } = snapshot;
  const { permanent_link, ...handoffDetails } = handoff;
  add('Project, SIA case and frozen release', snapshotDetails);
  add('Handoff and EWP review', handoffDetails);
  add('Saved EWP acceptance', acceptance);
  add('Permanent EWP link', link);
  for (const [index, item] of items.entries()) {
    const fact = frozen.find(row => row.seb_item_id === item.seb_item_id);
    const { item_value_snapshot, ...itemDetails } = item;
    let context = item_value_snapshot;
    if (typeof context === 'string' && context.trim()) {
      try { context = JSON.parse(context); }
      catch { throw new Error('A saved handoff item has unreadable context. Reload the report.'); }
    }
    add(`Selected item ${index + 1} - ${fact.item_name || fact.item_code || fact.seb_item_id}`, fact);
    add(`Item ${index + 1} handoff record`, itemDetails);
    if (context && typeof context === 'object' && !Array.isArray(context))
      add(`Item ${index + 1} saved conditions, blockers and evidence`, context);
    else add(`Item ${index + 1} saved context`, { details: 'No additional context recorded' });
  }
  return {
    code: handoff.handoff_code || handoff.id, sections,
    counts: [{ label: 'Selected handoff items', value: items.length }, { label: 'Items in frozen release', value: frozen.length }],
  };
}
