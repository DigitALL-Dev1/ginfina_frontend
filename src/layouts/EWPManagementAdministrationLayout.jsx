import DatePickerInput from '../components/common/DatePickerInput';
import { useMemo, useState } from 'react';
import {
  Accordion, Alert, Badge, Box, Button, Divider, Grid, Group, Modal, Paper,
  Progress, Select, SimpleGrid, Stack, Table, Tabs, Text, Textarea, TextInput,
  ThemeIcon, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconActivity, IconAlertTriangle, IconCalendar, IconChartBar, IconClock,
  IconEdit, IconHistory, IconLock, IconSettings, IconShieldCheck, IconUsers,
} from '@tabler/icons-react';

const PROJECTS = [
  { value: 'PRJ-001', label: 'Hospital Solar Project' },
  { value: 'PRJ-002', label: 'Regional Water Upgrade' },
];

const EWPS = {
  'PRJ-001': [{ id: 'EWP-ELEC-001', name: 'Electrical System Design', discipline: 'Electrical', status: 'IN_PROGRESS', seb: 'SEB-001 / R01' }],
  'PRJ-002': [{ id: 'EWP-CIV-001', name: 'Civil & Pumping Design', discipline: 'Civil', status: 'ACTIVE', seb: 'SEB-014 / R02' }],
};

const INITIAL_TEAM = {
  'EWP-ELEC-001': [
    { id: 'T-01', role: 'Lead Engineer', name: 'User A', organization: 'GINFINA', access: 'ADMIN' },
    { id: 'T-02', role: 'Electrical Engineer', name: 'User B', organization: 'GINFINA', access: 'EDIT' },
    { id: 'T-03', role: 'Reviewer', name: 'User C', organization: 'Consultant', access: 'REVIEW' },
    { id: 'T-04', role: 'Approver', name: 'User D', organization: 'Client', access: 'APPROVE' },
  ],
  'EWP-CIV-001': [{ id: 'T-11', role: 'Lead Engineer', name: 'User E', organization: 'GINFINA', access: 'ADMIN' }],
};

const INITIAL_MILESTONES = {
  'EWP-ELEC-001': [
    { id: 'M-01', name: 'Design Start', date: '2026-08-01', status: 'COMPLETE' },
    { id: 'M-02', name: '30% Design', date: '2026-08-28', status: 'COMPLETE' },
    { id: 'M-03', name: '60% Design', date: '2026-09-25', status: 'IN_PROGRESS' },
    { id: 'M-04', name: 'IFC Release', date: '2026-10-30', status: 'UPCOMING' },
  ],
  'EWP-CIV-001': [{ id: 'M-11', name: 'Design Start', date: '2026-09-01', status: 'IN_PROGRESS' }],
};

const CONTROL_ITEMS = {
  'EWP-ELEC-001': [
    { id: 'ACT-014', type: 'ACTION', title: 'Confirm generator fault contribution', owner: 'User B', due: '2026-09-18', status: 'OPEN' },
    { id: 'RSK-006', type: 'RISK', title: 'Utility approval may delay IFC issue', owner: 'User A', due: '2026-09-22', status: 'HIGH' },
    { id: 'WRK-003', type: 'OVERDUE WORK', title: 'Protection design calculation', owner: 'User B', due: '2026-09-10', status: 'OVERDUE' },
    { id: 'REV-012', type: 'PENDING REVIEW', title: 'Cable Schedule D02', owner: 'User C', due: '2026-09-17', status: 'PENDING' },
    { id: 'APR-004', type: 'PENDING APPROVAL', title: 'Load Calculation D03', owner: 'User D', due: '2026-09-20', status: 'PENDING' },
    { id: 'DEL-007', type: 'UPCOMING DELIVERABLE', title: 'Equipment Specification D01', owner: 'User B', due: '2026-09-27', status: 'UPCOMING' },
  ],
  'EWP-CIV-001': [],
};

const AUDIT = [
  { time: '14 Sep 2026 · 15:42', user: 'User A', action: 'Updated EWP progress to 72%' },
  { time: '14 Sep 2026 · 11:16', user: 'User C', action: 'Completed review of Load Calculation D03' },
  { time: '13 Sep 2026 · 17:08', user: 'User B', action: 'Issued Cable Schedule D02 for review' },
  { time: '12 Sep 2026 · 09:30', user: 'System', action: 'Linked released SEB-001 / R01 design basis' },
];

