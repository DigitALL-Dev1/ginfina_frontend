import { useMemo, useState } from 'react';
import { Alert, Box, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { buildSebEngineeringReviewReport } from '../../utils/sebEngineeringReviewReport';
import { downloadSiaReport } from '../../utils/siaCaseReport';

export default function SEBEngineeringReviewReport({ baseline, revision, items, sessionReviews, busy, loadError, onReload }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const { report, error } = useMemo(() => {
    if (busy || loadError || !items) return {};
    try { return { report: buildSebEngineeringReviewReport({ baseline, revision, items, sessionReviews }) }; }
    catch (e) { return { error: e.message }; }
  }, [baseline, revision, items, sessionReviews, busy, loadError]);
  async function download() {
    setDownloading(true); setDownloadError('');
    try { await downloadSiaReport(report, { title: 'Engineering Review Report', header: 'GINFINA  /  SITE ENGINEERING PREPARATION', footer: 'SEB engineering decisions and source references', filename: 'SEB-Engineering-Review-Report', reference: 'SEB / revision reference' }); }
    catch (e) { setDownloadError(e.message); }
    finally { setDownloading(false); }
  }
  return <Paper component="section" aria-label="Engineering Review report" withBorder radius="md" p={{ base: 'sm', sm: 'lg' }} mt="lg" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <Group justify="space-between" align="flex-start" mb="lg">
      <Box style={{ minWidth: 0 }}><Title order={3}>Engineering Review Report</Title><Text size="sm" c="dimmed" mt={6}>Saved decisions, discipline assignments and source facts for this SEB revision.</Text></Box>
      <Group w={{ base: '100%', sm: 'auto' }}>
        <Button variant="light" color="green" mih={44} w={{ base: '100%', sm: 'auto' }} leftSection={<IconRefresh size={16} />} disabled={busy} onClick={onReload}>Reload report</Button>
        <Button color="green" mih={44} w={{ base: '100%', sm: 'auto' }} leftSection={<IconDownload size={16} />} disabled={!report || busy} loading={downloading} onClick={download}>Download PDF</Button>
      </Group>
    </Group>
    {busy && <Text role="status" size="sm">Loading the latest saved review records…</Text>}
    {(loadError || error || downloadError) && <Alert color="red" title="Unable to prepare report">{loadError || error || downloadError}</Alert>}
    {report && <Stack gap="xl">
      <Text fw={600}>{report.code}</Text>
      <SimpleGrid cols={{ base: 2, sm: 3 }}>{report.counts.map(count => <Paper key={count.label} withBorder p="sm" radius="md"><Text size="xs" c="dimmed">{count.label}</Text><Text size="xl" fw={700}>{count.value}</Text></Paper>)}</SimpleGrid>
      {report.sections.map((section, index) => <Box key={index}><Title order={4} mb="md">{section.title}</Title><SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">{section.fields.map((field, fieldIndex) => <Box key={fieldIndex} style={{ minWidth: 0 }}><Text size="xs" c="dimmed" mb={4}>{field.label}</Text><Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{field.value}</Text></Box>)}</SimpleGrid></Box>)}
    </Stack>}
  </Paper>;
}
