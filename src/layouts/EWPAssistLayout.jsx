import DatePickerInput from '../components/common/DatePickerInput';
import { useMemo, useState } from 'react';
import {
  Alert, Badge, Box, Button, Divider, Grid, Group, Modal, Paper, Progress,
  Select, SimpleGrid, Stack, Table, Text, Textarea, ThemeIcon, Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import styles from './EWPAssistLayout.module.css';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle, IconBrain, IconCheck, IconClipboardCheck, IconEdit,
  IconExternalLink, IconFileSearch, IconPlus, IconRobot, IconSearch, IconX,
} from '@tabler/icons-react';

const EWPS = [
  { id: 'EWP-ELEC-001', label: 'EWP-ELEC-001 · Electrical System Design', seb: 'SEB-001 / R01', status: 'IN_PROGRESS' },
  { id: 'EWP-CIV-001', label: 'EWP-CIV-001 · Civil Design Package', seb: 'SEB-001 / R01', status: 'ACTIVE' },
];

const TASKS = [
  'Summarize EWP', 'Summarize SEB Inputs', 'Find missing inputs', 'Check document consistency',
  'Compare revisions', 'Analyze review comments', 'Suggest engineering checklist',
  'Identify unresolved conditions', 'Analyze quantity changes', 'Search project engineering data',
];

const RESULTS = {
  'Summarize EWP': {
    title: 'EWP execution summary', confidence: 91,
    summary: 'Electrical design is progressing, with engineering work ahead of document review and release. Three controlled exceptions need attention before the next release gate.',
    findings: [
      { title: 'Engineering work', detail: '4 activities: 1 completed, 2 in progress, 1 not started', severity: 'INFO', source: 'Engineering Work Register' },
      { title: 'Deliverables', detail: '4 planned deliverables; 2 are currently under preparation', severity: 'INFO', source: 'Deliverable Register' },
      { title: 'Release constraints', detail: 'One change-required review and one open design condition', severity: 'ATTENTION', source: 'Review & Conditions Registers' },
    ],
  },
  'Find missing inputs': {
    title: 'Input completeness recommendation', confidence: 88,
    summary: 'Two required inputs are not yet confirmed. Engineering should verify them before finalizing protection and equipment design.',
    findings: [
      { title: 'Client Equipment Schedule', detail: 'Required input remains PENDING', severity: 'ATTENTION', source: 'Input IN-003' },
      { title: 'Generator fault contribution', detail: 'No verified utility or vendor value was found', severity: 'WARNING', source: 'Action ACT-014' },
    ],
  },
  'Check document consistency': {
    title: 'Document consistency recommendation', confidence: 84,
    summary: 'The latest SLD and Cable Schedule use the same transformer rating, but the cable designation for feeder F-07 differs between the two documents.',
    findings: [
      { title: 'Consistent transformer rating', detail: '1,000 kVA appears in both controlled revisions', severity: 'PASS', source: 'SLD-001 D03 · CAB-SCH-001 D02' },
      { title: 'Feeder F-07 designation', detail: 'SLD shows 4C x 95 mm² while the schedule shows 4C x 70 mm²', severity: 'WARNING', source: 'SLD-001 D03 · CAB-SCH-001 D02' },
    ],
  },
  'Compare revisions': {
    title: 'Revision comparison recommendation', confidence: 94,
    summary: 'Cable Schedule D02 contains four quantity changes from D01. Two changes affect the draft BOQ.',
    findings: [
      { title: 'AC cable quantity', detail: 'Increased from 680 m to 750 m', severity: 'ATTENTION', source: 'CAB-SCH-001 D01 → D02' },
      { title: 'Cable gland count', detail: 'Increased from 42 EA to 48 EA', severity: 'INFO', source: 'CAB-SCH-001 D01 → D02' },
    ],
  },
  'Analyze review comments': {
    title: 'Review comment analysis', confidence: 89,
    summary: 'Three open comments were grouped into cable sizing, protection coordination and drawing notation. One comment may block technical completion.',
    findings: [
      { title: 'Cable sizing', detail: 'Review decision is CHANGE_REQUIRED for Cable Schedule D02', severity: 'WARNING', source: 'Review REV-012' },
      { title: 'Protection coordination', detail: 'Fault contribution value remains unresolved', severity: 'ATTENTION', source: 'Comment COM-031 · Action ACT-014' },
    ],
  },
  'Identify unresolved conditions': {
    title: 'Release blocker recommendation', confidence: 93,
    summary: 'Three issues may block release. A qualified engineer must verify their impact and decide the required response.',
    findings: [
      { title: 'Cable Schedule D02', detail: 'Review status: CHANGE_REQUIRED', severity: 'WARNING', source: 'Review REV-012' },
      { title: 'Structural condition', detail: 'Roof loading verification remains open', severity: 'WARNING', source: 'SEB Condition CON-004' },
      { title: 'BOQ', detail: 'Quantity approval is pending', severity: 'ATTENTION', source: 'BOQ-EWP-ELEC-001-R01' },
    ],
  },
  'Analyze quantity changes': {
    title: 'Quantity change recommendation', confidence: 87,
    summary: 'The current QTO differs from the prior working register in three lines. The estimated procurement effect requires commercial validation.',
    findings: [
      { title: 'DC cable', detail: 'Quantity increased by 350 m', severity: 'ATTENTION', source: 'QTY-003 · Cable Schedule D02' },
      { title: 'Mounting rail', detail: 'Quantity increased by 120 m', severity: 'INFO', source: 'QTY-005 · Structural Layout D02' },
    ],
  },
};

