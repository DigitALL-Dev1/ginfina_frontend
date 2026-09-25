import { recordFields } from './siaCompletionReport';

export function buildCompletionGovernanceReport({ summary, ewpId }) {
  if (!ewpId || summary?.ewp?.id !== ewpId || !summary.control)
    throw new Error('The saved completion summary does not match the selected EWP. Reload the report.');
  const state = summary.control;
  const closure = state.closure;
  if ((summary.completion_status === 'CLOSED' || state.completion_status === 'CLOSED') && !closure?.summary)
    throw new Error('The saved closure snapshot is missing. Reload the report.');
  // Closed assessments must retain their original checklist, obligations and source references.
  const assessment = closure ? closure.summary : summary;
  if (!assessment || (closure && (!closure.snapshot_hash || !closure.closed_at || !closure.approved_by)))
    throw new Error('The closure record is incomplete. Reload the report.');
  for (const key of ['checks', 'blockers', 'obligations']) {
    const rows = assessment[key];
    if (!Array.isArray(rows) || rows.some(row => !row?.id) || new Set(rows.map(row => row.id)).size !== rows.length)
      throw new Error(`The saved ${key} are incomplete. Reload the report.`);
  }
  if (assessment.checks.some(row => !Array.isArray(row.issues)) ||
      assessment.blockers.some(row => !Array.isArray(row.issues) || !assessment.checks.some(check => check.id === row.id && check.mandatory && check.status === 'FAILED')) ||
      !assessment.sources || !assessment.summary_hash)
    throw new Error('Completion check results or source references are incomplete. Reload the report.');
  for (const key of ['actions', 'resolutions', 'history']) {
    if (!Array.isArray(state[key]) || state[key].some(row => !row || typeof row !== 'object'))
      throw new Error(`The saved governance ${key} are incomplete. Reload the report.`);
  }
  const { checks, blockers, obligations } = assessment;
  const status = closure ? 'CLOSED' : summary.completion_status;
  const sections = [];
  const add = (title, data) => sections.push({ title, fields: recordFields(data) });
  const rows = (title, records, empty) => {
    if (!records.length) add(title, { details: empty });
    records.forEach((record, index) => add(`${title} ${index + 1}`, record));
  };
  add('Report summary', {
    generated_at_utc: new Date().toISOString(), completion_status: status,
    report_basis: closure ? 'Saved closure snapshot' : 'Current saved completion assessment',
    ready_for_closure: assessment.ready_for_closure, governance_valid: assessment.governance_valid,
    total_checks: checks.length, mandatory_checks: checks.filter(row => row.mandatory).length,
    passed_checks: checks.filter(row => row.status === 'PASSED').length,
    failed_checks: checks.filter(row => row.status === 'FAILED').length,
    blocking_checks: blockers.length, open_conditions_and_actions: obligations.filter(row => row.status === 'OPEN').length,
    summary_hash: assessment.summary_hash,
  });
  const { management_control, completion_control, ...ewp } = summary.ewp;
  add('EWP details', ewp);
  rows('Completion checklist', checks, 'No completion checks returned');
  rows('Completion blocker', blockers, 'No mandatory completion blockers');
  rows('Condition, blocker or action', obligations, 'No conditions, blockers or actions recorded');
  add('Governance verification', { valid_for_assessment: assessment.governance_valid,
    ...(state.governance || { details: 'Governance verification has not been recorded' }) });
  const { closure: savedClosure, checks: savedChecks, governance, actions, resolutions, history, ...controlDetails } = state;
  add('Completion and submission control', controlDetails);
  rows('Recorded action', actions, 'No completion actions recorded');
  rows('Recorded resolution', resolutions, 'No completion resolutions recorded');
  add('Engineering source references', assessment.sources);
  if (closure) {
    const { summary: snapshot, ...closureDetails } = closure;
    add('Approved closure record', closureDetails);
    add('Closure snapshot scope', { assessment_status_at_closure: assessment.completion_status,
      details: 'Checklist, obligations and source references above come from the saved closure snapshot.' });
  } else add('Closure decision', { details: 'EWP closure has not been approved' });
  rows('Governance activity', history, 'No governance activity recorded');
  return {
    code: summary.ewp.ewp_code || ewpId, sections,
    counts: [{ label: 'Completion status', value: status }, { label: 'Checks passed', value: `${checks.filter(row => row.status === 'PASSED').length} / ${checks.length}` },
      { label: 'Blocking checks', value: blockers.length }, { label: 'Open obligations', value: obligations.filter(row => row.status === 'OPEN').length }],
  };
}
