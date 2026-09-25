const labels = {
  id: 'Record ID', sia_case_id: 'SIA case ID', site_id: 'Site ID', poi_id: 'POI ID', project_id: 'Project ID',
  evidence_id: 'Evidence ID', engineering_assessment_id: 'Engineering assessment ID', ai_observation_id: 'AI observation ID',
  conflict_id: 'Conflict ID', data_gap_id: 'Data gap ID', discipline_readiness_id: 'Discipline readiness ID',
  owner_user_id: 'Owner user ID', reviewer_user_id: 'Reviewer user ID', crm_reference_id: 'CRM reference ID',
  generated_at: 'Generated at (UTC)',
};
const fields = (row, keys) => keys.map(key => ({
  label: labels[key] || key.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase()),
  value: typeof row[key] === 'boolean' ? row[key] ? 'Yes' : 'No'
    : row[key] === null || row[key] === undefined || row[key] === '' ? 'Not provided' : String(row[key]),
}));

export async function loadEvidenceAIReadinessReport(api, caseId, signal) {
  if (!caseId) throw new Error('Select an active SIA case before opening the report.');
  const casePath = `/sia/cases/${encodeURIComponent(caseId)}`;
  async function get(path, list = true) {
    const response = await fetch(`${api.replace(/\/$/, '')}${path}`, { signal });
    if (!response.ok) throw new Error('Some evidence, AI or readiness records could not be loaded. Refresh the report to try again.');
    const data = await response.json();
    if (list ? !Array.isArray(data) || data.some(row => !row?.id) : !data?.id)
      throw new Error('The report response was incomplete. Refresh the report to try again.');
    return data;
  }
  const siaCase = await get(casePath, false);
  if (siaCase.id !== caseId) throw new Error('The returned SIA case does not match the active case.');
  const records = {};
  await Promise.all(evidenceReportGroups.filter(group => !group.parent).map(async group => {
    records[group.key] = (await get(`${casePath}/${group.path}`)).filter(row => row.sia_case_id === caseId);
  }));
  await Promise.all(evidenceReportGroups.filter(group => group.parent).map(async group => {
    const parentGroup = evidenceReportGroups.find(parent => parent.key === group.parent);
    records[group.key] = (await Promise.all(records[group.parent].map(async parent =>
      (await get(`/sia/${parentGroup.path}/${encodeURIComponent(parent.id)}/${group.path}`))
        .filter(row => row[group.foreignKey] === parent.id)
        .map(row => ({ ...row, parent_reference: parent[group.referenceField] || parent.id }))
    ))).flat();
  }));
  const sections = [
    { title: 'SIA case details', fields: fields(siaCase, ['id', 'case_code', 'project_id', 'assessment_purpose', 'assessment_stage', 'owner_user_id', 'crm_reference_id', 'opportunity_id', 'created_at']) },
    { title: 'Report context', fields: [
      ...fields({ generated_at: new Date().toISOString() }, ['generated_at']),
      { label: 'AI observations', value: 'AI outputs are advisory. Reviewer dispositions and readiness decisions are shown as recorded.' },
    ] },
  ];
  const gaps = new Map(records.gaps.map(gap => [gap.id, gap.gap_code || gap.id]));
  for (const group of evidenceReportGroups) {
    const rows = records[group.key];
    if (!rows.length) sections.push({ title: `${group.title} (0)`, fields: [{ label: 'Records', value: 'No records saved for this case.' }] });
    rows.forEach((row, index) => {
      const context = group.parent ? [{ label: group.referenceLabel, value: row.parent_reference }] : [];
      // The case RFI register already contains gap RFIs; include each action once with its gap reference.
      if (row.data_gap_id && gaps.has(row.data_gap_id)) context.push({ label: 'Gap reference', value: gaps.get(row.data_gap_id) });
      sections.push({ title: `${group.title} — ${index + 1} of ${rows.length}`, fields: [...context, ...fields(row, ['id', ...group.fields, 'created_at'])] });
    });
  }
  return { code: siaCase.case_code || siaCase.id, sections,
    counts: evidenceReportGroups.map(group => ({ label: group.title, value: records[group.key].length })) };
}

