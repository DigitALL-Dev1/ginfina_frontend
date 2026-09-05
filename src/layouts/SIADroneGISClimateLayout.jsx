import { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader, Modal,
  Paper, Select, Stack, Tabs, Table, Text, Textarea,
  TextInput, Title, NumberInput, Switch,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconDrone, IconUsers, IconDeviceGamepad2,
  IconMap, IconCloudRain, IconMapPin, IconDatabase,
  IconShieldCheck, IconLayersIntersect, IconWorld,
  IconSun, IconBug,
} from '@tabler/icons-react';
import SIAStepFlow from '../components/common/SIAStepFlow';
import { autoCode } from '../utils/autoCode';

const API = '/api';
const thS = { fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' };

const MISSION_STATUS = ['Planned', 'In Progress', 'Completed', 'Aborted', 'On Hold'];
const QA_STATUS = ['Pass', 'Fail', 'Pending', 'Partial'];
const PRODUCT_TYPES = ['ORTHOMOSAIC', 'POINT_CLOUD', 'DSM', 'DTM', 'CONTOUR', '3D_MESH', 'THERMAL'];
const CLIMATE_TYPES = ['SOLAR_RESOURCE', 'TEMPERATURE', 'RAINFALL', 'WIND', 'HUMIDITY', 'MARINE_CORROSION'];
const GEOM_TYPES = ['Point', 'LineString', 'Polygon', 'MultiPolygon', 'Mixed'];

// ── hooks & helpers ─────────────────────────────────────
function useApi(url, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const reload = () => {
    if (!url) return;
    setLoading(true);
    fetch(url).then(r => r.json()).then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => { }).finally(() => setLoading(false));
  };
  useEffect(() => { reload(); }, deps); // eslint-disable-line
  return { data, loading, reload };
}

