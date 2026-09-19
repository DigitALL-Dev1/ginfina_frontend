import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Badge, Box, Button, Checkbox, Divider, FileInput, Grid, Group, Modal,
  Paper, Progress, ScrollArea, Select, SimpleGrid, Stack, Table, Text, Textarea,
  TextInput, ThemeIcon, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle, IconArrowRight, IconCheck, IconCircleCheck, IconFileDescription,
  IconFileUpload, IconMessage, IconPlus, IconRefresh, IconSend, IconUsers,
} from '@tabler/icons-react';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const DECISIONS = ['ACCEPT', 'ACCEPT_WITH_COMMENT', 'CHANGE_REQUIRED', 'REJECT'];
const LIFECYCLE = ['DRAFT', 'SUBMITTED_FOR_REVIEW', 'UNDER_REVIEW', 'CHANGE_REQUIRED', 'REVISED', 'REVIEW_COMPLETED', 'READY_FOR_RELEASE', 'RELEASED'];
const FLOW = ['Load EWP deliverables', 'Select deliverable', 'Upload document', 'Create revision', 'Submit for review', 'Assign reviewers', 'Record decisions', 'Manage comments', 'Respond or revise', 'Close comments', 'Review completed', 'Module 4'];
const surface = { borderColor: '#dfe7e2', boxShadow: '0 8px 26px rgba(21, 55, 39, 0.045)' };

async function request(path, options = {}) {
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(!isForm && options.body ? { 'Content-Type': 'application/json' } : {}),
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
    DRAFT: 'gray', SUBMITTED_FOR_REVIEW: 'blue', UNDER_REVIEW: 'violet',
    CHANGE_REQUIRED: 'orange', REVISED: 'cyan', REVIEW_COMPLETED: 'green', READY_FOR_RELEASE: 'teal', RELEASED: 'green', REJECTED: 'red',
    COMPLETED: 'green', PENDING: 'gray', OPEN: 'orange', CLOSED: 'green',
    ACCEPT: 'green', ACCEPT_WITH_COMMENT: 'teal', REJECT: 'red', NOT_SET: 'gray',
  }[normalized] || 'gray';
  return <Badge color={color} variant="light" radius="sm">{normalized.replaceAll('_', ' ')}</Badge>;
}

function Lifecycle({ value }) {
  const current = Math.max(0, LIFECYCLE.indexOf(value));
  return <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="xs">{LIFECYCLE.map((status, index) => <Group key={status} gap="xs" wrap="nowrap" p="xs" style={{ borderRadius: 8, background: index === current ? '#edf8f1' : '#f7f8f7', opacity: index > current ? 0.6 : 1 }}><ThemeIcon size={25} radius="xl" color={index <= current ? 'green' : 'gray'} variant={index === current ? 'filled' : 'light'}>{index < current ? <IconCheck size={13} /> : <Text size="10px" fw={800}>{index + 1}</Text>}</ThemeIcon><Text size="10px" fw={index === current ? 800 : 600}>{status.replaceAll('_', ' ')}</Text></Group>)}</SimpleGrid>;
}

function FlowBar({ completed }) {
  const count = completed.filter(Boolean).length;
  return <Paper withBorder radius="lg" p="md" style={surface}><Group justify="space-between" mb="sm"><Text size="sm" fw={750}>Document review flow</Text><Text size="xs" c="dimmed">{count} of {FLOW.length} stages complete</Text></Group><Progress color="green" value={(count / FLOW.length) * 100} size="sm" radius="xl" /><SimpleGrid cols={{ base: 2, sm: 4, lg: 6 }} mt="md" spacing="xs">{FLOW.map((label, index) => <Group key={label} gap={6} wrap="nowrap"><ThemeIcon size={21} radius="xl" color={completed[index] ? 'green' : 'gray'} variant={completed[index] ? 'filled' : 'light'}>{completed[index] ? <IconCheck size={11} /> : <Text size="9px" fw={800}>{index + 1}</Text>}</ThemeIcon><Text size="10px" c={completed[index] ? '#194d30' : 'dimmed'} fw={completed[index] ? 700 : 500}>{label}</Text></Group>)}</SimpleGrid></Paper>;
}

