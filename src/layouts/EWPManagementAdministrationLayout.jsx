import { useEffect, useState } from 'react';
import { Alert, Badge, Box, Button, Checkbox, Divider, Group, Loader, Modal, MultiSelect, Paper, Progress, ScrollArea, Select, SimpleGrid, Stack, Table, Tabs, Text, Textarea, TextInput, Title } from '@mantine/core';
import { IconPlus, IconRefresh, IconSettings } from '@tabler/icons-react';
import DatePickerInput from '../components/common/DatePickerInput';

const ROOT = `${(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')}/ewp/management-administration`;
const labels = { overview: 'Overview', team: 'Team & assignments', milestones: 'Milestones', controls: 'Issues, risks & actions', access: 'Access', history: 'Activity history' };
const roles = ['Lead Engineer', 'Design Engineer', 'Engineer', 'Reviewer', 'Approver', 'Consultant'];
const statuses = ['DRAFT', 'NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'READY_FOR_OUTPUT', 'COMPLETED'];
const readable = value => String(value || '').replaceAll('_', ' ');
async function request(path, options = {}) {
  const response = await fetch(`${ROOT}${path}`, { ...options, headers: options.body ? { 'Content-Type': 'application/json' } : {} });
  const data = await response.json();
  if (!response.ok) throw new Error(Array.isArray(data.detail) ? data.detail.map(e => e.msg).join('; ') : typeof data.detail === 'string' ? data.detail : 'Request failed. Refresh before retrying.');
  return data;
}
function Status({ value }) { return <Badge variant="light" color={['CLOSED', 'COMPLETE', 'COMPLETED', 'READY_FOR_OUTPUT'].includes(value) ? 'green' : value === 'CRITICAL' ? 'red' : 'blue'}>{readable(value)}</Badge>; }
function Empty({ children }) { return <Text c="dimmed" size="sm" py="lg">{children}</Text>; }

export default function EWPManagementAdministrationLayout() {
  const [projects, setProjects] = useState([]), [users, setUsers] = useState([]), [ewps, setEwps] = useState([]);
  const [projectId, setProjectId] = useState(null), [ewpId, setEwpId] = useState(null), [data, setData] = useState(null);
  const [loading, setLoading] = useState(false), [listLoading, setListLoading] = useState(true), [saving, setSaving] = useState(false);
  const [error, setError] = useState(''), [refresh, setRefresh] = useState(0), [tab, setTab] = useState('overview'), [kind, setKind] = useState('actions');
  const [modal, setModal] = useState(null), [form, setForm] = useState({}), [actor, setActor] = useState(''), [comment, setComment] = useState('');
  useEffect(() => {
    const controller = new AbortController(); setListLoading(true);
    Promise.all([request('/projects', { signal: controller.signal }), request('/users', { signal: controller.signal })])
      .then(([p, u]) => { setProjects(p); setUsers(u); }).catch(e => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setListLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    const controller = new AbortController(); setEwps([]);
    if (projectId) request(`/ewps?project_id=${encodeURIComponent(projectId)}`, { signal: controller.signal }).then(setEwps).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [projectId, refresh]);
  useEffect(() => {
    const controller = new AbortController(); setData(null); setError(''); setLoading(Boolean(ewpId));
    if (ewpId) request(`/ewps/${encodeURIComponent(ewpId)}/overview`, { signal: controller.signal }).then(setData)
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [ewpId, refresh]);
  const open = (type, record = null) => {
    const defaults = type === 'team' ? { user_id: '', role: 'Engineer', discipline: data.ewp.discipline || '', organization: '', assignment: '', active: true }
      : type === 'milestones' ? { name: '', target_date: '', owner: '', status: 'UPCOMING', note: '' }
      : type === 'access' ? { user_id: '', permissions: ['VIEW'], active: true }
      : type === 'settings' ? { discipline: data.ewp.discipline || '', planned_start: data.ewp.planned_start || '', planned_finish: data.ewp.planned_finish || '', status: data.ewp.status || 'DRAFT' }
      : { title: '', description: '', owner: '', due_date: '', priority: 'MEDIUM', status: 'OPEN', blocking: true, resolution: '' };
    setForm(record ? Object.fromEntries(Object.keys(defaults).map(key => [key, record[key] ?? defaults[key]])) : defaults);
    setComment(''); setError(''); setModal({ type, id: record?.id });
  };
  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const textField = (key, label, required = true, multiline = false) => {
    const Component = multiline ? Textarea : TextInput;
    return <Component label={label} required={required} value={form[key] || ''} onChange={e => change(key, e.currentTarget.value)} />;
  };
  const selectField = (key, label, options) => <Select label={label} required data={options} value={form[key] || null} onChange={value => change(key, value || '')} searchable />;
  const close = () => { if (!saving) { setModal(null); setError(''); } };
  async function save(event) {
    event.preventDefault(); setSaving(true); setError('');
    const settings = modal.type === 'settings';
    const payload = { ...form };
    if (settings) { payload.planned_start ||= null; payload.planned_finish ||= null; if (data.ewp.status === 'COMPLETION_REVIEW') delete payload.status; }
    try {
      const result = await request(`/ewps/${encodeURIComponent(ewpId)}/${settings ? 'settings' : `records/${modal.type}${modal.id ? `/${modal.id}` : ''}`}`, {
        method: settings || modal.id ? 'PATCH' : 'POST', body: JSON.stringify({ version: data.version, actor, comment, ...(settings ? payload : { data: payload }) }),
      });
      setData(result); setModal(null);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }
  const edit = (type, record) => <Button size="compact-xs" variant="light" disabled={data.read_only || saving} onClick={() => open(type, record)}>Edit</Button>;
  const table = (headers, rows) => <ScrollArea><Table miw={650} verticalSpacing="md" highlightOnHover><Table.Thead><Table.Tr>{headers.map(h => <Table.Th key={h}>{h}</Table.Th>)}</Table.Tr></Table.Thead><Table.Tbody>{rows}</Table.Tbody></Table></ScrollArea>;
  const userOptions = users.map(u => ({ value: u.id, label: u.name }));
  if (form.user_id && !userOptions.some(u => u.value === form.user_id)) userOptions.push({ value: form.user_id, label: 'Inactive / previous user' });

  return <Box maw={1440} mx="auto" p={{ base: 'md', md: 'xl' }}>
    <Group justify="space-between" mb="xl"><Box><Badge variant="light" color="green" mb="xs">Engineering Workbench</Badge><Title order={2}>Management & Administration</Title><Text c="dimmed" size="sm" mt={6}>Coordinate people, dates and obligations across the engineering work package.</Text></Box><Button variant="light" leftSection={<IconRefresh size={16} />} disabled={saving || loading} onClick={() => setRefresh(v => v + 1)}>Refresh</Button></Group>
    <Stack gap="lg">
      <Paper withBorder radius="lg" p="lg"><SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Select label="Project" placeholder={listLoading ? 'Loading projects…' : 'Select project'} searchable clearable disabled={saving || listLoading} data={projects.map(p => ({ value: p.id, label: `${p.code || ''} ${p.name || p.id}`.trim() }))} value={projectId} onChange={value => { setProjectId(value); setEwpId(null); setData(null); }} />
        <Select label="Engineering Work Package" placeholder="Select EWP" searchable clearable disabled={!projectId || saving} data={ewps.map(e => ({ value: e.id, label: `${e.code || e.id} / ${e.name || ''}` }))} value={ewpId} onChange={value => { setData(null); setEwpId(value); }} />
      </SimpleGrid>{projectId && !ewps.length && <Text size="xs" c="dimmed" mt="sm">No work packages loaded for this project.</Text>}</Paper>
      {error && !modal && <Alert color="red" title="Unable to complete request">{error}</Alert>}
      {loading && <Group><Loader size="sm" /><Text size="sm">Loading management records…</Text></Group>}
      {!ewpId && <Paper withBorder p="xl" radius="lg"><Empty>Select a project and EWP to open its management workspace.</Empty></Paper>}
      {data && <>
        <Paper withBorder radius="lg" p="lg"><Group justify="space-between"><Box><Title order={3}>{data.ewp.ewp_code}</Title><Text c="dimmed">{data.ewp.ewp_name}</Text><Text size="sm" mt="sm">Lead engineer: {data.ewp.lead_engineer || 'Unassigned'} · {data.ewp.discipline || 'Discipline unassigned'}</Text></Box><Group><Status value={data.ewp.status} /><Button variant="default" leftSection={<IconSettings size={16} />} disabled={data.read_only || saving} onClick={() => open('settings')}>EWP settings</Button></Group></Group>
          <Group justify="space-between" mt="lg" mb="xs"><Text size="sm">Engineering progress</Text><Text fw={700}>{data.overall_progress}%</Text></Group><Progress value={data.overall_progress} color="green" size="sm" /><Text c="dimmed" size="xs" mt="xs">Average across modules with saved records. Closure readiness is verified in Completion & Governance.</Text>
        </Paper>
        {data.read_only && <Alert color="green">This EWP is closed. Management records are read-only.</Alert>}
        <Tabs value={tab} onChange={setTab} color="green"><Tabs.List mb="lg">{Object.entries(labels).map(([value, label]) => <Tabs.Tab key={value} value={value}>{label}</Tabs.Tab>)}</Tabs.List>
          <Tabs.Panel value="overview"><Stack>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }}>{data.metrics.map(m => <Paper withBorder p="md" radius="md" key={m.label}><Text size="sm" c="dimmed">{m.label}</Text><Text size="xl" fw={750} my="xs">{m.total ? `${m.percent}%` : '—'}</Text><Progress color="green" value={m.percent} /><Text size="xs" c="dimmed" mt="sm">{m.complete} / {m.total} records</Text></Paper>)}</SimpleGrid>
            <SimpleGrid cols={{ base: 2, sm: 4 }}>{['open_issues', 'open_risks', 'open_actions', 'overdue_actions'].map(key => <Paper withBorder p="md" radius="md" key={key}><Text size="xs" c="dimmed" tt="uppercase">{readable(key)}</Text><Text size="xl" fw={750}>{data.counts[key]}</Text></Paper>)}</SimpleGrid>
            <Paper withBorder p="lg" radius="lg"><Title order={4} mb="md">Needs attention</Title>{!data.attention.length ? <Empty>No overdue work, pending document decisions or upcoming deliverables found.</Empty> : table(['Category', 'Record', 'Owner / date', 'Status'], data.attention.map((a, i) => <Table.Tr key={i}><Table.Td>{readable(a.kind)}</Table.Td><Table.Td>{a.title}</Table.Td><Table.Td>{a.owner || '—'}<Text size="xs" c="dimmed">{a.date || ''}</Text></Table.Td><Table.Td><Status value={a.status} /></Table.Td></Table.Tr>))}</Paper>
          </Stack></Tabs.Panel>
          <Tabs.Panel value="team"><Paper withBorder p="lg" radius="lg"><Group justify="space-between" mb="md"><Title order={4}>Team & discipline assignments</Title><Button leftSection={<IconPlus size={16} />} disabled={data.read_only} onClick={() => open('team')}>Add team member</Button></Group>{!data.team.length ? <Empty>No team members assigned yet.</Empty> : table(['Name', 'Role / discipline', 'Assignment', 'Active', 'Actions'], data.team.map(r => <Table.Tr key={r.id}><Table.Td>{r.name}<Text size="xs" c="dimmed">{r.organization}</Text></Table.Td><Table.Td>{r.role}<Text size="xs" c="dimmed">{r.discipline}</Text></Table.Td><Table.Td>{r.assignment || '—'}</Table.Td><Table.Td>{r.active ? 'Yes' : 'No'}</Table.Td><Table.Td>{edit('team', r)}</Table.Td></Table.Tr>))}</Paper></Tabs.Panel>
          <Tabs.Panel value="milestones"><Paper withBorder p="lg" radius="lg"><Group justify="space-between" mb="md"><Title order={4}>Dates & milestones</Title><Button disabled={data.read_only} onClick={() => open('milestones')}>Add milestone</Button></Group>{!data.milestones.length ? <Empty>No milestones defined yet.</Empty> : table(['Milestone', 'Owner', 'Target date', 'Status', 'Actions'], data.milestones.map(r => <Table.Tr key={r.id}><Table.Td>{r.name}<Text size="xs" c="dimmed">{r.note}</Text></Table.Td><Table.Td>{r.owner}</Table.Td><Table.Td>{r.target_date}</Table.Td><Table.Td><Status value={r.status} /></Table.Td><Table.Td>{edit('milestones', r)}</Table.Td></Table.Tr>))}</Paper></Tabs.Panel>
          <Tabs.Panel value="controls"><Paper withBorder p="lg" radius="lg"><Group justify="space-between" mb="md"><Select aria-label="Control register" data={['actions', 'issues', 'risks'].map(value => ({ value, label: readable(value) }))} value={kind} onChange={v => setKind(v || 'actions')} /><Button disabled={data.read_only} onClick={() => open(kind)}>Add {kind.slice(0, -1)}</Button></Group><Text size="sm" c="dimmed" mb="md">Open actions and blocking issues or risks must be resolved before EWP closure.</Text>{!data[kind].length ? <Empty>No {kind} recorded.</Empty> : table(['Record', 'Owner / due', 'Priority', 'Status', 'Actions'], data[kind].map(r => <Table.Tr key={r.id}><Table.Td><Text fw={600} size="sm">{r.title}</Text><Text size="xs" c="dimmed">{r.description}</Text>{r.blocking && <Text size="xs" c="orange">Closure obligation</Text>}{r.resolution && <Text size="xs">Resolution: {r.resolution}</Text>}</Table.Td><Table.Td>{r.owner}<Text size="xs" c="dimmed">{r.due_date}</Text></Table.Td><Table.Td><Status value={r.priority} /></Table.Td><Table.Td><Status value={r.status} /></Table.Td><Table.Td>{edit(kind, r)}</Table.Td></Table.Tr>))}</Paper></Tabs.Panel>
          <Tabs.Panel value="access"><Paper withBorder p="lg" radius="lg"><Group justify="space-between" mb="md"><Title order={4}>Access assignments</Title><Button disabled={data.read_only} onClick={() => open('access')}>Assign access</Button></Group><Alert color="blue" mb="md">Pilot mode: these assignments are saved for administration. They do not enforce authentication or restrict API access.</Alert>{!data.access.length ? <Empty>No access assignments recorded.</Empty> : table(['User', 'Permissions', 'Active', 'Actions'], data.access.map(r => <Table.Tr key={r.id}><Table.Td>{r.name}</Table.Td><Table.Td>{r.permissions.join(', ')}</Table.Td><Table.Td>{r.active ? 'Yes' : 'No'}</Table.Td><Table.Td>{edit('access', r)}</Table.Td></Table.Tr>))}</Paper></Tabs.Panel>
          <Tabs.Panel value="history"><Paper withBorder p="lg" radius="lg"><Title order={4} mb="md">Recorded activity</Title><Text size="sm" c="dimmed" mb="lg">Management changes, document approvals/releases, procurement and governance events. Pilot actor names are self-declared.</Text>{!data.history.length ? <Empty>No recorded activity yet.</Empty> : <Stack>{data.history.map((h, i) => <Box key={h.id || i}><Group justify="space-between"><Text size="sm" fw={650}>{readable(h.action)}</Text><Badge variant="light">{h.module}</Badge></Group><Text size="sm">{h.comment}</Text><Text size="xs" c="dimmed">{h.actor || 'Actor not recorded'} · {h.at ? new Date(h.at).toLocaleString() : 'Date not recorded'}</Text>{h.after && <details><summary style={{ cursor: 'pointer', fontSize: 12 }}>View changes</summary>{Object.entries(h.after).filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key)).map(([key, value]) => <Text key={key} size="xs">{readable(key)}: {h.before && `${String(h.before[key] ?? '—')} → `}{Array.isArray(value) ? value.join(', ') : String(value ?? '—')}</Text>)}</details>}<Divider mt="sm" /></Box>)}</Stack>}</Paper></Tabs.Panel>
        </Tabs>
      </>}
    </Stack>
    <Modal opened={Boolean(modal)} onClose={close} title={modal ? `${modal.id ? 'Edit' : modal.type === 'settings' ? 'Update' : 'Add'} ${readable(modal.type)}` : ''} centered size="lg" closeOnClickOutside={!saving} closeOnEscape={!saving} withCloseButton={!saving}>
      <form onSubmit={save}><Stack>{error && <Alert color="red">{error}</Alert>}
        {['team', 'access'].includes(modal?.type) && <>{selectField('user_id', 'User', userOptions)}<Checkbox label="Active assignment" checked={Boolean(form.active)} onChange={e => change('active', e.currentTarget.checked)} /></>}
        {modal?.type === 'team' && <>{selectField('role', 'Role', roles)}{textField('discipline', 'Discipline')}{textField('organization', 'Organization', false)}{textField('assignment', 'Assignment', false, true)}</>}
        {modal?.type === 'access' && <MultiSelect label="Permissions" required data={['VIEW', 'EDIT', 'REVIEW', 'APPROVE', 'ADMIN']} value={form.permissions || []} onChange={v => change('permissions', v)} />}
        {modal?.type === 'milestones' && <>{textField('name', 'Milestone name')}{textField('owner', 'Owner')}<DatePickerInput label="Target date" required value={form.target_date} onChange={v => change('target_date', v)} />{selectField('status', 'Status', ['UPCOMING', 'IN_PROGRESS', 'COMPLETE'])}{textField('note', 'Note', false, true)}</>}
        {['issues', 'risks', 'actions'].includes(modal?.type) && <>{textField('title', 'Title')}{textField('description', 'Description', false, true)}{textField('owner', 'Owner')}<DatePickerInput label="Due date" required value={form.due_date} onChange={v => change('due_date', v)} />{selectField('priority', 'Priority', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])}{selectField('status', 'Status', ['OPEN', 'IN_PROGRESS', 'CLOSED'])}{modal.type !== 'actions' && <Checkbox label="Blocks EWP closure" checked={Boolean(form.blocking)} onChange={e => change('blocking', e.currentTarget.checked)} />}{textField('resolution', 'Resolution / evidence reference', form.status === 'CLOSED', true)}</>}
        {modal?.type === 'settings' && <>{textField('discipline', 'Discipline')}<SimpleGrid cols={2}><DatePickerInput label="Planned start" value={form.planned_start} onChange={v => change('planned_start', v)} /><DatePickerInput label="Planned finish" value={form.planned_finish} onChange={v => change('planned_finish', v)} /></SimpleGrid>{data?.ewp.status === 'COMPLETION_REVIEW' ? <Alert>Status is controlled by Completion & Governance.</Alert> : selectField('status', 'Status', statuses)}</>}
        <Divider /><TextInput label="Recorded by" required value={actor} onChange={e => setActor(e.currentTarget.value)} /><Textarea label="Change note" required value={comment} onChange={e => setComment(e.currentTarget.value)} />
        <Group justify="flex-end"><Button variant="default" disabled={saving} onClick={close}>Cancel</Button><Button type="submit" loading={saving} disabled={!actor.trim() || !comment.trim()}>Save changes</Button></Group>
      </Stack></form>
    </Modal>
  </Box>;
}
