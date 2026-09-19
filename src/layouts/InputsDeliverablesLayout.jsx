import DatePickerInput from '../components/common/DatePickerInput';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Badge, Box, Button, Checkbox, Divider, Grid, Group, Modal, Paper,
  Progress, ScrollArea, Select, SimpleGrid, Stack, Switch, Table, Text,
  TextInput, ThemeIcon, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle, IconArrowRight, IconCheck, IconCircleCheck,
  IconFileDescription, IconInputCheck, IconLink, IconPlus, IconRefresh,
  IconRoute,
} from '@tabler/icons-react';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const TYPES = ['DRAWING', 'CALCULATION', 'SCHEDULE', 'SPECIFICATION', 'REPORT', 'DATASHEET', 'MODEL', 'OTHER'];
const DELIVERABLE_STATUSES = ['NOT_STARTED', 'DRAFT', 'IN_PROGRESS', 'READY_FOR_REVIEW'];
const FLOW = [
  'Load engineering work', 'Select ready activity', 'Verify READY FOR OUTPUT',
  'Load engineering inputs', 'Confirm required inputs', 'Create deliverable',
  'Link work activity', 'Assign engineer', 'Ready for review',
];
const surface = { borderColor: '#dfe7e2', boxShadow: '0 8px 26px rgba(21, 55, 39, 0.045)' };

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || `Request failed (HTTP ${response.status})`);
  return body;
}

function StatusBadge({ value }) {
  const normalized = value || 'NOT_SET';
  const color = {
    AVAILABLE: 'green', CONDITIONAL: 'orange', READY_FOR_OUTPUT: 'teal',
    NOT_STARTED: 'gray', DRAFT: 'gray', IN_PROGRESS: 'blue',
    READY_FOR_REVIEW: 'teal', NOT_SET: 'gray',
  }[normalized] || 'gray';
  return <Badge color={color} variant="light" radius="sm">{normalized.replaceAll('_', ' ')}</Badge>;
}

function Metric({ label, value, color = '#176c3a' }) {
  return <Paper withBorder p="sm" radius="md"><Text size="xs" c="dimmed">{label}</Text><Text size="xl" fw={850} c={color}>{value}</Text></Paper>;
}

function FlowBar({ completed }) {
  const count = completed.filter(Boolean).length;
  return (
    <Paper withBorder radius="lg" p="md" style={surface}>
      <Group justify="space-between" mb="sm"><Text fw={750} size="sm">Inputs and deliverables flow</Text><Text size="xs" c="dimmed">{count} of {FLOW.length} stages ready</Text></Group>
      <Progress value={(count / FLOW.length) * 100} color="green" size="sm" radius="xl" mb="md" />
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 9 }} spacing="xs">
        {FLOW.map((label, index) => <Stack key={label} gap={5} align="center" ta="center" p={7} style={{ borderRadius: 8, background: completed[index] ? '#eef9f2' : '#f7f8f7' }}><ThemeIcon size={25} radius="xl" color={completed[index] ? 'green' : 'gray'} variant={completed[index] ? 'filled' : 'light'}>{completed[index] ? <IconCheck size={13} /> : <Text size="10px" fw={800}>{index + 1}</Text>}</ThemeIcon><Text size="10px" lh={1.2} fw={completed[index] ? 700 : 550} c={completed[index] ? '#174b2d' : 'dimmed'}>{label}</Text></Stack>)}
      </SimpleGrid>
    </Paper>
  );
}

function deliverablePayload(item) {
  return {
    code: item.code,
    name: item.name,
    deliverable_type: item.deliverable_type,
    discipline: item.discipline,
    responsible_engineer: item.responsible_engineer,
    planned_issue_date: item.planned_issue_date || null,
    review_required: Boolean(item.review_required),
    approval_required: Boolean(item.approval_required),
    status: item.status,
  };
}