async function postApi(path, body) {
  const cleaned = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, v === '' ? null : v]));
  const res = await fetch(`${API}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleaned),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || `HTTP ${res.status}`); }
  return res.json();
}

function EmptyRow({ cols }) {
  return <Table.Tr><Table.Td colSpan={cols} style={{ textAlign: 'center', padding: '28px 0' }}>
    <Text size="sm" c="dimmed">No records found.</Text></Table.Td></Table.Tr>;
}
function DataTable({ loading, cols, rows, render }) {
  return (
    <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 8, position: 'relative', minHeight: 110 }}>
      {loading && <Group justify="center" py="xl"><Loader color="green" size="sm" /></Group>}
      {!loading && <Table verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
          <Table.Tr>{cols.map(c => <Table.Th key={c} style={thS}>{c}</Table.Th>)}</Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows.length === 0 ? <EmptyRow cols={cols.length} /> : rows.map(render)}</Table.Tbody>
      </Table>}
    </Paper>
  );
}
function TabHeader({ title, onAdd, addLabel, disabled = false }) {
  return <Group justify="space-between" mb="sm">
    <Text fw={600} size="sm" c="#374151">{title}</Text>
    <Button size="xs" color="green" leftSection={<IconPlus size={13} />} disabled={disabled}
      onClick={onAdd} style={{ backgroundColor: disabled ? undefined : '#007336' }}>{addLabel}</Button>
  </Group>;
}
function FormModal({ opened, onClose, title, saving, onSubmit, children }) {
  return <Modal opened={opened} onClose={onClose} title={<Text fw={700} size="sm">{title}</Text>} size="lg">
    <Stack gap="sm">{children}
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button color="green" loading={saving} onClick={onSubmit} style={{ backgroundColor: '#007336' }}>Save</Button>
      </Group>
    </Stack>
  </Modal>;
}
function FR({ children }) { return <Group grow align="flex-start" gap="sm">{children}</Group>; }
function FI({ label, field, fv, setFv, textarea, number, select, readonly }) {
  const val = fv[field] ?? '';
  const upd = v => setFv(p => ({ ...p, [field]: v }));
  
  // Auto-detect Type, Role, and Date fields
  const fieldLower = field.toLowerCase();
  const isTypeOrRoleField = fieldLower.includes('type') || fieldLower.includes('role');
  const isDateField = fieldLower.includes('date') || fieldLower.includes('_at');
  const getTypeRoleOptions = (fn) => {
    const opts = {
      flight_type: ['Survey', 'Inspection', 'Mapping', 'Monitoring'],
      data_type: ['RGB', 'Thermal', 'Multispectral', 'LiDAR'],
      processing_type: ['Orthomosaic', '3D Model', 'Point Cloud', 'Thermal Analysis'],
    };
    return opts[fn] || [];
  };
  const autoOpts = getTypeRoleOptions(field);
  
  const s = { input: { borderColor: readonly ? '#bbf7d0' : '#d1d5db', borderRadius: 6, height: textarea ? undefined : 36, backgroundColor: readonly ? '#f0fdf4' : undefined } };
  if (select) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <Select data={select} value={val} onChange={v => upd(v || '')} clearable styles={s} /></Box>;
  if (textarea) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <Textarea value={val} onChange={e => upd(e.target.value)} autosize minRows={2} styles={s} /></Box>;
  if (number) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <NumberInput value={val === '' ? undefined : val} onChange={v => upd(v)} styles={s} /></Box>;
  
  // Date fields with DD-MMM-YYYY format
  if (isDateField) {
    return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
      <DateInput value={val ? (typeof val === 'string' ? new Date(val) : val) : null} onChange={(date) => upd(date ? date.toISOString() : '')} valueFormat="DD-MMM-YYYY" placeholder="DD-MMM-YYYY" clearable styles={s} /></Box>;
  }
  
  // Convert Type and Role fields to dropdowns
  if (isTypeOrRoleField && autoOpts.length > 0) {
    return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
      <Select data={autoOpts} value={val || null} onChange={v => upd(v || '')} clearable searchable placeholder={`Select ${label}`} styles={s} /></Box>;
  }
  
  return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <TextInput value={val} onChange={e => upd(e.target.value)} readOnly={readonly} styles={s} /></Box>;
}
function SBadge({ v }) {
  const m = {
    completed: '#007336', pass: '#007336', active: '#007336', planned: '#1971c2', 'in progress': '#1971c2',
    pending: '#f08c00', partial: '#f08c00', fail: '#e03131', aborted: '#e03131', 'on hold': '#6b7280'
  };
  const col = m[(v || '').toLowerCase()] || '#6b7280';
  return <Badge size="sm" radius="xl" style={{ backgroundColor: col + '18', color: col, border: 'none', fontWeight: 600 }}>{v || '—'}</Badge>;
}
function BoolBadge({ v, yes = 'Yes', no = 'No' }) {
  return <Badge size="sm" color={v ? 'green' : 'gray'} variant="light">{v ? yes : no}</Badge>;
}

// ════════════════════════════════════════════════════════
export default function SIADroneGISClimateLayout() {
  const [siteId, setSiteId]         = useState(() => localStorage.getItem('sia_site_id') || '');
  const [loadedSiteId, setLoaded]   = useState(() => localStorage.getItem('sia_site_id') || '');
  const [activeTab, setTab] = useState('missions');

  // selected mission / layer / geo-source
  const [mission, setMission] = useState(null);
  const [gisLayer, setGisLayer] = useState(null);
  const [geoSource, setGeoSource] = useState(null);

  const mid = mission?.id;
  const lid = gisLayer?.id;
  const gid = geoSource?.id;

  // ── top-level site data ──────────────────────────────
  const { data: missions, loading: missL, reload: rMiss } = useApi(loadedSiteId ? `${API}/sia/sites/${loadedSiteId}/drone-missions` : null, [loadedSiteId]);
  const { data: gisLayers, loading: layL, reload: rLayer } = useApi(loadedSiteId ? `${API}/sia/sites/${loadedSiteId}/gis-layers` : null, [loadedSiteId]);
  const { data: geoSources, loading: geoL, reload: rGeo } = useApi(loadedSiteId ? `${API}/sia/sites/${loadedSiteId}/external-geo-sources` : null, [loadedSiteId]);
  const { data: climate, loading: climL, reload: rClim } = useApi(loadedSiteId ? `${API}/sia/sites/${loadedSiteId}/climate-resources` : null, [loadedSiteId]);

  // ── mission children ─────────────────────────────────
  const { data: operators, loading: opL, reload: rOp } = useApi(mid ? `${API}/sia/drone-missions/${mid}/operators` : null, [mid]);
  const { data: platforms, loading: platL, reload: rPlat } = useApi(mid ? `${API}/sia/drone-missions/${mid}/platforms` : null, [mid]);
  const { data: capPlans, loading: capL, reload: rCap } = useApi(mid ? `${API}/sia/drone-missions/${mid}/capture-plans` : null, [mid]);
  const { data: gcps, loading: gcpL, reload: rGcp } = useApi(mid ? `${API}/sia/drone-missions/${mid}/ground-control-points` : null, [mid]);
  const { data: fieldConds, loading: fcL, reload: rFc } = useApi(mid ? `${API}/sia/drone-missions/${mid}/field-conditions` : null, [mid]);
  const { data: rawData, loading: rawL, reload: rRaw } = useApi(mid ? `${API}/sia/drone-missions/${mid}/raw-data` : null, [mid]);
  const { data: qualChecks, loading: qaL, reload: rQa } = useApi(mid ? `${API}/sia/drone-missions/${mid}/quality-checks` : null, [mid]);
  const { data: derived, loading: derL, reload: rDer } = useApi(mid ? `${API}/sia/drone-missions/${mid}/derived-products` : null, [mid]);

  // ── GIS layer children ───────────────────────────────
  const { data: gisFeatures, loading: featL, reload: rFeat } = useApi(lid ? `${API}/sia/gis-layers/${lid}/features` : null, [lid]);

  // ── modal / form state ───────────────────────────────
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fv, setFv] = useState({});

  const openModal = (key, defaults = {}) => {
    const codePrefills = {
      mission:    { mission_code: autoCode('DRN') },
      gcp:        { gcp_code: autoCode('GCP') },
      gisfeature: { feature_code: autoCode('FEAT') },
    };
    const enriched = {
      site_id:         localStorage.getItem('sia_site_id') || '',
      survey_visit_id: localStorage.getItem('sia_survey_visit_id') || '',
      ...(codePrefills[key] || {}),
      ...defaults,
    };
    setFv(enriched);
    setModal(key);
  };
  const closeModal = () => { setModal(null); setFv({}); };

  const save = async (path, body, reload) => {
    setSaving(true);
    try {
      await postApi(path, body);
      notifications.show({ title: 'Saved', message: 'Record created.', color: 'green' });
      reload(); closeModal();
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const handleLoad = () => {
    const id = localStorage.getItem('sia_site_id') || siteId;
    if (!id) return;
    setSiteId(id);
    setLoaded(id);
    setMission(null); setGisLayer(null); setGeoSource(null);
    setTab('missions');
  };

  // ════════════════════════════════════════════════════
  return (
    <Box p="lg">
      {/* Header */}
      <Box mb="lg">
        <Group gap="sm" mb={4}>
          <Badge color="green" variant="light" size="lg" radius="sm">SIA</Badge>
          <Text size="xs" c="dimmed" fw={500}>Module 1 · Section 4</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">Drone, GIS and Climate</Title>
        <Text size="sm" c="#6b7280" mt={4}>
          Manage drone missions, GIS layers, external geo sources and climate resources.
        </Text>
      </Box>

      {/* Site ID loader */}
      <Paper p="sm" mb="md" style={{ border:'1px solid #e5e7eb', borderRadius:8, backgroundColor:'#f9fafb' }}>
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Text size="xs" fw={700} c="#374151">Active Site:</Text>
            {loadedSiteId
              ? <Text size="xs" fw={600} c="#007336" style={{ fontFamily:'monospace' }}>{loadedSiteId}</Text>
              : <Text size="xs" c="red">No active site — add a site in Sites and Survey first.</Text>}
          </Group>
          <Group gap="sm">
            <Button size="xs" variant="subtle" color="green" onClick={handleLoad} disabled={!loadedSiteId}>Reload</Button>
            <Button size="xs" color="green" variant="outline" disabled={!loadedSiteId}
              onClick={() => openModal('mission', { site_id: loadedSiteId, survey_visit_id: localStorage.getItem('sia_survey_visit_id') || '' })}>+ New Mission</Button>
          </Group>
        </Group>
      </Paper>

      {/* Context strip */}
      {(mission || gisLayer) && (
        <Paper p="sm" mb="md" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
          <Group gap="xl" wrap="wrap">
            {mission && <Text size="xs" c="#374151">Mission: <Text span fw={700} c="#007336">{mission.mission_code}</Text></Text>}
            {gisLayer && <Text size="xs" c="#374151">Layer: <Text span fw={700} c="#374151">{gisLayer.layer_name || gisLayer.id}</Text></Text>}
            <Text size="xs" c="#9ca3af" style={{ marginLeft: 'auto', cursor: 'pointer' }}
              onClick={() => { setMission(null); setGisLayer(null); setGeoSource(null); }}>Clear</Text>
          </Group>
        </Paper>
      )}

      {/* ── TABS ── */}
      {loadedSiteId && (
        <Tabs value={activeTab} onChange={setTab} color="green">
          <SIAStepFlow
            activeTab={activeTab}
            onStep={setTab}
            steps={[
              { value:'missions',    label:'Missions',         icon:<IconDrone size={13}/>,          enabled:true },
              { value:'operators',   label:'Operators',        icon:<IconUsers size={13}/>,          enabled:!!mission },
              { value:'platforms',   label:'Platforms',        icon:<IconDeviceGamepad2 size={13}/>, enabled:!!mission },
              { value:'capture',     label:'Capture Plan',     icon:<IconMap size={13}/>,            enabled:!!mission },
              { value:'gcps',        label:'GCPs',             icon:<IconMapPin size={13}/>,         enabled:!!mission },
              { value:'conditions',  label:'Field Conditions', icon:<IconCloudRain size={13}/>,      enabled:!!mission },
              { value:'rawdata',     label:'Raw Data',         icon:<IconDatabase size={13}/>,       enabled:!!mission },
              { value:'qa',          label:'QA Checks',        icon:<IconShieldCheck size={13}/>,    enabled:!!mission },
              { value:'derived',     label:'Derived Products', icon:<IconLayersIntersect size={13}/>,enabled:!!mission },
              { value:'gislayers',   label:'GIS Layers',       icon:<IconWorld size={13}/>,          enabled:true },
              { value:'gisfeatures', label:'GIS Features',     icon:<IconMapPin size={13}/>,         enabled:!!gisLayer },
              { value:'geosources',  label:'Geo Sources',      icon:<IconDatabase size={13}/>,       enabled:true },
              { value:'climate',     label:'Climate',          icon:<IconSun size={13}/>,            enabled:true },
            ]}
          />
          <Tabs.List style={{ display:'none' }}>
            <Tabs.Tab value="missions">Missions</Tabs.Tab>
            <Tabs.Tab value="operators">Operators</Tabs.Tab>
            <Tabs.Tab value="platforms">Platforms</Tabs.Tab>
            <Tabs.Tab value="capture">Capture Plan</Tabs.Tab>
            <Tabs.Tab value="gcps">GCPs</Tabs.Tab>
            <Tabs.Tab value="conditions">Field Conditions</Tabs.Tab>
            <Tabs.Tab value="rawdata">Raw Data</Tabs.Tab>
            <Tabs.Tab value="qa">QA Checks</Tabs.Tab>
            <Tabs.Tab value="derived">Derived Products</Tabs.Tab>
            <Tabs.Tab value="gislayers">GIS Layers</Tabs.Tab>
            <Tabs.Tab value="gisfeatures">GIS Features</Tabs.Tab>
            <Tabs.Tab value="geosources">Geo Sources</Tabs.Tab>
            <Tabs.Tab value="climate">Climate</Tabs.Tab>
          </Tabs.List>

          {/* MISSIONS */}
          <Tabs.Panel value="missions">
            <TabHeader title="Drone Missions" onAdd={() => openModal('mission', { site_id: loadedSiteId, survey_visit_id: localStorage.getItem('sia_survey_visit_id') || '' })} addLabel="Add Mission" />
            <DataTable loading={missL} cols={['Code', 'Purpose', 'Discipline', 'Planned', 'Actual', 'Status']}
              rows={missions} render={r => (
                <Table.Tr key={r.id} onClick={() => { setMission(r); setTab('operators'); }}
                  style={{ cursor: 'pointer', backgroundColor: mission?.id === r.id ? '#f0fdf4' : 'transparent' }}
                  onMouseEnter={e => { if (mission?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={e => { if (mission?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.mission_code}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.mission_purpose || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.target_discipline || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.planned_date || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.actual_date || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.mission_status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* OPERATORS */}
          <Tabs.Panel value="operators">
            <TabHeader title={`Operators — ${mission?.mission_code || ''}`} onAdd={() => openModal('operator')} addLabel="Add Operator" />
            <DataTable loading={opL} cols={['User ID', 'Competency', 'Permission Ref', 'Regulatory Ref']}
              rows={operators} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" style={{ fontFamily: 'monospace' }}>{r.user_id || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.competency_ref || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.permission_ref || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.regulatory_ref || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* PLATFORMS */}
          <Tabs.Panel value="platforms">
            <TabHeader title="Drone Platforms" onAdd={() => openModal('platform')} addLabel="Add Platform" />
            <DataTable loading={platL} cols={['Make', 'Model', 'Serial', 'Sensor', 'RTK/PPK', 'Thermal', 'Multispectral']}
              rows={platforms} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.drone_make || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.drone_model || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.serial_number || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.sensor_type || '—'}</Text></Table.Td>
                  <Table.Td><BoolBadge v={r.rtk_ppk_capable} /></Table.Td>
                  <Table.Td><BoolBadge v={r.thermal_capable} /></Table.Td>
                  <Table.Td><BoolBadge v={r.multispectral_capable} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* CAPTURE PLAN */}
          <Tabs.Panel value="capture">
            <TabHeader title="Capture Plans" onAdd={() => openModal('capture')} addLabel="Add Plan" />
            <DataTable loading={capL} cols={['CRS', 'Datum', 'GNSS Method', 'Altitude (m)', 'Front %', 'Side %', 'GSD', 'Type']}
              rows={capPlans} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.crs || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.datum || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.gnss_method || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.flight_altitude ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.front_overlap ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.side_overlap ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.target_gsd ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.capture_type || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* GCPs */}
          <Tabs.Panel value="gcps">
            <TabHeader title="Ground Control Points" onAdd={() => openModal('gcp')} addLabel="Add GCP" />
            <DataTable loading={gcpL} cols={['Code', 'Type', 'Lat', 'Lng', 'Elevation', 'Method', 'Accuracy', 'Status']}
              rows={gcps} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.gcp_code || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.point_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.latitude ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.longitude ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.elevation ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.survey_method || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.accuracy ?? '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* FIELD CONDITIONS */}
          <Tabs.Panel value="conditions">
            <TabHeader title="Field Conditions" onAdd={() => openModal('fieldcond')} addLabel="Add Condition" />
            <DataTable loading={fcL} cols={['Recorded At', 'Weather', 'Wind (m/s)', 'Temp (°C)', 'Lighting', 'Visibility', 'Rain']}
              rows={fieldConds} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="xs" c="#6b7280">{r.recorded_at || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.weather_condition || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.wind_speed ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.temperature ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.lighting_condition || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.visibility || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.rain_condition || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* RAW DATA */}
          <Tabs.Panel value="rawdata">
            <TabHeader title="Raw Data" onAdd={() => openModal('rawdata')} addLabel="Add Raw Data" />
            <DataTable loading={rawL} cols={['File Name', 'Type', 'Size (B)', 'Captured At', 'Import Status']}
              rows={rawData} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.file_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.data_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.file_size ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.captured_at || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.import_status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* QA CHECKS */}
          <Tabs.Panel value="qa">
            <TabHeader title="Quality Checks" onAdd={() => openModal('qa')} addLabel="Add QA Check" />
            <DataTable loading={qaL} cols={['Coverage', 'Gap', 'Blur', 'Exposure', 'Overlap', 'GNSS', 'QA Status', 'Checked By']}
              rows={qualChecks} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><SBadge v={r.coverage_status} /></Table.Td>
                  <Table.Td><BoolBadge v={r.gap_detected} yes="Gap" no="OK" /></Table.Td>
                  <Table.Td><SBadge v={r.blur_status} /></Table.Td>
                  <Table.Td><SBadge v={r.exposure_status} /></Table.Td>
                  <Table.Td><SBadge v={r.overlap_status} /></Table.Td>
                  <Table.Td><SBadge v={r.gnss_status} /></Table.Td>
                  <Table.Td><SBadge v={r.qa_status} /></Table.Td>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.checked_by || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* DERIVED PRODUCTS */}
          <Tabs.Panel value="derived">
            <TabHeader title="Derived Products" onAdd={() => openModal('derived')} addLabel="Add Product" />
            <DataTable loading={derL} cols={['File Name', 'Type', 'CRS', 'Resolution', 'Accuracy', 'Reliability', 'Status']}
              rows={derived} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.file_name || '—'}</Text></Table.Td>
                  <Table.Td><Badge size="sm" color="blue" variant="light">{r.product_type || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.crs || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.resolution ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.accuracy ?? '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_class} /></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* GIS LAYERS */}
          <Tabs.Panel value="gislayers">
            <TabHeader title="GIS Layers" onAdd={() => openModal('gislayer')} addLabel="Add Layer" />
            <DataTable loading={layL} cols={['Layer Name', 'Type', 'Geometry', 'CRS', 'Source', 'Reliability', 'Active']}
              rows={gisLayers} render={r => (
                <Table.Tr key={r.id} onClick={() => { setGisLayer(r); setTab('gisfeatures'); }}
                  style={{ cursor: 'pointer', backgroundColor: gisLayer?.id === r.id ? '#f0fdf4' : 'transparent' }}
                  onMouseEnter={e => { if (gisLayer?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={e => { if (gisLayer?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.layer_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.layer_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.geometry_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.crs || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.source_name || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                  <Table.Td><BoolBadge v={r.is_active} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* GIS FEATURES */}
          <Tabs.Panel value="gisfeatures">
            <TabHeader title={`GIS Features — ${gisLayer?.layer_name || ''}`} onAdd={() => openModal('gisfeature')} addLabel="Add Feature" />
            <DataTable loading={featL} cols={['Code', 'Name', 'Type', 'Reliability', 'POI ID']}
              rows={gisFeatures} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.feature_code || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.feature_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.feature_type || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                  <Table.Td><Text size="xs" c="#9ca3af" style={{ fontFamily: 'monospace' }}>{r.poi_id || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* EXTERNAL GEO SOURCES */}
          <Tabs.Panel value="geosources">
            <TabHeader title="External Geo Sources" onAdd={() => openModal('geosource')} addLabel="Add Source" />
            <DataTable loading={geoL} cols={['Provider', 'Dataset', 'Type', 'Source Ref', 'Reliability']}
              rows={geoSources} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" fw={600}>{r.provider_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.dataset_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.source_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={180}>{r.source_reference || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* CLIMATE RESOURCES */}
          <Tabs.Panel value="climate">
            <TabHeader title="Climate Resources" onAdd={() => openModal('climate')} addLabel="Add Resource" />
            <DataTable loading={climL} cols={['Type', 'Parameter', 'Value', 'Unit', 'Period From', 'Period To', 'Reliability']}
              rows={climate} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Badge size="sm" color="blue" variant="light">{r.resource_type || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{r.parameter_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" fw={600}>{r.parameter_value ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.unit || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.period_from || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.period_to || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>
        </Tabs>
      )}

      {/* ════ MODALS ════ */}

      {/* Drone Mission */}
      <FormModal opened={modal === 'mission'} onClose={closeModal} title="New Drone Mission" saving={saving}
        onSubmit={() => save('/sia/drone-missions', { site_id: loadedSiteId, ...fv }, rMiss)}>
        {!fv.survey_visit_id && (
          <Text size="xs" c="orange" mb="xs">⚠ No survey visit found. Create one in Sites and Survey first, or type the ID manually.</Text>
        )}
        <FR><FI label="Mission Code *" field="mission_code" fv={fv} setFv={setFv} /><FI label="Mission Status" field="mission_status" fv={fv} setFv={setFv} select={MISSION_STATUS} /></FR>
        <FI label="Mission Purpose" field="mission_purpose" fv={fv} setFv={setFv} />
        <FR><FI label="Target Discipline" field="target_discipline" fv={fv} setFv={setFv} /><FI label="Survey Visit ID (auto-filled)" field="survey_visit_id" fv={fv} setFv={setFv} readonly={!!fv.survey_visit_id} /></FR>
        <FR><FI label="Planned Date (YYYY-MM-DD)" field="planned_date" fv={fv} setFv={setFv} /><FI label="Actual Date (YYYY-MM-DD)" field="actual_date" fv={fv} setFv={setFv} /></FR>
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Operator */}
      <FormModal opened={modal === 'operator'} onClose={closeModal} title="Add Drone Operator" saving={saving}
        onSubmit={() => save('/sia/drone-operators', { drone_mission_id: mid, user_id: localStorage.getItem('user_id') || 'unknown', ...fv }, rOp)}>
        <FR><FI label="Competency Ref" field="competency_ref" fv={fv} setFv={setFv} /><FI label="Permission Ref" field="permission_ref" fv={fv} setFv={setFv} /></FR>
        <FI label="Regulatory Ref" field="regulatory_ref" fv={fv} setFv={setFv} />
        <FI label="Restriction Notes" field="restriction_notes" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Platform */}
      <FormModal opened={modal === 'platform'} onClose={closeModal} title="Add Drone Platform" saving={saving}
        onSubmit={() => save('/sia/drone-platforms', { drone_mission_id: mid, ...fv }, rPlat)}>
        <FR><FI label="Make" field="drone_make" fv={fv} setFv={setFv} /><FI label="Model" field="drone_model" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Serial Number" field="serial_number" fv={fv} setFv={setFv} /><FI label="Sensor Type" field="sensor_type" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Camera Model" field="camera_model" fv={fv} setFv={setFv} /><FI label="Firmware" field="firmware_version" fv={fv} setFv={setFv} /></FR>
        <Group mt="sm" gap="xl">
          {[['rtk_ppk_capable', 'RTK/PPK'], ['thermal_capable', 'Thermal'], ['multispectral_capable', 'Multispectral']].map(([f, l]) => (
            <Group key={f} gap="xs"><Text size="xs" fw={600} c="#374151">{l}</Text>
              <Switch checked={!!fv[f]} onChange={e => { const v = e.currentTarget.checked; setFv(p => ({ ...p, [f]: v })); }} color="green" /></Group>
          ))}
        </Group>
      </FormModal>

      {/* Capture Plan */}
      <FormModal opened={modal === 'capture'} onClose={closeModal} title="Add Capture Plan" saving={saving}
        onSubmit={() => save('/sia/drone-capture-plans', { drone_mission_id: mid, ...fv }, rCap)}>
        <FR><FI label="CRS" field="crs" fv={fv} setFv={setFv} /><FI label="Datum" field="datum" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Vertical Datum" field="vertical_datum" fv={fv} setFv={setFv} /><FI label="GNSS Method" field="gnss_method" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Flight Altitude (m)" field="flight_altitude" fv={fv} setFv={setFv} number /><FI label="Target GSD (cm)" field="target_gsd" fv={fv} setFv={setFv} number /></FR>
        <FR><FI label="Front Overlap (%)" field="front_overlap" fv={fv} setFv={setFv} number /><FI label="Side Overlap (%)" field="side_overlap" fv={fv} setFv={setFv} number /></FR>
        <FR><FI label="Camera Angle (°)" field="camera_angle" fv={fv} setFv={setFv} number /><FI label="Capture Type" field="capture_type" fv={fv} setFv={setFv} /></FR>
        <FI label="Boundary Notes" field="boundary_notes" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* GCP */}
      <FormModal opened={modal === 'gcp'} onClose={closeModal} title="Add Ground Control Point" saving={saving}
        onSubmit={() => save('/sia/ground-control-points', { drone_mission_id: mid, ...fv }, rGcp)}>
        <FR><FI label="GCP Code" field="gcp_code" fv={fv} setFv={setFv} /><FI label="Point Type" field="point_type" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Latitude" field="latitude" fv={fv} setFv={setFv} number /><FI label="Longitude" field="longitude" fv={fv} setFv={setFv} number /></FR>
        <FR><FI label="Elevation (m)" field="elevation" fv={fv} setFv={setFv} number /><FI label="Accuracy (m)" field="accuracy" fv={fv} setFv={setFv} number /></FR>
        <FR><FI label="Survey Method" field="survey_method" fv={fv} setFv={setFv} /><FI label="Status" field="status" fv={fv} setFv={setFv} select={['Active', 'Inactive', 'Pending']} /></FR>
      </FormModal>

      {/* Field Condition */}
      <FormModal opened={modal === 'fieldcond'} onClose={closeModal} title="Add Field Condition" saving={saving}
        onSubmit={() => save('/sia/drone-field-conditions', { drone_mission_id: mid, ...fv }, rFc)}>
        <FI label="Recorded At (datetime)" field="recorded_at" fv={fv} setFv={setFv} />
        <FR><FI label="Weather Condition" field="weather_condition" fv={fv} setFv={setFv} /><FI label="Wind Speed (m/s)" field="wind_speed" fv={fv} setFv={setFv} number /></FR>
        <FR><FI label="Temperature (°C)" field="temperature" fv={fv} setFv={setFv} number /><FI label="Lighting Condition" field="lighting_condition" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Visibility" field="visibility" fv={fv} setFv={setFv} /><FI label="Rain Condition" field="rain_condition" fv={fv} setFv={setFv} /></FR>
        <FI label="Restriction Notes" field="restriction_notes" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Raw Data */}
      <FormModal opened={modal === 'rawdata'} onClose={closeModal} title="Add Raw Data Record" saving={saving}
        onSubmit={() => save('/sia/drone-raw-data', { drone_mission_id: mid, ...fv }, rRaw)}>
        <FR><FI label="File Name" field="file_name" fv={fv} setFv={setFv} /><FI label="Data Type" field="data_type" fv={fv} setFv={setFv} /></FR>
        <FI label="File Path" field="file_path" fv={fv} setFv={setFv} />
        <FR><FI label="File Hash (SHA-256)" field="file_hash" fv={fv} setFv={setFv} /><FI label="File Size (bytes)" field="file_size" fv={fv} setFv={setFv} number /></FR>
        <FR><FI label="Captured At" field="captured_at" fv={fv} setFv={setFv} /><FI label="Import Status" field="import_status" fv={fv} setFv={setFv} select={['Pending', 'Imported', 'Failed']} /></FR>
      </FormModal>

      {/* QA Check */}
      <FormModal opened={modal === 'qa'} onClose={closeModal} title="Add QA Check" saving={saving}
        onSubmit={() => save('/sia/drone-quality-checks', { drone_mission_id: mid, checked_by: localStorage.getItem('user_id') || 'unknown', ...fv }, rQa)}>
        <FR>
          <FI label="Coverage Status" field="coverage_status" fv={fv} setFv={setFv} select={QA_STATUS} />
          <FI label="Blur Status" field="blur_status" fv={fv} setFv={setFv} select={QA_STATUS} />
        </FR>
        <FR>
          <FI label="Exposure Status" field="exposure_status" fv={fv} setFv={setFv} select={QA_STATUS} />
          <FI label="Overlap Status" field="overlap_status" fv={fv} setFv={setFv} select={QA_STATUS} />
        </FR>
        <FR>
          <FI label="GNSS Status" field="gnss_status" fv={fv} setFv={setFv} select={QA_STATUS} />
          <FI label="Control Point Status" field="control_point_status" fv={fv} setFv={setFv} select={QA_STATUS} />
        </FR>
        <FR>
          <FI label="QA Status" field="qa_status" fv={fv} setFv={setFv} select={QA_STATUS} />
          <FI label="Checked At" field="checked_at" fv={fv} setFv={setFv} />
        </FR>
        <Group mt="sm" gap="xs"><Text size="xs" fw={600} c="#374151">Gap Detected</Text>
          <Switch checked={!!fv.gap_detected} onChange={e => { const v = e.currentTarget.checked; setFv(p => ({ ...p, gap_detected: v })); }} color="red" />
        </Group>
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Derived Product */}
      <FormModal opened={modal === 'derived'} onClose={closeModal} title="Add Derived Product" saving={saving}
        onSubmit={() => save('/sia/drone-derived-products', { drone_mission_id: mid, ...fv }, rDer)}>
        <FR><FI label="File Name" field="file_name" fv={fv} setFv={setFv} /><FI label="Product Type" field="product_type" fv={fv} setFv={setFv} select={PRODUCT_TYPES} /></FR>
        <FI label="File Path" field="file_path" fv={fv} setFv={setFv} />
        <FR><FI label="CRS" field="crs" fv={fv} setFv={setFv} /><FI label="Resolution (m)" field="resolution" fv={fv} setFv={setFv} number /></FR>
        <FR><FI label="Accuracy (m)" field="accuracy" fv={fv} setFv={setFv} number /><FI label="Reliability Class" field="reliability_class" fv={fv} setFv={setFv} select={['Confirmed', 'Estimated', 'Unverified']} /></FR>
        <FR><FI label="Processing Version" field="processing_version" fv={fv} setFv={setFv} /><FI label="Status" field="status" fv={fv} setFv={setFv} select={['Draft', 'Published', 'Superseded']} /></FR>
      </FormModal>

      {/* GIS Layer */}
      <FormModal opened={modal === 'gislayer'} onClose={closeModal} title="Add GIS Layer" saving={saving}
        onSubmit={() => save('/sia/gis-layers', { site_id: loadedSiteId, ...fv }, rLayer)}>
        <FR><FI label="Layer Name" field="layer_name" fv={fv} setFv={setFv} /><FI label="Layer Type" field="layer_type" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Geometry Type" field="geometry_type" fv={fv} setFv={setFv} select={GEOM_TYPES} /><FI label="CRS" field="crs" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Source Name" field="source_name" fv={fv} setFv={setFv} /><FI label="Source Date" field="source_date" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Resolution/Scale" field="resolution_scale" fv={fv} setFv={setFv} /><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={['Confirmed', 'Estimated', 'Unverified']} /></FR>
        <FI label="Licence Info" field="licence_info" fv={fv} setFv={setFv} />
        <Group mt="sm" gap="xs"><Text size="xs" fw={600} c="#374151">Active</Text>
          <Switch checked={fv.is_active !== false} onChange={e => { const v = e.currentTarget.checked; setFv(p => ({ ...p, is_active: v })); }} color="green" />
        </Group>
      </FormModal>

      {/* GIS Feature */}
      <FormModal opened={modal === 'gisfeature'} onClose={closeModal} title="Add GIS Feature" saving={saving}
        onSubmit={() => save('/sia/gis-features', { gis_layer_id: lid, ...fv }, rFeat)}>
        <FR><FI label="Feature Code" field="feature_code" fv={fv} setFv={setFv} /><FI label="Feature Name" field="feature_name" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Feature Type" field="feature_type" fv={fv} setFv={setFv} /><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={['Confirmed', 'Estimated', 'Unverified']} /></FR>
        <FI label="POI ID (optional)" field="poi_id" fv={fv} setFv={setFv} />
        <FI label="Geometry Data (GeoJSON/WKT)" field="geometry_data" fv={fv} setFv={setFv} textarea />
        <FI label="Description" field="description" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* External Geo Source */}
      <FormModal opened={modal === 'geosource'} onClose={closeModal} title="Add External Geo Source" saving={saving}
        onSubmit={() => save('/sia/external-geo-sources', { site_id: loadedSiteId, ...fv }, rGeo)}>
        <FR><FI label="Provider Name" field="provider_name" fv={fv} setFv={setFv} /><FI label="Dataset Name" field="dataset_name" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Source Type" field="source_type" fv={fv} setFv={setFv} /><FI label="Source Reference" field="source_reference" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Imported At" field="imported_at" fv={fv} setFv={setFv} /><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={['Confirmed', 'Estimated', 'Unverified']} /></FR>
        <FI label="Licence Info" field="licence_info" fv={fv} setFv={setFv} />
        <FI label="Limitation Notes" field="limitation_notes" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Climate Resource */}
      <FormModal opened={modal === 'climate'} onClose={closeModal} title="Add Climate Resource" saving={saving}
        onSubmit={() => save('/sia/climate-resources', { site_id: loadedSiteId, ...fv }, rClim)}>
        <FR><FI label="Resource Type" field="resource_type" fv={fv} setFv={setFv} select={CLIMATE_TYPES} /><FI label="Parameter Name" field="parameter_name" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Parameter Value" field="parameter_value" fv={fv} setFv={setFv} number /><FI label="Unit" field="unit" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Period From (YYYY-MM-DD)" field="period_from" fv={fv} setFv={setFv} /><FI label="Period To (YYYY-MM-DD)" field="period_to" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Source Name" field="source_name" fv={fv} setFv={setFv} /><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={['Confirmed', 'Estimated', 'Unverified']} /></FR>
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>
    </Box>
  );
}
