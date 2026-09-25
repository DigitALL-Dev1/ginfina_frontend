import { useEffect, useState } from 'react';
import {
  Alert, Badge, Box, Button, Checkbox, Divider, Grid, Group, Loader,
  Paper, Progress, Stack, Table, Text, Textarea, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle, IconCheck, IconCircleCheck, IconFileCheck,
  IconRefresh, IconSend, IconShieldCheck, IconFileText,
} from '@tabler/icons-react';
import SIACompletionReport from '../components/common/SIACompletionReport';
import { recordFields, validateCompletionPackage } from '../utils/siaCompletionReport';
import { completionRecordName, displayRecord } from '../utils/siaRecordDisplay';
import styles from './SIACompletionSEBInputLayout.module.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

const WORKFLOW_STEPS = [
  { label: 'Select case & site', icon: IconFileCheck },
  { label: 'Review SIA data', icon: IconFileCheck },
  { label: 'Confirm completeness', icon: IconCircleCheck },
  { label: 'Confirm SEB readiness', icon: IconShieldCheck },
  { label: 'Send to SEB', icon: IconSend },
  { label: 'Report', icon: IconFileText },
];

function StepRail({ selected, complete }) {
  return (
    <>
    <Box className={styles.compactProgress} aria-label="Completion progress">
      <Text size="xs" c="dimmed" mb={4}>Step {selected + 1} of {WORKFLOW_STEPS.length}</Text>
      <Text size="sm" fw={700} mb="sm" aria-live="polite">{WORKFLOW_STEPS[selected].label}</Text>
      <Progress color="green" size="sm" value={((selected + 1) / WORKFLOW_STEPS.length) * 100} aria-label="Current completion step" />
    </Box>
    <Box className={styles.stepRail} aria-label="Completion steps">
      {WORKFLOW_STEPS.map((step, index) => {
        const Icon = step.icon;
        const done = complete[index];
        const active = selected === index;
        return (
          <Group key={step.label} gap={8} wrap="nowrap" style={{ minWidth: 0 }} aria-current={active ? 'step' : undefined}>
            <Box style={{
              width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
              backgroundColor: done ? '#007336' : active ? '#e6f4ec' : '#f3f4f6',
              color: done ? '#fff' : active ? '#007336' : '#9ca3af',
              border: active ? '2px solid #007336' : '1px solid #e5e7eb',
            }}>
              {done ? <IconCheck size={16} /> : <Icon size={16} />}
            </Box>
            <Text size="xs" fw={active || done ? 700 : 500} c={active || done ? '#111827' : '#6b7280'}>
              {step.label}
            </Text>
          </Group>
        );
      })}
    </Box>
    </>
  );
}

