import { describe, expect, it } from 'vitest';
import { buildCompletionGovernanceReport } from './completionGovernanceReport';

function fixture() {
  const failed = { id: 'procurement', check_type: 'PROCUREMENT', check_name: 'Procurement handoff completed', status: 'FAILED', mandatory: true, total: 1, issue_count: 1, issues: ['PO-001 is only REFERENCED'] };
  return { ewpId: 'ewp', summary: {
    ewp: { id: 'ewp', ewp_code: 'EWP-001', ewp_name: 'Electrical Design', status: 'ACTIVE' },
    completion_status: 'BLOCKED', ready_for_closure: false, governance_valid: false, summary_hash: 'a'.repeat(64),
    checks: [{ id: 'work', check_type: 'ENGINEERING_WORK', check_name: 'Engineering work complete', status: 'PASSED', mandatory: true, total: 1, issue_count: 0, issues: [] }, failed],
    blockers: [failed], obligations: [{ id: 'condition', title: 'Verify loading', kind: 'CONDITION', status: 'OPEN', source_hash: 'b'.repeat(64), source: { release_item_id: 'item1' } }],
    sources: { engineering_work_ids: ['work1'], deliverable_ids: ['del1'], documents: [{ document_id: 'doc1', revision_id: 'd03', release_id: 'release1' }], registers: [{ register_id: 'reg', boq_id: 'boq', handoff: { reference: 'PO-001', status: 'REFERENCED' } }], freeze_snapshot_id: 'freeze', release_item_ids: ['item1'] },
    control: { version: 1, completion_status: 'ACTIVE', actions: [], resolutions: [], history: [] },
  } };
}
const contents = report => report.sections.flatMap(section => section.fields.map(field => field.value)).join('\n');

describe('Completion and governance report', () => {
  it('includes failed checks, source references and open obligations without claiming closure', () => {
    const data = fixture(); const before = JSON.stringify(data);
    const report = buildCompletionGovernanceReport(data); const text = contents(report);
    for (const value of ['BLOCKED', 'PO-001 is only REFERENCED', 'Verify loading', 'd03', 'release1', 'EWP closure has not been approved', 'Governance verification has not been recorded']) expect(text).toContain(value);
    expect(report.counts.find(row => row.label === 'Blocking checks').value).toBe(1);
    expect(report.counts.find(row => row.label === 'Checks passed').value).toBe('1 / 2');
    expect(JSON.stringify(data)).toBe(before);
  });
  it('uses the closure snapshot after live assessment data changes', () => {
    const data = fixture(); const summary = data.summary;
    const { ewp, control, ...snapshot } = structuredClone(summary);
    snapshot.checks[1] = { ...snapshot.checks[1], status: 'PASSED', issues: [], issue_count: 0 };
    snapshot.blockers = []; snapshot.obligations[0].status = 'ACCEPTED';
    snapshot.sources.registers[0].handoff.status = 'COMPLETED';
    Object.assign(snapshot, { completion_status: 'COMPLETION_REVIEW', governance_valid: true, ready_for_closure: true });
    Object.assign(summary.control, { completion_status: 'CLOSED', governance: { reviewer: 'Reviewer A', comment: 'Verified records' },
      submitted_by: 'Lead', closure: { summary: snapshot, snapshot_hash: 'c'.repeat(64), approved_by: 'Manager', closed_at: '2026-09-22T13:00:00Z', comment: 'Closure approved' } });
    summary.completion_status = 'CLOSED'; summary.obligations[0].title = 'CHANGED LIVE OBLIGATION';
    const text = contents(buildCompletionGovernanceReport(data));
    for (const value of ['CLOSED', 'Saved closure snapshot', 'ACCEPTED', 'Manager', 'Closure approved', 'c'.repeat(64), 'COMPLETED']) expect(text).toContain(value);
    expect(text).not.toContain('CHANGED LIVE OBLIGATION');
    expect(text).not.toContain('PO-001 is only REFERENCED');
  });
  it('blocks mismatched EWP, incomplete assessment and missing closure snapshot', () => {
    const data = fixture();
    expect(() => buildCompletionGovernanceReport({ ...data, ewpId: 'different' })).toThrow(/does not match/);
    data.summary.control.completion_status = 'CLOSED';
    expect(() => buildCompletionGovernanceReport(data)).toThrow(/snapshot is missing/);
    data.summary.control.completion_status = 'ACTIVE';
    data.summary.checks = undefined;
    expect(() => buildCompletionGovernanceReport(data)).toThrow(/checks are incomplete/);
  });
});
