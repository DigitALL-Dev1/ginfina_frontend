export const normalizeRole = role => typeof role === 'string' ? role.trim().toUpperCase() : '';

const roleRoutes = {
  REVIEWER: ['/ginfina/ewp/documents-reviews'],
  APPROVER: ['/ginfina/ewp/approval-release', '/ginfina/sep/approval-release'],
};

export function canAccessModule(role, pathname) {
  const normalized = normalizeRole(role);
  return normalized === 'ADMIN' || (roleRoutes[normalized] || []).includes(pathname.replace(/\/+$/, ''));
}

export function roleHome(role) {
  return normalizeRole(role) === 'ADMIN' ? '/ginfina' : roleRoutes[normalizeRole(role)]?.[0] || '/ginfina/no-access';
}

export function visibleNavigation(groups, role) {
  return groups.map(group => ({
    ...group,
    items: (group.items || []).filter(item => canAccessModule(role, item.route)),
    sections: (group.sections || []).map(section => ({
      ...section, items: section.items.filter(item => canAccessModule(role, item.route)),
    })).filter(section => section.items.length),
  })).filter(group => group.items.length || group.sections.length);
}
