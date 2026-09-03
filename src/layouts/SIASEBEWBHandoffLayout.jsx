import { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader, Modal,
  Paper, Select, Stack, Switch, Tabs, Table, Text, Textarea,
  TextInput, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconFileDescription, IconHistory, IconList,
  IconShieldCheck, IconAlertTriangle, IconCheck, IconX,
  IconLock, IconArrowRight, IconPackage,
} from '@tabler/icons-react';
import SIAStepFlow from '../components/common/SIAStepFlow';

const API = '/api';
const thS = { fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' };

const STATUS_OPTS    = ['Draft', 'In Progress', 'Approved', 'Released', 'Superseded', 'Closed'];
const READINESS_ST   = ['NOT_ASSESSED', 'READY', 'CONDITIONAL', 'BLOCKED', 'NOT_APPLICABLE'];
const CG_TYPES       = ['CONSTRAINT', 'RISK', 'ASSUMPTION', 'GAP', 'RFI'];
const CHANGE_TYPES   = ['Addition', 'Deletion', 'Material Change', 'Minor Correction'];
const MATERIALITY    = ['Material', 'Non-Material', 'Undetermined'];
const REVIEW_DEC     = ['Approved', 'Conditional Approval', 'Rejected', 'Needs Revision'];
const APPROVAL_DEC   = ['Approved', 'Approved with Conditions', 'Rejected'];

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
  const s = { input: { borderColor: '#d1d5db', borderRadius: 6, height: textarea ? undefined : 36 } };
  if (select) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <Select data={select} value={val} onChange={v => upd(v || '')} clearable styles={s} /></Box>;
  if (textarea) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <Textarea value={val} onChange={e => upd(e.target.value)} autosize minRows={2} styles={s} /></Box>;
  return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <TextInput value={val} onChange={e => upd(e.target.value)} styles={s} /></Box>;
}
function SBadge({ v }) {
  const m = {
    released: '#007336', approved: '#007336', ready: '#007336',
    'in progress': '#1971c2', draft: '#6b7280', conditional: '#f08c00',
    blocked: '#e03131', rejected: '#e03131', superseded: '#9c36b5',
    not_assessed: '#6b7280', not_applicable: '#6b7280',
  };
  const col = m[(v || '').toLowerCase().replace(/ /g, '_')] || '#6b7280';
  return <Badge size="sm" radius="xl"
    style={{ backgroundColor: col + '18', color: col, border: 'none', fontWeight: 600 }}>{v || '—'}</Badge>;
}

