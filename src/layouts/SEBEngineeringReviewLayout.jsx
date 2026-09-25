import { useEffect, useState } from 'react';
import { Alert, Badge, Box, Button, Group, Loader, Paper, Progress, Select, SimpleGrid, Stack, Table, Text, Textarea, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconRefresh, IconSend } from '@tabler/icons-react';

import SEBEngineeringReviewReport from '../components/common/SEBEngineeringReviewReport';
import { buildSebEngineeringReviewReport, REVIEW_DECISIONS } from '../utils/sebEngineeringReviewReport';
import styles from './SEBEngineeringReviewLayout.module.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const STEPS = ['Select SEB', 'Select R01 revision', 'Load and select fact', 'Review selected fact', 'Complete review'];
const DECISIONS = ['ACCEPT', 'CHANGE_REQUIRED', 'ACCEPT_WITH_CONDITION', 'REJECT'];

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.detail || `Request failed (HTTP ${response.status})`); }
  return response.json();
}
const value = item => item === null || item === undefined || item === '' ? '—' : typeof item === 'object' ? 'Recorded details' : String(item);

function Steps({ active }) {
  return <Paper withBorder p={{ base: 'sm', sm: 'md' }} mb="lg">
    <Group justify="space-between"><Text fw={700} size="sm">Engineering Review</Text><Text size="sm" c="green.8">Step {active + 1} of {STEPS.length}</Text></Group>
    <Text className={styles.activeStep} size="sm" fw={600} c="green.8" mt="sm" aria-live="polite">{STEPS[active]}</Text>
    <Progress value={(active + 1) * 20} color="green" mt="sm" aria-label="Engineering review progress" />
    <SimpleGrid cols={5} mt="md" className={styles.stepRail}>{STEPS.map((label, index) => <Group key={label} gap="xs" wrap="nowrap" aria-current={index === active ? 'step' : undefined}>
      <Badge circle color={index <= active ? 'green' : 'gray'}>{index < active ? <IconCheck size={12} /> : index + 1}</Badge><Text size="xs" fw={index === active ? 700 : 400}>{label}</Text>
    </Group>)}</SimpleGrid>
  </Paper>;
}

