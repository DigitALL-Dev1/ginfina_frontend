import styles from './DocumentsReviewsLayout.module.css';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Badge, Box, Button, Checkbox, Divider, FileInput, Grid, Group, Modal,
  Paper, Loader, SegmentedControl, Select, Stack, Tabs, Text, Textarea,
  TextInput, ThemeIcon, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle, IconArrowRight, IconCheck, IconCircleCheck, IconFileDescription,
  IconFileUpload, IconMessage, IconPlus, IconRefresh, IconSend, IconUsers, IconSearch, IconHistory, IconLock,
} from '@tabler/icons-react';

const API = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const DECISIONS = ['ACCEPT', 'ACCEPT_WITH_COMMENT', 'CHANGE_REQUIRED', 'REJECT'];
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
  if (!response.ok) throw new Error(Array.isArray(body.detail) ? body.detail.map(item => item.msg).join('; ') : body.detail || `Request failed (HTTP ${response.status})`);
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

function EmptyState({ title, children }) {
  return <Box className={styles.empty}><ThemeIcon size={56} radius="xl" variant="light" color="green" mb="md"><IconFileDescription size={26} /></ThemeIcon><Text fw={700}>{title}</Text><Text size="sm" c="dimmed" mt={6} maw={400} mx="auto">{children}</Text></Box>;
}

