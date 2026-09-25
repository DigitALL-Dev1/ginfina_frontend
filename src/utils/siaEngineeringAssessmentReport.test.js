import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadEngineeringAssessmentReport, assessmentReportGroups } from './siaEngineeringAssessmentReport';
afterEach(() => vi.unstubAllGlobals());
function mockApi(fail = false) {
  const data = { '': { id: 'ea', sia_case_id: 'case', assessment_code: 'EA-01', summary: 'Saved summary' },
    '/electrical': [{ id: 'electrical', engineering_assessment_id: 'ea', voltage: 0, transformer_details: '500 kVA transformer' }, { id: 'foreign', engineering_assessment_id: 'other', voltage: 415 }],
    '/scada': [{ id: 'scada', engineering_assessment_id: 'ea', network_available: false }],
    '/reviews': [{ id: 'review', engineering_assessment_id: 'ea', review_comment: 'Verify load calculations', review_status: 'Change required' }] };
  vi.stubGlobal('fetch', vi.fn(async url => ({ ok: !(fail && url.endsWith('/gaps')), json: async () => data[url.split('/engineering-assessments/ea')[1]] || [] })));
}
describe('Engineering Assessment report', () => {
  it('includes all sections, full details, comments, zero and false, and excludes another assessment', async () => {
    mockApi();
    const report = await loadEngineeringAssessmentReport('/api', 'ea', 'case');
    expect(report.counts).toHaveLength(assessmentReportGroups.length);
    expect(report.counts[0].value).toBe(1);
    expect(report.sections.find(s => s.title.startsWith('Electrical')).fields).toContainEqual({ label: 'Voltage', value: '0' });
    expect(report.sections.find(s => s.title.startsWith('Electrical')).fields).toContainEqual({ label: 'Transformer details', value: '500 kVA transformer' });
    expect(report.sections.find(s => s.title.startsWith('SCADA')).fields).toContainEqual({ label: 'Network available', value: 'No' });
    expect(report.sections.find(s => s.title.startsWith('Reviews')).fields).toContainEqual({ label: 'Review comment', value: 'Verify load calculations' });
  });
  it('blocks incomplete reports when any section fails to load', async () => {
    mockApi(true);
    await expect(loadEngineeringAssessmentReport('/api', 'ea', 'case')).rejects.toThrow('could not be loaded');
  });
  it('rejects an assessment from another case', async () => {
    mockApi();
    await expect(loadEngineeringAssessmentReport('/api', 'ea', 'other')).rejects.toThrow('does not belong');
  });
});
