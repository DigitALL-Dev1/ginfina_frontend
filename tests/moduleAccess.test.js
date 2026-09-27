import { describe, expect, it } from 'vitest';
import { canAccessModule, normalizeRole, roleHome, visibleNavigation } from '../src/utils/moduleAccess';
import { navigationGroups } from '../src/config/navigation';

const routesFor = role => visibleNavigation(navigationGroups, role).flatMap(group => [...group.items, ...group.sections.flatMap(section => section.items)]).map(item => item.route);

describe('module role access', () => {
  it('limits reviewers to document review, including on direct navigation', () => {
    expect(routesFor(' reviewer ')).toEqual(['/ginfina/ewp/documents-reviews']);
    expect(roleHome('reviewer')).toBe('/ginfina/ewp/documents-reviews');
    expect(canAccessModule('REVIEWER', '/ginfina/ewp/documents-reviews/')).toBe(true);
    for (const route of ['/ginfina/ui-catalog', '/ginfina/ui-branch/GIN-UI-001/test', '/ginfina/ewp/approval-release', '/ginfina/ewp/documents-reviews-other']) {
      expect(canAccessModule('REVIEWER', route)).toBe(false);
    }
  });
  it('limits approvers to approval and release', () => {
    expect(routesFor('approver')).toEqual(['/ginfina/sep/approval-release', '/ginfina/ewp/approval-release']);
    expect(canAccessModule('APPROVER', '/ginfina/ewp/documents-reviews')).toBe(false);
  });
  it('retains every module and catalog access for admins', () => {
    const allRoutes = navigationGroups.flatMap(group => [...group.items, ...(group.sections || []).flatMap(section => section.items)]).map(item => item.route);
    expect(routesFor('admin')).toEqual(allRoutes);
    expect(canAccessModule('ADMIN', '/ginfina/ui-catalog')).toBe(true);
    expect(roleHome('ADMIN')).toBe('/ginfina');
  });
  it('does not grant access for absent or unmapped roles', () => {
    for (const role of [null, undefined, '', 'USER', 'CONSULTANT', 'ADMINISTRATOR']) {
      expect(routesFor(role)).toEqual([]);
      expect(canAccessModule(role, '/ginfina/ewp/documents-reviews')).toBe(false);
      expect(roleHome(role)).toBe('/ginfina/no-access');
    }
    expect(normalizeRole(' Admin ')).toBe('ADMIN');
  });
});
