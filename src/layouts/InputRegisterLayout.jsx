import { useState, useMemo } from 'react';
import {
  Box, Button, Grid, Group, Paper, MultiSelect, Select,
  Table, Text, TextInput, Title, Badge, ScrollArea,
  LoadingOverlay, Stack, Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Pilot data ─────────────────────────────────────────────────── */
const PILOT_INPUTS = [
  { id: 'IN-001', name: 'Site visit log',       status: 'Verified', source: 'GREEN Project' },
  { id: 'IN-002', name: 'Load schedule',         status: 'Verified', source: 'Engineering'   },
  { id: 'IN-003', name: 'Existing SLD',          status: 'Current',  source: 'Client'        },
  { id: 'IN-004', name: 'Topographic survey',    status: 'Missing',  source: 'Project'       },
  { id: 'IN-005', name: 'Module datasheet',      status: 'Verified', source: 'GPROPEL'       },
  { id: 'IN-006', name: 'Structural survey',     status: 'Verified', source: 'Engineering'   },
  { id: 'IN-007', name: 'Battery spec sheet',    status: 'Missing',  source: 'GREEN Project' },
  { id: 'IN-008', name: 'Geotechnical report',   status: 'Current',  source: 'Client'        },
];

/* ─── Status colour ──────────────────────────────────────────────── */
function statusStyle(status) {
  switch ((status || '').toLowerCase()) {
    case 'verified': return { color: '#007336', fw: 600 };
    case 'current':  return { color: '#d97706', fw: 600 };
    case 'missing':  return { color: '#c62828', fw: 600 };
    default:         return { color: '#495057', fw: 500 };
  }
}

export default function InputRegisterLayout() {
  const [topSearch, setTopSearch]   = useState('');
  const [topStatus, setTopStatus]   = useState('Active / Open');
  const [savedView, setSavedView]   = useState('My Priority Work');
  const [selectedId, setSelectedId] = useState('IN-001');

  /* left filters */
  const [category,  setCategory]  = useState(['Site', 'Load', 'Utility']);
  const [readiness, setReadiness] = useState(['Confirmed', 'Missing']);
  const [owner,     setOwner]     = useState('Project team');

  const filtered = useMemo(() => {
    const q = topSearch.trim().toLowerCase();
    return PILOT_INPUTS.filter((r) => {
      if (q && !`${r.id} ${r.name} ${r.source}`.toLowerCase().includes(q)) return false;
      if (topStatus && topStatus !== 'Active / Open' && topStatus !== 'All') {
        if (!r.status.toLowerCase().includes(topStatus.toLowerCase())) return false;
      }
      return true;
    });
  }, [topSearch, topStatus]);

  const selected = filtered.find((r) => r.id === selectedId) || filtered[0];

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', height: 38, borderRadius: 6 } };

  const handleExport = () =>
    notifications.show({ title: 'Export initiated', message: `Exporting ${filtered.length} inputs…`, color: 'green' });

  const handleAdd = () =>
    notifications.show({ title: 'Add input', message: 'Open add / update engineering input form.', color: 'green' });

  return (
    <Box>
      {/* ── Page header ── */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Engineering Input Register
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={560}>
              Control every design input with source, owner, status, evidence, required-by date,
              confirmation state and downstream dependency.
            </Text>
          </Box>
          <Button color="green" onClick={handleAdd}
            style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 20, paddingRight: 20, alignSelf: 'flex-start' }}>
            Add or update engineering input
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
              <Select data={['Active / Open', 'All', 'Verified', 'Current', 'Missing']}
                value={topStatus} onChange={(v) => setTopStatus(v || 'Active / Open')} styles={inputSt} />
            </Box>
            <Box style={{ width: 190 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Saved view</Text>
              <Select data={['My Priority Work', 'All Inputs', 'Missing Only', 'Unverified']}
                value={savedView} onChange={(v) => setSavedView(v || 'My Priority Work')} styles={inputSt} />
            </Box>
          </Group>
          <Group gap="sm">
            <Button variant="default" onClick={handleExport}
              style={{ borderColor: '#d1d5db', color: '#374151', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 18, paddingRight: 18 }}>
              Export
            </Button>
            <Button color="green" onClick={handleAdd}
              style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 18, paddingRight: 18 }}>
              Add or update engineering input
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
                {/* Input category */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Input category</Text>
                  <MultiSelect
                    data={['Site', 'Load', 'Utility', 'Structural', 'Electrical', 'Civil']}
                    value={category} onChange={setCategory}
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Controlled taxonomy</Text>
                </Box>
                {/* Readiness */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Readiness</Text>
                  <MultiSelect
                    data={['Confirmed', 'Missing', 'Pending', 'Superseded']}
                    value={readiness} onChange={setReadiness}
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Controlled state</Text>
                </Box>
                {/* Owner */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Owner</Text>
                  <TextInput value={owner} onChange={(e) => setOwner(e.target.value)}
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, height: 38 } }} />
                  <Text size="11px" c="#9ca3af" mt={4}>Select · Assignment source</Text>
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
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, position: 'relative', minHeight: 380, display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" align="center" mb="sm">
              <Title order={4} fw={700} fz={15} c="#111827">Engineering Input Register</Title>
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
                    {['Input', 'Engineering input', 'Status', 'Source'].map((h) => (
                      <Table.Th key={h} style={{ color: '#374151', fontSize: 13, fontWeight: 700, paddingBottom: 10 }}>{h}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtered.map((row) => {
                    const isSel = selected?.id === row.id;
                    const st = statusStyle(row.status);
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
                          <Text size="sm" fw={st.fw} style={{ color: st.color }}>{row.status}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" c="#4b5563">{row.source}</Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <Table.Tr><Table.Td colSpan={4} style={{ textAlign: 'center', padding: '30px 0' }}>
                      <Text size="sm" c="dimmed">No inputs found.</Text>
                    </Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Group justify="space-between" align="center" mt="auto" pt="md"
              style={{ borderTop: '1px solid #f3f4f6' }}>
              <Text size="11px" c="#9ca3af">Showing controlled R1.0 pilot data</Text>
              <Text size="11px" c="#9ca3af">
                {filtered.length > 0 ? `1-${filtered.length} of ${PILOT_INPUTS.length}` : '0 of 0'}
              </Text>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
