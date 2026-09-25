const schemas = {
  site: ['site_code', 'site_name', 'site_type', 'address', 'contact_name', 'contact_phone', 'latitude', 'longitude', 'status'],
  buildings: ['building_code', 'building_name', 'building_type', 'floor_count', 'description'],
  rooms: ['building_reference', 'area_code', 'area_name', 'area_type', 'floor_level', 'description'],
  pois: ['poi_code', 'poi_name', 'poi_type', 'category', 'room_area_id', 'latitude', 'longitude', 'description'],
  visits: ['visit_code', 'visit_type', 'purpose', 'planned_date', 'planned_start_time', 'planned_end_time', 'actual_start', 'actual_end', 'status'],
  team: ['visit_reference', 'user_id', 'team_role', 'is_lead'],
  access: ['access_type', 'road_condition', 'transport_method', 'entry_permission', 'working_hours', 'access_restriction', 'logistics_notes'],
  safety: ['hazard_type', 'risk_level', 'description', 'ppe_required', 'restricted_area', 'emergency_contact', 'control_action'],
  requirements: ['visit_reference', 'assessment_pack_id', 'requirement_name', 'requirement_type', 'is_mandatory', 'status', 'notes'],
  instruments: ['visit_reference', 'instrument_name', 'instrument_type', 'serial_number', 'calibration_status', 'required'],
};
const groups = [['buildings', 'Buildings'], ['rooms', 'Room / Areas'], ['pois', 'Points of Interest'], ['visits', 'Survey Visits'], ['team', 'Survey Team'], ['access', 'Site Access'], ['safety', 'Site Safety'], ['requirements', 'Survey Requirements'], ['instruments', 'Survey Instruments']];
const labels = { id: 'Record ID', sia_case_id: 'SIA case ID', project_id: 'Project ID', user_id: 'User ID', poi_code: 'POI code', poi_name: 'POI name', poi_type: 'POI type', ppe_required: 'PPE required', is_lead: 'Team lead', is_mandatory: 'Mandatory', room_area_id: 'Room / area ID', assessment_pack_id: 'Assessment pack ID' };
const fields = (row, keys) => keys.map(key => ({ label: labels[key] || key.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase()),
  value: typeof row[key] === 'boolean' ? row[key] ? 'Yes' : 'No' : row[key] === null || row[key] === undefined || row[key] === '' ? 'Not provided' : String(row[key]) }));

export async function loadSitesSurveyReport(api, siaCase, siteId, signal) {
  async function get(path, list = true) {
    const response = await fetch(`${api.replace(/\/$/, '')}${path}`, { signal });
    if (!response.ok) throw new Error('Some survey records could not be loaded. Refresh the report to try again.');
    const data = await response.json();
    if (list ? !Array.isArray(data) : !data?.id) throw new Error('The survey response was incomplete. Refresh the report to try again.');
    return data;
  }
  const site = await get(`/sia/sites/${encodeURIComponent(siteId)}`, false);
  if (site.id !== siteId || site.sia_case_id !== siaCase.id) throw new Error('This site does not belong to the selected SIA case.');
  const data = { site };
  await Promise.all([['buildings', 'buildings'], ['pois', 'pois'], ['visits', 'survey-visits'], ['access', 'access'], ['safety', 'safety']].map(async ([key, path]) => {
    data[key] = (await get(`/sia/sites/${encodeURIComponent(siteId)}/${path}`)).filter(row => row.site_id === siteId);
  }));
  const rooms = await Promise.all(data.buildings.map(async building =>
    (await get(`/sia/buildings/${encodeURIComponent(building.id)}/room-areas`))
      .filter(row => row.building_id === building.id && row.site_id === siteId)
      .map(row => ({ ...row, building_reference: building.building_code || building.building_name || building.id }))));
  data.rooms = rooms.flat();
  await Promise.all(['team', 'requirements', 'instruments'].map(async key => {
    data[key] = (await Promise.all(data.visits.map(async visit =>
      (await get(`/sia/survey-visits/${encodeURIComponent(visit.id)}/${key}`))
        .filter(row => row.survey_visit_id === visit.id)
        .map(row => ({ ...row, visit_reference: visit.visit_code || visit.id }))))).flat();
  }));
  const sections = [
    { title: 'Report context', fields: fields({ ...siaCase, generated_at: new Date().toISOString() }, ['case_code', 'id', 'project_id', 'assessment_stage', 'assessment_purpose', 'generated_at']) },
    { title: 'Site details', fields: fields(site, ['id', ...schemas.site]) },
  ];
  for (const [key, title] of groups) {
    if (!data[key].length) sections.push({ title: `${title} (0)`, fields: [{ label: 'Records', value: 'No records saved for this site.' }] });
    else data[key].forEach((row, i) => sections.push({ title: `${title} — ${i + 1} of ${data[key].length}`, fields: fields(row, ['id', ...schemas[key]]) }));
  }
  return { code: `${siaCase.case_code || siaCase.id}-${site.site_code || site.id}`, sections,
    counts: groups.map(([key, label]) => ({ label, value: data[key].length })) };
}
