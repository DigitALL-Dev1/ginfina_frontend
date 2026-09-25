import { describe, expect, it } from 'vitest';
import { buildEngineeringWorkReport } from './engineeringWorkReport';

const fixture = () => ({
  ewp: { id: 'ewp', ewp_code: 'EWP-001', project_id: 'project', seb_id: 'seb', seb_revision_id: 'rev', freeze_snapshot_id: 'freeze', status: 'DRAFT', scope: 'Electrical design' },
  source: { project_id: 'project', project_name: 'Hospital Solar Project', seb_id: 'seb', revision_id: 'rev', freeze_snapshot_id: 'freeze', status: 'RELEASED', release_hash: 'release-hash', released_seb_items: [
    { seb_item_id: 'item', item_name: 'Transformer', item_value: 0, readiness: { status: 'CONDITIONAL', conditional: { enabled: true, condition: 'Check rating', owner: 'Engineer A', target_date: '2026-10-01' } } },
    { seb_item_id: 'other', item_name: 'Unselected roof' },
  ] },
  links: [{ id: 'link', ewp_id: 'ewp', release_item_id: 'item', freeze_snapshot_id: 'freeze', seb_id: 'seb', seb_revision_id: 'rev' }],
  work: [{ id: 'work', ewp_id: 'ewp', work_code: 'EWO-001', title: 'Load analysis', assigned_engineers: ['Engineer A', 'Engineer B'], status: 'IN_PROGRESS', progress: 0 }],
});

describe('Engineering work report', () => {
  it('includes saved work and selected frozen inputs without mutating records', () => {
    const input = fixture(), before = JSON.stringify(input);
    const report = buildEngineeringWorkReport(input);
    const fields = report.sections.flatMap(section => section.fields);
    expect(fields).toContainEqual({ label: 'Item value', value: '0' });
    expect(fields).toContainEqual({ label: 'Progress', value: '0' });
    for (const value of ['Hospital Solar Project', 'Check rating', 'Engineer B', 'release-hash', 'Load analysis']) expect(JSON.stringify(report)).toContain(value);
    expect(JSON.stringify(report)).not.toContain('Unselected roof');
    expect(report.counts.map(count => count.value)).toEqual([1, 1, 0]);
    expect(JSON.stringify(input)).toBe(before);
  });
  it('distinguishes empty work from activities ready for output', () => {
    const input = fixture(); input.work = [];
    expect(JSON.stringify(buildEngineeringWorkReport(input))).toContain('No saved engineering activities yet');
    input.work = ['DRAFT', 'NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'READY_FOR_OUTPUT', 'COMPLETED'].map((status, i) => ({ id: `work-${i}`, ewp_id: 'ewp', status }));
    expect(buildEngineeringWorkReport(input).counts.map(count => count.value)).toEqual([1, 6, 2]);
  });
  it('rejects mismatched source, missing input links and activities from another EWP', () => {
    for (const mutate of [x => { x.source.revision_id = 'other'; }, x => { x.source.freeze_snapshot_id = 'other'; },
      x => { x.links = []; }, x => { x.links[0].release_item_id = 'unknown'; }, x => { x.links.push(x.links[0]); },
      x => { x.work[0].ewp_id = 'other'; }, x => { x.work = null; }]) {
      const input = fixture(); mutate(input);
      expect(() => buildEngineeringWorkReport(input)).toThrow();
    }
  });
});
