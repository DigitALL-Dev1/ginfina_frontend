import { describe, expect, it } from 'vitest';
import { buildEwpApprovalReleaseReport } from './ewpApprovalReleaseReport';

function fixture() {
  const pkg = {
    ewp: { id: 'ewp', code: 'EWP-001', name: 'Electrical Design' }, deliverable: { id: 'del', code: 'DEL-001' },
    document: { id: 'doc', code: 'SLD-001' }, revision: { id: 'rev', revision_no: 'D03', review_completed_at: '2026-09-22' },
    file: { name: 'sld-d03.pdf', size: 1000, sha256: 'a'.repeat(64) }, prepared_by: 'Engineer A',
    reviewers: [{ id: 'reviewer', document_id: 'doc', revision_id: 'rev', status: 'COMPLETED', decision: 'ACCEPT', reviewer_name: 'Lead' }],
    comments: [{ id: 'comment', document_id: 'doc', revision_id: 'older-rev', status: 'CLOSED', text: 'Check rating', response: 'Verified' }], open_comments: 0,
    seb_basis: { seb_id: 'seb', revision_id: 'r01', freeze_snapshot_id: 'freeze', snapshot_hash: 'b'.repeat(64) },
    inputs: [{ link_id: 'input', release_item_id: 'item', freeze_snapshot_id: 'freeze', item: { display_value: 'Transformer 500 kVA', readiness: { status: 'CONDITIONAL', conditional: { enabled: true, condition: 'Verify load', owner: 'Engineer A' } }, evidence: [{ id: 'evidence', hash: 'c'.repeat(64) }] } }],
    input_confirmations: [{ id: 'confirmation', ewp_id: 'ewp', confirmed: true }],
  };
  return { ewpId: 'ewp', documentId: 'doc', revisionId: 'rev', context: { status: 'REVIEW_COMPLETED', is_current: true, package_hash: 'd'.repeat(64), package: pkg } };
}
const contents = report => report.sections.flatMap(section => section.fields.map(field => field.value)).join('\n');

describe('EWP approval and release report', () => {
  it('reports saved review results, historic comment closure, exact SEB inputs and absence of release', () => {
    const data = fixture();
    const before = JSON.stringify(data);
    const report = buildEwpApprovalReleaseReport(data);
    expect(report.code).toBe('SLD-001-D03');
    const text = contents(report);
    for (const value of ['Verified', 'older-rev', 'Transformer 500 kVA', 'Verify load', 'Approval not yet recorded', 'This revision has not been released', 'c'.repeat(64)]) expect(text).toContain(value);
    expect(report.counts.find(row => row.label === 'Open comments').value).toBe(0);
    expect(JSON.stringify(data)).toBe(before);
  });

  it('uses frozen approval and source data after release, even when live data changes', () => {
    const data = fixture();
    const approval = { decision: 'APPROVE_WITH_CONDITION', approver: 'Engineering Manager', condition: 'Verify before construction', package_hash: 'd'.repeat(64) };
    data.context.release = { id: 'release', ewp_id: 'ewp', document_id: 'doc', revision_id: 'rev', status: 'RELEASED', release_hash: 'e'.repeat(64), released_at: '2026-09-22T12:00:00Z', package: structuredClone(data.context.package), approval };
    data.context.status = 'RELEASED'; data.context.is_current = false;
    data.context.package.inputs[0].item.display_value = 'CHANGED LIVE INPUT';
    data.context.approval = { approver: 'CHANGED LIVE APPROVER' };
    const text = contents(buildEwpApprovalReleaseReport(data));
    for (const value of ['Frozen release record', 'Engineering Manager', 'Verify before construction', 'Transformer 500 kVA', 'e'.repeat(64)]) expect(text).toContain(value);
    expect(text).not.toContain('CHANGED LIVE');
  });

  it('blocks missing frozen records and mismatched revision or source references', () => {
    const data = fixture();
    expect(() => buildEwpApprovalReleaseReport({ ...data, revisionId: 'other' })).toThrow(/does not match/);
    data.context.status = 'RELEASED';
    expect(() => buildEwpApprovalReleaseReport(data)).toThrow(/frozen release is missing/);
    data.context.status = 'REVIEW_COMPLETED';
    data.context.package.inputs[0].freeze_snapshot_id = 'newer-freeze';
    expect(() => buildEwpApprovalReleaseReport(data)).toThrow(/references/);
    data.context.package.inputs = undefined;
    expect(() => buildEwpApprovalReleaseReport(data)).toThrow(/incomplete/);
  });
});
