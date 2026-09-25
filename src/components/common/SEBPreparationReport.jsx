import { useMemo, useState } from 'react';
import { Alert, Box, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { buildSebPreparationReport } from '../../utils/sebPreparationReport';
import { downloadSiaReport } from '../../utils/siaCaseReport';

export default function SEBPreparationReport({ baseline, revision, siaCase, site, items, reviewed, submitted, busy }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const { report, error } = useMemo(() => {
    try { return { report: buildSebPreparationReport({ baseline, revision, siaCase, site, items, reviewed, submitted }) }; }
    catch (e) { return { error: e.message }; }
  }, [baseline, revision, siaCase, site, items, reviewed, submitted]);

  async function download() {
    setDownloading(true); setDownloadError('');
    try {
      await downloadSiaReport(report, {
        title: 'SEB Preparation Report', header: 'GINFINA  /  SITE ENGINEERING PREPARATION',
        footer: 'SEB preparation and source fact references', filename: 'SEB-Preparation-Report', reference: 'SEB / revision reference',
      });
    } catch (e) { setDownloadError(e.message); }
    finally { setDownloading(false); }
  }

  return <Paper component="section" aria-label="SEB Preparation report" withBorder radius="md" p={{ base: 'sm', sm: 'lg' }} mt="lg" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <Group justify="space-between" align="flex-start" mb="lg">
      <Box style={{ minWidth: 0 }}><Title order={3}>SEB Preparation Report</Title>
        <Text size="sm" c="dimmed" mt={6}>Selected SEB, revision and saved review items with their SIA source facts. Submission confirmation is recorded for this session.</Text>
      </Box>
      <Button color="green" w={{ base: '100%', sm: 'auto' }} mih={44} leftSection={<IconDownload size={16} />} loading={downloading} disabled={busy || !report} onClick={download}>Download PDF</Button>
    </Group>
    {busy && <Text size="sm" c="dimmed" mb="md">Updating the revision. The report will refresh when the request completes.</Text>}
    {(error || downloadError) && <Alert color="red" title="Unable to prepare report" mb="md">{error || downloadError}</Alert>}
    {report && <Stack gap="xl">
      <Text fw={600}>{report.code} · {report.itemCount} saved SEB {report.itemCount === 1 ? 'item' : 'items'}</Text>
      {report.sections.map((section, index) => <Box key={index}><Title order={4} mb="md">{section.title}</Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">{section.fields.map((field, fieldIndex) => <Box key={fieldIndex} style={{ minWidth: 0 }}><Text size="xs" c="dimmed" mb={4}>{field.label}</Text><Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{field.value}</Text></Box>)}</SimpleGrid>
      </Box>)}
    </Stack>}
  </Paper>;
}
