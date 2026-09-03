import { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader, Modal,
  Paper, Select, Stack, Switch, Tabs, Table, Text, Textarea,
  TextInput, Title, NumberInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconDeviceMobile, IconDownload, IconClipboard,
  IconMapPin, IconCamera, IconVideo, IconRuler,
  IconMicrophone, IconPencil, IconRobot, IconShieldCheck,
  IconDoor, IconDatabase, IconRefresh, IconAlertTriangle,
  IconFileCheck, IconPackage, IconHistory,
} from '@tabler/icons-react';
import SIAStepFlow from '../components/common/SIAStepFlow';

const API = '/api';
const thS = { fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' };

const SYNC_STATUS  = ['Pending', 'In Progress', 'Completed', 'Failed', 'Quarantined'];
const SESS_STATUS  = ['Active', 'Completed', 'Aborted', 'Synced'];
const EV_STATUS    = ['COLLECTED', 'NOT_APPLICABLE', 'INACCESSIBLE_UNSAFE', 'UNKNOWN', 'DATA_GAP'];
const AI_CHECKS    = ['IMAGE_BLUR', 'DUPLICATE_IMAGE', 'OCR', 'MISSING_EVIDENCE', 'VALUE_CONFLICT', 'GPS_PLAUSIBILITY'];
const EXIT_DEC     = ['Approved', 'Approved with Exceptions', 'Blocked'];

// ── hooks & helpers ─────────────────────────────────────
function useApi(url, deps = []) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);
  const reload = () => {
    if (!url) return;
    setLoading(true);
    fetch(url).then(r => r.json()).then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setLoading(false));
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
  return <Table.Tr><Table.Td colSpan={cols} style={{ textAlign: 'center', padding: '26px 0' }}>
    <Text size="sm" c="dimmed">No records found.</Text></Table.Td></Table.Tr>;
}
function DT({ loading, cols, rows, render }) {
  return (
    <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 8, minHeight: 100 }}>
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
function TH({ title, onAdd, addLabel, disabled = false }) {
  return <Group justify="space-between" mb="sm">
    <Text fw={600} size="sm" c="#374151">{title}</Text>
    <Button size="xs" color="green" leftSection={<IconPlus size={13} />} disabled={disabled}
      onClick={onAdd} style={{ backgroundColor: disabled ? undefined : '#007336' }}>{addLabel}</Button>
  </Group>;
}
function FM({ opened, onClose, title, saving, onSubmit, children }) {
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
function FI({ label, field, fv, setFv, textarea, number, select }) {
  const val = fv[field] ?? '';
  const upd = v => setFv(p => ({ ...p, [field]: v }));
  const s = { input: { borderColor: '#d1d5db', borderRadius: 6, height: textarea ? undefined : 36 } };
  if (select) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <Select data={select} value={val} onChange={v => upd(v || '')} clearable styles={s} /></Box>;
  if (textarea) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <Textarea value={val} onChange={e => upd(e.target.value)} autosize minRows={2} styles={s} /></Box>;
  if (number) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <NumberInput value={val === '' ? undefined : val} onChange={v => upd(v)} styles={s} /></Box>;
  return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <TextInput value={val} onChange={e => upd(e.target.value)} styles={s} /></Box>;
}
function SBadge({ v }) {
  const m = {
    completed: '#007336', synced: '#007336', collected: '#007336', approved: '#007336',
    active: '#1971c2', 'in progress': '#1971c2', pending: '#f08c00',
    failed: '#e03131', aborted: '#e03131', quarantined: '#9c36b5', blocked: '#e03131',
    not_applicable: '#6b7280', unknown: '#6b7280', data_gap: '#f08c00',
    inaccessible_unsafe: '#e03131',
  };
  const col = m[(v || '').toLowerCase().replace(/ /g, '_')] || '#6b7280';
  return <Badge size="sm" radius="xl" style={{ backgroundColor: col + '18', color: col, border: 'none', fontWeight: 600 }}>{v || '—'}</Badge>;
}

// ════════════════════════════════════════════════════════
export default function SIAAndroidFieldOpsLayout() {
  const uid = localStorage.getItem('user_id') || 'unknown';

  // ── top-level: device list ───────────────────────────
  const { data: devices, loading: devL, reload: rDev } = useApi(`${API}/sia/mobile-devices`, []);

  // ── selections ───────────────────────────────────────
  const [selDevice, setDevice]   = useState(null);
  const [selDown,   setDown]     = useState(null);
  const [selSess,   setSess]     = useState(null);
  const [selBatch,  setBatch]    = useState(null);
  const [caseId,    setCaseId]   = useState(() => localStorage.getItem('sia_case_id') || '');
  const [activeTab, setTab]      = useState('devices');

  const did  = selDevice?.id;
  const dlid = selDown?.id;
  const sid  = selSess?.id;
  const bid  = selBatch?.id;

  // ── device children ──────────────────────────────────
  const { data: downloads,  loading: dlL,  reload: rDl }  = useApi(did  ? `${API}/sia/cases/${caseId || '_'}/field-case-downloads` : null, [did]);
  const { data: storages,   loading: stL,  reload: rSt }  = useApi(did  ? `${API}/sia/mobile-devices/${did}/storage-status`         : null, [did]);
  const { data: syncQ,      loading: sqL,  reload: rSq }  = useApi(did  ? `${API}/sia/mobile-devices/${did}/sync-queue`             : null, [did]);
  const { data: batches,    loading: btL,  reload: rBt }  = useApi(did  ? `${API}/sia/mobile-devices/${did}/sync-batches`           : null, [did]);
  const { data: audits,     loading: auL,  reload: rAu }  = useApi(did  ? `${API}/sia/mobile-devices/${did}/audits`                 : null, [did]);

  // ── session children ─────────────────────────────────
  const { data: formResp,   loading: frL,  reload: rFr }  = useApi(sid ? `${API}/sia/field-sessions/${sid}/form-responses`         : null, [sid]);
  const { data: poiCaps,    loading: pcL,  reload: rPc }  = useApi(sid ? `${API}/sia/field-sessions/${sid}/poi-captures`           : null, [sid]);
  const { data: photos,     loading: phL,  reload: rPh }  = useApi(sid ? `${API}/sia/field-sessions/${sid}/photo-captures`         : null, [sid]);
  const { data: videos,     loading: viL,  reload: rVi }  = useApi(sid ? `${API}/sia/field-sessions/${sid}/video-captures`         : null, [sid]);
  const { data: measures,   loading: meL,  reload: rMe }  = useApi(sid ? `${API}/sia/field-sessions/${sid}/measurements`           : null, [sid]);
  const { data: nameplates, loading: npL,  reload: rNp }  = useApi(sid ? `${API}/sia/field-sessions/${sid}/nameplate-captures`     : null, [sid]);
  const { data: voices,     loading: vnL,  reload: rVn }  = useApi(sid ? `${API}/sia/field-sessions/${sid}/voice-notes`            : null, [sid]);
  const { data: sketches,   loading: skL,  reload: rSk }  = useApi(sid ? `${API}/sia/field-sessions/${sid}/sketches`               : null, [sid]);
  const { data: aiChecks,   loading: aiL,  reload: rAi }  = useApi(sid ? `${API}/sia/field-sessions/${sid}/ai-checks`              : null, [sid]);
  const { data: reqEvSt,    loading: reL,  reload: rRe }  = useApi(sid ? `${API}/sia/field-sessions/${sid}/required-evidence-status`: null, [sid]);
  const { data: exitGates,  loading: egL,  reload: rEg }  = useApi(sid ? `${API}/sia/field-sessions/${sid}/site-exit-gates`        : null, [sid]);

  // ── batch children ───────────────────────────────────
  const { data: conflicts,  loading: cfL,  reload: rCf }  = useApi(bid ? `${API}/sia/sync-batches/${bid}/conflicts`         : null, [bid]);
  const { data: receipts,   loading: rcL,  reload: rRc }  = useApi(bid ? `${API}/sia/sync-batches/${bid}/integrity-receipts`: null, [bid]);

  // ── packs (by case) ──────────────────────────────────
  const { data: packs, loading: pkL, reload: rPk } = useApi(
    caseId.trim() ? `${API}/sia/cases/${caseId}/portable-data-packs` : null, [caseId]
  );

  // ── modal ─────────────────────────────────────────────
  const [modal, setModal]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [fv, setFv]         = useState({});
  const open  = (k, def = {}) => { setFv(def); setModal(k); };
  const close = () => { setModal(null); setFv({}); };
  const save  = async (path, body, reload) => {
    setSaving(true);
    try {
      await postApi(path, body);
      notifications.show({ title: 'Saved', message: 'Record created.', color: 'green' });
      reload(); close();
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
          <Text size="xs" c="dimmed" fw={500}>Module 1 · Section 7</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">Android Field Operations</Title>
        <Text size="sm" c="#6b7280" mt={4}>
          Manage mobile devices, field sessions, captures, sync and portable data packs.
        </Text>
      </Box>

      {/* Case ID + New Device bar */}
      <Paper p="md" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <Group align="flex-end" gap="sm" wrap="wrap">
          <Box style={{ flex: 1, minWidth: 220 }}>
            <Text size="xs" fw={700} c="#374151" mb={4}>Active SIA Case</Text>
            {caseId
              ? <Text size="sm" fw={600} c="#007336" style={{ fontFamily: 'monospace' }}>{caseId}</Text>
              : <Text size="sm" c="red">No active case — create one in Start and Case Control first.</Text>}
          </Box>
          <Button color="green" style={{ backgroundColor: '#007336' }}
            onClick={() => open('device', { user_id: uid })}>
            + Register Device
          </Button>
        </Group>
      </Paper>

      {/* Context strip */}
      {(selDevice || selDown || selSess || selBatch) && (
        <Paper p="sm" mb="md" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
          <Group gap="xl" wrap="wrap">
            {selDevice && <Text size="xs" c="#374151">Device: <Text span fw={700} c="#007336">{selDevice.device_name || selDevice.device_uuid}</Text></Text>}
            {selDown   && <Text size="xs" c="#374151">Download: <Text span fw={700} c="#374151">{selDown.id}</Text></Text>}
            {selSess   && <Text size="xs" c="#374151">Session: <Text span fw={700} c="#374151">{selSess.id}</Text></Text>}
            {selBatch  && <Text size="xs" c="#374151">Batch: <Text span fw={700} c="#374151">{selBatch.batch_code}</Text></Text>}
            <Text size="xs" c="#9ca3af" style={{ marginLeft: 'auto', cursor: 'pointer' }}
              onClick={() => { setDevice(null); setDown(null); setSess(null); setBatch(null); }}>Clear</Text>
          </Group>
        </Paper>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setTab} color="green">
        <SIAStepFlow
          activeTab={activeTab}
          onStep={setTab}
          steps={[
            { value:'devices',    label:'Devices',           icon:<IconDeviceMobile size={13}/>,  enabled:true },
            { value:'downloads',  label:'Downloads',         icon:<IconDownload size={13}/>,      enabled:!!selDevice },
            { value:'sessions',   label:'Sessions',          icon:<IconClipboard size={13}/>,     enabled:!!selDown },
            { value:'forms',      label:'Form Responses',    icon:<IconClipboard size={13}/>,     enabled:!!selSess },
            { value:'poi',        label:'POI Captures',      icon:<IconMapPin size={13}/>,        enabled:!!selSess },
            { value:'photos',     label:'Photos',            icon:<IconCamera size={13}/>,        enabled:!!selSess },
            { value:'videos',     label:'Videos',            icon:<IconVideo size={13}/>,         enabled:!!selSess },
            { value:'measures',   label:'Measurements',      icon:<IconRuler size={13}/>,         enabled:!!selSess },
            { value:'nameplates', label:'Nameplates',        icon:<IconCamera size={13}/>,        enabled:!!selSess },
            { value:'voices',     label:'Voice Notes',       icon:<IconMicrophone size={13}/>,    enabled:!!selSess },
            { value:'sketches',   label:'Sketches',          icon:<IconPencil size={13}/>,        enabled:!!selSess },
            { value:'aichecks',   label:'AI Checks',         icon:<IconRobot size={13}/>,         enabled:!!selSess },
            { value:'reqev',      label:'Evidence Status',   icon:<IconShieldCheck size={13}/>,   enabled:!!selSess },
            { value:'exitgate',   label:'Site Exit Gate',    icon:<IconDoor size={13}/>,          enabled:!!selSess },
            { value:'storage',    label:'Storage',           icon:<IconDatabase size={13}/>,      enabled:!!selDevice },
            { value:'syncq',      label:'Sync Queue',        icon:<IconRefresh size={13}/>,       enabled:!!selDevice },
            { value:'batches',    label:'Sync Batches',      icon:<IconRefresh size={13}/>,       enabled:!!selDevice },
            { value:'conflicts',  label:'Sync Conflicts',    icon:<IconAlertTriangle size={13}/>, enabled:!!selBatch },
            { value:'receipts',   label:'Integrity Receipts',icon:<IconFileCheck size={13}/>,     enabled:!!selBatch },
            { value:'packs',      label:'Data Packs',        icon:<IconPackage size={13}/>,       enabled:true },
            { value:'audits',     label:'Device Audit',      icon:<IconHistory size={13}/>,       enabled:!!selDevice },
          ]}
        />
        <Tabs.List style={{ display:'none' }}>
          <Tabs.Tab value="devices">Devices</Tabs.Tab>
          <Tabs.Tab value="downloads">Downloads</Tabs.Tab>
          <Tabs.Tab value="sessions">Sessions</Tabs.Tab>
          <Tabs.Tab value="forms">Form Responses</Tabs.Tab>
          <Tabs.Tab value="poi">POI Captures</Tabs.Tab>
          <Tabs.Tab value="photos">Photos</Tabs.Tab>
          <Tabs.Tab value="videos">Videos</Tabs.Tab>
          <Tabs.Tab value="measures">Measurements</Tabs.Tab>
          <Tabs.Tab value="nameplates">Nameplates</Tabs.Tab>
          <Tabs.Tab value="voices">Voice Notes</Tabs.Tab>
          <Tabs.Tab value="sketches">Sketches</Tabs.Tab>
          <Tabs.Tab value="aichecks">AI Checks</Tabs.Tab>
          <Tabs.Tab value="reqev">Evidence Status</Tabs.Tab>
          <Tabs.Tab value="exitgate">Site Exit Gate</Tabs.Tab>
          <Tabs.Tab value="storage">Storage</Tabs.Tab>
          <Tabs.Tab value="syncq">Sync Queue</Tabs.Tab>
          <Tabs.Tab value="batches">Sync Batches</Tabs.Tab>
          <Tabs.Tab value="conflicts">Sync Conflicts</Tabs.Tab>
          <Tabs.Tab value="receipts">Integrity Receipts</Tabs.Tab>
          <Tabs.Tab value="packs">Data Packs</Tabs.Tab>
          <Tabs.Tab value="audits">Device Audit</Tabs.Tab>
        </Tabs.List>

        {/* DEVICES */}
        <Tabs.Panel value="devices">
          <TH title="Mobile Devices" onAdd={() => open('device', { user_id: uid })} addLabel="Register Device" />
          <DT loading={devL} cols={['Name', 'Model', 'UUID', 'OS', 'App', 'Encrypted', 'Active']}
            rows={devices} render={r => (
              <Table.Tr key={r.id} onClick={() => { setDevice(r); setTab('downloads'); }}
                style={{ cursor: 'pointer', backgroundColor: selDevice?.id === r.id ? '#f0fdf4' : 'transparent' }}
                onMouseEnter={e => { if (selDevice?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                onMouseLeave={e => { if (selDevice?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <Table.Td><Text size="sm" fw={600} c="#007336">{r.device_name || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm">{r.device_model || '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }} truncate maw={160}>{r.device_uuid}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.os_version || '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.app_version || '—'}</Text></Table.Td>
                <Table.Td><Badge size="sm" color={r.is_encrypted ? 'green' : 'gray'} variant="light">{r.is_encrypted ? 'Yes' : 'No'}</Badge></Table.Td>
                <Table.Td><Badge size="sm" color={r.is_active ? 'green' : 'red'} variant="light">{r.is_active ? 'Active' : 'Inactive'}</Badge></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* DOWNLOADS */}
        <Tabs.Panel value="downloads">
          <TH title="Field Case Downloads" onAdd={() => open('download', { device_id: did, downloaded_by: uid })} addLabel="Add Download" disabled={!caseId.trim()} />
          {!caseId.trim() && <Text size="xs" c="orange" mb="sm">Enter a Case ID above to load downloads.</Text>}
          <DT loading={dlL} cols={['Case ID', 'Site ID', 'Pack Version', 'Status', 'Offline Ready', 'Downloaded At']}
            rows={downloads} render={r => (
              <Table.Tr key={r.id} onClick={() => { setDown(r); setTab('sessions'); }}
                style={{ cursor: 'pointer', backgroundColor: selDown?.id === r.id ? '#f0fdf4' : 'transparent' }}
                onMouseEnter={e => { if (selDown?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                onMouseLeave={e => { if (selDown?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }} truncate maw={120}>{r.sia_case_id}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280" truncate maw={120}>{r.site_id}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{r.pack_version || '—'}</Text></Table.Td>
                <Table.Td><SBadge v={r.download_status} /></Table.Td>
                <Table.Td><Badge size="sm" color={r.offline_ready ? 'green' : 'gray'} variant="light">{r.offline_ready ? 'Ready' : 'No'}</Badge></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.downloaded_at || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* SESSIONS */}
        <Tabs.Panel value="sessions">
          <TH title="Field Sessions" onAdd={() => open('session', { field_case_download_id: dlid, device_id: did, user_id: uid })} addLabel="Start Session" />
          <DT loading={false} cols={['Survey Visit ID', 'Status', 'Offline', 'Started At', 'Ended At']}
            rows={[]} render={r => null} />
          {/* Sessions loaded differently — from download */}
          <SessionsPanel dlid={dlid} selSess={selSess} setSess={setSess} setTab={setTab} did={did} uid={uid} open={open} />
        </Tabs.Panel>

        {/* FORM RESPONSES */}
        <Tabs.Panel value="forms">
          <TH title="Form Responses" onAdd={() => open('form')} addLabel="Add Response" />
          <DT loading={frL} cols={['Question Code', 'Response', 'Unit', 'Applicability', 'Validation', 'Answered At']}
            rows={formResp} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm" fw={600}>{r.question_code || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" truncate maw={160}>{r.response_value || '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.unit || '—'}</Text></Table.Td>
                <Table.Td><SBadge v={r.applicability_status} /></Table.Td>
                <Table.Td><SBadge v={r.validation_status} /></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.answered_at || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* POI CAPTURES */}
        <Tabs.Panel value="poi">
          <TH title="POI Captures" onAdd={() => open('poi')} addLabel="Add Capture" />
          <DT loading={pcL} cols={['POI ID', 'Geometry Type', 'GPS Accuracy', 'Captured At']}
            rows={poiCaps} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.poi_id}</Text></Table.Td>
                <Table.Td><Text size="sm">{r.geometry_type || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{r.gps_accuracy ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.captured_at || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* PHOTOS */}
        <Tabs.Panel value="photos">
          <TH title="Photo Captures" onAdd={() => open('photo')} addLabel="Add Photo" />
          <DT loading={phL} cols={['File Name', 'Lat', 'Lng', 'GPS Accuracy', 'Annotation', 'Captured At']}
            rows={photos} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm">{r.file_name || '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.latitude ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.longitude ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.gps_accuracy ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280" truncate maw={160}>{r.annotation || '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.captured_at || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* VIDEOS */}
        <Tabs.Panel value="videos">
          <TH title="Video Captures" onAdd={() => open('video')} addLabel="Add Video" />
          <DT loading={viL} cols={['File Name', 'Start Lat', 'Start Lng', 'Spoken Note', 'Captured At']}
            rows={videos} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm">{r.file_name || '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.start_latitude ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.start_longitude ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280" truncate maw={200}>{r.spoken_note || '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.captured_at || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* MEASUREMENTS */}
        <Tabs.Panel value="measures">
          <TH title="Measurements" onAdd={() => open('measure')} addLabel="Add Measurement" />
          <DT loading={meL} cols={['Type', 'Value', 'Unit', 'Method', 'Calibration', 'Measured At']}
            rows={measures} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm">{r.measurement_type || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" fw={600}>{r.measurement_value ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.unit || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{r.measurement_method || '—'}</Text></Table.Td>
                <Table.Td><SBadge v={r.calibration_status} /></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.measured_at || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* NAMEPLATES */}
        <Tabs.Panel value="nameplates">
          <TH title="Nameplate Captures" onAdd={() => open('nameplate')} addLabel="Add Nameplate" />
          <DT loading={npL} cols={['OCR Text', 'Proposed Data', 'Confirmed', 'Captured At']}
            rows={nameplates} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm" truncate maw={200}>{r.ocr_text || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280" truncate maw={160}>{r.proposed_data || '—'}</Text></Table.Td>
                <Table.Td><Badge size="sm" color={r.user_confirmed ? 'green' : 'gray'} variant="light">{r.user_confirmed ? 'Confirmed' : 'Pending'}</Badge></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.captured_at || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* VOICE NOTES */}
        <Tabs.Panel value="voices">
          <TH title="Voice Notes" onAdd={() => open('voice')} addLabel="Add Voice Note" />
          <DT loading={vnL} cols={['Transcription', 'Status', 'Recorded At']}
            rows={voices} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm" truncate maw={300}>{r.transcription || '—'}</Text></Table.Td>
                <Table.Td><SBadge v={r.transcription_status} /></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.recorded_at || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* SKETCHES */}
        <Tabs.Panel value="sketches">
          <TH title="Sketches" onAdd={() => open('sketch')} addLabel="Add Sketch" />
          <DT loading={skL} cols={['Sketch Type', 'Description', 'Created At']}
            rows={sketches} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm">{r.sketch_type || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280" truncate maw={260}>{r.description || '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* AI CHECKS */}
        <Tabs.Panel value="aichecks">
          <TH title="AI Checks" onAdd={() => open('aicheck')} addLabel="Add AI Check" />
          <DT loading={aiL} cols={['Check Type', 'Result', 'Confidence', 'Confirmed', 'Checked At']}
            rows={aiChecks} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Badge size="sm" color="blue" variant="light">{r.check_type || '—'}</Badge></Table.Td>
                <Table.Td><SBadge v={r.result} /></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{r.confidence_score != null ? `${(r.confidence_score * 100).toFixed(0)}%` : '—'}</Text></Table.Td>
                <Table.Td><Badge size="sm" color={r.user_confirmed ? 'green' : 'gray'} variant="light">{r.user_confirmed ? 'Yes' : 'No'}</Badge></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.checked_at || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* REQUIRED EVIDENCE STATUS */}
        <Tabs.Panel value="reqev">
          <TH title="Required Evidence Status" onAdd={() => open('reqev')} addLabel="Add Status" />
          <DT loading={reL} cols={['Requirement ID', 'Evidence Status', 'Evidence ID', 'Exception Reason']}
            rows={reqEvSt} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.survey_requirement_id}</Text></Table.Td>
                <Table.Td><SBadge v={r.evidence_status} /></Table.Td>
                <Table.Td><Text size="xs" c="#9ca3af">{r.evidence_id || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280" truncate maw={200}>{r.exception_reason || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* SITE EXIT GATE */}
        <Tabs.Panel value="exitgate">
          <TH title="Site Exit Gate" onAdd={() => open('exitgate')} addLabel="Add Exit Gate" />
          <DT loading={egL} cols={['Mandatory', 'Completed', 'Exceptions', 'Unresolved', 'Gate Status', 'Exit Decision']}
            rows={exitGates} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm">{r.mandatory_count ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#007336">{r.completed_count ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#f08c00">{r.exception_count ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#e03131">{r.unresolved_count ?? '—'}</Text></Table.Td>
                <Table.Td><SBadge v={r.gate_status} /></Table.Td>
                <Table.Td><SBadge v={r.exit_decision} /></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* STORAGE */}
        <Tabs.Panel value="storage">
          <TH title="Storage Status" onAdd={() => open('storage')} addLabel="Add Storage Record" />
          <DT loading={stL} cols={['Total MB', 'Used MB', 'Free MB', 'Pending Media', 'Warning', 'Recorded At']}
            rows={storages} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm">{r.total_storage_mb ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#1971c2">{r.used_storage_mb ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#007336">{r.free_storage_mb ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#f08c00">{r.pending_media_count ?? '—'}</Text></Table.Td>
                <Table.Td><SBadge v={r.warning_status} /></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.recorded_at || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* SYNC QUEUE */}
        <Tabs.Panel value="syncq">
          <TH title="Sync Queue" onAdd={() => open('syncq')} addLabel="Add Queue Item" />
          <DT loading={sqL} cols={['Operation', 'Record Type', 'Record ID', 'Retries', 'Status', 'Last Error']}
            rows={syncQ} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm">{r.operation_type || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{r.record_type || '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.record_id || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#f08c00">{r.retry_count ?? 0}</Text></Table.Td>
                <Table.Td><SBadge v={r.sync_status} /></Table.Td>
                <Table.Td><Text size="xs" c="#e03131" truncate maw={180}>{r.last_error || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* SYNC BATCHES */}
        <Tabs.Panel value="batches">
          <TH title="Sync Batches" onAdd={() => open('batch')} addLabel="Add Batch" />
          <DT loading={btL} cols={['Batch Code', 'Total', 'Accepted', 'Rejected', 'Quarantined', 'Status']}
            rows={batches} render={r => (
              <Table.Tr key={r.id} onClick={() => { setBatch(r); setTab('conflicts'); }}
                style={{ cursor: 'pointer', backgroundColor: selBatch?.id === r.id ? '#f0fdf4' : 'transparent' }}
                onMouseEnter={e => { if (selBatch?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                onMouseLeave={e => { if (selBatch?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <Table.Td><Text size="sm" fw={600} c="#007336">{r.batch_code}</Text></Table.Td>
                <Table.Td><Text size="sm">{r.total_items ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#007336">{r.accepted_items ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#e03131">{r.rejected_items ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#9c36b5">{r.quarantined_items ?? '—'}</Text></Table.Td>
                <Table.Td><SBadge v={r.batch_status} /></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* SYNC CONFLICTS */}
        <Tabs.Panel value="conflicts">
          <TH title={`Sync Conflicts — ${selBatch?.batch_code || ''}`} onAdd={() => open('conflict')} addLabel="Add Conflict" />
          <DT loading={cfL} cols={['Record Type', 'Conflict Type', 'Local Value', 'Server Value', 'Resolution']}
            rows={conflicts} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm">{r.record_type || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{r.conflict_type || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" truncate maw={120}>{r.local_value || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" truncate maw={120}>{r.server_value || '—'}</Text></Table.Td>
                <Table.Td><SBadge v={r.resolution_status} /></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* INTEGRITY RECEIPTS */}
        <Tabs.Panel value="receipts">
          <TH title={`Integrity Receipts — ${selBatch?.batch_code || ''}`} onAdd={() => open('receipt')} addLabel="Add Receipt" />
          <DT loading={rcL} cols={['Receipt Code', 'Integrity Status', 'Accepted', 'Rejected', 'Quarantined', 'Received At']}
            rows={receipts} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm" fw={600}>{r.receipt_code || '—'}</Text></Table.Td>
                <Table.Td><SBadge v={r.integrity_status} /></Table.Td>
                <Table.Td><Text size="sm" c="#007336">{r.accepted_count ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#e03131">{r.rejected_count ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#9c36b5">{r.quarantined_count ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.received_at || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* DATA PACKS */}
        <Tabs.Panel value="packs">
          <TH title="Portable Data Packs" onAdd={() => open('pack')} addLabel="Create Pack" disabled={!caseId.trim()} />
          {!caseId.trim() && <Text size="xs" c="orange" mb="sm">Enter a Case ID above to load packs.</Text>}
          <DT loading={pkL} cols={['Pack Code', 'Version', 'Schema', 'Export Method', 'Status', 'Created At']}
            rows={packs} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm" fw={600} c="#007336">{r.pack_code}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{r.pack_version || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{r.schema_version || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280">{r.export_method || '—'}</Text></Table.Td>
                <Table.Td><SBadge v={r.pack_status} /></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>

        {/* DEVICE AUDIT */}
        <Tabs.Panel value="audits">
          <TH title="Device Audit Log" onAdd={() => open('audit')} addLabel="Add Audit Event" />
          <DT loading={auL} cols={['Event Type', 'Local Timestamp', 'Clock Anomaly', 'Details']}
            rows={audits} render={r => (
              <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Table.Td><Text size="sm">{r.event_type || '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="#6b7280">{r.local_timestamp || '—'}</Text></Table.Td>
                <Table.Td><Badge size="sm" color={r.clock_anomaly ? 'red' : 'gray'} variant="light">{r.clock_anomaly ? 'Yes' : 'No'}</Badge></Table.Td>
                <Table.Td><Text size="sm" c="#6b7280" truncate maw={240}>{r.event_details || '—'}</Text></Table.Td>
              </Table.Tr>
            )} />
        </Tabs.Panel>
      </Tabs>

      {/* ════ MODALS ════ */}

      <FM opened={modal === 'device'} onClose={close} title="Register Mobile Device" saving={saving}
        onSubmit={() => save('/sia/mobile-devices', { user_id: uid, ...fv }, rDev)}>
        <FR><FI label="Device UUID *" field="device_uuid" fv={fv} setFv={setFv} /><FI label="Device Name" field="device_name" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Device Model" field="device_model" fv={fv} setFv={setFv} /><FI label="OS Version" field="os_version" fv={fv} setFv={setFv} /></FR>
        <FI label="App Version" field="app_version" fv={fv} setFv={setFv} />
        <Group mt="sm" gap="xl">
          {[['is_encrypted', 'Encrypted'], ['is_active', 'Active']].map(([f, l]) => (
            <Group key={f} gap="xs"><Text size="xs" fw={600} c="#374151">{l}</Text>
              <Switch checked={!!fv[f]} onChange={e => { const v = e.currentTarget.checked; setFv(p => ({ ...p, [f]: v })); }} color="green" /></Group>
          ))}
        </Group>
      </FM>

      <FM opened={modal === 'download'} onClose={close} title="Add Field Case Download" saving={saving}
        onSubmit={() => save('/sia/field-case-downloads', { sia_case_id: caseId, device_id: did, downloaded_by: uid, downloaded_at: new Date().toISOString(), ...fv }, rDl)}>
        <FR><FI label="Site ID *" field="site_id" fv={fv} setFv={setFv} /><FI label="Survey Visit ID" field="survey_visit_id" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Pack Version" field="pack_version" fv={fv} setFv={setFv} /><FI label="Download Status" field="download_status" fv={fv} setFv={setFv} select={['Pending', 'Downloading', 'Complete', 'Failed']} /></FR>
        <Group mt="sm" gap="xs"><Text size="xs" fw={600} c="#374151">Offline Ready</Text>
          <Switch checked={!!fv.offline_ready} onChange={e => { const v = e.currentTarget.checked; setFv(p => ({ ...p, offline_ready: v })); }} color="green" /></Group>
      </FM>

      <FM opened={modal === 'session'} onClose={close} title="Start Field Session" saving={saving}
        onSubmit={() => save('/sia/field-sessions', { field_case_download_id: dlid, device_id: did, user_id: uid, started_at: new Date().toISOString(), ...fv }, () => { })}>
        <FR><FI label="Survey Visit ID *" field="survey_visit_id" fv={fv} setFv={setFv} /><FI label="Session Status" field="session_status" fv={fv} setFv={setFv} select={SESS_STATUS} /></FR>
        <FR><FI label="Start Latitude" field="start_latitude" fv={fv} setFv={setFv} number /><FI label="Start Longitude" field="start_longitude" fv={fv} setFv={setFv} number /></FR>
        <Group mt="sm" gap="xs"><Text size="xs" fw={600} c="#374151">Offline Mode</Text>
          <Switch checked={!!fv.offline_mode} onChange={e => { const v = e.currentTarget.checked; setFv(p => ({ ...p, offline_mode: v })); }} color="green" /></Group>
      </FM>

      <FM opened={modal === 'form'} onClose={close} title="Add Form Response" saving={saving}
        onSubmit={() => save('/sia/mobile-form-responses', { field_session_id: sid, answered_at: new Date().toISOString(), ...fv }, rFr)}>
        <FR><FI label="Question Code" field="question_code" fv={fv} setFv={setFv} /><FI label="Unit" field="unit" fv={fv} setFv={setFv} /></FR>
        <FI label="Question Text" field="question_text" fv={fv} setFv={setFv} textarea />
        <FI label="Response Value" field="response_value" fv={fv} setFv={setFv} textarea />
        <FR><FI label="Applicability" field="applicability_status" fv={fv} setFv={setFv} select={['Applicable', 'Not Applicable', 'Unknown']} /><FI label="Validation Status" field="validation_status" fv={fv} setFv={setFv} select={['Valid', 'Invalid', 'Pending']} /></FR>
      </FM>

      <FM opened={modal === 'poi'} onClose={close} title="Add POI Capture" saving={saving}
        onSubmit={() => save('/sia/mobile-poi-captures', { field_session_id: sid, captured_by: uid, captured_at: new Date().toISOString(), ...fv }, rPc)}>
        <FR><FI label="POI ID *" field="poi_id" fv={fv} setFv={setFv} /><FI label="Geometry Type" field="geometry_type" fv={fv} setFv={setFv} select={['Point', 'LineString', 'Polygon']} /></FR>
        <FI label="Geometry Data (GeoJSON)" field="geometry_data" fv={fv} setFv={setFv} textarea />
        <FI label="GPS Accuracy (m)" field="gps_accuracy" fv={fv} setFv={setFv} number />
      </FM>

      <FM opened={modal === 'photo'} onClose={close} title="Add Photo Capture" saving={saving}
        onSubmit={() => save('/sia/mobile-photo-captures', { field_session_id: sid, captured_by: uid, captured_at: new Date().toISOString(), ...fv }, rPh)}>
        <FR><FI label="File Name" field="file_name" fv={fv} setFv={setFv} /><FI label="POI ID (optional)" field="poi_id" fv={fv} setFv={setFv} /></FR>
        <FI label="File Path" field="file_path" fv={fv} setFv={setFv} />
        <FR><FI label="Latitude" field="latitude" fv={fv} setFv={setFv} number /><FI label="Longitude" field="longitude" fv={fv} setFv={setFv} number /></FR>
        <FR><FI label="GPS Accuracy (m)" field="gps_accuracy" fv={fv} setFv={setFv} number /><FI label="Direction (°)" field="direction" fv={fv} setFv={setFv} number /></FR>
        <FI label="Annotation" field="annotation" fv={fv} setFv={setFv} textarea />
      </FM>

      <FM opened={modal === 'video'} onClose={close} title="Add Video Capture" saving={saving}
        onSubmit={() => save('/sia/mobile-video-captures', { field_session_id: sid, captured_by: uid, captured_at: new Date().toISOString(), ...fv }, rVi)}>
        <FR><FI label="File Name" field="file_name" fv={fv} setFv={setFv} /><FI label="POI ID (optional)" field="poi_id" fv={fv} setFv={setFv} /></FR>
        <FI label="File Path" field="file_path" fv={fv} setFv={setFv} />
        <FR><FI label="Start Latitude" field="start_latitude" fv={fv} setFv={setFv} number /><FI label="Start Longitude" field="start_longitude" fv={fv} setFv={setFv} number /></FR>
        <FI label="Spoken Note" field="spoken_note" fv={fv} setFv={setFv} textarea />
      </FM>

      <FM opened={modal === 'measure'} onClose={close} title="Add Measurement" saving={saving}
        onSubmit={() => save('/sia/mobile-measurements', { field_session_id: sid, measured_by: uid, measured_at: new Date().toISOString(), ...fv }, rMe)}>
        <FR><FI label="Measurement Type" field="measurement_type" fv={fv} setFv={setFv} /><FI label="Unit" field="unit" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Value" field="measurement_value" fv={fv} setFv={setFv} number /><FI label="Method" field="measurement_method" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Instrument Serial" field="instrument_serial" fv={fv} setFv={setFv} /><FI label="Calibration Status" field="calibration_status" fv={fv} setFv={setFv} select={['Valid', 'Expired', 'Pending']} /></FR>
        <FR><FI label="Accuracy" field="accuracy" fv={fv} setFv={setFv} number /><FI label="Tolerance" field="tolerance" fv={fv} setFv={setFv} number /></FR>
        <FR><FI label="Latitude" field="latitude" fv={fv} setFv={setFv} number /><FI label="Longitude" field="longitude" fv={fv} setFv={setFv} number /></FR>
      </FM>

      <FM opened={modal === 'nameplate'} onClose={close} title="Add Nameplate Capture" saving={saving}
        onSubmit={() => save('/sia/mobile-nameplate-captures', { field_session_id: sid, confirmed_by: uid, captured_at: new Date().toISOString(), ...fv }, rNp)}>
        <FI label="Image File Path" field="image_file_path" fv={fv} setFv={setFv} />
        <FI label="OCR Text" field="ocr_text" fv={fv} setFv={setFv} textarea />
        <FI label="Proposed Data" field="proposed_data" fv={fv} setFv={setFv} textarea />
        <FI label="Confirmed Data" field="confirmed_data" fv={fv} setFv={setFv} textarea />
        <Group mt="sm" gap="xs"><Text size="xs" fw={600} c="#374151">User Confirmed</Text>
          <Switch checked={!!fv.user_confirmed} onChange={e => { const v = e.currentTarget.checked; setFv(p => ({ ...p, user_confirmed: v })); }} color="green" /></Group>
      </FM>

      <FM opened={modal === 'voice'} onClose={close} title="Add Voice Note" saving={saving}
        onSubmit={() => save('/sia/mobile-voice-notes', { field_session_id: sid, recorded_by: uid, recorded_at: new Date().toISOString(), ...fv }, rVn)}>
        <FI label="Audio File Path" field="audio_file_path" fv={fv} setFv={setFv} />
        <FI label="Transcription" field="transcription" fv={fv} setFv={setFv} textarea />
        <FI label="Transcription Status" field="transcription_status" fv={fv} setFv={setFv} select={['Pending', 'Completed', 'Failed']} />
      </FM>

      <FM opened={modal === 'sketch'} onClose={close} title="Add Sketch" saving={saving}
        onSubmit={() => save('/sia/mobile-sketches', { field_session_id: sid, created_by: uid, ...fv }, rSk)}>
        <FR><FI label="Sketch Type" field="sketch_type" fv={fv} setFv={setFv} /><FI label="File Path" field="file_path" fv={fv} setFv={setFv} /></FR>
        <FI label="Description" field="description" fv={fv} setFv={setFv} textarea />
      </FM>

      <FM opened={modal === 'aicheck'} onClose={close} title="Add AI Check" saving={saving}
        onSubmit={() => save('/sia/mobile-ai-checks', { field_session_id: sid, checked_at: new Date().toISOString(), ...fv }, rAi)}>
        <FR><FI label="Check Type" field="check_type" fv={fv} setFv={setFv} select={AI_CHECKS} /><FI label="Result" field="result" fv={fv} setFv={setFv} select={['Pass', 'Fail', 'Warning', 'Skipped']} /></FR>
        <FR><FI label="Confidence Score (0–1)" field="confidence_score" fv={fv} setFv={setFv} number /><FI label="Source Record Type" field="source_record_type" fv={fv} setFv={setFv} /></FR>
        <FI label="Message" field="message" fv={fv} setFv={setFv} textarea />
        <Group mt="sm" gap="xs"><Text size="xs" fw={600} c="#374151">User Confirmed</Text>
          <Switch checked={!!fv.user_confirmed} onChange={e => { const v = e.currentTarget.checked; setFv(p => ({ ...p, user_confirmed: v })); }} color="green" /></Group>
      </FM>

      <FM opened={modal === 'reqev'} onClose={close} title="Add Required Evidence Status" saving={saving}
        onSubmit={() => save('/sia/required-evidence-status', { field_session_id: sid, updated_by: uid, updated_at: new Date().toISOString(), ...fv }, rRe)}>
        <FI label="Survey Requirement ID *" field="survey_requirement_id" fv={fv} setFv={setFv} />
        <FI label="Evidence Status *" field="evidence_status" fv={fv} setFv={setFv} select={EV_STATUS} />
        <FI label="Exception Reason" field="exception_reason" fv={fv} setFv={setFv} textarea />
        <FR><FI label="Evidence ID (optional)" field="evidence_id" fv={fv} setFv={setFv} /><FI label="Data Gap ID (optional)" field="data_gap_id" fv={fv} setFv={setFv} /></FR>
      </FM>

      <FM opened={modal === 'exitgate'} onClose={close} title="Add Site Exit Gate" saving={saving}
        onSubmit={() => save('/sia/site-exit-gates', { field_session_id: sid, completed_by: uid, completed_at: new Date().toISOString(), ...fv }, rEg)}>
        <FI label="Survey Visit ID *" field="survey_visit_id" fv={fv} setFv={setFv} />
        <FR><FI label="Mandatory Count" field="mandatory_count" fv={fv} setFv={setFv} number /><FI label="Completed Count" field="completed_count" fv={fv} setFv={setFv} number /></FR>
        <FR><FI label="Exception Count" field="exception_count" fv={fv} setFv={setFv} number /><FI label="Unresolved Count" field="unresolved_count" fv={fv} setFv={setFv} number /></FR>
        <FR><FI label="Gate Status" field="gate_status" fv={fv} setFv={setFv} select={['Open', 'Passed', 'Blocked']} /><FI label="Exit Decision" field="exit_decision" fv={fv} setFv={setFv} select={EXIT_DEC} /></FR>
        <FI label="Exit Comment" field="exit_comment" fv={fv} setFv={setFv} textarea />
      </FM>

      <FM opened={modal === 'storage'} onClose={close} title="Add Storage Status" saving={saving}
        onSubmit={() => save('/sia/mobile-storage-status', { device_id: did, recorded_at: new Date().toISOString(), ...fv }, rSt)}>
        <FR><FI label="Total MB" field="total_storage_mb" fv={fv} setFv={setFv} number /><FI label="Used MB" field="used_storage_mb" fv={fv} setFv={setFv} number /></FR>
        <FR><FI label="Free MB" field="free_storage_mb" fv={fv} setFv={setFv} number /><FI label="Pending Media Count" field="pending_media_count" fv={fv} setFv={setFv} number /></FR>
        <FI label="Warning Status" field="warning_status" fv={fv} setFv={setFv} select={['None', 'Low Storage', 'Critical']} />
      </FM>

      <FM opened={modal === 'syncq'} onClose={close} title="Add Sync Queue Item" saving={saving}
        onSubmit={() => save('/sia/sync-queue', { device_id: did, ...fv }, rSq)}>
        <FR><FI label="Operation Type" field="operation_type" fv={fv} setFv={setFv} select={['CREATE', 'UPDATE', 'DELETE', 'SYNC']} /><FI label="Record Type" field="record_type" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Record ID" field="record_id" fv={fv} setFv={setFv} /><FI label="Idempotency Key" field="idempotency_key" fv={fv} setFv={setFv} /></FR>
        <FI label="Sync Status" field="sync_status" fv={fv} setFv={setFv} select={SYNC_STATUS} />
      </FM>

      <FM opened={modal === 'batch'} onClose={close} title="Add Sync Batch" saving={saving}
        onSubmit={() => save('/sia/sync-batches', { device_id: did, sync_started_at: new Date().toISOString(), ...fv }, rBt)}>
        <FR><FI label="Batch Code *" field="batch_code" fv={fv} setFv={setFv} /><FI label="Batch Status" field="batch_status" fv={fv} setFv={setFv} select={SYNC_STATUS} /></FR>
        <FR><FI label="Total Items" field="total_items" fv={fv} setFv={setFv} number /><FI label="Accepted Items" field="accepted_items" fv={fv} setFv={setFv} number /></FR>
        <FR><FI label="Rejected Items" field="rejected_items" fv={fv} setFv={setFv} number /><FI label="Quarantined Items" field="quarantined_items" fv={fv} setFv={setFv} number /></FR>
      </FM>

      <FM opened={modal === 'conflict'} onClose={close} title="Add Sync Conflict" saving={saving}
        onSubmit={() => save('/sia/sync-conflicts', { sync_batch_id: bid, resolved_by: uid, ...fv }, rCf)}>
        <FR><FI label="Record Type" field="record_type" fv={fv} setFv={setFv} /><FI label="Conflict Type" field="conflict_type" fv={fv} setFv={setFv} /></FR>
        <FI label="Local Value" field="local_value" fv={fv} setFv={setFv} textarea />
        <FI label="Server Value" field="server_value" fv={fv} setFv={setFv} textarea />
        <FI label="Resolution Status" field="resolution_status" fv={fv} setFv={setFv} select={['Unresolved', 'Resolved', 'Escalated']} />
      </FM>

      <FM opened={modal === 'receipt'} onClose={close} title="Add Integrity Receipt" saving={saving}
        onSubmit={() => save('/sia/sync-integrity-receipts', { sync_batch_id: bid, received_at: new Date().toISOString(), ...fv }, rRc)}>
        <FR><FI label="Receipt Code" field="receipt_code" fv={fv} setFv={setFv} /><FI label="Manifest Hash" field="manifest_hash" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Integrity Status" field="integrity_status" fv={fv} setFv={setFv} select={['Pass', 'Fail', 'Partial']} /></FR>
        <FR><FI label="Accepted" field="accepted_count" fv={fv} setFv={setFv} number /><FI label="Rejected" field="rejected_count" fv={fv} setFv={setFv} number /></FR>
        <FI label="Quarantined" field="quarantined_count" fv={fv} setFv={setFv} number />
      </FM>

      <FM opened={modal === 'pack'} onClose={close} title="Create Portable Data Pack" saving={saving}
        onSubmit={() => save('/sia/portable-data-packs', { sia_case_id: caseId, created_by: uid, ...fv }, rPk)}>
        <FR><FI label="Pack Code *" field="pack_code" fv={fv} setFv={setFv} /><FI label="Site ID *" field="site_id" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Pack Version" field="pack_version" fv={fv} setFv={setFv} /><FI label="Schema Version" field="schema_version" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Export Method" field="export_method" fv={fv} setFv={setFv} select={['USB', 'QR', 'Bluetooth', 'Upload']} /><FI label="Pack Status" field="pack_status" fv={fv} setFv={setFv} select={['Draft', 'Exported', 'Imported']} /></FR>
        <FI label="Checksum" field="checksum" fv={fv} setFv={setFv} />
      </FM>

      <FM opened={modal === 'audit'} onClose={close} title="Add Device Audit Event" saving={saving}
        onSubmit={() => save('/sia/device-audits', { device_id: did, user_id: uid, server_timestamp: new Date().toISOString(), ...fv }, rAu)}>
        <FR><FI label="Event Type" field="event_type" fv={fv} setFv={setFv} /><FI label="Local Timestamp" field="local_timestamp" fv={fv} setFv={setFv} /></FR>
        <FI label="Timezone Offset (e.g. +10:00)" field="timezone_offset" fv={fv} setFv={setFv} />
        <FI label="Event Details" field="event_details" fv={fv} setFv={setFv} textarea />
        <Group mt="sm" gap="xs"><Text size="xs" fw={600} c="#374151">Clock Anomaly</Text>
          <Switch checked={!!fv.clock_anomaly} onChange={e => { const v = e.currentTarget.checked; setFv(p => ({ ...p, clock_anomaly: v })); }} color="red" /></Group>
      </FM>
    </Box>
  );
}

// ── SessionsPanel — loads sessions for a download ────────
function SessionsPanel({ dlid, selSess, setSess, setTab, did, uid, open }) {
  const { data: sessions, loading } = useApi(dlid ? `${API}/sia/field-case-downloads/${dlid}/sessions` : null, [dlid]);
  if (!dlid) return <Text size="sm" c="dimmed" py="md">Select a download to see sessions.</Text>;
  if (loading) return <Group justify="center" py="xl"><Loader color="green" size="sm" /></Group>;
  if (sessions.length === 0) return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">No sessions found.</Text>
      <Button size="xs" color="green" style={{ backgroundColor: '#007336', width: 140 }}
        leftSection={<IconPlus size={13} />}
        onClick={() => open('session', { field_case_download_id: dlid, device_id: did, user_id: uid })}>
        Start Session
      </Button>
    </Stack>
  );
  return (
    <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <Table verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
          <Table.Tr>
            {['Survey Visit ID', 'Status', 'Offline', 'Started At', 'Ended At'].map(c =>
              <Table.Th key={c} style={thS}>{c}</Table.Th>)}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sessions.map(r => (
            <Table.Tr key={r.id} onClick={() => { setSess(r); setTab('forms'); }}
              style={{ cursor: 'pointer', backgroundColor: selSess?.id === r.id ? '#f0fdf4' : 'transparent' }}
              onMouseEnter={e => { if (selSess?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
              onMouseLeave={e => { if (selSess?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
              <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.survey_visit_id}</Text></Table.Td>
              <Table.Td><Badge size="sm" color={r.session_status === 'Completed' ? 'green' : r.session_status === 'Active' ? 'blue' : 'gray'} variant="light">{r.session_status || '—'}</Badge></Table.Td>
              <Table.Td><Badge size="sm" color={r.offline_mode ? 'orange' : 'gray'} variant="light">{r.offline_mode ? 'Offline' : 'Online'}</Badge></Table.Td>
              <Table.Td><Text size="xs" c="#6b7280">{r.started_at || '—'}</Text></Table.Td>
              <Table.Td><Text size="xs" c="#6b7280">{r.ended_at || '—'}</Text></Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
