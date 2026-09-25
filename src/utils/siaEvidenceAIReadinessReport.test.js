import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadEvidenceAIReadinessReport } from './siaEvidenceAIReadinessReport';

afterEach(() => vi.unstubAllGlobals());
function mockApi(overrides = {}, failedPath) {
  const data = {
    '/sia/cases/case': { id: 'case', case_code: 'SIA-01', project_id: 'project' },
    '/sia/cases/case/evidence': [{ id: 'e1', sia_case_id: 'case', evidence_code: 'EVD-01', file_hash: 'sha256-example' }, { id: 'e2', sia_case_id: 'case', evidence_code: 'EVD-02' }, { id: 'foreign', sia_case_id: 'other' }],
    '/sia/evidence/e1/verifications': [{ id: 'v1', evidence_id: 'e1', verification_comment: 'Verified against field record' }, { id: 'foreign-v', evidence_id: 'other' }],
    '/sia/evidence/e2/verifications': [{ id: 'v2', evidence_id: 'e2', verification_status: 'Pending' }],
    '/sia/cases/case/ai-observations': [{ id: 'a1', sia_case_id: 'case', observation_code: 'AI-01', output_value: 'Estimated 500 kVA', confidence_score: 0 }],
    '/sia/ai-observations/a1/dispositions': [{ id: 'd1', ai_observation_id: 'a1', disposition: 'MODIFIED', modified_value: '450 kVA', reviewer_comment: 'Corrected from nameplate' }],
    '/sia/cases/case/conflicts': [{ id: 'cf1', sia_case_id: 'case', conflict_code: 'CON-01' }],
    '/sia/conflicts/cf1/resolutions': [{ id: 'rs1', conflict_id: 'cf1', resolution_reason: 'Use measured value' }],
    '/sia/cases/case/data-gaps': [{ id: 'g1', sia_case_id: 'case', gap_code: 'GAP-01' }],
    '/sia/cases/case/rfi-actions': [{ id: 'rfi1', sia_case_id: 'case', data_gap_id: 'g1', response: 'Awaiting utility confirmation' }],
    '/sia/cases/case/discipline-readiness': [{ id: 'r1', sia_case_id: 'case', discipline: 'Electrical', readiness_status: 'CONDITIONAL' }, { id: 'r2', sia_case_id: 'case', discipline: 'Civil', readiness_status: 'BLOCKED' }],
    '/sia/discipline-readiness/r1/conditions': [{ id: 'c1', discipline_readiness_id: 'r1', required_action: 'Confirm transformer loading' }],
    '/sia/discipline-readiness/r2/blockers': [{ id: 'b1', discipline_readiness_id: 'r2', data_gap_id: 'g1', blocker_description: 'Missing flood study' }],
    '/sia/discipline-readiness/r2/reviews': [{ id: 'rv1', discipline_readiness_id: 'r2', review_comment: 'Awaiting site investigation' }],
    ...overrides,
  };
  const fetchMock = vi.fn(async url => ({ ok: url !== `/api${failedPath}`, json: async () => data[url.replace('/api', '')] || [] }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('Evidence, AI and Readiness report', () => {
  it('collects all parents and their scoped children, keeping AI outputs separate from human dispositions', async () => {
    const fetchMock = mockApi();
    const report = await loadEvidenceAIReadinessReport('/api', 'case');
    expect(report.code).toBe('SIA-01');
    expect(report.counts).toHaveLength(14);
    expect(report.counts.find(c => c.label === 'Evidence Verifications').value).toBe(2);
    expect(report.counts.find(c => c.label === 'RFI Actions').value).toBe(1);
    const all = report.sections.flatMap(section => section.fields);
    for (const [label, value] of [['Evidence reference', 'EVD-02'], ['File hash', 'sha256-example'], ['Output value', 'Estimated 500 kVA'], ['Confidence score', '0'], ['Modified value', '450 kVA'], ['Reviewer comment', 'Corrected from nameplate'], ['Gap reference', 'GAP-01'], ['Required action', 'Confirm transformer loading'], ['Discipline reference', 'Civil'], ['Blocker description', 'Missing flood study'], ['Review comment', 'Awaiting site investigation']]) {
      expect(all).toContainEqual({ label, value });
    }
    expect(all.some(field => field.value.startsWith('foreign'))).toBe(false);
    expect(fetchMock.mock.calls.some(([url]) => url.includes('/foreign/'))).toBe(false);
    expect(fetchMock.mock.calls.some(([url]) => url.includes('/data-gaps/g1/rfi-actions'))).toBe(false);
  });
  it('shows empty sections without fetching nonexistent children', async () => {
    const fetchMock = mockApi(Object.fromEntries(['evidence', 'ai-observations', 'conflicts', 'data-gaps', 'rfi-actions', 'discipline-readiness'].map(path => [`/sia/cases/case/${path}`, []])));
    const report = await loadEvidenceAIReadinessReport('/api', 'case');
    expect(report.counts.every(count => count.value === 0)).toBe(true);
    expect(report.sections.filter(section => section.fields[0]?.value === 'No records saved for this case.')).toHaveLength(14);
    expect(fetchMock).toHaveBeenCalledTimes(9);
  });
  it('blocks incomplete reports when a child request fails', async () => {
    mockApi({}, '/sia/discipline-readiness/r2/reviews');
    await expect(loadEvidenceAIReadinessReport('/api', 'case')).rejects.toThrow('could not be loaded');
  });
  it('rejects invalid responses and a mismatched case', async () => {
    mockApi({ '/sia/cases/case/source-facts': { detail: 'Not a list' } });
    await expect(loadEvidenceAIReadinessReport('/api', 'case')).rejects.toThrow('incomplete');
    mockApi({ '/sia/cases/case': { id: 'other' } });
    await expect(loadEvidenceAIReadinessReport('/api', 'case')).rejects.toThrow('does not match');
  });
});
