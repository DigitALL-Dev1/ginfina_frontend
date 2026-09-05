import { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader, Modal,
  Paper, Select, Stack, Tabs, Table, Text, Textarea,
  TextInput, Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconFile, IconRobot, IconAlertTriangle,
  IconDatabase, IconShieldCheck, IconBulb, IconClipboardCheck,
  IconX, IconCheck, IconBolt, IconLock,
} from '@tabler/icons-react';
import SIAStepFlow from '../components/common/SIAStepFlow';
import { autoCode } from '../utils/autoCode';

const API = '/api';
const thS = { fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' };

const RELIABILITY = ['Confirmed', 'Estimated', 'Unverified', 'Not Assessed'];
const PRIORITY_OPTS = ['Low', 'Medium', 'High', 'Critical'];
const STATUS_OPTS = ['Open', 'In Progress', 'Closed', 'Not Applicable'];
const DISPOSITIONS = ['ACCEPTED', 'REJECTED', 'MODIFIED', 'ESCALATED'];
const READINESS_ST = ['NOT_ASSESSED', 'READY', 'CONDITIONAL', 'BLOCKED', 'NOT_APPLICABLE'];
const RECORD_TYPES = ['CONSTRAINT', 'ASSUMPTION'];

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
    <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 8, minHeight: 110 }}>
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
function FI({ label, field, fv, setFv, textarea, select }) {
  const val = fv[field] ?? '';
  const upd = v => setFv(p => ({ ...p, [field]: v }));
  
  // Auto-detect Type, Role, and Date fields
  const fieldLower = field.toLowerCase();
  const isTypeOrRoleField = fieldLower.includes('type') || fieldLower.includes('role');
  const isDateField = fieldLower.includes('date') || fieldLower.includes('_at');
  const getTypeRoleOptions = (fn) => {
    const opts = {
      evidence_type: ['Photograph', 'Document', 'Measurement', 'Video', 'Audio Recording', 'Drawing', 'Report'],
      source_type: ['Site Survey', 'Field Observation', 'Laboratory Test', 'Engineering Analysis', 'Vendor Documentation', 'Client Provided'],
      task_type: ['Object Detection', 'Classification', 'Measurement', 'Analysis', 'Anomaly Detection'],
      conflict_type: ['Data Mismatch', 'Specification Conflict', 'Regulatory Conflict', 'Design Conflict', 'Schedule Conflict'],
      action_type: ['RFI', 'TQ', 'Clarification', 'Site Visit', 'Follow-up Required'],
      record_type: ['Constraint', 'Gap', 'Risk', 'Assumption'],
    };
    return opts[fn] || [];
  };
  const autoOpts = getTypeRoleOptions(field);
  
  const s = { input: { borderColor: '#d1d5db', borderRadius: 6, height: textarea ? undefined : 36 } };
  if (select) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <Select data={select} value={val} onChange={v => upd(v || '')} clearable styles={s} /></Box>;
  if (textarea) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <Textarea value={val} onChange={e => upd(e.target.value)} autosize minRows={2} styles={s} /></Box>;
  
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
    <TextInput value={val} onChange={e => upd(e.target.value)} styles={s} /></Box>;
}
function SBadge({ v }) {
  const m = {
    ready: '#007336', confirmed: '#007336', accepted: '#007336', closed: '#007336', verified: '#007336',
    conditional: '#f08c00', estimated: '#f08c00', modified: '#f08c00', 'in progress': '#1971c2',
    blocked: '#e03131', rejected: '#e03131', critical: '#e03131',
    not_assessed: '#6b7280', not_applicable: '#6b7280', open: '#1971c2', escalated: '#9c36b5',
  };
  const col = m[(v || '').toLowerCase().replace(/ /g, '_')] || '#6b7280';
  return <Badge size="sm" radius="xl"
    style={{ backgroundColor: col + '18', color: col, border: 'none', fontWeight: 600 }}>{v || '—'}</Badge>;
}

