import { recordFields } from './siaCompletionReport';

export function buildManagementAdministrationReport({ data, project, projectId, ewpId }) {
  if (!projectId || !ewpId || project?.id !== projectId || data?.ewp?.id !== ewpId || data.ewp.project_id !== projectId)
    throw new Error('The saved management overview does not match the selected project and EWP. Reload the report.');
  const registers = { team: 'Team member', milestones: 'Milestone', issues: 'Issue', risks: 'Risk', actions: 'Action', access: 'Access assignment' };
  for (const key of [...Object.keys(registers), 'metrics', 'attention', 'history']) {
    const rows = data[key];
    if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object'))
      throw new Error(`The saved ${key} records are incomplete. Reload the report.`);
    if (registers[key] && (rows.some(row => !row.id || (row.ewp_id && row.ewp_id !== ewpId)) || new Set(rows.map(row => row.id)).size !== rows.length))
      throw new Error(`The saved ${key} records have inconsistent references. Reload the report.`);
  }
  if (!data.counts || !Number.isFinite(data.overall_progress))
    throw new Error('The saved management progress summary is incomplete. Reload the report.');
  const sections = [];
  const add = (title, record) => sections.push({ title, fields: recordFields(record) });
  add('Report summary', {
    generated_at_utc: new Date().toISOString(), ewp_status: data.ewp.status,
    management_version: data.version, read_only: data.read_only, overall_progress_percent: data.overall_progress,
    progress_basis: 'Average across modules with saved records; closure readiness is verified in Completion & Governance.',
    scope: 'All saved management registers and returned activity history, regardless of the tab or control register currently displayed.',
  });
  add('Project details', project);
  add('EWP definition and dates', data.ewp);
  add('Management counts', data.counts);
  if (!data.metrics.length) add('Module progress', { details: 'No module progress records returned' });
  data.metrics.forEach(metric => add(`Module progress - ${metric.label}`, metric));
  if (!data.attention.length) add('Needs attention', { details: 'No attention records returned' });
  data.attention.forEach((record, index) => add(`Needs attention ${index + 1}`, record));
  for (const [key, title] of Object.entries(registers)) {
    if (key === 'access') add('Access administration', {
      access_mode: data.access_mode,
      ...(data.access_mode === 'PROTOTYPE_PILOT' ? { details: 'Pilot access assignments are administrative records; they do not enforce authentication or restrict API access.' } : {}),
    });
    if (!data[key].length) add(`${title} register`, { details: `No saved ${key} records` });
    data[key].forEach((record, index) => add(`${title} ${index + 1}`, record));
  }
  if (!data.history.length) add('Activity history', { details: 'No activity recorded' });
  data.history.forEach((event, index) => add(`Activity ${index + 1} - ${event.module || 'Management'}`, event));
  return {
    code: `${project.code || projectId}-${data.ewp.ewp_code || ewpId}`, sections,
    counts: [{ label: 'Engineering progress', value: `${data.overall_progress}%` },
      { label: 'Active team members', value: data.team.filter(row => row.active).length },
      { label: 'Open actions', value: data.counts.open_actions }, { label: 'Overdue actions', value: data.counts.overdue_actions }],
  };
}
