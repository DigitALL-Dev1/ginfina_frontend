import { describe, expect, it } from 'vitest';
import { buildSebApprovalReleaseReport } from './sebApprovalReleaseReport';
const data = () => ({ seb: { id: 'seb', seb_code: 'SEB-001' }, revision: { id: 'rev', seb_id: 'seb', revision_no: 'R01', revision_status: 'READINESS_COMPLETED' }, approval: {}, engineering_review: { total: 1, accepted: 1 }, readiness: [{ discipline: 'Electrical', status: 'READY' }], conditions: [], blockers: [], items: [{ id: 'item', fact_id: 'fact', review_decision: 'ACCEPT' }], item_sources: [], evidence_references: [], review_comments: [] });
const released = () => {
  const summary = data(); summary.revision.revision_status = 'RELEASED';
  summary.release = { id: 'release', seb_revision_id: 'rev', release_status: 'RELEASED', release_hash: 'sha256-release', released_at: '2026-09-22', frozen_snapshot: {
    seb_id: 'seb', seb_revision_id: 'rev', item_ids: ['item'], items: [{ seb_item_id: 'item', fact_id: 'fact', readiness: { status: 'CONDITIONAL', conditional: { enabled: true, condition: 'Roof check', owner: 'Engineer A', target_date: '2026-10-01' } } }],
    approver: { engineering_approver_id: 'approver', decision: 'APPROVE_WITH_CONDITION', comment: 'Frozen approval' }, fact_source_references: [{ seb_item_id: 'item', fact_id: 'fact', fact_collection: 'sia_roof' }], item_sources: [], evidence_references: [{ evidence_hash: 'frozen-evidence' }], release_timestamp: '2026-09-22',
  } };
  return summary;
};
describe('Approval and release report', () => {
  it('labels previews accurately and includes all recorded conditions and comments', () => {
    const input = data(); input.conditions = Array.from({ length: 5 }, (_, i) => ({ condition: `Condition ${i}` })); input.review_comments = [{ comment: 'Check source' }];
    const report = buildSebApprovalReleaseReport(input, 'seb', 'rev');
    expect(report.sections.flatMap(s => s.fields)).toContainEqual({ label: 'Report type', value: 'Approval preview — not released' });
    expect(report.sections.filter(s => s.title.startsWith('Conditions —'))).toHaveLength(5);
    expect(report.sections.flatMap(s => s.fields)).toContainEqual({ label: 'Comment', value: 'Check source' });
  });
  it('uses frozen release data instead of subsequent live changes without modifying the response', () => {
    const input = released(); input.items = [{ id: 'new', fact_name: 'Live changed item' }]; input.approval = { comment: 'Live changed approval' }; input.revision.approval = input.approval; input.evidence_references = [{ evidence_hash: 'live-hash' }];
    const before = JSON.stringify(input); const report = buildSebApprovalReleaseReport(input, 'seb', 'rev');
    const fields = report.sections.flatMap(s => s.fields);
    expect(fields).toContainEqual({ label: 'Readiness / Conditional / Condition', value: 'Roof check' });
    expect(fields).toContainEqual({ label: 'Evidence hash', value: 'frozen-evidence' });
    expect(fields).toContainEqual({ label: 'Comment', value: 'Frozen approval' });
    expect(JSON.stringify(report)).not.toContain('Live changed');
    expect(JSON.stringify(report)).not.toContain('live-hash');
    expect(JSON.stringify(input)).toBe(before);
  });
  it('rejects missing, incomplete and mismatched release snapshots', () => {
    for (const mutate of [s => { s.release = null; }, s => { s.release.frozen_snapshot.seb_revision_id = 'other'; }, s => { s.release.frozen_snapshot.items = []; }, s => { s.release.frozen_snapshot.evidence_references = null; }]) {
      const input = released(); mutate(input);
      expect(() => buildSebApprovalReleaseReport(input, 'seb', 'rev')).toThrow();
    }
    expect(() => buildSebApprovalReleaseReport(data(), 'other', 'rev')).toThrow('does not match');
  });
});
