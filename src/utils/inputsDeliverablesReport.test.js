import { describe, expect, it } from 'vitest';
import { buildInputsDeliverablesReport } from './inputsDeliverablesReport';

const fixture = () => ({
  ewp: { id: 'ewp', ewp_code: 'EWP-001', seb_id: 'seb', seb_revision_id: 'rev', freeze_snapshot_id: 'freeze', release_hash: 'frozen-release-hash' },
  work_item: { id: 'work', ewp_id: 'ewp', work_code: 'EWO-001', status: 'READY_FOR_OUTPUT', progress: 0 },
  inputs: [{ id: 'input', ewp_id: 'ewp', seb_id: 'seb', seb_revision_id: 'rev', freeze_snapshot_id: 'freeze', name: 'Transformer 500 kVA', source: 'SEB-001 / R01', required: true, locked: true, status: 'CONDITIONAL' }],
  confirmation: null,
  deliverables: [],
});

describe('Inputs and deliverables report', () => {
  it('shows pending confirmation and an empty register without implying completion', () => {
    const report = buildInputsDeliverablesReport(fixture(), 'work');
    expect(report.counts.map(count => count.value)).toEqual([1, 0, 0, 0]);
    expect(JSON.stringify(report)).toContain('Required inputs have not been confirmed');
    expect(JSON.stringify(report)).toContain('No saved deliverables yet');
    expect(JSON.stringify(report)).toContain('No deliverables are READY_FOR_REVIEW yet');
  });
  it('includes every saved deliverable, false requirements and frozen references without mutating data', () => {
    const context = fixture();
    context.confirmation = { id: 'confirmation', ewp_id: 'ewp', engineering_work_item_id: 'work', input_ids: ['input'], confirmed: true, confirmed_by: 'Engineer A', confirmed_at: '2026-09-22' };
    context.deliverables = ['NOT_STARTED', 'DRAFT', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'READY_FOR_REVIEW'].map((status, i) => ({ id: `deliverable-${i}`, ewp_id: 'ewp', engineering_work_item_id: 'work', code: `DEL-${i}`, status, responsible_engineer: `Engineer ${i}`, review_required: true, approval_required: false, planned_issue_date: '2026-10-01' }));
    const before = JSON.stringify(context), report = buildInputsDeliverablesReport(context, 'work');
    expect(report.counts.map(count => count.value)).toEqual([1, 1, 5, 2]);
    expect(report.sections.filter(section => section.title.startsWith('Deliverable '))).toHaveLength(6);
    expect(report.sections.flatMap(section => section.fields)).toContainEqual({ label: 'Approval required', value: 'No' });
    for (const value of ['frozen-release-hash', 'SEB-001 / R01', 'CONDITIONAL', 'Engineer 4', '2026-10-01']) expect(JSON.stringify(report)).toContain(value);
    expect(JSON.stringify(context)).toBe(before);
  });
  it('rejects stale activities, mismatched revision links and inconsistent confirmations', () => {
    for (const mutate of [x => { x.work_item.id = 'other'; }, x => { x.inputs = null; }, x => { x.inputs[0].seb_revision_id = 'new-rev'; },
      x => { x.inputs.push(x.inputs[0]); }, x => { x.deliverables = [{ id: 'del', ewp_id: 'ewp', engineering_work_item_id: 'other' }]; },
      x => { x.confirmation = { ewp_id: 'ewp', engineering_work_item_id: 'work', confirmed: true, input_ids: [] }; }]) {
      const context = fixture(); mutate(context);
      expect(() => buildInputsDeliverablesReport(context, 'work')).toThrow();
    }
  });
});