const INITIAL_PROGRESS = { 'EWP-ELEC-001': { overall: 72, work: 80, deliverables: 65, reviews: 55, released: 40 }, 'EWP-CIV-001': { overall: 28, work: 35, deliverables: 20, reviews: 15, released: 0 } };
const surface = { borderColor: '#dfe7e2', boxShadow: '0 8px 26px rgba(21, 55, 39, 0.045)' };

function StatusBadge({ value }) {
  const color = { COMPLETE: 'green', IN_PROGRESS: 'blue', UPCOMING: 'gray', OPEN: 'orange', HIGH: 'red', OVERDUE: 'red', PENDING: 'orange', ACTIVE: 'blue', ON_HOLD: 'orange', CLOSED: 'green', ADMIN: 'green', EDIT: 'blue', REVIEW: 'violet', APPROVE: 'teal', VIEW: 'gray' }[value] || 'gray';
  return <Badge color={color} variant="light" radius="sm">{value.replaceAll('_', ' ')}</Badge>;
}

function Metric({ label, value, color = 'green' }) {
  return <Paper withBorder p="md" radius="md"><Group justify="space-between"><Text size="xs" c="dimmed">{label}</Text><Text fw={850}>{value}%</Text></Group><Progress value={value} color={color} mt="sm" size="sm" radius="xl" /></Paper>;
}

