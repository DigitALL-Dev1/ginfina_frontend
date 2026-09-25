import { Children, cloneElement, isValidElement, useEffect, useMemo, useState } from 'react';
import {
  Alert, Badge, Box, Button, Checkbox, Divider, Grid, Group, Loader, Modal,
  Paper, Progress, Select, SimpleGrid, Stack, Table, Text,
  Textarea, TextInput, ThemeIcon, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import styles from './SEBEWBHandoffLayout.module.css';
import SEBEwpHandoffReport from '../components/common/SEBEwpHandoffReport';
import {
  IconAlertCircle, IconAlertTriangle, IconArrowLeft, IconArrowRight,
  IconCheck, IconCircleCheck, IconExternalLink, IconFileDescription,
  IconFilter, IconLink, IconPackageExport, IconRefresh, IconSearch,
  IconShieldCheck,
} from '@tabler/icons-react';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const surface = { borderColor: '#e1e8e4', boxShadow: '0 8px 28px rgba(18, 52, 38, 0.045)' };
const SAMPLE_EWPS = [
  { id: 'EWP-ELEC-001', ewp_code: 'EWP-ELEC-001', title: 'Electrical Design Package', discipline: 'ELECTRICAL' },
  { id: 'EWP-CIV-001', ewp_code: 'EWP-CIV-001', title: 'Civil Design Package', discipline: 'CIVIL' },
  { id: 'EWP-STR-001', ewp_code: 'EWP-STR-001', title: 'Structural Design Package', discipline: 'STRUCTURAL' },
];

const FLOW = [
  ['Select SEB', 'Released baseline'],
  ['Select revision', 'Released revision'],
  ['Select EWP', 'Target package'],
  ['Load items', 'Frozen SEB items'],
  ['Select relevant items', 'Filter and include'],
  ['Review context', 'Readiness and evidence'],
  ['Create handoff', 'Create controlled draft'],
  ['EWP review', 'Package user review'],
  ['EWP acceptance', 'Record decision'],
  ['Permanent link', 'SEB and revision linked'],
];

async function request(path, options) {
  const response = await fetch(`${API}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || `Request failed (HTTP ${response.status})`);
  return body;
}

function cleanList(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data?.ewp_list)) return body.data.ewp_list;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

function ewpLabel(item) {
  const code = item.ewp_code || item.ewp_id || item.code || item.id;
  const title = item.title || item.name || item.ewp_name || item.description || item.discipline;
  return title && title !== code ? `${code} · ${title}` : code;
}

function statusColor(value) {
  return {
    RELEASED: 'green', READY: 'green', CONDITIONAL: 'orange', BLOCKED: 'red',
    NOT_APPLICABLE: 'gray', ACCEPT: 'green', ACCEPT_WITH_CONDITION: 'orange',
    CHANGE_REQUIRED: 'orange', REJECT: 'red',
  }[value] || 'gray';
}

function StatusBadge({ value }) {
  return <Badge color={statusColor(value)} variant="light" radius="sm" size="sm">{(value || 'NOT SET').replaceAll('_', ' ')}</Badge>;
}

function FlowProgress({ step }) {
  return (
    <Paper withBorder p="md" radius="lg" style={surface}>
      <Group justify="space-between" mb="sm"><Text fw={750} size="sm">EWP handoff workflow</Text><Text size="xs" c="dimmed">Step {step + 1} of {FLOW.length}</Text></Group>
      <Progress value={((step + 1) / FLOW.length) * 100} color="green" size="sm" radius="xl" mb="md" />
      <Box className={styles.activeStage} aria-live="polite"><Text fw={700} size="sm">{FLOW[step][0]}</Text><Text size="xs" c="dimmed">{FLOW[step][1]}</Text></Box>
      <SimpleGrid className={styles.stepRail} cols={5} spacing="xs">
        {FLOW.map(([label, detail], index) => {
          const complete = index < step;
          const current = index === step;
          return <Group key={label} gap="xs" wrap="nowrap" p="xs" style={{ borderRadius: 9, background: current ? '#edf8f1' : 'transparent' }}>
            <ThemeIcon size={26} radius="xl" color={complete || current ? 'green' : 'gray'} variant={current ? 'filled' : 'light'}>{complete ? <IconCheck size={14} /> : <Text size="xs" fw={800}>{index + 1}</Text>}</ThemeIcon>
            <Box style={{ minWidth: 0 }} aria-current={current ? 'step' : undefined}><Text size="xs" fw={current ? 800 : 650}>{label}</Text><Text size="10px" c="dimmed">{detail}</Text></Box>
          </Group>;
        })}
      </SimpleGrid>
    </Paper>
  );
}

function ContextSummary({ baseline, revision, ewp }) {
  const rows = [['Released SEB', baseline?.seb_code || baseline?.id], ['Revision', revision?.revision_no || revision?.id], ['Target EWP', ewp ? ewpLabel(ewp) : null]];
  return <Paper withBorder p="sm" radius="md" bg="#f8fbf9" style={{ borderColor: '#dfe8e3' }}><SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">{rows.map(([label, value]) => <Box key={label}><Text size="10px" tt="uppercase" fw={750} c="dimmed">{label}</Text><Text size="sm" fw={700} mt={2}>{value || 'Not selected'}</Text></Box>)}</SimpleGrid></Paper>;
}

function Metric({ label, value, color = '#176c3a' }) {
  return <Paper withBorder radius="md" p="sm"><Text size="xs" c="dimmed">{label}</Text><Text size="xl" fw={850} c={color}>{value}</Text></Paper>;
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

export default function SEBEWBHandoffLayout() {
  const isMobile = useMediaQuery('(max-width: 47.99em)');
  const caseId = localStorage.getItem('sia_case_id') || '';
  const [step, setStep] = useState(0);
  const [baselines, setBaselines] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [ewps, setEwps] = useState([]);
  const [sebId, setSebId] = useState('');
  const [revisionId, setRevisionId] = useState('');
  const [ewpId, setEwpId] = useState('');
  const [summary, setSummary] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [discipline, setDiscipline] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ewpFallback, setEwpFallback] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [handoff, setHandoff] = useState(null);
  const [freezeSnapshot, setFreezeSnapshot] = useState(null);
  const [reviewedBy, setReviewedBy] = useState(() => localStorage.getItem('user_id') || '');
  const [reviewComment, setReviewComment] = useState('');
  const [acceptanceDecision, setAcceptanceDecision] = useState('ACCEPT');
  const [acceptedBy, setAcceptedBy] = useState(() => localStorage.getItem('user_id') || '');
  const [acceptanceComment, setAcceptanceComment] = useState('');
  const [acceptance, setAcceptance] = useState(null);

  const selectedBaseline = baselines.find(item => item.id === sebId);
  const selectedRevision = revisions.find(item => item.id === revisionId);
  const selectedEwp = ewps.find(item => String(item.id) === ewpId);
  const items = summary?.items || [];
  const selectedItems = items.filter(item => selectedIds.includes(item.id));
  const disciplines = [...new Set(items.map(item => item.discipline || 'UNASSIGNED'))].sort();
  const evidenceFor = itemId => (summary?.evidence_references || []).filter(record => record.seb_item_id === itemId || record.item_id === itemId);
  const conditionFor = itemId => (summary?.conditions || []).filter(record => record.item_id === itemId);
  const blockerFor = itemId => (summary?.blockers || []).filter(record => record.item_id === itemId);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(item => {
      if (discipline !== 'ALL' && (item.discipline || 'UNASSIGNED') !== discipline) return false;
      return !q || `${item.fact_name || ''} ${item.fact_id || ''} ${item.discipline || ''}`.toLowerCase().includes(q);
    });
  }, [items, search, discipline]);

  const loadBaselines = async () => {
    if (!caseId) { setError('Select an SIA case before starting an EWP handoff.'); return; }
    setLoading(true); setError('');
    try {
      const data = cleanList(await request(`/seb/baselines?sia_case_id=${encodeURIComponent(caseId)}`));
      setBaselines(data.filter(item => item.status === 'RELEASED'));
    } catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
  };

  const loadRevisions = async selectedSebId => {
    if (!selectedSebId) return;
    setLoading(true); setError('');
    try {
      const data = cleanList(await request(`/seb/revisions?seb_id=${encodeURIComponent(selectedSebId)}&revision_status=RELEASED`));
      setRevisions(data.filter(item => item.revision_status === 'RELEASED'));
    } catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
  };

  const loadEwps = async () => {
    setLoading(true); setError(''); setEwpFallback(false);
    const projectId = selectedBaseline?.project_id;
    const path = projectId ? `/ewps?project_id=${encodeURIComponent(projectId)}` : '/ewps';
    try {
      const data = cleanList(await request(path));
      if (!data.length) throw new Error('No EWP records were returned');
      setEwps(data.map((item, index) => ({ ...item, id: String(item.id || item.ewp_id || item.ewp_code || index) })));
    } catch {
      setEwps(SAMPLE_EWPS); setEwpFallback(true);
    } finally { setLoading(false); }
  };

  const loadReleasedItems = async () => {
    if (!sebId || !revisionId) return;
    setLoading(true); setError(''); setSummary(null); setSelectedIds([]);
    try {
      const data = await request(`/seb/approval-summary?seb_id=${encodeURIComponent(sebId)}&seb_revision_id=${encodeURIComponent(revisionId)}`);
      if (data?.revision?.revision_status !== 'RELEASED' || data?.release?.release_status !== 'RELEASED') throw new Error('The selected revision does not have a completed release record.');
      setSummary(data);
      const targetDiscipline = String(selectedEwp?.discipline || '').toUpperCase().split(/[\/,-]/)[0].trim();
      if (targetDiscipline && data.items?.some(item => String(item.discipline).toUpperCase() === targetDiscipline)) setDiscipline(targetDiscipline);
      else setDiscipline('ALL');
    } catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
  };

  useEffect(() => { loadBaselines(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSebChange = value => {
    const next = value || '';
    setSebId(next); setRevisionId(''); setRevisions([]); setEwpId(''); setEwps([]); setSummary(null); setSelectedIds([]); setHandoff(null); setFreezeSnapshot(null); setAcceptance(null); setReviewComment(''); setAcceptanceComment('');
    if (next) loadRevisions(next);
  };

  const handleRevisionChange = value => { setRevisionId(value || ''); setEwpId(''); setEwps([]); setSummary(null); setSelectedIds([]); setHandoff(null); setFreezeSnapshot(null); setAcceptance(null); setReviewComment(''); setAcceptanceComment(''); };
  const canContinue = [Boolean(sebId), Boolean(revisionId), Boolean(ewpId), Boolean(summary?.items?.length), Boolean(selectedIds.length), true, Boolean(handoff && freezeSnapshot), handoff?.handoff_status === 'REVIEWED' && Boolean(freezeSnapshot), Boolean(handoff?.permanent_link), true][step];

  const next = async () => {
    if (step === 1 && !ewps.length) await loadEwps();
    if (step === 3 && !summary) return;
    setStep(current => Math.min(current + 1, FLOW.length - 1));
  };

  const toggleItem = (id, checked) => setSelectedIds(current => checked ? [...new Set([...current, id])] : current.filter(itemId => itemId !== id));
  const allVisibleSelected = filteredItems.length > 0 && filteredItems.every(item => selectedIds.includes(item.id));
  const toggleVisible = checked => setSelectedIds(current => checked ? [...new Set([...current, ...filteredItems.map(item => item.id)])] : current.filter(id => !filteredItems.some(item => item.id === id)));

  const freezeHandoff = async handoffId => {
    const targetHandoffId = handoffId || handoff?.id;
    if (!targetHandoffId) return null;
    const frozen = await request(`/ewb-handoffs/${encodeURIComponent(targetHandoffId)}/freeze`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frozen_by: localStorage.getItem('user_id') || 'current-user' }),
    });
    setFreezeSnapshot(frozen);
    return frozen;
  };

  const retryFreezeHandoff = async () => {
    setSaving(true); setError('');
    try {
      const frozen = await freezeHandoff();
      notifications.show({ color: 'green', title: 'Released SEB snapshot frozen', message: `${frozen.item_count} released item(s) secured for this handoff.` });
    } catch (freezeError) { setError(freezeError.message); } finally { setSaving(false); }
  };

  const createHandoff = async () => {
    if (!summary?.release?.id || !selectedItems.length || !selectedEwp) return;
    setSaving(true); setError('');
    try {
      const ewpCode = selectedEwp.ewp_code || selectedEwp.ewp_id || selectedEwp.code || selectedEwp.id;
      const created = await request('/ewb-handoffs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seb_release_id: summary.release.id, seb_revision_id: revisionId, project_id: selectedBaseline?.project_id || 'UNASSIGNED', handoff_code: `HO-${selectedBaseline?.seb_code || 'SEB'}-${selectedRevision?.revision_no || 'REV'}-${ewpCode}`, ewp_reference_id: selectedEwp.id, ewp_code: ewpCode, ewp_discipline: selectedEwp.discipline || null, handoff_status: 'DRAFT', prepared_by: localStorage.getItem('user_id') || 'current-user' }),
      });
      setHandoff(created);
      for (const item of selectedItems) {
        await request('/ewb-handoff-items', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ewb_handoff_id: created.id, seb_item_id: item.id, discipline: item.discipline, applicability: 'RELEVANT', item_value_snapshot: JSON.stringify({ fact_id: item.fact_id, fact_name: item.fact_name, review_decision: item.review_decision, discipline_readiness: item.discipline_readiness, conditions: conditionFor(item.id), blockers: blockerFor(item.id), evidence_references: evidenceFor(item.id) }), reliability_status: 'RELIABLE', is_mandatory: item.readiness === 'BLOCKED' || item.readiness === 'CONDITIONAL', handoff_status: 'INCLUDED' }),
        });
      }
      const frozen = await freezeHandoff(created.id);
      notifications.show({ color: 'green', title: 'Handoff created and frozen', message: `${frozen.item_count} released SEB item(s) were frozen for ${ewpCode}.` });
    } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  };

  const completeEwpReview = async () => {
    if (!handoff?.id || !reviewedBy.trim()) return;
    if (!freezeSnapshot) { setError('Freeze the released SEB snapshot before completing EWP review.'); return; }
    setSaving(true); setError('');
    try {
      const updated = await request(`/ewb-handoffs/${encodeURIComponent(handoff.id)}/review`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewed_by: reviewedBy.trim(), review_comment: reviewComment.trim() || null }),
      });
      setHandoff(updated);
      notifications.show({ color: 'green', title: 'EWP review completed', message: 'The handoff is ready for an acceptance decision.' });
    } catch (reviewError) { setError(reviewError.message); } finally { setSaving(false); }
  };

  const submitAcceptance = async () => {
    if (!handoff?.id || !acceptedBy.trim() || !acceptanceDecision) return;
    if (!freezeSnapshot) { setError('The released SEB snapshot must be frozen before EWP acceptance.'); return; }
    if (acceptanceDecision === 'ACCEPT_WITH_CONDITION' && !acceptanceComment.trim()) {
      setError('An acceptance condition is required for ACCEPT WITH CONDITION.'); return;
    }
    setSaving(true); setError('');
    try {
      const result = await request('/ewb-handoff-acceptances', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ewb_handoff_id: handoff.id, accepted_by: acceptedBy.trim(), acceptance_decision: acceptanceDecision, acceptance_comment: acceptanceComment.trim() || null }),
      });
      const updated = await request(`/ewb-handoffs/${encodeURIComponent(handoff.id)}`);
      setAcceptance(result); setHandoff(updated);
      const accepted = ['ACCEPT', 'ACCEPT_WITH_CONDITION'].includes(acceptanceDecision);
      notifications.show({ color: accepted ? 'green' : 'orange', title: 'EWP decision recorded', message: accepted ? `${selectedItems.length} selected SEB item status(es) were updated to approved.` : `Decision: ${acceptanceDecision.replaceAll('_', ' ')}` });
    } catch (acceptError) { setError(acceptError.message); } finally { setSaving(false); }
  };

  return <Box className={styles.root} p={{ base: 'sm', sm: 'md', md: 'xl' }} maw={1280} mx="auto">
    <Group justify="space-between" align="flex-start" mb="xl" wrap="wrap"><Box className={styles.headingText}><Badge color="green" variant="light" mb="xs">SEB → EWP</Badge><Title order={2} c="#16261e">EWP Handoff</Title><Text c="dimmed" size="sm" mt={4}>Select released engineering facts and pass their frozen context into an Engineering Work Package.</Text></Box><ThemeIcon visibleFrom="sm" size={48} radius="lg" color="green" variant="light"><IconPackageExport size={25} /></ThemeIcon></Group>
    <Stack gap="lg">
      <FlowProgress step={step} />
      <ContextSummary baseline={selectedBaseline} revision={selectedRevision} ewp={selectedEwp} />
      {error && <Alert color="red" icon={<IconAlertCircle size={18} />} withCloseButton onClose={() => setError('')}>{error}</Alert>}
      <Paper withBorder p={{ base: 'sm', sm: 'md', md: 'xl' }} radius="lg" style={surface} mih={390}>
        {step === 0 && <Stack gap="lg"><Group justify="space-between"><Box><Title order={3}>1. Select Released SEB</Title><Text size="sm" c="dimmed">Only baselines with RELEASED status are available.</Text></Box><Button variant="subtle" color="green" leftSection={<IconRefresh size={15} />} onClick={loadBaselines} loading={loading}>Refresh</Button></Group><Select classNames={{ dropdown: styles.dropdown }} label="Released SEB" placeholder={caseId ? 'Choose a released SEB' : 'Select an SIA case first'} data={baselines.map(item => ({ value: item.id, label: `${item.seb_code || item.id} · RELEASED` }))} value={sebId || null} onChange={handleSebChange} searchable clearable disabled={!caseId || loading} />{!loading && caseId && !baselines.length && <Alert color="yellow" icon={<IconAlertTriangle size={18} />}>No released SEB is available for the active SIA case.</Alert>}</Stack>}
        {step === 1 && <Stack gap="lg"><Box><Title order={3}>2. Select Released Revision</Title><Text size="sm" c="dimmed">Choose the immutable revision that will supply this handoff.</Text></Box><Select classNames={{ dropdown: styles.dropdown }} label="Released revision" placeholder={loading ? 'Loading revisions…' : 'Choose a released revision'} data={revisions.map(item => ({ value: item.id, label: `${item.revision_no || item.id} · RELEASED` }))} value={revisionId || null} onChange={handleRevisionChange} searchable clearable disabled={loading} />{!loading && !revisions.length && <Alert color="yellow">This SEB has no released revisions.</Alert>}</Stack>}
        {step === 2 && <Stack gap="lg"><Box><Title order={3}>3. Select EWP</Title><Text size="sm" c="dimmed">Choose the Engineering Work Package that needs these baseline inputs.</Text></Box>{loading ? <Group><Loader color="green" size="sm" /><Text size="sm" c="dimmed">Loading EWPs…</Text></Group> : <Select classNames={{ dropdown: styles.dropdown }} label="Engineering Work Package" placeholder="Choose an EWP" data={ewps.map(item => ({ value: String(item.id), label: ewpLabel(item) }))} value={ewpId || null} onChange={value => { setEwpId(value || ''); setSummary(null); setSelectedIds([]); setHandoff(null); setFreezeSnapshot(null); setAcceptance(null); setReviewComment(''); setAcceptanceComment(''); }} searchable clearable />}{ewpFallback && <Alert color="blue" icon={<IconAlertCircle size={18} />}>The EWP service returned no records, so configured sample packages are shown for this workflow.</Alert>}{selectedEwp && <Paper withBorder p="md" radius="md"><Group justify="space-between"><Box><Text fw={800}>{selectedEwp.ewp_code || selectedEwp.ewp_id || selectedEwp.id}</Text><Text size="sm" c="dimmed">{selectedEwp.title || selectedEwp.name || selectedEwp.description || 'Engineering Work Package'}</Text></Box><Badge color="green" variant="light">{selectedEwp.discipline || 'MULTI-DISCIPLINE'}</Badge></Group></Paper>}</Stack>}
        {step === 3 && <Stack gap="lg"><Box><Title order={3}>4. Load Released SEB Items</Title><Text size="sm" c="dimmed">Load the exact item set stored against this release.</Text></Box>{!summary && <Paper p="xl" radius="lg" bg="#f5f8f6" ta="center"><ThemeIcon size={48} radius="xl" color="green" variant="light" mx="auto" mb="sm"><IconShieldCheck size={24} /></ThemeIcon><Text fw={750}>Controlled release source</Text><Text size="sm" c="dimmed" maw={560} mx="auto" mt={4}>Items are loaded only after both the revision and its release record are verified as RELEASED.</Text><Button mt="lg" color="green" leftSection={<IconRefresh size={16} />} onClick={loadReleasedItems} loading={loading}>Load released items</Button></Paper>}{summary && <><SimpleGrid cols={{ base: 2, sm: 4 }}><Metric label="Released items" value={items.length} /><Metric label="Ready" value={items.filter(item => item.readiness === 'READY').length} /><Metric label="Conditional" value={items.filter(item => item.readiness === 'CONDITIONAL').length} color="#d97706" /><Metric label="Blocked" value={items.filter(item => item.readiness === 'BLOCKED').length} color="#c92a2a" /></SimpleGrid><Alert color="green" icon={<IconCircleCheck size={18} />}>Release {summary.release?.release_code || summary.release?.id} verified. The frozen revision contains {items.length} item(s).</Alert></>}</Stack>}
        {step === 4 && <Stack gap="md"><Box><Title order={3}>5. Select Items Relevant to this EWP</Title><Text size="sm" c="dimmed">Filter by discipline or fact, then select the inputs this package needs.</Text></Box><Grid><Grid.Col span={{ base: 12, md: 7 }}><TextInput label="Search facts" leftSection={<IconSearch size={16} />} placeholder="Search fact name, ID, or discipline" value={search} onChange={event => setSearch(event.currentTarget.value)} /></Grid.Col><Grid.Col span={{ base: 12, md: 5 }}><Select classNames={{ dropdown: styles.dropdown }} label="Discipline filter" leftSection={<IconFilter size={16} />} data={[{ value: 'ALL', label: 'All disciplines' }, ...disciplines.map(value => ({ value, label: value.replaceAll('_', ' ') }))]} value={discipline} onChange={value => setDiscipline(value || 'ALL')} /></Grid.Col></Grid><Group justify="space-between"><Checkbox label={`Select all ${filteredItems.length} visible item(s)`} checked={allVisibleSelected} indeterminate={selectedIds.length > 0 && !allVisibleSelected} onChange={event => toggleVisible(event.currentTarget.checked)} /><Badge color="green" variant="filled">{selectedIds.length} selected</Badge></Group><ResponsiveTable label="Select released items" striped highlightOnHover withTableBorder verticalSpacing="sm"><Table.Thead><Table.Tr><Table.Th w={80}>Select</Table.Th><Table.Th>Fact</Table.Th><Table.Th>Discipline</Table.Th><Table.Th>Review decision</Table.Th><Table.Th>Readiness</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{filteredItems.map(item => <Table.Tr key={item.id}><Table.Td><Checkbox aria-label={`Select ${item.fact_name}`} checked={selectedIds.includes(item.id)} onChange={event => toggleItem(item.id, event.currentTarget.checked)} /></Table.Td><Table.Td><Text size="sm" fw={700}>{item.fact_name}</Text><Text size="xs" c="dimmed">{item.fact_id}</Text></Table.Td><Table.Td><Text size="sm">{(item.discipline || 'UNASSIGNED').replaceAll('_', ' ')}</Text></Table.Td><Table.Td><StatusBadge value={item.review_decision} /></Table.Td><Table.Td><StatusBadge value={item.readiness} /></Table.Td></Table.Tr>)}</Table.Tbody></ResponsiveTable>{!filteredItems.length && <Alert color="yellow">No released items match the current filters.</Alert>}</Stack>}
        {step === 5 && <Stack gap="lg">
          <Box><Title order={3}>6. Review Released Context</Title><Text size="sm" c="dimmed">Confirm the selected readiness, conditions, blockers, and evidence before creating the handoff.</Text></Box>
          <SimpleGrid cols={{ base: 2, sm: 4 }}><Metric label="Selected items" value={selectedItems.length} /><Metric label="Ready" value={selectedItems.filter(item => item.readiness === 'READY').length} /><Metric label="Conditions" value={selectedItems.reduce((total, item) => total + conditionFor(item.id).length, 0)} color="#d97706" /><Metric label="Blockers" value={selectedItems.reduce((total, item) => total + blockerFor(item.id).length, 0)} color="#c92a2a" /></SimpleGrid>
          <ResponsiveTable label="Selected item context" withTableBorder verticalSpacing="sm"><Table.Thead bg="#f7faf8"><Table.Tr><Table.Th>Fact</Table.Th><Table.Th>Discipline</Table.Th><Table.Th>Readiness</Table.Th><Table.Th>Conditions</Table.Th><Table.Th>Blockers / gaps</Table.Th><Table.Th>Evidence</Table.Th><Table.Th>Details</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{selectedItems.map(item => <Table.Tr key={item.id}><Table.Td><Text size="sm" fw={700}>{item.fact_name}</Text><Text size="xs" c="dimmed">{item.fact_id}</Text></Table.Td><Table.Td>{item.discipline}</Table.Td><Table.Td><StatusBadge value={item.readiness} /></Table.Td><Table.Td>{conditionFor(item.id).length}</Table.Td><Table.Td>{blockerFor(item.id).length}</Table.Td><Table.Td>{evidenceFor(item.id).length}</Table.Td><Table.Td><Button size="xs" variant="subtle" color="green" onClick={() => setDetailItem(item)}>View details</Button></Table.Td></Table.Tr>)}</Table.Tbody></ResponsiveTable>
          <Alert color="blue" icon={<IconShieldCheck size={18} />}>The handoff will retain the selected release ID and release hash for traceability.</Alert>
        </Stack>}

        {step === 6 && <Stack gap="lg">
          <Box><Title order={3}>7. Create Handoff</Title><Text size="sm" c="dimmed">Create the controlled EWP handoff and copy the selected released context into it.</Text></Box>
          <Paper withBorder p="lg" radius="lg" bg="#f8fbf9"><SimpleGrid cols={{ base: 1, sm: 3 }}><Box><Text size="xs" c="dimmed">From</Text><Text fw={750}>{selectedBaseline?.seb_code} / {selectedRevision?.revision_no}</Text></Box><Box><Text size="xs" c="dimmed">To</Text><Text fw={750}>{selectedEwp && ewpLabel(selectedEwp)}</Text></Box><Box><Text size="xs" c="dimmed">Included items</Text><Text fw={750}>{selectedItems.length}</Text></Box></SimpleGrid></Paper>
          {handoff ? <Stack gap="md">
            <Alert color="green" icon={<IconCircleCheck size={18} />}>Handoff <b>{handoff.handoff_code}</b> was created in DRAFT status.</Alert>
            {freezeSnapshot ? <Paper withBorder p="md" radius="md" style={{ borderColor: '#9bd5b2', background: '#f3fbf6' }}>
              <Group justify="space-between" align="flex-start" wrap="wrap"><Group align="flex-start" wrap="nowrap"><ThemeIcon color="green" radius="xl"><IconShieldCheck size={18} /></ThemeIcon><Box><Text fw={800}>Released SEB snapshot frozen</Text><Text size="sm" c="dimmed">{freezeSnapshot.project?.name} · {freezeSnapshot.seb?.code} / {freezeSnapshot.released_revision?.revision_no}</Text></Box></Group><Badge color="green" variant="filled">{freezeSnapshot.status}</Badge></Group>
              <Divider my="md" />
              <SimpleGrid cols={{ base: 1, sm: 3 }}><Box><Text size="xs" c="dimmed">SIA case</Text><Text size="sm" fw={700}>{freezeSnapshot.sia_case?.case_code || freezeSnapshot.sia_case_id}</Text></Box><Box><Text size="xs" c="dimmed">Released items</Text><Text size="sm" fw={700}>{freezeSnapshot.item_count}</Text></Box><Box><Text size="xs" c="dimmed">Snapshot hash</Text><Text size="xs" ff="monospace">{freezeSnapshot.snapshot_hash}</Text></Box></SimpleGrid>
            </Paper> : <Alert color="orange" icon={<IconAlertTriangle size={18} />} title="Freeze snapshot required">The handoff exists, but its released SEB snapshot was not frozen. <Button mt="sm" size="compact-xs" color="orange" variant="light" loading={saving} onClick={retryFreezeHandoff}>Retry freeze</Button></Alert>}
          </Stack> : <Group className={styles.actions} justify="flex-end"><Button color="green" size="md" leftSection={<IconPackageExport size={18} />} loading={saving} disabled={!summary?.release?.id} onClick={createHandoff}>Create and freeze handoff</Button></Group>}
        </Stack>}

        {step === 7 && <Stack gap="lg">
          <Box><Title order={3}>8. EWP User Reviews Handoff</Title><Text size="sm" c="dimmed">The receiving EWP user checks the selected items and their engineering context.</Text></Box>
          <SimpleGrid cols={{ base: 1, sm: 3 }}><Metric label="Items to review" value={selectedItems.length} /><Metric label="Conditions" value={selectedItems.reduce((total, item) => total + conditionFor(item.id).length, 0)} color="#d97706" /><Metric label="Blockers" value={selectedItems.reduce((total, item) => total + blockerFor(item.id).length, 0)} color="#c92a2a" /></SimpleGrid>
          <TextInput label="EWP reviewer" placeholder="Enter the receiving EWP user" value={reviewedBy} onChange={event => setReviewedBy(event.currentTarget.value)} disabled={handoff?.handoff_status === 'REVIEWED'} required />
          <Textarea label="Review comment" placeholder="Add a review note if needed" value={reviewComment} onChange={event => setReviewComment(event.currentTarget.value)} disabled={handoff?.handoff_status === 'REVIEWED'} minRows={3} />
          {handoff?.handoff_status === 'REVIEWED' ? <Alert color="green" icon={<IconCircleCheck size={18} />}>Review completed by {handoff.reviewed_by}.</Alert> : <Group className={styles.actions} justify="flex-end"><Button color="green" loading={saving} disabled={!reviewedBy.trim() || !freezeSnapshot} onClick={completeEwpReview}>Complete EWP review</Button></Group>}
        </Stack>}

        {step === 8 && <Stack gap="lg">
          <Box><Title order={3}>9. EWP Accepts Handoff</Title><Text size="sm" c="dimmed">Record the receiving user's decision. Acceptance creates the permanent EWP-to-SEB revision link.</Text></Box>
          <Grid><Grid.Col span={{ base: 12, sm: 6 }}><TextInput label="Accepted by" value={acceptedBy} onChange={event => setAcceptedBy(event.currentTarget.value)} disabled={Boolean(acceptance)} required /></Grid.Col><Grid.Col span={{ base: 12, sm: 6 }}><Select classNames={{ dropdown: styles.dropdown }} label="Decision" data={[{ value: 'ACCEPT', label: 'ACCEPT' }, { value: 'ACCEPT_WITH_CONDITION', label: 'ACCEPT WITH CONDITION' }, { value: 'RETURN_FOR_CLARIFICATION', label: 'RETURN FOR CLARIFICATION' }, { value: 'REJECT', label: 'REJECT' }]} value={acceptanceDecision} onChange={value => setAcceptanceDecision(value || '')} disabled={Boolean(acceptance)} /></Grid.Col></Grid>
          <Textarea label={acceptanceDecision === 'ACCEPT_WITH_CONDITION' ? 'Acceptance condition' : 'Comment'} required={acceptanceDecision === 'ACCEPT_WITH_CONDITION'} value={acceptanceComment} onChange={event => setAcceptanceComment(event.currentTarget.value)} disabled={Boolean(acceptance)} minRows={3} />
          <Alert color="green" icon={<IconShieldCheck size={18} />}>Frozen snapshot verified: {freezeSnapshot?.item_count || 0} released item(s) · {freezeSnapshot?.snapshot_hash?.slice(0, 16)}…</Alert>
          {acceptance ? <Alert color={handoff?.handoff_status === 'ACCEPTED' ? 'green' : 'orange'} icon={<IconCircleCheck size={18} />}>Decision recorded: <b>{acceptance.acceptance_decision?.replaceAll('_', ' ')}</b>. {handoff?.handoff_status !== 'ACCEPTED' && 'A permanent link is created only after acceptance.'}</Alert> : <Group className={styles.actions} justify="flex-end"><Button color="green" loading={saving} disabled={!acceptedBy.trim() || !acceptanceDecision || !freezeSnapshot} onClick={submitAcceptance}>Submit EWP decision</Button></Group>}
        </Stack>}

        {step === 9 && <Stack gap="lg">
          <Box><Title order={3}>10. Permanent EWP Link</Title><Text size="sm" c="dimmed">The accepted EWP is permanently linked to the exact released SEB revision.</Text></Box>
          <Paper withBorder p={{ base: 'sm', sm: 'lg', md: 'xl' }} radius="lg" style={{ borderColor: '#9bd5b2', background: 'linear-gradient(135deg, #f0fbf4 0%, #ffffff 72%)' }}>
            <Group justify="space-between" align="flex-start" wrap="wrap"><Group align="flex-start" wrap="nowrap"><ThemeIcon size={48} radius="xl" color="green"><IconLink size={24} /></ThemeIcon><Box><Text size="xs" tt="uppercase" fw={800} c="green">Permanent controlled link</Text><Title order={3} mt={4}>{handoff?.permanent_link?.ewp_code} → {handoff?.permanent_link?.seb_code || selectedBaseline?.seb_code} / {handoff?.permanent_link?.revision_no || selectedRevision?.revision_no}</Title><Text size="sm" c="dimmed" mt={6}>Accepted by {handoff?.permanent_link?.accepted_by} on {handoff?.permanent_link?.linked_at ? new Date(handoff.permanent_link.linked_at).toLocaleString() : '—'}</Text></Box></Group><Badge color="green" variant="filled" size="lg">LINKED</Badge></Group>
            <Divider my="lg" />
            <SimpleGrid cols={{ base: 1, sm: 2 }}><Box><Text size="xs" c="dimmed">Release</Text><Text size="sm" fw={700}>{handoff?.permanent_link?.release_code}</Text></Box><Box><Text size="xs" c="dimmed">Release hash</Text><Text size="xs" ff="monospace" style={{ wordBreak: 'break-all' }}>{handoff?.permanent_link?.release_hash}</Text></Box><Box><Text size="xs" c="dimmed">Handoff</Text><Text size="sm" fw={700}>{handoff?.handoff_code}</Text></Box><Box><Text size="xs" c="dimmed">Acceptance ID</Text><Text size="xs" ff="monospace">{handoff?.permanent_link?.acceptance_id}</Text></Box><Box><Text size="xs" c="dimmed">Frozen item snapshot</Text><Text size="sm" fw={700}>{freezeSnapshot?.item_count} released item(s)</Text></Box><Box><Text size="xs" c="dimmed">Snapshot hash</Text><Text size="xs" ff="monospace" style={{ wordBreak: 'break-all' }}>{freezeSnapshot?.snapshot_hash}</Text></Box></SimpleGrid>
          </Paper>
          <Alert color="green" icon={<IconCircleCheck size={18} />}>{selectedItems.length} selected SEB item status(es) are approved, and the EWP change subscription is active.</Alert>
          {handoff?.id && <SEBEwpHandoffReport handoff={handoff} snapshot={freezeSnapshot} acceptance={acceptance} sebId={sebId} revisionId={revisionId} />}
        </Stack>}
        <Divider my="xl" />
        <Group className={styles.actions} justify="space-between"><Button variant="default" leftSection={<IconArrowLeft size={16} />} disabled={step === 0 || saving} onClick={() => setStep(current => current - 1)}>Back</Button>{step < FLOW.length - 1 && <Button color="green" rightSection={<IconArrowRight size={16} />} disabled={!canContinue || loading} onClick={next}>Continue</Button>}</Group>
      </Paper>
    </Stack>
    <Modal opened={Boolean(detailItem)} onClose={() => setDetailItem(null)} title={<Text fw={800}>Released item details</Text>} size="lg" centered radius="lg" fullScreen={isMobile} classNames={{ content: styles.modal }}>{detailItem && <Stack gap="md"><Box><Text fw={800}>{detailItem.fact_name}</Text><Text size="xs" c="dimmed">{detailItem.fact_id}</Text></Box><Group><StatusBadge value={detailItem.review_decision} /><StatusBadge value={detailItem.readiness} /><Badge variant="outline" color="gray">{detailItem.discipline}</Badge></Group><Divider /><Box><Group gap="xs" mb="xs"><IconAlertCircle size={17} color="#d97706" /><Text fw={750}>Conditions</Text></Group>{conditionFor(detailItem.id).length ? conditionFor(detailItem.id).map((record, index) => <Paper key={index} withBorder p="sm" radius="md" mb="xs"><Text size="sm">{record.condition}</Text>{record.required_action && <Text size="xs" c="dimmed" mt={4}>Required action: {record.required_action}</Text>}{record.owner && <Text size="xs" c="dimmed">Owner: {record.owner}</Text>}</Paper>) : <Text size="sm" c="dimmed">No conditions recorded.</Text>}</Box><Box><Group gap="xs" mb="xs"><IconAlertTriangle size={17} color="#c92a2a" /><Text fw={750}>Blockers / gaps</Text></Group>{blockerFor(detailItem.id).length ? blockerFor(detailItem.id).map((record, index) => <Paper key={index} withBorder p="sm" radius="md" mb="xs"><Text size="sm">{record.blocker}</Text>{(record.reason || record.blocker_reason) && <Text size="xs" c="dimmed" mt={4}>{record.reason || record.blocker_reason}</Text>}{record.related_fact_or_gap && <Text size="xs" c="dimmed">Related fact / gap: {record.related_fact_or_gap}</Text>}</Paper>) : <Text size="sm" c="dimmed">No blockers or gaps recorded.</Text>}</Box><Box><Group gap="xs" mb="xs"><IconLink size={17} color="#176c3a" /><Text fw={750}>Evidence links</Text></Group>{evidenceFor(detailItem.id).length ? evidenceFor(detailItem.id).map((record, index) => { const href = record.evidence_url || record.url || record.evidence_reference; const isLink = typeof href === 'string' && /^https?:\/\//i.test(href); return <Paper key={record.id || index} withBorder p="sm" radius="md" mb="xs"><Group justify="space-between"><Box><Text size="sm" fw={650}>{record.evidence_reference || record.evidence_type || record.id}</Text>{record.evidence_hash && <Text size="xs" c="dimmed">Hash: {record.evidence_hash}</Text>}</Box>{isLink && <Button component="a" href={href} target="_blank" size="xs" variant="subtle" color="green" rightSection={<IconExternalLink size={13} />}>Open</Button>}</Group></Paper>; }) : <Text size="sm" c="dimmed">No item-level evidence reference recorded.</Text>}</Box><Box><Group gap="xs" mb="xs"><IconFileDescription size={17} color="#176c3a" /><Text fw={750}>Release traceability</Text></Group><Text size="xs" c="dimmed">Release: {summary?.release?.release_code || summary?.release?.id}</Text><Text size="xs" c="dimmed">Release hash: {summary?.release?.release_hash || 'Not recorded'}</Text></Box></Stack>}</Modal>
  </Box>;
}
