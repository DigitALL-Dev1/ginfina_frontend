import { describe, expect, it } from 'vitest';
import { buildCompletionReport, validateCompletionPackage } from './siaCompletionReport';

const makePackage = () => ({
  sia_case_id: 'case', site_id: 'site', loaded_at: '2026-09-22T10:00:00',
  case: { id: 'case', case_code: 'SIA-01', project_id: 'project', status: 'Draft' },
  site: { id: 'site', sia_case_id: 'case', site_code: 'SITE-01', site_name: 'Hospital', status: 'Draft' },
  modules: { sia_evidence: [{ id: 'e1', file_hash: 'sha256-reference', metadata: { measurements: [{ value: 0, verified: false }], tags: ['Roof', 'Electrical'] } }], sia_data_gap: [] },
});
const context = { caseId: 'case', siteId: 'site' };

describe('SIA completion report', () => {
  it('hides internal references in the presentation without changing source records', () => {
    const data = makePackage();
    data.modules.sia_evidence[0].metadata.siteId = 'site';
    data.modules.sia_evidence[0].metadata.owner = 'c6dcca13-ec3c-4c41-936a-eb6d68a8147f';
    const original = JSON.stringify(data);
    const report = buildCompletionReport(data, { ...context, hideInternalIds: true });
    const fields = report.sections.flatMap(s => s.fields);
    expect(fields.some(f => /\bID\b|\bids\b/i.test(f.label))).toBe(false);
    expect(fields.some(f => f.value === data.modules.sia_evidence[0].metadata.owner)).toBe(false);
    expect(fields).toContainEqual({ label: 'Metadata / Measurements / 1 / Value', value: '0' });
    expect(fields).toContainEqual({ label: 'Metadata / Measurements / 1 / Verified', value: 'No' });
    expect(JSON.stringify(data)).toBe(original);
  });
  it('includes package details, all module fields and local notes with readable nested values', () => {
    const data = makePackage();
    const original = JSON.stringify(data);
    const report = buildCompletionReport(data, { ...context, notes: 'Confirm roof access', completeConfirmed: true });
    const all = report.sections.flatMap(s => s.fields);
    expect(report.code).toBe('SIA-01-SITE-01');
    expect(all).toContainEqual({ label: 'File hash', value: 'sha256-reference' });
    expect(all).toContainEqual({ label: 'Metadata / Measurements / 1 / Value', value: '0' });
    expect(all).toContainEqual({ label: 'Metadata / Measurements / 1 / Verified', value: 'No' });
    expect(all).toContainEqual({ label: 'Review notes (local, not saved)', value: 'Confirm roof access' });
    expect(all).toContainEqual({ label: 'Verification status', value: 'Not verified for SEB input' });
    expect(all).toContainEqual({ label: 'SEB readiness confirmation (this session)', value: 'Not confirmed' });
    expect(JSON.stringify(data)).toBe(original);
  });
  it('uses verified case/site responses in repeated records without changing other records', () => {
    const data = makePackage();
    data.modules.sia_case = [{ ...data.case }];
    data.modules.sia_site = [{ ...data.site }, { id: 'other', status: 'Draft' }];
    data.case.status = 'verified'; data.site.status = 'verified';
    const report = buildCompletionReport(data, context);
    expect(report.sections[0].fields).toContainEqual({ label: 'Verification status', value: 'Verified for SEB input' });
    expect(report.sections.find(s => s.title === 'Site — 1 of 2').fields).toContainEqual({ label: 'Status', value: 'verified' });
    expect(report.sections.find(s => s.title === 'Site — 2 of 2').fields).toContainEqual({ label: 'Status', value: 'Draft' });
    expect(data.modules.sia_site[0].status).toBe('Draft');
  });
  it('shows an explicit empty package state', () => {
    const report = buildCompletionReport({ ...makePackage(), modules: {} }, context);
    expect(report.counts).toEqual([]);
    expect(report.sections.at(-1).fields[0].value).toMatch('No related SIA module records');
  });
  it('rejects another case/site and malformed module responses', () => {
    expect(() => validateCompletionPackage(makePackage(), 'other', 'site')).toThrow('does not match');
    const wrongSite = makePackage(); wrongSite.site.sia_case_id = 'other';
    expect(() => buildCompletionReport(wrongSite, context)).toThrow('does not match');
    expect(() => buildCompletionReport({ ...makePackage(), modules: { sia_evidence: {} } }, context)).toThrow('incomplete');
  });
});