export default function SEBEngineeringReviewLayout() {
  const [step, setStep] = useState(0); const [sebId, setSebId] = useState(() => localStorage.getItem('seb_id') || ''); const [revisionId, setRevisionId] = useState(() => localStorage.getItem('seb_revision_id') || '');
  const [baselines, setBaselines] = useState([]); const [revisions, setRevisions] = useState([]); const [items, setItems] = useState([]); const [selectedId, setSelectedId] = useState('');
  const [discipline, setDiscipline] = useState(''); const [reviewer, setReviewer] = useState(''); const [decision, setDecision] = useState(''); const [comment, setComment] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [completed, setCompleted] = useState(false);
  const [sessionReviews, setSessionReviews] = useState({});
  const [reportItems, setReportItems] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const baseline = baselines.find(item => item.id === sebId);
  const revision = revisions.find(item => item.id === revisionId);
  const reviewCompleted = completed || revision?.revision_status === 'REVIEW_COMPLETED';
  const busy = loading || reportLoading;
  const resetReview = () => { setItems([]); setSelectedId(''); setCompleted(false); setSessionReviews({}); setReportItems(null); setReportError(''); setError(''); setDiscipline(''); setReviewer(''); setDecision(''); setComment(''); };
  const caseId = localStorage.getItem('sia_case_id') || ''; const selected = items.find(item => item.id === selectedId);
  const loadBaselines = async () => { if (!caseId) { setError('No active SIA case was found.'); return; } setLoading(true); try { setBaselines(await request(`/seb/baselines?sia_case_id=${encodeURIComponent(caseId)}`)); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  const loadRevisions = async () => { if (!sebId) return; setLoading(true); try { setRevisions(await request(`/seb/revisions?seb_id=${encodeURIComponent(sebId)}`)); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  const loadItems = async () => { if (!sebId || !revisionId) return; setLoading(true); setError(''); try { setItems(await request(`/seb/items/review?seb_id=${encodeURIComponent(sebId)}&seb_revision_id=${encodeURIComponent(revisionId)}`)); setSelectedId(''); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { loadBaselines(); }, []); useEffect(() => { loadRevisions(); }, [sebId]);
  const loadReport = async (updatedRevision) => {
    setReportLoading(true); setReportError(''); setReportItems(null);
    try {
      let currentRevision = updatedRevision;
      if (!currentRevision) {
        const latest = await request(`/seb/revisions?seb_id=${encodeURIComponent(sebId)}`);
        setRevisions(latest);
        currentRevision = latest.find(item => item.id === revisionId);
      }
      if (!currentRevision) throw new Error('The selected revision is unavailable. Reload revisions.');
      const endpoint = currentRevision.revision_status === 'REVIEW_COMPLETED' ? 'reviewed' : 'review';
      const savedItems = await request(`/seb/items/${endpoint}?seb_id=${encodeURIComponent(sebId)}&seb_revision_id=${encodeURIComponent(revisionId)}`);
      buildSebEngineeringReviewReport({ baseline, revision: currentRevision, items: savedItems });
      setReportItems(savedItems);
    } catch (e) { setReportError(e.message); }
    finally { setReportLoading(false); }
  };
  useEffect(() => { if (step === 4) loadReport(); }, [step, sebId, revisionId]);
  const saveReview = async () => {
    if (!selected || !discipline || !decision) return;
    const remainingUndecided = items.filter(item => item.id !== selected.id && !item.decision).length;
    const payload = { seb_id: sebId, seb_revision_id: revisionId, fact_id: selected.fact_id, decision, discipline, reviewer: reviewer || null, comment: comment || null };
    setLoading(true); setError('');
    try {
      await request(`/seb/items/${encodeURIComponent(selected.id)}/review`, { method: 'PATCH', body: JSON.stringify(payload) });
      setSessionReviews(current => ({ ...current, [selected.id]: payload }));
      notifications.show({ title: 'Fact review saved', message: 'The fact remains in review and its decision was saved.', color: 'green' });
      await loadItems(); setStep(remainingUndecided ? 2 : 4);
      setDiscipline(''); setReviewer(''); setDecision(''); setComment('');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  const canComplete = Boolean(reportItems?.length) && reportItems.every(item => REVIEW_DECISIONS.includes(item.decision));
  const completeEngineeringReview = async () => {
    if (!canComplete) return;
    setLoading(true); setError('');
    try {
      const updated = await request(`/seb/revisions/${encodeURIComponent(revisionId)}/complete-engineering-review`, { method: 'POST', body: JSON.stringify({ seb_id: sebId }) });
      if (updated.id !== revisionId || updated.seb_id !== sebId || updated.revision_status !== 'REVIEW_COMPLETED') throw new Error('Completion could not be confirmed. Reload the report to check the saved revision.');
      setRevisions(current => current.map(item => item.id === updated.id ? updated : item));
      setCompleted(true);
      notifications.show({ title: 'Review completed', message: 'R01 status is now REVIEW_COMPLETED.', color: 'green' });
      await loadReport(updated);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  const nextAllowed = [Boolean(sebId), Boolean(revisionId), Boolean(selected), Boolean(selected && discipline && decision)][step];
  return <Box className={styles.root} p={{ base: 'sm', sm: 'lg' }} maw={1200} mx="auto"><Box mb="xl"><Badge color="green" variant="light">SEP</Badge><Title order={2} mt="sm">Engineering Review</Title><Text size="sm" c="dimmed">Review each R01 fact and record its engineering decision.</Text></Box><Steps active={step} />{error && <Alert color="red" mb="md">{error}</Alert>}<Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="md">
    {step === 0 && <Stack><Title order={3}>1. Select SEB</Title><Select label="SEB" data={baselines.map(item => ({ value: item.id, label: `${item.seb_code || item.id} · ${item.status || 'DRAFT'}` }))} value={sebId || null} onChange={id => { setSebId(id || ''); setRevisionId(''); setRevisions([]); resetReview(); localStorage.setItem('seb_id', id || ''); localStorage.removeItem('seb_revision_id'); }} searchable disabled={loading} /><Button variant="subtle" color="green" leftSection={<IconRefresh size={15} />} onClick={loadBaselines}>Reload SEBs</Button></Stack>}
    {step === 1 && <Stack><Title order={3}>2. Select Revision R01</Title><Select label="R01 revision" data={revisions.filter(item => item.revision_no === 'R01').map(item => ({ value: item.id, label: `${item.revision_no} · ${item.revision_status || 'DRAFT'}` }))} value={revisionId || null} onChange={id => { setRevisionId(id || ''); resetReview(); localStorage.setItem('seb_revision_id', id || ''); }} searchable disabled={loading} /><Button variant="subtle" color="green" leftSection={<IconRefresh size={15} />} onClick={loadRevisions}>Reload revisions</Button></Stack>}
    {step === 2 && <Stack><Group className={styles.actions} justify="space-between"><Title order={3}>3. Load review items</Title><Button color="green" leftSection={<IconRefresh size={15} />} onClick={loadItems} loading={loading}>Load review items</Button></Group><Text size="sm" c="dimmed">Select one fact to move to Step 4.</Text>{items.length ? <Box className={styles.tableViewport} role="region" aria-label="Review facts" tabIndex={0}><Table className={styles.recordTable} withTableBorder><Table.Thead><Table.Tr><Table.Th>Fact ID</Table.Th><Table.Th>Collection</Table.Th><Table.Th>Status</Table.Th><Table.Th>Selection</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{items.map(item => <Table.Tr key={item.id} bg={selectedId === item.id ? 'green.0' : undefined}><Table.Td data-label="Fact ID"><Text size="xs" style={{ fontFamily: 'monospace' }}>{item.fact_id}</Text></Table.Td><Table.Td data-label="Collection">{item.fact_collection || '—'}</Table.Td><Table.Td data-label="Status"><Badge color="blue">{item.status}</Badge></Table.Td><Table.Td data-label="Selection"><Button size="xs" color="green" variant={selectedId === item.id ? 'filled' : 'light'} onClick={() => setSelectedId(item.id)}>{selectedId === item.id ? 'Selected' : 'Select fact'}</Button></Table.Td></Table.Tr>)}</Table.Tbody></Table></Box> : <Alert color="yellow">Load review items to choose a fact.</Alert>}</Stack>}
    {step === 3 && selected && <Stack><Title order={3}>4. Review selected fact</Title><Paper withBorder p={{ base: 'sm', sm: 'md' }} bg="gray.0"><Text fw={700}>Fact {selected.fact_id}</Text><Text size="xs" c="dimmed" mb="sm">Source collection: {selected.fact_collection || '—'}</Text><SimpleGrid cols={{ base: 1, sm: 2 }}>{Object.entries(selected.fact_data || {}).filter(([key]) => key !== 'id').map(([key, item]) => <Box key={key}><Text size="xs" c="dimmed" tt="capitalize">{key.replaceAll('_', ' ')}</Text><Text className={styles.factDetails} size="sm">{value(item)}</Text></Box>)}</SimpleGrid></Paper><Select label="Discipline" data={['Civil', 'Electrical', 'Mechanical', 'Structural', 'HSE', 'SCADA']} value={discipline || null} onChange={item => setDiscipline(item || '')} /><Textarea label="Reviewer" placeholder="Reviewer name or ID" value={reviewer} onChange={event => setReviewer(event.currentTarget.value)} /><Select label="Decision" data={DECISIONS} value={decision || null} onChange={item => setDecision(item || '')} /><Textarea label="Comment" placeholder="Add comments if needed" value={comment} onChange={event => setComment(event.currentTarget.value)} autosize minRows={3} /><Button color="green" onClick={saveReview} loading={loading} disabled={!discipline || !decision}>Save fact review</Button></Stack>}
    {step === 4 && <Stack align="center" py="lg"><IconCheck size={42} color="#007336" /><Title order={3}>5. Complete review</Title><Text size="sm" c="dimmed" ta="center">All review-status items need a decision before R01 moves from IN_REVIEW to REVIEW_COMPLETED.</Text>{reviewCompleted ? <Alert color="green" title="Review completed">R01 is marked REVIEW_COMPLETED.</Alert> : <Button color="green" leftSection={<IconSend size={16} />} onClick={completeEngineeringReview} loading={loading} disabled={busy || !canComplete || Boolean(reportError)}>Complete Engineering Review</Button>}</Stack>}
    {step === 4 && <SEBEngineeringReviewReport baseline={baseline} revision={revision} items={reportItems} sessionReviews={sessionReviews} busy={busy} loadError={reportError} onReload={() => loadReport()} />}
    <Group className={styles.actions} justify="space-between" mt="xl" pt="lg" style={{ borderTop: '1px solid #e5e7eb' }}><Button variant="default" disabled={step === 0 || busy} onClick={() => setStep(current => current - 1)}>Back</Button>{step < 4 && <Button color="green" disabled={!nextAllowed || busy} onClick={() => setStep(current => current === 1 && reviewCompleted ? 4 : current + 1)}>{step === 2 ? 'Review selected fact' : 'Continue'}</Button>}</Group>
  </Paper></Box>;
}
