import { useEffect, useState } from 'react';
import { Alert, Badge, Box, Button, Divider, Group, Loader, Modal, Paper, Progress, ScrollArea,
  Select, SimpleGrid, Stack, Table, Text, Textarea, TextInput, ThemeIcon, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconLock, IconRefresh, IconShieldCheck } from '@tabler/icons-react';

const API = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const ROOT = '/ewp/completion-governance';
const surface = { borderColor: '#dfe7e2', boxShadow: '0 8px 26px rgba(21,55,39,.045)' };
const actionLabels = { governance: 'Run governance checks', submit: 'Submit for Closure', close: 'Approve Closure', actions: 'Add action', resolutions: 'Record resolution' };
const modules = { ENGINEERING_WORK: 'engineering-work', DELIVERABLES: 'inputs-deliverables', DOCUMENT_REVIEW: 'documents-reviews', APPROVAL_RELEASE: 'approval-release', QUANTITIES: 'quantities-procurement', PROCUREMENT: 'quantities-procurement' };

async function request(path, options = {}) {
  const response = await fetch(`${API}${ROOT}${path}`, { ...options, headers: options.body ? { 'Content-Type': 'application/json' } : {} });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail;
    const message = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(d => d.msg).join('; ')
      : detail?.message ? `${detail.message}. ${(detail.blockers || []).flatMap(c => c.issues).join('; ')}` : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

function Status({ value }) {
  return <Badge variant="light" color={['PASSED', 'CLOSED', 'ACCEPTED', 'READY_FOR_CLOSURE'].includes(value) ? 'green' : ['FAILED', 'BLOCKED', 'OPEN'].includes(value) ? 'red' : 'blue'}>{(value || 'Pending').replaceAll('_', ' ')}</Badge>;
}

export default function CompletionGovernanceLayout() {
  const [ewps, setEwps] = useState([]);
  const [ewpId, setEwpId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState('');
  const [modal, setModal] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ actor: '', comment: '', title: '', status: 'CLOSED' });

  useEffect(() => {
    const controller = new AbortController();
    setListLoading(true);
    request('/ewps', { signal: controller.signal }).then(setEwps).catch(e => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setListLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    setSummary(null);
    if (!ewpId) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setError('');
    request(`/ewps/${encodeURIComponent(ewpId)}/summary`, { signal: controller.signal }).then(setSummary)
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [ewpId, refresh]);

  const openAction = (action, obligation = null) => {
    setSelected(obligation); setForm({ actor: '', comment: '', title: '', status: 'CLOSED' }); setError(''); setModal(action);
  };
  const save = async () => {
    setSaving(true); setError('');
    const payload = { version: summary.control.version, actor: form.actor.trim(), comment: form.comment.trim() };
    if (modal === 'governance') payload.summary_hash = summary.summary_hash;
    if (modal === 'actions') payload.title = form.title.trim();
    if (modal === 'resolutions') Object.assign(payload, { obligation_id: selected.id, source_hash: selected.source_hash, status: form.status });
    try {
      const result = await request(`/ewps/${encodeURIComponent(ewpId)}/${modal}`, { method: 'POST', body: JSON.stringify(payload) });
      setSummary(result); setModal('');
      setEwps(current => current.map(e => e.id === ewpId ? { ...e, status: result.ewp.status } : e));
      notifications.show({ color: 'green', title: 'Saved', message: actionLabels[modal] });
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const checks = summary?.checks || [];
  const passed = checks.filter(c => c.status === 'PASSED').length;
  const closed = summary?.completion_status === 'CLOSED';
  const state = summary?.control || {};
  const closure = state.closure;
  const canSubmit = summary?.ready_for_closure && summary?.governance_valid && summary?.completion_status !== 'COMPLETION_REVIEW' && !closed;
  const canClose = summary?.completion_status === 'COMPLETION_REVIEW' && summary?.governance_valid && summary?.ready_for_closure;

  return <Box p={{ base: 'md', md: 'xl' }} maw={1380} mx="auto">
    <Group justify="space-between" align="flex-start" mb="xl"><Box><Badge color="green" variant="light" mb="xs">Engineering Workbench</Badge>
      <Title order={2}>Completion & Governance</Title><Text size="sm" c="dimmed" mt={4}>Verify engineering obligations, record governance review, and approve EWP closure.</Text></Box>
      <ThemeIcon color="green" variant="light" size={46} radius="lg"><IconShieldCheck size={24} /></ThemeIcon></Group>
    <Stack gap="lg">
      <Paper withBorder radius="lg" p="lg" style={surface}><Group align="flex-end">
        <Select style={{ flex: 1 }} label="Engineering Work Package" placeholder={listLoading ? 'Loading EWPs...' : 'Select EWP'} searchable clearable
          data={ewps.map(e => ({ value: e.id, label: `${e.code || e.id} / ${e.name || ''}` }))} value={ewpId}
          disabled={saving || listLoading} onChange={value => { setSummary(null); setEwpId(value); setModal(''); }} />
        <Button variant="light" color="green" leftSection={<IconRefresh size={16} />} disabled={loading || saving} onClick={() => setRefresh(v => v + 1)}>Refresh</Button>
      </Group>{!listLoading && !ewps.length && <Text size="sm" c="dimmed" mt="sm">No engineering work packages are available.</Text>}</Paper>
      {error && !modal && <Alert color="red" title="Unable to complete request" icon={<IconAlertTriangle size={18} />}>{error}</Alert>}
      {loading && <Group><Loader size="sm" color="green" /><Text size="sm">Checking saved engineering records...</Text></Group>}
      {!ewpId && <Paper p="xl" withBorder radius="lg"><Text c="dimmed" ta="center">Select an EWP to load its completion summary.</Text></Paper>}
      {summary && <>
        <Paper withBorder radius="lg" p="lg" style={surface}><Group justify="space-between"><Box><Title order={3}>{summary.ewp.ewp_code}</Title><Text c="dimmed" size="sm">{summary.ewp.ewp_name}</Text></Box><Status value={summary.completion_status} /></Group>
          <Text size="sm" mt="lg" mb="xs">{passed} of {checks.length} completion checks satisfied</Text><Progress color="green" value={checks.length ? passed / checks.length * 100 : 0} />
          <SimpleGrid cols={{ base: 2, sm: 4 }} mt="lg">{[['Required checks', checks.length], ['Satisfied', passed], ['Failed checks', summary.blockers.length], ['Open conditions / actions', summary.obligations.filter(o => o.status === 'OPEN').length]].map(([label, count]) => <Box key={label}><Text size="xs" c="dimmed">{label}</Text><Text size="xl" fw={800}>{count}</Text></Box>)}</SimpleGrid>
        </Paper>
        {closed ? <Alert color="green" icon={<IconLock size={18} />} title="EWP closed">Closed by {closure.approved_by} on {new Date(closure.closed_at).toLocaleString()}. The checklist below is the saved closure snapshot.</Alert>
          : summary.blockers.length ? <Alert color="red" icon={<IconAlertTriangle size={18} />} title="Completion blockers"><Stack gap={4}>{summary.blockers.flatMap(c => c.issues.map((issue, i) => <Text size="sm" key={`${c.id}-${i}`}>&bull; {issue}</Text>))}</Stack></Alert>
          : <Alert color="green" icon={<IconCheck size={18} />} title="Ready for closure">All mandatory source checks pass. Complete governance verification and submit for closure review.</Alert>}
        <Paper withBorder radius="lg" style={surface}><Box p="lg"><Title order={4}>Completion checklist</Title><Text size="sm" c="dimmed">Calculated from saved records. Resolve failed checks in their originating module.</Text></Box><Divider />
          <ScrollArea><Table miw={760} verticalSpacing="sm"><Table.Thead><Table.Tr><Table.Th>Requirement</Table.Th><Table.Th>Result</Table.Th><Table.Th>Status</Table.Th><Table.Th>Source</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>{checks.map(c => <Table.Tr key={c.id}><Table.Td><Text size="sm" fw={650}>{c.check_name}</Text><Text size="xs" c="dimmed">{c.mandatory ? 'Mandatory' : 'Optional'} &middot; {c.total} records</Text></Table.Td>
              <Table.Td><Text size="sm">{c.remarks}</Text></Table.Td><Table.Td><Status value={c.status} /></Table.Td><Table.Td>{modules[c.check_type] && <Button component="a" href={`/ginfina/ewp/${modules[c.check_type]}`} size="compact-xs" variant="subtle">Open module</Button>}</Table.Td></Table.Tr>)}</Table.Tbody>
          </Table></ScrollArea></Paper>
        <Paper withBorder radius="lg" p="lg" style={surface}><Group justify="space-between" mb="md"><Title order={4}>Conditions, blockers & actions</Title><Button color="green" variant="light" disabled={closed || saving} onClick={() => openAction('actions')}>Add action</Button></Group>
          {!summary.obligations.length ? <Text size="sm" c="dimmed">No conditions, blockers or recorded actions for this EWP.</Text> : <Stack>{summary.obligations.map(o => <Paper key={o.id} withBorder p="md" radius="md"><Group justify="space-between" align="flex-start"><Box style={{ flex: 1 }}><Text size="xs" c="dimmed">{o.kind}</Text><Text fw={600} size="sm">{o.title}</Text>{o.resolution && <Text size="xs" mt={4}>Recorded by {o.resolution.actor}: {o.resolution.comment}</Text>}</Box><Status value={o.status} />{o.status === 'OPEN' && !closed && (o.managed_in === 'MANAGEMENT' ? <Button component="a" href="/ginfina/ewp/management-administration" size="xs" variant="light">Open Management</Button> : <Button size="xs" variant="light" onClick={() => openAction('resolutions', o)}>Resolve</Button>)}</Group></Paper>)}</Stack>}
        </Paper>
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <Paper withBorder radius="lg" p="lg" style={surface}><Title order={4} mb="md">Governance verification</Title><Stack>
            {state.governance && <Alert color={summary.governance_valid ? 'green' : 'orange'}>{summary.governance_valid ? 'Verified' : 'Source records changed; verification required again'} by {state.governance.reviewer}.<Text size="sm" mt={4}>{state.governance.comment}</Text></Alert>}
            {!closed && <><Text size="sm" c="dimmed">Review the completion summary and record the accountable reviewer and evidence.</Text><Button color="green" disabled={!summary.ready_for_closure || saving} onClick={() => openAction('governance')}>Run governance checks</Button></>}
          </Stack></Paper>
          <Paper withBorder radius="lg" p="lg" style={surface}><Title order={4} mb="md">Closure control</Title><Stack><Text size="sm" c="dimmed">Ready for closure &rarr; Completion review &rarr; Closed</Text>
            {state.submitted_by && <Text size="sm">Submitted by {state.submitted_by} on {new Date(state.submitted_at).toLocaleString()}.</Text>}
            {!closed && <><Button color="green" disabled={!canSubmit || saving} onClick={() => openAction('submit')}>Submit for Closure</Button><Button color="green" leftSection={<IconLock size={16} />} disabled={!canClose || saving} onClick={() => openAction('close')}>Approve Closure</Button></>}
            {closed && <><Text size="sm">{closure.comment}</Text><Text size="xs" c="dimmed" style={{ overflowWrap: 'anywhere' }}>Closure snapshot: {closure.snapshot_hash}</Text></>}
          </Stack></Paper>
        </SimpleGrid>
        {!!state.history?.length && <Paper withBorder radius="lg" p="lg" style={surface}><Title order={4} mb="md">Governance history</Title><Stack gap="sm">{[...state.history].reverse().map(h => <Box key={h.id}><Text size="sm" fw={600}>{h.action.replaceAll('_', ' ')} &middot; {h.actor}</Text><Text size="xs" c="dimmed">{new Date(h.at).toLocaleString()} &middot; {h.comment}</Text></Box>)}</Stack></Paper>}
      </>}
    </Stack>
    <Modal opened={Boolean(modal)} onClose={() => { if (!saving) { setModal(''); setError(''); } }} title={actionLabels[modal]} centered closeOnClickOutside={!saving} closeOnEscape={!saving} withCloseButton={!saving}>
      <Stack>{error && <Alert color="red">{error}</Alert>}
        {modal === 'close' && <Alert color="orange">Approval closes this EWP and saves its completion checklist and governance record.</Alert>}
        {modal === 'resolutions' && <><Text size="sm" fw={600}>{selected?.title}</Text><Select label="Resolution" data={selected?.kind === 'CONDITION' ? [{ value: 'CLOSED', label: 'Closed' }, { value: 'ACCEPTED', label: 'Formally accepted' }] : [{ value: 'CLOSED', label: 'Closed' }]} value={form.status} onChange={value => setForm(f => ({ ...f, status: value || 'CLOSED' }))} /></>}
        {modal === 'actions' && <TextInput label="Action" required value={form.title} onChange={e => { const title = e.currentTarget.value; setForm(f => ({ ...f, title })); }} />}
        <TextInput label={modal === 'close' ? 'Closure approver' : modal === 'governance' ? 'Governance reviewer' : 'Recorded by'} required value={form.actor} onChange={e => { const actor = e.currentTarget.value; setForm(f => ({ ...f, actor })); }} />
        <Textarea label="Comment / evidence reference" required minRows={3} value={form.comment} onChange={e => { const comment = e.currentTarget.value; setForm(f => ({ ...f, comment })); }} />
        <Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => { setModal(''); setError(''); }}>Cancel</Button><Button color="green" loading={saving} disabled={!form.actor.trim() || !form.comment.trim() || (modal === 'actions' && !form.title.trim())} onClick={save}>Save decision</Button></Group>
      </Stack>
    </Modal>
  </Box>;
}
