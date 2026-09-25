const labels = {
  id: 'Record ID', site_id: 'Site ID', sia_case_id: 'SIA case ID', survey_visit_id: 'Survey visit ID',
  drone_mission_id: 'Drone mission ID', gis_layer_id: 'GIS layer ID', user_id: 'User ID', poi_id: 'POI ID',
  external_geo_source_id: 'External geo source ID', crs: 'CRS', gnss_method: 'GNSS method', gnss_status: 'GNSS status',
  qa_status: 'QA status', gcp_code: 'GCP code', target_gsd: 'Target GSD (cm)', flight_altitude: 'Flight altitude (m)',
  front_overlap: 'Front overlap (%)', side_overlap: 'Side overlap (%)', camera_angle: 'Camera angle (°)',
  wind_speed: 'Wind speed (m/s)', temperature: 'Temperature (°C)', file_size: 'File size (bytes)',
  rtk_ppk_capable: 'RTK / PPK capable', generated_at: 'Generated at (UTC)',
};
const fields = (row, keys) => keys.map(key => ({
  label: labels[key] || key.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase()),
  value: typeof row[key] === 'boolean' ? row[key] ? 'Yes' : 'No'
    : row[key] === null || row[key] === undefined || row[key] === '' ? 'Not provided' : String(row[key]),
}));

export async function loadDroneGISClimateReport(api, siteId, signal) {
  if (!siteId) throw new Error('Select an active site before opening the report.');
  const sitePath = `/sia/sites/${encodeURIComponent(siteId)}`;
  async function get(path, list = true) {
    const response = await fetch(`${api.replace(/\/$/, '')}${path}`, { signal });
    if (!response.ok) throw new Error('Some drone, GIS or climate records could not be loaded. Refresh the report to try again.');
    const data = await response.json();
    if (list ? !Array.isArray(data) || data.some(row => !row?.id) : !data?.id)
      throw new Error('The report response was incomplete. Refresh the report to try again.');
    return data;
  }
  const site = await get(sitePath, false);
  if (site.id !== siteId) throw new Error('The returned site does not match the active site.');
  const records = {};
  await Promise.all(droneReportGroups.filter(group => group.scope === 'site').map(async group => {
    records[group.key] = (await get(`${sitePath}/${group.path}`)).filter(row => row.site_id === siteId);
  }));
  await Promise.all(droneReportGroups.filter(group => group.scope !== 'site').map(async group => {
    const isMission = group.scope === 'mission';
    const parents = records[isMission ? 'missions' : 'layers'];
    const parentKey = isMission ? 'drone_mission_id' : 'gis_layer_id';
    const parentPath = isMission ? 'drone-missions' : 'gis-layers';
    records[group.key] = (await Promise.all(parents.map(async parent =>
      (await get(`/sia/${parentPath}/${encodeURIComponent(parent.id)}/${group.path}`))
        .filter(row => row[parentKey] === parent.id)
        .map(row => ({ ...row, parent_reference: (isMission ? parent.mission_code : parent.layer_name) || parent.id }))
    ))).flat();
  }));
  const sections = [{ title: 'Site details', fields: fields(site, ['id', 'sia_case_id', 'site_code', 'site_name', 'site_type', 'address', 'latitude', 'longitude', 'status']) },
    { title: 'Report generated', fields: fields({ generated_at: new Date().toISOString() }, ['generated_at']) }];
  for (const group of droneReportGroups) {
    const rows = records[group.key];
    if (!rows.length) sections.push({ title: `${group.title} (0)`, fields: [{ label: 'Records', value: 'No records saved for this site.' }] });
    rows.forEach((row, index) => {
      const context = group.scope === 'site' ? [] : [{ label: group.scope === 'mission' ? 'Mission reference' : 'Layer reference', value: row.parent_reference }];
      sections.push({ title: `${group.title} — ${index + 1} of ${rows.length}`, fields: [...context, ...fields(row, ['id', ...group.fields, 'created_at'])] });
    });
  }
  return { code: site.site_code || site.id, sections,
    counts: droneReportGroups.map(group => ({ label: group.title, value: records[group.key].length })) };
}

// Fields from existing API responses; the report preserves source IDs and recorded statuses.
export const droneReportGroups = [
  {"key": "missions", "title": "Drone Missions", "scope": "site", "path": "drone-missions", "fields": ["site_id", "survey_visit_id", "mission_code", "mission_purpose", "target_discipline", "planned_date", "actual_date", "mission_status", "remarks"]},
  {"key": "operators", "title": "Operators", "scope": "mission", "path": "operators", "fields": ["drone_mission_id", "user_id", "competency_ref", "permission_ref", "regulatory_ref", "restriction_notes"]},
  {"key": "platforms", "title": "Platforms", "scope": "mission", "path": "platforms", "fields": ["drone_mission_id", "drone_make", "drone_model", "serial_number", "sensor_type", "camera_model", "firmware_version", "rtk_ppk_capable", "thermal_capable", "multispectral_capable"]},
  {"key": "capture", "title": "Capture Plans", "scope": "mission", "path": "capture-plans", "fields": ["drone_mission_id", "crs", "datum", "vertical_datum", "gnss_method", "flight_altitude", "front_overlap", "side_overlap", "camera_angle", "target_gsd", "capture_type", "boundary_notes"]},
  {"key": "gcps", "title": "Ground Control Points", "scope": "mission", "path": "ground-control-points", "fields": ["drone_mission_id", "gcp_code", "point_type", "latitude", "longitude", "elevation", "survey_method", "accuracy", "status"]},
  {"key": "conditions", "title": "Field Conditions", "scope": "mission", "path": "field-conditions", "fields": ["drone_mission_id", "recorded_at", "weather_condition", "wind_speed", "temperature", "lighting_condition", "visibility", "rain_condition", "restriction_notes"]},
  {"key": "raw", "title": "Raw Data", "scope": "mission", "path": "raw-data", "fields": ["drone_mission_id", "data_type", "file_name", "file_path", "file_hash", "file_size", "captured_at", "import_status"]},
  {"key": "qa", "title": "Quality Checks", "scope": "mission", "path": "quality-checks", "fields": ["drone_mission_id", "coverage_status", "gap_detected", "blur_status", "exposure_status", "overlap_status", "gnss_status", "control_point_status", "qa_status", "checked_by", "checked_at", "remarks"]},
  {"key": "derived", "title": "Derived Products", "scope": "mission", "path": "derived-products", "fields": ["drone_mission_id", "product_type", "file_name", "file_path", "crs", "resolution", "accuracy", "reliability_class", "processing_version", "status"]},
  {"key": "layers", "title": "GIS Layers", "scope": "site", "path": "gis-layers", "fields": ["site_id", "layer_name", "layer_type", "geometry_type", "source_name", "source_date", "crs", "resolution_scale", "licence_info", "reliability_status", "is_active"]},
  {"key": "features", "title": "GIS Features", "scope": "layer", "path": "features", "fields": ["gis_layer_id", "poi_id", "feature_code", "feature_name", "feature_type", "geometry_data", "description", "reliability_status"]},
  {"key": "sources", "title": "External Geo Sources", "scope": "site", "path": "external-geo-sources", "fields": ["site_id", "provider_name", "dataset_name", "source_type", "source_reference", "imported_at", "licence_info", "limitation_notes", "reliability_status"]},
  {"key": "climate", "title": "Climate Resources", "scope": "site", "path": "climate-resources", "fields": ["site_id", "external_geo_source_id", "resource_type", "parameter_name", "parameter_value", "unit", "period_from", "period_to", "source_name", "reliability_status", "remarks"]},
];
