import { useState } from 'react';
import { Badge, Box, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { buildSiaCaseReport, downloadSiaCaseReport } from '../../utils/siaCaseReport';
import styles from '../../layouts/SIAStartCaseControlLayout.module.css';

export default function SIACaseReport({ project, siaCase, links, packs }) {
  const [downloading, setDownloading] = useState(false);
  const report = buildSiaCaseReport(project, siaCase, links, packs);
  async function download() {
    setDownloading(true);
    try { await downloadSiaCaseReport(report); }
    catch (error) { notifications.show({ title: 'Unable to download report', message: error.message, color: 'red' }); }
    finally { setDownloading(false); }
  }
  return <Paper component="section" aria-label="SIA case report" withBorder radius="md" p={{ base: 'md', sm: 'xl' }} w="100%" style={{ textAlign: 'left' }}>
    <Group justify="space-between" align="flex-start" mb="xl">
      <Box><Badge color="green" variant="light" mb="sm">Case setup report</Badge><Title order={3}>Start and Case Control Report</Title><Text size="sm" c="dimmed" mt={6}>Saved project, case details and linked assessment packs.</Text></Box>
      <Button className={styles.reportDownload} color="green" leftSection={<IconDownload size={16} />} loading={downloading} onClick={download}>Download PDF</Button>
    </Group>
    <Stack gap="xl">
      {report.sections.map(section => <Box key={section.title}><Title order={4} mb="md">{section.title}</Title>
        <SimpleGrid cols={{ base: 1, sm: section.fields.length === 1 ? 1 : 2 }} spacing="lg">{section.fields.map(field => <Box key={field.label} style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed" mb={4}>{field.label}</Text><Text size="sm" fw={500} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{field.value}</Text>
        </Box>)}</SimpleGrid>
      </Box>)}
      <Box><Group gap="sm" mb="md"><Title order={4}>Linked assessment packs</Title><Badge color="green" variant="light">{report.packs.length}</Badge></Group>
        <Stack gap="sm">{report.packs.map(pack => <Paper key={pack.id} withBorder p="md" radius="md"><Group justify="space-between" align="flex-start" wrap="wrap">
          <Box style={{ flex: 1, minWidth: 0 }}><Text size="xs" c="green" fw={700} style={{ overflowWrap: 'anywhere' }}>{pack.code}</Text><Text fw={600} size="sm" mt={4} style={{ overflowWrap: 'anywhere' }}>{pack.name}</Text><Text size="xs" c="dimmed" mt={4}>Type: {pack.type}</Text></Box>
          <Badge variant="light" color={pack.applicable === 'Yes' ? 'green' : 'gray'}>{pack.applicable === 'Yes' ? 'Applicable' : 'Not applicable'}</Badge>
        </Group></Paper>)}{!report.packs.length && <Text size="sm" c="dimmed">No linked assessment packs.</Text>}</Stack>
      </Box>
    </Stack>
  </Paper>;
}
