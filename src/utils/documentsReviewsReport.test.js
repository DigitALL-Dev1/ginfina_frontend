import { describe, expect, it } from 'vitest';
import { buildDocumentsReviewsReport } from './documentsReviewsReport';

const fixture = () => ({
  ewpId: 'ewp', documentId: 'doc',
  deliverable: { id: 'del', code: 'DEL-001', name: 'Single Line Diagram', ewp: { id: 'ewp', code: 'EWP-001', name: 'Electrical Design' } },
  document: { id: 'doc', document_code: 'SLD-001', deliverable_id: 'del', ewp_id: 'ewp', status: 'REVIEW_COMPLETED', current_revision_id: 'rev2', current_revision_no: 'D02',
    revisions: [{ id: 'rev1', document_id: 'doc', revision_no: 'D01', status: 'CHANGE_REQUIRED', file_name: 'sld-d01.pdf', storage_path: '/internal/old.pdf' },
      { id: 'rev2', document_id: 'doc', revision_no: 'D02', status: 'REVIEW_COMPLETED', review_completed_at: '2026-09-22', file_name: 'sld-d02.pdf', file_size: 0, storage_path: '/internal/current.pdf' }],
    reviewers: [{ id: 'reviewer', document_id: 'doc', revision_id: 'rev2', reviewer_name: 'Electrical Lead', status: 'COMPLETED', decision: 'ACCEPT_WITH_COMMENT', decision_comment: 'Checked ratings' }],
    comments: [{ id: 'comment', document_id: 'doc', revision_id: 'rev1', text: 'Change cable rating', status: 'CLOSED', response: 'Rating revised in D02', responded_by: 'Engineer A', closed_at: '2026-09-22' }],
  },
});

describe('Documents and reviews report', () => {
  it('includes revision-specific decisions, historical comments and file metadata without internal paths', () => {
    const input = fixture(), before = JSON.stringify(input), report = buildDocumentsReviewsReport(input);
    expect(report.code).toBe('SLD-001-D02');
    expect(report.counts.map(count => count.value)).toEqual([2, 1, 1, 0]);
    expect(report.sections.some(section => section.title === 'Comment 1 - D01')).toBe(true);
    for (const value of ['Checked ratings', 'Rating revised in D02', 'sld-d01.pdf', 'sld-d02.pdf', '2026-09-22']) expect(JSON.stringify(report)).toContain(value);
    expect(JSON.stringify(report)).not.toContain('/internal/');
    expect(JSON.stringify(input)).toBe(before);
  });
  it('shows empty review records and a new revision without inheriting old completion', () => {
    const input = fixture(); input.document.revisions[1].status = 'REVISED'; input.document.revisions[1].review_completed_at = null;
    input.document.status = 'REVISED'; input.document.reviewers = []; input.document.comments = [];
    const report = buildDocumentsReviewsReport(input);
    expect(JSON.stringify(report)).toContain('No reviewers assigned to the current revision');
    expect(JSON.stringify(report)).toContain('No saved review comments');
    expect(report.counts.map(count => count.value)).toEqual([2, 0, 0, 0]);
  });
  it('rejects mismatched documents and dangling revision references', () => {
    for (const mutate of [x => { x.ewpId = 'other'; }, x => { x.deliverable.id = 'other'; }, x => { x.document.current_revision_id = 'missing'; },
      x => { x.document.reviewers[0].revision_id = 'rev1'; }, x => { x.document.comments[0].revision_id = 'missing'; },
      x => { x.document.revisions.push(x.document.revisions[0]); }, x => { x.document.comments = null; }]) {
      const input = fixture(); mutate(input);
      expect(() => buildDocumentsReviewsReport(input)).toThrow();
    }
  });
});
