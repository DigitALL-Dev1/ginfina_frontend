import { describe, expect, it } from 'vitest';
import { buildSebEwpHandoffReport } from './sebEwpHandoffReport';

const fixture = () => ({
  sebId: 'seb', revisionId: 'rev',
  handoff: { id: 'handoff', handoff_code: 'HO-001', seb_revision_id: 'rev', handoff_status: 'ACCEPTED', reviewed_by: 'Engineer A', review_comment: 'Verified', permanent_link: { is_permanent: true, seb_id: 'seb', seb_revision_id: 'rev', seb_release_id: 'release', acceptance_id: 'acceptance' } },
  acceptance: { id: 'acceptance', ewb_handoff_id: 'handoff', acceptance_decision: 'ACCEPT_WITH_CONDITION', acceptance_comment: 'Complete roof check' },
  snapshot: { id: 'freeze', ewb_handoff_id: 'handoff', status: 'RELEASED', snapshot_hash: 'hash', seb: { id: 'seb' }, released_revision: { id: 'rev', release_id: 'release' }, project: { name: 'Hospital Solar Project' }, item_count: 2, released_seb_items: [
    { seb_item_id: 'item', item_name: 'Transformer', item_value: 0, unit: 'kVA', readiness: { status: 'CONDITIONAL', conditional: { enabled: true, condition: 'Verify rating', owner: 'Engineer B' } } },
    { seb_item_id: 'other', item_name: 'Unselected roof' },
  ] },
  items: [{ id: 'handoff-item', ewb_handoff_id: 'handoff', seb_item_id: 'item', item_value_snapshot: JSON.stringify({ evidence_references: [{ evidence_hash: 'evidence-hash' }], blockers: [], conditions: [{ condition: 'Check rating' }] }) }],
});

describe('EWP handoff report', () => {
  it('reports only saved selected items with readable frozen values and acceptance', () => {
    const input = fixture(), before = JSON.stringify(input);
    const report = buildSebEwpHandoffReport(input);
    const fields = report.sections.flatMap(section => section.fields);
    expect(fields).toContainEqual({ label: 'Item value', value: '0' });
    expect(JSON.stringify(report)).toContain('Hospital Solar Project');
    expect(JSON.stringify(report)).toContain('Verify rating');
    expect(JSON.stringify(report)).toContain('evidence-hash');
    expect(JSON.stringify(report)).toContain('Complete roof check');
    expect(JSON.stringify(report)).not.toContain('Unselected roof');
    expect(report.counts.map(count => count.value)).toEqual([1, 2]);
    expect(JSON.stringify(input)).toBe(before);
  });
  it('blocks export for missing or mismatched acceptance, scope, snapshot or selected items', () => {
    for (const mutate of [x => { x.acceptance = null; }, x => { x.sebId = 'other'; }, x => { x.snapshot = null; },
      x => { x.snapshot.released_revision.release_id = 'wrong'; }, x => { x.snapshot.item_count = 3; },
      x => { x.items = []; }, x => { x.items[0].seb_item_id = 'missing'; }, x => { x.items.push(x.items[0]); },
      x => { x.items[0].ewb_handoff_id = 'other'; }]) {
      const input = fixture(); mutate(input);
      expect(() => buildSebEwpHandoffReport(input)).toThrow();
    }
  });
  it('handles missing optional context and rejects corrupted saved JSON', () => {
    const input = fixture(); input.items[0].item_value_snapshot = null;
    expect(JSON.stringify(buildSebEwpHandoffReport(input))).toContain('No additional context recorded');
    input.items[0].item_value_snapshot = '{broken';
    expect(() => buildSebEwpHandoffReport(input)).toThrow('unreadable context');
  });
});
