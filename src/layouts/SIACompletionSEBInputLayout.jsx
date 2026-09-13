import { useEffect, useState } from 'react';
import {
  Alert, Badge, Box, Button, Checkbox, Divider, Grid, Group, Loader,
  Paper, Stack, Table, Text, Textarea, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle, IconCheck, IconCircleCheck, IconFileCheck,
  IconRefresh, IconSend, IconShieldCheck,
} from '@tabler/icons-react';

const API = '/api';

const WORKFLOW_STEPS = [
  { label: 'Select case & site', icon: IconFileCheck },
  { label: 'Review SIA data', icon: IconFileCheck },
  { label: 'Confirm completeness', icon: IconCircleCheck },
  { label: 'Confirm SEB readiness', icon: IconShieldCheck },
  { label: 'Send to SEB', icon: IconSend },
];

function StepRail({ selected, complete }) {
  return (
    <Group gap={0} wrap="nowrap" style={{ overflowX: 'auto' }}>
      {WORKFLOW_STEPS.map((step, index) => {
        const Icon = step.icon;
        const done = complete[index];
        const active = selected === index;
        return (
          <Group key={step.label} gap={8} wrap="nowrap" style={{ minWidth: 155 }}>
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
            {index < WORKFLOW_STEPS.length - 1 && <Box style={{ width: 28, height: 1, backgroundColor: done ? '#86efac' : '#e5e7eb', marginLeft: 4 }} />}
          </Group>
        );
      })}
    </Group>
  );
}