function ReviewProgress({ status }) {
  const current = ['REVIEW_COMPLETED', 'READY_FOR_RELEASE', 'RELEASED'].includes(status) ? 3 : ['CHANGE_REQUIRED', 'REJECTED'].includes(status) ? 2 : ['SUBMITTED_FOR_REVIEW', 'UNDER_REVIEW'].includes(status) ? 1 : 0;
  return <Box className={styles.workflow}>{['Prepare document', 'Technical review', 'Resolve feedback', 'Review complete'].map((label, index) => <Box key={label} className={styles.phase} data-current={current === index} data-complete={current > index}><Group gap={5} wrap="nowrap">{current > index ? <IconCheck size={13} /> : <span>{index + 1}.</span>}{label}</Group></Box>)}</Box>;
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
  const [tab, setTab] = useState('review');
  const [search, setSearch] = useState('');
  const [commentFilter, setCommentFilter] = useState('ALL');
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
  const openComments = comments.filter(item => item.status !== 'CLOSED').length;
  const completedReviewers = reviewers.filter(item => item.status === 'COMPLETED').length;
  const visibleComments = comments.filter(item => commentFilter === 'ALL' || item.status === commentFilter);
  const visibleDocuments = documents.filter(item => `${item.document_code} ${item.title}`.toLowerCase().includes(search.toLowerCase()));
  const prepareDocument = () => { setDocumentForm({ code: '', title: deliverable?.name || '', revision: 'D01', note: '', file: null }); setModal('document'); };
  const prepareRevision = () => {
    const next = Number(document.current_revision_no.replace(/\D/g, '') || 1) + 1;
    setRevisionForm({ revision: `D${String(next).padStart(2, '0')}`, note: '', file: null }); setModal('revision');
  };
  const fileUrl = revision => `${API}/ewp/documents-reviews/documents/${encodeURIComponent(document.id)}/revisions/${encodeURIComponent(revision.id)}/file`;

  useEffect(() => {
    if (document) setDocuments(current => current.map(item => item.id === document.id ? { ...item, document_code: document.document_code, title: document.title, status: document.status, current_revision_no: document.current_revision_no } : item));
  }, [document]);

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

  const selectEwp = value => { setSearch(''); setTab('review'); setEwpId(value || ''); setDeliverableId(''); setDocuments([]); setDocumentId(''); setDocument(null); };
  const selectDeliverable = value => { setSearch(''); setTab('review'); setDocument(null); setDocumentId(''); setDocuments([]); const next = value || ''; setDeliverableId(next); loadDocuments(next); };
  const selectDocument = value => { setDocument(null); setTab('review'); setCommentFilter('ALL'); const next = value || ''; setDocumentId(next); loadDocument(next); };

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
    <Box className={styles.page} p={{ base: 'md', md: 'xl' }} maw={1480} mx="auto">
      <Group justify="space-between" align="flex-start" mb="xl">
        <Box><Text className={styles.eyebrow} mb={8}>Engineering workbench / Technical review</Text><Title order={2}>Documents &amp; Reviews</Title><Text size="sm" c="dimmed" mt={6}>Create controlled document revisions and complete traceable technical review.</Text></Box>
        <Button variant="default" leftSection={<IconRefresh size={16} />} loading={loading} disabled={saving} onClick={() => documentId ? loadDocument(documentId) : deliverableId ? loadDocuments(deliverableId) : loadDeliverables()}>Refresh</Button>
      </Group>
      <Stack gap="lg">
        {error && <Alert color="red" icon={<IconAlertTriangle size={18} />} withCloseButton onClose={() => setError('')}>{error}</Alert>}
        <Box className={styles.context}>
          <Group justify="space-between" mb="md"><Box><Text fw={700}>Choose your review context</Text><Text size="xs" c="dimmed" mt={3}>Start with an EWP and a deliverable ready for technical review.</Text></Box><Badge color="green" variant="light">{ewpDeliverables.length} deliverables</Badge></Group>
          <Grid align="flex-end">
            <Grid.Col span={{ base: 12, sm: 5 }}><Select label="EWP" placeholder="Select an engineering work package" data={ewps.map(item => ({ value: item.id, label: `${item.code} / ${item.name}` }))} value={ewpId || null} onChange={selectEwp} searchable clearable disabled={loading || saving} /></Grid.Col>
            <Grid.Col span={{ base: 12, sm: 5 }}><Select label="Deliverable" placeholder={!ewpId ? 'Select EWP first' : 'Select a review-ready deliverable'} data={ewpDeliverables.map(item => ({ value: item.id, label: `${item.code} / ${item.name}` }))} value={deliverableId || null} onChange={selectDeliverable} searchable clearable disabled={!ewpId || loading || saving} /></Grid.Col>
            <Grid.Col span={{ base: 12, sm: 2 }}><Button fullWidth color="green" leftSection={<IconPlus size={16} />} disabled={!deliverableId || loading || saving} onClick={prepareDocument}>Document</Button></Grid.Col>
          </Grid>
          {deliverable && <Text size="xs" c="dimmed" mt="md">{deliverable.discipline || 'Engineering'} &middot; Responsible engineer: {deliverable.responsible_engineer || 'Not assigned'}</Text>}
          {!loading && !deliverables.length && <Alert color="blue" mt="md">No deliverables are ready yet. Mark a deliverable ready for review in Inputs &amp; Deliverables to begin.</Alert>}
        </Box>

        <Box className={styles.workspace}>
          <Box className={styles.rail}>
            <Box className={styles.railHeader}><Group justify="space-between" mb="md"><Text fw={750}>Documents</Text><Badge color="gray" variant="light">{documents.length}</Badge></Group><TextInput aria-label="Search documents" placeholder="Search code or title" leftSection={<IconSearch size={15} />} value={search} onChange={event => setSearch(event.currentTarget.value)} disabled={!deliverableId} /></Box>
            <Box className={styles.documentList}>{visibleDocuments.map(item => <button type="button" key={item.id} className={styles.documentButton} aria-pressed={documentId === item.id} disabled={saving || loading} onClick={() => selectDocument(item.id)}>
              <Group justify="space-between" gap="xs"><Text size="sm" fw={750}>{item.document_code}</Text><Text size="xs" c="dimmed">{item.current_revision_no}</Text></Group><div className={styles.documentTitle}>{item.title}</div><Box mt={10}><StatusBadge value={item.status} /></Box>
            </button>)}{!visibleDocuments.length && <Box p="lg"><Text size="sm" c="dimmed" ta="center">{!deliverableId ? 'Select a deliverable to see its documents.' : search ? 'No matching documents.' : loading ? 'Loading documents...' : 'No documents yet. Add the first document above.'}</Text></Box>}</Box>
          </Box>
          <Stack gap="lg" className={styles.main}>
            {loading && <Group justify="center" p="xl" role="status"><Loader size="sm" color="green" /><Text size="sm" c="dimmed">Loading review workspace...</Text></Group>}
            {!document && !loading && <EmptyState title={deliverableId ? 'Your document workspace' : 'Start a document review'}>{deliverableId ? 'Select a document from the list to review its current revision, comments, and history. You can also upload a new document.' : 'Choose an EWP and deliverable above. All document revisions and review decisions will stay linked to that deliverable.'}</EmptyState>}
            {document && !loading && <>
              <Box className={styles.hero}>
                <Group justify="space-between" align="flex-start"><Group gap="sm"><ThemeIcon size={42} radius="md" variant="light" color="green"><IconFileDescription size={22} /></ThemeIcon><Box><Text className={styles.eyebrow}>Controlled document</Text><Text fw={750} size="sm" mt={3}>{document.document_code}</Text></Box></Group><StatusBadge value={document.status} /></Group>
                <Title order={3} mt="lg" className={styles.title}>{document.title}</Title><Text size="sm" c="dimmed" mt={4}>{deliverable?.code} &middot; Current revision {document.current_revision_no}</Text>
                <Box className={styles.metrics}>
                  <Box className={styles.metric}><Text size="xs" c="dimmed">Revision</Text><Text size="lg" fw={750}>{document.current_revision_no}</Text></Box>
                  <Box className={styles.metric}><Text size="xs" c="dimmed">Reviewer decisions</Text><Text size="lg" fw={750}>{completedReviewers}<Text span size="sm" c="dimmed"> / {reviewers.length}</Text></Text></Box>
                  <Box className={styles.metric}><Text size="xs" c="dimmed">Open comments</Text><Text size="lg" fw={750} c={openComments ? 'orange.8' : 'green.8'}>{openComments}</Text></Box>
                </Box>
                <ReviewProgress status={document.status} />
                <Divider my="lg" />
                <Group justify="space-between" align="center"><Box style={{ minWidth: 0 }}><Text size="xs" c="dimmed">Current file</Text><Text size="sm" fw={600} className={styles.title}>{currentRevision?.file_name || 'No file uploaded'}</Text></Box><Group gap="xs">
                  {currentRevision?.file_name && <Button component="a" href={fileUrl(currentRevision)} target="_blank" rel="noreferrer" variant="default" size="sm" leftSection={<IconFileDescription size={15} />}>Open Document</Button>}
                  {['DRAFT', 'REVISED'].includes(document.status) && <Button color="green" leftSection={<IconSend size={15} />} loading={saving} onClick={submitForReview}>Submit for Review</Button>}
                  <Button variant="light" color="green" leftSection={<IconFileUpload size={15} />} disabled={saving} onClick={prepareRevision}>New revision</Button>
                </Group></Group>
              </Box>
              {reviewLocked && <Alert color="green" icon={<IconLock size={17} />} title="Review record locked">This revision is protected. Create a new revision to make engineering changes.</Alert>}

              <Tabs value={tab} onChange={setTab} color="green" keepMounted={false}>
                <Tabs.List mb="lg"><Tabs.Tab value="review" leftSection={<IconUsers size={16} />}>Review</Tabs.Tab><Tabs.Tab value="comments" leftSection={<IconMessage size={16} />} rightSection={<Badge size="xs" color={openComments ? 'orange' : 'gray'}>{comments.length}</Badge>}>Comments</Tabs.Tab><Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>Revisions ({revisions.length})</Tabs.Tab></Tabs.List>
                <Tabs.Panel value="review"><Box className={styles.panel}>
                  <Group justify="space-between" mb="lg"><Box><Title order={4}>Technical reviewers</Title><Text size="sm" c="dimmed" mt={4}>Decisions for {document.current_revision_no}</Text></Box><Button size="sm" color="green" variant="light" leftSection={<IconPlus size={14} />} disabled={reviewLocked || saving || !['SUBMITTED_FOR_REVIEW', 'UNDER_REVIEW'].includes(document.status)} onClick={() => setModal('reviewer')}>Assign reviewer</Button></Group>
                  <Stack gap="md">{reviewers.map(item => <Box key={item.id} className={styles.reviewer}><Group justify="space-between" align="flex-start"><Group align="flex-start" gap="sm"><ThemeIcon size={36} radius="xl" color={item.status === 'COMPLETED' ? 'green' : 'gray'} variant="light"><Text size="sm" fw={750}>{item.reviewer_name?.charAt(0)?.toUpperCase() || 'R'}</Text></ThemeIcon><Box><Text size="sm" fw={700}>{item.reviewer_name}</Text><Text size="xs" c="dimmed">{item.reviewer_role}</Text></Box></Group><StatusBadge value={item.decision || item.status} /></Group>
                    {item.decision_comment && <Text size="sm" mt="md" style={{ whiteSpace: 'pre-wrap' }}>{item.decision_comment}</Text>}
                    {!reviewLocked && <Group justify="flex-end" mt="sm"><Button size="xs" variant="subtle" color="green" disabled={saving} onClick={() => openDecision(item)}>{item.status === 'COMPLETED' ? 'Update decision' : 'Record decision'}</Button></Group>}
                  </Box>)}{!reviewers.length && <EmptyState title="No reviewers assigned">{['DRAFT', 'REVISED'].includes(document.status) ? 'Submit this revision for review, then assign the technical reviewers.' : 'Assign a reviewer to record an accountable technical decision for this revision.'}</EmptyState>}</Stack>
                </Box></Tabs.Panel>
                <Tabs.Panel value="comments"><Box className={styles.panel}>
                  <Group justify="space-between" align="flex-start" mb="lg"><Box><Title order={4}>Review comments</Title><Text size="sm" c="dimmed" mt={4}>Feedback, markup references, and engineer responses.</Text></Box><Button size="sm" color="green" variant="light" leftSection={<IconPlus size={14} />} disabled={reviewLocked || saving} onClick={() => setModal('comment')}>Add Comment</Button></Group>
                  <Group justify="space-between" mb="lg"><SegmentedControl aria-label="Filter comments" size="xs" value={commentFilter} onChange={setCommentFilter} data={[{ value: 'ALL', label: `All (${comments.length})` }, { value: 'OPEN', label: `Open (${openComments})` }, { value: 'CLOSED', label: `Closed (${comments.length - openComments})` }]} /><Button size="xs" variant="subtle" color="green" disabled={reviewLocked || saving || !comments.some(item => item.status === 'OPEN' && item.response && !commentLocked(item))} onClick={closeAllComments}>Close responded</Button></Group>
                  <Stack>{visibleComments.map(item => <Box key={item.id} className={styles.comment} data-closed={item.status === 'CLOSED'}>
                    <Group justify="space-between" mb="sm"><Text size="xs" fw={650} c="dimmed">COMMENT {comments.indexOf(item) + 1} &middot; {revisions.find(revision => revision.id === item.revision_id)?.revision_no || 'Revision not recorded'}</Text><StatusBadge value={item.status} /></Group>
                    <Text size="sm" fw={600} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.text}</Text><Text size="xs" c="dimmed" mt={6}>{item.raised_by}{item.markup_reference ? ` / ${item.markup_reference}` : ''}</Text>
                    {item.response ? <Box className={styles.response}><Text size="xs" fw={700} c="green.8" mb={4}>ENGINEER RESPONSE{item.responded_by ? ` / ${item.responded_by}` : ''}</Text><Text size="sm" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.response}</Text></Box> : <Text size="xs" c="orange.8" mt="md">Awaiting engineer response</Text>}
                    <Group justify="flex-end" mt="sm">{commentLocked(item) ? <Group gap={4}><IconLock size={12} /><Text size="xs" c="dimmed">Locked revision</Text></Group> : <Button size="xs" variant="light" color="green" disabled={saving} onClick={() => openResponse(item)}>{item.response ? 'Update response' : 'Respond'}</Button>}</Group>
                  </Box>)}{!visibleComments.length && <EmptyState title={comments.length ? 'No comments in this view' : 'No review comments yet'}>{comments.length ? 'Choose a different filter to see the other comments.' : 'Add feedback and drawing references here. Engineer responses remain linked to the original revision.'}</EmptyState>}</Stack>
                </Box></Tabs.Panel>
                <Tabs.Panel value="history"><Box className={styles.panel}><Group justify="space-between" mb="sm"><Box><Title order={4}>Revision history</Title><Text size="sm" c="dimmed" mt={4}>Every version, with its original file and review status.</Text></Box><Badge variant="light" color="gray">{revisions.length} versions</Badge></Group>
                  {[...revisions].reverse().map(revision => <Box key={revision.id} className={styles.revision}><ThemeIcon size={44} radius="md" color={revision.id === document.current_revision_id ? 'green' : 'gray'} variant="light"><IconFileDescription size={22} /></ThemeIcon><Box><Group gap="xs"><Text fw={750} size="sm">{revision.revision_no}</Text>{revision.id === document.current_revision_id && <Badge color="green" size="xs">Current</Badge>}</Group><Box my={8}><StatusBadge value={revision.status} /></Box><Text size="sm" className={styles.title}>{revision.file_name || 'No file uploaded'}</Text>{revision.revision_note && <Text size="sm" c="dimmed" mt={6}>{revision.revision_note}</Text>}{revision.created_at && <Text size="xs" c="dimmed" mt={6}>{new Date(revision.created_at).toLocaleString()}</Text>}</Box>{revision.file_name && <Button component="a" variant="subtle" color="green" size="xs" href={fileUrl(revision)} target="_blank" rel="noreferrer">Open file</Button>}</Box>)}
                </Box></Tabs.Panel>
              </Tabs>

              <Box className={styles.completion}>
                <Group justify="space-between" align="flex-start" gap="lg"><Box style={{ flex: 1, minWidth: 180 }}><Text fw={750}>{reviewLocked ? 'Technical review recorded' : 'Ready to complete review?'}</Text><Text size="sm" c="dimmed" mt={4}>{reviewLocked ? 'The review decisions and responses are retained with this revision.' : 'Resolve these requirements before sending this revision for approval.'}</Text>
                  {!reviewLocked && <Stack gap={7} mt="md">{[[allReviewersComplete, 'All assigned reviewers have finished'], [!blockingDecision, 'No change-required or rejected decisions'], [allCommentsClosed, 'All review comments are closed']].map(([done, label]) => <Group key={label} gap={7}><ThemeIcon size={18} radius="xl" variant="light" color={done ? 'green' : 'orange'}>{done ? <IconCheck size={12} /> : <IconAlertTriangle size={12} />}</ThemeIcon><Text size="xs">{label}</Text></Group>)}</Stack>}
                </Box>{reviewLocked ? <Button component="a" href="/ginfina/ewp/approval-release" color="green" variant="light" rightSection={<IconArrowRight size={16} />}>Approval &amp; Release</Button> : <Button color="green" leftSection={<IconCircleCheck size={16} />} loading={saving} disabled={!canComplete} onClick={completeReview}>Complete Review</Button>}</Group>
              </Box>
            </>}
          </Stack>
        </Box>
      </Stack>

      <Modal opened={modal === 'document'} onClose={() => { if (!saving) setModal(''); }} closeOnClickOutside={!saving} closeOnEscape={!saving} withCloseButton={!saving} title={<Text fw={800}>Prepare / Upload Document</Text>} size="lg" centered><Stack><Grid><Grid.Col span={5}><TextInput label="Document code" required value={documentForm.code} onChange={event => { const value = event.currentTarget.value; setDocumentForm(form => ({ ...form, code: value })); }} /></Grid.Col><Grid.Col span={7}><TextInput label="Document title" required value={documentForm.title} onChange={event => { const value = event.currentTarget.value; setDocumentForm(form => ({ ...form, title: value })); }} /></Grid.Col></Grid><TextInput label="Initial revision" required value={documentForm.revision} onChange={event => { const value = event.currentTarget.value; setDocumentForm(form => ({ ...form, revision: value })); }} /><Textarea label="Revision note" value={documentForm.note} onChange={event => { const value = event.currentTarget.value; setDocumentForm(form => ({ ...form, note: value })); }} /><FileInput label="Document file" required leftSection={<IconFileUpload size={15} />} value={documentForm.file} onChange={file => setDocumentForm(form => ({ ...form, file }))} /><Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setModal('')}>Cancel</Button><Button color="green" loading={saving} disabled={!documentForm.code.trim() || !documentForm.title.trim() || !documentForm.revision.trim() || !documentForm.file} onClick={createDocument}>Create Document</Button></Group></Stack></Modal>
      <Modal opened={modal === 'revision'} onClose={() => { if (!saving) setModal(''); }} closeOnClickOutside={!saving} closeOnEscape={!saving} withCloseButton={!saving} title={<Text fw={800}>Create Document Revision</Text>} size="lg" centered><Stack><TextInput label="Revision" required value={revisionForm.revision} onChange={event => { const value = event.currentTarget.value; setRevisionForm(form => ({ ...form, revision: value })); }} /><Textarea label="Revision note" minRows={3} value={revisionForm.note} onChange={event => { const value = event.currentTarget.value; setRevisionForm(form => ({ ...form, note: value })); }} /><FileInput label="Revised document" required leftSection={<IconFileUpload size={15} />} value={revisionForm.file} onChange={file => setRevisionForm(form => ({ ...form, file }))} /><Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setModal('')}>Cancel</Button><Button color="green" loading={saving} disabled={!revisionForm.revision.trim() || !revisionForm.file} onClick={createRevision}>Create Revision</Button></Group></Stack></Modal>
      <Modal opened={modal === 'reviewer'} onClose={() => { if (!saving) setModal(''); }} closeOnClickOutside={!saving} closeOnEscape={!saving} withCloseButton={!saving} title={<Text fw={800}>Assign Reviewer</Text>} centered><Stack><TextInput label="Reviewer role" required value={reviewerForm.reviewer_role} onChange={event => { const value = event.currentTarget.value; setReviewerForm(form => ({ ...form, reviewer_role: value })); }} /><TextInput label="Reviewer name" required value={reviewerForm.reviewer_name} onChange={event => { const value = event.currentTarget.value; setReviewerForm(form => ({ ...form, reviewer_name: value })); }} /><Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setModal('')}>Cancel</Button><Button color="green" loading={saving} disabled={!reviewerForm.reviewer_role.trim() || !reviewerForm.reviewer_name.trim()} onClick={assignReviewer}>Assign</Button></Group></Stack></Modal>
      <Modal opened={modal === 'decision'} onClose={() => { if (!saving) setModal(''); }} closeOnClickOutside={!saving} closeOnEscape={!saving} withCloseButton={!saving} title={<Text fw={800}>Reviewer Decision</Text>} size="lg" centered><Stack><Alert color="blue">{activeReviewer?.reviewer_role} · {activeReviewer?.reviewer_name}</Alert><Select label="Decision" data={DECISIONS.map(value => ({ value, label: value.replaceAll('_', ' ') }))} value={decisionForm.decision} onChange={value => setDecisionForm(form => ({ ...form, decision: value || 'ACCEPT' }))} /><Textarea label="Reviewer comment" minRows={4} value={decisionForm.comment} onChange={event => { const value = event.currentTarget.value; setDecisionForm(form => ({ ...form, comment: value })); }} /><Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setModal('')}>Cancel</Button><Button color="green" loading={saving} disabled={decisionForm.decision !== 'ACCEPT' && !decisionForm.comment.trim()} onClick={saveDecision}>Save Decision</Button></Group></Stack></Modal>
      <Modal opened={modal === 'comment'} onClose={() => { if (!saving) setModal(''); }} closeOnClickOutside={!saving} closeOnEscape={!saving} withCloseButton={!saving} title={<Text fw={800}>Add Review Comment</Text>} size="lg" centered><Stack><Textarea label="Comment" required minRows={4} value={commentForm.text} onChange={event => { const value = event.currentTarget.value; setCommentForm(form => ({ ...form, text: value })); }} /><Grid><Grid.Col span={6}><TextInput label="Raised by" required value={commentForm.raised_by} onChange={event => { const value = event.currentTarget.value; setCommentForm(form => ({ ...form, raised_by: value })); }} /></Grid.Col><Grid.Col span={6}><TextInput label="Markup reference" value={commentForm.markup_reference} onChange={event => { const value = event.currentTarget.value; setCommentForm(form => ({ ...form, markup_reference: value })); }} /></Grid.Col></Grid><Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setModal('')}>Cancel</Button><Button color="green" loading={saving} disabled={!commentForm.text.trim() || !commentForm.raised_by.trim()} onClick={addComment}>Add Comment</Button></Group></Stack></Modal>
      <Modal opened={modal === 'response'} onClose={() => { if (!saving) setModal(''); }} closeOnClickOutside={!saving} closeOnEscape={!saving} withCloseButton={!saving} title={<Text fw={800}>Engineer Response</Text>} size="lg" centered><Stack><Alert color="blue">{activeComment?.text}</Alert><Textarea label="Response" required minRows={4} value={responseForm.response} onChange={event => { const value = event.currentTarget.value; setResponseForm(form => ({ ...form, response: value })); }} /><TextInput label="Responded by" value={responseForm.responded_by} onChange={event => { const value = event.currentTarget.value; setResponseForm(form => ({ ...form, responded_by: value })); }} /><Checkbox label="Close this comment" checked={responseForm.close} onChange={event => { const checked = event.currentTarget.checked; setResponseForm(form => ({ ...form, close: checked })); }} /><Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setModal('')}>Cancel</Button><Button color="green" loading={saving} disabled={!responseForm.response.trim()} onClick={saveResponse}>Save Response</Button></Group></Stack></Modal>
    </Box>
  );
}
