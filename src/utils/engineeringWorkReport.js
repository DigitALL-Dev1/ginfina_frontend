import { recordFields } from './siaCompletionReport';

const itemId = item => String(item.release_item_id || item.seb_item_id || item.id || '');
const STATUSES = ['DRAFT', 'NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'READY_FOR_OUTPUT', 'COMPLETED'];

export function buildEngineeringWorkReport({ ewp, source, links, work }) {
  if (!ewp?.id || !source || ewp.project_id !== source.project_id || ewp.seb_id !== source.seb_id ||
      ewp.seb_revision_id !== source.revision_id || ewp.freeze_snapshot_id !== source.freeze_snapshot_id || source.status !== 'RELEASED')
    throw new Error('The saved EWP does not match the selected frozen SEB revision.');
  const frozen = source.released_seb_items;
  if (!Array.isArray(frozen) || !Array.isArray(links) || !links.length ||
      new Set(links.map(link => link?.release_item_id)).size !== links.length ||
      links.some(link => !link?.release_item_id || link.ewp_id !== ewp.id || link.freeze_snapshot_id !== ewp.freeze_snapshot_id ||
        link.seb_id !== ewp.seb_id || link.seb_revision_id !== ewp.seb_revision_id ||
        frozen.filter(item => itemId(item) === link.release_item_id).length !== 1))
    throw new Error('The saved input links do not match the frozen release items.');
  if (!Array.isArray(work) || work.some(item => !item?.id || item.ewp_id !== ewp.id) || new Set(work.map(item => item.id)).size !== work.length)
    throw new Error('The saved activities do not match this EWP. Reload the report.');
  const sections = [{ title: 'Report summary', fields: [
    { label: 'Report generated at (UTC)', value: new Date().toISOString() },
    { label: 'EWP status', value: ewp.status || 'Not provided' },
    { label: 'Report scope', value: 'Saved EWP definition, linked frozen SEB inputs and saved engineering activities' },
  ] }];
  const add = (title, record) => sections.push({ title, fields: recordFields(record) });
  const { released_seb_items, ...release } = source;
  add('Saved EWP definition', ewp);
  add('Project and released SEB basis', release);
  add('Engineering activity summary', {
    total_activities: work.length,
    ...Object.fromEntries(STATUSES.map(status => [status.toLowerCase(), work.filter(item => item.status === status).length])),
    all_activities_ready_for_output: work.length > 0 && work.every(item => ['READY_FOR_OUTPUT', 'COMPLETED'].includes(item.status)),
  });
  for (const [index, link] of links.entries()) {
    add(`Selected SEB input ${index + 1}`, frozen.find(item => itemId(item) === link.release_item_id));
    add(`Input ${index + 1} saved link`, link);
  }
  if (!work.length) add('Engineering activities', { details: 'No saved engineering activities yet' });
  work.forEach((item, index) => add(`Activity ${index + 1} - ${item.work_code || item.id}`, item));
  return { code: ewp.ewp_code || ewp.id, sections, counts: [
    { label: 'Linked SEB inputs', value: links.length },
    { label: 'Engineering activities', value: work.length },
    { label: 'Ready for output / completed', value: work.filter(item => ['READY_FOR_OUTPUT', 'COMPLETED'].includes(item.status)).length },
  ] };
}
