import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { buildSebEwpHandoffReport } from '../../utils/sebEwpHandoffReport';
import { downloadSiaReport } from '../../utils/siaCaseReport';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

export default function SEBEwpHandoffReport({ handoff, snapshot, acceptance, sebId, revisionId }) {
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setDownloadError('');
    async function load() {
      try {
        const response = await fetch(`${API}/ewb-handoff-items?ewb_handoff_id=${encodeURIComponent(handoff.id)}`, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.detail || 'Unable to load saved handoff items.');
        if (!controller.signal.aborted) setResult({ handoffId: handoff.id, items: body });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ handoffId: handoff.id, error: error.message });
      }
    }
    load();
    return () => controller.abort();
  }, [handoff.id, refresh]);
  const busy = !result || result.handoffId !== handoff.id;
  const { report, error } = useMemo(() => {
    if (busy || result.error) return {};
    try { return { report: buildSebEwpHandoffReport({ handoff, snapshot, acceptance, sebId, revisionId, items: result.items }) }; }
    catch (e) { return { error: e.message }; }
  }, [busy, result, handoff, snapshot, acceptance, sebId, revisionId]);
  async function download() {
    setDownloading(true); setDownloadError('');
    try { await downloadSiaReport(report, { title: 'EWP Handoff Report', header: 'GINFINA  /  SITE ENGINEERING PREPARATION', footer: 'Controlled SEB to EWP handoff', filename: 'EWP-Handoff-Report', reference: 'Handoff reference' }); }
    catch (e) { setDownloadError(e.message); }
    finally { setDownloading(false); }
  }
  return <Paper component="section" aria-label="EWP Handoff report" withBorder p={{ base: 'sm', sm: 'lg' }} radius="md" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <Group justify="space-between" align="flex-start" mb="lg">
      <Box><Title order={3}>EWP Handoff Report</Title><Text size="sm" c="dimmed" mt={6}>Saved handoff items, frozen release details, EWP review, acceptance and permanent link.</Text></Box>
      <Group w={{ base: '100%', sm: 'auto' }}>
        <Button color="green" variant="light" mih={44} w={{ base: '100%', sm: 'auto' }} leftSection={<IconRefresh size={16} />} disabled={busy || downloading} onClick={() => { setResult(null); setRefresh(value => value + 1); }}>Reload report</Button>
        <Button color="green" mih={44} w={{ base: '100%', sm: 'auto' }} leftSection={<IconDownload size={16} />} disabled={!report || busy} loading={downloading} onClick={download}>Download PDF</Button>
      </Group>
    </Group>
    {busy && <Text role="status">Loading saved handoff items...</Text>}
    {(result?.error || error || downloadError) && <Alert color="red" title="Unable to prepare report">{result?.error || error || downloadError}</Alert>}
    {report && <Stack gap="xl">
      <Text fw={600}>{report.code}</Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>{report.counts.map(count => <Paper key={count.label} withBorder p="sm"><Text size="xs" c="dimmed">{count.label}</Text><Text fw={700} size="xl">{count.value}</Text></Paper>)}</SimpleGrid>
      {report.sections.map((section, index) => <Box key={index}><Title order={4} mb="md">{section.title}</Title><SimpleGrid cols={{ base: 1, sm: 2 }}>{section.fields.map((field, fieldIndex) => <Box key={fieldIndex} style={{ minWidth: 0 }}><Text size="xs" c="dimmed">{field.label}</Text><Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{field.value}</Text></Box>)}</SimpleGrid></Box>)}
    </Stack>}
  </Paper>;
}