function formatLabel(value) {
  return value.replace(/^sia_/, '').replaceAll('_', ' ');
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function ModuleTable({ name, records }) {
  const columns = [...new Set(records.flatMap(record => Object.keys(record)))].filter(key => key !== 'id');
  return (
    <Paper p="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <Group justify="space-between" mb="sm">
        <Text fw={700} tt="capitalize">{formatLabel(name)}</Text>
        <Badge variant="light" color="green">{records.length} {records.length === 1 ? 'record' : 'records'}</Badge>
      </Group>
      <Box style={{ overflowX: 'auto' }}>
        <Table withTableBorder withColumnBorders="false" verticalSpacing="xs" horizontalSpacing="sm">
          <Table.Thead><Table.Tr>{columns.map(column => <Table.Th key={column}><Text size="xs" tt="capitalize">{formatLabel(column)}</Text></Table.Th>)}</Table.Tr></Table.Thead>
          <Table.Tbody>{records.map(record => <Table.Tr key={record.id || JSON.stringify(record)}>{columns.map(column => <Table.Td key={column}><Text size="xs" maw={260} style={{ whiteSpace: 'pre-wrap' }}>{formatValue(record[column])}</Text></Table.Td>)}</Table.Tr>)}</Table.Tbody>
        </Table>
      </Box>
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
  const canSend = Boolean(packageData && completeConfirmed && readinessConfirmed && !sent);
  const step = !packageData ? 0 : !completeConfirmed ? 1 : !readinessConfirmed ? 3 : 4;
  const complete = [Boolean(packageData), Boolean(packageData && completeConfirmed), completeConfirmed, readinessConfirmed, sent];
  const caseRecord = packageData?.case || {};
  const siteRecord = packageData?.site || {};

  const handleSend = async () => {
    if (!caseId || !siteId) return;
    try {
      const response = await fetch(`${API}/sia/cases/${encodeURIComponent(caseId)}/sites/${encodeURIComponent(siteId)}/completion/verify`, {
        method: 'POST',
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Unable to verify SIA package (HTTP ${response.status})`);
      }
      const verifiedPackage = await response.json();
      setPackageData(current => current ? { ...current, case: verifiedPackage.case, site: verifiedPackage.site } : current);
      setSent(true);
      notifications.show({ title: 'SIA package verified', message: 'The case and site are now marked as verified for SEB input.', color: 'green' });
    } catch (verifyError) {
      notifications.show({ title: 'Verification failed', message: verifyError.message, color: 'red' });
    }
  };

  return (
    <Box p="lg" maw={1180} mx="auto">
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

      <Paper p="lg" mb="lg" style={{ border: '1px solid #d1d5db', borderRadius: 8 }}>
        <Group justify="space-between" align="flex-start" mb="md">
          <Box>
            <Text size="xs" fw={700} c="#007336" tt="uppercase">1. Load source records</Text>
            <Text fw={700} size="lg" c="#111827" mt={3}>Active SIA context</Text>
          </Box>
          <Button size="xs" variant="subtle" color="green" leftSection={<IconRefresh size={14} />} onClick={() => loadPackage()} loading={loading}>Reload package</Button>
        </Group>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}><Text size="xs" c="dimmed">SIA case ID</Text><Text size="sm" fw={700} style={{ fontFamily: 'monospace' }}>{caseId || 'Not set'}</Text></Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}><Text size="xs" c="dimmed">Site ID</Text><Text size="sm" fw={700} style={{ fontFamily: 'monospace' }}>{siteId || 'Not set'}</Text></Grid.Col>
        </Grid>
        {loading && <Group justify="center" mt="lg"><Loader color="green" size="sm" /><Text size="sm" c="dimmed">Loading all SIA module data...</Text></Group>}
        {error && <Alert mt="md" color="red" icon={<IconAlertCircle size={16} />}>{error}</Alert>}
      </Paper>

      {packageData && <Stack gap="lg">
        <Paper p="lg" style={{ border: '1px solid #d1d5db', borderRadius: 8 }}>
          <Text size="xs" fw={700} c="#007336" tt="uppercase">2. Review SIA information</Text>
          <Title order={3} mt={3}>{caseRecord.case_code || caseId}</Title>
          <Text size="sm" c="dimmed" mt={3}>{siteRecord.site_name || siteRecord.site_code || siteId} {siteRecord.address ? `· ${siteRecord.address}` : ''}</Text>
          <Divider my="md" />
          <Grid>
            {[["Case", caseRecord], ["Site", siteRecord]].map(([label, record]) => <Grid.Col key={label} span={{ base: 12, md: 6 }}>
              <Text size="sm" fw={700} mb="xs">{label} record</Text>
              <Stack gap={4}>{Object.entries(record).filter(([key]) => key !== 'id').map(([key, value]) => <Group key={key} justify="space-between" gap="md" wrap="nowrap"><Text size="xs" c="dimmed" tt="capitalize">{formatLabel(key)}</Text><Text size="xs" fw={600} ta="right">{formatValue(value)}</Text></Group>)}</Stack>
            </Grid.Col>)}
          </Grid>
          <Textarea mt="md" label="Review notes" placeholder="Add local review notes" value={notes} onChange={event => setNotes(event.currentTarget.value)} autosize minRows={2} />
          <Text size="xs" c="dimmed" mt="xs">Editing is local for now. No edit API is connected.</Text>
        </Paper>

        {moduleEntries.length > 0 ? moduleEntries.map(([name, records]) => <ModuleTable key={name} name={name} records={records} />) : <Alert color="yellow">No related SIA module records were returned for this case and site.</Alert>}

        <Paper p="lg" style={{ border: '1px solid #d1d5db', borderRadius: 8 }}>
          <Text size="xs" fw={700} c="#007336" tt="uppercase">3-4. Confirm readiness</Text>
          <Text fw={700} size="lg" mt={3} mb="md">Confirm this package before sending it to SEB</Text>
          <Stack gap="md">
            <Checkbox checked={completeConfirmed} onChange={event => setCompleteConfirmed(event.currentTarget.checked)} disabled={sent} label="I confirm the SIA information for this case and site is complete and accurate." />
            <Checkbox checked={readinessConfirmed} onChange={event => setReadinessConfirmed(event.currentTarget.checked)} disabled={!completeConfirmed || sent} label="I confirm this SIA package is ready for SEB input." />
          </Stack>
          <Divider my="md" />
          <Group justify="flex-end"><Button color="green" leftSection={sent ? <IconCheck size={16} /> : <IconSend size={16} />} disabled={!canSend} onClick={handleSend} style={{ backgroundColor: canSend ? '#007336' : undefined }}>{sent ? 'Verified for SEB' : 'Confirm package for SEB'}</Button></Group>
        </Paper>
      </Stack>}
    </Box>
  );
}
