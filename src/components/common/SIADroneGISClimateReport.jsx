import { useEffect, useState } from 'react';
import { Alert, Badge, Box, Button, Group, Loader, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { downloadSiaReport } from '../../utils/siaCaseReport';
import { loadDroneGISClimateReport } from '../../utils/siaDroneGISClimateReport';
import styles from '../../layouts/SIADroneGISClimateLayout.module.css';

export default function SIADroneGISClimateReport({ api, siteId }) {
  const [report, setReport] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false), [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setReport(null); setError(''); setLoading(true);
    loadDroneGISClimateReport(api, siteId, controller.signal)
      .then(result => { if (!controller.signal.aborted) setReport(result); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [api, siteId, refresh]);
  async function download() {
    setDownloading(true); setError('');
    try { await downloadSiaReport(report, { title: 'Drone, GIS and Climate Report', footer: 'Saved drone, GIS and climate records', filename: 'SIA-Drone-GIS-Climate-Report', reference: 'Site reference' }); }
    catch (e) { setError(e.message); } finally { setDownloading(false); }
  }
  return <Paper component="section" aria-label="Drone, GIS and Climate report" withBorder radius="md" p={{ base: 'sm', sm: 'lg' }} style={{ overflowWrap: 'anywhere', minWidth: 0 }}>
    <Group justify="space-between" align="flex-start" mb="lg"><Box><Badge color="green" variant="light" mb="sm">Site report</Badge><Title order={3}>Drone, GIS and Climate Report</Title>
      <Text size="sm" c="dimmed" mt={6}>All saved drone missions, GIS layers and features, external geo sources and climate resources for the active site. File and source references are included as recorded.</Text></Box>
      <Group className={styles.actions} gap="sm" grow w={{ base: '100%', sm: 'auto' }}><Button variant="light" leftSection={<IconRefresh size={16} />} disabled={loading || downloading} onClick={() => setRefresh(n => n + 1)}>Refresh report</Button>
        <Button color="green" leftSection={<IconDownload size={16} />} loading={downloading} disabled={loading || !report} onClick={download}>Download PDF</Button></Group>
    </Group>
    {error && <Alert color="red" mb="md" title="Unable to prepare report">{error}</Alert>}
    {loading && <Group py="lg"><Loader size="sm" color="green" /><Text size="sm">Loading drone, GIS and climate records…</Text></Group>}
    {report && <Stack gap="xl"><SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }}>{report.counts.map(count => <Paper key={count.label} withBorder radius="md" p="sm"><Text size="xs" c="dimmed">{count.label}</Text><Text fw={700} size="xl">{count.value}</Text></Paper>)}</SimpleGrid>
      {report.sections.map((section, i) => <Box key={`${section.title}-${i}`}><Title order={4} mb="md">{section.title}</Title><SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {section.fields.map(field => <Box key={field.label} style={{ minWidth: 0 }}><Text size="xs" c="dimmed" mb={4}>{field.label}</Text><Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{field.value}</Text></Box>)}
      </SimpleGrid></Box>)}
    </Stack>}
  </Paper>;
}
