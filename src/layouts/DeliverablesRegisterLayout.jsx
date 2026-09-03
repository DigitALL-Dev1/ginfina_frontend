import { useState, useMemo } from 'react';
import {
  Box, Button, Grid, Group, Paper, MultiSelect, Select,
  Table, Text, TextInput, Title, Badge, ScrollArea, Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Pilot data ─────────────────────────────────────────────────── */
const PILOT_DELIVERABLES = [
  { id: 'DEL-001', name: 'Electrical SLD',      revision: 'R2', status: 'In Review' },
  { id: 'DEL-002', name: 'Cable schedule',       revision: 'R1', status: 'In Review' },
  { id: 'DEL-003', name: 'PV layout',            revision: 'R1', status: 'Revise'   },
  { id: 'DEL-004', name: 'Earthing layout',      revision: 'R0', status: 'Draft'    },
  { id: 'DEL-005', name: 'Design calculation',   revision: 'R1', status: 'Accepted' },
  { id: 'DEL-006', name: 'Protection schedule',  revision: 'R0', status: 'Draft'    },
  { id: 'DEL-007', name: 'Load flow study',      revision: 'R2', status: 'Accepted' },
  { id: 'DEL-008', name: 'Grounding study',      revision: 'R1', status: 'In Review'},
];

/* ─── Revision badge ─────────────────────────────────────────────── */
function RevBadge({ rev }) {
  const colour = rev === 'R0' ? '#c62828' : '#d97706';
  return (
    <Text size="sm" fw={700} style={{ color: colour }}>{rev}</Text>
  );
}

/* ─── Status colour ──────────────────────────────────────────────── */
function statusColour(s) {
  switch ((s || '').toLowerCase()) {
    case 'accepted':  return '#007336';
    case 'in review': return '#374151';
    case 'revise':    return '#d97706';
    case 'draft':     return '#9ca3af';
    default:          return '#374151';
  }
}

export default function DeliverablesRegisterLayout() {
  const [topSearch, setTopSearch] = useState('');
  const [topStatus, setTopStatus] = useState('Active / Open');
  const [savedView, setSavedView] = useState('My Priority Work');
  const [selectedId, setSelectedId] = useState('DEL-001');

  /* left filters */
  const [delivType, setDelivType] = useState(['Drawing', 'Calculation']);
  const [statusFilter, setStatusFilter] = useState(['Draft', 'Submitted', 'Approved']);
  const [owner, setOwner] = useState('Consultant');

  const filtered = useMemo(() => {
    const q = topSearch.trim().toLowerCase();
    return PILOT_DELIVERABLES.filter((r) => {
      if (q && !`${r.id} ${r.name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [topSearch]);

  const selected = filtered.find((r) => r.id === selectedId) || filtered[0];

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', height: 38, borderRadius: 6 } };

  const handleExport = () =>
    notifications.show({ title: 'Export initiated', message: `Exporting ${filtered.length} deliverables…`, color: 'green' });

  const handleOpen = () =>
    notifications.show({ title: 'Open deliverable', message: `Opening ${selected?.name || ''}…`, color: 'green' });

  return (
    <Box>
      {/* ── Page header ── */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Engineering Deliverable Register
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={580}>
              Control all required engineering deliverables, document codes, responsible party,
              planned issue, current revision, review status and release status.
            </Text>
          </Box>
          <Button color="green" onClick={handleOpen}
            style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 20, paddingRight: 20, alignSelf: 'flex-start' }}>
            Open deliverable
          </Button>
        </Group>
      </Box>

      {/* ── Top filter bar ── */}
      <Box mb="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Group align="flex-end" gap="md" style={{ flex: 1, minWidth: 300 }}>
            <Box style={{ flex: 1, minWidth: 160 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Search</Text>
              <TextInput placeholder="Search records..." value={topSearch}
                onChange={(e) => setTopSearch(e.target.value)} styles={inputSt} />
            </Box>
            <Box style={{ width: 160 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Status</Text>
              <Select data={['Active / Open', 'All', 'In Review', 'Draft', 'Accepted', 'Revise']}
                value={topStatus} onChange={(v) => setTopStatus(v || 'Active / Open')} styles={inputSt} />
            </Box>
            <Box style={{ width: 190 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Saved view</Text>
              <Select data={['My Priority Work', 'All Deliverables', 'In Review Only', 'Draft Only']}
                value={savedView} onChange={(v) => setSavedView(v || 'My Priority Work')} styles={inputSt} />
            </Box>
          </Group>
          <Group gap="sm">
            <Button variant="default" onClick={handleExport}
              style={{ borderColor: '#d1d5db', color: '#374151', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 18, paddingRight: 18 }}>
              Export
            </Button>
            <Button color="green" onClick={handleOpen}
              style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 18, paddingRight: 18 }}>
              Open deliverable
            </Button>
          </Group>
        </Group>
      </Box>

      {/* ── Two-column body ── */}
      <Grid gutter="md">
        {/* Left: filters */}
        <Grid.Col span={{ base: 12, md: 3.8, lg: 3.5 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Title order={4} fw={700} fz={15} c="#111827" mb="md">Filters and controlled inputs</Title>
              <Stack gap="md">
                {/* Deliverable type */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Deliverable type</Text>
                  <MultiSelect
                    data={['Drawing', 'Calculation', 'Specification', 'Report', 'Schedule']}
                    value={delivType} onChange={setDelivType}
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Controlled taxonomy</Text>
                </Box>
                {/* Status */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Status</Text>
                  <MultiSelect
                    data={['Draft', 'Submitted', 'Approved', 'In Review', 'Revise', 'Accepted']}
                    value={statusFilter} onChange={setStatusFilter}
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Lifecycle state</Text>
                </Box>
                {/* Owner */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Owner</Text>
                  <TextInput value={owner} onChange={(e) => setOwner(e.target.value)}
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, height: 38 } }} />
                  <Text size="11px" c="#9ca3af" mt={4}>Select · Assignment</Text>
                </Box>
              </Stack>
            </Box>

            {/* Green callout */}
            <Box mt="xl" p="sm" style={{ backgroundColor: '#f2fbf5', borderLeft: '4px solid #007336', borderRadius: '0 6px 6px 0' }}>
              <Text size="xs" c="#182b23" lh={1.5}>
                Role and object scope are applied server-side. Current project:{' '}
                <Text span fw={600}>UNICEF PNG Solar Systems.</Text>
              </Text>
            </Box>
          </Paper>
        </Grid.Col>

        {/* Right: table */}
        <Grid.Col span={{ base: 12, md: 8.2, lg: 8.5 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, minHeight: 380, display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" align="center" mb="sm">
              <Title order={4} fw={700} fz={15} c="#111827">Engineering Deliverable Register</Title>
              <Badge size="sm" radius="xl"
                style={{ backgroundColor: '#e6fcf5', color: '#0ca678', textTransform: 'none', fontWeight: 600, fontSize: 11, padding: '4px 10px' }}>
                Current
              </Badge>
            </Group>

            <ScrollArea style={{ flex: 1 }}>
              <Table verticalSpacing="sm" horizontalSpacing="md"
                style={{ minWidth: 500, borderCollapse: 'separate', borderSpacing: '0 2px' }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    {['ID', 'Deliverable', 'Revision', 'Status'].map((h) => (
                      <Table.Th key={h} style={{ color: '#374151', fontSize: 13, fontWeight: 700, paddingBottom: 10 }}>{h}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtered.map((row) => {
                    const isSel = selected?.id === row.id;
                    return (
                      <Table.Tr key={row.id} onClick={() => setSelectedId(row.id)}
                        style={{ backgroundColor: isSel ? '#ebfbee' : 'transparent', cursor: 'pointer', transition: 'background-color 150ms ease' }}>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" fw={isSel ? 700 : 500} c={isSel ? '#007336' : '#374151'}>{row.id}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" c="#4b5563">{row.name}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <RevBadge rev={row.revision} />
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" fw={500} style={{ color: statusColour(row.status) }}>{row.status}</Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <Table.Tr><Table.Td colSpan={4} style={{ textAlign: 'center', padding: '30px 0' }}>
                      <Text size="sm" c="dimmed">No deliverables found.</Text>
                    </Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Group justify="space-between" align="center" mt="auto" pt="md"
              style={{ borderTop: '1px solid #f3f4f6' }}>
              <Text size="11px" c="#9ca3af">Showing controlled R1.0 pilot data</Text>
              <Text size="11px" c="#9ca3af">
                {filtered.length > 0 ? `1-${filtered.length} of ${PILOT_DELIVERABLES.length}` : '0 of 0'}
              </Text>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
