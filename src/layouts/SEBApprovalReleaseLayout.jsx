import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Badge, Box, Button, Center, Divider, Grid, Group, Loader, Modal,
  Paper, Progress, Select, SimpleGrid, Stack, Table, Text, Textarea,
  ThemeIcon, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle, IconAlertTriangle, IconBan, IconCheck, IconCircleCheck,
  IconClipboardCheck, IconFileText, IconHistory, IconLock, IconMessage,
  IconRefresh, IconRocket, IconShieldCheck, IconUsers,
} from '@tabler/icons-react';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const APPROVERS = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'user-9', 'user-10'];
const DECISIONS = [
  { value: 'APPROVE', label: 'Approve' },
  { value: 'APPROVE_WITH_CONDITION', label: 'Approve with condition' },
  { value: 'CHANGE_REQUIRED', label: 'Change required' },
  { value: 'REJECT', label: 'Reject' },
];
const WORKFLOW_STATUSES = ['READINESS_COMPLETED', 'APPROVED_FOR_RELEASE', 'RELEASED'];

const surface = { borderColor: '#e3e8e5', boxShadow: '0 8px 24px rgba(18, 52, 38, 0.04)' };

async function request(path, options) {
  const response = await fetch(`${API}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || `Request failed (HTTP ${response.status})`);
  return body;
}

function StatusBadge({ value, size = 'sm' }) {
  const colors = {
    READINESS_COMPLETED: 'blue', APPROVED_FOR_RELEASE: 'teal', RELEASED: 'green',
    READY: 'green', CONDITIONAL: 'orange', BLOCKED: 'red', NOT_APPLICABLE: 'gray',
    ACCEPT: 'green', ACCEPT_WITH_CONDITION: 'orange', CHANGE_REQUIRED: 'orange', REJECT: 'red',
    APPROVE: 'green', APPROVE_WITH_CONDITION: 'orange', PENDING: 'gray',
  };
  return <Badge size={size} color={colors[value] || 'gray'} variant="light" radius="sm">{(value || 'PENDING').replaceAll('_', ' ')}</Badge>;
}

function WorkflowProgress({ revisionId, status }) {
  const active = !revisionId ? 0 : !status ? 1 : status === 'READINESS_COMPLETED' ? 2 : status === 'APPROVED_FOR_RELEASE' ? 3 : 4;
  const steps = [
    ['Select context', 'Choose SEB and revision'],
    ['Review summary', 'Check engineering record'],
    ['Engineering approval', 'Record approver decision'],
    ['Controlled release', 'Freeze and release'],
  ];
  return (
    <Paper withBorder p="md" radius="lg" style={surface}>
      <Group justify="space-between" mb="sm">
        <Text size="sm" fw={700}>Approval workflow</Text>
        <Text size="xs" c="dimmed">{active === 4 ? 'Complete' : `Stage ${active + 1} of 4`}</Text>
      </Group>
      <Progress value={(Math.min(active + 1, 4) / 4) * 100} color="green" size="sm" radius="xl" mb="md" />
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
        {steps.map(([label, detail], index) => {
          const complete = index < active || active === 4;
          const current = index === active;
          return (
            <Group key={label} gap="sm" wrap="nowrap" p="xs" style={{ borderRadius: 10, background: current ? '#f0faf4' : 'transparent' }}>
              <ThemeIcon size={30} radius="xl" color={complete || current ? 'green' : 'gray'} variant={current ? 'filled' : 'light'}>
                {complete ? <IconCheck size={16} /> : <Text size="xs" fw={800}>{index + 1}</Text>}
              </ThemeIcon>
              <Box>
                <Text size="xs" fw={current ? 800 : 650} c={index > active ? 'dimmed' : '#1b3026'}>{label}</Text>
                <Text size="10px" c="dimmed" visibleFrom="sm">{detail}</Text>
              </Box>
            </Group>
          );
        })}
      </SimpleGrid>
    </Paper>
  );
}

function SectionHeading({ icon: Icon, title, description, action }) {
  return (
    <Group justify="space-between" align="flex-start" mb="lg" wrap="wrap">
      <Group gap="sm" align="flex-start">
        <ThemeIcon color="green" variant="light" radius="md" size={36}><Icon size={19} /></ThemeIcon>
        <Box><Text fw={800} c="#17251f">{title}</Text>{description && <Text size="xs" c="dimmed" mt={2}>{description}</Text>}</Box>
      </Group>
      {action}
    </Group>
  );
}

function Metric({ label, value, icon: Icon, color, background }) {
  return (
    <Paper p="md" radius="lg" style={{ border: `1px solid ${color}22`, background }}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box><Text size="xs" c="dimmed" fw={650}>{label}</Text><Text size="28px" lh={1.15} fw={850} c={color} mt={7}>{value}</Text></Box>
        <ThemeIcon color={color} variant="transparent" size={30}><Icon size={22} /></ThemeIcon>
      </Group>
    </Paper>
  );
}

function FactListCard({ title, icon: Icon, color, items, type }) {
  return (
    <Paper withBorder p="md" radius="lg" style={{ borderColor: '#e7ebe9' }}>
      <Group justify="space-between" mb="sm">
        <Group gap="xs"><ThemeIcon size={28} radius="md" color={color} variant="light"><Icon size={16} /></ThemeIcon><Text fw={750}>{title}</Text></Group>
        <Badge color={color} variant="light" circle>{items.length}</Badge>
      </Group>
      {items.length === 0 ? (
        <Group gap="xs" py="md"><IconCircleCheck size={18} color="#2f9e44" /><Text size="sm" c="dimmed">None recorded</Text></Group>
      ) : (
        <Stack gap="xs">
          {items.slice(0, 3).map((item, index) => (
            <Box key={`${item.item_id || type}-${index}`} p="sm" style={{ borderRadius: 8, background: color === 'red' ? '#fff5f5' : '#fff9ed' }}>
              <Text size="xs" fw={750}>{item.discipline} · {item.fact_name}</Text>
              <Text size="xs" c="dimmed" mt={3} lineClamp={2}>{type === 'condition' ? item.condition : item.blocker}</Text>
            </Box>
          ))}
          {items.length > 3 && <Text size="xs" c="dimmed">+{items.length - 3} more</Text>}
        </Stack>
      )}
    </Paper>
  );
}

function DetailModal({ opened, onClose, title, children }) {
  return <Modal opened={opened} onClose={onClose} title={<Text fw={800}>{title}</Text>} size="xl" centered radius="lg"><Box style={{ overflowX: 'auto' }}>{children}</Box></Modal>;
}

export default function SEBApprovalReleaseLayout() {
  const caseId = localStorage.getItem('sia_case_id') || '';
  const [sebId, setSebId] = useState(() => localStorage.getItem('seb_id') || '');
  const [revisionId, setRevisionId] = useState(() => localStorage.getItem('seb_revision_id') || '');
  const [baselines, setBaselines] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState('');
  const [approver, setApprover] = useState('');
  const [decision, setDecision] = useState('');
  const [comment, setComment] = useState('');
  const [approvalSaving, setApprovalSaving] = useState(false);
  const [releasedBy, setReleasedBy] = useState(() => localStorage.getItem('user_id') || '');
  const [releaseComment, setReleaseComment] = useState('');
  const [releaseSaving, setReleaseSaving] = useState(false);

  const loadBaselines = async () => {
    if (!caseId) { setBaselines([]); setError('No active SIA case was found.'); return; }
    setContextLoading(true); setError('');
    try {
      const data = await request(`/seb/baselines?sia_case_id=${encodeURIComponent(caseId)}`);
      setBaselines(Array.isArray(data) ? data : []);
    } catch (loadError) { setError(loadError.message); } finally { setContextLoading(false); }
  };

  const loadRevisions = async () => {
    if (!sebId) { setRevisions([]); return; }
    setContextLoading(true); setError('');
    try {
      const data = await request(`/seb/revisions?seb_id=${encodeURIComponent(sebId)}&revision_status=READINESS_COMPLETED`);
      const available = (Array.isArray(data) ? data : []).filter(item => item.revision_status === 'READINESS_COMPLETED');
      if (revisionId && !available.some(item => item.id === revisionId)) {
        try {
          const current = await request(`/seb/revisions/${encodeURIComponent(revisionId)}`);
          if (current.seb_id === sebId && WORKFLOW_STATUSES.includes(current.revision_status)) available.unshift(current);
          else { setRevisionId(''); localStorage.removeItem('seb_revision_id'); }
        } catch { setRevisionId(''); localStorage.removeItem('seb_revision_id'); }
      }
      setRevisions(available);
    } catch (loadError) { setRevisions([]); setError(loadError.message); } finally { setContextLoading(false); }
  };

  const loadSummary = async () => {
    if (!sebId || !revisionId) { setSummary(null); return; }
    setSummaryLoading(true); setError('');
    try {
      setSummary(await request(`/seb/approval-summary?seb_id=${encodeURIComponent(sebId)}&seb_revision_id=${encodeURIComponent(revisionId)}`));
    } catch (loadError) { setSummary(null); setError(loadError.message); } finally { setSummaryLoading(false); }
  };

  useEffect(() => { loadBaselines(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadRevisions(); }, [sebId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadSummary(); }, [sebId, revisionId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!summary?.approval) return;
    setApprover(summary.approval.engineering_approver_id || '');
    setDecision(summary.approval.decision || '');
    setComment(summary.approval.comment || '');
  }, [summary?.approval]);

  const selectedBaseline = useMemo(() => baselines.find(item => item.id === sebId) || summary?.seb, [baselines, sebId, summary?.seb]);
  const selectedRevision = summary?.revision || revisions.find(item => item.id === revisionId);
  const revisionStatus = selectedRevision?.revision_status;
  const review = summary?.engineering_review || {};

  const submitApproval = async () => {
    if (!sebId || !revisionId || !approver || !decision) return;
    setApprovalSaving(true); setError('');
    try {
      const data = await request(`/seb/revisions/${encodeURIComponent(revisionId)}/approval-decision`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seb_id: sebId, approver_user_id: approver, decision, comment }),
      });
      if (decision.startsWith('APPROVE') && data.revision?.revision_status !== 'APPROVED_FOR_RELEASE') throw new Error('Revision status was not updated to APPROVED_FOR_RELEASE.');
      setSummary(data);
      notifications.show({ title: decision.startsWith('APPROVE') ? 'Revision approved' : 'Decision recorded', message: decision.startsWith('APPROVE') ? 'The revision is ready for controlled release.' : 'The approver decision was saved.', color: decision.startsWith('APPROVE') ? 'green' : 'orange' });
    } catch (actionError) { setError(actionError.message); } finally { setApprovalSaving(false); }
  };

  const releaseRevision = async () => {
    if (!sebId || !revisionId || !releasedBy) return;
    setReleaseSaving(true); setError('');
    try {
      const data = await request(`/seb/revisions/${encodeURIComponent(revisionId)}/release`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seb_id: sebId, released_by: releasedBy, release_comment: releaseComment }),
      });
      if (data.revision?.revision_status !== 'RELEASED') throw new Error('Revision status was not updated to RELEASED.');
      setSummary(data);
      notifications.show({ title: 'SEB released', message: 'The controlled revision was frozen and released.', color: 'green' });
    } catch (actionError) { setError(actionError.message); } finally { setReleaseSaving(false); }
  };

  const requiresComment = decision && decision !== 'APPROVE';
  const canSubmitApproval = revisionStatus === 'READINESS_COMPLETED' && approver && decision && (!requiresComment || comment.trim());

  return (
    <Box p={{ base: 'sm', sm: 'lg', xl: 'xl' }} maw={1320} mx="auto" pb={60}>
      <Paper radius="xl" p={{ base: 'lg', sm: 'xl' }} mb="lg" style={{ color: 'white', border: '1px solid #1d5f42', background: 'radial-gradient(circle at 88% 10%, rgba(102, 214, 151, .25), transparent 30%), linear-gradient(130deg, #0f3d2b 0%, #17603f 58%, #237a50 100%)', boxShadow: '0 18px 40px rgba(15, 61, 43, .18)' }}>
        <Group justify="space-between" align="center" wrap="wrap" gap="lg">
          <Box>
            <Badge color="green.1" c="green.9" variant="filled" mb="md">SITE ENGINEERING PREPARATION</Badge>
            <Title order={1} size="32px" c="white">Approval & Release</Title>
            <Text size="sm" c="green.0" mt={7} maw={650}>Review the engineering baseline, record the authorized decision, and issue a traceable controlled release.</Text>
          </Box>
          <ThemeIcon size={72} radius="xl" color="white" variant="light"><IconShieldCheck size={36} /></ThemeIcon>
        </Group>
      </Paper>

      <WorkflowProgress revisionId={revisionId} status={revisionStatus} />

      <Paper withBorder p={{ base: 'md', sm: 'lg' }} radius="lg" mt="md" style={surface}>
        <SectionHeading icon={IconHistory} title="Select approval context" description={`Active SIA case: ${caseId || 'Not selected'}`} action={<Button size="xs" variant="subtle" color="green" leftSection={<IconRefresh size={14} />} loading={contextLoading} onClick={() => { loadBaselines(); loadRevisions(); }}>Refresh</Button>} />
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <Select label="1. SEB baseline" placeholder={caseId ? 'Choose an SEB' : 'Select an SIA case first'} data={baselines.map(item => ({ value: item.id, label: `${item.seb_code || item.id} · ${item.status}` }))} value={sebId || null} onChange={value => { const next = value || ''; setSebId(next); setRevisionId(''); setSummary(null); setRevisions([]); if (next) localStorage.setItem('seb_id', next); else localStorage.removeItem('seb_id'); localStorage.removeItem('seb_revision_id'); }} searchable clearable disabled={!caseId || contextLoading} styles={{ input: { minHeight: 42 } }} />
          <Select label="2. Eligible revision" description="Only readiness-completed revisions can enter approval." placeholder={sebId ? 'Choose a revision' : 'Choose an SEB first'} data={revisions.map(item => ({ value: item.id, label: `${item.revision_no} · ${item.revision_status.replaceAll('_', ' ')}` }))} value={revisionId || null} onChange={value => { const next = value || ''; setRevisionId(next); setSummary(null); if (next) localStorage.setItem('seb_revision_id', next); else localStorage.removeItem('seb_revision_id'); }} searchable clearable disabled={!sebId || contextLoading} styles={{ input: { minHeight: 42 } }} />
        </SimpleGrid>
        {!contextLoading && sebId && revisions.length === 0 && !error && <Alert color="yellow" variant="light" mt="md" icon={<IconAlertTriangle size={17} />}>No readiness-completed revision is available for this SEB.</Alert>}
      </Paper>

      {error && <Alert color="red" icon={<IconAlertCircle size={17} />} mt="md" radius="lg" withCloseButton onClose={() => setError('')}>{error}</Alert>}
      {!revisionId && <Paper withBorder p={48} mt="md" radius="lg" style={{ ...surface, borderStyle: 'dashed' }}><Center><Stack align="center" gap="xs"><ThemeIcon size={48} radius="xl" color="gray" variant="light"><IconClipboardCheck size={25} /></ThemeIcon><Text fw={700}>Select a revision to begin</Text><Text size="sm" c="dimmed" ta="center">The approval summary and decision controls will appear here.</Text></Stack></Center></Paper>}
      {summaryLoading && <Paper withBorder mt="md" p={55} radius="lg" style={surface}><Center><Stack align="center" gap="sm"><Loader color="green" /><Text size="sm" c="dimmed">Building approval summary…</Text></Stack></Center></Paper>}

      {summary && !summaryLoading && (
        <Stack mt="md" gap="md">
          <Paper radius="lg" p={{ base: 'md', sm: 'lg' }} style={{ border: '1px solid #cce6d7', background: 'linear-gradient(100deg, #f1fbf5, #fbfefd)' }}>
            <Group justify="space-between" align="center" wrap="wrap">
              <Group gap="md"><ThemeIcon size={44} radius="lg" color="green" variant="filled"><IconFileText size={22} /></ThemeIcon><Box><Text size="xs" c="dimmed" fw={700}>SELECTED CONTROLLED BASELINE</Text><Title order={3}>{selectedBaseline?.seb_code || sebId} <Text span c="dimmed" fw={500}>/</Text> {selectedRevision?.revision_no || revisionId}</Title><Text size="xs" c="dimmed">Site {selectedBaseline?.site_id || '—'} · Project {selectedBaseline?.project_id || '—'}</Text></Box></Group>
              <StatusBadge value={revisionStatus} size="lg" />
            </Group>
          </Paper>

          <Grid gutter="md" align="stretch">
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="lg" h="100%" style={surface}>
                <SectionHeading icon={IconClipboardCheck} title="3. Approval summary" description="Engineering review and discipline readiness at a glance" action={<Button size="xs" variant="subtle" color="green" leftSection={<IconRefresh size={14} />} onClick={loadSummary}>Refresh</Button>} />
                <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="sm">
                  <Metric label="Total items" value={review.total || 0} icon={IconFileText} color="#334155" background="#f8fafc" />
                  <Metric label="Accepted" value={review.accepted || 0} icon={IconCircleCheck} color="#16834f" background="#f0faf4" />
                  <Metric label="Conditional" value={review.conditional || 0} icon={IconAlertTriangle} color="#d97706" background="#fff9ed" />
                  <Metric label="Changes" value={review.change_required || 0} icon={IconHistory} color="#ea580c" background="#fff7ed" />
                  <Metric label="Rejected" value={review.rejected || 0} icon={IconBan} color="#dc2626" background="#fff5f5" />
                </SimpleGrid>

                <Divider my="xl" />
                <Group justify="space-between" mb="md"><Box><Text fw={800}>Discipline readiness</Text><Text size="xs" c="dimmed">The most restrictive result is shown for each discipline.</Text></Box><Badge color="green" variant="light">{summary.readiness.length} disciplines</Badge></Group>
                {summary.readiness.length ? <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">{summary.readiness.map(item => <Group key={item.discipline} justify="space-between" p="sm" style={{ border: '1px solid #e6ebe8', borderRadius: 9, background: '#fbfcfb' }}><Text size="sm" fw={700}>{item.discipline}</Text><StatusBadge value={item.status} /></Group>)}</SimpleGrid> : <Text size="sm" c="dimmed">No discipline readiness records.</Text>}

                <Divider my="xl" />
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                  <Button variant="light" color="green" leftSection={<IconFileText size={16} />} onClick={() => setModal('items')}>SEB Items · {summary.items.length}</Button>
                  <Button variant="light" color="blue" leftSection={<IconShieldCheck size={16} />} onClick={() => setModal('evidence')}>Evidence · {summary.evidence_references.length}</Button>
                  <Button variant="light" color="gray" leftSection={<IconMessage size={16} />} onClick={() => setModal('comments')}>Comments · {summary.review_comments.length}</Button>
                </SimpleGrid>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 4 }}>
              <Stack h="100%" gap="md">
                <FactListCard title="Conditions" icon={IconAlertTriangle} color="orange" items={summary.conditions} type="condition" />
                <FactListCard title="Blockers" icon={IconBan} color="red" items={summary.blockers} type="blocker" />
                <Paper withBorder p="md" radius="lg" style={{ borderColor: '#e7ebe9', background: '#fbfcfb' }}>
                  <Text size="xs" fw={800} c="dimmed" mb="sm">REVISION DETAILS</Text>
                  {[['Issue date', selectedRevision?.issue_date], ['Prepared by', selectedRevision?.prepared_by], ['Reason', selectedRevision?.revision_reason]].map(([label, value]) => <Group key={label} justify="space-between" py={5} wrap="nowrap"><Text size="xs" c="dimmed">{label}</Text><Text size="xs" fw={650} ta="right" lineClamp={1}>{value || '—'}</Text></Group>)}
                </Paper>
              </Stack>
            </Grid.Col>
          </Grid>

          <Grid gutter="md" align="stretch">
            <Grid.Col span={{ base: 12, lg: 7 }}>
              <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="lg" h="100%" style={{ ...surface, borderTop: '4px solid #16834f' }}>
                <SectionHeading icon={IconUsers} title="4-7. Engineering approval" description="Assign the authorized approver and record the formal decision" />
                {revisionStatus === 'READINESS_COMPLETED' ? (
                  <Stack gap="md">
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md"><Select label="Engineering Approver" placeholder="Select user" data={APPROVERS} value={approver || null} onChange={value => setApprover(value || '')} searchable required styles={{ input: { minHeight: 42 } }} /><Select label="Decision" placeholder="Select decision" data={DECISIONS} value={decision || null} onChange={value => setDecision(value || '')} required styles={{ input: { minHeight: 42 } }} /></SimpleGrid>
                    <Textarea label="Approval comment" placeholder="Record the basis for this decision" value={comment} onChange={event => setComment(event.currentTarget.value)} autosize minRows={4} required={Boolean(requiresComment)} description={requiresComment ? 'Required for conditional approval, change required, and reject.' : 'Optional for a standard approval.'} />
                    <Group justify="space-between" align="center" wrap="wrap"><Text size="xs" c="dimmed">Submitting an approval moves this revision to <strong>APPROVED FOR RELEASE</strong>.</Text><Button size="md" color="green" leftSection={<IconCheck size={17} />} onClick={submitApproval} loading={approvalSaving} disabled={!canSubmitApproval}>Submit Approval</Button></Group>
                  </Stack>
                ) : (
                  <Alert color="green" variant="light" icon={<IconShieldCheck size={19} />} title="Engineering approval recorded" radius="md"><SimpleGrid cols={{ base: 1, sm: 2 }}><Box><Text size="xs" c="dimmed">Approver</Text><Text size="sm" fw={700}>{summary.approval?.engineering_approver_id || '—'}</Text></Box><Box><Text size="xs" c="dimmed">Decision</Text><StatusBadge value={summary.approval?.decision || 'APPROVE'} /></Box></SimpleGrid>{summary.approval?.comment && <Text size="sm" mt="sm">{summary.approval.comment}</Text>}</Alert>
                )}
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 5 }}>
              <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="lg" h="100%" style={{ ...surface, borderTop: `4px solid ${revisionStatus === 'RELEASED' ? '#16834f' : '#d97706'}` }}>
                <SectionHeading icon={IconRocket} title="8-10. Controlled release" description="Freeze the approved baseline and issue the release" />
                {revisionStatus === 'READINESS_COMPLETED' && <Box p="lg" style={{ borderRadius: 12, background: '#f8fafc', border: '1px dashed #cbd5e1' }}><Center><Stack align="center" gap="xs"><ThemeIcon color="gray" variant="light" radius="xl"><IconLock size={17} /></ThemeIcon><Text size="sm" fw={700}>Waiting for approval</Text><Text size="xs" c="dimmed" ta="center">Release unlocks after an approving decision.</Text></Stack></Center></Box>}
                {revisionStatus === 'APPROVED_FOR_RELEASE' && <Stack><Alert color="orange" variant="light" icon={<IconLock size={17} />} radius="md">This creates a SHA-256 verified immutable snapshot.</Alert><Select label="Released by" placeholder="Select authorized user" data={APPROVERS} value={releasedBy || null} onChange={value => setReleasedBy(value || '')} searchable required /><Textarea label="Release note" placeholder="Optional controlled-release note" value={releaseComment} onChange={event => setReleaseComment(event.currentTarget.value)} autosize minRows={3} /><Button color="green" size="md" fullWidth leftSection={<IconRocket size={17} />} onClick={releaseRevision} loading={releaseSaving} disabled={!releasedBy}>Release SEB Revision</Button></Stack>}
                {revisionStatus === 'RELEASED' && <Stack><Alert color="green" variant="light" icon={<IconLock size={18} />} title="Controlled baseline released" radius="md">This revision is frozen and immutable.</Alert><Box p="md" style={{ borderRadius: 10, background: '#f0faf4' }}><Text size="xs" c="dimmed">Release</Text><Text fw={800}>{summary.release?.release_code || '—'}</Text><Divider my="sm" /><Text size="xs" c="dimmed">SHA-256</Text><Text size="10px" ff="monospace" style={{ overflowWrap: 'anywhere' }}>{summary.release?.release_hash || '—'}</Text><Group justify="space-between" mt="sm"><Text size="xs" c="dimmed">Frozen items</Text><Text size="xs" fw={700}>{summary.release?.frozen_snapshot?.item_ids?.length || summary.items.length}</Text></Group><Group justify="space-between" mt={5}><Text size="xs" c="dimmed">Released by</Text><Text size="xs" fw={700}>{summary.release?.released_by || '—'}</Text></Group></Box></Stack>}
              </Paper>
            </Grid.Col>
          </Grid>
        </Stack>
      )}

      <DetailModal opened={modal === 'items'} onClose={() => setModal('')} title="SEB Items"><Table withTableBorder highlightOnHover verticalSpacing="sm"><Table.Thead><Table.Tr><Table.Th>Fact</Table.Th><Table.Th>Discipline</Table.Th><Table.Th>Review Decision</Table.Th><Table.Th>Readiness</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{(summary?.items || []).map(item => <Table.Tr key={item.id}><Table.Td><Text size="sm" fw={650}>{item.fact_name}</Text><Text size="10px" c="dimmed">{item.fact_collection}</Text></Table.Td><Table.Td>{item.discipline}</Table.Td><Table.Td><StatusBadge value={item.review_decision} /></Table.Td><Table.Td><StatusBadge value={item.readiness} /></Table.Td></Table.Tr>)}</Table.Tbody></Table></DetailModal>
      <DetailModal opened={modal === 'evidence'} onClose={() => setModal('')} title="Evidence References">{(summary?.evidence_references || []).length ? <Table withTableBorder highlightOnHover verticalSpacing="sm"><Table.Thead><Table.Tr><Table.Th>Type</Table.Th><Table.Th>Evidence ID</Table.Th><Table.Th>SEB Item</Table.Th><Table.Th>Evidence Hash</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{summary.evidence_references.map(item => <Table.Tr key={item.id}><Table.Td>{item.evidence_type || '—'}</Table.Td><Table.Td>{item.sia_evidence_id || '—'}</Table.Td><Table.Td>{item.seb_item_id || '—'}</Table.Td><Table.Td><Text size="xs" ff="monospace">{item.evidence_hash || '—'}</Text></Table.Td></Table.Tr>)}</Table.Tbody></Table> : <Center py="xl"><Text c="dimmed">No evidence references.</Text></Center>}</DetailModal>
      <DetailModal opened={modal === 'comments'} onClose={() => setModal('')} title="Engineering Review Comments">{(summary?.review_comments || []).length ? <Table withTableBorder highlightOnHover verticalSpacing="sm"><Table.Thead><Table.Tr><Table.Th>Fact</Table.Th><Table.Th>Discipline</Table.Th><Table.Th>Comment</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{summary.review_comments.map(item => <Table.Tr key={item.item_id}><Table.Td>{item.fact_name}</Table.Td><Table.Td>{item.discipline}</Table.Td><Table.Td>{item.comment}</Table.Td></Table.Tr>)}</Table.Tbody></Table> : <Center py="xl"><Text c="dimmed">No review comments.</Text></Center>}</DetailModal>
    </Box>
  );
}
