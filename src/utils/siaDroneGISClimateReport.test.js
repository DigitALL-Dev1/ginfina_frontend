import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDroneGISClimateReport } from './siaDroneGISClimateReport';

afterEach(() => vi.unstubAllGlobals());
function mockApi(overrides = {}, failedPath) {
  const data = {
    '/sia/sites/site': { id: 'site', site_code: 'SITE-01', sia_case_id: 'case' },
    '/sia/sites/site/drone-missions': [{ id: 'm1', site_id: 'site', mission_code: 'M-01' }, { id: 'm2', site_id: 'site', mission_code: 'M-02' }, { id: 'foreign', site_id: 'other' }],
    '/sia/sites/site/gis-layers': [{ id: 'l1', site_id: 'site', layer_name: 'Site boundary' }, { id: 'l2', site_id: 'site', layer_name: 'Roof zones' }],
    '/sia/drone-missions/m1/operators': [{ id: 'o1', drone_mission_id: 'm1', restriction_notes: 'Daylight flights only' }, { id: 'foreign-op', drone_mission_id: 'other' }],
    '/sia/drone-missions/m2/platforms': [{ id: 'p2', drone_mission_id: 'm2', thermal_capable: false }],
    '/sia/drone-missions/m2/raw-data': [{ id: 'raw2', drone_mission_id: 'm2', file_hash: 'sha256-example', file_path: '/survey/roof.tif' }],
    '/sia/gis-layers/l1/features': [{ id: 'f1', gis_layer_id: 'l1', feature_name: 'Hospital boundary' }, { id: 'foreign-feature', gis_layer_id: 'other' }],
    '/sia/gis-layers/l2/features': [{ id: 'f2', gis_layer_id: 'l2', feature_name: 'Roof A' }],
    '/sia/sites/site/external-geo-sources': [{ id: 's1', site_id: 'site', limitation_notes: 'Historical dataset' }],
    '/sia/sites/site/climate-resources': [{ id: 'c1', site_id: 'site', parameter_name: 'Rainfall', parameter_value: 0, unit: 'mm', external_geo_source_id: 's1' }, { id: 'foreign-climate', site_id: 'other' }],
    ...overrides,
  };
  const fetchMock = vi.fn(async url => ({ ok: url !== `/api${failedPath}`, json: async () => data[url.replace('/api', '')] || [] }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('Drone, GIS and Climate report', () => {
  it('includes all site missions and layers, scoped children, references, zero and false values', async () => {
    const fetchMock = mockApi();
    const report = await loadDroneGISClimateReport('/api', 'site');
    const count = label => report.counts.find(c => c.label === label).value;
    expect(report.code).toBe('SITE-01');
    expect(report.counts).toHaveLength(13);
    expect(count('Drone Missions')).toBe(2);
    expect(count('Operators')).toBe(1);
    expect(count('GIS Features')).toBe(2);
    expect(count('Climate Resources')).toBe(1);
    const fields = report.sections.flatMap(s => s.fields);
    expect(fields).toContainEqual({ label: 'Mission reference', value: 'M-02' });
    expect(fields).toContainEqual({ label: 'Layer reference', value: 'Roof zones' });
    expect(fields).toContainEqual({ label: 'Thermal capable', value: 'No' });
    expect(fields).toContainEqual({ label: 'Parameter value', value: '0' });
    expect(fields).toContainEqual({ label: 'File hash', value: 'sha256-example' });
    expect(fields).toContainEqual({ label: 'Limitation notes', value: 'Historical dataset' });
    expect(fields.some(f => f.value.startsWith('foreign'))).toBe(false);
    expect(fetchMock.mock.calls.some(([url]) => url.includes('/foreign/'))).toBe(false);
  });
  it('shows empty sections without requesting nonexistent mission or layer children', async () => {
    const fetchMock = mockApi({ '/sia/sites/site/drone-missions': [], '/sia/sites/site/gis-layers': [], '/sia/sites/site/external-geo-sources': [], '/sia/sites/site/climate-resources': [] });
    const report = await loadDroneGISClimateReport('/api', 'site');
    expect(report.counts.every(count => count.value === 0)).toBe(true);
    expect(report.sections.filter(section => section.fields[0]?.value === 'No records saved for this site.')).toHaveLength(13);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
  it('blocks a report when a child request fails', async () => {
    mockApi({}, '/sia/drone-missions/m2/raw-data');
    await expect(loadDroneGISClimateReport('/api', 'site')).rejects.toThrow('could not be loaded');
  });
  it('rejects malformed lists and a mismatched site', async () => {
    mockApi({ '/sia/sites/site/climate-resources': { detail: 'Not a list' } });
    await expect(loadDroneGISClimateReport('/api', 'site')).rejects.toThrow('incomplete');
    mockApi({ '/sia/sites/site': { id: 'other' } });
    await expect(loadDroneGISClimateReport('/api', 'site')).rejects.toThrow('does not match');
  });
});
