import { describe, expect, it } from 'vitest';
import { buildSebReadinessReport } from './sebReadinessReport';
const data = () => ({ baseline: { id: 'seb', seb_code: 'SEB-001', project_id: 'project' }, revision: { id: 'rev', seb_id: 'seb', revision_no: 'R01', revision_status: 'READINESS_COMPLETED' }, items: [
  { id: 'item', seb_id: 'seb', seb_revision_id: 'rev', fact_id: 'fact', discipline: 'Structural', decision: 'ACCEPT_WITH_CONDITION', discipline_readiness: { status: 'CONDITIONAL', conditional: { enabled: true, condition: 'Verify roof load', required_action: 'Load test', owner: 'Engineer A', target_date: '2026-10-01' }, blocked: { enabled: false } }, fact_data: { capacity: '500 kVA', evidence: { hash: 'source-hash' } } },
] });
describe('SEB readiness report', () => {
  it('includes saved conditions, actions, dates, owners, source evidence and status', () => {
    const input = data(); const before = JSON.stringify(input);
    const report = buildSebReadinessReport(input);
    const fields = report.sections.flatMap(section => section.fields);
    expect(report.code).toBe('SEB-001-R01');
    expect(report.counts).toContainEqual({ label: 'CONDITIONAL', value: 1 });
    expect(fields).toContainEqual({ label: 'Conditional / Required action', value: 'Load test' });
    expect(fields).toContainEqual({ label: 'Conditional / Target date', value: '2026-10-01' });
    expect(fields).toContainEqual({ label: 'Blocked / Enabled', value: 'No' });
    expect(fields).toContainEqual({ label: 'Evidence / Hash', value: 'source-hash' });
    expect(JSON.stringify(input)).toBe(before);
  });
  it('includes blockers and all disciplines, without treating completion as READY', () => {
    const input = data(); input.items[0].discipline = 'Specialist';
    input.items[0].discipline_readiness = { status: 'BLOCKED', blocked: { enabled: true, blocker: 'Roof access', reason: 'Unsafe', related_fact_or_gap: 'gap-1', owner: 'Site lead' } };
    const report = buildSebReadinessReport(input);
    expect(report.sections.some(s => s.title.startsWith('SPECIALIST'))).toBe(true);
    expect(report.counts).toContainEqual({ label: 'BLOCKED', value: 1 });
    expect(report.counts).toContainEqual({ label: 'READY', value: 0 });
    expect(report.sections.flatMap(s => s.fields)).toContainEqual({ label: 'Blocked / Related fact or gap', value: 'gap-1' });
  });
  it('handles absent or legacy readiness and empty items explicitly', () => {
    const input = data(); input.items[0].discipline_readiness = {};
    expect(buildSebReadinessReport(input).counts).toContainEqual({ label: 'Not assessed', value: 1 });
    input.items[0].discipline_readiness = 'READY';
    expect(buildSebReadinessReport(input).counts).toContainEqual({ label: 'READY', value: 1 });
    input.items = [];
    expect(buildSebReadinessReport(input).sections.at(-1).fields[0].value).toContain('No reviewed SEB items');
  });
  it('rejects another revision or SEB in report records', () => {
    const input = data(); input.items[0].seb_revision_id = 'other';
    expect(() => buildSebReadinessReport(input)).toThrow('do not match');
    input.items = []; input.revision.seb_id = 'other';
    expect(() => buildSebReadinessReport(input)).toThrow('matching SEB');
  });
});
