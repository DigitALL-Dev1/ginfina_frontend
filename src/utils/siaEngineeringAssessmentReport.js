// Fields from the existing Engineering Assessment responses. No backend changes.
const labels = { id: 'Record ID', sia_case_id: 'SIA case ID', site_id: 'Site ID', poi_id: 'POI ID', reviewer_user_id: 'Reviewer user ID', owner_user_id: 'Owner user ID', scada_available: 'SCADA available', hse_constraint: 'HSE constraint', pump_power_kw: 'Pump power (kW)', connected_load: 'Connected load (kW)', peak_load: 'Peak load (kW)' };
const fields = (record, keys) => keys.map(key => ({ label: labels[key] || key.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase()),
  value: typeof record[key] === 'boolean' ? record[key] ? 'Yes' : 'No' : record[key] === null || record[key] === undefined || record[key] === '' ? 'Not provided' : String(record[key]) }));

export async function loadEngineeringAssessmentReport(api, assessmentId, caseId, signal) {
  const base = `${api.replace(/\/$/, '')}/sia/engineering-assessments/${encodeURIComponent(assessmentId)}`;
  async function get(path = '', list = true) {
    const response = await fetch(`${base}${path}`, { signal });
    if (!response.ok) throw new Error('Some assessment records could not be loaded. Refresh the report to try again.');
    const data = await response.json();
    if (list ? !Array.isArray(data) : !data?.id) throw new Error('The assessment response was incomplete. Refresh the report to try again.');
    return data;
  }
  const assessment = await get('', false);
  if (assessment.id !== assessmentId || assessment.sia_case_id !== caseId) throw new Error('This assessment does not belong to the selected SIA case.');
  const groups = await Promise.all(assessmentReportGroups.map(async group => ({ ...group,
    records: (await get(`/${group.path}`)).filter(row => row.engineering_assessment_id === assessmentId) })));
  const sections = [{ title: 'Assessment details', fields: fields(assessment, assessmentFields) },
    { title: 'Report generated', fields: [{ label: 'Generated at (UTC)', value: new Date().toISOString() }] }];
  for (const group of groups) {
    if (!group.records.length) sections.push({ title: `${group.title} (0)`, fields: [{ label: 'Records', value: 'No records saved for this assessment.' }] });
    group.records.forEach((record, index) => sections.push({ title: `${group.title} — ${index + 1} of ${group.records.length}`, fields: fields(record, ['id', ...group.fields, 'created_at']) }));
  }
  return { code: assessment.assessment_code || assessment.id, sections,
    counts: groups.map(group => ({ label: group.title, value: group.records.length })) };
}
export const assessmentReportGroups = [
  {
    "path": "electrical",
    "title": "Electrical",
    "fields": [
      "supply_type",
      "voltage",
      "phase",
      "frequency",
      "transformer_details",
      "switchboard_details",
      "protection_details",
      "connected_load",
      "peak_load",
      "utility_condition",
      "remarks"
    ]
  },
  {
    "path": "civil",
    "title": "Civil",
    "fields": [
      "ground_condition",
      "foundation_condition",
      "drainage_condition",
      "road_condition",
      "trench_requirement",
      "route_constraint",
      "erosion_risk",
      "flood_risk",
      "remarks"
    ]
  },
  {
    "path": "structural",
    "title": "Structural",
    "fields": [
      "structure_type",
      "roof_type",
      "material_type",
      "structural_condition",
      "roof_condition",
      "support_condition",
      "visible_damage",
      "loading_constraint",
      "remarks"
    ]
  },
  {
    "path": "mechanical",
    "title": "Mechanical",
    "fields": [
      "equipment_zone",
      "plant_condition",
      "ventilation_condition",
      "lifting_access",
      "maintenance_access",
      "pipework_condition",
      "route_constraint",
      "operational_constraint",
      "remarks"
    ]
  },
  {
    "path": "water-pumping",
    "title": "Water / Pumping",
    "fields": [
      "water_source_type",
      "daily_water_demand",
      "source_water_level",
      "delivery_elevation",
      "route_length",
      "pipe_diameter",
      "pipe_material",
      "pump_make_model",
      "pump_power_kw",
      "pump_condition",
      "tank_capacity",
      "required_pressure",
      "controller_type",
      "monitoring_available",
      "remarks"
    ]
  },
  {
    "path": "scada",
    "title": "SCADA / Communication",
    "fields": [
      "control_system_type",
      "scada_available",
      "communication_type",
      "network_available",
      "telemetry_available",
      "remote_monitoring",
      "sensor_details",
      "protocol_details",
      "connectivity_condition",
      "remarks"
    ]
  },
  {
    "path": "hse",
    "title": "HSE / Environment",
    "fields": [
      "environmental_condition",
      "hazard_level",
      "fire_risk",
      "emergency_access",
      "electrical_safety",
      "roof_safety",
      "restricted_area",
      "environmental_constraint",
      "hse_constraint",
      "remarks"
    ]
  },
  {
    "path": "industrial",
    "title": "Industrial",
    "fields": [
      "equipment_name",
      "process_type",
      "operating_hours",
      "duty_cycle",
      "start_frequency",
      "diversity_factor",
      "throughput",
      "criticality",
      "operating_parameters",
      "remarks"
    ]
  },
  {
    "path": "findings",
    "title": "Findings",
    "fields": [
      "poi_id",
      "finding_code",
      "finding_type",
      "description",
      "severity",
      "reliability_status",
      "constraint",
      "recommendation",
      "status"
    ]
  },
  {
    "path": "gaps",
    "title": "Gaps",
    "fields": [
      "gap_code",
      "gap_type",
      "description",
      "impact",
      "priority",
      "owner_user_id",
      "target_date",
      "status"
    ]
  },
  {
    "path": "reviews",
    "title": "Reviews",
    "fields": [
      "reviewer_user_id",
      "review_status",
      "review_comment",
      "verification_status",
      "reviewed_at"
    ]
  }
];
const assessmentFields = ["id", "sia_case_id", "site_id", "assessment_code", "discipline", "assessment_date", "assessed_by", "reliability_status", "status", "summary", "created_at"];
