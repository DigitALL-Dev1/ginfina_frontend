import { describe, expect, it } from 'vitest';
import { buildManagementAdministrationReport } from './managementAdministrationReport';

function fixture() {
  return { projectId: 'project', ewpId: 'ewp', project: { id: 'project', code: 'PRJ-001', name: 'Hospital Solar' }, data: {
    ewp: { id: 'ewp', project_id: 'project', ewp_code: 'EWP-001', ewp_name: 'Electrical Design', status: 'IN_PROGRESS', planned_start: '2026-09-01', planned_finish: '2026-10-30', lead_engineer: 'Engineer A' },
    version: 3, read_only: false, overall_progress: 40, access_mode: 'PROTOTYPE_PILOT',
    metrics: [{ label: 'Released Outputs', total: 5, complete: 2, percent: 40 }],
    counts: { open_actions: 1, open_issues: 1, open_risks: 1, overdue_actions: 0, open_review_comments: 0 },
    attention: [{ kind: 'PENDING_APPROVAL', title: 'SLD-001 / D03', status: 'REVIEW_COMPLETED' }],
    team: [{ id: 'team', name: 'Engineer A', role: 'Lead Engineer', active: true }, { id: 'old', name: 'Previous Engineer', active: false }],
    milestones: [{ id: 'milestone', name: 'IFC release', target_date: '2026-10-30', status: 'UPCOMING' }],
    issues: [{ id: 'issue', title: 'Missing client information', blocking: true, status: 'OPEN' }],
    risks: [{ id: 'risk', title: 'Late equipment delivery', priority: 'HIGH', status: 'OPEN', blocking: false }],
    actions: [{ id: 'action', title: 'Verify loading', owner: 'Engineer A', status: 'OPEN' }],
    access: [{ id: 'access', name: 'Engineer A', permissions: ['VIEW', 'EDIT'], active: true }],
    history: [{ id: 'event', module: 'Management', action: 'ACTIONS_UPDATED', actor: 'Engineer A', before: { status: 'OPEN' }, after: { status: 'CLOSED', resolution: 'Loading verified' } },
      { id: 'release', module: 'Approval & Release', action: 'DOCUMENT_RELEASED', revision_id: 'd03', actor: 'Manager' }],
  } };
}
const values = report => report.sections.flatMap(section => section.fields.map(field => field.value)).join('\n');

describe('Management and administration report', () => {
  it('includes every register, progress, dates and cross-module activity without mutating saved data', () => {
    const data = fixture(); const before = JSON.stringify(data);
    const report = buildManagementAdministrationReport(data); const text = values(report);
    for (const value of ['Missing client information', 'Late equipment delivery', 'Verify loading', 'SLD-001 / D03', 'IFC release', '2026-10-30', 'VIEW', 'EDIT', 'Loading verified', 'DOCUMENT_RELEASED', 'd03', 'Previous Engineer']) expect(text).toContain(value);
    expect(report.code).toBe('PRJ-001-EWP-001');
    expect(report.counts.find(row => row.label === 'Active team members').value).toBe(1);
    expect(report.counts.find(row => row.label === 'Overdue actions').value).toBe(0);
    const event = report.sections.find(section => section.title === 'Activity 1 - Management');
    expect(event.fields).toContainEqual({ label: 'Before / Status', value: 'OPEN' });
    expect(event.fields).toContainEqual({ label: 'After / Status', value: 'CLOSED' });
    expect(text).toContain('do not enforce authentication');
    expect(JSON.stringify(data)).toBe(before);
  });
  it('handles empty registers and a closed read-only EWP without inventing completion', () => {
    const input = fixture();
    for (const key of ['team', 'milestones', 'issues', 'risks', 'actions', 'access', 'history', 'attention', 'metrics']) input.data[key] = [];
    input.data.ewp.status = 'CLOSED'; input.data.read_only = true; input.data.overall_progress = 0;
    const report = buildManagementAdministrationReport(input);
    expect(values(report)).toContain('No saved team records');
    expect(values(report)).toContain('No activity recorded');
    expect(report.counts[0].value).toBe('0%');
    expect(report.sections[0].fields).toContainEqual({ label: 'Read only', value: 'Yes' });
  });
  it('blocks wrong project/EWP and incomplete or foreign register records', () => {
    const input = fixture();
    expect(() => buildManagementAdministrationReport({ ...input, ewpId: 'other' })).toThrow(/does not match/);
    input.data.ewp.project_id = 'other';
    expect(() => buildManagementAdministrationReport(input)).toThrow(/does not match/);
    input.data.ewp.project_id = 'project'; input.data.risks = null;
    expect(() => buildManagementAdministrationReport(input)).toThrow(/risks records are incomplete/);
    input.data.risks = [{ id: 'risk', ewp_id: 'other' }];
    expect(() => buildManagementAdministrationReport(input)).toThrow(/inconsistent references/);
  });
});
