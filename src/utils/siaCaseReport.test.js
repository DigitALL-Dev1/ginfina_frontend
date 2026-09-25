import { describe, it, expect } from 'vitest';
import { buildSiaCaseReport } from './siaCaseReport';

describe('SIA case report', () => {
  it('reports confirmed links for this case, not all available packs or another case', () => {
    const report = buildSiaCaseReport({ id: 'project', project_name: 'Hospital' }, { id: 'case', case_code: 'SIA-001', assessment_purpose: 'Saved purpose' }, [
      { id: 'link', sia_case_id: 'case', assessment_pack_id: 'pack', is_applicable: true },
      { id: 'other-link', sia_case_id: 'other', assessment_pack_id: 'unused', is_applicable: true },
    ], [{ id: 'pack', pack_code: 'AP-01', pack_name: 'Electrical', pack_type: 'Engineering' }, { id: 'unused', pack_name: 'Not selected' }]);
    expect(report.packs).toEqual([{ id: 'link', code: 'AP-01', name: 'Electrical', type: 'Engineering', applicable: 'Yes' }]);
    expect(report.sections[2].fields[0].value).toBe('Saved purpose');
  });

  it('retains unknown linked pack references and displays missing optional fields honestly', () => {
    const report = buildSiaCaseReport({}, { id: 'case' }, [{ id: 'link', sia_case_id: 'case', assessment_pack_id: 'missing', is_applicable: false }], []);
    expect(report.code).toBe('case');
    expect(report.sections[0].fields[0].value).toBe('Not provided');
    expect(report.packs[0]).toMatchObject({ code: 'missing', name: 'Pack details unavailable', applicable: 'No' });
  });
});
