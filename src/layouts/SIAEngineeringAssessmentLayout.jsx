import React, { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader, Modal,
  Paper, Select, Stack, Tabs, Table, Text, Textarea,
  TextInput, Title, NumberInput, Switch,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconBolt, IconBuildingBridge, IconBuildingSkyscraper,
  IconEngine, IconDroplet, IconRadar, IconShield,
  IconBuildingFactory2, IconAlertTriangle, IconAlertCircle, IconUserCheck,
} from '@tabler/icons-react';
import SIAStepFlow from '../components/common/SIAStepFlow';

const API = 'http://127.0.0.1:8001/api';
const thS = { fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' };

const DISCIPLINES = ['Electrical', 'Civil', 'Structural', 'Mechanical', 'Water Pumping', 'SCADA', 'HSE/Environment', 'Industrial'];
const STATUS_OPTS = ['Draft', 'In Progress', 'Completed', 'Verified', 'Rejected'];
const RELIABILITY = ['Confirmed', 'Estimated', 'Unverified', 'Not Assessed'];

// ── tiny hooks ───────────────────────────────────────────
function useApi(url, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const urlRef = React.useRef(url);
  urlRef.current = url;
  const reload = React.useCallback(() => {
    if (!urlRef.current) return;
    setLoading(true);
    fetch(urlRef.current).then(r => r.json()).then(d => setData(Array.isArray(d) ? d : [])).catch(() => { }).finally(() => setLoading(false));
  }, []); // eslint-disable-line
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

// ── reusable sub-components ──────────────────────────────
function EmptyRow({ cols }) {
  return <Table.Tr><Table.Td colSpan={cols} style={{ textAlign: 'center', padding: '30px 0' }}><Text size="sm" c="dimmed">No records found.</Text></Table.Td></Table.Tr>;
}
function DataTable({ loading, cols, rows, render }) {
  return (
    <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 8, position: 'relative', minHeight: 120 }}>
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
  return (
    <Group justify="space-between" mb="sm">
      <Text fw={600} size="sm" c="#374151">{title}</Text>
      <Button size="xs" color="green" leftSection={<IconPlus size={13} />} disabled={disabled}
        onClick={onAdd} style={{ backgroundColor: disabled ? undefined : '#007336' }}>{addLabel}</Button>
    </Group>
  );
}
function FormModal({ opened, onClose, title, saving, onSubmit, children }) {
  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700} size="sm">{title}</Text>} size="lg">
      <Stack gap="sm">
        {children}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="green" loading={saving} onClick={onSubmit} style={{ backgroundColor: '#007336' }}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
function FormRow({ children }) { return <Group grow align="flex-start" gap="sm">{children}</Group>; }
function FI({ label, field, fv, setFv, textarea, number, select, readonly }) {
  const val = fv[field] ?? '';
  const onChange = v => setFv(p => ({ ...p, [field]: v }));
  const s = { input: { borderColor: readonly ? '#bbf7d0' : '#d1d5db', borderRadius: 6, height: textarea ? undefined : 36, backgroundColor: readonly ? '#f0fdf4' : undefined } };
  if (select) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text><Select data={select} value={val} onChange={v => onChange(v || '')} clearable styles={s} /></Box>;
  if (textarea) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text><Textarea value={val} onChange={e => onChange(e.target.value)} autosize minRows={2} styles={s} /></Box>;
  if (number) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text><NumberInput value={val === '' ? undefined : val} onChange={v => onChange(v)} styles={s} /></Box>;
  return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text><TextInput value={val} onChange={e => onChange(e.target.value)} readOnly={readonly} styles={s} /></Box>;
}
function SBadge({ v }) {
  const m = { completed: '#007336', verified: '#007336', confirmed: '#007336', draft: '#6b7280', 'in progress': '#1971c2', rejected: '#e03131', unverified: '#f08c00', estimated: '#f08c00', 'not assessed': '#6b7280' };
  const col = m[(v || '').toLowerCase()] || '#6b7280';
  return <Badge size="sm" radius="xl" style={{ backgroundColor: col + '18', color: col, border: 'none', fontWeight: 600 }}>{v || '—'}</Badge>;
}

