import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { buildEngineeringWorkReport } from '../../utils/engineeringWorkReport';
import { downloadSiaReport } from '../../utils/siaCaseReport';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

export default function EngineeringWorkReport({ ewp, source, links, activityVersion, saving }) {
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setDownloadError('');
    if (saving) return () => controller.abort();
    async function load() {
      try {
        const response = await fetch(`${API}/ewp/engineering-work/ewps/${encodeURIComponent(ewp.id)}/work-items`, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.detail || 'Unable to load saved engineering activities.');
        if (!controller.signal.aborted) setResult({ ewpId: ewp.id, work: body, activityVersion });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ ewpId: ewp.id, error: error.message, activityVersion });
      }
    }
    load();
    return () => controller.abort();
  }, [ewp.id, activityVersion, saving, refresh]);
  const busy = saving || !result || result.ewpId !== ewp.id || result.activityVersion !== activityVersion;
  const { report, error } = useMemo(() => {
    if (busy || result.error) return {};
    try { return { report: buildEngineeringWorkReport({ ewp, source, links, work: result.work }) }; }
    catch (e) { return { error: e.message }; }
  }, [busy, result, ewp, source, links]);
  async function download() {
    setDownloading(true); setDownloadError('');
    try { await downloadSiaReport(report, { title: 'Engineering Work Report', header: 'GINFINA  /  ENGINEERING WORKBENCH', footer: 'EWP engineering work and controlled SEB inputs', filename: 'Engineering-Work-Report', reference: 'EWP reference' }); }
    catch (e) { setDownloadError(e.message); }
    finally { setDownloading(false); }
  }
  return <Paper component="section" aria-label="Engineering Work report" withBorder radius="lg" p={{ base: 'sm', sm: 'lg' }} style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <Group justify="space-between" align="flex-start" mb="lg">
      <Box><Title order={3}>Engineering Work Report</Title><Text size="sm" c="dimmed" mt={6}>Saved EWP details, linked SEB inputs, assignments, dates and activity progress. Reload to fetch the latest saved activities.</Text></Box>
      <Group w={{ base: '100%', sm: 'auto' }}>
        <Button variant="light" color="green" mih={44} w={{ base: '100%', sm: 'auto' }} leftSection={<IconRefresh size={16} />} disabled={busy || downloading} onClick={() => { setResult(null); setRefresh(value => value + 1); }}>Reload report</Button>
        <Button color="green" mih={44} w={{ base: '100%', sm: 'auto' }} leftSection={<IconDownload size={16} />} disabled={!report || busy} loading={downloading} onClick={download}>Download PDF</Button>
      </Group>
    </Group>
    {busy && <Text role="status">Loading saved engineering work...</Text>}
    {(result?.error || error || downloadError) && <Alert color="red" title="Unable to prepare report">{result?.error || error || downloadError}</Alert>}
    {report && <Stack gap="xl"><Text fw={600}>{report.code}</Text>
      <SimpleGrid cols={{ base: 1, sm: 3 }}>{report.counts.map(count => <Paper key={count.label} withBorder p="sm"><Text size="xs" c="dimmed">{count.label}</Text><Text size="xl" fw={700}>{count.value}</Text></Paper>)}</SimpleGrid>
      {report.sections.map((section, index) => <Box key={index}><Title order={4} mb="md">{section.title}</Title><SimpleGrid cols={{ base: 1, sm: 2 }}>{section.fields.map((field, fieldIndex) => <Box key={fieldIndex} style={{ minWidth: 0 }}><Text size="xs" c="dimmed">{field.label}</Text><Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{field.value}</Text></Box>)}</SimpleGrid></Box>)}
    </Stack>}
  </Paper>;
}
