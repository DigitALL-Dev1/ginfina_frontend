import { useState, useMemo } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select, MultiSelect,
  Table, Text, TextInput, Title, Badge, ScrollArea, Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Pilot Notifications Data ───────────────────────────────────── */
const PILOT_NOTIFICATIONS = [
  { priority: 'P0', action: 'Review overdue',             context: 'UNI-BOR-ELE-001', age: '2h'   },
  { priority: 'P1', action: 'IFC approval required',      context: 'UNI-KEM-ELE-001', age: 'Today'},
  { priority: 'P1', action: 'Input missing: survey',      context: 'UNI-BOR-CIV-001', age: '1d'   },
  { priority: 'P2', action: 'Consultant evidence expires', context: 'ABC Engineering', age: '14d'  },
];

export default function NotificationsLayout() {
  const [topSearch, setTopSearch]       = useState('');
  const [topStatus, setTopStatus]       = useState('Active / Open');
  const [savedView, setSavedView]       = useState('My Priority Work');
  const [selectedAction, setSelectedAction] = useState('Review overdue');

  /* Left filters */
  const [scope, setScope]                 = useState('Mine');
  const [severity, setSeverity]           = useState(['Critical', 'Warning']);
  const [deliveryState, setDeliveryState] = useState(['Delivered', 'Failed']);

  const filtered = useMemo(() => {
    const q = topSearch.trim().toLowerCase();
    return PILOT_NOTIFICATIONS.filter((r) => {
      if (q && !`${r.action} ${r.context} ${r.priority}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [topSearch]);

  const selected = filtered.find((r) => r.action === selectedAction) || filtered[0];

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', height: 38, borderRadius: 6 } };

  const handleExport = () =>
    notifications.show({ title: 'Export initiated', message: `Exporting notification records…`, color: 'green' });

  const handleOpen = () =>
    notifications.show({ title: 'Opening Task', message: `Navigating to task: ${selected?.action || ''}`, color: 'green' });

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Notifications, Escalations and GCONNECT Actions
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={680}>
              Present actionable engineering notifications, SLA breaches, follow-ups and GCONNECT delivery status while linking each item to the underlying executable task.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleOpen}
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
            Open actionable notification
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
                data={['Active / Open', 'All', 'Resolved', 'Dismissed']}
                value={topStatus}
                onChange={(v) => setTopStatus(v || 'Active / Open')}
                styles={inputSt}
              />
            </Box>
            <Box style={{ width: 190 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Saved view</Text>
              <Select
                data={['My Priority Work', 'Critical Only', 'Escalations', 'Team Feed']}
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
              onClick={handleOpen}
              style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 18, paddingRight: 18 }}
            >
              Open actionable notification
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
                {/* Notification Scope */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Notification scope <Text span c="red">*</Text></Text>
                  <Select
                    data={['Mine', 'My Team', 'Project Wide']}
                    value={scope}
                    onChange={(v) => setScope(v || 'Mine')}
                    styles={inputSt}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>SegmentedControl · Mine / team if authorised</Text>
                </Box>

                {/* Severity */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Severity</Text>
                  <MultiSelect
                    data={['Critical', 'Warning', 'Info', 'Low']}
                    value={severity}
                    onChange={setSeverity}
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Controlled severity</Text>
                </Box>

                {/* Delivery state */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Delivery state</Text>
                  <MultiSelect
                    data={['Delivered', 'Failed', 'Pending', 'Queued']}
                    value={deliveryState}
                    onChange={setDeliveryState}
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · GCONNECT state</Text>
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
              <Title order={4} fw={700} fz={15} c="#111827">Notifications, Escalations and GCONNECT Actions</Title>
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
                    {['Priority', 'Action', 'Context', 'Age'].map((h) => (
                      <Table.Th key={h} style={{ color: '#374151', fontSize: 13, fontWeight: 700, paddingBottom: 10 }}>{h}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtered.map((row) => {
                    const isSel = selected?.action === row.action;
                    return (
                      <Table.Tr
                        key={row.action}
                        onClick={() => setSelectedAction(row.action)}
                        style={{ backgroundColor: isSel ? '#ebfbee' : 'transparent', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                      >
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" fw={isSel ? 700 : 500} c={isSel ? '#007336' : '#374151'}>{row.priority}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" c="#4b5563">{row.action}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="xs" fw={700} c="#d97706" style={{ backgroundColor: '#fff3cd', padding: '2px 8px', borderRadius: 4, display: 'inline-block' }}>
                            {row.context}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" c="#6b7280">{row.age}</Text>
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