// Explicit fields from existing responses, including source references and human review records.
export const evidenceReportGroups = [
  {"key": "evidence", "title": "Evidence", "path": "evidence", "fields": ["sia_case_id", "site_id", "poi_id", "engineering_assessment_id", "evidence_code", "evidence_type", "source_type", "file_name", "file_path", "file_hash", "captured_at", "captured_by", "reliability_status", "evidence_status"]},
  {"key": "verifications", "title": "Evidence Verifications", "path": "verifications", "fields": ["evidence_id", "verified_by", "verification_status", "verification_comment", "verified_at"], "parent": "evidence", "foreignKey": "evidence_id", "referenceField": "evidence_code", "referenceLabel": "Evidence reference"},
  {"key": "facts", "title": "Source Facts", "path": "source-facts", "fields": ["sia_case_id", "site_id", "evidence_id", "fact_name", "fact_value", "unit", "source_type", "reliability_status", "fact_status"]},
  {"key": "observations", "title": "AI Observations", "path": "ai-observations", "fields": ["sia_case_id", "site_id", "observation_code", "task_type", "model_name", "model_version", "input_reference", "output_value", "confidence_score", "reliability_status"]},
  {"key": "dispositions", "title": "AI Dispositions", "path": "dispositions", "fields": ["ai_observation_id", "reviewer_user_id", "disposition", "modified_value", "reviewer_comment", "disposition_at"], "parent": "observations", "foreignKey": "ai_observation_id", "referenceField": "observation_code", "referenceLabel": "AI observation reference"},
  {"key": "conflicts", "title": "Conflicts", "path": "conflicts", "fields": ["sia_case_id", "site_id", "conflict_code", "discipline", "conflict_type", "source_a", "value_a", "source_b", "value_b", "description", "priority", "status"]},
  {"key": "resolutions", "title": "Conflict Resolutions", "path": "resolutions", "fields": ["conflict_id", "resolved_by", "accepted_value", "resolution_reason", "resolution_status", "resolved_at"], "parent": "conflicts", "foreignKey": "conflict_id", "referenceField": "conflict_code", "referenceLabel": "Conflict reference"},
  {"key": "gaps", "title": "Data Gaps", "path": "data-gaps", "fields": ["sia_case_id", "site_id", "gap_code", "discipline", "gap_description", "impact", "priority", "owner_user_id", "target_date", "status"]},
  {"key": "rfi", "title": "RFI Actions", "path": "rfi-actions", "fields": ["sia_case_id", "data_gap_id", "action_code", "action_type", "subject", "description", "assigned_to", "target_date", "response", "status", "completed_at"]},
  {"key": "constraints", "title": "Constraints and Assumptions", "path": "constraints-assumptions", "fields": ["sia_case_id", "site_id", "record_type", "discipline", "description", "impact", "reliability_status", "recorded_by", "status"]},
  {"key": "readiness", "title": "Discipline Readiness", "path": "discipline-readiness", "fields": ["sia_case_id", "site_id", "discipline", "readiness_status", "assessment_date", "summary", "assessed_by"]},
  {"key": "conditions", "title": "Readiness Conditions", "path": "conditions", "fields": ["discipline_readiness_id", "condition_description", "required_action", "owner_user_id", "target_date", "status"], "parent": "readiness", "foreignKey": "discipline_readiness_id", "referenceField": "discipline", "referenceLabel": "Discipline reference"},
  {"key": "blockers", "title": "Readiness Blockers", "path": "blockers", "fields": ["discipline_readiness_id", "data_gap_id", "blocker_type", "blocker_description", "severity", "owner_user_id", "status"], "parent": "readiness", "foreignKey": "discipline_readiness_id", "referenceField": "discipline", "referenceLabel": "Discipline reference"},
  {"key": "reviews", "title": "Readiness Reviews", "path": "reviews", "fields": ["discipline_readiness_id", "reviewer_user_id", "review_decision", "review_comment", "reviewed_at"], "parent": "readiness", "foreignKey": "discipline_readiness_id", "referenceField": "discipline", "referenceLabel": "Discipline reference"},
];