function formatLabel(value) {
  return value.replace(/^sia_/, '').replaceAll('_', ' ');
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return recordFields({ details: displayRecord(value) })
    .map(field => `${field.label.replace(/^Details\s*\/\s*/, '')}: ${field.value}`).join('\n');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function ModuleTable({ name, records }) {
  const displayRecords = records.map(displayRecord);
  const columns = [...new Set(displayRecords.flatMap(record => Object.keys(record)))];
  return (
    <Paper p={{ base: 'sm', sm: 'md' }} style={{ border: '1px solid #e5e7eb', borderRadius: 8, minWidth: 0 }}>
      <Group justify="space-between" mb="sm">
        <Text fw={700} tt="capitalize">{formatLabel(name)}</Text>
        <Badge variant="light" color="green">{records.length} {records.length === 1 ? 'record' : 'records'}</Badge>
      </Group>
      {records.length === 0 ? <Text size="sm" c="dimmed">No records returned for this module.</Text> : !columns.length ? <Text size="sm" c="dimmed">Records are linked. No additional details are available.</Text> : <Box className={styles.tableViewport} role="region" aria-label={`${formatLabel(name)} records`} tabIndex={0}>
        <Table className={styles.recordTable} style={{ '--module-table-width': `${Math.max(700, columns.length * 140)}px` }} withTableBorder withColumnBorders={false} verticalSpacing="xs" horizontalSpacing="sm">
          <Table.Thead><Table.Tr>{columns.map(column => <Table.Th key={column}><Text size="xs" tt="capitalize">{formatLabel(column)}</Text></Table.Th>)}</Table.Tr></Table.Thead>
          <Table.Tbody>{displayRecords.map((record, index) => <Table.Tr key={records[index].id || index}>{columns.map(column => <Table.Td key={column} data-label={formatLabel(column)}><Text size="xs" style={{ whiteSpace: 'pre-wrap' }}>{formatValue(record[column])}</Text></Table.Td>)}</Table.Tr>)}</Table.Tbody>
        </Table>
      </Box>}
    </Paper>
  );
}

export default function SIACompletionSEBInputLayout() {
  const [caseId, setCaseId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completeConfirmed, setCompleteConfirmed] = useState(false);
  const [readinessConfirmed, setReadinessConfirmed] = useState(false);
  const [sent, setSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notes, setNotes] = useState('');

  const loadPackage = async (storedCaseId = caseId, storedSiteId = siteId) => {
    if (!storedCaseId || !storedSiteId) {
      setError('No active SIA case and site were found in storage. Select a case and site in the SIA setup screens first.');
      setPackageData(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/sia/cases/${encodeURIComponent(storedCaseId)}/sites/${encodeURIComponent(storedSiteId)}/completion`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Unable to load SIA package (HTTP ${response.status})`);
      }
      const data = await response.json();
      validateCompletionPackage(data, storedCaseId, storedSiteId);
      setPackageData(data);
      setCompleteConfirmed(false);
      setReadinessConfirmed(false);
      setSent(false);
    } catch (loadError) {
      setError(loadError.message);
      setPackageData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedCaseId = localStorage.getItem('sia_case_id') || '';
    const storedSiteId = localStorage.getItem('sia_site_id') || '';
    setCaseId(storedCaseId);
    setSiteId(storedSiteId);
    loadPackage(storedCaseId, storedSiteId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const modules = packageData?.modules || {};
  const moduleEntries = Object.entries(modules);
  const canSend = Boolean(packageData && completeConfirmed && readinessConfirmed && !sent && !loading && !verifying);
  const step = !packageData ? 0 : sent ? 5 : !completeConfirmed ? 1 : !readinessConfirmed ? 3 : 4;
  const complete = [Boolean(packageData), Boolean(packageData && completeConfirmed), completeConfirmed, readinessConfirmed, sent];
  const caseRecord = packageData?.case || {};
  const siteRecord = packageData?.site || {};

  const handleSend = async () => {
    if (!caseId || !siteId || !canSend) return;
    setVerifying(true);
    try {
      const response = await fetch(`${API}/sia/cases/${encodeURIComponent(caseId)}/sites/${encodeURIComponent(siteId)}/completion/verify`, {
        method: 'POST',
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Unable to verify SIA package (HTTP ${response.status})`);
      }
      const verifiedPackage = await response.json();
      if (verifiedPackage.case?.id !== caseId || verifiedPackage.site?.id !== siteId || verifiedPackage.site?.sia_case_id !== caseId) throw new Error('The verification response does not match the active case and site. Reload the package to check its saved status.');
      setPackageData(current => current ? { ...current, case: verifiedPackage.case, site: verifiedPackage.site } : current);
      setSent(true);
      notifications.show({ title: 'SIA package verified', message: 'The case and site are now marked as verified for SEB input.', color: 'green' });
    } catch (verifyError) {
      notifications.show({ title: 'Verification failed', message: verifyError.message, color: 'red' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Box className={styles.root} p={{ base: 'sm', sm: 'lg' }} maw={1180} mx="auto">
      <Box mb="xl">
        <Group gap="sm" mb={6}>
          <Badge color="green" variant="light" size="lg" radius="sm">SIA</Badge>
          <Text size="xs" c="dimmed" fw={600}>Module 1 · Section 6</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">SIA Completion / SEB Input</Title>
        <Text size="sm" c="#6b7280" mt={5}>Review the stored SIA case and site package before confirming readiness for SEB.</Text>
      </Box>

      <Paper p="md" mb="lg" style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fbfdfc' }}>
        <StepRail selected={step} complete={complete} />
      </Paper>

      <Paper p={{ base: 'sm', sm: 'lg' }} mb="lg" style={{ border: '1px solid #d1d5db', borderRadius: 8 }}>
        <Group className={styles.actions} justify="space-between" align="flex-start" mb="md">
          <Box>
            <Text size="xs" fw={700} c="#007336" tt="uppercase">1. Load source records</Text>
            <Text fw={700} size="lg" c="#111827" mt={3}>Active SIA context</Text>
          </Box>
          <Button size="xs" variant="subtle" color="green" leftSection={<IconRefresh size={14} />} onClick={() => loadPackage()} loading={loading} disabled={verifying}>Reload package</Button>
        </Group>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}><Text size="xs" c="dimmed">SIA case</Text><Text size="sm" fw={700}>{packageData ? completionRecordName(caseRecord, 'case') : loading ? 'Loading case details…' : 'Case details unavailable'}</Text></Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}><Text size="xs" c="dimmed">Site</Text><Text size="sm" fw={700}>{packageData ? completionRecordName(siteRecord, 'site') : loading ? 'Loading site details…' : 'Site details unavailable'}</Text></Grid.Col>
        </Grid>
        {loading && <Group justify="center" mt="lg"><Loader color="green" size="sm" /><Text size="sm" c="dimmed">Loading all SIA module data...</Text></Group>}
        {error && <Alert mt="md" color="red" icon={<IconAlertCircle size={16} />}>{error}</Alert>}
      </Paper>

      {packageData && <Stack gap="lg">
        <Paper p={{ base: 'sm', sm: 'lg' }} style={{ border: '1px solid #d1d5db', borderRadius: 8 }}>
          <Text size="xs" fw={700} c="#007336" tt="uppercase">2. Review SIA information</Text>
          <Title order={3} mt={3}>{completionRecordName(caseRecord, 'case')}</Title>
          <Text size="sm" c="dimmed" mt={3}>{completionRecordName(siteRecord, 'site')} {siteRecord.address ? `· ${siteRecord.address}` : ''}</Text>
          <Divider my="md" />
          <Grid>
            {[["Case", caseRecord], ["Site", siteRecord]].map(([label, record]) => <Grid.Col key={label} span={{ base: 12, md: 6 }}>
              <Text size="sm" fw={700} mb="xs">{label} record</Text>
              <Stack gap={4}>{Object.entries(displayRecord(record)).map(([key, value]) => <Box key={key} className={styles.recordField}><Text size="xs" c="dimmed" tt="capitalize">{formatLabel(key)}</Text><Text className={styles.recordValue} size="xs" fw={600}>{formatValue(value)}</Text></Box>)}</Stack>
            </Grid.Col>)}
          </Grid>
          <Textarea mt="md" label="Review notes" placeholder="Add local review notes" value={notes} onChange={event => setNotes(event.currentTarget.value)} autosize minRows={2} />
          <Text size="xs" c="dimmed" mt="xs">Editing is local for now. No edit API is connected.</Text>
        </Paper>

        {moduleEntries.length > 0 ? moduleEntries.map(([name, records]) => <ModuleTable key={name} name={name} records={records} />) : <Alert color="yellow">No related SIA module records were returned for this case and site.</Alert>}

        <Paper p={{ base: 'sm', sm: 'lg' }} style={{ border: '1px solid #d1d5db', borderRadius: 8 }}>
          <Text size="xs" fw={700} c="#007336" tt="uppercase">3-4. Confirm readiness</Text>
          <Text fw={700} size="lg" mt={3} mb="md">Confirm this package before sending it to SEB</Text>
          <Stack className={styles.confirmation} gap="md">
            <Checkbox checked={completeConfirmed} onChange={event => setCompleteConfirmed(event.currentTarget.checked)} disabled={sent} label="I confirm the SIA information for this case and site is complete and accurate." />
            <Checkbox checked={readinessConfirmed} onChange={event => setReadinessConfirmed(event.currentTarget.checked)} disabled={!completeConfirmed || sent} label="I confirm this SIA package is ready for SEB input." />
          </Stack>
          <Divider my="md" />
          <Group className={styles.actions} justify="flex-end"><Button color="green" leftSection={sent ? <IconCheck size={16} /> : <IconSend size={16} />} loading={verifying} disabled={!canSend} onClick={handleSend} style={{ backgroundColor: canSend ? '#007336' : undefined }}>{sent ? 'Verified for SEB' : 'Confirm package for SEB'}</Button></Group>
        </Paper>
        <SIACompletionReport packageData={packageData} caseId={caseId} siteId={siteId} notes={notes}
          completeConfirmed={completeConfirmed} readinessConfirmed={readinessConfirmed} busy={loading || verifying} />
      </Stack>}
    </Box>
  );
}
