import { describe, expect, it } from 'vitest';
import { buildQuantitiesProcurementReport } from './quantitiesProcurementReport';

function fixture() {
  const source = { document_id: 'doc', revision_id: 'rev', revision_no: 'D03', release_id: 'release', release_hash: 'a'.repeat(64), seb_basis: { seb_id: 'seb', revision_id: 'r01', freeze_snapshot_id: 'freeze' } };
  const items = [{ id: 'item1', item: 'Cable', quantity: 12.5, unit: 'm', source }, { id: 'item2', item: 'Panel', quantity: 2, unit: 'EA', source }];
  const boq = { id: 'boq', ewp_id: 'ewp', type: 'EBOM', revision_no: 'R01', status: 'PROCUREMENT_READY', content_hash: 'b'.repeat(64), items: structuredClone(items), review: { decision: 'ACCEPT', by: 'Reviewer' }, approval: { decision: 'APPROVE', by: 'Approver', comment: 'Approved for procurement' } };
  return { ewpId: 'ewp', registerId: 'register', ewp: { id: 'ewp', code: 'EWP-001', name: 'Electrical Design' }, register: {
    id: 'register', ewp_id: 'ewp', name: 'Electrical quantities', status: 'HANDOFF_REFERENCED', version: 8, items, boqs: [boq], current_boq_id: 'boq',
    handoff: { id: 'register', ewp_id: 'ewp', boq_id: 'boq', boq_content_hash: 'b'.repeat(64), quantity_item_ids: ['item1', 'item2'], source_release_ids: ['release'], system: 'Procurement system', reference: 'PO-001', status: 'REFERENCED' },
    history: [{ action: 'PROCUREMENT_REFERENCED', actor: 'Engineer', at: '2026-09-22', comment: 'Reference created' }],
  } };
}
const text = report => report.sections.flatMap(section => section.fields.map(field => field.value)).join('\n');

describe('Quantities and procurement report', () => {
  it('preserves BOQ snapshots, source hashes, separate unit totals and actual procurement status', () => {
    const data = fixture();
    data.register.items[0].quantity = 20;
    const before = JSON.stringify(data);
    const report = buildQuantitiesProcurementReport(data);
    const contents = text(report);
    for (const value of ['12.5', '20', 'EA', 'm', 'a'.repeat(64), 'Approved for procurement', 'PO-001', 'Reference created']) expect(contents).toContain(value);
    expect(report.sections[0].fields.find(row => row.label === 'Procurement tracking complete').value).toBe('No');
    expect(report.counts.find(row => row.label === 'Procurement status').value).toBe('REFERENCED');
    expect(report.counts.find(row => row.label === 'Take-off source releases').value).toBe(1);
    expect(JSON.stringify(data)).toBe(before);
    data.register.handoff.status = 'COMPLETED';
    expect(buildQuantitiesProcurementReport(data).sections[0].fields.find(row => row.label === 'Procurement tracking complete').value).toBe('Yes');
  });
  it('shows empty draft records without claiming approval or a procurement handoff', () => {
    const data = fixture();
    Object.assign(data.register, { status: 'DRAFT', items: [], boqs: [], current_boq_id: null, handoff: null, history: [] });
    const contents = text(buildQuantitiesProcurementReport(data));
    for (const value of ['DRAFT', 'No saved quantity items', 'No BOQ / EBOM has been generated', 'No procurement reference recorded']) expect(contents).toContain(value);
    expect(contents).not.toContain('APPROVE');
  });
  it('rejects wrong scope, missing snapshots and mismatched handoff references', () => {
    const data = fixture();
    expect(() => buildQuantitiesProcurementReport({ ...data, ewpId: 'other' })).toThrow(/does not match/);
    data.register.handoff.quantity_item_ids = ['item1'];
    expect(() => buildQuantitiesProcurementReport(data)).toThrow(/handoff/);
    data.register.handoff = null;
    data.register.current_boq_id = 'missing';
    expect(() => buildQuantitiesProcurementReport(data)).toThrow(/snapshot is missing/);
    data.register.current_boq_id = 'boq';
    data.register.boqs[0].items[0].source = null;
    expect(() => buildQuantitiesProcurementReport(data)).toThrow(/source references/);
  });
});
