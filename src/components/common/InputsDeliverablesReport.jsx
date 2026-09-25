import { useMemo, useState } from 'react';
import { Alert, Box, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { buildInputsDeliverablesReport } from '../../utils/inputsDeliverablesReport';
import { downloadSiaReport } from '../../utils/siaCaseReport';

export default function InputsDeliverablesReport({ context, workItemId, busy, loadError, onReload }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const { report, error } = useMemo(() => {
    if (busy || loadError) return {};
    try { return { report: buildInputsDeliverablesReport(context, workItemId) }; }
    catch (e) { return { error: e.message }; }
  }, [context, workItemId, busy, loadError]);
  async function download() {
    setDownloading(true); setDownloadError('');
    try { await downloadSiaReport(report, { title: 'Inputs & Deliverables Report', header: 'GINFINA  /  ENGINEERING WORKBENCH', footer: 'Controlled engineering inputs and deliverable register', filename: 'Inputs-Deliverables-Report', reference: 'EWP / activity reference' }); }
    catch (e) { setDownloadError(e.message); }
    finally { setDownloading(false); }
  }
  return <Paper component="section" aria-label="Inputs & Deliverables report" withBorder radius="lg" p={{ base: 'sm', sm: 'lg' }} style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <Group justify="space-between" align="flex-start" mb="lg">
      <Box><Title order={3}>Inputs & Deliverables Report</Title><Text size="sm" c="dimmed" mt={6}>Saved inputs, confirmation, SEB revision references and deliverables for the selected engineering activity.</Text></Box>
      <Group w={{ base: '100%', sm: 'auto' }}>
        <Button variant="light" color="green" mih={44} w={{ base: '100%', sm: 'auto' }} leftSection={<IconRefresh size={16} />} disabled={busy || downloading} onClick={() => { setDownloadError(''); onReload(); }}>Reload report</Button>
        <Button color="green" mih={44} w={{ base: '100%', sm: 'auto' }} leftSection={<IconDownload size={16} />} disabled={!report || busy} loading={downloading} onClick={download}>Download PDF</Button>
      </Group>
    </Group>
    {busy && <Text role="status">Loading saved inputs and deliverables...</Text>}
    {(loadError || error || downloadError) && <Alert color="red" title="Unable to prepare report">{loadError || error || downloadError}</Alert>}
    {report && <Stack gap="xl"><Text fw={600}>{report.code}</Text>
      <SimpleGrid cols={{ base: 2, sm: 4 }}>{report.counts.map(count => <Paper key={count.label} withBorder p="sm"><Text size="xs" c="dimmed">{count.label}</Text><Text size="xl" fw={700}>{count.value}</Text></Paper>)}</SimpleGrid>
      {report.sections.map((section, index) => <Box key={index}><Title order={4} mb="md">{section.title}</Title><SimpleGrid cols={{ base: 1, sm: 2 }}>{section.fields.map((field, fieldIndex) => <Box key={fieldIndex} style={{ minWidth: 0 }}><Text size="xs" c="dimmed">{field.label}</Text><Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{field.value}</Text></Box>)}</SimpleGrid></Box>)}
    </Stack>}
  </Paper>;
}
