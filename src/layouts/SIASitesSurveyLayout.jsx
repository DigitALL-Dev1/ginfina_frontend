import { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader, Modal,
  Paper, Select, Stack, Tabs, Table, Text, Textarea,
  TextInput, Title, NumberInput, Switch,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconMapPin, IconBuilding, IconDoor,
  IconLocation, IconCalendar, IconUsers, IconLock,
  IconShield, IconClipboard, IconTool,
} from '@tabler/icons-react';

const API = 'http://127.0.0.1:8001/api';

// ── shared helpers ───────────────────────────────────────
const thS = { fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' };

function EmptyRow({ cols, msg = 'No records found.' }) {
  return (
    <Table.Tr>
      <Table.Td colSpan={cols} style={{ textAlign: 'center', padding: '32px 0' }}>
        <Text size="sm" c="dimmed">{msg}</Text>
      </Table.Td>
    </Table.Tr>
  );
}

function useApi(url, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const reload = () => {
    if (!url) return;
    setLoading(true);
    fetch(url).then(r => r.json()).then(d => setData(Array.isArray(d) ? d : [])).catch(() => { }).finally(() => setLoading(false));
  };
  useEffect(() => { reload(); }, deps);  // eslint-disable-line
  return { data, loading, reload };
}

async function postApi(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || `HTTP ${res.status}`); }
  return res.json();
}

