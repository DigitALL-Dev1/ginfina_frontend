import { useState, useMemo } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select, MultiSelect,
  Table, Text, TextInput, Title, Badge, ScrollArea, Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Pilot Work Items Data ──────────────────────────────────────── */
const PILOT_WORK_ITEMS = [
  { id: 'REC-001', record: 'UNICEF engineering package', status: 'In Review', statusBg: '#fff3bf', statusColor: '#d9480f', due: 'Today'    },
  { id: 'REC-002', record: 'Consultant response',        status: 'Pending',   statusBg: '#fff3bf', statusColor: '#d9480f', due: 'Today'    },
  { id: 'REC-003', record: 'IFC release preparation',    status: 'Ready',     statusBg: '#d3f9d8', statusColor: '#007336', due: 'Tomorrow' },
  { id: 'REC-004', record: 'Procurement package',        status: 'Blocked',   statusBg: '#ffe3e3', statusColor: '#c92a2a', due: '2d'       },
];

export default function MyWorkLayout() {
  const [topSearch, setTopSearch]       = useState('');
  const [topStatus, setTopStatus]       = useState('Active / Open');
  const [savedView, setSavedView]       = useState('My Priority Work');
  const [selectedId, setSelectedId]     = useState('REC-001');

  /* Left filters */
  const [queue, setQueue]               = useState('Assigned to me');
  const [priority, setPriority]         = useState(['P0', 'P1']);
  const [dueDate, setDueDate]           = useState('Current week');

  const filtered = useMemo(() => {
    const q = topSearch.trim().toLowerCase();
    return PILOT_WORK_ITEMS.filter((r) => {
      if (q && !`${r.id} ${r.record} ${r.status}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [topSearch]);

  const selected = filtered.find((r) => r.id === selectedId) || filtered[0];

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', height: 38, borderRadius: 6 } };

  const handleExport = () =>
    notifications.show({ title: 'Export initiated', message: `Exporting work items…`, color: 'green' });

  const handleOpenItem = () =>
    notifications.show({ title: 'Opening Work Item', message: `Opening item: ${selected?.record || ''}`, color: 'green' });

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              My Work, Reviews and Approvals
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={720}>
              Consolidate EWOs, deliverable reviews, comment verifications, approvals and escalations assigned to the current user into one prioritised queue.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleOpenItem}
            style={{
              backgroundColor: '#007336',
              fontWeight: 600,
              height: 38,
              borderRadius: 6,
              paddingLeft: 20,
              paddingRight: 20,
              alignSelf: 'flex-start',
            }}
          >
            Open selected work item
          </Button>
        </Group>
      </Box>

      {/* ── Top Filter Bar ── */}
      <Box mb="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Group align="flex-end" gap="md" style={{ flex: 1, minWidth: 300 }}>
            <Box style={{ flex: 1, minWidth: 160 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Search</Text>
              <TextInput
                placeholder="Search records..."
                value={topSearch}
                onChange={(e) => setTopSearch(e.target.value)}
                styles={inputSt}
              />
            </Box>
            <Box style={{ width: 160 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Status</Text>
              <Select
                data={['Active / Open', 'All', 'In Review', 'Pending', 'Ready', 'Blocked']}
                value={topStatus}
                onChange={(v) => setTopStatus(v || 'Active / Open')}
                styles={inputSt}
              />
            </Box>
            <Box style={{ width: 190 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Saved view</Text>
              <Select
                data={['My Priority Work', 'Assigned to Me', 'Approvals Only', 'Escalations']}
                value={savedView}
                onChange={(v) => setSavedView(v || 'My Priority Work')}
                styles={inputSt}
              />
            </Box>
          </Group>
          <Group gap="sm">
            <Button
              variant="default"
              onClick={handleExport}
              style={{ borderColor: '#d1d5db', color: '#374151', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 18, paddingRight: 18 }}
            >
              Export
            </Button>
            <Button
              color="green"
              onClick={handleOpenItem}
              style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 18, paddingRight: 18 }}
            >
              Open selected work item
            </Button>
          </Group>
        </Group>
      </Box>

      {/* ── Two-Column Body ── */}
      <Grid gutter="md">
        {/* Left: Filters and Controlled Inputs */}
        <Grid.Col span={{ base: 12, md: 3.8, lg: 3.5 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Title order={4} fw={700} fz={15} c="#111827" mb="md">Filters and controlled inputs</Title>
              <Stack gap="md">
                {/* Queue */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Queue <Text span c="red">*</Text></Text>
                  <Select
                    data={['Assigned to me', 'Review requests', 'Approvals pending', 'Escalations']}
                    value={queue}
                    onChange={(v) => setQueue(v || 'Assigned to me')}
                    styles={inputSt}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>SegmentedControl · Assigned / review / approvals / escalated</Text>
                </Box>

                {/* Priority */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Priority</Text>
                  <MultiSelect
                    data={['P0', 'P1', 'P2', 'P3']}
                    value={priority}
                    onChange={setPriority}
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Controlled priority</Text>
                </Box>

                {/* Due date */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Due date</Text>
                  <TextInput
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    styles={inputSt}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>DateRangePicker · Inclusive range</Text>
                </Box>
              </Stack>
            </Box>

            {/* Green Callout */}
            <Box mt="xl" p="sm" style={{ backgroundColor: '#f2fbf5', borderLeft: '4px solid #007336', borderRadius: '0 6px 6px 0' }}>
              <Text size="xs" c="#182b23" lh={1.5}>
                Role and object scope are applied server-side. Current project:{' '}
                <Text span fw={600}>UNICEF PNG Solar Systems.</Text>
              </Text>
            </Box>
          </Paper>
        </Grid.Col>

        {/* Right: Table */}
        <Grid.Col span={{ base: 12, md: 8.2, lg: 8.5 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, minHeight: 380, display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" align="center" mb="sm">
              <Title order={4} fw={700} fz={15} c="#111827">My Work, Reviews and Approvals</Title>
              <Badge
                size="sm"
                radius="xl"
                style={{ backgroundColor: '#e6fcf5', color: '#0ca678', textTransform: 'none', fontWeight: 600, fontSize: 11, padding: '4px 10px' }}
              >
                Current
              </Badge>
            </Group>

            <ScrollArea style={{ flex: 1 }}>
              <Table verticalSpacing="sm" horizontalSpacing="md" style={{ minWidth: 500, borderCollapse: 'separate', borderSpacing: '0 2px' }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    {['ID', 'Record', 'Status', 'Due'].map((h) => (
                      <Table.Th key={h} style={{ color: '#374151', fontSize: 13, fontWeight: 700, paddingBottom: 10 }}>{h}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtered.map((row) => {
                    const isSel = selected?.id === row.id;
                    return (
                      <Table.Tr
                        key={row.id}
                        onClick={() => setSelectedId(row.id)}
                        style={{ backgroundColor: isSel ? '#ebfbee' : 'transparent', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                      >
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" fw={isSel ? 700 : 500} c={isSel ? '#007336' : '#374151'}>{row.id}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" c="#4b5563">{row.record}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Badge
                            size="sm"
                            radius="xs"
                            style={{
                              backgroundColor: row.statusBg,
                              color: row.statusColor,
                              fontWeight: 700,
                              padding: '2px 8px',
                              textTransform: 'none',
                            }}
                          >
                            {row.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" c="#6b7280">{row.due}</Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Group justify="space-between" align="center" mt="auto" pt="md" style={{ borderTop: '1px solid #f3f4f6' }}>
              <Text size="11px" c="#9ca3af">Showing controlled R1.0 pilot data</Text>
              <Text size="11px" c="#9ca3af">1-5 of 18</Text>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