const DEFAULT_RESULT = {
  title: 'AI recommendation', confidence: 78,
  summary: 'The controlled EWP records were reviewed. The result below is a working recommendation that requires engineering verification.',
  findings: [{ title: 'Human review required', detail: 'Verify the result against the referenced controlled records before use.', severity: 'ATTENTION', source: 'EWP controlled registers' }],
};

const surface = { borderColor: '#dfe7e2', boxShadow: '0 8px 26px rgba(21, 55, 39, 0.045)' };

function SeverityBadge({ value }) {
  const color = { PASS: 'green', INFO: 'blue', ATTENTION: 'orange', WARNING: 'red' }[value] || 'gray';
  return <Badge color={color} variant="light" radius="sm">{value}</Badge>;
}

export default function EWPAssistLayout() {
  const isMobile = useMediaQuery('(max-width: 47.99em)');
  const [ewpId, setEwpId] = useState('EWP-ELEC-001');
  const [task, setTask] = useState('Identify unresolved conditions');
  const [question, setQuestion] = useState('What is blocking release of this EWP?');
  const [resultTask, setResultTask] = useState('Identify unresolved conditions');
  const [disposition, setDisposition] = useState('');
  const [engineerNote, setEngineerNote] = useState('');
  const [sourceModal, setSourceModal] = useState(false);
  const [actionModal, setActionModal] = useState(false);
  const [actionForm, setActionForm] = useState({ title: '', owner: 'Lead Engineer', due: '2026-09-21', priority: 'HIGH' });
  const [actions, setActions] = useState([]);
  const [history, setHistory] = useState([]);

  const ewp = EWPS.find(item => item.id === ewpId);
  const result = RESULTS[resultTask] || DEFAULT_RESULT;
  const sources = useMemo(() => [...new Set(result.findings.map(item => item.source))], [result]);

  const analyze = () => {
    setResultTask(task);
    setDisposition('');
    setEngineerNote('');
    setHistory(current => [{ id: Date.now(), task, question, time: new Date().toLocaleString() }, ...current]);
    notifications.show({ color: 'blue', title: 'Advisory analysis refreshed', message: `${task} · ${ewp.id}` });
  };

  const recordDisposition = () => {
    if (!disposition) return;
    notifications.show({ color: disposition === 'REJECT' ? 'orange' : 'green', title: 'Human review recorded', message: disposition.replaceAll('_', ' ') });
  };

  const acceptWorkingNote = () => {
    setDisposition('ACCEPT_AS_WORKING_NOTE');
    setEngineerNote(result.summary);
    notifications.show({ color: 'green', title: 'Working note prepared', message: 'The note remains advisory and records its AI source.' });
  };

  const openAction = finding => {
    setActionForm(form => ({ ...form, title: finding ? `Verify: ${finding.title}` : `Review AI recommendation: ${result.title}` }));
    setActionModal(true);
  };

  const createAction = () => {
    if (!actionForm.title.trim()) return;
    setActions(current => [...current, { ...actionForm, id: `ACT-AI-${Date.now()}`, source: result.title, status: 'OPEN' }]);
    setActionModal(false);
    notifications.show({ color: 'green', title: 'Engineering action created', message: actionForm.title });
  };

  return <Box className={styles.page} p={{ base: 'sm', md: 'xl' }} maw={1400} mx="auto">
    <Group justify="space-between" align="flex-start" mb="xl"><Box><Badge color="violet" variant="light" mb="xs">Engineering Workbench</Badge><Title order={2}>AI Assist</Title><Text size="sm" c="dimmed" mt={4}>Analyze controlled EWP information and prepare traceable recommendations for human review.</Text></Box><ThemeIcon color="violet" variant="light" size={46} radius="lg"><IconBrain size={25} /></ThemeIcon></Group>

    <Alert color="orange" icon={<IconAlertTriangle size={20} />} title="Advisory support only" mb="lg">AI results do not approve, verify, review-complete or release engineering work. The assigned engineer, reviewer and approver retain authority.</Alert>

    <Grid>
      <Grid.Col span={{ base: 12, lg: 4 }}><Stack gap="lg">
        <Paper withBorder radius="lg" p="lg" style={surface}><Group gap="xs" mb="md"><IconRobot size={20} color="#7048e8" /><Text fw={800}>Analysis Request</Text></Group><Stack><Select classNames={{dropdown:styles.dropdown}} label="Engineering Work Package" data={EWPS.map(item => ({ value: item.id, label: item.label }))} value={ewpId} onChange={value => setEwpId(value || '')} searchable /><Group gap="xs"><Badge variant="outline">{ewp.seb}</Badge><Badge variant="outline">{ewp.status.replaceAll('_', ' ')}</Badge></Group><Select classNames={{dropdown:styles.dropdown}} label="AI task" data={TASKS} value={task} onChange={value => setTask(value || TASKS[0])} searchable /><Textarea label="Question or instruction" value={question} minRows={4} onChange={event => setQuestion(event.currentTarget.value)} /><Button color="violet" leftSection={<IconSearch size={16} />} disabled={!question.trim()} onClick={analyze}>Analyze Controlled Data</Button></Stack></Paper>

        <Paper withBorder radius="lg" p="lg" style={surface}><Text fw={800} mb="md">Recent Analysis</Text>{history.length ? <Stack gap="sm">{history.slice(0, 4).map(item => <Box key={item.id}><Text size="sm" fw={700}>{item.task}</Text><Text size="xs" c="dimmed" lineClamp={1}>{item.question}</Text><Text size="10px" c="dimmed">{item.time}</Text></Box>)}</Stack> : <Text size="sm" c="dimmed">Run an analysis to create local history.</Text>}</Paper>
      </Stack></Grid.Col>

      <Grid.Col span={{ base: 12, lg: 8 }}><Stack gap="lg">
        <Paper withBorder radius="lg" style={surface}>
          <Group justify="space-between" p="lg" align="flex-start"><Group gap="xs" align="flex-start"><ThemeIcon color="violet" variant="light" radius="xl"><IconFileSearch size={18} /></ThemeIcon><Box><Text size="xs" tt="uppercase" fw={800} c="violet">AI Recommendation</Text><Title order={3} mt={3}>{result.title}</Title></Box></Group><Badge color="violet" variant="light">{result.confidence}% CONFIDENCE</Badge></Group>
          <Box px="lg" pb="lg"><Progress value={result.confidence} color="violet" size="sm" radius="xl" mb="lg" /><Text size="sm" lh={1.65}>{result.summary}</Text></Box><Divider />
          <Stack p="lg" gap="sm">{result.findings.map((finding, index) => <Paper key={`${finding.title}-${index}`} withBorder p="md" radius="md"><Group className={styles.finding} justify="space-between" align="flex-start"><Group className={styles.findingText} align="flex-start" wrap="nowrap"><ThemeIcon size={28} radius="xl" color={finding.severity === 'PASS' ? 'green' : finding.severity === 'INFO' ? 'blue' : finding.severity === 'ATTENTION' ? 'orange' : 'red'} variant="light">{finding.severity === 'PASS' ? <IconCheck size={15} /> : <Text size="xs" fw={850}>{index + 1}</Text>}</ThemeIcon><Box><Text fw={750}>{finding.title}</Text><Text size="sm" c="dimmed" mt={3}>{finding.detail}</Text><Text size="xs" c="violet" mt={7}>Source: {finding.source}</Text></Box></Group><Stack gap="xs" align="flex-end"><SeverityBadge value={finding.severity} /><Button size="compact-xs" variant="subtle" color="green" onClick={() => openAction(finding)}>Create action</Button></Stack></Group></Paper>)}</Stack>
          <Divider /><Group justify="space-between" p="lg" wrap="wrap"><Group><Button variant="default" leftSection={<IconExternalLink size={15} />} onClick={() => setSourceModal(true)}>Open Sources</Button><Button variant="default" leftSection={<IconPlus size={15} />} onClick={() => openAction()}>Create Action</Button></Group><Button color="green" variant="light" leftSection={<IconClipboardCheck size={16} />} onClick={acceptWorkingNote}>Accept as Working Note</Button></Group>
        </Paper>

        <Paper withBorder radius="lg" p="lg" style={surface}><Group gap="xs" mb="md"><IconClipboardCheck size={19} color="#176c3a" /><Box><Text fw={800}>Human Review</Text><Text size="xs" c="dimmed">Record how the engineer handled this advisory result.</Text></Box></Group><Grid><Grid.Col span={{ base: 12, md: 5 }}><Select classNames={{dropdown:styles.dropdown}} label="Disposition" placeholder="Select human decision" data={[{ value: 'ACCEPT_AS_WORKING_NOTE', label: 'Accept as working note' }, { value: 'MODIFY', label: 'Modify' }, { value: 'REJECT', label: 'Reject' }]} value={disposition} onChange={value => setDisposition(value || '')} /></Grid.Col><Grid.Col span={{ base: 12, md: 7 }}><Textarea label="Engineer note" placeholder="Record verification, changes or rejection reason" value={engineerNote} onChange={event => setEngineerNote(event.currentTarget.value)} minRows={3} /></Grid.Col></Grid><Group justify="space-between" mt="md"><Text size="xs" c="dimmed">This records a human disposition. It does not create an engineering approval.</Text><Button color="green" disabled={!disposition || !engineerNote.trim()} onClick={recordDisposition}>Record Human Review</Button></Group></Paper>

        {actions.length > 0 && <Paper withBorder radius="lg" style={surface}><Group justify="space-between" p="lg"><Text fw={800}>Actions Created from AI Assist</Text><Badge color="orange" variant="light">{actions.filter(item => item.status === 'OPEN').length} OPEN</Badge></Group><Divider /><Table.ScrollContainer minWidth={600} type="native"><Table verticalSpacing="sm"><Table.Thead bg="#f7faf8"><Table.Tr><Table.Th>Action</Table.Th><Table.Th>Owner</Table.Th><Table.Th>Due</Table.Th><Table.Th>Priority</Table.Th><Table.Th>Source</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{actions.map(item => <Table.Tr key={item.id}><Table.Td><Text size="sm" fw={700}>{item.title}</Text><Text size="xs" c="dimmed">{item.id}</Text></Table.Td><Table.Td>{item.owner}</Table.Td><Table.Td>{item.due}</Table.Td><Table.Td><Badge color={item.priority === 'HIGH' ? 'red' : 'blue'} variant="light">{item.priority}</Badge></Table.Td><Table.Td><Text size="xs">{item.source}</Text></Table.Td></Table.Tr>)}</Table.Tbody></Table></Table.ScrollContainer></Paper>}
      </Stack></Grid.Col>
    </Grid>

    <Modal fullScreen={isMobile} classNames={{content:styles.modal}} closeButtonProps={{'aria-label':'Close dialog'}} opened={sourceModal} onClose={() => setSourceModal(false)} title={<Group gap="xs"><IconExternalLink size={18} /><Text fw={800}>Controlled Sources</Text></Group>} size="lg" centered><Stack><Alert color="blue">Open and verify these controlled records before using the recommendation.</Alert>{sources.map((source, index) => <Paper key={source} withBorder p="md" radius="md"><Group justify="space-between"><Box><Text fw={700}>{source}</Text><Text size="xs" c="dimmed">Referenced by finding {index + 1} · {ewp.id} · {ewp.seb}</Text></Box><Button variant="subtle" color="violet" rightSection={<IconExternalLink size={14} />}>Open</Button></Group></Paper>)}</Stack></Modal>

    <Modal fullScreen={isMobile} classNames={{content:styles.modal}} closeButtonProps={{'aria-label':'Close dialog'}} opened={actionModal} onClose={() => setActionModal(false)} title={<Group gap="xs"><IconPlus size={18} /><Text fw={800}>Create Engineering Action</Text></Group>} centered><Stack><Alert color="orange" icon={<IconAlertTriangle size={17} />}>A human owner must verify and close this action.</Alert><Textarea label="Action" required value={actionForm.title} onChange={event => { const value = event.currentTarget.value; setActionForm(form => ({ ...form, title: value })); }} /><Select classNames={{dropdown:styles.dropdown}} label="Owner" data={['Lead Engineer', 'Electrical Engineer', 'Reviewer', 'Project Engineering Manager']} value={actionForm.owner} onChange={value => setActionForm(form => ({ ...form, owner: value || '' }))} /><TextInputShim label="Target date" value={actionForm.due} onChange={value => setActionForm(form => ({ ...form, due: value }))} /><Select classNames={{dropdown:styles.dropdown}} label="Priority" data={['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']} value={actionForm.priority} onChange={value => setActionForm(form => ({ ...form, priority: value || 'MEDIUM' }))} /><Group justify="flex-end"><Button variant="default" onClick={() => setActionModal(false)}>Cancel</Button><Button color="green" disabled={!actionForm.title.trim() || !actionForm.owner || !actionForm.due} onClick={createAction}>Create Action</Button></Group></Stack></Modal>
  </Box>;
}

function TextInputShim({ label, value, onChange }) {
  return <DatePickerInput label={label} value={value} onChange={onChange} />;
}