// ════════════════════════════════════════════════════════
export default function SIASEBEWBHandoffLayout() {
  const [caseId, setCaseId]     = useState(() => localStorage.getItem('sia_case_id') || '');
  const [loaded, setLoaded]     = useState(() => localStorage.getItem('sia_case_id') || '');
  const [activeTab, setTab]     = useState('seb');

  // selections
  const [selSeb, setSelSeb]         = useState(null);
  const [selRev, setSelRev]         = useState(null);
  const [selHandoff, setSelHandoff] = useState(null);

  const sid  = selSeb?.id;
  const rid  = selRev?.id;
  const hid  = selHandoff?.id;
  const uid  = localStorage.getItem('user_id') || 'unknown';

  // ── case-level ────────────────────────────────────────
  const { data: sebs,     loading: sebL,  reload: rSeb }  = useApi(loaded ? `${API}/sia/cases/${loaded}/seb` : null, [loaded]);

  // ── SEB children ─────────────────────────────────────
  const { data: revisions,  loading: revL,  reload: rRev }  = useApi(sid ? `${API}/sia/seb/${sid}/revisions`                       : null, [sid]);

  // ── Revision children ────────────────────────────────
  const { data: items,      loading: itmL,  reload: rItm }  = useApi(rid ? `${API}/sia/seb-revisions/${rid}/items`                 : null, [rid]);
  const { data: evidence,   loading: evL,   reload: rEv }   = useApi(rid ? `${API}/sia/seb-revisions/${rid}/evidence`              : null, [rid]);
  const { data: discRes,    loading: drL,   reload: rDr }   = useApi(rid ? `${API}/sia/seb-revisions/${rid}/discipline-results`    : null, [rid]);
  const { data: cgaps,      loading: cgL,   reload: rCg }   = useApi(rid ? `${API}/sia/seb-revisions/${rid}/constraint-gaps`       : null, [rid]);
  const { data: reviews,    loading: rvL,   reload: rRv }   = useApi(rid ? `${API}/sia/seb-revisions/${rid}/reviews`               : null, [rid]);
  const { data: approvals,  loading: apL,   reload: rAp }   = useApi(rid ? `${API}/sia/seb-revisions/${rid}/approvals`             : null, [rid]);
  const { data: releases,   loading: rlL,   reload: rRl }   = useApi(rid ? `${API}/sia/seb-revisions/${rid}/releases`              : null, [rid]);
  const { data: changes,    loading: chL,   reload: rCh }   = useApi(rid ? `${API}/sia/seb-revisions/${rid}/change-impacts`        : null, [rid]);
  const { data: handoffs,   loading: hoL,   reload: rHo }   = useApi(rid ? `${API}/sia/seb-revisions/${rid}/ewb-handoffs`          : null, [rid]);

  // ── Handoff children ─────────────────────────────────
  const { data: hoItems,    loading: hiL,   reload: rHi }   = useApi(hid ? `${API}/sia/ewb-handoffs/${hid}/items`      : null, [hid]);
  const { data: hoConds,    loading: hcL,   reload: rHc }   = useApi(hid ? `${API}/sia/ewb-handoffs/${hid}/conditions` : null, [hid]);

  // ── modal ─────────────────────────────────────────────
  const [modal, setModal]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [fv, setFv]         = useState({});
  const openModal  = (key, def = {}) => { setFv(def); setModal(key); };
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
    setSelSeb(null); setSelRev(null); setSelHandoff(null);
    setTab('seb');
  };

  const selRow = (setter, next) => r => { setter(r); setTab(next); };

  // ════════════════════════════════════════════════════
  return (
    <Box p="lg">
      {/* Header */}
      <Box mb="lg">
        <Group gap="sm" mb={4}>
          <Badge color="green" variant="light" size="lg" radius="sm">SIA</Badge>
          <Text size="xs" c="dimmed" fw={500}>Module 1 · Section 6</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">SEB and EWB Handoff</Title>
        <Text size="sm" c="#6b7280" mt={4}>
          Manage Site Engineering Baselines, revisions, reviews, approvals, releases and EWB handoffs.
        </Text>
      </Box>

      {/* Case ID loader */}
      <Paper p="sm" mb="md" style={{ border:'1px solid #e5e7eb', borderRadius:8, backgroundColor:'#f9fafb' }}>
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Text size="xs" fw={700} c="#374151">Active SIA Case:</Text>
            {loaded
              ? <Text size="xs" fw={600} c="#007336" style={{ fontFamily:'monospace' }}>{loaded}</Text>
              : <Text size="xs" c="red">No active case — create one in Start and Case Control first.</Text>}
          </Group>
          <Group gap="sm">
            <Button size="xs" variant="subtle" color="green" onClick={handleLoad} disabled={!loaded}>Reload</Button>
            <Button size="xs" color="green" variant="outline" disabled={!loaded}
              onClick={() => openModal('seb', { sia_case_id: loaded })}>+ New SEB</Button>
          </Group>
        </Group>
      </Paper>

      {/* Context strip */}
      {(selSeb || selRev || selHandoff) && (
        <Paper p="sm" mb="md" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
          <Group gap="xl" wrap="wrap">
            {selSeb     && <Text size="xs" c="#374151">SEB: <Text span fw={700} c="#007336">{selSeb.seb_code}</Text></Text>}
            {selRev     && <Text size="xs" c="#374151">Revision: <Text span fw={700} c="#374151">{selRev.revision_no}</Text></Text>}
            {selHandoff && <Text size="xs" c="#374151">Handoff: <Text span fw={700} c="#374151">{selHandoff.handoff_code || selHandoff.id}</Text></Text>}
            <Text size="xs" c="#9ca3af" style={{ marginLeft: 'auto', cursor: 'pointer' }}
              onClick={() => { setSelSeb(null); setSelRev(null); setSelHandoff(null); }}>Clear</Text>
          </Group>
        </Paper>
      )}

      {/* Tabs */}
      {loaded && (
        <Tabs value={activeTab} onChange={setTab} color="green">
          <SIAStepFlow
            activeTab={activeTab}
            onStep={setTab}
            steps={[
              { value:'seb',       label:'SEB',                icon:<IconFileDescription size={13}/>, enabled:true },
              { value:'revisions', label:'Revisions',          icon:<IconHistory size={13}/>,         enabled:!!selSeb },
              { value:'items',     label:'Items',              icon:<IconList size={13}/>,            enabled:!!selRev },
              { value:'evidence',  label:'Evidence',           icon:<IconShieldCheck size={13}/>,     enabled:!!selRev },
              { value:'discres',   label:'Discipline Results', icon:<IconCheck size={13}/>,           enabled:!!selRev },
              { value:'cgaps',     label:'Constraints/Gaps',   icon:<IconAlertTriangle size={13}/>,   enabled:!!selRev },
              { value:'reviews',   label:'Reviews',            icon:<IconShieldCheck size={13}/>,     enabled:!!selRev },
              { value:'approvals', label:'Approvals',          icon:<IconCheck size={13}/>,           enabled:!!selRev },
              { value:'releases',  label:'Releases',           icon:<IconLock size={13}/>,            enabled:!!selRev },
              { value:'changes',   label:'Change Impact',      icon:<IconX size={13}/>,               enabled:!!selRev },
              { value:'handoffs',  label:'EWB Handoffs',       icon:<IconArrowRight size={13}/>,      enabled:!!selRev },
              { value:'hoitems',   label:'Handoff Items',      icon:<IconPackage size={13}/>,         enabled:!!selHandoff },
              { value:'hoconds',   label:'Handoff Conditions', icon:<IconList size={13}/>,            enabled:!!selHandoff },
            ]}
          />
          <Tabs.List style={{ display:'none' }}>
            <Tabs.Tab value="seb">SEB</Tabs.Tab>
            <Tabs.Tab value="revisions">Revisions</Tabs.Tab>
            <Tabs.Tab value="items">Items</Tabs.Tab>
            <Tabs.Tab value="evidence">Evidence</Tabs.Tab>
            <Tabs.Tab value="discres">Discipline Results</Tabs.Tab>
            <Tabs.Tab value="cgaps">Constraints / Gaps</Tabs.Tab>
            <Tabs.Tab value="reviews">Reviews</Tabs.Tab>
            <Tabs.Tab value="approvals">Approvals</Tabs.Tab>
            <Tabs.Tab value="releases">Releases</Tabs.Tab>
            <Tabs.Tab value="changes">Change Impact</Tabs.Tab>
            <Tabs.Tab value="handoffs">EWB Handoffs</Tabs.Tab>
            <Tabs.Tab value="hoitems">Handoff Items</Tabs.Tab>
            <Tabs.Tab value="hoconds">Handoff Conditions</Tabs.Tab>
          </Tabs.List>

          {/* SEB */}
          <Tabs.Panel value="seb">
            <TabHeader title="Site Engineering Baselines" onAdd={() => openModal('seb', { sia_case_id: loaded })} addLabel="Add SEB" />
            <DataTable loading={sebL} cols={['Code', 'Assessment Stage', 'Current Revision', 'Status']}
              rows={sebs} render={r => (
                <Table.Tr key={r.id} onClick={selRow(setSelSeb, 'revisions')}
                  style={{ cursor: 'pointer', backgroundColor: selSeb?.id === r.id ? '#f0fdf4' : 'transparent' }}
                  onMouseEnter={e => { if (selSeb?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={e => { if (selSeb?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.seb_code}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.assessment_stage || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.current_revision || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* REVISIONS */}
          <Tabs.Panel value="revisions">
            <TabHeader title={`Revisions — ${selSeb?.seb_code || ''}`}
              onAdd={() => openModal('revision', { seb_id: sid })} addLabel="Add Revision" />
            <DataTable loading={revL} cols={['Revision No', 'Status', 'Issue Date', 'Reason']}
              rows={revisions} render={r => (
                <Table.Tr key={r.id} onClick={selRow(setSelRev, 'items')}
                  style={{ cursor: 'pointer', backgroundColor: selRev?.id === r.id ? '#f0fdf4' : 'transparent' }}
                  onMouseEnter={e => { if (selRev?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={e => { if (selRev?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.revision_no}</Text></Table.Td>
                  <Table.Td><SBadge v={r.revision_status} /></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.issue_date || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={200}>{r.revision_reason || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* ITEMS */}
          <Tabs.Panel value="items">
            <TabHeader title="SEB Items" onAdd={() => openModal('item')} addLabel="Add Item" />
            <DataTable loading={itmL} cols={['Name', 'Type', 'Discipline', 'Value', 'Unit', 'Reliability', 'Status']}
              rows={items} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" fw={600}>{r.item_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.item_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.discipline || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={120}>{r.item_value || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.unit || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* EVIDENCE */}
          <Tabs.Panel value="evidence">
            <TabHeader title="SEB Evidence" onAdd={() => openModal('sebevidence')} addLabel="Link Evidence" />
            <DataTable loading={evL} cols={['Evidence ID', 'SEB Item ID', 'Hash', 'Primary']}
              rows={evidence} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.evidence_id}</Text></Table.Td>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.seb_item_id || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280" truncate maw={180}>{r.evidence_hash || '—'}</Text></Table.Td>
                  <Table.Td><Badge size="sm" color={r.is_primary ? 'green' : 'gray'} variant="light">{r.is_primary ? 'Primary' : 'Secondary'}</Badge></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* DISCIPLINE RESULTS */}
          <Tabs.Panel value="discres">
            <TabHeader title="Discipline Results" onAdd={() => openModal('discresult')} addLabel="Add Result" />
            <DataTable loading={drL} cols={['Discipline', 'Readiness', 'Status', 'Assessment Summary']}
              rows={discRes} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" fw={600}>{r.discipline || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.readiness_status} /></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={220}>{r.assessment_summary || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* CONSTRAINT / GAPS */}
          <Tabs.Panel value="cgaps">
            <TabHeader title="Constraints and Gaps" onAdd={() => openModal('cgap')} addLabel="Add Record" />
            <DataTable loading={cgL} cols={['Type', 'Discipline', 'Status', 'Description']}
              rows={cgaps} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Badge size="sm" color={r.record_type === 'RISK' ? 'red' : r.record_type === 'GAP' ? 'orange' : 'blue'} variant="light">{r.record_type || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{r.discipline || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={240}>{r.description || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* REVIEWS */}
          <Tabs.Panel value="reviews">
            <TabHeader title="SEB Reviews" onAdd={() => openModal('review')} addLabel="Add Review" />
            <DataTable loading={rvL} cols={['Review Status', 'Reviewer', 'Comment', 'Reviewed At']}
              rows={reviews} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><SBadge v={r.review_status} /></Table.Td>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.reviewer_user_id || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={200}>{r.review_comment || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.reviewed_at || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* APPROVALS */}
          <Tabs.Panel value="approvals">
            <TabHeader title="SEB Approvals" onAdd={() => openModal('approval')} addLabel="Add Approval" />
            <DataTable loading={apL} cols={['Decision', 'Approver', 'Comment', 'Approved At']}
              rows={approvals} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><SBadge v={r.approval_decision} /></Table.Td>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.approver_user_id || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={200}>{r.approval_comment || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.approved_at || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* RELEASES */}
          <Tabs.Panel value="releases">
            <TabHeader title="SEB Releases" onAdd={() => openModal('release')} addLabel="Create Release" />
            <DataTable loading={rlL} cols={['Release Hash', 'Status', 'Released By', 'Released At']}
              rows={releases} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }} truncate maw={200}>{r.release_hash}</Text></Table.Td>
                  <Table.Td><SBadge v={r.release_status} /></Table.Td>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.released_by || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.released_at || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* CHANGE IMPACT */}
          <Tabs.Panel value="changes">
            <TabHeader title="Change Impact" onAdd={() => openModal('change')} addLabel="Add Change Impact" />
            <DataTable loading={chL} cols={['Change Type', 'Discipline', 'Materiality', 'Affects EWP', 'Status']}
              rows={changes} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.change_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.affected_discipline || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.materiality} /></Table.Td>
                  <Table.Td><Badge size="sm" color={r.affected_ewp ? 'red' : 'gray'} variant="light">{r.affected_ewp ? 'Yes' : 'No'}</Badge></Table.Td>
                  <Table.Td><SBadge v={r.impact_status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* EWB HANDOFFS */}
          <Tabs.Panel value="handoffs">
            <TabHeader title="EWB Handoffs" onAdd={() => openModal('handoff')} addLabel="Add Handoff" />
            <DataTable loading={hoL} cols={['Code', 'EWP Ref', 'Handoff Status', 'Readiness', 'Prepared At']}
              rows={handoffs} render={r => (
                <Table.Tr key={r.id} onClick={selRow(setSelHandoff, 'hoitems')}
                  style={{ cursor: 'pointer', backgroundColor: selHandoff?.id === r.id ? '#f0fdf4' : 'transparent' }}
                  onMouseEnter={e => { if (selHandoff?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={e => { if (selHandoff?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.handoff_code || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.ewp_reference_id || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.handoff_status} /></Table.Td>
                  <Table.Td><SBadge v={r.readiness_status} /></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.prepared_at || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* HANDOFF ITEMS */}
          <Tabs.Panel value="hoitems">
            <TabHeader title={`Handoff Items — ${selHandoff?.handoff_code || ''}`}
              onAdd={() => openModal('hoitem')} addLabel="Add Item" />
            <DataTable loading={hiL} cols={['SEB Item ID', 'Discipline', 'Applicability', 'Mandatory', 'Status']}
              rows={hoItems} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{r.seb_item_id}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.discipline || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.applicability || '—'}</Text></Table.Td>
                  <Table.Td><Badge size="sm" color={r.is_mandatory ? 'red' : 'gray'} variant="light">{r.is_mandatory ? 'Mandatory' : 'Optional'}</Badge></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* HANDOFF CONDITIONS */}
          <Tabs.Panel value="hoconds">
            <TabHeader title={`Handoff Conditions — ${selHandoff?.handoff_code || ''}`}
              onAdd={() => openModal('hocond')} addLabel="Add Condition" />
            <DataTable loading={hcL} cols={['Type', 'Discipline', 'Status', 'Description']}
              rows={hoConds} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.condition_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.discipline || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={240}>{r.condition_description || '—'}</Text></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>
        </Tabs>
      )}

      {/* ════ MODALS ════ */}

      {/* SEB */}
      <FormModal opened={modal === 'seb'} onClose={closeModal} title="Create SEB" saving={saving}
        onSubmit={() => save('/sia/seb', { sia_case_id: loaded, created_by: uid, ...fv }, rSeb)}>
        <FR><FI label="SEB Code *" field="seb_code" fv={fv} setFv={setFv} /><FI label="Site ID *" field="site_id" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Assessment Stage" field="assessment_stage" fv={fv} setFv={setFv} /><FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} /></FR>
      </FormModal>

      {/* Revision */}
      <FormModal opened={modal === 'revision'} onClose={closeModal} title="Add SEB Revision" saving={saving}
        onSubmit={() => save('/sia/seb-revisions', { seb_id: sid, created_by: uid, ...fv }, rRev)}>
        <FR><FI label="Revision No *" field="revision_no" fv={fv} setFv={setFv} /><FI label="Revision Status" field="revision_status" fv={fv} setFv={setFv} select={STATUS_OPTS} /></FR>
        <FR><FI label="Issue Date (YYYY-MM-DD)" field="issue_date" fv={fv} setFv={setFv} /><FI label="Previous Revision ID" field="previous_revision_id" fv={fv} setFv={setFv} /></FR>
        <FI label="Revision Reason" field="revision_reason" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* SEB Item */}
      <FormModal opened={modal === 'item'} onClose={closeModal} title="Add SEB Item" saving={saving}
        onSubmit={() => save('/sia/seb-items', { seb_revision_id: rid, ...fv }, rItm)}>
        <FR><FI label="Item Name" field="item_name" fv={fv} setFv={setFv} /><FI label="Item Type" field="item_type" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Discipline" field="discipline" fv={fv} setFv={setFv} /><FI label="Unit" field="unit" fv={fv} setFv={setFv} /></FR>
        <FI label="Item Value" field="item_value" fv={fv} setFv={setFv} textarea />
        <FR><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={['Confirmed', 'Estimated', 'Unverified']} /><FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} /></FR>
        <FR><FI label="Source Record Type" field="source_record_type" fv={fv} setFv={setFv} /><FI label="Source Record ID" field="source_record_id" fv={fv} setFv={setFv} /></FR>
      </FormModal>

      {/* SEB Evidence */}
      <FormModal opened={modal === 'sebevidence'} onClose={closeModal} title="Link Evidence to SEB Revision" saving={saving}
        onSubmit={() => save('/sia/seb-evidence', { seb_revision_id: rid, ...fv }, rEv)}>
        <FI label="Evidence ID *" field="evidence_id" fv={fv} setFv={setFv} />
        <FR><FI label="SEB Item ID (optional)" field="seb_item_id" fv={fv} setFv={setFv} /><FI label="Evidence Hash" field="evidence_hash" fv={fv} setFv={setFv} /></FR>
        <Group mt="sm" gap="xs"><Text size="xs" fw={600} c="#374151">Primary</Text>
          <Switch checked={!!fv.is_primary} onChange={e => { const v = e.currentTarget.checked; setFv(p => ({ ...p, is_primary: v })); }} color="green" />
        </Group>
      </FormModal>

      {/* Discipline Result */}
      <FormModal opened={modal === 'discresult'} onClose={closeModal} title="Add Discipline Result" saving={saving}
        onSubmit={() => save('/sia/seb-discipline-results', { seb_revision_id: rid, ...fv }, rDr)}>
        <FR><FI label="Discipline" field="discipline" fv={fv} setFv={setFv} /><FI label="Readiness Status" field="readiness_status" fv={fv} setFv={setFv} select={READINESS_ST} /></FR>
        <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} />
        <FI label="Assessment Summary" field="assessment_summary" fv={fv} setFv={setFv} textarea />
        <FI label="Condition Summary" field="condition_summary" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Constraint / Gap */}
      <FormModal opened={modal === 'cgap'} onClose={closeModal} title="Add Constraint / Gap" saving={saving}
        onSubmit={() => save('/sia/seb-constraint-gaps', { seb_revision_id: rid, ...fv }, rCg)}>
        <FR><FI label="Record Type" field="record_type" fv={fv} setFv={setFv} select={CG_TYPES} /><FI label="Discipline" field="discipline" fv={fv} setFv={setFv} /></FR>
        <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} />
        <FI label="Description" field="description" fv={fv} setFv={setFv} textarea />
        <FI label="Impact" field="impact" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Review */}
      <FormModal opened={modal === 'review'} onClose={closeModal} title="Add SEB Review" saving={saving}
        onSubmit={() => save('/sia/seb-reviews', { seb_revision_id: rid, reviewer_user_id: uid, reviewed_at: new Date().toISOString(), ...fv }, rRv)}>
        <FI label="Review Status" field="review_status" fv={fv} setFv={setFv} select={REVIEW_DEC} />
        <FI label="Review Comment" field="review_comment" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Approval */}
      <FormModal opened={modal === 'approval'} onClose={closeModal} title="Add SEB Approval" saving={saving}
        onSubmit={() => save('/sia/seb-approvals', { seb_revision_id: rid, approver_user_id: uid, approved_at: new Date().toISOString(), ...fv }, rAp)}>
        <FI label="Approval Decision" field="approval_decision" fv={fv} setFv={setFv} select={APPROVAL_DEC} />
        <FI label="Approval Condition" field="approval_condition" fv={fv} setFv={setFv} textarea />
        <FI label="Approval Comment" field="approval_comment" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Release */}
      <FormModal opened={modal === 'release'} onClose={closeModal} title="Create SEB Release" saving={saving}
        onSubmit={() => save('/sia/seb-releases', { seb_revision_id: rid, released_by: uid, released_at: new Date().toISOString(), ...fv }, rRl)}>
        <FI label="Release Hash *" field="release_hash" fv={fv} setFv={setFv} />
        <FI label="Release Status" field="release_status" fv={fv} setFv={setFv} select={['Released', 'Draft', 'Superseded']} />
      </FormModal>

      {/* Change Impact */}
      <FormModal opened={modal === 'change'} onClose={closeModal} title="Add Change Impact" saving={saving}
        onSubmit={() => save('/sia/seb-change-impacts', { seb_revision_id: rid, reviewed_by: uid, reviewed_at: new Date().toISOString(), ...fv }, rCh)}>
        <FR><FI label="Change Type" field="change_type" fv={fv} setFv={setFv} select={CHANGE_TYPES} /><FI label="Materiality" field="materiality" fv={fv} setFv={setFv} select={MATERIALITY} /></FR>
        <FR><FI label="Affected Discipline" field="affected_discipline" fv={fv} setFv={setFv} /><FI label="Impact Status" field="impact_status" fv={fv} setFv={setFv} select={STATUS_OPTS} /></FR>
        <FR><FI label="Previous Revision ID" field="previous_revision_id" fv={fv} setFv={setFv} /></FR>
        <FI label="Change Description" field="change_description" fv={fv} setFv={setFv} textarea />
        <FI label="Impact Description" field="impact_description" fv={fv} setFv={setFv} textarea />
        <Group mt="sm" gap="xs"><Text size="xs" fw={600} c="#374151">Affects EWP</Text>
          <Switch checked={!!fv.affected_ewp} onChange={e => { const v = e.currentTarget.checked; setFv(p => ({ ...p, affected_ewp: v })); }} color="red" />
        </Group>
      </FormModal>

      {/* EWB Handoff */}
      <FormModal opened={modal === 'handoff'} onClose={closeModal} title="Add EWB Handoff" saving={saving}
        onSubmit={() => save('/sia/ewb-handoffs', { seb_revision_id: rid, prepared_by: uid, prepared_at: new Date().toISOString(), project_id: fv.project_id || 'UNKNOWN', ...fv }, rHo)}>
        <FR><FI label="Handoff Code" field="handoff_code" fv={fv} setFv={setFv} /><FI label="Project ID *" field="project_id" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="EWP Reference ID" field="ewp_reference_id" fv={fv} setFv={setFv} /><FI label="Handoff Status" field="handoff_status" fv={fv} setFv={setFv} select={STATUS_OPTS} /></FR>
        <FI label="Readiness Status" field="readiness_status" fv={fv} setFv={setFv} select={READINESS_ST} />
      </FormModal>

      {/* Handoff Item */}
      <FormModal opened={modal === 'hoitem'} onClose={closeModal} title="Add Handoff Item" saving={saving}
        onSubmit={() => save('/sia/ewb-handoff-items', { ewb_handoff_id: hid, seb_item_id: fv.seb_item_id || 'UNKNOWN', ...fv }, rHi)}>
        <FI label="SEB Item ID *" field="seb_item_id" fv={fv} setFv={setFv} />
        <FR><FI label="Discipline" field="discipline" fv={fv} setFv={setFv} /><FI label="Applicability" field="applicability" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} /></FR>
        <Group mt="sm" gap="xs"><Text size="xs" fw={600} c="#374151">Mandatory</Text>
          <Switch checked={!!fv.is_mandatory} onChange={e => { const v = e.currentTarget.checked; setFv(p => ({ ...p, is_mandatory: v })); }} color="red" />
        </Group>
      </FormModal>

      {/* Handoff Condition */}
      <FormModal opened={modal === 'hocond'} onClose={closeModal} title="Add Handoff Condition" saving={saving}
        onSubmit={() => save('/sia/ewb-handoff-conditions', { ewb_handoff_id: hid, owner_user_id: uid, ...fv }, rHc)}>
        <FR><FI label="Condition Type" field="condition_type" fv={fv} setFv={setFv} /><FI label="Discipline" field="discipline" fv={fv} setFv={setFv} /></FR>
        <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} />
        <FI label="Condition Description" field="condition_description" fv={fv} setFv={setFv} textarea />
        <FI label="Required Action" field="required_action" fv={fv} setFv={setFv} textarea />
      </FormModal>
    </Box>
  );
}
