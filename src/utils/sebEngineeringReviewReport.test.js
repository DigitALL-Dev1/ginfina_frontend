import { describe, expect, it } from 'vitest';
import { buildSebEngineeringReviewReport } from './sebEngineeringReviewReport';

const data = () => ({ baseline: { id: 'seb', seb_code: 'SEB-001', project_id: 'project', sia_case_id: 'case' }, revision: { id: 'rev', seb_id: 'seb', revision_no: 'R01', revision_status: 'IN_REVIEW' }, items: [
  { id: 'item', seb_id: 'seb', seb_revision_id: 'rev', fact_id: 'fact', fact_collection: 'sia_electrical', discipline: 'Electrical', decision: 'ACCEPT', status: 'review', fact_data: { capacity: '500 kVA', nested: { verified: false, load: 0 } } },
] });
describe('SEB engineering review report', () => {
  it('summarizes saved decisions and preserves traceable source values without mutation', () => {
    const input = data(); const original = JSON.stringify(input);
    const report = buildSebEngineeringReviewReport(input);
    expect(report.counts).toContainEqual({ label: 'ACCEPT', value: 1 });
    expect(report.counts).toContainEqual({ label: 'Pending decision', value: 0 });
    const fields = report.sections.flatMap(section => section.fields);
    expect(fields).toContainEqual({ label: 'Nested / Verified', value: 'No' });
    expect(fields).toContainEqual({ label: 'Nested / Load', value: '0' });
    expect(fields).toContainEqual({ label: 'Reviewer', value: 'Not returned by the API' });
    expect(JSON.stringify(input)).toBe(original);
  });
  it('uses only matching successful session reviews, and prefers API review details', () => {
    const input = data(); input.sessionReviews = { item: { seb_id: 'seb', seb_revision_id: 'rev', decision: 'ACCEPT', reviewer: 'Engineer A', comment: 'Verified against source' } };
    const fields = () => buildSebEngineeringReviewReport(input).sections.flatMap(section => section.fields);
    expect(fields()).toContainEqual({ label: 'Review comment', value: 'Verified against source' });
    input.items[0].reviewer = 'Engineer B';
    expect(fields()).toContainEqual({ label: 'Reviewer', value: 'Engineer B' });
    input.sessionReviews.item.seb_revision_id = 'other';
    expect(fields()).toContainEqual({ label: 'Review comment', value: 'Not returned by the API' });
  });
  it('reports pending decisions and empty items without inventing completion', () => {
    const input = data(); input.items[0].decision = null;
    expect(buildSebEngineeringReviewReport(input).counts).toContainEqual({ label: 'Pending decision', value: 1 });
    input.items = [];
    expect(buildSebEngineeringReviewReport(input).sections.at(-1).fields[0].value).toContain('No review items');
  });
  it('rejects mismatched SEB and revision data', () => {
    const input = data(); input.items[0].seb_revision_id = 'other';
    expect(() => buildSebEngineeringReviewReport(input)).toThrow('do not match');
    input.items = []; input.revision.seb_id = 'other';
    expect(() => buildSebEngineeringReviewReport(input)).toThrow('matching SEB');
  });
});
