import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadSitesSurveyReport } from './siaSitesSurveyReport';

afterEach(() => vi.unstubAllGlobals());
function mockApi(fail = '') {
  const records = {
    '/sia/sites/site': { id: 'site', sia_case_id: 'case', site_code: 'SITE-01', latitude: 0 },
    '/sia/sites/site/buildings': [{ id: 'b1', site_id: 'site', building_code: 'B01' }, { id: 'b2', site_id: 'site', building_code: 'B02' }, { id: 'foreign', site_id: 'other' }],
    '/sia/sites/site/survey-visits': [{ id: 'v1', site_id: 'site', visit_code: 'V01' }, { id: 'v2', site_id: 'site', visit_code: 'V02' }],
    '/sia/buildings/b2/room-areas': [{ id: 'room', site_id: 'site', building_id: 'b2', area_name: 'Second building room', floor_level: 0 }],
    '/sia/survey-visits/v2/team': [{ id: 'team', survey_visit_id: 'v2', user_id: 'engineer', is_lead: false }],
  };
  const fetcher = vi.fn(async url => ({ ok: !fail || !url.endsWith(fail), json: async () => records[url.replace('/api', '')] || [] }));
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}
describe('Sites & Survey report', () => {
  it('loads children for every building and visit, filters unrelated records, and preserves zero/false', async () => {
    const fetcher = mockApi();
    const report = await loadSitesSurveyReport('/api', { id: 'case', case_code: 'SIA-01' }, 'site');
    expect(report.counts.find(c => c.label === 'Buildings').value).toBe(2);
    expect(report.counts.find(c => c.label === 'Room / Areas').value).toBe(1);
    expect(report.sections.find(s => s.title.startsWith('Room / Areas')).fields).toContainEqual({ label: 'Building reference', value: 'B02' });
    expect(report.sections.find(s => s.title.startsWith('Survey Team')).fields).toContainEqual({ label: 'Team lead', value: 'No' });
    expect(report.sections[1].fields).toContainEqual({ label: 'Latitude', value: '0' });
    expect(fetcher.mock.calls.some(([url]) => url.includes('foreign'))).toBe(false);
  });
  it('fails instead of exporting an incomplete report when a child request fails', async () => {
    mockApi('/v2/instruments');
    await expect(loadSitesSurveyReport('/api', { id: 'case' }, 'site')).rejects.toThrow('could not be loaded');
  });
  it('rejects sites outside the selected case', async () => {
    mockApi();
    await expect(loadSitesSurveyReport('/api', { id: 'different-case' }, 'site')).rejects.toThrow('does not belong');
  });
});