// ════════════════════════════════════════════════════════
export default function SIASitesSurveyLayout() {
  // ── case selector ────────────────────────────────────
  const [cases, setCases] = useState([]);
  const [selectedCase, setCase] = useState(null);
  const [casesLoading, setCasesL] = useState(true);

  useEffect(() => {
    fetch(`${API}/sia/assessment-packs`) // use a real list — load cases via assessment-packs as proxy
      .catch(() => { });
    // Load cases list — we reuse projects to get case list from sia_case via assessment packs listing
    // Actually load sia cases by fetching all assessment packs; cases need project context.
    // For now we call GET /api/projects to let user pick project → then load cases
    fetch(`${API}/projects`).then(r => r.json()).then(d => setCases(Array.isArray(d) ? d : [])).catch(() => { }).finally(() => setCasesL(false));
  }, []);

  // ── site state ───────────────────────────────────────
  const [selectedSite, setSite] = useState(null);
  const [activeTab, setTab] = useState('sites');

  // ── Sites ────────────────────────────────────────────
  const [siaCase, setSiaCase] = useState(null);
  // Read case ID from localStorage — set by Start and Case Control
  const [siaCaseId, setSiaCaseId] = useState(() => localStorage.getItem('sia_case_id') || '');

  const { data: sites, loading: sitesL, reload: reloadSites } = useApi(
    siaCaseId ? `${API}/sia/cases/${siaCaseId}/sites` : null, [siaCaseId]
  );

  // ── Buildings ────────────────────────────────────────
  const { data: buildings, loading: buildingsL, reload: reloadBuildings } = useApi(
    selectedSite ? `${API}/sia/sites/${selectedSite.id}/buildings` : null, [selectedSite]
  );

  // ── Room Areas ───────────────────────────────────────
  const [selectedBuilding, setBuilding] = useState(null);
  const { data: roomAreas, loading: roomsL, reload: reloadRooms } = useApi(
    selectedBuilding ? `${API}/sia/buildings/${selectedBuilding.id}/room-areas` : null, [selectedBuilding]
  );

  // ── POIs ─────────────────────────────────────────────
  const { data: pois, loading: poisL, reload: reloadPois } = useApi(
    selectedSite ? `${API}/sia/sites/${selectedSite.id}/pois` : null, [selectedSite]
  );

  // ── Survey Visits ────────────────────────────────────
  const [selectedVisit, setVisit] = useState(null);
  const { data: visits, loading: visitsL, reload: reloadVisits } = useApi(
    selectedSite ? `${API}/sia/sites/${selectedSite.id}/survey-visits` : null, [selectedSite]
  );

  // ── Survey Team ──────────────────────────────────────
  const { data: team, loading: teamL, reload: reloadTeam } = useApi(
    selectedVisit ? `${API}/sia/survey-visits/${selectedVisit.id}/team` : null, [selectedVisit]
  );

  // ── Site Access ──────────────────────────────────────
  const { data: access, loading: accessL, reload: reloadAccess } = useApi(
    selectedSite ? `${API}/sia/sites/${selectedSite.id}/access` : null, [selectedSite]
  );

  // ── Site Safety ──────────────────────────────────────
  const { data: safety, loading: safetyL, reload: reloadSafety } = useApi(
    selectedSite ? `${API}/sia/sites/${selectedSite.id}/safety` : null, [selectedSite]
  );

  // ── Requirements ─────────────────────────────────────
  const { data: reqs, loading: reqsL, reload: reloadReqs } = useApi(
    selectedVisit ? `${API}/sia/survey-visits/${selectedVisit.id}/requirements` : null, [selectedVisit]
  );

  // ── Instruments ──────────────────────────────────────
  const { data: instruments, loading: instL, reload: reloadInst } = useApi(
    selectedVisit ? `${API}/sia/survey-visits/${selectedVisit.id}/instruments` : null, [selectedVisit]
  );

  // ── Modal state ──────────────────────────────────────
  const [modal, setModal] = useState(null); // string key
  const [saving, setSaving] = useState(false);

  // ── Generic form state ────────────────────────────────
  const [formValues, setFormValues] = useState({});

  const form = {
    values: formValues,
    setValues: (v) => setFormValues(v),
    setFieldValue: (k, v) => setFormValues((prev) => ({ ...prev, [k]: v })),
    reset: () => setFormValues({}),
  };

  const openModal = (key, defaults = {}) => { setFormValues(defaults); setModal(key); };
  const closeModal = () => { setModal(null); setFormValues({}); };

  const save = async (path, body, reload) => {
    setSaving(true);
    // strip empty strings to null so backend doesn't get partial values
    const cleaned = Object.fromEntries(
      Object.entries(body).map(([k, v]) => [k, v === '' ? null : v])
    );
    try {
      const result = await postApi(path, cleaned);
      // Auto-store IDs in localStorage after creation
      if (path === '/sia/sites' && result?.id) {
        localStorage.setItem('sia_site_id', result.id);
      }
      if (path === '/sia/survey-visits' && result?.id) {
        localStorage.setItem('sia_survey_visit_id', result.id);
      }
      notifications.show({ title: 'Saved', message: 'Record created successfully.', color: 'green' });
      reload();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  // ════════════════════════════════════════════════════
  return (
    <Box p="lg">
      {/* Header */}
      <Box mb="lg">
        <Group gap="sm" mb={4}>
          <Badge color="green" variant="light" size="lg" radius="sm">SIA</Badge>
          <Text size="xs" c="dimmed" fw={500}>Module 1 · Section 2</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">Sites and Survey</Title>
        <Text size="sm" c="#6b7280" mt={4}>
          Manage sites, buildings, rooms, POIs, survey visits, teams, access, safety, requirements and instruments.
        </Text>
      </Box>

      {/* SIA Case ID context banner */}
      <Paper p="sm" mb="lg" style={{ border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb' }}>
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Text size="xs" fw={700} c="#374151">Active SIA Case:</Text>
            {siaCaseId
              ? <Text size="xs" fw={600} c="#007336" style={{ fontFamily: 'monospace' }}>{siaCaseId}</Text>
              : <Text size="xs" c="red">No active case — create one in Start and Case Control first.</Text>}
          </Group>
          <Button size="xs" variant="subtle" color="green" onClick={reloadSites} disabled={!siaCaseId}>
            Reload Sites
          </Button>
        </Group>
      </Paper>

      {/* Context strip */}
      {(selectedSite || selectedVisit) && (
        <Paper p="sm" mb="md" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
          <Group gap="xl" wrap="wrap">
            {selectedSite && <Text size="xs" c="#374151">Site: <Text span fw={700} c="#007336">{selectedSite.site_name || selectedSite.site_code}</Text></Text>}
            {selectedBuilding && <Text size="xs" c="#374151">Building: <Text span fw={700} c="#374151">{selectedBuilding.building_name || selectedBuilding.building_code}</Text></Text>}
            {selectedVisit && <Text size="xs" c="#374151">Visit: <Text span fw={700} c="#374151">{selectedVisit.visit_code}</Text></Text>}
            <Text size="xs" c="#9ca3af" style={{ marginLeft: 'auto', cursor: 'pointer' }}
              onClick={() => { setSite(null); setBuilding(null); setVisit(null); }}>Clear selection</Text>
          </Group>
        </Paper>
      )}

      {/* ── STEP FLOW TABS ── */}
      <Tabs value={activeTab} onChange={setTab} color="green">

        {/* Visual step-flow navigator */}
        <Box mb="lg" style={{ overflowX: 'auto' }}>
          <Group gap={0} wrap="nowrap" style={{ minWidth: 'max-content' }}>
            {[
              { value: 'sites',     label: 'Sites',          icon: <IconMapPin size={15} />,    enabled: true },
              { value: 'buildings', label: 'Buildings',      icon: <IconBuilding size={15} />,  enabled: !!selectedSite },
              { value: 'rooms',     label: 'Room / Areas',   icon: <IconDoor size={15} />,      enabled: !!selectedBuilding },
              { value: 'pois',      label: 'POIs',           icon: <IconLocation size={15} />,  enabled: !!selectedSite },
              { value: 'visits',    label: 'Survey Visits',  icon: <IconCalendar size={15} />,  enabled: !!selectedSite },
              { value: 'team',      label: 'Team',           icon: <IconUsers size={15} />,     enabled: !!selectedVisit },
              { value: 'access',    label: 'Access',         icon: <IconLock size={15} />,      enabled: !!selectedSite },
              { value: 'safety',    label: 'Safety',         icon: <IconShield size={15} />,    enabled: !!selectedSite },
              { value: 'reqs',      label: 'Requirements',   icon: <IconClipboard size={15} />, enabled: !!selectedVisit },
              { value: 'instruments', label: 'Instruments',  icon: <IconTool size={15} />,      enabled: !!selectedVisit },
            ].map((step, idx, arr) => {
              const isActive  = activeTab === step.value;
              const isDone    = arr.findIndex(s => s.value === activeTab) > idx;
              const color     = isActive ? '#007336' : isDone ? '#bbf7d0' : step.enabled ? '#f3f4f6' : '#f9fafb';
              const textColor = isActive ? '#fff'    : isDone ? '#007336' : step.enabled ? '#374151' : '#9ca3af';
              const border    = isActive ? '#007336' : isDone ? '#86efac' : '#e5e7eb';
              return (
                <Group key={step.value} gap={0} wrap="nowrap" align="center">
                  {/* Step pill */}
                  <Box
                    onClick={() => step.enabled && setTab(step.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 24,
                      backgroundColor: color, border: `1.5px solid ${border}`,
                      cursor: step.enabled ? 'pointer' : 'not-allowed',
                      opacity: step.enabled ? 1 : 0.45,
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Box style={{ color: textColor, display: 'flex', alignItems: 'center' }}>
                      {step.icon}
                    </Box>
                    <Text size="xs" fw={isActive ? 700 : 500} style={{ color: textColor }}>
                      {step.label}
                    </Text>
                  </Box>
                  {/* Connector arrow */}
                  {idx < arr.length - 1 && (
                    <Box style={{ width: 20, height: 2, backgroundColor: isDone ? '#86efac' : '#e5e7eb', flexShrink: 0 }} />
                  )}
                </Group>
              );
            })}
          </Group>
        </Box>

        {/* Hidden tabs list to keep Mantine tab routing working */}
        <Tabs.List style={{ display: 'none' }}>
          <Tabs.Tab value="sites">Sites</Tabs.Tab>
          <Tabs.Tab value="buildings">Buildings</Tabs.Tab>
          <Tabs.Tab value="rooms">Room / Areas</Tabs.Tab>
          <Tabs.Tab value="pois">POIs</Tabs.Tab>
          <Tabs.Tab value="visits">Survey Visits</Tabs.Tab>
          <Tabs.Tab value="team">Team</Tabs.Tab>
          <Tabs.Tab value="access">Access</Tabs.Tab>
          <Tabs.Tab value="safety">Safety</Tabs.Tab>
          <Tabs.Tab value="reqs">Requirements</Tabs.Tab>
          <Tabs.Tab value="instruments">Instruments</Tabs.Tab>
        </Tabs.List>

        {/* ── SITES ── */}
        <Tabs.Panel value="sites">
          <TabHeader title="Sites" onAdd={() => openModal('site')} addLabel="Add Site" disabled={!siaCaseId.trim()} />
          <DataTable loading={sitesL} cols={['Code', 'Name', 'Type', 'Status', 'Lat', 'Lng']}
            rows={sites} render={(s) => (
              <Table.Tr key={s.id} onClick={() => { setSite(s); localStorage.setItem('sia_site_id', s.id); setTab('buildings'); }}
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm" fw={600} c="#007336">{s.site_code}</Text></Table.Td>
                <Table.Td><Text size="sm">{s.site_name || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{s.site_type || '—'}</Text></Table.Td>
                <Table.Td><StatusBadge v={s.status} /></Table.Td>
                <Table.Td><Text size="xs" c="#9ca3af">{s.latitude ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#9ca3af">{s.longitude ?? '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* ── BUILDINGS ── */}
        <Tabs.Panel value="buildings">
          <TabHeader title={`Buildings — ${selectedSite?.site_name || ''}`} onAdd={() => openModal('building')} addLabel="Add Building" />
          <DataTable loading={buildingsL} cols={['Code', 'Name', 'Type', 'Floors', 'Description']}
            rows={buildings} render={(b) => (
              <Table.Tr key={b.id} onClick={() => { setBuilding(b); setTab('rooms'); }}
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm" fw={600} c="#007336">{b.building_code || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm">{b.building_name || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{b.building_type || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{b.floor_count ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#9ca3af" truncate>{b.description || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* ── ROOM AREAS ── */}
        <Tabs.Panel value="rooms">
          <TabHeader title={`Room / Areas — ${selectedBuilding?.building_name || ''}`} onAdd={() => openModal('room')} addLabel="Add Room/Area" />
          <DataTable loading={roomsL} cols={['Code', 'Name', 'Type', 'Floor', 'Description']}
            rows={roomAreas} render={(r) => (
              <Table.Tr key={r.id}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm" fw={600} c="#007336">{r.area_code || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm">{r.area_name || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{r.area_type || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{r.floor_level || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#9ca3af">{r.description || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* ── POIs ── */}
        <Tabs.Panel value="pois">
          <TabHeader title="Points of Interest" onAdd={() => openModal('poi')} addLabel="Add POI" />
          <DataTable loading={poisL} cols={['Code', 'Name', 'Type', 'Category', 'Lat', 'Lng']}
            rows={pois} render={(p) => (
              <Table.Tr key={p.id}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm" fw={600} c="#007336">{p.poi_code || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm">{p.poi_name || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{p.poi_type || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{p.category || '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#9ca3af">{p.latitude ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#9ca3af">{p.longitude ?? '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* ── SURVEY VISITS ── */}
        <Tabs.Panel value="visits">
          <TabHeader title="Survey Visits" onAdd={() => openModal('visit')} addLabel="Add Visit" />
          <DataTable loading={visitsL} cols={['Code', 'Type', 'Purpose', 'Planned Date', 'Status']}
            rows={visits} render={(v) => (
              <Table.Tr key={v.id} onClick={() => { setVisit(v); localStorage.setItem('sia_survey_visit_id', v.id); setTab('team'); }}
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm" fw={600} c="#007336">{v.visit_code || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm">{v.visit_type || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{v.purpose || '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{v.planned_date || '—'}</Text></Table.Td>
                <Table.Td><StatusBadge v={v.status} /></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* ── SURVEY TEAM ── */}
        <Tabs.Panel value="team">
          <TabHeader title={`Team — ${selectedVisit?.visit_code || ''}`} onAdd={() => openModal('team')} addLabel="Add Member" />
          <DataTable loading={teamL} cols={['User ID', 'Role', 'Lead']}
            rows={team} render={(t) => (
              <Table.Tr key={t.id}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm" style={{ fontFamily: 'monospace' }}>{t.user_id}</Text></Table.Td>
                <Table.Td><Text size="sm">{t.team_role || '—'}</Text></Table.Td>
                <Table.Td><Badge size="sm" color={t.is_lead ? 'green' : 'gray'} variant="light">{t.is_lead ? 'Lead' : 'Member'}</Badge></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* ── SITE ACCESS ── */}
        <Tabs.Panel value="access">
          <TabHeader title="Site Access" onAdd={() => openModal('access')} addLabel="Add Access Record" />
          <DataTable loading={accessL} cols={['Access Type', 'Road Condition', 'Transport', 'Entry Permission', 'Working Hours']}
            rows={access} render={(a) => (
              <Table.Tr key={a.id}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm">{a.access_type || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{a.road_condition || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{a.transport_method || '—'}</Text></Table.Td>
                <Table.Td><Badge size="sm" color={a.entry_permission ? 'green' : 'red'} variant="light">{a.entry_permission ? 'Permitted' : 'Denied'}</Badge></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{a.working_hours || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* ── SITE SAFETY ── */}
        <Tabs.Panel value="safety">
          <TabHeader title="Site Safety" onAdd={() => openModal('safety')} addLabel="Add Safety Record" />
          <DataTable loading={safetyL} cols={['Hazard Type', 'Risk Level', 'PPE Required', 'Restricted', 'Emergency Contact']}
            rows={safety} render={(s) => (
              <Table.Tr key={s.id}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm">{s.hazard_type || '—'}</Text></Table.Td>
                <Table.Td><RiskBadge v={s.risk_level} /></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{s.ppe_required || '—'}</Text></Table.Td>
                <Table.Td><Badge size="sm" color={s.restricted_area ? 'red' : 'green'} variant="light">{s.restricted_area ? 'Yes' : 'No'}</Badge></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{s.emergency_contact || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* ── REQUIREMENTS ── */}
        <Tabs.Panel value="reqs">
          <TabHeader title={`Requirements — ${selectedVisit?.visit_code || ''}`} onAdd={() => openModal('req')} addLabel="Add Requirement" />
          <DataTable loading={reqsL} cols={['Name', 'Type', 'Mandatory', 'Status']}
            rows={reqs} render={(r) => (
              <Table.Tr key={r.id}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm">{r.requirement_name || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{r.requirement_type || '—'}</Text></Table.Td>
                <Table.Td><Badge size="sm" color={r.is_mandatory ? 'red' : 'gray'} variant="light">{r.is_mandatory ? 'Mandatory' : 'Optional'}</Badge></Table.Td>
                <Table.Td><StatusBadge v={r.status} /></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* ── INSTRUMENTS ── */}
        <Tabs.Panel value="instruments">
          <TabHeader title={`Instruments — ${selectedVisit?.visit_code || ''}`} onAdd={() => openModal('instrument')} addLabel="Add Instrument" />
          <DataTable loading={instL} cols={['Name', 'Type', 'Serial No', 'Calibration', 'Required']}
            rows={instruments} render={(i) => (
              <Table.Tr key={i.id}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm">{i.instrument_name || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{i.instrument_type || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{i.serial_number || '—'}</Text></Table.Td>
                <Table.Td><StatusBadge v={i.calibration_status} /></Table.Td>
                <Table.Td><Badge size="sm" color={i.required ? 'green' : 'gray'} variant="light">{i.required ? 'Yes' : 'No'}</Badge></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>
      </Tabs>

      {/* ════ MODALS ════ */}

      {/* Site Modal */}
      <FormModal opened={modal === 'site'} onClose={closeModal} title="Add Site" saving={saving}
        onSubmit={() => save('/sia/sites', { sia_case_id: siaCaseId, ...form.values }, reloadSites)}>
        <FormRow><FI label="Site Code *" field="site_code" form={form} /></FormRow>
        <FormRow><FI label="Site Name" field="site_name" form={form} /><FI label="Site Type" field="site_type" form={form} /></FormRow>
        <FI label="Address" field="address" form={form} textarea />
        <FormRow><FI label="Contact Name" field="contact_name" form={form} /><FI label="Contact Phone" field="contact_phone" form={form} /></FormRow>
        <FormRow><FI label="Latitude" field="latitude" form={form} number /><FI label="Longitude" field="longitude" form={form} number /></FormRow>
        <FI label="Status" field="status" form={form} select={['Active', 'Inactive', 'Pending', 'Surveyed']} />
      </FormModal>

      {/* Building Modal */}
      <FormModal opened={modal === 'building'} onClose={closeModal} title="Add Building" saving={saving}
        onSubmit={() => save('/sia/buildings', { site_id: selectedSite?.id, ...form.values }, reloadBuildings)}>
        <FormRow><FI label="Building Code" field="building_code" form={form} /><FI label="Building Name" field="building_name" form={form} /></FormRow>
        <FormRow><FI label="Building Type" field="building_type" form={form} /><FI label="Floor Count" field="floor_count" form={form} number /></FormRow>
        <FI label="Description" field="description" form={form} textarea />
      </FormModal>

      {/* Room Area Modal */}
      <FormModal opened={modal === 'room'} onClose={closeModal} title="Add Room / Area" saving={saving}
        onSubmit={() => save('/sia/room-areas', { site_id: selectedSite?.id, building_id: selectedBuilding?.id, ...form.values }, reloadRooms)}>
        <FormRow><FI label="Area Code" field="area_code" form={form} /><FI label="Area Name" field="area_name" form={form} /></FormRow>
        <FormRow><FI label="Area Type" field="area_type" form={form} /><FI label="Floor Level" field="floor_level" form={form} /></FormRow>
        <FI label="Description" field="description" form={form} textarea />
      </FormModal>

      {/* POI Modal */}
      <FormModal opened={modal === 'poi'} onClose={closeModal} title="Add Point of Interest" saving={saving}
        onSubmit={() => save('/sia/pois', { site_id: selectedSite?.id, ...form.values }, reloadPois)}>
        <FormRow><FI label="POI Code" field="poi_code" form={form} /><FI label="POI Name" field="poi_name" form={form} /></FormRow>
        <FormRow><FI label="POI Type" field="poi_type" form={form} /><FI label="Category" field="category" form={form} /></FormRow>
        <FormRow><FI label="Latitude" field="latitude" form={form} number /><FI label="Longitude" field="longitude" form={form} number /></FormRow>
        <FI label="Description" field="description" form={form} textarea />
      </FormModal>

      {/* Survey Visit Modal */}
      <FormModal opened={modal === 'visit'} onClose={closeModal} title="Add Survey Visit" saving={saving}
        onSubmit={() => save('/sia/survey-visits', { site_id: selectedSite?.id, ...form.values }, reloadVisits)}>
        <FormRow><FI label="Visit Code" field="visit_code" form={form} /><FI label="Visit Type" field="visit_type" form={form} /></FormRow>
        <FI label="Purpose" field="purpose" form={form} />
        <FormRow><FI label="Planned Date" field="planned_date" form={form} /></FormRow>
        <FI label="Status" field="status" form={form} select={['Planned', 'In Progress', 'Completed', 'Cancelled']} />
      </FormModal>

      {/* Team Modal */}
      <FormModal opened={modal === 'team'} onClose={closeModal} title="Add Team Member" saving={saving}
        onSubmit={() => save('/sia/survey-team', { survey_visit_id: selectedVisit?.id, user_id: localStorage.getItem('user_id') || 'unknown', ...form.values }, reloadTeam)}>
        <FI label="Team Role" field="team_role" form={form} />
        <Group mt="sm">
          <Text size="xs" fw={600} c="#374151">Is Lead</Text>
          <Switch checked={!!form.values.is_lead} onChange={(e) => form.setFieldValue('is_lead', e.currentTarget.checked)} color="green" />
        </Group>
      </FormModal>

      {/* Access Modal */}
      <FormModal opened={modal === 'access'} onClose={closeModal} title="Add Site Access" saving={saving}
        onSubmit={() => save('/sia/site-access', { site_id: selectedSite?.id, ...form.values }, reloadAccess)}>
        <FormRow><FI label="Access Type" field="access_type" form={form} /><FI label="Road Condition" field="road_condition" form={form} /></FormRow>
        <FormRow><FI label="Transport Method" field="transport_method" form={form} /><FI label="Working Hours" field="working_hours" form={form} /></FormRow>
        <FI label="Access Restriction" field="access_restriction" form={form} textarea />
        <FI label="Logistics Notes" field="logistics_notes" form={form} textarea />
        <Group mt="sm">
          <Text size="xs" fw={600} c="#374151">Entry Permission</Text>
          <Switch checked={!!form.values.entry_permission} onChange={(e) => form.setFieldValue('entry_permission', e.currentTarget.checked)} color="green" />
        </Group>
      </FormModal>

      {/* Safety Modal */}
      <FormModal opened={modal === 'safety'} onClose={closeModal} title="Add Safety Record" saving={saving}
        onSubmit={() => save('/sia/site-safety', { site_id: selectedSite?.id, ...form.values }, reloadSafety)}>
        <FormRow>
          <FI label="Hazard Type" field="hazard_type" form={form} />
          <FI label="Risk Level" field="risk_level" form={form} select={['Low', 'Medium', 'High', 'Critical']} />
        </FormRow>
        <FI label="Description" field="description" form={form} textarea />
        <FI label="PPE Required" field="ppe_required" form={form} />
        <FI label="Emergency Contact" field="emergency_contact" form={form} />
        <FI label="Control Action" field="control_action" form={form} textarea />
        <Group mt="sm">
          <Text size="xs" fw={600} c="#374151">Restricted Area</Text>
          <Switch checked={!!form.values.restricted_area} onChange={(e) => form.setFieldValue('restricted_area', e.currentTarget.checked)} color="red" />
        </Group>
      </FormModal>

      {/* Requirement Modal */}
      <FormModal opened={modal === 'req'} onClose={closeModal} title="Add Survey Requirement" saving={saving}
        onSubmit={() => save('/sia/survey-requirements', { survey_visit_id: selectedVisit?.id, ...form.values }, reloadReqs)}>
        <FI label="Requirement Name" field="requirement_name" form={form} />
        <FormRow>
          <FI label="Requirement Type" field="requirement_type" form={form} />
          <FI label="Status" field="status" form={form} select={['Pending', 'In Progress', 'Completed', 'Not Applicable']} />
        </FormRow>
        <FI label="Notes" field="notes" form={form} textarea />
        <Group mt="sm">
          <Text size="xs" fw={600} c="#374151">Mandatory</Text>
          <Switch checked={!!form.values.is_mandatory} onChange={(e) => form.setFieldValue('is_mandatory', e.currentTarget.checked)} color="red" />
        </Group>
      </FormModal>

      {/* Instrument Modal */}
      <FormModal opened={modal === 'instrument'} onClose={closeModal} title="Add Survey Instrument" saving={saving}
        onSubmit={() => save('/sia/survey-instruments', { survey_visit_id: selectedVisit?.id, ...form.values }, reloadInst)}>
        <FormRow><FI label="Instrument Name" field="instrument_name" form={form} /><FI label="Instrument Type" field="instrument_type" form={form} /></FormRow>
        <FormRow>
          <FI label="Serial Number" field="serial_number" form={form} />
          <FI label="Calibration Status" field="calibration_status" form={form} select={['Valid', 'Expired', 'Pending', 'Unknown']} />
        </FormRow>
        <Group mt="sm">
          <Text size="xs" fw={600} c="#374151">Required</Text>
          <Switch checked={!!form.values.required} onChange={(e) => form.setFieldValue('required', e.currentTarget.checked)} color="green" />
        </Group>
      </FormModal>
    </Box>
  );
}

// ════════════════════════════════════════════════════════
// REUSABLE SUB-COMPONENTS
// ════════════════════════════════════════════════════════

function TabHeader({ title, onAdd, addLabel, disabled = false }) {
  return (
    <Group justify="space-between" align="center" mb="sm">
      <Text fw={600} size="sm" c="#374151">{title}</Text>
      <Button size="xs" color="green" leftSection={<IconPlus size={13} />}
        disabled={disabled} onClick={onAdd} style={{ backgroundColor: disabled ? undefined : '#007336' }}>
        {addLabel}
      </Button>
    </Group>
  );
}

function DataTable({ loading, cols, rows, render }) {
  return (
    <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 8, position: 'relative', minHeight: 140 }}>
      {loading && <Group justify="center" py="xl"><Loader color="green" size="sm" /></Group>}
      {!loading && (
        <Table verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
            <Table.Tr>{cols.map(c => <Table.Th key={c} style={thS}>{c}</Table.Th>)}</Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length === 0 ? <EmptyRow cols={cols.length} /> : rows.map(render)}
          </Table.Tbody>
        </Table>
      )}
    </Paper>
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

function FormRow({ children }) {
  return <Group grow align="flex-start" gap="sm">{children}</Group>;
}

function FI({ label, field, form, textarea, number, select }) {
  const val = form.values[field] ?? '';
  const onChange = (v) => form.setFieldValue(field, v);
  const inputStyle = { input: { borderColor: '#d1d5db', borderRadius: 6, height: textarea ? undefined : 36 } };
  if (select) return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
      <Select data={select} value={val} onChange={v => onChange(v || '')} clearable styles={inputStyle} />
    </Box>
  );
  if (textarea) return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
      <Textarea value={val} onChange={e => onChange(e.target.value)} autosize minRows={2} styles={inputStyle} />
    </Box>
  );
  if (number) return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
      <NumberInput value={val === '' ? undefined : val} onChange={v => onChange(v)} styles={inputStyle} />
    </Box>
  );
  return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
      <TextInput value={val} onChange={e => onChange(e.target.value)} styles={inputStyle} />
    </Box>
  );
}

function StatusBadge({ v }) {
  const m = { active: '#007336', completed: '#007336', valid: '#007336', planned: '#1971c2', 'in progress': '#1971c2', pending: '#f08c00', cancelled: '#e03131', expired: '#e03131', critical: '#e03131', high: '#e03131', medium: '#f08c00', low: '#2f9e44', inactive: '#6b7280' };
  const key = (v || '').toLowerCase();
  const col = m[key] || '#6b7280';
  return <Badge size="sm" radius="xl" style={{ backgroundColor: col + '18', color: col, border: 'none', fontWeight: 600 }}>{v || '—'}</Badge>;
}

function RiskBadge({ v }) { return <StatusBadge v={v} />; }
