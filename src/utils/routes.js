export const demoIds = {
  consultantId: 'CONS-001', projectId: 'UNICEF-2026', siteId: 'BOREGAINA', ewpId: 'EWP-BOR-ELE-001',
  ewoId: 'EWO-2026-0042', documentId: 'DOC-SLD-001', submissionId: 'SUB-UNICEF-024', reviewCycleId: 'REV-024',
  commentId: 'CMT-017', pepId: 'PEP-UNICEF-001'
};
export function resolveDemoPath(route) {
  let result = route;
  Object.entries(demoIds).forEach(([key,value]) => { result = result.replace(`:${key}`, value); });
  return result;
}
export function relativeGinfinaPath(route) { return route.replace(/^\/ginfina\/?/, ''); }
export function slugify(value='') { return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
