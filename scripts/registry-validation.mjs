export function validateRegistry(specs, branches, nav, dedicatedIds = new Set()) {
  const errors = [];
  const ids = new Set();
  const routes = new Set();
  for (const screen of specs) {
    if (ids.has(screen.id)) errors.push(`Duplicate screen ID ${screen.id}`);
    if (routes.has(screen.route)) errors.push(`Duplicate screen route ${screen.route}`);
    ids.add(screen.id); routes.add(screen.route);
    if (!screen.route?.startsWith('/ginfina/')) errors.push(`Invalid route for ${screen.id}`);
    if (!dedicatedIds.has(screen.id) && !branches.some(b => b.screenId === screen.id && b.kind === 'primary'))
      errors.push(`Primary action branch missing ${screen.id}`);
  }
  for (let i = 1; i <= 39; i++) {
    const id = `GIN-UI-${String(i).padStart(3, '0')}`;
    if (!ids.has(id)) errors.push(`Missing ${id}`);
  }
  function visit(node) {
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (!node || typeof node !== 'object') return;
    if (node.route && !routes.has(node.route)) errors.push(`Unknown navigation route ${node.route}`);
    for (const id of node.screens || []) if (!ids.has(id)) errors.push(`Unknown navigation screen ${id}`);
    Object.values(node).forEach(visit);
  }
  visit(nav);
  const keys = new Set();
  for (const branch of branches) {
    const key = `${branch.screenId}:${branch.key}`;
    if (!ids.has(branch.screenId)) errors.push(`Unknown branch screen ${branch.screenId}`);
    if (keys.has(key)) errors.push(`Duplicate branch ${key}`);
    keys.add(key);
  }
  return errors;
}

export function dedicatedScreenIds(source) {
  return new Set([...source.matchAll(/if\(spec\.id==='([^']+)'\) return <div/g)].map(match => match[1]));
}