// ════════════════════════════════════════════════════════
export default function SIAEngineeringAssessmentLayout() {
  // ── EA lookup ─────────────────────────────────────────
  const [eaId, setEaId] = useState('');
  const [caseId, setCaseId] = useState(() => localStorage.getItem('sia_case_id') || '');
  const [loadedCaseId, setLoaded] = useState(() => localStorage.getItem('sia_case_id') || '');
  const [eaList, setEaList] = useState([]);
  const [eaLoading, setEaL] = useState(false);
  const [selectedEa, setEa] = useState(null);
  const [activeTab, setTab] = useState('overview');
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fv, setFv] = useState({});

  const loadByCaseId = (id) => {
    const cid = id || localStorage.getItem('sia_case_id') || '';
    if (!cid) return;
    setCaseId(cid);
    setEaL(true);
    fetch(`${API}/sia/cases/${cid}/engineering-assessments`)
      .then(r => r.json()).then(d => setEaList(Array.isArray(d) ? d : [])).catch(() => { }).finally(() => setEaL(false));
  };

  // Auto-load on mount if case ID is already in storage
  useEffect(() => {
    const id = localStorage.getItem('sia_case_id');
    if (id) loadByCaseId(id);
  }, []); // eslint-disable-line

  // ── child data ────────────────────────────────────────
  const eid = selectedEa?.id;
  const { data: electrical, loading: elecL, reload: rElec } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/electrical` : null, [eid]);
  const { data: civil, loading: civL, reload: rCivil } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/civil` : null, [eid]);
  const { data: structural, loading: strL, reload: rStruct } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/structural` : null, [eid]);
  const { data: mechanical, loading: mechL, reload: rMech } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/mechanical` : null, [eid]);
  const { data: water, loading: watL, reload: rWater } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/water-pumping` : null, [eid]);
  const { data: scada, loading: scaL, reload: rScada } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/scada` : null, [eid]);
  const { data: hse, loading: hseL, reload: rHse } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/hse` : null, [eid]);
  const { data: industrial, loading: indL, reload: rInd } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/industrial` : null, [eid]);
  const { data: findings, loading: findL, reload: rFind } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/findings` : null, [eid]);
  const { data: gaps, loading: gapL, reload: rGap } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/gaps` : null, [eid]);
  const { data: reviews, loading: revL, reload: rRev } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/reviews` : null, [eid]);

  const openModal = (key, defaults = {}) => { setFv(defaults); setModal(key); };
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

  return (
    <Box p="lg">
      {/* Header */}
      <Box mb="lg">
        <Group gap="sm" mb={4}>
          <Badge color="green" variant="light" size="lg" radius="sm">SIA</Badge>
          <Text size="xs" c="dimmed" fw={500}>Module 1 · Section 3</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">Engineering Assessment</Title>
        <Text size="sm" c="#6b7280" mt={4}>Manage discipline assessments, findings, gaps and reviews.</Text>
      </Box>

      {/* Case ID loader */}
      <Paper p="sm" mb="md" style={{ border:'1px solid #e5e7eb', borderRadius:8, backgroundColor:'#f9fafb' }}>
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Text size="xs" fw={700} c="#374151">Active SIA Case:</Text>
            {caseId
              ? <Text size="xs" fw={600} c="#007336" style={{ fontFamily:'monospace' }}>{caseId}</Text>
              : <Text size="xs" c="red">No active case — create one in Start and Case Control first.</Text>}
          </Group>
          <Group gap="sm">
            <Button size="xs" variant="subtle" color="green" onClick={loadByCaseId} disabled={!caseId}>Reload</Button>
            <Button size="xs" color="green" variant="outline" disabled={!caseId}
              onClick={() => openModal('ea', { sia_case_id: caseId, site_id: localStorage.getItem('sia_site_id') || '' })}>+ New Assessment</Button>
          </Group>
        </Group>
      </Paper>

      {/* EA list */}
      {eaList.length > 0 && (
        <Paper p="md" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Text size="xs" fw={700} c="#374151" mb={8}>Select Assessment</Text>
          {eaLoading ? <Loader size="sm" color="green" /> : (
            <Table verticalSpacing="xs" horizontalSpacing="md">
              <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
                <Table.Tr>
                  <Table.Th style={thS}>Code</Table.Th><Table.Th style={thS}>Discipline</Table.Th>
                  <Table.Th style={thS}>Status</Table.Th><Table.Th style={thS}>Reliability</Table.Th>
                  <Table.Th style={thS}>Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {eaList.map(ea => {
                  const isSel = selectedEa?.id === ea.id;
                  return (
                    <Table.Tr key={ea.id} onClick={() => { setEa(ea); setTab('electrical'); }}
                      style={{
                        cursor: 'pointer', backgroundColor: isSel ? '#f0fdf4' : 'transparent',
                        outline: isSel ? '2px solid #007336' : 'none', outlineOffset: '-2px'
                      }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <Table.Td><Text size="sm" fw={600} c="#007336">{ea.assessment_code}</Text></Table.Td>
                      <Table.Td><Text size="sm">{ea.discipline}</Text></Table.Td>
                      <Table.Td><SBadge v={ea.status} /></Table.Td>
                      <Table.Td><SBadge v={ea.reliability_status} /></Table.Td>
                      <Table.Td><Text size="xs" c="#6b7280">{ea.assessment_date || '—'}</Text></Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      )}

      {/* Selected EA context strip */}
      {selectedEa && (
        <Paper p="sm" mb="md" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
          <Group gap="xl" wrap="wrap">
            <Text size="xs" c="#374151">Assessment: <Text span fw={700} c="#007336">{selectedEa.assessment_code}</Text></Text>
            <Text size="xs" c="#374151">Discipline: <Text span fw={600}>{selectedEa.discipline}</Text></Text>
            <Text size="xs" c="#374151">Status: <Text span fw={600}>{selectedEa.status || '—'}</Text></Text>
            <Text size="xs" c="#9ca3af" style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={() => setEa(null)}>Clear</Text>
          </Group>
        </Paper>
      )}

      {/* Tabs — only when an EA is selected */}
      {selectedEa && (
        <Tabs value={activeTab} onChange={setTab} color="green">
          <SIAStepFlow
            activeTab={activeTab}
            onStep={setTab}
            steps={[
              { value:'electrical',  label:'Electrical',     icon:<IconBolt size={13}/>,              enabled:true },
              { value:'civil',       label:'Civil',          icon:<IconBuildingBridge size={13}/>,    enabled:true },
              { value:'structural',  label:'Structural',     icon:<IconBuildingSkyscraper size={13}/>,enabled:true },
              { value:'mechanical',  label:'Mechanical',     icon:<IconEngine size={13}/>,            enabled:true },
              { value:'water',       label:'Water Pumping',  icon:<IconDroplet size={13}/>,           enabled:true },
              { value:'scada',       label:'SCADA',          icon:<IconRadar size={13}/>,             enabled:true },
              { value:'hse',         label:'HSE / Env',      icon:<IconShield size={13}/>,            enabled:true },
              { value:'industrial',  label:'Industrial',     icon:<IconBuildingFactory2 size={13}/>,  enabled:true },
              { value:'findings',    label:'Findings',       icon:<IconAlertTriangle size={13}/>,     enabled:true },
              { value:'gaps',        label:'Gaps',           icon:<IconAlertCircle size={13}/>,       enabled:true },
              { value:'reviews',     label:'Reviews',        icon:<IconUserCheck size={13}/>,         enabled:true },
            ]}
          />
          <Tabs.List style={{ display:'none' }}>
            <Tabs.Tab value="electrical">Electrical</Tabs.Tab>
            <Tabs.Tab value="civil">Civil</Tabs.Tab>
            <Tabs.Tab value="structural">Structural</Tabs.Tab>
            <Tabs.Tab value="mechanical">Mechanical</Tabs.Tab>
            <Tabs.Tab value="water">Water Pumping</Tabs.Tab>
            <Tabs.Tab value="scada">SCADA</Tabs.Tab>
            <Tabs.Tab value="hse">HSE / Env</Tabs.Tab>
            <Tabs.Tab value="industrial">Industrial</Tabs.Tab>
            <Tabs.Tab value="findings">Findings</Tabs.Tab>
            <Tabs.Tab value="gaps">Gaps</Tabs.Tab>
            <Tabs.Tab value="reviews">Reviews</Tabs.Tab>
          </Tabs.List>

          {/* ELECTRICAL */}
          <Tabs.Panel value="electrical">
            <TabHeader title="Electrical Assessment" onAdd={() => openModal('elec')} addLabel="Add" />
            <DataTable loading={elecL} cols={['Supply', 'Voltage', 'Phase', 'Freq', 'Connected kW', 'Peak kW', 'Utility Cond.']}
              rows={electrical} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.supply_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.voltage ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.phase || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.frequency ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.connected_load ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.peak_load ?? '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.utility_condition} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* CIVIL */}
          <Tabs.Panel value="civil">
            <TabHeader title="Civil Assessment" onAdd={() => openModal('civil')} addLabel="Add" />
            <DataTable loading={civL} cols={['Ground', 'Foundation', 'Drainage', 'Road', 'Erosion Risk', 'Flood Risk']}
              rows={civil} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.ground_condition || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.foundation_condition || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.drainage_condition || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.road_condition || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.erosion_risk} /></Table.Td>
                  <Table.Td><SBadge v={r.flood_risk} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* STRUCTURAL */}
          <Tabs.Panel value="structural">
            <TabHeader title="Structural Assessment" onAdd={() => openModal('structural')} addLabel="Add" />
            <DataTable loading={strL} cols={['Structure', 'Roof Type', 'Material', 'Struct. Condition', 'Roof Condition', 'Support']}
              rows={structural} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.structure_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.roof_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.material_type || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.structural_condition} /></Table.Td>
                  <Table.Td><SBadge v={r.roof_condition} /></Table.Td>
                  <Table.Td><SBadge v={r.support_condition} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* MECHANICAL */}
          <Tabs.Panel value="mechanical">
            <TabHeader title="Mechanical Assessment" onAdd={() => openModal('mechanical')} addLabel="Add" />
            <DataTable loading={mechL} cols={['Equip. Zone', 'Plant', 'Ventilation', 'Lifting', 'Maintenance', 'Pipework']}
              rows={mechanical} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.equipment_zone || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.plant_condition} /></Table.Td>
                  <Table.Td><SBadge v={r.ventilation_condition} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.lifting_access || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.maintenance_access || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.pipework_condition} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* WATER PUMPING */}
          <Tabs.Panel value="water">
            <TabHeader title="Water Pumping Assessment" onAdd={() => openModal('water')} addLabel="Add" />
            <DataTable loading={watL} cols={['Source', 'Daily Demand', 'Pipe Material', 'Pump Model', 'Pump kW', 'Tank Cap.', 'Monitoring']}
              rows={water} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.water_source_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.daily_water_demand ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.pipe_material || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.pump_make_model || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.pump_power_kw ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.tank_capacity ?? '—'}</Text></Table.Td>
                  <Table.Td><Badge size="sm" color={r.monitoring_available ? 'green' : 'gray'} variant="light">{r.monitoring_available ? 'Yes' : 'No'}</Badge></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* SCADA */}
          <Tabs.Panel value="scada">
            <TabHeader title="SCADA / Communication Assessment" onAdd={() => openModal('scada')} addLabel="Add" />
            <DataTable loading={scaL} cols={['Control System', 'SCADA', 'Comm. Type', 'Network', 'Telemetry', 'Remote Mon.', 'Connectivity']}
              rows={scada} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.control_system_type || '—'}</Text></Table.Td>
                  <Table.Td><Badge size="sm" color={r.scada_available ? 'green' : 'gray'} variant="light">{r.scada_available ? 'Yes' : 'No'}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.communication_type || '—'}</Text></Table.Td>
                  <Table.Td><Badge size="sm" color={r.network_available ? 'green' : 'gray'} variant="light">{r.network_available ? 'Yes' : 'No'}</Badge></Table.Td>
                  <Table.Td><Badge size="sm" color={r.telemetry_available ? 'green' : 'gray'} variant="light">{r.telemetry_available ? 'Yes' : 'No'}</Badge></Table.Td>
                  <Table.Td><Badge size="sm" color={r.remote_monitoring ? 'green' : 'gray'} variant="light">{r.remote_monitoring ? 'Yes' : 'No'}</Badge></Table.Td>
                  <Table.Td><SBadge v={r.connectivity_condition} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* HSE */}
          <Tabs.Panel value="hse">
            <TabHeader title="HSE / Environment Assessment" onAdd={() => openModal('hse')} addLabel="Add" />
            <DataTable loading={hseL} cols={['Hazard Level', 'Fire Risk', 'Elec. Safety', 'Roof Safety', 'Restricted', 'Emergency Access']}
              rows={hse} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><SBadge v={r.hazard_level} /></Table.Td>
                  <Table.Td><SBadge v={r.fire_risk} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.electrical_safety || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.roof_safety || '—'}</Text></Table.Td>
                  <Table.Td><Badge size="sm" color={r.restricted_area ? 'red' : 'green'} variant="light">{r.restricted_area ? 'Yes' : 'No'}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.emergency_access || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* INDUSTRIAL */}
          <Tabs.Panel value="industrial">
            <TabHeader title="Industrial Assessment" onAdd={() => openModal('industrial')} addLabel="Add" />
            <DataTable loading={indL} cols={['Equipment', 'Process', 'Op. Hours', 'Duty Cycle', 'Criticality', 'Throughput']}
              rows={industrial} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.equipment_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.process_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.operating_hours ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.duty_cycle ?? '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.criticality} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.throughput || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* FINDINGS */}
          <Tabs.Panel value="findings">
            <TabHeader title="Engineering Findings" onAdd={() => openModal('finding')} addLabel="Add Finding" />
            <DataTable loading={findL} cols={['Code', 'Type', 'Severity', 'Reliability', 'Status', 'Description']}
              rows={findings} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.finding_code || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.finding_type || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.severity} /></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={200}>{r.description || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* GAPS */}
          <Tabs.Panel value="gaps">
            <TabHeader title="Engineering Gaps" onAdd={() => openModal('gap')} addLabel="Add Gap" />
            <DataTable loading={gapL} cols={['Code', 'Type', 'Priority', 'Status', 'Target Date', 'Description']}
              rows={gaps} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.gap_code || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.gap_type || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.priority} /></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.target_date || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={200}>{r.description || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* REVIEWS */}
          <Tabs.Panel value="reviews">
            <TabHeader title="Engineering Reviews" onAdd={() => openModal('review')} addLabel="Add Review" />
            <DataTable loading={revL} cols={['Reviewer', 'Review Status', 'Verification', 'Reviewed At']}
              rows={reviews} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" style={{ fontFamily: 'monospace' }}>{r.reviewer_user_id || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.review_status} /></Table.Td>
                  <Table.Td><SBadge v={r.verification_status} /></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>
        </Tabs>
      )}

      {/* ════ MODALS ════ */}

      {/* New Engineering Assessment */}
      <FormModal opened={modal === 'ea'} onClose={closeModal} title="New Engineering Assessment" saving={saving}
        onSubmit={() => save('/sia/engineering-assessments', { ...fv, sia_case_id: caseId }, () => loadByCaseId())}>
        <FormRow>
          <FI label="Assessment Code *" field="assessment_code" fv={fv} setFv={setFv} />
          <FI label="Discipline *" field="discipline" fv={fv} setFv={setFv} select={DISCIPLINES} />
        </FormRow>
        <FormRow>
          <FI label="Site ID (auto-filled from active site)" field="site_id" fv={fv} setFv={setFv} readonly={!!localStorage.getItem('sia_site_id')} />
          <FI label="Assessment Date" field="assessment_date" fv={fv} setFv={setFv} />
        </FormRow>
        <FormRow>
          <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} />
          <FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY} />
        </FormRow>
        <FI label="Summary" field="summary" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Electrical */}
      <FormModal opened={modal === 'elec'} onClose={closeModal} title="Electrical Assessment" saving={saving}
        onSubmit={() => save('/sia/electrical-assessments', { engineering_assessment_id: eid, ...fv }, rElec)}>
        <FormRow><FI label="Supply Type" field="supply_type" fv={fv} setFv={setFv} /><FI label="Voltage" field="voltage" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Phase" field="phase" fv={fv} setFv={setFv} /><FI label="Frequency" field="frequency" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Connected Load (kW)" field="connected_load" fv={fv} setFv={setFv} number /><FI label="Peak Load (kW)" field="peak_load" fv={fv} setFv={setFv} number /></FormRow>
        <FI label="Utility Condition" field="utility_condition" fv={fv} setFv={setFv} />
        <FI label="Transformer Details" field="transformer_details" fv={fv} setFv={setFv} textarea />
        <FI label="Switchboard Details" field="switchboard_details" fv={fv} setFv={setFv} textarea />
        <FI label="Protection Details" field="protection_details" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Civil */}
      <FormModal opened={modal === 'civil'} onClose={closeModal} title="Civil Assessment" saving={saving}
        onSubmit={() => save('/sia/civil-assessments', { engineering_assessment_id: eid, ...fv }, rCivil)}>
        <FormRow><FI label="Ground Condition" field="ground_condition" fv={fv} setFv={setFv} /><FI label="Foundation Condition" field="foundation_condition" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Drainage Condition" field="drainage_condition" fv={fv} setFv={setFv} /><FI label="Road Condition" field="road_condition" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Erosion Risk" field="erosion_risk" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} /><FI label="Flood Risk" field="flood_risk" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} /></FormRow>
        <FI label="Trench Requirement" field="trench_requirement" fv={fv} setFv={setFv} textarea />
        <FI label="Route Constraint" field="route_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Structural */}
      <FormModal opened={modal === 'structural'} onClose={closeModal} title="Structural Assessment" saving={saving}
        onSubmit={() => save('/sia/structural-assessments', { engineering_assessment_id: eid, ...fv }, rStruct)}>
        <FormRow><FI label="Structure Type" field="structure_type" fv={fv} setFv={setFv} /><FI label="Roof Type" field="roof_type" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Material Type" field="material_type" fv={fv} setFv={setFv} /><FI label="Structural Condition" field="structural_condition" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Roof Condition" field="roof_condition" fv={fv} setFv={setFv} /><FI label="Support Condition" field="support_condition" fv={fv} setFv={setFv} /></FormRow>
        <FI label="Visible Damage" field="visible_damage" fv={fv} setFv={setFv} textarea />
        <FI label="Loading Constraint" field="loading_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Mechanical */}
      <FormModal opened={modal === 'mechanical'} onClose={closeModal} title="Mechanical Assessment" saving={saving}
        onSubmit={() => save('/sia/mechanical-assessments', { engineering_assessment_id: eid, ...fv }, rMech)}>
        <FormRow><FI label="Equipment Zone" field="equipment_zone" fv={fv} setFv={setFv} /><FI label="Plant Condition" field="plant_condition" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Ventilation Condition" field="ventilation_condition" fv={fv} setFv={setFv} /><FI label="Lifting Access" field="lifting_access" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Maintenance Access" field="maintenance_access" fv={fv} setFv={setFv} /><FI label="Pipework Condition" field="pipework_condition" fv={fv} setFv={setFv} /></FormRow>
        <FI label="Route Constraint" field="route_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Operational Constraint" field="operational_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Water Pumping */}
      <FormModal opened={modal === 'water'} onClose={closeModal} title="Water Pumping Assessment" saving={saving}
        onSubmit={() => save('/sia/water-pumping-assessments', { engineering_assessment_id: eid, ...fv }, rWater)}>
        <FormRow><FI label="Water Source Type" field="water_source_type" fv={fv} setFv={setFv} /><FI label="Daily Water Demand (m³)" field="daily_water_demand" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Source Water Level (m)" field="source_water_level" fv={fv} setFv={setFv} number /><FI label="Delivery Elevation (m)" field="delivery_elevation" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Route Length (m)" field="route_length" fv={fv} setFv={setFv} number /><FI label="Pipe Diameter (mm)" field="pipe_diameter" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Pipe Material" field="pipe_material" fv={fv} setFv={setFv} /><FI label="Pump Make/Model" field="pump_make_model" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Pump Power (kW)" field="pump_power_kw" fv={fv} setFv={setFv} number /><FI label="Pump Condition" field="pump_condition" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Tank Capacity (L)" field="tank_capacity" fv={fv} setFv={setFv} number /><FI label="Required Pressure (bar)" field="required_pressure" fv={fv} setFv={setFv} number /></FormRow>
        <FI label="Controller Type" field="controller_type" fv={fv} setFv={setFv} />
        <Group mt="sm"><Text size="xs" fw={600} c="#374151">Monitoring Available</Text><Switch checked={!!fv.monitoring_available} onChange={(e) => { const v = e.currentTarget.checked; setFv(p => ({ ...p, monitoring_available: v })); }} color="green" /></Group>
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* SCADA */}
      <FormModal opened={modal === 'scada'} onClose={closeModal} title="SCADA / Communication Assessment" saving={saving}
        onSubmit={() => save('/sia/scada-assessments', { engineering_assessment_id: eid, ...fv }, rScada)}>
        <FormRow><FI label="Control System Type" field="control_system_type" fv={fv} setFv={setFv} /><FI label="Communication Type" field="communication_type" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Protocol Details" field="protocol_details" fv={fv} setFv={setFv} /><FI label="Connectivity Condition" field="connectivity_condition" fv={fv} setFv={setFv} /></FormRow>
        <FI label="Sensor Details" field="sensor_details" fv={fv} setFv={setFv} textarea />
        <Group mt="sm" gap="xl">
          {[['scada_available', 'SCADA Available'], ['network_available', 'Network'], ['telemetry_available', 'Telemetry'], ['remote_monitoring', 'Remote Monitoring']].map(([f, l]) => (
            <Group key={f} gap="xs"><Text size="xs" fw={600} c="#374151">{l}</Text><Switch checked={!!fv[f]} onChange={(e) => { const v = e.currentTarget.checked; setFv(p => ({ ...p, [f]: v })); }} color="green" /></Group>
          ))}
        </Group>
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* HSE */}
      <FormModal opened={modal === 'hse'} onClose={closeModal} title="HSE / Environment Assessment" saving={saving}
        onSubmit={() => save('/sia/hse-assessments', { engineering_assessment_id: eid, ...fv }, rHse)}>
        <FormRow>
          <FI label="Hazard Level" field="hazard_level" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} />
          <FI label="Fire Risk" field="fire_risk" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} />
        </FormRow>
        <FormRow><FI label="Emergency Access" field="emergency_access" fv={fv} setFv={setFv} /><FI label="Electrical Safety" field="electrical_safety" fv={fv} setFv={setFv} /></FormRow>
        <FI label="Roof Safety" field="roof_safety" fv={fv} setFv={setFv} />
        <FI label="Environmental Condition" field="environmental_condition" fv={fv} setFv={setFv} textarea />
        <FI label="Environmental Constraint" field="environmental_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="HSE Constraint" field="hse_constraint" fv={fv} setFv={setFv} textarea />
        <Group mt="sm"><Text size="xs" fw={600} c="#374151">Restricted Area</Text><Switch checked={!!fv.restricted_area} onChange={(e) => { const v = e.currentTarget.checked; setFv(p => ({ ...p, restricted_area: v })); }} color="red" /></Group>
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Industrial */}
      <FormModal opened={modal === 'industrial'} onClose={closeModal} title="Industrial Assessment" saving={saving}
        onSubmit={() => save('/sia/industrial-assessments', { engineering_assessment_id: eid, ...fv }, rInd)}>
        <FormRow><FI label="Equipment Name" field="equipment_name" fv={fv} setFv={setFv} /><FI label="Process Type" field="process_type" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Operating Hours" field="operating_hours" fv={fv} setFv={setFv} number /><FI label="Duty Cycle (%)" field="duty_cycle" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Start Frequency" field="start_frequency" fv={fv} setFv={setFv} /><FI label="Diversity Factor" field="diversity_factor" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Throughput" field="throughput" fv={fv} setFv={setFv} /><FI label="Criticality" field="criticality" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} /></FormRow>
        <FI label="Operating Parameters" field="operating_parameters" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Finding */}
      <FormModal opened={modal === 'finding'} onClose={closeModal} title="Engineering Finding" saving={saving}
        onSubmit={() => save('/sia/engineering-findings', { engineering_assessment_id: eid, ...fv }, rFind)}>
        <FormRow><FI label="Finding Code" field="finding_code" fv={fv} setFv={setFv} /><FI label="Finding Type" field="finding_type" fv={fv} setFv={setFv} /></FormRow>
        <FormRow>
          <FI label="Severity" field="severity" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} />
          <FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY} />
        </FormRow>
        <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} />
        <FI label="Description" field="description" fv={fv} setFv={setFv} textarea />
        <FI label="Constraint" field="constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Recommendation" field="recommendation" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Gap */}
      <FormModal opened={modal === 'gap'} onClose={closeModal} title="Engineering Gap" saving={saving}
        onSubmit={() => save('/sia/engineering-gaps', { engineering_assessment_id: eid, ...fv }, rGap)}>
        <FormRow><FI label="Gap Code" field="gap_code" fv={fv} setFv={setFv} /><FI label="Gap Type" field="gap_type" fv={fv} setFv={setFv} /></FormRow>
        <FormRow>
          <FI label="Priority" field="priority" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} />
          <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} />
        </FormRow>
        <FI label="Target Date (YYYY-MM-DD)" field="target_date" fv={fv} setFv={setFv} />
        <FI label="Description" field="description" fv={fv} setFv={setFv} textarea />
        <FI label="Impact" field="impact" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Review */}
      <FormModal opened={modal === 'review'} onClose={closeModal} title="Engineering Review" saving={saving}
        onSubmit={() => save('/sia/engineering-reviews', { engineering_assessment_id: eid, reviewer_user_id: localStorage.getItem('user_id') || 'unknown', ...fv }, rRev)}>
        <FormRow>
          <FI label="Review Status" field="review_status" fv={fv} setFv={setFv} select={['Pending', 'In Progress', 'Approved', 'Rejected']} />
          <FI label="Verification Status" field="verification_status" fv={fv} setFv={setFv} select={['Unverified', 'Partially Verified', 'Verified']} />
        </FormRow>
        <FI label="Review Comment" field="review_comment" fv={fv} setFv={setFv} textarea />
      </FormModal>
    </Box>
  );
}