export default function InputsDeliverablesLayout() {
  const [readyWork, setReadyWork] = useState([]);
  const [workItemId, setWorkItemId] = useState('');
  const [context, setContext] = useState(null);
  const [selectedInputIds, setSelectedInputIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingConfirmation, setSavingConfirmation] = useState(false);
  const [savingDeliverable, setSavingDeliverable] = useState(false);
  const [updatingDeliverableId, setUpdatingDeliverableId] = useState('');
  const [error, setError] = useState('');
  const [deliverableModal, setDeliverableModal] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState(null);
  const [deliverableForm, setDeliverableForm] = useState({
    code: '', name: '', deliverable_type: 'DRAWING', discipline: '',
    responsible_engineer: '', planned_issue_date: '', review_required: true,
    approval_required: true, status: 'NOT_STARTED',
  });

  const selectedWork = readyWork.find(item => item.id === workItemId);
  const inputs = context?.inputs || [];
  const deliverables = context?.deliverables || [];
  const confirmed = Boolean(context?.confirmation?.confirmed);
  const selectedInputSet = useMemo(() => new Set(selectedInputIds), [selectedInputIds]);
  const allInputsSelected = inputs.length > 0 && inputs.every(item => selectedInputSet.has(item.id));
  const readyForReview = deliverables.filter(item => item.status === 'READY_FOR_REVIEW').length;
  const inPreparation = deliverables.filter(item => ['DRAFT', 'IN_PROGRESS'].includes(item.status)).length;
  const stages = [
    readyWork.length > 0,
    Boolean(workItemId),
    selectedWork?.status === 'READY_FOR_OUTPUT',
    inputs.length > 0,
    confirmed,
    deliverables.length > 0,
    deliverables.length > 0 && deliverables.every(item => item.engineering_work_item_id === workItemId),
    deliverables.length > 0 && deliverables.every(item => item.responsible_engineer),
    readyForReview > 0,
  ];

  const loadReadyWork = async () => {
    setLoading(true); setError('');
    try {
      const data = await request('/ewp/inputs-deliverables/ready-work');
      setReadyWork(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setReadyWork([]); setError(loadError.message);
    } finally { setLoading(false); }
  };

  const loadContext = async selectedId => {
    if (!selectedId) { setContext(null); setSelectedInputIds([]); return; }
    setLoading(true); setError('');
    try {
      const data = await request(`/ewp/inputs-deliverables/work-items/${encodeURIComponent(selectedId)}`);
      setContext(data);
      setSelectedInputIds(data.confirmation?.input_ids || []);
    } catch (loadError) {
      setContext(null); setSelectedInputIds([]); setError(loadError.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadReadyWork(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectWork = value => {
    const next = value || '';
    setWorkItemId(next);
    loadContext(next);
  };

  const toggleInput = (inputId, checked) => setSelectedInputIds(current => checked
    ? [...new Set([...current, inputId])]
    : current.filter(id => id !== inputId));

  const confirmInputs = async () => {
    setSavingConfirmation(true); setError('');
    try {
      const confirmation = await request(`/ewp/inputs-deliverables/work-items/${encodeURIComponent(workItemId)}/confirm-inputs`, {
        method: 'POST',
        body: JSON.stringify({ input_ids: selectedInputIds, confirmed_by: localStorage.getItem('user_id') || 'current-user' }),
      });
      setContext(current => ({ ...current, confirmation }));
      notifications.show({ color: 'green', title: 'Required inputs confirmed', message: `${inputs.length} controlled input(s) confirmed.` });
    } catch (saveError) {
      setError(saveError.message);
      notifications.show({ color: 'red', title: 'Unable to confirm inputs', message: saveError.message });
    } finally { setSavingConfirmation(false); }
  };

  const openNewDeliverable = () => {
    setEditingDeliverable(null);
    setDeliverableForm({
      code: `DEL-${String(deliverables.length + 1).padStart(3, '0')}`,
      name: '', deliverable_type: 'DRAWING', discipline: context?.ewp?.discipline || '',
      responsible_engineer: '', planned_issue_date: '', review_required: true,
      approval_required: true, status: 'NOT_STARTED',
    });
    setDeliverableModal(true);
  };

  const openDeliverable = item => {
    setEditingDeliverable(item);
    setDeliverableForm(deliverablePayload(item));
    setDeliverableModal(true);
  };

  const saveDeliverable = async () => {
    if (!deliverableForm.code.trim() || !deliverableForm.name.trim() || !deliverableForm.responsible_engineer.trim()) return;
    setSavingDeliverable(true); setError('');
    try {
      const path = editingDeliverable
        ? `/ewp/inputs-deliverables/deliverables/${encodeURIComponent(editingDeliverable.id)}`
        : `/ewp/inputs-deliverables/work-items/${encodeURIComponent(workItemId)}/deliverables`;
      const saved = await request(path, {
        method: editingDeliverable ? 'PATCH' : 'POST',
        body: JSON.stringify(deliverablePayload(deliverableForm)),
      });
      setContext(current => ({
        ...current,
        deliverables: editingDeliverable
          ? current.deliverables.map(item => item.id === editingDeliverable.id ? saved : item)
          : [...current.deliverables, saved],
      }));
      setDeliverableModal(false);
      notifications.show({ color: 'green', title: editingDeliverable ? 'Deliverable updated' : 'Deliverable created', message: `${saved.code} · ${saved.name}` });
    } catch (saveError) {
      setError(saveError.message);
      notifications.show({ color: 'red', title: 'Unable to save deliverable', message: saveError.message });
    } finally { setSavingDeliverable(false); }
  };

  const changeDeliverableStatus = async (item, nextStatus) => {
    setUpdatingDeliverableId(item.id); setError('');
    try {
      const saved = await request(`/ewp/inputs-deliverables/deliverables/${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        body: JSON.stringify(deliverablePayload({ ...item, status: nextStatus })),
      });
      setContext(current => ({ ...current, deliverables: current.deliverables.map(currentItem => currentItem.id === item.id ? saved : currentItem) }));
      notifications.show({ color: 'green', title: 'Deliverable status updated', message: `${saved.code} is ${saved.status.replaceAll('_', ' ')}.` });
    } catch (saveError) {
      setError(saveError.message);
      notifications.show({ color: 'red', title: 'Unable to update deliverable', message: saveError.message });
    } finally { setUpdatingDeliverableId(''); }
  };

  return (
    <Box p={{ base: 'md', md: 'xl' }} maw={1360} mx="auto">
      <Group justify="space-between" align="flex-start" mb="xl" wrap="wrap"><Box><Badge color="green" variant="light" mb="xs">Engineering Workbench</Badge><Title order={2}>Inputs & Deliverables</Title><Text c="dimmed" size="sm" mt={4}>Turn ready engineering work into controlled, review-ready deliverables.</Text></Box><ThemeIcon color="green" variant="light" radius="lg" size={46}><IconInputCheck size={23} /></ThemeIcon></Group>
      <Stack gap="lg">
        <FlowBar completed={stages} />
        {error && <Alert color="red" icon={<IconAlertTriangle size={18} />} withCloseButton onClose={() => setError('')}>{error}</Alert>}

        <Paper withBorder radius="lg" p="lg" style={surface}>
          <Group justify="space-between" align="flex-start" mb="md" wrap="wrap"><Box><Text fw={800}>Engineering Work</Text><Text size="xs" c="dimmed">Only activities with status READY FOR OUTPUT are available.</Text></Box><Button variant="subtle" color="green" leftSection={<IconRefresh size={15} />} loading={loading} onClick={loadReadyWork}>Refresh</Button></Group>
          <Select label="Ready engineering activity" placeholder={loading ? 'Loading engineering work…' : 'Select a READY FOR OUTPUT activity'} data={readyWork.map(item => ({ value: item.id, label: `${item.ewp.code} · ${item.work_code} · ${item.title}` }))} value={workItemId || null} onChange={selectWork} searchable clearable />
          {!loading && !readyWork.length && <Alert color="yellow" mt="md" icon={<IconAlertTriangle size={18} />}>No engineering work activity is READY FOR OUTPUT.</Alert>}
          {selectedWork && <Paper withBorder p="md" radius="md" mt="md" bg="#f3fbf6"><SimpleGrid cols={{ base: 1, sm: 4 }}><Box><Text size="xs" c="dimmed">EWP</Text><Text fw={700} size="sm">{selectedWork.ewp.code}</Text></Box><Box><Text size="xs" c="dimmed">Activity</Text><Text fw={700} size="sm">{selectedWork.work_code} · {selectedWork.title}</Text></Box><Box><Text size="xs" c="dimmed">Discipline</Text><Text fw={700} size="sm">{selectedWork.ewp.discipline}</Text></Box><Box><Text size="xs" c="dimmed">Status</Text><StatusBadge value={selectedWork.status} /></Box></SimpleGrid></Paper>}
        </Paper>

        {context && <>
          <Paper withBorder radius="lg" style={surface}>
            <Group justify="space-between" p="lg" wrap="wrap"><Box><Text fw={800}>Confirm required engineering inputs</Text><Text size="xs" c="dimmed">These inputs remain tied to the exact frozen SEB revision used to create the EWP.</Text></Box><Group><Badge color="green" variant="light">{selectedInputIds.length}/{inputs.length} selected</Badge>{confirmed && <Badge color="green" leftSection={<IconCircleCheck size={12} />}>CONFIRMED</Badge>}</Group></Group>
            <Divider />
            <ScrollArea type="auto"><Table verticalSpacing="sm" miw={820}><Table.Thead bg="#f7faf8"><Table.Tr><Table.Th w={48}><Checkbox aria-label="Select all required inputs" checked={allInputsSelected} disabled={confirmed} onChange={event => setSelectedInputIds(event.currentTarget.checked ? inputs.map(item => item.id) : [])} /></Table.Th><Table.Th>Input</Table.Th><Table.Th>Source revision</Table.Th><Table.Th>Reference</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{inputs.map(item => <Table.Tr key={item.id} bg={selectedInputSet.has(item.id) ? '#f3fbf6' : undefined}><Table.Td><Checkbox checked={selectedInputSet.has(item.id)} disabled={confirmed} onChange={event => toggleInput(item.id, event.currentTarget.checked)} /></Table.Td><Table.Td><Text fw={700} size="sm">{item.name}</Text></Table.Td><Table.Td><Text size="sm">{item.source}</Text></Table.Td><Table.Td><Text size="xs" ff="monospace">{item.reference}</Text></Table.Td><Table.Td><StatusBadge value={item.status} /></Table.Td></Table.Tr>)}</Table.Tbody></Table></ScrollArea>
            {!inputs.length && <Alert m="lg" color="yellow">No linked EWP inputs were found.</Alert>}
            <Divider />
            <Group justify="flex-end" p="lg">{confirmed ? <Alert color="green" icon={<IconCircleCheck size={18} />}>Required inputs are confirmed for this activity.</Alert> : <Button color="green" leftSection={<IconCheck size={16} />} loading={savingConfirmation} disabled={!allInputsSelected} onClick={confirmInputs}>Confirm Required Inputs</Button>}</Group>
          </Paper>

          <SimpleGrid cols={{ base: 2, sm: 4 }}><Metric label="Deliverables" value={deliverables.length} /><Metric label="In preparation" value={inPreparation} color="#1971c2" /><Metric label="Ready for review" value={readyForReview} color="#087f5b" /><Metric label="Linked activity" value={selectedWork?.work_code || '—'} /></SimpleGrid>

          <Paper withBorder radius="lg" style={surface}>
            <Group justify="space-between" p="lg" wrap="wrap"><Box><Text fw={800}>Deliverable Register</Text><Text size="xs" c="dimmed">Every deliverable is permanently linked to the selected engineering activity.</Text></Box><Button color="green" leftSection={<IconPlus size={15} />} disabled={!confirmed} onClick={openNewDeliverable}>Create Deliverable</Button></Group>
            <Divider />
            <ScrollArea type="auto"><Table verticalSpacing="sm" miw={1020}><Table.Thead bg="#f7faf8"><Table.Tr><Table.Th>Code</Table.Th><Table.Th>Deliverable</Table.Th><Table.Th>Type</Table.Th><Table.Th>Responsible engineer</Table.Th><Table.Th>Issue date</Table.Th><Table.Th>Activity link</Table.Th><Table.Th>Status</Table.Th><Table.Th></Table.Th></Table.Tr></Table.Thead><Table.Tbody>{deliverables.map(item => <Table.Tr key={item.id}><Table.Td><Text fw={750} size="sm">{item.code}</Text></Table.Td><Table.Td><Text fw={650} size="sm">{item.name}</Text><Group gap={4} mt={3}>{item.review_required && <Badge size="xs" variant="outline">REVIEW</Badge>}{item.approval_required && <Badge size="xs" color="green" variant="outline">APPROVAL</Badge>}</Group></Table.Td><Table.Td>{item.deliverable_type}</Table.Td><Table.Td>{item.responsible_engineer}</Table.Td><Table.Td>{item.planned_issue_date || '—'}</Table.Td><Table.Td><Badge color="blue" variant="light" leftSection={<IconRoute size={11} />}>{selectedWork?.work_code}</Badge></Table.Td><Table.Td><Select size="xs" w={180} data={DELIVERABLE_STATUSES.map(value => ({ value, label: value.replaceAll('_', ' ') }))} value={item.status} disabled={updatingDeliverableId === item.id} onChange={value => value && changeDeliverableStatus(item, value)} /></Table.Td><Table.Td><Button size="xs" variant="subtle" color="green" onClick={() => openDeliverable(item)}>Manage</Button></Table.Td></Table.Tr>)}</Table.Tbody></Table></ScrollArea>
            {!deliverables.length && <Box ta="center" p="xl"><ThemeIcon color="gray" variant="light" radius="xl" size={44} mx="auto"><IconFileDescription size={21} /></ThemeIcon><Text fw={700} mt="sm">No deliverables created</Text><Text size="sm" c="dimmed" mt={3}>Confirm the required inputs, then create the first deliverable.</Text></Box>}
          </Paper>

          {readyForReview > 0 && <Alert color="green" icon={<IconArrowRight size={18} />} title="Ready for Module 3 — Documents & Reviews">{readyForReview} deliverable(s) can now enter document creation and technical review.</Alert>}
        </>}
      </Stack>

      <Modal opened={deliverableModal} onClose={() => setDeliverableModal(false)} title={<Text fw={800}>{editingDeliverable ? 'Manage Deliverable' : 'Create Deliverable'}</Text>} size="lg" centered radius="lg">
        <Stack>
          <Alert color="blue" icon={<IconLink size={18} />}>Linked activity: <b>{selectedWork?.work_code} · {selectedWork?.title}</b></Alert>
          <Grid><Grid.Col span={{ base: 12, sm: 4 }}><TextInput label="Code" required value={deliverableForm.code} onChange={event => { const value = event.currentTarget.value; setDeliverableForm(form => ({ ...form, code: value })); }} /></Grid.Col><Grid.Col span={{ base: 12, sm: 8 }}><TextInput label="Deliverable name" required value={deliverableForm.name} onChange={event => { const value = event.currentTarget.value; setDeliverableForm(form => ({ ...form, name: value })); }} /></Grid.Col></Grid>
          <Grid><Grid.Col span={{ base: 12, sm: 6 }}><Select label="Type" data={TYPES} value={deliverableForm.deliverable_type} onChange={value => setDeliverableForm(form => ({ ...form, deliverable_type: value || 'OTHER' }))} /></Grid.Col><Grid.Col span={{ base: 12, sm: 6 }}><TextInput label="Discipline" required value={deliverableForm.discipline} onChange={event => { const value = event.currentTarget.value; setDeliverableForm(form => ({ ...form, discipline: value })); }} /></Grid.Col></Grid>
          <Grid><Grid.Col span={{ base: 12, sm: 6 }}><TextInput label="Responsible engineer" required value={deliverableForm.responsible_engineer} onChange={event => { const value = event.currentTarget.value; setDeliverableForm(form => ({ ...form, responsible_engineer: value })); }} /></Grid.Col><Grid.Col span={{ base: 12, sm: 6 }}><DatePickerInput label="Planned issue date" value={deliverableForm.planned_issue_date || ''} onChange={value => { setDeliverableForm(form => ({ ...form, planned_issue_date: value })); }} /></Grid.Col></Grid>
          <Grid><Grid.Col span={6}><Switch color="green" label="Review required" checked={deliverableForm.review_required} onChange={event => { const checked = event.currentTarget.checked; setDeliverableForm(form => ({ ...form, review_required: checked })); }} /></Grid.Col><Grid.Col span={6}><Switch color="green" label="Approval required" checked={deliverableForm.approval_required} onChange={event => { const checked = event.currentTarget.checked; setDeliverableForm(form => ({ ...form, approval_required: checked })); }} /></Grid.Col></Grid>
          <Select label="Preparation status" data={DELIVERABLE_STATUSES.map(value => ({ value, label: value.replaceAll('_', ' ') }))} value={deliverableForm.status} onChange={value => setDeliverableForm(form => ({ ...form, status: value || 'NOT_STARTED' }))} />
          <Group justify="flex-end" mt="md"><Button variant="default" disabled={savingDeliverable} onClick={() => setDeliverableModal(false)}>Cancel</Button><Button color="green" loading={savingDeliverable} disabled={!deliverableForm.code.trim() || !deliverableForm.name.trim() || !deliverableForm.responsible_engineer.trim()} onClick={saveDeliverable}>Save Deliverable</Button></Group>
        </Stack>
      </Modal>
    </Box>
  );
}
