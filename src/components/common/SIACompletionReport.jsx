import { useMemo, useState } from 'react';
import { Alert, Badge, Box, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { buildCompletionReport } from '../../utils/siaCompletionReport';
import { downloadSiaReport } from '../../utils/siaCaseReport';

export default function SIACompletionReport({ packageData, caseId, siteId, notes, completeConfirmed, readinessConfirmed, busy }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const { report, error } = useMemo(() => {
    try { return { report: buildCompletionReport(packageData, { caseId, siteId, notes, completeConfirmed, readinessConfirmed }) }; }
    catch (e) { return { error: e.message }; }
  }, [packageData, caseId, siteId, notes, completeConfirmed, readinessConfirmed]);

  async function download() {
    setDownloading(true); setDownloadError('');
    try { await downloadSiaReport(report, { title: 'SIA Completion / SEB Input Report', footer: 'SIA completion package and local review notes', filename: 'SIA-Completion-SEB-Input-Report', reference: 'Case / site reference' }); }
    catch (e) { setDownloadError(e.message); }
    finally { setDownloading(false); }
  }

  return <Paper component="section" aria-label="SIA Completion report" withBorder radius="md" p={{ base: 'sm', sm: 'lg' }} style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <Group justify="space-between" align="flex-start" mb="lg">
      <Box style={{ minWidth: 0 }}><Text size="xs" fw={700} c="#007336" tt="uppercase">6. Completion report</Text>
        <Title order={3} mt={3}>SIA Completion / SEB Input Report</Title>
        <Text size="sm" c="dimmed" mt={6}>Case, site and related records from the loaded completion package. Local notes and confirmations are identified separately.</Text>
      </Box>
      <Button color="green" w={{ base: '100%', sm: 'auto' }} mih={44} leftSection={<IconDownload size={16} />} loading={downloading} disabled={busy || !report} onClick={download}>Download PDF</Button>
    </Group>
    {busy && <Text size="sm" c="dimmed" mb="md">Updating the package. The report will refresh when the request completes.</Text>}
    {(error || downloadError) && <Alert color="red" title="Unable to prepare report" mb="md">{error || downloadError}</Alert>}
    {report && <Stack gap="xl">
      <Badge color="green" variant="light" w="fit-content">Completion package report</Badge>
      {report.counts.length > 0 && <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>{report.counts.map(count => <Paper key={count.key} withBorder radius="md" p="sm"><Text size="xs" c="dimmed">{count.label}</Text><Text fw={700} size="xl">{count.value}</Text></Paper>)}</SimpleGrid>}
      {report.sections.map((section, index) => <Box key={`${section.title}-${index}`}><Title order={4} mb="md">{section.title}</Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">{section.fields.map((field, fieldIndex) => <Box key={`${field.label}-${fieldIndex}`} style={{ minWidth: 0 }}><Text size="xs" c="dimmed" mb={4}>{field.label}</Text><Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{field.value}</Text></Box>)}</SimpleGrid>
      </Box>)}
    </Stack>}
  </Paper>;
}
