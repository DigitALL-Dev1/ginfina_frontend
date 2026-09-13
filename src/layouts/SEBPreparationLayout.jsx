import { useEffect, useState } from 'react';
import {
  Accordion, Alert, Badge, Box, Button, Checkbox, Group, Loader, Paper, Progress, Select, SimpleGrid,
  Stack, Table, Text, TextInput, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft, IconArrowRight, IconCheck, IconDatabaseImport, IconFilePlus, IconGitBranch,
  IconMapPin, IconRefresh, IconSend, IconShieldCheck,
} from '@tabler/icons-react';
import { autoCode } from '../utils/autoCode';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const ASSESSMENT_STAGES = ['INITIAL_ASSESSMENT', 'DETAILED_ASSESSMENT', 'REASSESSMENT', 'COMPLETION_REVIEW'];
const BASELINE_STATUSES = ['DRAFT', 'IN_PREPARATION', 'READY_FOR_REVIEW', 'RELEASED', 'SUPERSEDED'];
const REVISION_STATUSES = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'RELEASED'];
const STEPS = [
  { label: 'Select Verified SIA Case', icon: IconShieldCheck },
  { label: 'Select Site', icon: IconMapPin },
  { label: 'Create SEB', icon: IconFilePlus },
  { label: 'Create Initial Revision R01', icon: IconGitBranch },
  { label: 'Load SIA Source Data', icon: IconDatabaseImport },
  { label: 'Review SIA sections', icon: IconCheck },
  { label: 'Review SEB Items', icon: IconCheck },
  { label: 'Submit R01 for Engineering Review', icon: IconSend },
];

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (HTTP ${response.status})`);
  }
  return response.json();
}

function Workflow({ activeStep }) {
  return <Paper withBorder p="lg" radius="md" mb="lg" bg="#fbfdfc">
    <Group justify="space-between" mb="sm">
      <Text size="sm" fw={700}>Step {activeStep + 1} of {STEPS.length}</Text>
      <Text size="sm" c="green.8" fw={600}>{STEPS[activeStep].label}</Text>
    </Group>
    <Progress value={((activeStep + 1) / STEPS.length) * 100} color="green" size="sm" mb="lg" aria-label="Preparation progress" />
    <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
      {STEPS.map((step, index) => <Group key={step.label} gap="xs" wrap="nowrap" aria-current={index === activeStep ? 'step' : undefined}>
        <Badge circle size="lg" color={index <= activeStep ? 'green' : 'gray'} variant={index === activeStep ? 'filled' : 'light'}>
          {index < activeStep ? <IconCheck size={14} /> : index + 1}
        </Badge>
        <Text size="xs" fw={index === activeStep ? 700 : 500} c={index > activeStep ? 'dimmed' : undefined}>{step.label}</Text>
      </Group>)}
    </SimpleGrid>
  </Paper>;
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function factKey(name, record) {
  return String(record.id);
}

function SectionTable({ name, records, createdFactKeys, addingFactId, onAddFact }) {
  const fields = [...new Set(records.flatMap(record => Object.keys(record)))].filter(field => field !== 'id');
  return <Paper p="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
    <Group justify="space-between" mb="sm">
      <Text fw={700} tt="capitalize">{name.replace(/^sia_/, '').replaceAll('_', ' ')}</Text>
      <Badge color="green" variant="light">{records.length} {records.length === 1 ? 'record' : 'records'}</Badge>
    </Group>
    <Box style={{ overflowX: 'auto' }}>
      <Table verticalSpacing="xs" horizontalSpacing="sm">
        <Table.Thead><Table.Tr>{onAddFact && <Table.Th>SEB item</Table.Th>}{fields.map(field => <Table.Th key={field}><Text size="xs" tt="capitalize">{field.replaceAll('_', ' ')}</Text></Table.Th>)}</Table.Tr></Table.Thead>
        <Table.Tbody>{records.map(record => {
          const key = factKey(name, record);
          const created = createdFactKeys?.has(key);
          return <Table.Tr key={record.id || JSON.stringify(record)}>{onAddFact && <Table.Td><Button size="xs" variant={created ? 'light' : 'filled'} color="green" disabled={created} loading={addingFactId === key} onClick={() => onAddFact(name, record)}>{created ? 'Added' : 'Add to SEB item'}</Button></Table.Td>}{fields.map(field => <Table.Td key={field}><Text size="xs" maw={260} style={{ whiteSpace: 'pre-wrap' }}>{formatValue(record[field])}</Text></Table.Td>)}</Table.Tr>;
        })}</Table.Tbody>
      </Table>
    </Box>
  </Paper>;
}

export default function SEBPreparationLayout() {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState(() => localStorage.getItem('sia_case_id') || '');
  const [siteId, setSiteId] = useState(() => localStorage.getItem('sia_site_id') || '');
  const [baselines, setBaselines] = useState([]);
  const [baselineLoading, setBaselineLoading] = useState(false);
  const [sebForm, setSebForm] = useState(() => ({
    seb_code: autoCode('SEB'),
    assessment_stage: 'INITIAL_ASSESSMENT',
    current_revision_no: '',
    status: 'DRAFT',
  }));
  const [revisionForm, setRevisionForm] = useState({
    revision_no: 'R01',
    previous_revision_id: '',
    revision_reason: '',
    revision_status: 'DRAFT',
    issue_date: '',
  });
  const [baseline, setBaseline] = useState(null);
  const [revision, setRevision] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [sourcePackage, setSourcePackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCase = cases.find(item => item.id === caseId);
  const sites = selectedCase?.sites || [];
  const [activeStep, setActiveStep] = useState(0);
  const [reviewed, setReviewed] = useState(false);
  const [createdFactKeys, setCreatedFactKeys] = useState(new Set());
  const [addingFactId, setAddingFactId] = useState('');
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewItemsLoading, setReviewItemsLoading] = useState(false);
  const [submittedForReview, setSubmittedForReview] = useState(false);
  const [submittingForReview, setSubmittingForReview] = useState(false);

  const loadBaselines = async selectedCaseId => {
    if (!selectedCaseId) {
      setBaselines([]);
      return;
    }
    setBaselineLoading(true);
    try {
      const data = await request(`/seb/baselines?sia_case_id=${encodeURIComponent(selectedCaseId)}`);
      setBaselines(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setBaselineLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setContextLoading(true);
    request('/seb/verified-sia-cases')
      .then(data => {
        if (cancelled) return;
        const availableCases = Array.isArray(data) ? data : [];
        setCases(availableCases);
        const storedCase = localStorage.getItem('sia_case_id') || '';
        if (!availableCases.some(item => item.id === storedCase)) {
          setCaseId('');
          setSiteId('');
          localStorage.removeItem('sia_case_id');
          localStorage.removeItem('sia_site_id');
        }
        if (availableCases.some(item => item.id === storedCase)) loadBaselines(storedCase);
      })
      .catch(loadError => { if (!cancelled) setError(loadError.message); })
      .finally(() => { if (!cancelled) setContextLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedCase) return;
    const storedSite = localStorage.getItem('sia_site_id') || '';
    if (sites.some(site => site.id === storedSite)) setSiteId(storedSite);
    else if (caseId) {
      setSiteId('');
      localStorage.removeItem('sia_site_id');
    }
  }, [caseId, selectedCase]);

  const resetFromContext = () => {
    setReviewed(false);
    setCreatedFactKeys(new Set());
    setReviewItems([]);
    setSubmittedForReview(false);
    localStorage.removeItem('seb_id');
    localStorage.removeItem('seb_revision_id');
    setBaseline(null);
    setRevision(null);
    setRevisions([]);
    setSourcePackage(null);
    setError('');
  };

  const handleCaseChange = value => {
    setCaseId(value || '');
    setSiteId('');
    resetFromContext();
    if (value) localStorage.setItem('sia_case_id', value);
    else localStorage.removeItem('sia_case_id');
    localStorage.removeItem('sia_site_id');
    setBaselines([]);
    setSebForm({ seb_code: autoCode('SEB'), assessment_stage: 'INITIAL_ASSESSMENT', current_revision_no: '', status: 'DRAFT' });
    if (value) loadBaselines(value);
  };

  const handleSiteChange = value => {
    setSiteId(value || '');
    resetFromContext();
    if (value) localStorage.setItem('sia_site_id', value);
    else localStorage.removeItem('sia_site_id');
  };

  const createSeb = async () => {
    setLoading(true);
    setError('');
    try {
      const created = await request('/seb/baselines', {
        method: 'POST',
        body: JSON.stringify({
          sia_case_id: caseId,
          site_id: siteId,
          project_id: selectedCase?.project_id || null,
          seb_code: sebForm.seb_code,
          assessment_stage: sebForm.assessment_stage,
          current_revision_no: sebForm.current_revision_no || null,
          status: sebForm.status,
          created_by: localStorage.getItem('user_id') || 'system',
        }),
      });
      setSebForm({ seb_code: autoCode('SEB'), assessment_stage: 'INITIAL_ASSESSMENT', current_revision_no: '', status: 'DRAFT' });
      setBaseline(created);
      setRevision(null);
      setRevisions([]);
      setSourcePackage(null);
      setCreatedFactKeys(new Set());
      setReviewItems([]);
      setSubmittedForReview(false);
      localStorage.setItem('seb_id', created.id);
      localStorage.removeItem('seb_revision_id');
      setActiveStep(3);
      await loadBaselines(caseId);
      notifications.show({ title: 'SEB created', message: `${created.seb_code} is ready for its initial revision.`, color: 'green' });
    } catch (createError) {
      setError(createError.message);
    } finally {
      setLoading(false);
    }
  };

  const createRevision = async () => {
    if (!baseline) return;
    setLoading(true);
    setError('');
    try {
      const created = await request('/seb/revisions', {
        method: 'POST',
        body: JSON.stringify({
          seb_id: baseline.id,
          revision_no: revisionForm.revision_no,
          previous_revision_id: revisionForm.previous_revision_id || null,
          revision_reason: revisionForm.revision_reason || null,
          revision_status: 'DRAFT',
          issue_date: revisionForm.issue_date || null,
          prepared_by: localStorage.getItem('user_id') || 'system',
        }),
      });
      const fetchedRevisions = await loadRevisions(baseline.id, created.id);
      setRevision(fetchedRevisions.find(item => item.id === created.id) || created);
      localStorage.setItem('seb_revision_id', created.id);
      setActiveStep(4);
      notifications.show({ title: 'Initial revision created', message: 'Draft revision R01 is ready for SIA source data.', color: 'green' });
    } catch (createError) {
      setError(createError.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRevisions = async (sebId, preferredRevisionId = '') => {
    if (!sebId) return [];
    setRevisionLoading(true);
    try {
      const data = await request(`/seb/revisions?seb_id=${encodeURIComponent(sebId)}`);
      const fetchedRevisions = Array.isArray(data) ? data : [];
      setRevisions(fetchedRevisions);
      if (preferredRevisionId) {
        const preferred = fetchedRevisions.find(item => item.id === preferredRevisionId);
        if (preferred) setRevision(preferred);
      }
      return fetchedRevisions;
    } catch (loadError) {
      setError(loadError.message);
      return [];
    } finally {
      setRevisionLoading(false);
    }
  };

  const loadSourceData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await request(`/sia/cases/${encodeURIComponent(caseId)}/sites/${encodeURIComponent(siteId)}/completion`);
      setSourcePackage(data);
      setReviewed(false);
      const existingItems = await request(`/seb/items?seb_revision_id=${encodeURIComponent(revision.id)}`);
      setCreatedFactKeys(new Set((Array.isArray(existingItems) ? existingItems : [])
        .map(item => item.fact_id)
        .filter(Boolean)));
      setActiveStep(5);
      notifications.show({ title: 'SIA source data loaded', message: 'Review the returned SIA sections below.', color: 'green' });
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  const addFactToSeb = async (name, record) => {
    if (!revision || !baseline) return;
    if (revision.revision_no !== 'R01') {
      setError('Engineering facts can only be created under the initial R01 revision from this workflow.');
      return;
    }
    const key = factKey(name, record);
    setAddingFactId(key);
    setError('');
    try {
      await request('/seb/items', {
        method: 'POST',
        body: JSON.stringify({ fact_id: record.id, seb_id: baseline.id, seb_revision_id: revision.id, status: 'review' }),
      });
      setCreatedFactKeys(current => new Set(current).add(key));
      notifications.show({ title: 'SEB item added', message: `The selected fact is now an item under ${revision.revision_no}.`, color: 'green' });
    } catch (createError) {
      setError(createError.message);
    } finally {
      setAddingFactId('');
    }
  };

  const loadReviewItems = async () => {
    if (!baseline || !revision) return;
    setReviewItemsLoading(true);
    setError('');
    try {
      const items = await request(`/seb/items/review?seb_id=${encodeURIComponent(baseline.id)}&seb_revision_id=${encodeURIComponent(revision.id)}`);
      setReviewItems(Array.isArray(items) ? items : []);
      setActiveStep(6);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setReviewItemsLoading(false);
    }
  };

  const submitForEngineeringReview = async () => {
    if (!baseline || !revision) return;
    setSubmittingForReview(true);
    setError('');
    try {
      const updatedRevision = await request(`/seb/revisions/${encodeURIComponent(revision.id)}/submit-engineering-review`, {
        method: 'POST',
        body: JSON.stringify({ seb_id: baseline.id }),
      });
      setRevision(updatedRevision);
      setSubmittedForReview(true);
      notifications.show({ title: 'R01 submitted', message: `${updatedRevision.revision_no} is now in engineering review.`, color: 'green' });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmittingForReview(false);
    }
  };

  const sourceSections = Object.entries(sourcePackage?.modules || {}).filter(([name]) => !['sia_case', 'sia_site'].includes(name));

  const selectedSite = sites.find(item => item.id === siteId);
  const canContinue = [Boolean(selectedCase), Boolean(selectedSite), Boolean(baseline), Boolean(revision), Boolean(sourcePackage), reviewed, reviewItems.length > 0][activeStep];
  const busy = loading || contextLoading || baselineLoading || revisionLoading || reviewItemsLoading || submittingForReview;
  const descriptions = [
    'Choose a verified SIA case as the source for your engineering baseline.',
    'Choose the site you want to prepare. All following records will use this site.',
    'Create a new baseline or select an existing SEB for this site.',
    'Create the initial revision or continue with an existing revision.',
    'Load the selected case and site information for your review.',
    'Review each SIA section, select the facts needed for engineering, then create a traceable SEB item for every selection.',
    'Confirm the SEB items created from SIA facts before sending the revision for engineering review.',
    'Submit the reviewed R01 revision to the engineering review stage.',
  ];

  return <Box p={{ base: 'sm', sm: 'lg' }} maw={1200} mx="auto">
    <Box mb="xl">
      <Group gap="sm" mb={8}><Badge color="green" variant="light">SEP</Badge><Text size="xs" c="dimmed">Site Engineering Preparation / Module 2</Text></Group>
      <Title order={2}>SEB Preparation</Title>
      <Text size="sm" c="dimmed" mt={4}>Build an initial SEB revision from verified SIA source data.</Text>
    </Box>
    <Workflow activeStep={activeStep} />
    <Paper withBorder radius="md" p="md" mb="lg">
      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        {[
          ['SIA case', selectedCase?.case_code], ['Site', selectedSite?.site_name || selectedSite?.site_code],
          ['SEB', baseline?.seb_code], ['Revision', revision?.revision_no],
        ].map(([label, value]) => <Box key={label}><Text size="xs" c="dimmed" mb={4}>{label}</Text><Text size="sm" fw={600} style={{ overflowWrap: 'anywhere' }}>{value || 'Not selected'}</Text></Box>)}
      </SimpleGrid>
    </Paper>
    {error && <Alert color="red" title="Unable to complete this step" mb="md" role="alert">{error}</Alert>}
    <Paper withBorder radius="md" p={{ base: 'md', sm: 'xl' }}>
      <Text size="xs" fw={700} c="green.8" tt="uppercase">Step {activeStep + 1}</Text>
      <Title order={3} mt={4}>{STEPS[activeStep].label}</Title>
      <Text size="sm" c="dimmed" mt={6} mb="xl">{descriptions[activeStep]}</Text>
      <Box component="fieldset" disabled={busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        {activeStep === 0 && <Stack>
          <Select label="Verified SIA case" placeholder={contextLoading ? 'Loading verified cases...' : 'Select a case'} data={cases.map(item => ({ value: item.id, label: item.case_code || item.id }))} value={caseId || null} onChange={handleCaseChange} searchable clearable disabled={contextLoading} />
          {!contextLoading && !cases.length && <Alert color="yellow">No verified cases available. Complete and verify a case in SIA Completion / SEB Input first.</Alert>}
        </Stack>}
        {activeStep === 1 && <Stack>
          <Select label="Site" placeholder="Select a site" data={sites.map(item => ({ value: item.id, label: `${item.site_code || item.id} / ${item.site_name || 'Unnamed site'}` }))} value={siteId || null} onChange={handleSiteChange} searchable clearable />
          {!sites.length && <Alert color="yellow">No sites are available for this case. Go back and select another case.</Alert>}
        </Stack>}
        {activeStep === 2 && <Box style={{ overflowX: 'auto' }}>
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <TextInput label="SEB Code" value={sebForm.seb_code} onChange={event => setSebForm(current => ({ ...current, seb_code: event.currentTarget.value }))} />
        <Select label="Assessment Stage" data={ASSESSMENT_STAGES} value={sebForm.assessment_stage} onChange={value => setSebForm(current => ({ ...current, assessment_stage: value || '' }))} />
        <TextInput label="Current Revision No" placeholder="Optional" value={sebForm.current_revision_no} onChange={event => setSebForm(current => ({ ...current, current_revision_no: event.currentTarget.value }))} />
        <Select label="Status" data={BASELINE_STATUSES} value={sebForm.status} onChange={value => setSebForm(current => ({ ...current, status: value || 'DRAFT' }))} />
      </SimpleGrid>
      <Button mt="md" color="green" leftSection={<IconFilePlus size={15} />} onClick={createSeb} disabled={!sebForm.seb_code.trim()} loading={loading}>Create SEB</Button>

      <Group justify="space-between" mt="xl" mb="sm">
        <Box><Text size="xs" fw={700} c="#007336" tt="uppercase">Select SEB</Text><Text size="sm" c="dimmed">Existing SEBs for the selected site</Text></Box>
        <Button size="xs" variant="subtle" color="green" leftSection={<IconRefresh size={14} />} onClick={() => loadBaselines(caseId)} loading={baselineLoading}>Reload SEBs</Button>
      </Group>
      {baselineLoading ? <Loader size="sm" color="green" /> : baselines.filter(item => item.site_id === siteId).length === 0 ? <Text size="sm" c="dimmed">No SEBs for this site yet. Create one above to continue.</Text> : (
        <Table highlightOnHover withTableBorder>
          <Table.Thead><Table.Tr><Table.Th>Select</Table.Th><Table.Th>SEB Code</Table.Th><Table.Th>Site ID</Table.Th><Table.Th>Assessment Stage</Table.Th><Table.Th>Revision</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>{baselines.filter(item => item.site_id === siteId).map(item => <Table.Tr key={item.id} style={{ cursor: 'pointer', backgroundColor: baseline?.id === item.id ? '#f0fdf4' : undefined }}>
            <Table.Td><Button size="xs" variant="light" color="green" onClick={() => { setBaseline(item); setRevision(null); setRevisions([]); setSourcePackage(null); setReviewed(false); setSelectedFactKeys(new Set()); setCreatedFactKeys(new Set()); localStorage.setItem('seb_id', item.id); localStorage.removeItem('seb_revision_id'); loadRevisions(item.id); }}>{baseline?.id === item.id ? 'Selected' : 'Select'}</Button></Table.Td><Table.Td><Text size="sm" fw={700} c="#007336">{item.seb_code}</Text></Table.Td><Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{item.site_id || '—'}</Text></Table.Td><Table.Td>{item.assessment_stage || '—'}</Table.Td><Table.Td>{item.current_revision_no || '—'}</Table.Td><Table.Td><Badge color={item.status === 'DRAFT' ? 'gray' : 'green'} variant="light">{item.status || '—'}</Badge></Table.Td>
          </Table.Tr>)}</Table.Tbody>
        </Table>
      )}
        </Box>}
        {activeStep === 3 && baseline && <Box style={{ overflowX: 'auto' }}>
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <TextInput label="Revision No" value={revisionForm.revision_no} onChange={event => setRevisionForm(current => ({ ...current, revision_no: event.currentTarget.value }))} />
          <Select label="Revision Status" data={['DRAFT']} value="DRAFT" disabled description="Initial revisions are always created as drafts." />
          <TextInput label="Issue Date" type="date" value={revisionForm.issue_date} onChange={event => setRevisionForm(current => ({ ...current, issue_date: event.currentTarget.value }))} />
          <TextInput label="Previous Revision ID" placeholder="Optional" value={revisionForm.previous_revision_id} onChange={event => setRevisionForm(current => ({ ...current, previous_revision_id: event.currentTarget.value }))} />
        </SimpleGrid>
        <TextInput mt="md" label="Revision Reason" placeholder="Optional" value={revisionForm.revision_reason} onChange={event => setRevisionForm(current => ({ ...current, revision_reason: event.currentTarget.value }))} />
        <Button mt="md" size="sm" color="green" leftSection={<IconGitBranch size={15} />} onClick={createRevision} disabled={Boolean(revision) || !revisionForm.revision_no} loading={loading}>Create Initial Revision R01</Button>
        <Group justify="space-between" mt="xl" mb="sm">
          <Box><Text size="xs" fw={700} c="#007336" tt="uppercase">Select Revision</Text><Text size="sm" c="dimmed">Revisions for {baseline.seb_code}</Text></Box>
          <Button size="xs" variant="subtle" color="green" leftSection={<IconRefresh size={14} />} onClick={() => loadRevisions(baseline.id)} loading={revisionLoading}>Reload Revisions</Button>
        </Group>
        {revisionLoading ? <Loader size="sm" color="green" /> : revisions.length > 0 && <Table highlightOnHover withTableBorder>
          <Table.Thead><Table.Tr><Table.Th>Select</Table.Th><Table.Th>Revision No</Table.Th><Table.Th>Status</Table.Th><Table.Th>Issue Date</Table.Th><Table.Th>Prepared By</Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>{revisions.map(item => <Table.Tr key={item.id} style={{ cursor: 'pointer', backgroundColor: revision?.id === item.id ? '#f0fdf4' : undefined }}>
            <Table.Td><Button size="xs" variant="light" color="green" onClick={() => { setRevision(item); setSourcePackage(null); setReviewed(false); setSelectedFactKeys(new Set()); setCreatedFactKeys(new Set()); localStorage.setItem('seb_revision_id', item.id); }}>{revision?.id === item.id ? 'Selected' : 'Select'}</Button></Table.Td><Table.Td><Text size="sm" fw={700} c="#007336">{item.revision_no}</Text></Table.Td><Table.Td>{item.revision_status || '—'}</Table.Td><Table.Td>{item.issue_date || '—'}</Table.Td><Table.Td>{item.prepared_by || '—'}</Table.Td>
          </Table.Tr>)}</Table.Tbody>
        </Table>}
        </Box>}
        {activeStep === 4 && <Paper p="xl" radius="md" bg="gray.0" ta="center">
          <IconDatabaseImport size={36} color="#007336" />
          <Text fw={600} mt="sm">Your revision is ready for source review</Text>
          <Text size="sm" c="dimmed" mt={6} mb="lg">Load the SIA records for {selectedSite?.site_name || selectedSite?.site_code || siteId}.</Text>
          <Button color="green" leftSection={<IconDatabaseImport size={16} />} onClick={loadSourceData} loading={loading}>Load SIA source data</Button>
        </Paper>}
        {activeStep === 5 && sourcePackage && <Stack>
          <Group justify="space-between"><Group gap="xs"><Badge color="green" variant="light">{sourceSections.length} source sections loaded</Badge><Badge color="green" variant="light">{createdFactKeys.size} SEB items added</Badge></Group><Button variant="subtle" color="green" leftSection={<IconRefresh size={15} />} onClick={loadSourceData} loading={loading}>Reload source data</Button></Group>
          <Alert color="blue" title="Add important engineering facts">Use the Add to SEB item button beside a fact to create an item under R01 with status <Text span fw={700}>review</Text>.</Alert>
          {sourceSections.length === 0 ? <Alert color="yellow">No SIA source sections were returned. Check the source case before continuing.</Alert> : <Accordion variant="separated" radius="md" multiple>
            {sourceSections.map(([name, records]) => <Accordion.Item key={name} value={name}>
              <Accordion.Control><Group justify="space-between" pr="sm"><Text tt="capitalize" size="sm" fw={600}>{name.replace(/^sia_/, '').replaceAll('_', ' ')}</Text><Badge color="gray" variant="light">{records.length} records</Badge></Group></Accordion.Control>
              <Accordion.Panel><SectionTable name={name} records={records} createdFactKeys={createdFactKeys} addingFactId={addingFactId} onAddFact={addFactToSeb} /></Accordion.Panel>
            </Accordion.Item>)}
          </Accordion>}
          {revision?.revision_no !== 'R01' && <Alert color="yellow">Select the initial R01 revision to create engineering facts from SIA source records.</Alert>}
          <Checkbox mt="md" color="green" checked={reviewed} disabled={!sourceSections.length} onChange={event => setReviewed(event.currentTarget.checked)} label="I have reviewed the SIA source sections and added the required facts as SEB items." description="Each added item is linked to this R01 revision with status review." />
          {reviewed && <Alert color="green" title="Engineering facts added to SEB" icon={<IconCheck size={18} />}>{createdFactKeys.size} source facts are now traceable SEB items under revision {revision?.revision_no}.</Alert>}
        </Stack>}
        {activeStep === 6 && <Stack>
          <Group justify="space-between"><Box><Text fw={600}>Review-status SEB items</Text><Text size="sm" c="dimmed">Items for {baseline?.seb_code} / {revision?.revision_no}</Text></Box><Button size="sm" variant="light" color="green" leftSection={<IconRefresh size={15} />} onClick={loadReviewItems} loading={reviewItemsLoading}>Reload items</Button></Group>
          {reviewItemsLoading ? <Group justify="center" py="xl"><Loader size="sm" color="green" /><Text size="sm" c="dimmed">Loading review items…</Text></Group> : reviewItems.length === 0 ? <Alert color="yellow">No items with status review were found for this SEB revision. Return to Step 6 and add at least one fact.</Alert> : <Table withTableBorder highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Fact ID</Table.Th><Table.Th>SEB ID</Table.Th><Table.Th>Revision ID</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>{reviewItems.map(item => <Table.Tr key={item.id}><Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{item.fact_id}</Text></Table.Td><Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{item.seb_id}</Text></Table.Td><Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{item.seb_revision_id}</Text></Table.Td><Table.Td><Badge color="blue" variant="light">{item.status}</Badge></Table.Td></Table.Tr>)}</Table.Tbody>
          </Table>}
        </Stack>}
        {activeStep === 7 && <Paper p="xl" radius="md" bg="gray.0" ta="center">
          <IconSend size={36} color="#007336" />
          <Text fw={600} mt="sm">Submit {revision?.revision_no} for engineering review</Text>
          <Text size="sm" c="dimmed" mt={6} mb="lg">{reviewItems.length} review-status SEB {reviewItems.length === 1 ? 'item is' : 'items are'} ready for engineering review.</Text>
          {submittedForReview ? <Alert color="green" title="Submitted for engineering review">Revision {revision?.revision_no} is now in review.</Alert> : <Button color="green" leftSection={<IconSend size={16} />} onClick={submitForEngineeringReview} loading={submittingForReview} disabled={!reviewItems.length}>Submit R01 for Engineering Review</Button>}
        </Paper>}
      </Box>
      <Group justify="space-between" mt="xl" pt="lg" style={{ borderTop: '1px solid #e5e7eb' }}>
        <Button variant="default" leftSection={<IconArrowLeft size={16} />} disabled={activeStep === 0 || busy} onClick={() => setActiveStep(current => current - 1)}>Back</Button>
        {activeStep < 7 ? <Button color="green" rightSection={<IconArrowRight size={16} />} disabled={!canContinue || busy} onClick={activeStep === 5 ? loadReviewItems : () => setActiveStep(current => current + 1)}>{activeStep === 5 ? 'Review SEB items' : 'Continue'}</Button> : <Text size="sm" c={submittedForReview ? 'green.8' : 'dimmed'} role="status">{submittedForReview ? 'Submitted for review' : 'Submit R01 to finish'}</Text>}
      </Group>
    </Paper>
  </Box>;
}
