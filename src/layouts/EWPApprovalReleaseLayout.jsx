import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Accordion, Alert, Badge, Box, Button, Checkbox, Divider, Grid, Group,
  Loader, Modal, Paper, ScrollArea, Select, SimpleGrid, Stack, Table,
  Tabs, Text, Textarea, ThemeIcon, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconFileDescription, IconLock, IconRefresh, IconShieldCheck } from '@tabler/icons-react';

const API = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const ROOT = '/ewp/approval-release';
const DECISIONS = ['APPROVE', 'APPROVE_WITH_CONDITION', 'CHANGE_REQUIRED', 'REJECT'];
const surface = { borderColor: '#dfe7e2', boxShadow: '0 8px 26px rgba(21,55,39,.045)' };

async function request(path, options = {}) {
  const response = await fetch(`${API}${ROOT}${path}`, {
    ...options,
    headers: options.body ? { 'Content-Type': 'application/json' } : {},
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(body.detail) ? body.detail.map(item => item.msg).join('; ') : body.detail;
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return body;
}

function Status({ value }) {
  const color = ['RELEASED', 'APPROVED', 'READY', 'ACCEPT', 'CLOSED', 'REVIEW_COMPLETED'].includes(value) ? 'green'
    : ['REJECT', 'REJECTED', 'BLOCKED'].includes(value) ? 'red'
      : ['CONDITIONAL', 'CHANGE_REQUIRED', 'APPROVE_WITH_CONDITION'].includes(value) ? 'orange' : 'blue';
  return <Badge color={color} variant="light" radius="sm">{(value || 'NOT RECORDED').replaceAll('_', ' ')}</Badge>;
}

function Field({ label, value }) {
  return <Box><Text size="xs" c="dimmed" mb={3}>{label}</Text><Text size="sm" fw={650} style={{ overflowWrap: 'anywhere' }}>{value || 'Not recorded'}</Text></Box>;
}

function ReadinessDetails({ item }) {
  const readiness = typeof item.readiness === 'object' && item.readiness ? item.readiness : {};
  const condition = readiness.conditional || {};
  const blocker = readiness.blocked || {};
  return <Stack gap="xs">
    <Status value={typeof item.readiness === 'string' ? item.readiness : readiness.status} />
    {condition.enabled && <Alert color="orange" title="Condition"><Text size="sm">{condition.condition}</Text><Text size="xs">Action: {condition.required_action || 'Not recorded'}</Text><Text size="xs">Owner: {condition.owner || 'Not recorded'} · Target: {condition.target_date || 'Not recorded'}</Text></Alert>}
    {blocker.enabled && <Alert color="red" title="Blocker"><Text size="sm">{blocker.blocker}</Text><Text size="xs">{blocker.reason}</Text><Text size="xs">Owner: {blocker.owner || 'Not recorded'} · Related fact/gap: {blocker.related_fact_or_gap || blocker.related_fact_id || 'Not recorded'}</Text></Alert>}
  </Stack>;
}

export default function EWPApprovalReleaseLayout() {
  const [ewps, setEwps] = useState([]);
  const [people, setPeople] = useState({ users: [] });
  const [documents, setDocuments] = useState([]);
  const [ewpId, setEwpId] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [revisionId, setRevisionId] = useState(null);
  const [context, setContext] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingPackage, setLoadingPackage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [approverId, setApproverId] = useState(null);
  const [decision, setDecision] = useState('APPROVE');
  const [comment, setComment] = useState('');
  const [condition, setCondition] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [releaseModal, setReleaseModal] = useState(false);
  const [releaseComment, setReleaseComment] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    Promise.all([request('/ewps', { signal: controller.signal }), request('/approvers', { signal: controller.signal })])
      .then(([rows, users]) => { if (!controller.signal.aborted) { setEwps(rows); setPeople(users); } })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (!ewpId) return;
    const controller = new AbortController();
    setLoadingDocuments(true);
    request(`/documents?ewp_id=${encodeURIComponent(ewpId)}`, { signal: controller.signal })
      .then(rows => { if (!controller.signal.aborted) setDocuments(rows); })
      .catch(err => { if (!controller.signal.aborted) { setDocuments([]); setError(err.message); } })
      .finally(() => { if (!controller.signal.aborted) setLoadingDocuments(false); });
    return () => controller.abort();
  }, [ewpId, refresh]);

  useEffect(() => {
    setContext(null); setReviewed(false); setDecision('APPROVE'); setComment(''); setCondition(''); setApproverId(null);
    if (!revisionId) return;
    const controller = new AbortController();
    setLoadingPackage(true); setError('');
    request(`/revisions/${encodeURIComponent(revisionId)}/package`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) { setContext(data); setApproverId(data.approval?.approver_id || null); } })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoadingPackage(false); });
    return () => controller.abort();
  }, [revisionId, refresh]);

  const selectedDocument = documents.find(row => row.id === documentId);
  const pkg = context?.package;
  const approval = context?.approval;
  const release = context?.release;
  const mayApprove = context?.is_current && context?.status === 'REVIEW_COMPLETED';
  const hasAssignedApprover = Boolean(approval?.approver_id);
  const canRelease = context?.is_current && context?.status === 'READY_FOR_RELEASE';
  const reviewValid = pkg?.file?.sha256 && pkg.open_comments === 0 && pkg.reviewers.length > 0
    && pkg.reviewers.every(row => row.status === 'COMPLETED' && ['ACCEPT', 'ACCEPT_WITH_COMMENT'].includes(row.decision));
  const busy = saving || loading || loadingDocuments || loadingPackage;

  const act = async (path, method, body, title) => {
    setSaving(true); setError('');
    try {
      const data = await request(`/revisions/${encodeURIComponent(revisionId)}/${path}`, { method, body: JSON.stringify(body) });
      setContext(data); setApproverId(data.approval?.approver_id || null);
      setDocuments(rows => rows.map(row => ({ ...row, revisions: row.revisions.map(rev => rev.id === revisionId ? { ...rev, status: data.status } : rev) })));
      setReleaseModal(false);
      notifications.show({ color: 'green', title, message: `${data.package.document.code} / ${data.package.revision.revision_no}` });
    } catch (err) {
      setError(err.message); setReleaseModal(false);
    } finally { setSaving(false); }
  };

  const downloadRecord = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(release, null, 2)], { type: 'application/json' }));
    const link = window.document.createElement('a'); link.href = url;
    link.download = `${pkg.document.code}-${pkg.revision.revision_no}-release.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <Box p={{ base: 'md', md: 'xl' }} maw={1380} mx="auto"><Stack gap="lg">
    <Group justify="space-between" align="flex-start">
      <Box><Badge color="green" variant="light" mb="xs">Engineering Workbench</Badge><Title order={2}>Approval & Release</Title><Text c="dimmed" size="sm" mt={5}>Approve a reviewed document revision and release it as a controlled engineering output.</Text></Box>
      <ThemeIcon color="green" variant="light" size={48} radius="lg"><IconShieldCheck size={26} /></ThemeIcon>
    </Group>

    <SimpleGrid cols={{ base: 1, sm: 3 }}>
      {[['Reviewed revision', !!pkg, 'Select the exact document and revision'], ['Formal approval', !!approval?.decision, 'Assigned approver records a decision'], ['Controlled release', !!release, 'Freeze the approved revision']].map(([label, done, description], index) => <Paper key={label} withBorder p="md" radius="md" style={surface}><Group wrap="nowrap"><ThemeIcon radius="xl" color={done ? 'green' : 'gray'} variant="light">{done ? <IconCheck size={16} /> : index + 1}</ThemeIcon><Box><Text fw={700} size="sm">{label}</Text><Text size="xs" c="dimmed">{description}</Text></Box></Group></Paper>)}
    </SimpleGrid>

    {error && <Alert color="red" title="Unable to complete request" icon={<IconAlertTriangle size={18} />}>{error}</Alert>}
    <Paper withBorder radius="lg" p="lg" style={surface}>
      <Group justify="space-between" mb="md"><Box><Text fw={750}>Select reviewed output</Text><Text size="xs" c="dimmed">Review-completed revisions, approval decisions, and existing releases.</Text></Box><Button variant="subtle" color="green" leftSection={<IconRefresh size={15} />} disabled={busy} onClick={() => setRefresh(value => value + 1)}>Refresh</Button></Group>
      <SimpleGrid cols={{ base: 1, md: 3 }}>
        <Select label="EWP" placeholder="Select EWP" searchable clearable disabled={busy} data={ewps.map(row => ({ value: row.id, label: `${row.code} · ${row.name}` }))} value={ewpId} onChange={value => { setEwpId(value); setDocumentId(null); setRevisionId(null); setDocuments([]); setContext(null); setError(''); }} />
        <Select label="Document" placeholder="Select reviewed document" searchable clearable disabled={!ewpId || busy} data={documents.map(row => ({ value: row.id, label: `${row.code} · ${row.title}` }))} value={documentId} onChange={value => { setDocumentId(value); setRevisionId(null); setContext(null); setError(''); }} />
        <Select label="Reviewed revision" placeholder="Select exact revision" disabled={!documentId || busy} data={(selectedDocument?.revisions || []).map(row => ({ value: row.id, label: `${row.revision_no} · ${row.status.replaceAll('_', ' ')}` }))} value={revisionId} onChange={setRevisionId} />
      </SimpleGrid>
      {(loading || loadingDocuments || loadingPackage) && <Group mt="md"><Loader size="xs" color="green" /><Text size="sm" c="dimmed">Loading saved engineering records…</Text></Group>}
      {ewpId && !loadingDocuments && !documents.length && <Alert color="blue" mt="md">No reviewed document revisions are available for this EWP. Complete technical review in Documents & Reviews first.</Alert>}
    </Paper>

    {pkg && <>
      <Paper withBorder p="lg" radius="lg" style={surface}>
        <Group justify="space-between" align="flex-start"><Box><Text size="xs" c="dimmed" tt="uppercase">Approval package</Text><Title order={3} mt={4}>{pkg.document.code} / {pkg.revision.revision_no}</Title><Text c="dimmed" size="sm">{pkg.document.title}</Text></Box><Status value={context.status} /></Group>
        <Divider my="lg" />
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg">
          <Field label="EWP" value={`${pkg.ewp.code} · ${pkg.ewp.name}`} /><Field label="Deliverable" value={`${pkg.deliverable.code} · ${pkg.deliverable.name}`} />
          <Field label="Prepared by" value={pkg.prepared_by} /><Field label="SEB design basis" value={`${pkg.seb_basis.seb?.code || pkg.seb_basis.seb_id || 'Not recorded'} / ${pkg.seb_basis.released_revision?.revision_no || pkg.seb_basis.revision_id || 'Not recorded'}`} />
          <Field label="Technical review" value="COMPLETED" /><Field label="Open comments" value={String(pkg.open_comments)} />
          <Field label="Reviewed by" value={pkg.reviewers.map(row => row.reviewer_name).join(', ')} /><Field label="File" value={pkg.file.name} />
        </SimpleGrid>
        <Group mt="lg"><Button component="a" variant="light" color="green" leftSection={<IconFileDescription size={16} />} href={`${API}/ewp/documents-reviews/documents/${encodeURIComponent(pkg.document.id)}/revisions/${encodeURIComponent(pkg.revision.id)}/file`} target="_blank" rel="noreferrer" disabled={!pkg.file.name}>Open {pkg.revision.revision_no} document</Button>
          {release && <Button variant="default" onClick={downloadRecord}>Download release record</Button>}
        </Group>
        {!context.is_current && <Alert mt="md" color="blue">This is a historical revision. Its saved approval and release remain available here.</Alert>}
      </Paper>

      <Paper withBorder radius="lg" p="lg" style={surface}>
        <Tabs defaultValue="reviews" color="green">
          <Tabs.List><Tabs.Tab value="reviews">Reviewers & comments</Tabs.Tab><Tabs.Tab value="inputs">Design inputs & conditions</Tabs.Tab><Tabs.Tab value="traceability">Traceability</Tabs.Tab></Tabs.List>
          <Tabs.Panel value="reviews" pt="md"><Stack>
            <ScrollArea><Table miw={560} verticalSpacing="sm"><Table.Thead><Table.Tr><Table.Th>Reviewer</Table.Th><Table.Th>Role</Table.Th><Table.Th>Decision</Table.Th><Table.Th>Comment</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{pkg.reviewers.map(row => <Table.Tr key={row.id}><Table.Td>{row.reviewer_name}</Table.Td><Table.Td>{row.reviewer_role}</Table.Td><Table.Td><Status value={row.decision} /></Table.Td><Table.Td>{row.decision_comment || '—'}</Table.Td></Table.Tr>)}</Table.Tbody></Table></ScrollArea>
            <Text fw={700} size="sm">Comment closure</Text>
            {pkg.comments.map(row => <Paper key={row.id} withBorder p="md" radius="md"><Group justify="space-between"><Text size="sm" fw={600}>{row.text}</Text><Status value={row.status} /></Group><Text size="xs" c="dimmed" mt={5}>Raised by {row.raised_by}{row.markup_reference ? ` · ${row.markup_reference}` : ''}</Text><Text size="sm" mt="xs">Response: {row.response || 'Not recorded'}</Text>{row.responded_by && <Text size="xs" c="dimmed">{row.responded_by}</Text>}</Paper>)}
            {!pkg.comments.length && <Text size="sm" c="dimmed">No review comments were recorded.</Text>}
          </Stack></Tabs.Panel>
          <Tabs.Panel value="inputs" pt="md"><Stack>
            <Text size="sm" c="dimmed">Inputs remain linked to the frozen SEB release used by this EWP.</Text>
            <Accordion variant="separated">{pkg.inputs.map(row => <Accordion.Item value={row.link_id} key={row.link_id}><Accordion.Control><Text size="sm" fw={600}>{row.item.display_value || row.item.item_name || row.release_item_id}</Text><Text size="xs" c="dimmed">{row.item.discipline || 'Discipline not recorded'}</Text></Accordion.Control><Accordion.Panel><ReadinessDetails item={row.item} /><Text size="xs" c="dimmed" mt="sm">Released item: {row.release_item_id}</Text><Text size="xs" c="dimmed">Source fact: {row.item.fact_id || row.item.source_reference?.fact_id || 'Not recorded'}</Text></Accordion.Panel></Accordion.Item>)}</Accordion>
            {!pkg.inputs.length && <Text size="sm" c="dimmed">No SEB inputs recorded.</Text>}
            {pkg.input_confirmations.map(row => <Field key={row.id} label="Engineering inputs confirmed by" value={`${row.confirmed_by || 'Not recorded'} · ${row.confirmed_at || ''}`} />)}
            {approval?.condition && <Alert color="orange" title="Approval condition">{approval.condition}</Alert>}
          </Stack></Tabs.Panel>
          <Tabs.Panel value="traceability" pt="md"><Stack>
            <Field label="Document revision ID" value={pkg.revision.id} /><Field label="Frozen SEB snapshot" value={pkg.seb_basis.freeze_snapshot_id} />
            <Field label="Document SHA-256" value={pkg.file.sha256} /><Field label="Approved package SHA-256" value={approval?.package_hash} />
            {release && <><Field label="Release record" value={release.release_code} /><Field label="Release SHA-256" value={release.release_hash} /><Field label="Released by" value={release.released_by} /><Field label="Released at" value={release.released_at} /></>}
          </Stack></Tabs.Panel>
        </Tabs>
      </Paper>

      {mayApprove && <Paper withBorder radius="lg" p="lg" style={surface}><Stack>
        <Box><Text fw={750}>Formal engineering approval</Text><Text c="dimmed" size="sm">Select an engineering approver and record the decision.</Text></Box>
        <Group align="flex-end"><Select style={{ flex: 1 }} label="Engineering approver" searchable required placeholder="Select user" disabled={saving} value={approverId} data={people.users.map(row => ({ value: row.id, label: row.name }))} onChange={setApproverId} /><Button variant="light" color="green" loading={saving} disabled={!approverId || approverId === approval?.approver_id} onClick={() => act('approver', 'PUT', { approver_id: approverId }, 'Approver assigned')}>Assign approver</Button></Group>
        {approval?.approver && <Text size="sm">Assigned to: <strong>{approval.approver}</strong></Text>}
        {!reviewValid && <Alert color="orange">Approval requires the reviewed file, accepted reviewer decisions, and no open comments.</Alert>}
        <Grid><Grid.Col span={{ base: 12, md: 4 }}><Select label="Decision" required data={DECISIONS.map(value => ({ value, label: value.replaceAll('_', ' ') }))} value={decision} disabled={saving || !hasAssignedApprover} onChange={value => setDecision(value || 'APPROVE')} /></Grid.Col><Grid.Col span={{ base: 12, md: 8 }}><Textarea label="Comment" required={decision !== 'APPROVE'} minRows={3} value={comment} disabled={saving || !hasAssignedApprover} onChange={event => setComment(event.currentTarget.value)} /></Grid.Col></Grid>
        {decision === 'APPROVE_WITH_CONDITION' && <Textarea label="Approval condition" required minRows={3} value={condition} disabled={saving || !hasAssignedApprover} onChange={event => setCondition(event.currentTarget.value)} />}
        <Checkbox label={`I have reviewed ${pkg.document.code} / ${pkg.revision.revision_no}, its inputs, reviewer decisions, and comment closure.`} checked={reviewed} disabled={saving || !hasAssignedApprover} onChange={event => setReviewed(event.currentTarget.checked)} />
        <Group justify="flex-end"><Button color="green" leftSection={<IconShieldCheck size={16} />} loading={saving} disabled={!hasAssignedApprover || approverId !== approval?.approver_id || !reviewed || !reviewValid || (decision !== 'APPROVE' && !comment.trim()) || (decision === 'APPROVE_WITH_CONDITION' && !condition.trim())} onClick={() => act('approval', 'POST', { decision, comment, condition, package_reviewed: reviewed, package_hash: context.package_hash }, 'Approval decision saved')}>Submit approval</Button></Group>
      </Stack></Paper>}

      {approval?.decision && <Paper withBorder radius="lg" p="lg" style={surface}><Stack>
        <Group justify="space-between"><Text fw={750}>Recorded approval</Text><Status value={approval.decision} /></Group>
        <SimpleGrid cols={{ base: 1, sm: 2 }}><Field label="Approver" value={approval.approver} /><Field label="Decision recorded at" value={approval.decided_at} /></SimpleGrid>
        <Text size="sm">{approval.comment || 'No approval comment.'}</Text>
        {approval.condition && <Alert color="orange" title="Release condition">{approval.condition}</Alert>}
        {['CHANGE_REQUIRED', 'REJECTED'].includes(context.status) && <Alert color="orange">Create a new document revision in Documents & Reviews, resolve the decision, and complete technical review again.</Alert>}
        {context.status === 'READY_FOR_RELEASE' && <><Divider /><Group justify="space-between"><Box><Text fw={700}>Ready for controlled release</Text><Text size="sm" c="dimmed">Release freezes this revision and its approval package.</Text></Box><Button color="green" leftSection={<IconLock size={16} />} disabled={!canRelease || saving} onClick={() => { setReleaseComment(''); setReleaseModal(true); }}>Release {pkg.revision.revision_no}</Button></Group></>}
        {release && <Alert color="green" icon={<IconLock size={18} />} title={`${pkg.revision.revision_no} released and locked`}>Released by {release.released_by} on {new Date(release.released_at).toLocaleString()}. Engineering changes require a new revision.</Alert>}
        <Group><Button component={Link} to="/ginfina/ewp/documents-reviews" variant="subtle" color="green">Open Documents & Reviews</Button></Group>
      </Stack></Paper>}
    </>}
  </Stack>
    <Modal opened={releaseModal} onClose={() => { if (!saving) setReleaseModal(false); }} title={`Release ${pkg?.document.code || ''} / ${pkg?.revision.revision_no || ''}`} centered size="lg">
      <Stack><Alert color="orange" icon={<IconLock size={18} />}>This exact revision, file hash, review results, SEB inputs, conditions, and approval will be frozen. Subsequent changes require another revision.</Alert>
        <Field label="Release user" value="Prototype pilot" />
        <Textarea label="Release comment" minRows={3} value={releaseComment} disabled={saving} onChange={event => setReleaseComment(event.currentTarget.value)} />
        <Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setReleaseModal(false)}>Cancel</Button><Button color="green" loading={saving} disabled={!canRelease} onClick={() => act('release', 'POST', { comment: releaseComment }, 'Document revision released')}>Confirm release</Button></Group>
      </Stack>
    </Modal>
  </Box>;
}
