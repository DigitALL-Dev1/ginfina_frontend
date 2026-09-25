import { describe, expect, it } from 'vitest';
import { buildSebPreparationReport } from './sebPreparationReport';

const data = () => ({
  baseline: { id: 'seb', seb_code: 'SEB-001', sia_case_id: 'case', site_id: 'site', project_id: 'project' },
  revision: { id: 'rev', seb_id: 'seb', revision_no: 'R01', revision_status: 'DRAFT' },
  siaCase: { id: 'case', case_code: 'SIA-001', sites: [{ id: 'other', site_name: 'Excluded site' }] },
  site: { id: 'site', sia_case_id: 'case', site_name: 'Hospital' },
  items: [{ id: 'item', seb_id: 'seb', seb_revision_id: 'rev', fact_id: 'fact', fact_collection: 'sia_electrical', status: 'review', fact_data: {
    id: 'fact', capacity: '500 kVA', evidence: [{ hash: 'source-hash', verified: false }], measurements: { load: 0 },
  } }], reviewed: true, submitted: false,
});

describe('SEB preparation report', () => {
  it('includes selected saved facts, traceable IDs, and readable nested source values without mutating records', () => {
    const input = data(); const before = JSON.stringify(input);
    const report = buildSebPreparationReport(input);
    const fields = report.sections.flatMap(section => section.fields);
    expect(report.code).toBe('SEB-001-R01');
    expect(fields).toContainEqual({ label: 'Evidence / 1 / Hash', value: 'source-hash' });
    expect(fields).toContainEqual({ label: 'Evidence / 1 / Verified', value: 'No' });
    expect(fields).toContainEqual({ label: 'Measurements / Load', value: '0' });
    expect(fields).toContainEqual({ label: 'Fact collection', value: 'sia_electrical' });
    expect(fields).toContainEqual({ label: 'Project ID', value: 'project' });
    expect(JSON.stringify(report)).not.toContain('Excluded site');
    expect(JSON.stringify(input)).toBe(before);
  });
  it('separates session submission from the actual returned revision status', () => {
    const input = data(); input.submitted = true;
    const fields = buildSebPreparationReport(input).sections[0].fields;
    expect(fields).toContainEqual({ label: 'Revision status', value: 'DRAFT' });
    expect(fields).toContainEqual({ label: 'Submission this session', value: 'Submitted for engineering review' });
    input.revision.revision_status = 'IN_REVIEW';
    expect(buildSebPreparationReport(input).sections[0].fields).toContainEqual({ label: 'Revision status', value: 'IN_REVIEW' });
  });
  it('handles missing source details and empty item lists explicitly', () => {
    const input = data(); input.items[0].fact_data = null;
    expect(buildSebPreparationReport(input).sections.at(-1).fields[0].value).toContain('Fact details unavailable');
    input.items = [];
    expect(buildSebPreparationReport(input).itemCount).toBe(0);
    expect(buildSebPreparationReport(input).sections.at(-1).fields[0].value).toContain('No saved review items');
  });
  it('rejects records from a different case, site, SEB or revision', () => {
    for (const [key, field] of [['baseline', 'sia_case_id'], ['baseline', 'site_id'], ['revision', 'seb_id'], ['site', 'sia_case_id']]) {
      const input = data(); input[key][field] = 'other';
      expect(() => buildSebPreparationReport(input)).toThrow('do not match');
    }
    const input = data(); input.items[0].seb_revision_id = 'other';
    expect(() => buildSebPreparationReport(input)).toThrow('items do not match');
  });
});