// ════════════════════════════════════════════════════════
export default function SIAEvidenceAIReadinessLayout() {
  const [caseId, setCaseId]       = useState(() => localStorage.getItem('sia_case_id') || '');
  const [loadedCaseId, setLoaded] = useState(() => localStorage.getItem('sia_case_id') || '');
  const [activeTab, setTab] = useState('evidence');

  // selected parent records for child tabs
  const [selEvidence, setSelEvidence] = useState(null);
  const [selAIObs, setSelAIObs] = useState(null);
  const [selConflict, setSelConflict] = useState(null);
  const [selGap, setSelGap] = useState(null);
  const [selReadiness, setSelReadiness] = useState(null);

  // ── case-level data ──────────────────────────────────
  const { data: evidence, loading: evL, reload: rEv } = useApi(loadedCaseId ? `${API}/sia/cases/${loadedCaseId}/evidence` : null, [loadedCaseId]);
  const { data: sourceFacts, loading: sfL, reload: rSf } = useApi(loadedCaseId ? `${API}/sia/cases/${loadedCaseId}/source-facts` : null, [loadedCaseId]);
  const { data: aiObs, loading: aoL, reload: rAo } = useApi(loadedCaseId ? `${API}/sia/cases/${loadedCaseId}/ai-observations` : null, [loadedCaseId]);
  const { data: conflicts, loading: cfL, reload: rCf } = useApi(loadedCaseId ? `${API}/sia/cases/${loadedCaseId}/conflicts` : null, [loadedCaseId]);
  const { data: dataGaps, loading: dgL, reload: rDg } = useApi(loadedCaseId ? `${API}/sia/cases/${loadedCaseId}/data-gaps` : null, [loadedCaseId]);
  const { data: constraints, loading: cnL, reload: rCn } = useApi(loadedCaseId ? `${API}/sia/cases/${loadedCaseId}/constraints-assumptions` : null, [loadedCaseId]);
  const { data: readinessList, loading: rlL, reload: rRl } = useApi(loadedCaseId ? `${API}/sia/cases/${loadedCaseId}/discipline-readiness` : null, [loadedCaseId]);
  const { data: rfiActions, loading: rfL, reload: rRfi } = useApi(loadedCaseId ? `${API}/sia/cases/${loadedCaseId}/rfi-actions` : null, [loadedCaseId]);

  // ── child data ───────────────────────────────────────
  const eid = selEvidence?.id;
  const aoid = selAIObs?.id;
  const cfid = selConflict?.id;
  const dgid = selGap?.id;
  const rid = selReadiness?.id;

  const { data: evVerifs, loading: vfL, reload: rVf } = useApi(eid ? `${API}/sia/evidence/${eid}/verifications` : null, [eid]);
  const { data: aiDisps, loading: adL, reload: rAd } = useApi(aoid ? `${API}/sia/ai-observations/${aoid}/dispositions` : null, [aoid]);
  const { data: cfResols, loading: crL, reload: rCr } = useApi(cfid ? `${API}/sia/conflicts/${cfid}/resolutions` : null, [cfid]);
  const { data: gapRfis, loading: grL, reload: rGr } = useApi(dgid ? `${API}/sia/data-gaps/${dgid}/rfi-actions` : null, [dgid]);
  const { data: readyConds, loading: rcL, reload: rRc } = useApi(rid ? `${API}/sia/discipline-readiness/${rid}/conditions` : null, [rid]);
  const { data: readyBlkrs, loading: rbL, reload: rRb } = useApi(rid ? `${API}/sia/discipline-readiness/${rid}/blockers` : null, [rid]);
  const { data: readyRevs, loading: rrL, reload: rRr } = useApi(rid ? `${API}/sia/discipline-readiness/${rid}/reviews` : null, [rid]);

  // ── modal / form ─────────────────────────────────────
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fv, setFv] = useState({});

  const openModal = (key, defaults = {}) => {
    const codePrefills = {
      evidence:   { evidence_code: autoCode('EVD') },
      aiobs:      { observation_code: autoCode('OBS') },
      conflict:   { conflict_code: autoCode('CON') },
      datagap:    { gap_code: autoCode('DG') },
      rfi:        { action_code: autoCode('RFI') },
    };
    setFv({ ...(codePrefills[key] || {}), ...defaults });
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
    const id = localStorage.getItem('sia_case_id') || caseId;
    if (!id) return;
    setCaseId(id);
    setLoaded(id);
    setSelEvidence(null); setSelAIObs(null); setSelConflict(null);
    setSelGap(null); setSelReadiness(null);
    setTab('evidence');
  };

  const uid = localStorage.getItem('user_id') || 'unknown';

  // ════════════════════════════════════════════════════
  return (
    <Box p="lg">
      {/* Header */}
      <Box mb="lg">
        <Group gap="sm" mb={4}>
          <Badge color="green" variant="light" size="lg" radius="sm">SIA</Badge>
          <Text size="xs" c="dimmed" fw={500}>Module 1 · Section 5</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">Evidence, AI and Readiness</Title>
        <Text size="sm" c="#6b7280" mt={4}>
          Manage evidence, source facts, AI observations, conflicts, data gaps, constraints, RFI actions and discipline readiness.
        </Text>
      </Box>

      {/* Case ID loader */}
      <Paper p="sm" mb="md" style={{ border:'1px solid #e5e7eb', borderRadius:8, backgroundColor:'#f9fafb' }}>
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Text size="xs" fw={700} c="#374151">Active SIA Case:</Text>
            {loadedCaseId
              ? <Text size="xs" fw={600} c="#007336" style={{ fontFamily:'monospace' }}>{loadedCaseId}</Text>
              : <Text size="xs" c="red">No active case — create one in Start and Case Control first.</Text>}
          </Group>
          <Button size="xs" variant="subtle" color="green" onClick={handleLoad} disabled={!loadedCaseId}>Reload</Button>
        </Group>
      </Paper>

      {/* Context strip */}
      {(selEvidence || selAIObs || selConflict || selGap || selReadiness) && (
        <Paper p="sm" mb="md" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
          <Group gap="xl" wrap="wrap">
            {selEvidence && <Text size="xs" c="#374151">Evidence: <Text span fw={700} c="#007336">{selEvidence.evidence_code}</Text></Text>}
            {selAIObs && <Text size="xs" c="#374151">AI Obs: <Text span fw={700} c="#007336">{selAIObs.observation_code}</Text></Text>}
            {selConflict && <Text size="xs" c="#374151">Conflict: <Text span fw={700} c="#007336">{selConflict.conflict_code || selConflict.id}</Text></Text>}
            {selGap && <Text size="xs" c="#374151">Gap: <Text span fw={700} c="#007336">{selGap.gap_code || selGap.id}</Text></Text>}
            {selReadiness && <Text size="xs" c="#374151">Readiness: <Text span fw={700} c="#007336">{selReadiness.discipline}</Text></Text>}
            <Text size="xs" c="#9ca3af" style={{ marginLeft: 'auto', cursor: 'pointer' }}
              onClick={() => { setSelEvidence(null); setSelAIObs(null); setSelConflict(null); setSelGap(null); setSelReadiness(null); }}>
              Clear
            </Text>
          </Group>
        </Paper>
      )}

      {/* Tabs */}
      {loadedCaseId && (
        <Tabs value={activeTab} onChange={setTab} color="green">
          <SIAStepFlow
            activeTab={activeTab}
            onStep={setTab}
            steps={[
              { value:'evidence',    label:'Evidence',               icon:<IconFile size={13}/>,           enabled:true },
              { value:'ev-verif',    label:'Verifications',          icon:<IconShieldCheck size={13}/>,    enabled:!!selEvidence },
              { value:'sourcefacts', label:'Source Facts',           icon:<IconDatabase size={13}/>,       enabled:true },
              { value:'aiobs',       label:'AI Observations',        icon:<IconRobot size={13}/>,          enabled:true },
              { value:'aidisp',      label:'AI Dispositions',        icon:<IconBolt size={13}/>,           enabled:!!selAIObs },
              { value:'conflicts',   label:'Conflicts',              icon:<IconAlertTriangle size={13}/>,  enabled:true },
              { value:'cf-resol',    label:'Resolutions',            icon:<IconCheck size={13}/>,          enabled:!!selConflict },
              { value:'datagaps',    label:'Data Gaps',              icon:<IconX size={13}/>,              enabled:true },
              { value:'rfi',         label:'RFI Actions',            icon:<IconClipboardCheck size={13}/>, enabled:true },
              { value:'gap-rfi',     label:'Gap RFIs',               icon:<IconClipboardCheck size={13}/>, enabled:!!selGap },
              { value:'constraints', label:'Constraints',            icon:<IconLock size={13}/>,           enabled:true },
              { value:'readiness',   label:'Readiness',              icon:<IconBulb size={13}/>,           enabled:true },
              { value:'r-conds',     label:'Conditions',             icon:<IconCheck size={13}/>,          enabled:!!selReadiness },
              { value:'r-blockers',  label:'Blockers',               icon:<IconX size={13}/>,              enabled:!!selReadiness },
              { value:'r-reviews',   label:'Reviews',                icon:<IconShieldCheck size={13}/>,    enabled:!!selReadiness },
            ]}
          />
          <Tabs.List style={{ display:'none' }}>
            <Tabs.Tab value="evidence">Evidence</Tabs.Tab>
            <Tabs.Tab value="ev-verif">Verifications</Tabs.Tab>
            <Tabs.Tab value="sourcefacts">Source Facts</Tabs.Tab>
            <Tabs.Tab value="aiobs">AI Observations</Tabs.Tab>
            <Tabs.Tab value="aidisp">AI Dispositions</Tabs.Tab>
            <Tabs.Tab value="conflicts">Conflicts</Tabs.Tab>
            <Tabs.Tab value="cf-resol">Resolutions</Tabs.Tab>
            <Tabs.Tab value="datagaps">Data Gaps</Tabs.Tab>
            <Tabs.Tab value="rfi">RFI Actions</Tabs.Tab>
            <Tabs.Tab value="gap-rfi">Gap RFIs</Tabs.Tab>
            <Tabs.Tab value="constraints">Constraints</Tabs.Tab>
            <Tabs.Tab value="readiness">Readiness</Tabs.Tab>
            <Tabs.Tab value="r-conds">Conditions</Tabs.Tab>
            <Tabs.Tab value="r-blockers">Blockers</Tabs.Tab>
            <Tabs.Tab value="r-reviews">Reviews</Tabs.Tab>
          </Tabs.List>

          {/* EVIDENCE */}
          <Tabs.Panel value="evidence">
            <TabHeader title="Evidence" onAdd={() => openModal('evidence')} addLabel="Add Evidence" />
            <DataTable loading={evL} cols={['Code', 'Type', 'Source', 'File', 'Captured At', 'Reliability', 'Status']}
              rows={evidence} render={r => (
                <Table.Tr key={r.id} onClick={() => { setSelEvidence(r); setTab('ev-verif'); }}
                  style={{ cursor: 'pointer', backgroundColor: selEvidence?.id === r.id ? '#f0fdf4' : 'transparent' }}
                  onMouseEnter={e => { if (selEvidence?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={e => { if (selEvidence?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.evidence_code}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.evidence_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.source_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={160}>{r.file_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.captured_at || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                  <Table.Td><SBadge v={r.evidence_status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* EVIDENCE VERIFICATIONS */}
          <Tabs.Panel value="ev-verif">
            <TabHeader title={`Verifications — ${selEvidence?.evidence_code || ''}`}
              onAdd={() => openModal('evverif')} addLabel="Add Verification" />
            <DataTable loading={vfL} cols={['Verified By', 'Status', 'Comment', 'Verified At']}
              rows={evVerifs} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.verified_by || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.verification_status} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={200}>{r.verification_comment || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.verified_at || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* SOURCE FACTS */}
          <Tabs.Panel value="sourcefacts">
            <TabHeader title="Source Facts" onAdd={() => openModal('sourcefact')} addLabel="Add Fact" />
            <DataTable loading={sfL} cols={['Fact Name', 'Value', 'Unit', 'Source', 'Reliability', 'Status']}
              rows={sourceFacts} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" fw={600}>{r.fact_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={150}>{r.fact_value || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.unit || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.source_type || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                  <Table.Td><SBadge v={r.fact_status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* AI OBSERVATIONS */}
          <Tabs.Panel value="aiobs">
            <TabHeader title="AI Observations" onAdd={() => openModal('aiobs')} addLabel="Add Observation" />
            <DataTable loading={aoL} cols={['Code', 'Task Type', 'Model', 'Confidence', 'Reliability']}
              rows={aiObs} render={r => (
                <Table.Tr key={r.id} onClick={() => { setSelAIObs(r); setTab('aidisp'); }}
                  style={{ cursor: 'pointer', backgroundColor: selAIObs?.id === r.id ? '#f0fdf4' : 'transparent' }}
                  onMouseEnter={e => { if (selAIObs?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={e => { if (selAIObs?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.observation_code}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.task_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.model_name || '—'} {r.model_version ? `v${r.model_version}` : ''}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.confidence_score != null ? `${(r.confidence_score * 100).toFixed(0)}%` : '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* AI DISPOSITIONS */}
          <Tabs.Panel value="aidisp">
            <TabHeader title={`Dispositions — ${selAIObs?.observation_code || ''}`}
              onAdd={() => openModal('aidisp')} addLabel="Add Disposition" />
            <DataTable loading={adL} cols={['Disposition', 'Reviewer', 'Comment', 'Modified Value', 'At']}
              rows={aiDisps} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><SBadge v={r.disposition} /></Table.Td>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.reviewer_user_id || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={180}>{r.reviewer_comment || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={120}>{r.modified_value || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.disposition_at || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* CONFLICTS */}
          <Tabs.Panel value="conflicts">
            <TabHeader title="Conflicts" onAdd={() => openModal('conflict')} addLabel="Add Conflict" />
            <DataTable loading={cfL} cols={['Code', 'Discipline', 'Type', 'Source A', 'Source B', 'Priority', 'Status']}
              rows={conflicts} render={r => (
                <Table.Tr key={r.id} onClick={() => { setSelConflict(r); setTab('cf-resol'); }}
                  style={{ cursor: 'pointer', backgroundColor: selConflict?.id === r.id ? '#f0fdf4' : 'transparent' }}
                  onMouseEnter={e => { if (selConflict?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={e => { if (selConflict?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.conflict_code || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.discipline || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.conflict_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280" truncate maw={120}>{r.source_a || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280" truncate maw={120}>{r.source_b || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.priority} /></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* CONFLICT RESOLUTIONS */}
          <Tabs.Panel value="cf-resol">
            <TabHeader title={`Resolutions — ${selConflict?.conflict_code || selConflict?.id || ''}`}
              onAdd={() => openModal('cfresol')} addLabel="Add Resolution" />
            <DataTable loading={crL} cols={['Accepted Value', 'Resolution Reason', 'Status', 'Resolved By', 'Resolved At']}
              rows={cfResols} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" truncate maw={150}>{r.accepted_value || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={180}>{r.resolution_reason || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.resolution_status} /></Table.Td>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.resolved_by || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.resolved_at || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* DATA GAPS */}
          <Tabs.Panel value="datagaps">
            <TabHeader title="Data Gaps" onAdd={() => openModal('datagap')} addLabel="Add Gap" />
            <DataTable loading={dgL} cols={['Code', 'Discipline', 'Priority', 'Target Date', 'Status', 'Description']}
              rows={dataGaps} render={r => (
                <Table.Tr key={r.id} onClick={() => { setSelGap(r); setTab('gap-rfi'); }}
                  style={{ cursor: 'pointer', backgroundColor: selGap?.id === r.id ? '#f0fdf4' : 'transparent' }}
                  onMouseEnter={e => { if (selGap?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={e => { if (selGap?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.gap_code || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.discipline || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.priority} /></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.target_date || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={200}>{r.gap_description || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* RFI ACTIONS (all case-level) */}
          <Tabs.Panel value="rfi">
            <TabHeader title="RFI Actions" onAdd={() => openModal('rfi')} addLabel="Add RFI Action" />
            <DataTable loading={rfL} cols={['Code', 'Type', 'Subject', 'Assigned To', 'Target Date', 'Status']}
              rows={rfiActions} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.action_code || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.action_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" truncate maw={200}>{r.subject || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.assigned_to || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.target_date || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* GAP-LEVEL RFIs */}
          <Tabs.Panel value="gap-rfi">
            <TabHeader title={`RFI Actions for Gap — ${selGap?.gap_code || selGap?.id || ''}`}
              onAdd={() => openModal('rfi', { data_gap_id: dgid })} addLabel="Add RFI for Gap" />
            <DataTable loading={grL} cols={['Code', 'Type', 'Subject', 'Assigned To', 'Status']}
              rows={gapRfis} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.action_code || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.action_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" truncate maw={200}>{r.subject || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.assigned_to || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* CONSTRAINTS / ASSUMPTIONS */}
          <Tabs.Panel value="constraints">
            <TabHeader title="Constraints and Assumptions" onAdd={() => openModal('constraint')} addLabel="Add Record" />
            <DataTable loading={cnL} cols={['Type', 'Discipline', 'Reliability', 'Status', 'Description']}
              rows={constraints} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Badge size="sm" color={r.record_type === 'CONSTRAINT' ? 'red' : 'orange'} variant="light">{r.record_type || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{r.discipline || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={220}>{r.description || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* DISCIPLINE READINESS */}
          <Tabs.Panel value="readiness">
            <TabHeader title="Discipline Readiness" onAdd={() => openModal('readiness')} addLabel="Add Readiness" />
            <DataTable loading={rlL} cols={['Discipline', 'Readiness Status', 'Assessment Date', 'Summary']}
              rows={readinessList} render={r => (
                <Table.Tr key={r.id} onClick={() => { setSelReadiness(r); setTab('r-conds'); }}
                  style={{ cursor: 'pointer', backgroundColor: selReadiness?.id === r.id ? '#f0fdf4' : 'transparent' }}
                  onMouseEnter={e => { if (selReadiness?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={e => { if (selReadiness?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <Table.Td><Text size="sm" fw={600}>{r.discipline}</Text></Table.Td>
                  <Table.Td><SBadge v={r.readiness_status} /></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.assessment_date || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={220}>{r.summary || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* READINESS CONDITIONS */}
          <Tabs.Panel value="r-conds">
            <TabHeader title={`Conditions — ${selReadiness?.discipline || ''}`}
              onAdd={() => openModal('rcond')} addLabel="Add Condition" />
            <DataTable loading={rcL} cols={['Condition', 'Required Action', 'Target Date', 'Status']}
              rows={readyConds} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" truncate maw={200}>{r.condition_description || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={200}>{r.required_action || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.target_date || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* READINESS BLOCKERS */}
          <Tabs.Panel value="r-blockers">
            <TabHeader title={`Blockers — ${selReadiness?.discipline || ''}`}
              onAdd={() => openModal('rblocker')} addLabel="Add Blocker" />
            <DataTable loading={rbL} cols={['Blocker Type', 'Severity', 'Status', 'Description']}
              rows={readyBlkrs} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.blocker_type || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.severity} /></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={240}>{r.blocker_description || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* READINESS REVIEWS */}
          <Tabs.Panel value="r-reviews">
            <TabHeader title={`Reviews — ${selReadiness?.discipline || ''}`}
              onAdd={() => openModal('rreview')} addLabel="Add Review" />
            <DataTable loading={rrL} cols={['Decision', 'Reviewer', 'Comment', 'Reviewed At']}
              rows={readyRevs} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><SBadge v={r.review_decision} /></Table.Td>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.reviewer_user_id || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={220}>{r.review_comment || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.reviewed_at || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>
        </Tabs>
      )}

      {/* ════ MODALS ════ */}

      {/* Evidence */}
      <FormModal opened={modal === 'evidence'} onClose={closeModal} title="Add Evidence" saving={saving}
        onSubmit={() => save('/sia/evidence', { sia_case_id: loadedCaseId, captured_by: uid, ...fv }, rEv)}>
        <FR><FI label="Evidence Code *" field="evidence_code" fv={fv} setFv={setFv} /><FI label="Evidence Type" field="evidence_type" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Source Type" field="source_type" fv={fv} setFv={setFv} /><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY} /></FR>
        <FR><FI label="File Name" field="file_name" fv={fv} setFv={setFv} /><FI label="Captured At" field="captured_at" fv={fv} setFv={setFv} /></FR>
        <FI label="File Path" field="file_path" fv={fv} setFv={setFv} />
        <FR><FI label="Site ID (optional)" field="site_id" fv={fv} setFv={setFv} /><FI label="POI ID (optional)" field="poi_id" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Engineering Assessment ID (optional)" field="engineering_assessment_id" fv={fv} setFv={setFv} /><FI label="Evidence Status" field="evidence_status" fv={fv} setFv={setFv} select={STATUS_OPTS} /></FR>
      </FormModal>

      {/* Evidence Verification */}
      <FormModal opened={modal === 'evverif'} onClose={closeModal} title="Add Evidence Verification" saving={saving}
        onSubmit={() => save('/sia/evidence-verifications', { evidence_id: eid, verified_by: uid, verified_at: new Date().toISOString(), ...fv }, rVf)}>
        <FI label="Verification Status" field="verification_status" fv={fv} setFv={setFv} select={['Verified', 'Partially Verified', 'Rejected', 'Pending']} />
        <FI label="Verification Comment" field="verification_comment" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Source Fact */}
      <FormModal opened={modal === 'sourcefact'} onClose={closeModal} title="Add Source Fact" saving={saving}
        onSubmit={() => save('/sia/source-facts', { sia_case_id: loadedCaseId, ...fv }, rSf)}>
        <FR><FI label="Fact Name" field="fact_name" fv={fv} setFv={setFv} /><FI label="Unit" field="unit" fv={fv} setFv={setFv} /></FR>
        <FI label="Fact Value" field="fact_value" fv={fv} setFv={setFv} textarea />
        <FR><FI label="Source Type" field="source_type" fv={fv} setFv={setFv} /><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY} /></FR>
        <FR><FI label="Fact Status" field="fact_status" fv={fv} setFv={setFv} select={STATUS_OPTS} /><FI label="Evidence ID (optional)" field="evidence_id" fv={fv} setFv={setFv} /></FR>
      </FormModal>

      {/* AI Observation */}
      <FormModal opened={modal === 'aiobs'} onClose={closeModal} title="Add AI Observation" saving={saving}
        onSubmit={() => save('/sia/ai-observations', { sia_case_id: loadedCaseId, ...fv }, rAo)}>
        <FR><FI label="Observation Code *" field="observation_code" fv={fv} setFv={setFv} /><FI label="Task Type" field="task_type" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Model Name" field="model_name" fv={fv} setFv={setFv} /><FI label="Model Version" field="model_version" fv={fv} setFv={setFv} /></FR>
        <FI label="Input Reference" field="input_reference" fv={fv} setFv={setFv} textarea />
        <FI label="Output Value" field="output_value" fv={fv} setFv={setFv} textarea />
        <FR><FI label="Confidence Score (0–1)" field="confidence_score" fv={fv} setFv={setFv} /><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY} /></FR>
      </FormModal>

      {/* AI Disposition */}
      <FormModal opened={modal === 'aidisp'} onClose={closeModal} title="Add AI Disposition" saving={saving}
        onSubmit={() => save('/sia/ai-dispositions', { ai_observation_id: aoid, reviewer_user_id: uid, disposition_at: new Date().toISOString(), ...fv }, rAd)}>
        <FI label="Disposition" field="disposition" fv={fv} setFv={setFv} select={DISPOSITIONS} />
        <FI label="Modified Value (if MODIFIED)" field="modified_value" fv={fv} setFv={setFv} textarea />
        <FI label="Reviewer Comment" field="reviewer_comment" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Conflict */}
      <FormModal opened={modal === 'conflict'} onClose={closeModal} title="Add Conflict" saving={saving}
        onSubmit={() => save('/sia/conflicts', { sia_case_id: loadedCaseId, ...fv }, rCf)}>
        <FR><FI label="Conflict Code" field="conflict_code" fv={fv} setFv={setFv} /><FI label="Discipline" field="discipline" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Conflict Type" field="conflict_type" fv={fv} setFv={setFv} /><FI label="Priority" field="priority" fv={fv} setFv={setFv} select={PRIORITY_OPTS} /></FR>
        <FR><FI label="Source A" field="source_a" fv={fv} setFv={setFv} /><FI label="Value A" field="value_a" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Source B" field="source_b" fv={fv} setFv={setFv} /><FI label="Value B" field="value_b" fv={fv} setFv={setFv} /></FR>
        <FI label="Description" field="description" fv={fv} setFv={setFv} textarea />
        <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} />
      </FormModal>

      {/* Conflict Resolution */}
      <FormModal opened={modal === 'cfresol'} onClose={closeModal} title="Add Conflict Resolution" saving={saving}
        onSubmit={() => save('/sia/conflict-resolutions', { conflict_id: cfid, resolved_by: uid, resolved_at: new Date().toISOString(), ...fv }, rCr)}>
        <FI label="Accepted Value" field="accepted_value" fv={fv} setFv={setFv} textarea />
        <FI label="Resolution Reason" field="resolution_reason" fv={fv} setFv={setFv} textarea />
        <FI label="Resolution Status" field="resolution_status" fv={fv} setFv={setFv} select={['Resolved', 'Partial', 'Escalated', 'Pending']} />
      </FormModal>

      {/* Data Gap */}
      <FormModal opened={modal === 'datagap'} onClose={closeModal} title="Add Data Gap" saving={saving}
        onSubmit={() => save('/sia/data-gaps', { sia_case_id: loadedCaseId, owner_user_id: uid, ...fv }, rDg)}>
        <FR><FI label="Gap Code" field="gap_code" fv={fv} setFv={setFv} /><FI label="Discipline" field="discipline" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Priority" field="priority" fv={fv} setFv={setFv} select={PRIORITY_OPTS} /><FI label="Target Date (YYYY-MM-DD)" field="target_date" fv={fv} setFv={setFv} /></FR>
        <FI label="Gap Description" field="gap_description" fv={fv} setFv={setFv} textarea />
        <FI label="Impact" field="impact" fv={fv} setFv={setFv} textarea />
        <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} />
      </FormModal>

      {/* RFI Action */}
      <FormModal opened={modal === 'rfi'} onClose={closeModal} title="Add RFI Action" saving={saving}
        onSubmit={() => save('/sia/rfi-actions', { sia_case_id: loadedCaseId, assigned_to: uid, ...fv }, rRfi)}>
        <FR><FI label="Action Code" field="action_code" fv={fv} setFv={setFv} /><FI label="Action Type" field="action_type" fv={fv} setFv={setFv} select={['RFI', 'TQ', 'Clarification', 'Site Visit']} /></FR>
        <FI label="Subject" field="subject" fv={fv} setFv={setFv} />
        <FI label="Description" field="description" fv={fv} setFv={setFv} textarea />
        <FR><FI label="Target Date (YYYY-MM-DD)" field="target_date" fv={fv} setFv={setFv} /><FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} /></FR>
        <FI label="Response" field="response" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Constraint / Assumption */}
      <FormModal opened={modal === 'constraint'} onClose={closeModal} title="Add Constraint / Assumption" saving={saving}
        onSubmit={() => save('/sia/constraints-assumptions', { sia_case_id: loadedCaseId, recorded_by: uid, ...fv }, rCn)}>
        <FR><FI label="Record Type" field="record_type" fv={fv} setFv={setFv} select={RECORD_TYPES} /><FI label="Discipline" field="discipline" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY} /><FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} /></FR>
        <FI label="Description" field="description" fv={fv} setFv={setFv} textarea />
        <FI label="Impact" field="impact" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Discipline Readiness */}
      <FormModal opened={modal === 'readiness'} onClose={closeModal} title="Add Discipline Readiness" saving={saving}
        onSubmit={() => save('/sia/discipline-readiness', { sia_case_id: loadedCaseId, site_id: fv.site_id || 'UNKNOWN', assessed_by: uid, assessment_date: new Date().toISOString(), ...fv }, rRl)}>
        <FR><FI label="Discipline *" field="discipline" fv={fv} setFv={setFv} /><FI label="Site ID *" field="site_id" fv={fv} setFv={setFv} /></FR>
        <FI label="Readiness Status" field="readiness_status" fv={fv} setFv={setFv} select={READINESS_ST} />
        <FI label="Summary" field="summary" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Readiness Condition */}
      <FormModal opened={modal === 'rcond'} onClose={closeModal} title="Add Readiness Condition" saving={saving}
        onSubmit={() => save('/sia/readiness-conditions', { discipline_readiness_id: rid, owner_user_id: uid, ...fv }, rRc)}>
        <FI label="Condition Description" field="condition_description" fv={fv} setFv={setFv} textarea />
        <FI label="Required Action" field="required_action" fv={fv} setFv={setFv} textarea />
        <FR><FI label="Target Date (YYYY-MM-DD)" field="target_date" fv={fv} setFv={setFv} /><FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} /></FR>
      </FormModal>

      {/* Readiness Blocker */}
      <FormModal opened={modal === 'rblocker'} onClose={closeModal} title="Add Readiness Blocker" saving={saving}
        onSubmit={() => save('/sia/readiness-blockers', { discipline_readiness_id: rid, owner_user_id: uid, ...fv }, rRb)}>
        <FR><FI label="Blocker Type" field="blocker_type" fv={fv} setFv={setFv} /><FI label="Severity" field="severity" fv={fv} setFv={setFv} select={PRIORITY_OPTS} /></FR>
        <FR><FI label="Data Gap ID (optional)" field="data_gap_id" fv={fv} setFv={setFv} /><FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} /></FR>
        <FI label="Blocker Description" field="blocker_description" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Readiness Review */}
      <FormModal opened={modal === 'rreview'} onClose={closeModal} title="Add Readiness Review" saving={saving}
        onSubmit={() => save('/sia/readiness-reviews', { discipline_readiness_id: rid, reviewer_user_id: uid, reviewed_at: new Date().toISOString(), ...fv }, rRr)}>
        <FI label="Review Decision" field="review_decision" fv={fv} setFv={setFv}
          select={['Approved', 'Conditional Approval', 'Rejected', 'Needs More Evidence']} />
        <FI label="Review Comment" field="review_comment" fv={fv} setFv={setFv} textarea />
      </FormModal>
    </Box>
  );
}