export default function DocumentsReviewsLayout() {
  const [deliverables, setDeliverables] = useState([]);
  const [ewpId, setEwpId] = useState('');
  const [deliverableId, setDeliverableId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [documentId, setDocumentId] = useState('');
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState('');
  const [activeReviewer, setActiveReviewer] = useState(null);
  const [activeComment, setActiveComment] = useState(null);
  const [documentForm, setDocumentForm] = useState({ code: '', title: '', revision: 'D01', note: '', file: null });
  const [revisionForm, setRevisionForm] = useState({ revision: 'D02', note: '', file: null });
  const [reviewerForm, setReviewerForm] = useState({ reviewer_name: '', reviewer_role: '' });
  const [decisionForm, setDecisionForm] = useState({ decision: 'ACCEPT', comment: '' });
  const [commentForm, setCommentForm] = useState({ text: '', raised_by: '', markup_reference: '' });
  const [responseForm, setResponseForm] = useState({ response: '', responded_by: '', close: true });

  const ewps = useMemo(() => {
    const unique = new Map();
    deliverables.forEach(item => { if (item.ewp && !unique.has(item.ewp.id)) unique.set(item.ewp.id, item.ewp); });
    return [...unique.values()];
  }, [deliverables]);
  const ewpDeliverables = deliverables.filter(item => item.ewp?.id === ewpId);
  const deliverable = deliverables.find(item => item.id === deliverableId);
  const reviewers = document?.reviewers || [];
  const comments = document?.comments || [];
  const revisions = document?.revisions || [];
  const currentRevision = revisions.find(item => item.id === document?.current_revision_id) || revisions.at(-1);
  const reviewLocked = ['REVIEW_COMPLETED', 'READY_FOR_RELEASE', 'RELEASED'].includes(currentRevision?.status) || Boolean(currentRevision?.approval?.decision);
  const commentLocked = item => reviewLocked || revisions.some(revision => revision.id === item.revision_id && (['REVIEW_COMPLETED', 'READY_FOR_RELEASE', 'RELEASED'].includes(revision.status) || revision.approval?.decision));
  const allReviewersComplete = reviewers.length > 0 && reviewers.every(item => item.status === 'COMPLETED');
  const allCommentsClosed = comments.every(item => item.status === 'CLOSED');
  const blockingDecision = reviewers.some(item => ['CHANGE_REQUIRED', 'REJECT'].includes(item.decision));
  const canComplete = allReviewersComplete && allCommentsClosed && !blockingDecision;
  const stages = [
    deliverables.length > 0, Boolean(deliverableId), Boolean(document), revisions.length > 0,
    document && !['DRAFT', 'REVISED'].includes(document.status), reviewers.length > 0,
    reviewers.some(item => item.decision), comments.length > 0,
    revisions.length > 1 || comments.some(item => item.response), allCommentsClosed,
    document?.status === 'REVIEW_COMPLETED', document?.status === 'REVIEW_COMPLETED',
  ];

  const runAction = async (action, successTitle) => {
    setSaving(true); setError('');
    try {
      const result = await action();
      if (successTitle) notifications.show({ color: 'green', title: successTitle, message: document?.document_code || deliverable?.code || '' });
      return result;
    } catch (actionError) {
      setError(actionError.message);
      notifications.show({ color: 'red', title: 'Action failed', message: actionError.message });
      return null;
    } finally { setSaving(false); }
  };

  const loadDeliverables = async () => {
    setLoading(true); setError('');
    try {
      const data = await request('/ewp/documents-reviews/deliverables');
      setDeliverables(Array.isArray(data) ? data : []);
    } catch (loadError) { setDeliverables([]); setError(loadError.message); } finally { setLoading(false); }
  };

  const loadDocuments = async selectedDeliverableId => {
    if (!selectedDeliverableId) { setDocuments([]); setDocumentId(''); setDocument(null); return; }
    setLoading(true); setError('');
    try {
      const data = await request(`/ewp/documents-reviews/deliverables/${encodeURIComponent(selectedDeliverableId)}/documents`);
      setDocuments(Array.isArray(data) ? data : []);
      setDocumentId(''); setDocument(null);
    } catch (loadError) { setDocuments([]); setDocument(null); setError(loadError.message); } finally { setLoading(false); }
  };

  const loadDocument = async selectedDocumentId => {
    if (!selectedDocumentId) { setDocument(null); return; }
    setLoading(true); setError('');
    try { setDocument(await request(`/ewp/documents-reviews/documents/${encodeURIComponent(selectedDocumentId)}`)); }
    catch (loadError) { setDocument(null); setError(loadError.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadDeliverables(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectEwp = value => { setEwpId(value || ''); setDeliverableId(''); setDocuments([]); setDocumentId(''); setDocument(null); };
  const selectDeliverable = value => { const next = value || ''; setDeliverableId(next); loadDocuments(next); };
  const selectDocument = value => { const next = value || ''; setDocumentId(next); loadDocument(next); };

  const createDocument = async () => {
    const form = new FormData();
    form.append('document_code', documentForm.code.trim()); form.append('title', documentForm.title.trim());
    form.append('revision_no', documentForm.revision.trim()); form.append('revision_note', documentForm.note.trim());
    if (documentForm.file) form.append('file', documentForm.file);
    const created = await runAction(() => request(`/ewp/documents-reviews/deliverables/${encodeURIComponent(deliverableId)}/documents`, { method: 'POST', body: form }), 'Document created');
    if (created) { setDocuments(current => [...current, created]); setDocumentId(created.id); setDocument(created); setModal(''); }
  };

  const createRevision = async () => {
    const form = new FormData();
    form.append('revision_no', revisionForm.revision.trim()); form.append('revision_note', revisionForm.note.trim());
    if (revisionForm.file) form.append('file', revisionForm.file);
    const result = await runAction(() => request(`/ewp/documents-reviews/documents/${encodeURIComponent(document.id)}/revisions`, { method: 'POST', body: form }), 'Revision created');
    if (result) { setDocument(result); setModal(''); }
  };

  const submitForReview = async () => {
    const result = await runAction(() => request(`/ewp/documents-reviews/documents/${encodeURIComponent(document.id)}/submit`, { method: 'POST' }), 'Submitted for review');
    if (result) setDocument(result);
  };

  const assignReviewer = async () => {
    const assignment = await runAction(() => request(`/ewp/documents-reviews/documents/${encodeURIComponent(document.id)}/reviewers`, { method: 'POST', body: JSON.stringify(reviewerForm) }));
    if (assignment) { setDocument(current => ({ ...current, status: 'UNDER_REVIEW', reviewers: [...current.reviewers, assignment] })); setReviewerForm({ reviewer_name: '', reviewer_role: '' }); setModal(''); notifications.show({ color: 'green', title: 'Reviewer assigned', message: assignment.reviewer_name }); }
  };

  const openDecision = reviewer => { setActiveReviewer(reviewer); setDecisionForm({ decision: reviewer.decision || 'ACCEPT', comment: reviewer.decision_comment || '' }); setModal('decision'); };
  const saveDecision = async () => {
    const saved = await runAction(() => request(`/ewp/documents-reviews/reviewers/${encodeURIComponent(activeReviewer.id)}/decision`, { method: 'POST', body: JSON.stringify(decisionForm) }));
    if (saved) { setDocument(current => ({ ...current, status: ['CHANGE_REQUIRED', 'REJECT'].includes(saved.decision) ? 'CHANGE_REQUIRED' : 'UNDER_REVIEW', reviewers: current.reviewers.map(item => item.id === saved.id ? saved : item) })); setModal(''); notifications.show({ color: 'green', title: 'Review decision saved', message: saved.decision.replaceAll('_', ' ') }); }
  };

  const addComment = async () => {
    const saved = await runAction(() => request(`/ewp/documents-reviews/documents/${encodeURIComponent(document.id)}/comments`, { method: 'POST', body: JSON.stringify(commentForm) }));
    if (saved) { setDocument(current => ({ ...current, comments: [...current.comments, saved] })); setCommentForm({ text: '', raised_by: '', markup_reference: '' }); setModal(''); notifications.show({ color: 'green', title: 'Review comment added', message: saved.text }); }
  };

  const openResponse = comment => { setActiveComment(comment); setResponseForm({ response: comment.response || '', responded_by: '', close: comment.status === 'CLOSED' }); setModal('response'); };
  const saveResponse = async () => {
    const saved = await runAction(() => request(`/ewp/documents-reviews/comments/${encodeURIComponent(activeComment.id)}/response`, { method: 'PATCH', body: JSON.stringify(responseForm) }));
    if (saved) { setDocument(current => ({ ...current, comments: current.comments.map(item => item.id === saved.id ? saved : item) })); setModal(''); notifications.show({ color: 'green', title: 'Response saved', message: saved.status }); }
  };

  const closeAllComments = async () => {
    const result = await runAction(() => request(`/ewp/documents-reviews/documents/${encodeURIComponent(document.id)}/comments/close-all`, { method: 'POST' }));
    if (result) await loadDocument(document.id);
  };
  const completeReview = async () => {
    const result = await runAction(() => request(`/ewp/documents-reviews/documents/${encodeURIComponent(document.id)}/complete-review`, { method: 'POST' }), 'Document review completed');
    if (result) setDocument(result);
  };

  return (
    <Box p={{ base: 'md', md: 'xl' }} maw={1380} mx="auto">
      <Group justify="space-between" align="flex-start" mb="xl"><Box><Badge color="green" variant="light" mb="xs">Engineering Workbench</Badge><Title order={2}>Documents & Reviews</Title><Text size="sm" c="dimmed" mt={4}>Create controlled document revisions and complete traceable technical review.</Text></Box><ThemeIcon color="green" variant="light" size={46} radius="lg"><IconFileDescription size={23} /></ThemeIcon></Group>
      <Stack gap="lg">
        <FlowBar completed={stages} />
        {error && <Alert color="red" icon={<IconAlertTriangle size={18} />} withCloseButton onClose={() => setError('')}>{error}</Alert>}
        <Paper withBorder radius="lg" p="lg" style={surface}>
          <Group justify="space-between" mb="md"><Box><Text fw={800}>Review-ready deliverables</Text><Text size="xs" c="dimmed">Loaded from Module 2 where status is READY FOR REVIEW.</Text></Box><Button variant="subtle" color="green" leftSection={<IconRefresh size={15} />} loading={loading} onClick={loadDeliverables}>Refresh</Button></Group>
          <Grid align="flex-end"><Grid.Col span={{ base: 12, md: 4 }}><Select label="EWP" placeholder="Select EWP" data={ewps.map(item => ({ value: item.id, label: `${item.code} · ${item.name}` }))} value={ewpId || null} onChange={selectEwp} searchable clearable /></Grid.Col><Grid.Col span={{ base: 12, md: 4 }}><Select label="Deliverable" placeholder={!ewpId ? 'Select EWP first' : 'Select deliverable'} data={ewpDeliverables.map(item => ({ value: item.id, label: `${item.code} · ${item.name}` }))} value={deliverableId || null} onChange={selectDeliverable} searchable clearable disabled={!ewpId} /></Grid.Col><Grid.Col span={{ base: 12, md: 4 }}><Select label="Document" placeholder={!deliverableId ? 'Select deliverable first' : 'Select document'} data={documents.map(item => ({ value: item.id, label: `${item.document_code} · ${item.title} · ${item.current_revision_no}` }))} value={documentId || null} onChange={selectDocument} searchable clearable disabled={!deliverableId} /></Grid.Col></Grid>
          <Group justify="flex-end" mt="md"><Button color="green" leftSection={<IconFileUpload size={15} />} disabled={!deliverableId} onClick={() => { setDocumentForm({ code: '', title: deliverable?.name || '', revision: 'D01', note: '', file: null }); setModal('document'); }}>Prepare / Upload Document</Button></Group>
          {!loading && !deliverables.length && <Alert color="yellow" mt="md">No Module 2 deliverable is READY FOR REVIEW.</Alert>}
        </Paper>

        {document && <>
          <Paper withBorder radius="lg" p="lg" style={surface}>
            <Group justify="space-between" align="flex-start" wrap="wrap"><Box><Text size="xs" tt="uppercase" fw={750} c="dimmed">Controlled document</Text><Title order={3} mt={3}>{document.document_code}</Title><Text c="dimmed">{document.title}</Text></Box><Group><Badge variant="outline">Revision {document.current_revision_no}</Badge><StatusBadge value={document.status} /></Group></Group>
            <Divider my="lg" /><Lifecycle value={document.status} />
            {reviewLocked && <Alert color="green" mt="md">This revision is locked for review changes. Use Upload Revised Version to create the next revision.</Alert>}
            {revisions.length > 1 && <Paper withBorder radius="md" p="md" mt="md"><Text size="sm" fw={700} mb="sm">Revision history</Text><Stack gap="xs">{revisions.map(revision => <Group key={revision.id} justify="space-between"><Group><Text size="sm">{revision.revision_no}</Text><StatusBadge value={revision.status} /></Group>{revision.file_name && <Button component="a" variant="subtle" size="xs" href={`${API}/ewp/documents-reviews/documents/${encodeURIComponent(document.id)}/revisions/${encodeURIComponent(revision.id)}/file`} target="_blank" rel="noreferrer">Open {revision.file_name}</Button>}</Group>)}</Stack></Paper>}

            <Group justify="space-between" mt="lg" wrap="wrap"><Group gap="xl"><Box><Text size="xs" c="dimmed">Current file</Text><Text size="sm" fw={700}>{currentRevision?.file_name || 'Not uploaded'}</Text></Box><Box><Text size="xs" c="dimmed">Revisions</Text><Text size="sm" fw={700}>{revisions.length}</Text></Box><Box><Text size="xs" c="dimmed">Open comments</Text><Text size="sm" fw={700}>{comments.filter(item => item.status === 'OPEN').length}</Text></Box></Group><Group>{currentRevision?.file_name && <Button component="a" href={`${API}/ewp/documents-reviews/documents/${encodeURIComponent(document.id)}/revisions/${encodeURIComponent(currentRevision.id)}/file`} target="_blank" rel="noreferrer" variant="light" leftSection={<IconFileDescription size={15} />}>Open Document</Button>}{['DRAFT', 'REVISED'].includes(document.status) && <Button color="blue" leftSection={<IconSend size={15} />} loading={saving} onClick={submitForReview}>Submit for Review</Button>}<Button variant="default" leftSection={<IconFileUpload size={15} />} disabled={saving} onClick={() => { const next = Number(document.current_revision_no.replace(/\D/g, '') || 1) + 1; setRevisionForm({ revision: `D${String(next).padStart(2, '0')}`, note: '', file: null }); setModal('revision'); }}>Upload Revised Version</Button></Group></Group>
          </Paper>

          <Grid align="stretch">
            <Grid.Col span={{ base: 12, lg: 5 }}><Paper withBorder radius="lg" p="lg" style={{ ...surface, height: '100%' }}><Group justify="space-between" mb="md"><Group gap="xs"><IconUsers size={19} color="#176c3a" /><Text fw={800}>Reviewers</Text></Group><Button size="xs" color="green" variant="light" leftSection={<IconPlus size={13} />} disabled={!['SUBMITTED_FOR_REVIEW', 'UNDER_REVIEW'].includes(document.status)} onClick={() => setModal('reviewer')}>Assign</Button></Group><Stack gap="xs">{reviewers.map(item => <Paper key={item.id} withBorder p="sm" radius="md"><Group justify="space-between" align="flex-start"><Box><Text size="sm" fw={700}>{item.reviewer_role}</Text><Text size="xs" c="dimmed">{item.reviewer_name}</Text>{item.decision && <Box mt={5}><StatusBadge value={item.decision} /></Box>}</Box><Stack gap={5} align="flex-end"><StatusBadge value={item.status} /><Button size="compact-xs" variant="subtle" color="green" disabled={reviewLocked || saving} onClick={() => openDecision(item)}>{item.status === 'COMPLETED' ? 'View / Update' : 'Open Review'}</Button></Stack></Group></Paper>)}{!reviewers.length && <Alert color="blue">Submit the document and assign at least one reviewer.</Alert>}</Stack></Paper></Grid.Col>
            <Grid.Col span={{ base: 12, lg: 7 }}><Paper withBorder radius="lg" style={{ ...surface, height: '100%' }}><Group justify="space-between" p="lg"><Group gap="xs"><IconMessage size={19} color="#176c3a" /><Box><Text fw={800}>Review Comments</Text><Text size="xs" c="dimmed">Comments, markup references, and engineer responses.</Text></Box></Group><Group><Button size="xs" variant="default" disabled={reviewLocked || saving || !comments.some(item => item.status === 'OPEN' && item.response && !commentLocked(item))} onClick={closeAllComments}>Close responded</Button><Button size="xs" color="green" variant="light" leftSection={<IconPlus size={13} />} disabled={reviewLocked || saving} onClick={() => setModal('comment')}>Add Comment</Button></Group></Group><Divider /><ScrollArea type="auto"><Table verticalSpacing="sm" miw={650}><Table.Thead bg="#f7faf8"><Table.Tr><Table.Th>Comment</Table.Th><Table.Th>Response</Table.Th><Table.Th>Revision</Table.Th><Table.Th>Status</Table.Th><Table.Th></Table.Th></Table.Tr></Table.Thead><Table.Tbody>{comments.map(item => <Table.Tr key={item.id}><Table.Td><Text size="sm" fw={650}>{item.text}</Text><Text size="xs" c="dimmed">{item.raised_by}{item.markup_reference ? ` · ${item.markup_reference}` : ''}</Text></Table.Td><Table.Td><Text size="xs" lineClamp={2}>{item.response || 'Awaiting response'}</Text></Table.Td><Table.Td><Text size="xs" ff="monospace">{revisions.find(revision => revision.id === item.revision_id)?.revision_no || '—'}</Text></Table.Td><Table.Td><StatusBadge value={item.status} /></Table.Td><Table.Td><Button size="xs" variant="subtle" color="green" disabled={commentLocked(item) || saving} onClick={() => openResponse(item)}>Respond</Button></Table.Td></Table.Tr>)}</Table.Tbody></Table></ScrollArea>{!comments.length && <Box ta="center" p="xl"><Text size="sm" c="dimmed">No review comments recorded.</Text></Box>}</Paper></Grid.Col>
          </Grid>

          <Paper withBorder radius="lg" p="lg" style={surface}><Group justify="space-between" align="center" wrap="wrap"><Box><Text fw={800}>Complete Document Review</Text><Text size="xs" c="dimmed">All current-revision reviewers must finish, blocking decisions must be resolved, and every comment must be closed.</Text></Box><Group><Badge color={allReviewersComplete ? 'green' : 'orange'} variant="light">Reviewers {allReviewersComplete ? 'complete' : 'pending'}</Badge><Badge color={allCommentsClosed ? 'green' : 'orange'} variant="light">Comments {allCommentsClosed ? 'closed' : 'open'}</Badge><Button color="green" leftSection={<IconCircleCheck size={16} />} loading={saving} disabled={!canComplete || reviewLocked} onClick={completeReview}>Mark REVIEW COMPLETED</Button></Group></Group></Paper>
          {document.status === 'REVIEW_COMPLETED' && <Alert color="green" icon={<IconArrowRight size={18} />} title="Ready for Module 4 — Approval & Release">The reviewed document revision is now available for controlled approval and release.</Alert>}
        </>}
      </Stack>

      <Modal opened={modal === 'document'} onClose={() => setModal('')} title={<Text fw={800}>Prepare / Upload Document</Text>} size="lg" centered><Stack><Grid><Grid.Col span={5}><TextInput label="Document code" required value={documentForm.code} onChange={event => { const value = event.currentTarget.value; setDocumentForm(form => ({ ...form, code: value })); }} /></Grid.Col><Grid.Col span={7}><TextInput label="Document title" required value={documentForm.title} onChange={event => { const value = event.currentTarget.value; setDocumentForm(form => ({ ...form, title: value })); }} /></Grid.Col></Grid><TextInput label="Initial revision" required value={documentForm.revision} onChange={event => { const value = event.currentTarget.value; setDocumentForm(form => ({ ...form, revision: value })); }} /><Textarea label="Revision note" value={documentForm.note} onChange={event => { const value = event.currentTarget.value; setDocumentForm(form => ({ ...form, note: value })); }} /><FileInput label="Document file" required leftSection={<IconFileUpload size={15} />} value={documentForm.file} onChange={file => setDocumentForm(form => ({ ...form, file }))} /><Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setModal('')}>Cancel</Button><Button color="green" loading={saving} disabled={!documentForm.code.trim() || !documentForm.title.trim() || !documentForm.revision.trim() || !documentForm.file} onClick={createDocument}>Create Document</Button></Group></Stack></Modal>
      <Modal opened={modal === 'revision'} onClose={() => setModal('')} title={<Text fw={800}>Create Document Revision</Text>} size="lg" centered><Stack><TextInput label="Revision" required value={revisionForm.revision} onChange={event => { const value = event.currentTarget.value; setRevisionForm(form => ({ ...form, revision: value })); }} /><Textarea label="Revision note" minRows={3} value={revisionForm.note} onChange={event => { const value = event.currentTarget.value; setRevisionForm(form => ({ ...form, note: value })); }} /><FileInput label="Revised document" required leftSection={<IconFileUpload size={15} />} value={revisionForm.file} onChange={file => setRevisionForm(form => ({ ...form, file }))} /><Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setModal('')}>Cancel</Button><Button color="green" loading={saving} disabled={!revisionForm.revision.trim() || !revisionForm.file} onClick={createRevision}>Create Revision</Button></Group></Stack></Modal>
      <Modal opened={modal === 'reviewer'} onClose={() => setModal('')} title={<Text fw={800}>Assign Reviewer</Text>} centered><Stack><TextInput label="Reviewer role" required value={reviewerForm.reviewer_role} onChange={event => { const value = event.currentTarget.value; setReviewerForm(form => ({ ...form, reviewer_role: value })); }} /><TextInput label="Reviewer name" required value={reviewerForm.reviewer_name} onChange={event => { const value = event.currentTarget.value; setReviewerForm(form => ({ ...form, reviewer_name: value })); }} /><Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setModal('')}>Cancel</Button><Button color="green" loading={saving} disabled={!reviewerForm.reviewer_role.trim() || !reviewerForm.reviewer_name.trim()} onClick={assignReviewer}>Assign</Button></Group></Stack></Modal>
      <Modal opened={modal === 'decision'} onClose={() => setModal('')} title={<Text fw={800}>Reviewer Decision</Text>} size="lg" centered><Stack><Alert color="blue">{activeReviewer?.reviewer_role} · {activeReviewer?.reviewer_name}</Alert><Select label="Decision" data={DECISIONS.map(value => ({ value, label: value.replaceAll('_', ' ') }))} value={decisionForm.decision} onChange={value => setDecisionForm(form => ({ ...form, decision: value || 'ACCEPT' }))} /><Textarea label="Reviewer comment" minRows={4} value={decisionForm.comment} onChange={event => { const value = event.currentTarget.value; setDecisionForm(form => ({ ...form, comment: value })); }} /><Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setModal('')}>Cancel</Button><Button color="green" loading={saving} disabled={decisionForm.decision !== 'ACCEPT' && !decisionForm.comment.trim()} onClick={saveDecision}>Save Decision</Button></Group></Stack></Modal>
      <Modal opened={modal === 'comment'} onClose={() => setModal('')} title={<Text fw={800}>Add Review Comment</Text>} size="lg" centered><Stack><Textarea label="Comment" required minRows={4} value={commentForm.text} onChange={event => { const value = event.currentTarget.value; setCommentForm(form => ({ ...form, text: value })); }} /><Grid><Grid.Col span={6}><TextInput label="Raised by" required value={commentForm.raised_by} onChange={event => { const value = event.currentTarget.value; setCommentForm(form => ({ ...form, raised_by: value })); }} /></Grid.Col><Grid.Col span={6}><TextInput label="Markup reference" value={commentForm.markup_reference} onChange={event => { const value = event.currentTarget.value; setCommentForm(form => ({ ...form, markup_reference: value })); }} /></Grid.Col></Grid><Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setModal('')}>Cancel</Button><Button color="green" loading={saving} disabled={!commentForm.text.trim() || !commentForm.raised_by.trim()} onClick={addComment}>Add Comment</Button></Group></Stack></Modal>
      <Modal opened={modal === 'response'} onClose={() => setModal('')} title={<Text fw={800}>Engineer Response</Text>} size="lg" centered><Stack><Alert color="blue">{activeComment?.text}</Alert><Textarea label="Response" required minRows={4} value={responseForm.response} onChange={event => { const value = event.currentTarget.value; setResponseForm(form => ({ ...form, response: value })); }} /><TextInput label="Responded by" value={responseForm.responded_by} onChange={event => { const value = event.currentTarget.value; setResponseForm(form => ({ ...form, responded_by: value })); }} /><Checkbox label="Close this comment" checked={responseForm.close} onChange={event => { const checked = event.currentTarget.checked; setResponseForm(form => ({ ...form, close: checked })); }} /><Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setModal('')}>Cancel</Button><Button color="green" loading={saving} disabled={!responseForm.response.trim()} onClick={saveResponse}>Save Response</Button></Group></Stack></Modal>
    </Box>
  );
}