export default function EWPManagementAdministrationLayout() {
  const [projectId, setProjectId] = useState('PRJ-001');
  const [ewpId, setEwpId] = useState('EWP-ELEC-001');
  const [team, setTeam] = useState(INITIAL_TEAM);
  const [milestones, setMilestones] = useState(INITIAL_MILESTONES);
  const [statuses, setStatuses] = useState({ 'EWP-ELEC-001': 'IN_PROGRESS', 'EWP-CIV-001': 'ACTIVE' });
  const [memberModal, setMemberModal] = useState(false);
  const [milestoneModal, setMilestoneModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: '', role: 'Engineer', organization: 'GINFINA', access: 'EDIT' });
  const [milestoneForm, setMilestoneForm] = useState({ name: '', date: '', status: 'UPCOMING' });
  const [statusNote, setStatusNote] = useState('');
  const [nextStatus, setNextStatus] = useState('IN_PROGRESS');

  const availableEwps = EWPS[projectId] || [];
  const ewp = availableEwps.find(item => item.id === ewpId) || availableEwps[0];
  const currentTeam = team[ewpId] || [];
  const currentMilestones = milestones[ewpId] || [];
  const controls = CONTROL_ITEMS[ewpId] || [];
  const progress = INITIAL_PROGRESS[ewpId] || { overall: 0, work: 0, deliverables: 0, reviews: 0, released: 0 };
  const counts = useMemo(() => Object.fromEntries(['ACTION', 'RISK', 'OVERDUE WORK', 'PENDING REVIEW', 'PENDING APPROVAL', 'UPCOMING DELIVERABLE'].map(type => [type, controls.filter(item => item.type === type).length])), [controls]);

  const changeProject = value => {
    const nextProject = value || 'PRJ-001';
    setProjectId(nextProject);
    setEwpId(EWPS[nextProject]?.[0]?.id || '');
  };

  const saveMember = () => {
    if (!memberForm.name.trim()) return;
    setTeam(current => ({ ...current, [ewpId]: [...(current[ewpId] || []), { ...memberForm, id: `T-${Date.now()}` }] }));
    setMemberModal(false);
    setMemberForm({ name: '', role: 'Engineer', organization: 'GINFINA', access: 'EDIT' });
    notifications.show({ color: 'green', title: 'Team member assigned', message: memberForm.name });
  };

  const saveMilestone = () => {
    if (!milestoneForm.name.trim() || !milestoneForm.date) return;
    setMilestones(current => ({ ...current, [ewpId]: [...(current[ewpId] || []), { ...milestoneForm, id: `M-${Date.now()}` }] }));
    setMilestoneModal(false);
    notifications.show({ color: 'green', title: 'Milestone added', message: milestoneForm.name });
  };

  const saveStatus = () => {
    setStatuses(current => ({ ...current, [ewpId]: nextStatus }));
    setStatusModal(false);
    notifications.show({ color: 'green', title: 'EWP status updated', message: `${nextStatus.replaceAll('_', ' ')} · ${statusNote || 'No note'}` });
  };

  return <Box p={{ base: 'md', md: 'xl' }} maw={1420} mx="auto">
    <Group justify="space-between" align="flex-start" mb="xl"><Box><Badge color="green" variant="light" mb="xs">Engineering Workbench</Badge><Title order={2}>Management & Administration</Title><Text size="sm" c="dimmed" mt={4}>Control the EWP team, dates, access, assignments, risks and progress from one workspace.</Text></Box><ThemeIcon color="green" variant="light" size={46} radius="lg"><IconSettings size={24} /></ThemeIcon></Group>

    <Stack gap="lg">
      <Paper withBorder radius="lg" p="lg" style={surface}><Grid align="flex-end"><Grid.Col span={{ base: 12, md: 5 }}><Select label="Project" data={PROJECTS} value={projectId} onChange={changeProject} searchable /></Grid.Col><Grid.Col span={{ base: 12, md: 5 }}><Select label="Engineering Work Package" data={availableEwps.map(item => ({ value: item.id, label: `${item.id} · ${item.name}` }))} value={ewpId} onChange={value => setEwpId(value || '')} searchable /></Grid.Col><Grid.Col span={{ base: 12, md: 2 }}><Button fullWidth variant="light" color="green" leftSection={<IconEdit size={15} />} onClick={() => { setNextStatus(statuses[ewpId]); setStatusModal(true); }}>Manage Status</Button></Grid.Col></Grid></Paper>

      <Paper withBorder radius="lg" p="lg" style={{ ...surface, background: 'linear-gradient(135deg, #f3fbf6 0%, #ffffff 72%)' }}><Group justify="space-between" align="flex-start"><Box><Group gap="xs"><Title order={3}>{ewp.id}</Title><StatusBadge value={statuses[ewpId]} /></Group><Text fw={700} mt={4}>{ewp.name}</Text><Group gap="xs" mt="sm"><Badge variant="outline">{ewp.discipline}</Badge><Badge variant="outline">{ewp.seb}</Badge></Group></Box><Box ta="right"><Text size="xs" c="dimmed">Overall progress</Text><Text fz={36} fw={900} c="#176c3a">{progress.overall}%</Text></Box></Group><Progress value={progress.overall} color="green" size="md" radius="xl" mt="lg" /></Paper>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}><Metric label="Engineering Work" value={progress.work} /><Metric label="Deliverables" value={progress.deliverables} color="blue" /><Metric label="Reviews" value={progress.reviews} color="violet" /><Metric label="Released" value={progress.released} color="teal" /></SimpleGrid>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }}>{[
        ['Open Actions', counts.ACTION, 'orange'], ['Open Risks', counts.RISK, 'red'], ['Overdue Work', counts['OVERDUE WORK'], 'red'], ['Pending Reviews', counts['PENDING REVIEW'], 'violet'], ['Pending Approvals', counts['PENDING APPROVAL'], 'teal'], ['Upcoming Deliverables', counts['UPCOMING DELIVERABLE'], 'blue'],
      ].map(([label, value, color]) => <Paper key={label} withBorder p="md" radius="md"><Text size="xs" c="dimmed">{label}</Text><Text fz={26} fw={850} c={`${color}.8`}>{value}</Text></Paper>)}</SimpleGrid>

      <Tabs defaultValue="overview" color="green">
        <Tabs.List><Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>Overview</Tabs.Tab><Tabs.Tab value="team" leftSection={<IconUsers size={16} />}>Team & Access</Tabs.Tab><Tabs.Tab value="milestones" leftSection={<IconCalendar size={16} />}>Dates & Milestones</Tabs.Tab><Tabs.Tab value="controls" leftSection={<IconAlertTriangle size={16} />}>Issues, Risks & Actions</Tabs.Tab><Tabs.Tab value="audit" leftSection={<IconHistory size={16} />}>Activity & Audit</Tabs.Tab></Tabs.List>

        <Tabs.Panel value="overview" pt="lg"><Grid><Grid.Col span={{ base: 12, lg: 6 }}><Paper withBorder radius="lg" p="lg" style={{ ...surface, height: '100%' }}><Group gap="xs" mb="md"><IconUsers size={19} color="#176c3a" /><Text fw={800}>Team</Text></Group><Stack gap="sm">{currentTeam.map(member => <Group key={member.id} justify="space-between"><Box><Text size="sm" fw={700}>{member.role}</Text><Text size="xs" c="dimmed">{member.name} · {member.organization}</Text></Box><StatusBadge value={member.access} /></Group>)}</Stack></Paper></Grid.Col><Grid.Col span={{ base: 12, lg: 6 }}><Paper withBorder radius="lg" p="lg" style={{ ...surface, height: '100%' }}><Group gap="xs" mb="md"><IconCalendar size={19} color="#176c3a" /><Text fw={800}>Milestones</Text></Group><Stack gap="sm">{currentMilestones.map(item => <Group key={item.id} justify="space-between"><Box><Text size="sm" fw={700}>{item.name}</Text><Text size="xs" c="dimmed">{item.date}</Text></Box><StatusBadge value={item.status} /></Group>)}</Stack></Paper></Grid.Col></Grid></Tabs.Panel>

        <Tabs.Panel value="team" pt="lg"><Paper withBorder radius="lg" style={surface}><Group justify="space-between" p="lg"><Box><Text fw={800}>Team, Assignments & Permissions</Text><Text size="xs" c="dimmed">Manage disciplines, accountabilities and EWP access.</Text></Box><Button color="green" onClick={() => setMemberModal(true)}>Add Team Member</Button></Group><Divider /><Table verticalSpacing="sm"><Table.Thead bg="#f7faf8"><Table.Tr><Table.Th>Name</Table.Th><Table.Th>Role / assignment</Table.Th><Table.Th>Organization</Table.Th><Table.Th>Access</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{currentTeam.map(member => <Table.Tr key={member.id}><Table.Td fw={700}>{member.name}</Table.Td><Table.Td>{member.role}</Table.Td><Table.Td>{member.organization}</Table.Td><Table.Td><StatusBadge value={member.access} /></Table.Td></Table.Tr>)}</Table.Tbody></Table></Paper></Tabs.Panel>

        <Tabs.Panel value="milestones" pt="lg"><Paper withBorder radius="lg" style={surface}><Group justify="space-between" p="lg"><Box><Text fw={800}>Dates & Milestones</Text><Text size="xs" c="dimmed">Control planned dates and key engineering gates.</Text></Box><Button color="green" onClick={() => setMilestoneModal(true)}>Add Milestone</Button></Group><Divider /><Table verticalSpacing="sm"><Table.Thead bg="#f7faf8"><Table.Tr><Table.Th>Milestone</Table.Th><Table.Th>Target date</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{currentMilestones.map(item => <Table.Tr key={item.id}><Table.Td fw={700}>{item.name}</Table.Td><Table.Td>{item.date}</Table.Td><Table.Td><StatusBadge value={item.status} /></Table.Td></Table.Tr>)}</Table.Tbody></Table></Paper></Tabs.Panel>

        <Tabs.Panel value="controls" pt="lg"><Paper withBorder radius="lg" style={surface}><Group justify="space-between" p="lg"><Box><Text fw={800}>Issues, Risks & Actions</Text><Text size="xs" c="dimmed">Consolidated exceptions requiring management attention.</Text></Box><Badge color="red" variant="light">{controls.filter(item => ['HIGH', 'OVERDUE'].includes(item.status)).length} ATTENTION</Badge></Group><Divider /><Table verticalSpacing="sm"><Table.Thead bg="#f7faf8"><Table.Tr><Table.Th>ID</Table.Th><Table.Th>Type</Table.Th><Table.Th>Item</Table.Th><Table.Th>Owner</Table.Th><Table.Th>Due</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{controls.map(item => <Table.Tr key={item.id}><Table.Td ff="monospace">{item.id}</Table.Td><Table.Td><Badge variant="outline">{item.type}</Badge></Table.Td><Table.Td fw={650}>{item.title}</Table.Td><Table.Td>{item.owner}</Table.Td><Table.Td>{item.due}</Table.Td><Table.Td><StatusBadge value={item.status} /></Table.Td></Table.Tr>)}</Table.Tbody></Table></Paper></Tabs.Panel>

        <Tabs.Panel value="audit" pt="lg"><Paper withBorder radius="lg" p="lg" style={surface}><Group gap="xs" mb="lg"><IconActivity size={19} color="#176c3a" /><Text fw={800}>Activity & Audit History</Text></Group><Accordion variant="separated">{AUDIT.map((item, index) => <Accordion.Item key={index} value={`${index}`}><Accordion.Control icon={<IconClock size={16} />}>{item.action}</Accordion.Control><Accordion.Panel><Group justify="space-between"><Text size="sm">Actor: {item.user}</Text><Text size="sm" c="dimmed">{item.time}</Text></Group></Accordion.Panel></Accordion.Item>)}</Accordion></Paper></Tabs.Panel>
      </Tabs>
    </Stack>

    <Modal opened={memberModal} onClose={() => setMemberModal(false)} title={<Text fw={800}>Add Team Member</Text>} centered><Stack><TextInput label="User / consultant" required value={memberForm.name} onChange={event => { const value = event.currentTarget.value; setMemberForm(form => ({ ...form, name: value })); }} /><Select label="Role" data={['Lead Engineer', 'Engineer', 'Reviewer', 'Approver', 'Consultant']} value={memberForm.role} onChange={value => setMemberForm(form => ({ ...form, role: value || 'Engineer' }))} /><Select label="Organization" data={['GINFINA', 'Client', 'Consultant', 'Contractor']} value={memberForm.organization} onChange={value => setMemberForm(form => ({ ...form, organization: value || 'GINFINA' }))} /><Select label="Access permission" data={['ADMIN', 'EDIT', 'REVIEW', 'APPROVE', 'VIEW']} value={memberForm.access} onChange={value => setMemberForm(form => ({ ...form, access: value || 'VIEW' }))} leftSection={<IconLock size={15} />} /><Group justify="flex-end"><Button variant="default" onClick={() => setMemberModal(false)}>Cancel</Button><Button color="green" onClick={saveMember}>Assign Member</Button></Group></Stack></Modal>

    <Modal opened={milestoneModal} onClose={() => setMilestoneModal(false)} title={<Text fw={800}>Add Milestone</Text>} centered><Stack><TextInput label="Milestone" required value={milestoneForm.name} onChange={event => { const value = event.currentTarget.value; setMilestoneForm(form => ({ ...form, name: value })); }} /><DatePickerInput label="Target date" required value={milestoneForm.date} onChange={value => { setMilestoneForm(form => ({ ...form, date: value })); }} /><Select label="Status" data={['UPCOMING', 'IN_PROGRESS', 'COMPLETE']} value={milestoneForm.status} onChange={value => setMilestoneForm(form => ({ ...form, status: value || 'UPCOMING' }))} /><Group justify="flex-end"><Button variant="default" onClick={() => setMilestoneModal(false)}>Cancel</Button><Button color="green" onClick={saveMilestone}>Save Milestone</Button></Group></Stack></Modal>

    <Modal opened={statusModal} onClose={() => setStatusModal(false)} title={<Group gap="xs"><IconShieldCheck size={19} /><Text fw={800}>Manage EWP Status</Text></Group>} centered><Stack><Alert color="blue">Status changes are management controls and should retain an accountable note.</Alert><Select label="EWP status" data={['DRAFT', 'ACTIVE', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETION_REVIEW', 'CLOSED']} value={nextStatus} onChange={value => setNextStatus(value || statuses[ewpId])} /><Textarea label="Change note" value={statusNote} onChange={event => setStatusNote(event.currentTarget.value)} minRows={3} /><Group justify="flex-end"><Button variant="default" onClick={() => setStatusModal(false)}>Cancel</Button><Button color="green" onClick={saveStatus}>Update Status</Button></Group></Stack></Modal>
  </Box>;
}
