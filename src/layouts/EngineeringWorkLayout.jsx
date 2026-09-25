import DatePickerInput from '../components/common/DatePickerInput';
import EngineeringWorkReport from '../components/common/EngineeringWorkReport';
import { Children, cloneElement, isValidElement, useEffect, useMemo, useState } from 'react';
import {
  Alert, Badge, Box, Button, Checkbox, Divider, Grid, Group, Modal, Paper,
  Progress, Select, SimpleGrid, Slider, Stack, Table, Text,
  Textarea, TextInput, ThemeIcon, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import styles from './EngineeringWorkLayout.module.css';
import {
  IconAlertTriangle, IconBriefcase, IconCalendar, IconCheck, IconCircleCheck,
  IconDatabase, IconEdit, IconEye, IconFileCheck, IconLink, IconPlayerPlay,
  IconPlus, IconProgressCheck, IconShieldCheck, IconUsers,
} from '@tabler/icons-react';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

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

const STATUSES = ['DRAFT', 'NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'READY_FOR_OUTPUT', 'COMPLETED'];
const DISCIPLINES = ['ELECTRICAL', 'CIVIL', 'STRUCTURAL', 'MECHANICAL', 'WATER / PUMPING', 'SCADA / COMMUNICATION', 'HSE / ENVIRONMENT'];
const FLOW = [
  'Load released SEB projects', 'Select project', 'Load released SEBs',
  'Select SEB', 'Select released revision', 'Load frozen release items',
  'Select EWP inputs', 'Create EWP', 'Store input links',
];
const surface = { borderColor: '#dfe7e2', boxShadow: '0 8px 26px rgba(21, 55, 39, 0.045)' };

function releaseItemId(item) {
  return String(item.release_item_id || item.seb_item_id || item.id || '');
}

function readinessStatus(item) {
  if (typeof item.readiness === 'string') return item.readiness;
  return item.readiness?.status || item.readiness?.readiness || 'NOT_SET';
}

function StatusBadge({ value }) {
  const normalized = value || 'NOT_SET';
  const color = {
    DRAFT: 'gray', NOT_STARTED: 'gray', IN_PROGRESS: 'blue', ON_HOLD: 'orange',
    READY_FOR_OUTPUT: 'teal', COMPLETED: 'green', RELEASED: 'green', READY: 'green',
    CONDITIONAL: 'orange', BLOCKED: 'red', ACCEPTED: 'green', ACCEPT: 'green',
    ACCEPT_WITH_CONDITION: 'orange', NOT_SET: 'gray',
  }[normalized] || 'gray';
  return <Badge color={color} variant="light" radius="sm">{normalized.replaceAll('_', ' ')}</Badge>;
}

function FlowBar({ completed }) {
  const readyCount = completed.filter(Boolean).length;
  return (
    <Paper withBorder radius="lg" p="md" style={surface}>
      <Group justify="space-between" mb="sm">
        <Text size="sm" fw={750}>Engineering work setup</Text>
        <Text size="xs" c="dimmed">{readyCount} of {FLOW.length} stages ready</Text>
      </Group>
      <Progress value={(readyCount / FLOW.length) * 100} color="green" size="sm" radius="xl" mb="md" />
      <Box className={styles.activeStage} aria-live="polite"><Text size="sm" fw={700}>{readyCount === FLOW.length ? 'Setup complete' : `Next: ${FLOW[completed.findIndex(value => !value)]}`}</Text><Text size="xs" c="dimmed">{readyCount === FLOW.length ? 'Manage engineering activities below.' : 'Select the released basis and create your work package below.'}</Text></Box>
      <SimpleGrid className={styles.stepRail} cols={9} spacing="xs">
        {FLOW.map((label, index) => (
          <Stack key={label} gap={5} align="center" ta="center" p={7} style={{ borderRadius: 8, background: completed[index] ? '#eef9f2' : '#f7f8f7' }}>
            <ThemeIcon size={25} radius="xl" color={completed[index] ? 'green' : 'gray'} variant={completed[index] ? 'filled' : 'light'}>
              {completed[index] ? <IconCheck size={13} /> : <Text size="10px" fw={800}>{index + 1}</Text>}
            </ThemeIcon>
            <Text size="10px" lh={1.2} fw={completed[index] ? 700 : 550} c={completed[index] ? '#174b2d' : 'dimmed'}>{label}</Text>
          </Stack>
        ))}
      </SimpleGrid>
    </Paper>
  );
}

function Info({ label, value }) {
  return <Box><Text size="10px" tt="uppercase" c="dimmed" fw={750}>{label}</Text><Text component="div" size="sm" fw={700} mt={2}>{value || '—'}</Text></Box>;
}

function ResponsiveTable({ children, label, ...props }) {
  const parts = Children.toArray(children);
  const head = parts.find(part => part.type === Table.Thead);
  const headings = Children.toArray(Children.toArray(head?.props.children)[0]?.props.children).map(cell => cell.props.children);
  return <Box className={styles.tableViewport} role="region" aria-label={label} tabIndex={0}><Table {...props} className={styles.recordTable}>{parts.map(part => {
    if (part.type !== Table.Tbody) return part;
    return cloneElement(part, {}, Children.map(part.props.children, row => {
      if (!isValidElement(row) || row.type !== Table.Tr) return row;
      return cloneElement(row, {}, Children.map(row.props.children, (cell, index) => isValidElement(cell) && cell.type === Table.Td
        ? cloneElement(cell, { 'data-label': headings[index] }, <Box>{cell.props.children}</Box>) : cell));
    }));
  })}</Table></Box>;
}

function frozenDesignBasis(releasedSeb, selectedIds) {
  if (!releasedSeb) return null;
  const selected = new Set(selectedIds);
  const sourceItems = (releasedSeb.released_seb_items || []).filter(item => selected.has(releaseItemId(item)));
  const priority = { BLOCKED: 4, CONDITIONAL: 3, READY: 2, NOT_APPLICABLE: 1, NOT_SET: 0 };
  const readiness = sourceItems.map(readinessStatus).sort((a, b) => (priority[b] || 0) - (priority[a] || 0))[0] || 'NOT_SET';
  const conditions = sourceItems.flatMap(item => {
    const value = typeof item.readiness === 'object' ? item.readiness?.conditional : null;
    return value?.enabled && value.condition ? [value.condition] : [];
  });
  const constraints = sourceItems.flatMap(item => {
    const value = typeof item.readiness === 'object' ? item.readiness?.blocked : null;
    return value?.enabled ? [value.blocker || value.reason].filter(Boolean) : [];
  });
  return {
    status: 'RELEASED', seb_code: releasedSeb.seb_code, revision: releasedSeb.revision_no,
    readiness, conditions, constraints,
    items: sourceItems.map(item => ({
      id: releaseItemId(item),
      fact: item.display_value || item.item_name || item.fact_id,
      discipline: item.discipline || 'UNASSIGNED',
      decision: item.review_decision || 'NOT_SET',
      readiness: readinessStatus(item),
      evidence: item.source_reference?.collection
        ? `${item.source_reference.collection} / ${item.source_reference.record_id}`
        : 'Frozen source reference',
    })),
  };
}

export default function EngineeringWorkLayout() {
  const isMobile = useMediaQuery('(max-width: 47.99em)');
  const [projects, setProjects] = useState([]);
  const [releasedSebRecords, setReleasedSebRecords] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [sebId, setSebId] = useState('');
  const [revisionId, setRevisionId] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState('');
  const [ewps, setEwps] = useState([]);
  const [savedEwps, setSavedEwps] = useState({});
  const [ewpId, setEwpId] = useState('');
  const [ewpSebInputs, setEwpSebInputs] = useState({});
  const [activities, setActivities] = useState({});
  const [basisReviewed, setBasisReviewed] = useState(false);
  const [basisModal, setBasisModal] = useState(false);
  const [ewpModal, setEwpModal] = useState(false);
  const [editingEwpId, setEditingEwpId] = useState(null);
  const [activityModal, setActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [savingEwp, setSavingEwp] = useState(false);
  const [savingActivity, setSavingActivity] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [ewpForm, setEwpForm] = useState({ code: '', name: '', discipline: 'ELECTRICAL', scope: '', lead: '', start: '', end: '' });
  const [activityForm, setActivityForm] = useState({ code: '', title: '', engineer: '', status: 'NOT_STARTED', progress: 0, start: '', end: '' });

  const project = projects.find(item => item.project_id === projectId);
  const sebOptions = useMemo(() => {
    const unique = new Map();
    releasedSebRecords.forEach(item => {
      if (!unique.has(item.seb_id)) unique.set(item.seb_id, { value: item.seb_id, label: item.seb_code || item.seb_id });
    });
    return [...unique.values()];
  }, [releasedSebRecords]);
  const revisionOptions = useMemo(() => releasedSebRecords
    .filter(item => item.seb_id === sebId)
    .map(item => ({ value: item.revision_id, label: `${item.revision_no} · ${item.item_count} frozen item(s) · ${item.status}` })), [releasedSebRecords, sebId]);
  const selectedReleasedSeb = releasedSebRecords.find(item => item.seb_id === sebId && item.revision_id === revisionId);
  const releaseItems = selectedReleasedSeb?.released_seb_items || [];
  const selectedIdSet = useMemo(() => new Set(selectedItemIds), [selectedItemIds]);
  const selectedItems = releaseItems.filter(item => selectedIdSet.has(releaseItemId(item)));
  const ewp = ewps.find(item => item.id === ewpId);
  const inputLinks = ewpSebInputs[ewpId] || [];
  const linkedReleaseItemIds = useMemo(() => inputLinks.map(item => item.release_item_id), [inputLinks]);
  const handoff = useMemo(() => frozenDesignBasis(selectedReleasedSeb, linkedReleaseItemIds), [selectedReleasedSeb, linkedReleaseItemIds]);
  const work = activities[ewpId] || [];
  const allReadyForOutput = work.length > 0 && work.every(item => ['READY_FOR_OUTPUT', 'COMPLETED'].includes(item.status));
  const completed = [
    projects.length > 0, Boolean(projectId), releasedSebRecords.length > 0,
    Boolean(sebId), Boolean(revisionId), releaseItems.length > 0,
    selectedItemIds.length > 0, Boolean(ewpId),
    Boolean(ewpId) && inputLinks.length === selectedItemIds.length && inputLinks.length > 0,
  ];

  const loadReleasedProjects = async () => {
    setSourceLoading(true); setSourceError('');
    try {
      const data = await request('/ewp/engineering-work/released-projects');
      setProjects(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setProjects([]); setSourceError(loadError.message);
    } finally { setSourceLoading(false); }
  };

  const loadReleasedSebRecords = async selectedProjectId => {
    if (!selectedProjectId) return;
    setSourceLoading(true); setSourceError('');
    try {
      const data = await request(`/ewp/engineering-work/released-sebs?project_id=${encodeURIComponent(selectedProjectId)}`);
      setReleasedSebRecords(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setReleasedSebRecords([]); setSourceError(loadError.message);
    } finally { setSourceLoading(false); }
  };

  useEffect(() => { loadReleasedProjects(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeProject = value => {
    const next = value || '';
    setProjectId(next); setReleasedSebRecords([]); setSebId(''); setRevisionId('');
    setSelectedItemIds([]); setEwpId(''); setBasisReviewed(false);
    if (next) loadReleasedSebRecords(next);
  };

  const changeSeb = value => {
    setSebId(value || ''); setRevisionId(''); setSelectedItemIds([]); setEwpId(''); setBasisReviewed(false);
  };

  const changeRevision = value => {
    setRevisionId(value || ''); setSelectedItemIds([]); setEwpId(''); setBasisReviewed(false);
  };

  const toggleItem = (itemId, checked) => setSelectedItemIds(current => checked
    ? [...new Set([...current, itemId])]
    : current.filter(id => id !== itemId));
  const toggleAllItems = checked => setSelectedItemIds(checked ? releaseItems.map(releaseItemId).filter(Boolean) : []);

  const openCreateEwp = () => {
    const projectEwpCount = ewps.filter(item => item.project_id === projectId).length;
    setEditingEwpId(null);
    setEwpForm({
      code: `EWP-${project?.project_code || selectedReleasedSeb?.seb_code || 'NEW'}-${String(projectEwpCount + 1).padStart(3, '0')}`,
      name: '', discipline: 'ELECTRICAL', scope: '', lead: '', start: '', end: '',
    });
    setEwpModal(true);
  };

  const openEditEwp = () => {
    setEditingEwpId(ewp.id);
    setEwpForm({ code: ewp.code, name: ewp.name, discipline: ewp.discipline, scope: ewp.scope, lead: ewp.lead, start: ewp.start, end: ewp.end });
    setEwpModal(true);
  };

  const saveEwp = async () => {
    if (!ewpForm.code.trim() || !ewpForm.name.trim()) return;
    if (editingEwpId) {
      setEwps(current => current.map(item => item.id === editingEwpId ? { ...item, ...ewpForm } : item));
      notifications.show({ color: 'green', title: 'EWP updated', message: `${ewpForm.code} was updated.` });
    } else {
      setSavingEwp(true);
      setSourceError('');
      try {
        const result = await request('/ewp/engineering-work/ewps', {
          method: 'POST',
          body: JSON.stringify({
            project_id: projectId,
            seb_id: sebId,
            revision_id: revisionId,
            freeze_snapshot_id: selectedReleasedSeb.freeze_snapshot_id,
            release_item_ids: selectedItemIds,
            ewp_code: ewpForm.code.trim(),
            ewp_name: ewpForm.name.trim(),
            discipline: ewpForm.discipline,
            scope: ewpForm.scope || null,
            lead_engineer: ewpForm.lead || null,
            planned_start: ewpForm.start || null,
            planned_finish: ewpForm.end || null,
          }),
        });
        const storedEwp = result.ewp;
        const id = storedEwp.id;
        setSavedEwps(current => ({ ...current, [id]: storedEwp }));
        const createdEwp = {
          id,
          project_id: storedEwp.project_id,
          seb_id: storedEwp.seb_id,
          revision_id: storedEwp.seb_revision_id,
          freeze_snapshot_id: storedEwp.freeze_snapshot_id,
          code: storedEwp.ewp_code,
          name: storedEwp.ewp_name,
          discipline: storedEwp.discipline,
          scope: storedEwp.scope || '',
          lead: storedEwp.lead_engineer || '',
          start: storedEwp.planned_start || '',
          end: storedEwp.planned_finish || '',
          status: storedEwp.status,
        };
        const links = Array.isArray(result.ewp_seb_inputs) ? result.ewp_seb_inputs : [];
        setEwps(current => [...current.filter(item => item.id !== id), createdEwp]);
        setEwpSebInputs(current => ({ ...current, [id]: links }));
        setActivities(current => ({ ...current, [id]: [] }));
        setEwpId(id);
        setEwpModal(false);
        notifications.show({ color: 'green', title: 'EWP created', message: `${links.length} frozen release item ID(s) were stored in ewp_seb_input.` });
      } catch (saveError) {
        setSourceError(saveError.message);
      } finally {
        setSavingEwp(false);
      }
      return;
    }
    setEwpModal(false);
  };

  const openNewActivity = () => {
    setEditingActivity(null);
    setActivityForm({ code: `EWO-${String(work.length + 1).padStart(3, '0')}`, title: '', engineer: '', status: 'NOT_STARTED', progress: 0, start: '', end: '' });
    setActivityModal(true);
  };
  const openActivity = item => { setEditingActivity(item); setActivityForm({ ...item }); setActivityModal(true); };
  const saveActivity = async () => {
    if (!activityForm.code.trim() || !activityForm.title.trim()) return;
    const normalized = { ...activityForm, progress: activityForm.status === 'COMPLETED' ? 100 : Number(activityForm.progress) };
    setSavingActivity(true);
    setSourceError('');
    try {
      const path = editingActivity
        ? `/ewp/engineering-work/ewps/${encodeURIComponent(ewpId)}/work-items/${encodeURIComponent(editingActivity.id)}`
        : `/ewp/engineering-work/ewps/${encodeURIComponent(ewpId)}/work-items`;
      const stored = await request(path, {
        method: editingActivity ? 'PATCH' : 'POST',
        body: JSON.stringify({
          work_code: normalized.code.trim(),
          title: normalized.title.trim(),
          assigned_engineers: normalized.engineer.split(',').map(value => value.trim()).filter(Boolean),
          status: normalized.status,
          progress: normalized.progress,
          planned_start: normalized.start || null,
          planned_finish: normalized.end || null,
        }),
      });
      const saved = {
        id: stored.id,
        code: stored.work_code,
        title: stored.title,
        engineer: (stored.assigned_engineers || []).join(', '),
        status: stored.status,
        progress: stored.progress,
        start: stored.planned_start || '',
        end: stored.planned_finish || '',
      };
      setActivities(current => ({
        ...current,
        [ewpId]: editingActivity
          ? work.map(item => item.id === editingActivity.id ? saved : item)
          : [...work, saved],
      }));
      setActivityModal(false);
      notifications.show({ color: 'green', title: editingActivity ? 'Work updated' : 'Work created', message: `${saved.code} · ${saved.title} was saved.` });
    } catch (saveError) {
      setSourceError(saveError.message);
      notifications.show({ color: 'red', title: 'Unable to save engineering work', message: saveError.message });
    } finally {
      setSavingActivity(false);
    }
  };
  const setEwpStatus = async status => {
    setSavingStatus(true);
    setSourceError('');
    try {
      const stored = await request(`/ewp/engineering-work/ewps/${encodeURIComponent(ewpId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setEwps(current => current.map(item => item.id === ewpId ? { ...item, status: stored.status } : item));
      setSavedEwps(current => ({ ...current, [ewpId]: { ...current[ewpId], ...stored } }));
      notifications.show({ color: 'green', title: 'EWP status updated', message: `${ewp.code} is now ${stored.status.replaceAll('_', ' ')}.` });
    } catch (saveError) {
      setSourceError(saveError.message);
      notifications.show({ color: 'red', title: 'Unable to update EWP status', message: saveError.message });
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <Box className={styles.root} p={{ base: 'sm', sm: 'md', md: 'xl' }} maw={1360} mx="auto">
      <Group justify="space-between" align="flex-start" mb="xl" wrap="wrap">
        <Box className={styles.headingText}><Badge color="green" variant="light" mb="xs">Engineering Workbench</Badge><Title order={2}>Engineering Work</Title><Text c="dimmed" size="sm" mt={4}>Create an EWP from selected items in an immutable released SEB revision.</Text></Box>
        {ewp && <Group><StatusBadge value={ewp.status} /><ThemeIcon color="green" variant="light" size={44} radius="lg"><IconBriefcase size={22} /></ThemeIcon></Group>}
      </Group>

      <Stack gap="lg">
        <FlowBar completed={completed} />
        {sourceError && <Alert color="red" icon={<IconAlertTriangle size={18} />} withCloseButton onClose={() => setSourceError('')}>{sourceError}</Alert>}

        <Paper withBorder radius="lg" p={{ base: 'sm', sm: 'md', md: 'lg' }} style={surface}>
          <Group justify="space-between" align="flex-start" mb="lg" wrap="wrap">
            <Box><Text fw={800}>1–5. Select released design basis</Text><Text size="xs" c="dimmed">Choose the project, SEB, and exact released revision from the freeze collection.</Text></Box>
            <Button variant="subtle" color="green" onClick={loadReleasedProjects} loading={sourceLoading}>Refresh released projects</Button>
          </Group>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}><Select classNames={{ dropdown: styles.dropdown }} label="Project" placeholder={sourceLoading && !projects.length ? 'Loading released projects…' : 'Select project'} data={projects.map(item => ({ value: item.project_id, label: `${item.project_name}${item.project_code ? ` · ${item.project_code}` : ''}` }))} value={projectId || null} onChange={changeProject} searchable clearable disabled={sourceLoading && !projects.length} /></Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}><Select classNames={{ dropdown: styles.dropdown }} label="Released SEB" placeholder={!projectId ? 'Select project first' : 'Select SEB'} data={sebOptions} value={sebId || null} onChange={changeSeb} searchable clearable disabled={!projectId || sourceLoading} /></Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}><Select classNames={{ dropdown: styles.dropdown }} label="Released revision" placeholder={!sebId ? 'Select SEB first' : 'Select released revision'} data={revisionOptions} value={revisionId || null} onChange={changeRevision} searchable clearable disabled={!sebId || sourceLoading} /></Grid.Col>
          </Grid>
          {!sourceLoading && !projects.length && <Alert color="yellow" mt="md" icon={<IconAlertTriangle size={18} />}>No RELEASED project snapshots were found in seb_ewp_frozen_item.</Alert>}
          {projectId && !sourceLoading && !releasedSebRecords.length && <Alert color="yellow" mt="md">This project has no released SEB snapshots.</Alert>}
          {selectedReleasedSeb && <Paper withBorder p="sm" radius="md" mt="md" bg="#f3fbf6"><SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}><Info label="Project" value={selectedReleasedSeb.project_name} /><Info label="SEB" value={selectedReleasedSeb.seb_code} /><Info label="Released revision" value={selectedReleasedSeb.revision_no} /><Info label="Freeze snapshot" value={selectedReleasedSeb.freeze_snapshot_id} /></SimpleGrid></Paper>}
        </Paper>

        {selectedReleasedSeb && (
          <Paper withBorder radius="lg" style={surface}>
            <Group justify="space-between" align="flex-start" p={{ base: 'sm', sm: 'lg' }} wrap="wrap"><Box><Text fw={800}>6–7. Load and select frozen release items</Text><Text size="xs" c="dimmed">Select only the controlled SEB inputs required by this EWP.</Text></Box><Group><Badge color="gray" variant="light">{releaseItems.length} frozen</Badge><Badge color="green" variant="light">{selectedItemIds.length} selected</Badge></Group></Group>
            <Divider />
            <Box px={{ base: 'sm', sm: 'lg' }} py="xs"><Checkbox label="Select all frozen items" checked={releaseItems.length > 0 && selectedItemIds.length === releaseItems.length} indeterminate={selectedItemIds.length > 0 && selectedItemIds.length < releaseItems.length} onChange={event => toggleAllItems(event.currentTarget.checked)} /></Box>
            <ResponsiveTable label="Frozen release items" verticalSpacing="sm">
                <Table.Thead bg="#f7faf8"><Table.Tr><Table.Th w={80}>Select</Table.Th><Table.Th>Released item</Table.Th><Table.Th>Discipline</Table.Th><Table.Th>Review decision</Table.Th><Table.Th>Readiness</Table.Th><Table.Th>Source reference</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>{releaseItems.map(item => { const itemId = releaseItemId(item); return <Table.Tr key={itemId} bg={selectedIdSet.has(itemId) ? '#f3fbf6' : undefined}><Table.Td><Checkbox aria-label={`Select ${item.display_value || item.item_name || itemId}`} checked={selectedIdSet.has(itemId)} onChange={event => toggleItem(itemId, event.currentTarget.checked)} /></Table.Td><Table.Td><Text fw={700} size="sm">{item.display_value || item.item_name || item.fact_id}</Text><Text size="xs" c="dimmed">{item.item_code || itemId}</Text></Table.Td><Table.Td><Text size="sm">{item.discipline || 'UNASSIGNED'}</Text></Table.Td><Table.Td><StatusBadge value={item.review_decision || 'NOT_SET'} /></Table.Td><Table.Td><StatusBadge value={readinessStatus(item)} /></Table.Td><Table.Td><Text size="xs">{item.source_reference?.collection || item.fact_collection || '—'} / {item.source_reference?.record_id || item.fact_id || '—'}</Text></Table.Td></Table.Tr>; })}</Table.Tbody>
              </ResponsiveTable>
            {!releaseItems.length && <Alert m="lg" color="yellow">This frozen revision contains no release items.</Alert>}
            <Divider />
            <Group justify="space-between" p={{ base: 'sm', sm: 'lg' }} wrap="wrap"><Text size="sm" c="dimmed">The selected IDs will be linked through <Text span ff="monospace" fw={700}>ewp_seb_input</Text>.</Text><Button color="green" leftSection={<IconPlus size={16} />} disabled={!selectedItemIds.length || Boolean(ewpId)} onClick={openCreateEwp}>{ewpId ? 'EWP created' : '8. Create EWP'}</Button></Group>
          </Paper>
        )}

        {ewp && handoff && <>
          <Alert color="green" icon={<IconDatabase size={18} />} title="9. EWP input links stored">{inputLinks.length} selected release item ID(s) are linked to <b>{ewp.code}</b> in the MongoDB <Text span ff="monospace">ewp_seb_input</Text> collection.</Alert>
          <Paper withBorder radius="lg" p={{ base: 'sm', sm: 'md', md: 'lg' }} style={surface}>
            <Group justify="space-between" align="flex-start" mb="lg" wrap="wrap"><Group align="flex-start" wrap="nowrap"><ThemeIcon color="green" variant="light" radius="md" size={38}><IconShieldCheck size={20} /></ThemeIcon><Box><Text fw={800}>SEB Design Basis</Text><Text size="xs" c="dimmed">Exact frozen inputs linked to this EWP.</Text></Box></Group><Group className={styles.actions}><Button variant="default" leftSection={<IconEye size={16} />} onClick={() => setBasisModal(true)}>View selected inputs</Button><Checkbox color="green" checked={basisReviewed} onChange={event => setBasisReviewed(event.currentTarget.checked)} label="Design basis reviewed" /></Group></Group>
            <SimpleGrid cols={{ base: 2, lg: 4 }}><Info label="SEB" value={handoff.seb_code} /><Info label="Revision" value={handoff.revision} /><Info label="Readiness" value={<StatusBadge value={handoff.readiness} />} /><Info label="Linked inputs" value={inputLinks.length} /></SimpleGrid>
            {(handoff.conditions.length > 0 || handoff.constraints.length > 0) && <Alert mt="lg" color={handoff.readiness === 'READY' ? 'blue' : 'orange'} icon={<IconAlertTriangle size={18} />}>{handoff.conditions.length} condition(s) and {handoff.constraints.length} constraint(s) must be carried into engineering.</Alert>}
          </Paper>
          <Paper withBorder radius="lg" p={{ base: 'sm', sm: 'md', md: 'lg' }} style={surface}>
            <Group justify="space-between" mb="lg"><Group align="flex-start" wrap="nowrap"><ThemeIcon color="green" variant="light" radius="md" size={38}><IconFileCheck size={20} /></ThemeIcon><Box><Text fw={800}>EWP Definition</Text><Text size="xs" c="dimmed">Scope, ownership and planned dates.</Text></Box></Group><Button variant="subtle" color="green" leftSection={<IconEdit size={15} />} onClick={openEditEwp}>Edit EWP</Button></Group>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg"><Info label="EWP code" value={ewp.code} /><Info label="EWP name" value={ewp.name} /><Info label="Discipline" value={ewp.discipline} /><Info label="Lead engineer" value={ewp.lead} /><Box className={styles.scope}><Info label="Scope" value={ewp.scope} /></Box><Info label="Planned start" value={ewp.start} /><Info label="Planned finish" value={ewp.end} /></SimpleGrid>
          </Paper>
          <Paper withBorder radius="lg" style={surface}>
            <Group justify="space-between" p={{ base: 'sm', sm: 'lg' }} wrap="wrap"><Group align="flex-start" wrap="nowrap"><ThemeIcon color="green" variant="light" radius="md" size={38}><IconProgressCheck size={20} /></ThemeIcon><Box><Text fw={800}>Engineering Work</Text><Text size="xs" c="dimmed">Create work activities, assign engineers and update progress.</Text></Box></Group><Group className={styles.actions}><Button variant="default" leftSection={<IconPlayerPlay size={16} />} loading={savingStatus} disabled={!basisReviewed || !work.length || ewp.status === 'IN_PROGRESS'} onClick={() => setEwpStatus('IN_PROGRESS')}>Start Engineering Work</Button><Button color="green" leftSection={<IconCheck size={16} />} loading={savingStatus} disabled={!allReadyForOutput || !basisReviewed || ewp.status === 'READY_FOR_OUTPUT'} onClick={() => setEwpStatus('READY_FOR_OUTPUT')}>Mark READY FOR OUTPUT</Button><Button color="green" variant="light" leftSection={<IconPlus size={16} />} onClick={openNewActivity}>Add Engineering Work</Button></Group></Group>
            <Divider />
            <ResponsiveTable label="Engineering activities" verticalSpacing="sm"><Table.Thead bg="#f7faf8"><Table.Tr><Table.Th>Work order</Table.Th><Table.Th>Activity</Table.Th><Table.Th>Engineer(s)</Table.Th><Table.Th>Planned dates</Table.Th><Table.Th>Status</Table.Th><Table.Th>Progress</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{work.map(item => <Table.Tr key={item.id}><Table.Td><Text fw={750} size="sm">{item.code}</Text></Table.Td><Table.Td><Text size="sm">{item.title}</Text></Table.Td><Table.Td>{item.engineer ? <Group gap="xs"><IconUsers size={15} color="#4b6b59" /><Text size="sm">{item.engineer}</Text></Group> : <Badge color="orange" variant="light">Unassigned</Badge>}</Table.Td><Table.Td><Text size="xs">{item.start || '—'} → {item.end || '—'}</Text></Table.Td><Table.Td><StatusBadge value={item.status} /></Table.Td><Table.Td><Group gap="xs" wrap="nowrap"><Progress value={item.progress} color={item.progress === 100 ? 'green' : 'blue'} className={styles.workProgress} /><Text size="xs" fw={700}>{item.progress}%</Text></Group></Table.Td><Table.Td><Button size="xs" variant="subtle" color="green" onClick={() => openActivity(item)}>Manage</Button></Table.Td></Table.Tr>)}</Table.Tbody></ResponsiveTable>
            {!work.length && <Box ta="center" p="xl"><ThemeIcon color="gray" variant="light" radius="xl" size={46} mx="auto"><IconBriefcase size={22} /></ThemeIcon><Text fw={700} mt="sm">No engineering work created</Text><Text size="sm" c="dimmed" mt={3}>Add the first work order or engineering activity for this EWP.</Text><Button mt="md" color="green" leftSection={<IconPlus size={16} />} onClick={openNewActivity}>Add Engineering Work</Button></Box>}
          </Paper>
          {savedEwps[ewpId] && <EngineeringWorkReport ewp={savedEwps[ewpId]} source={selectedReleasedSeb} links={inputLinks} activityVersion={work} saving={savingEwp || savingActivity || savingStatus} />}
        </>}
      </Stack>

      <Modal opened={basisModal} onClose={() => setBasisModal(false)} title={<Text fw={800}>Selected SEB Design Basis Inputs</Text>} size="xl" centered radius="lg" fullScreen={isMobile} classNames={{ content: styles.modal }}>
        {handoff && <Stack gap="lg"><Group><StatusBadge value={handoff.status} /><StatusBadge value={handoff.readiness} /><Badge variant="outline">{handoff.seb_code} / {handoff.revision}</Badge></Group><ResponsiveTable label="Selected SEB inputs" withTableBorder verticalSpacing="sm"><Table.Thead><Table.Tr><Table.Th>SEB item</Table.Th><Table.Th>Discipline</Table.Th><Table.Th>Decision</Table.Th><Table.Th>Readiness</Table.Th><Table.Th>Evidence</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{handoff.items.map(item => <Table.Tr key={item.id}><Table.Td><Text fw={700} size="sm">{item.fact}</Text><Text size="xs" c="dimmed">{item.id}</Text></Table.Td><Table.Td>{item.discipline}</Table.Td><Table.Td><StatusBadge value={item.decision} /></Table.Td><Table.Td><StatusBadge value={item.readiness} /></Table.Td><Table.Td><Group gap="xs"><IconLink size={14} /><Text size="sm">{item.evidence}</Text></Group></Table.Td></Table.Tr>)}</Table.Tbody></ResponsiveTable><SimpleGrid cols={{ base: 1, sm: 2 }}><Paper withBorder p="md" radius="md"><Text fw={750} mb="xs">Conditions</Text>{handoff.conditions.length ? handoff.conditions.map(item => <Text key={item} size="sm" mb={6}>• {item}</Text>) : <Text size="sm" c="dimmed">None</Text>}</Paper><Paper withBorder p="md" radius="md"><Text fw={750} mb="xs">Constraints</Text>{handoff.constraints.length ? handoff.constraints.map(item => <Text key={item} size="sm" mb={6}>• {item}</Text>) : <Text size="sm" c="dimmed">None</Text>}</Paper></SimpleGrid></Stack>}
      </Modal>

      <Modal opened={ewpModal} onClose={() => setEwpModal(false)} title={<Text fw={800}>{editingEwpId ? 'Edit EWP' : 'Create EWP from selected release items'}</Text>} size="lg" centered radius="lg" fullScreen={isMobile} classNames={{ content: styles.modal }}>
        <Stack>
          {!editingEwpId && <Alert color="green" icon={<IconCircleCheck size={18} />}>{selectedItems.length} frozen item(s) will be stored as <Text span ff="monospace">ewp_seb_input</Text> links.</Alert>}
          <Grid><Grid.Col span={{ base: 12, sm: 6 }}><TextInput label="EWP Code" required value={ewpForm.code} onChange={event => { const value = event.currentTarget.value; setEwpForm(form => ({ ...form, code: value })); }} /></Grid.Col><Grid.Col span={{ base: 12, sm: 6 }}><TextInput label="EWP Name" required value={ewpForm.name} onChange={event => { const value = event.currentTarget.value; setEwpForm(form => ({ ...form, name: value })); }} /></Grid.Col></Grid>
          <Grid><Grid.Col span={{ base: 12, sm: 6 }}><Select classNames={{ dropdown: styles.dropdown }} label="Discipline" data={DISCIPLINES} value={ewpForm.discipline} onChange={value => setEwpForm(form => ({ ...form, discipline: value || '' }))} /></Grid.Col><Grid.Col span={{ base: 12, sm: 6 }}><TextInput label="Lead Engineer" value={ewpForm.lead} onChange={event => { const value = event.currentTarget.value; setEwpForm(form => ({ ...form, lead: value })); }} /></Grid.Col></Grid>
          <Textarea label="Scope" minRows={4} value={ewpForm.scope} onChange={event => { const value = event.currentTarget.value; setEwpForm(form => ({ ...form, scope: value })); }} />
          <Grid><Grid.Col span={{ base: 12, sm: 6 }}><DatePickerInput label="Planned start" value={ewpForm.start} onChange={value => { setEwpForm(form => ({ ...form, start: value })); }} /></Grid.Col><Grid.Col span={{ base: 12, sm: 6 }}><DatePickerInput label="Planned finish" value={ewpForm.end} onChange={value => { setEwpForm(form => ({ ...form, end: value })); }} /></Grid.Col></Grid>
          <Group className={styles.actions} justify="flex-end" mt="md"><Button variant="default" onClick={() => setEwpModal(false)} disabled={savingEwp}>Cancel</Button><Button color="green" loading={savingEwp} disabled={!ewpForm.code.trim() || !ewpForm.name.trim()} onClick={saveEwp}>{editingEwpId ? 'Save changes' : 'Create EWP'}</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={activityModal} onClose={() => setActivityModal(false)} title={<Text fw={800}>{editingActivity ? 'Update Engineering Work' : 'Add Engineering Work'}</Text>} size="lg" centered radius="lg" fullScreen={isMobile} classNames={{ content: styles.modal }}>
        <Stack><Grid><Grid.Col span={{ base: 12, sm: 4 }}><TextInput label="Work order" required value={activityForm.code} onChange={event => { const value = event.currentTarget.value; setActivityForm(form => ({ ...form, code: value })); }} /></Grid.Col><Grid.Col span={{ base: 12, sm: 8 }}><TextInput label="Activity" required value={activityForm.title} onChange={event => { const value = event.currentTarget.value; setActivityForm(form => ({ ...form, title: value })); }} /></Grid.Col></Grid><TextInput label="Assigned engineer(s)" description="Separate multiple engineers with commas" value={activityForm.engineer} onChange={event => { const value = event.currentTarget.value; setActivityForm(form => ({ ...form, engineer: value })); }} /><Grid><Grid.Col span={{ base: 12, sm: 6 }}><DatePickerInput label="Planned start" value={activityForm.start} onChange={value => { setActivityForm(form => ({ ...form, start: value })); }} /></Grid.Col><Grid.Col span={{ base: 12, sm: 6 }}><DatePickerInput label="Planned finish" value={activityForm.end} onChange={value => { setActivityForm(form => ({ ...form, end: value })); }} /></Grid.Col></Grid><Select classNames={{ dropdown: styles.dropdown }} label="Work status" data={STATUSES.map(value => ({ value, label: value.replaceAll('_', ' ') }))} value={activityForm.status} onChange={value => setActivityForm(form => ({ ...form, status: value || 'NOT_STARTED', progress: value === 'COMPLETED' ? 100 : form.progress }))} /><Box><Group justify="space-between" mb="xs"><Text size="sm" fw={600}>Progress</Text><Text size="sm" fw={750}>{activityForm.progress}%</Text></Group><Slider thumbLabel="Work progress" color="green" value={Number(activityForm.progress)} onChange={value => setActivityForm(form => ({ ...form, progress: value, status: value === 100 ? 'COMPLETED' : value > 0 && form.status === 'NOT_STARTED' ? 'IN_PROGRESS' : form.status }))} marks={[{ value: 0, label: '0%' }, { value: 50, label: '50%' }, { value: 100, label: '100%' }]} mb="xl" /></Box><Group className={styles.actions} justify="flex-end" mt="md"><Button variant="default" onClick={() => setActivityModal(false)} disabled={savingActivity}>Cancel</Button><Button color="green" loading={savingActivity} onClick={saveActivity}>{editingActivity ? 'Update work' : 'Add work'}</Button></Group></Stack>
      </Modal>
    </Box>
  );
}
