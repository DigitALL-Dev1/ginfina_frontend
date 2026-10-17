import { formatDisplayValue } from '../../utils/dateOnly';
import { useState } from 'react';
import { Badge, Box, Button, Group, Modal, Paper, SimpleGrid, Stack, Text, TextInput, Textarea, Title } from '@mantine/core';
import { IconCheck, IconDownload, IconPencil } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { buildSiaCaseReport, downloadSiaCaseReport } from '../../utils/siaCaseReport';
import styles from '../../layouts/SIAStartCaseControlLayout.module.css';

export default function SIACaseReport({ project, siaCase, links, packs, team = [], onEdit, onConfirm }) {
  const [downloading, setDownloading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [draftFields, setDraftFields] = useState([]);
  const [fieldOverrides, setFieldOverrides] = useState({});
  const baseReport = buildSiaCaseReport(project, siaCase, links, packs, team);
  const report = {
    ...baseReport,
    sections: baseReport.sections.map(section => ({
      ...section,
      fields: (fieldOverrides[section.title] || section.fields).map(field => ({ ...field })),
    })),
  };
  const openEditor = section => {
    const source = report.sections.find(item => item.title === section);
    if (!source) return;
    setEditingSection(section);
    setDraftFields(source.fields.map(field => ({ ...field })));
  };
  const saveEditor = () => {
    setFieldOverrides(current => ({ ...current, [editingSection]: draftFields }));
    setEditingSection(null);
    notifications.show({ title: 'Report details updated', message: `${editingSection} was updated in the report.`, color: 'green' });
  };
  const editableSections = new Set(['SIA case details']);
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
      {report.sections.map(section => <Box key={section.title}><Group justify="space-between" mb="md"><Title order={4}>{section.title}</Title>{editableSections.has(section.title) && <Button size="xs" variant="light" color="green" leftSection={<IconPencil size={14} />} onClick={() => openEditor(section.title)}>Edit</Button>}</Group>
        <SimpleGrid cols={{ base: 1, sm: section.fields.length === 1 ? 1 : 2 }} spacing="lg">{section.fields.map(field => <Box key={field.label} style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed" mb={4}>{field.label}</Text><Text size="sm" fw={500} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{formatDisplayValue(field.value)}</Text>
        </Box>)}</SimpleGrid>
      </Box>)}
      <Box><Group justify="space-between" mb="md"><Group gap="sm"><Title order={4}>Assigned survey team</Title><Badge color="green" variant="light">{report.team.length}</Badge></Group></Group>
        {report.team.length ? <Stack gap="sm">{report.team.map(member => <Paper key={member.id || member.name} withBorder p="sm"><Group justify="space-between"><Box><Text fw={600} size="sm">{member.name}</Text><Text size="xs" c="dimmed">{member.role} · {member.discipline}</Text></Box><Badge variant="light">{member.lead}</Badge></Group></Paper>)}</Stack> : <Text size="sm" c="dimmed">No team members assigned.</Text>}
      </Box>
      <Box><Group justify="space-between" mb="md"><Group gap="sm"><Title order={4}>Linked assessment packs</Title><Badge color="green" variant="light">{report.packs.length}</Badge></Group></Group>
        <Stack gap="sm">{report.packs.map(pack => <Paper key={pack.id} withBorder p="md" radius="md"><Group justify="space-between" align="flex-start" wrap="wrap">
          <Box style={{ flex: 1, minWidth: 0 }}><Text size="xs" c="green" fw={700} style={{ overflowWrap: 'anywhere' }}>{pack.code}</Text><Text fw={600} size="sm" mt={4} style={{ overflowWrap: 'anywhere' }}>{pack.name}</Text><Text size="xs" c="dimmed" mt={4}>Type: {pack.type}</Text></Box>
          <Badge variant="light" color={pack.applicable === 'Yes' ? 'green' : 'gray'}>{pack.applicable === 'Yes' ? 'Applicable' : 'Not applicable'}</Badge>
        </Group></Paper>)}{!report.packs.length && <Text size="sm" c="dimmed">No linked assessment packs.</Text>}</Stack>
      </Box>
      <Group justify="flex-end" mt="md"><Button color="green" leftSection={<IconCheck size={16} />} disabled={confirmed} onClick={() => { setConfirmed(true); onConfirm?.(); notifications.show({ title: 'Report confirmed', message: 'The Start and Case Control details have been confirmed.', color: 'green' }); }}>{confirmed ? 'Confirmed' : 'Confirm details'}</Button></Group>
    </Stack>
    <Modal opened={Boolean(editingSection)} onClose={() => setEditingSection(null)} title={`Edit ${editingSection || 'report section'}`} centered size="lg">
      <Stack gap="sm">
        {draftFields.map((field, index) => {
          const multiline = String(field.value || '').length > 90 || field.label.toLowerCase().includes('purpose');
          const props = { label: field.label, value: field.value === 'Not provided' ? '' : String(field.value || ''), onChange: event => { const value = event.currentTarget.value; setDraftFields(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, value } : item)); } };
          return multiline ? <Textarea key={field.label} autosize minRows={3} {...props} /> : <TextInput key={field.label} {...props} />;
        })}
        <Group justify="flex-end" mt="md"><Button variant="default" onClick={() => setEditingSection(null)}>Cancel</Button><Button color="green" onClick={saveEditor}>Save changes</Button></Group>
      </Stack>
    </Modal>
  </Paper>;
}
