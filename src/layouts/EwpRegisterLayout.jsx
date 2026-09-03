import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Grid,
  Group,
  Paper,
  Select,
  MultiSelect,
  Table,
  Text,
  TextInput,
  Title,
  Badge,
  ScrollArea,
  LoadingOverlay,
  Stack,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

/* ─── Pilot fallback data (R1.0 controlled) ─────────────────────────────── */
const PILOT_EWPS = [
  { id: 'EWP-001', ewp_id: 'UNI-BOR-ELE-001', ewp_code: 'UNI-BOR-ELE-001', discipline: 'Electrical / Mini-grid',   status: 'In Review',   owner: 'Senthil'      },
  { id: 'EWP-002', ewp_id: 'UNI-BOR-STR-001', ewp_code: 'UNI-BOR-STR-001', discipline: 'Structural / Mounting',    status: 'In Design',   owner: 'Consultant A' },
  { id: 'EWP-003', ewp_id: 'UNI-BOR-CIV-001', ewp_code: 'UNI-BOR-CIV-001', discipline: 'Civil / Site',             status: 'Input Hold',  owner: 'Consultant B' },
  { id: 'EWP-004', ewp_id: 'UNI-KEM-ELE-001', ewp_code: 'UNI-KEM-ELE-001', discipline: 'Electrical / ATS',         status: 'Ready',       owner: 'Consultant C' },
  { id: 'EWP-005', ewp_id: 'UNI-KEM-STR-001', ewp_code: 'UNI-KEM-STR-001', discipline: 'Structural / Mounting',    status: 'Draft',       owner: 'Consultant D' },
];

/* ─── Status colour map ──────────────────────────────────────────────────── */
function getStatusColour(status) {
  const s = (status || '').toLowerCase();
  if (s === 'in review')   return '#d9480f';
  if (s === 'in design')   return '#e67700';
  if (s === 'input hold')  return '#e67700';
  if (s === 'ready')       return '#2f9e44';
  if (s === 'draft')       return '#b45309';
  if (s === 'approved')    return '#007336';
  if (s === 'blocked')     return '#c62828';
  return '#495057';
}

export default function EwpRegisterLayout() {
  const navigate = useNavigate();

  const [ewps, setEwps]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [selectedEwpId, setSelectedEwpId] = useState(null);
  const [topSearch, setTopSearch]         = useState('');
  const [topStatus, setTopStatus]         = useState('Active / Open');
  const [savedView, setSavedView]         = useState('My Priority Work');
  const [project, setProject]             = useState('UNICEF');
  const [discipline, setDiscipline]       = useState(['Electrical', 'Civil']);
  const [ewpStatus, setEwpStatus]         = useState(['In Design', 'Review']);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch('http://127.0.0.1:8001/api/ewps', { signal: controller.signal })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((json) => {
        const list = json?.data?.ewp_list || json?.data || (Array.isArray(json) ? json : null);
        if (list && list.length > 0) {
          setEwps(list);
          setSelectedEwpId(list[0].id);
        } else {
          setEwps(PILOT_EWPS);
          setSelectedEwpId(PILOT_EWPS[0].id);
        }
      })
      .catch(() => { setEwps(PILOT_EWPS); setSelectedEwpId(PILOT_EWPS[0].id); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const filteredEwps = useMemo(() => {
    const q = topSearch.trim().toLowerCase();
    return ewps.filter((e) => {
      if (q && !`${e.ewp_id || ''} ${e.discipline || ''} ${e.owner || ''}`.toLowerCase().includes(q)) return false;
      if (topStatus && topStatus !== 'Active / Open' && topStatus !== 'All') {
        if (!(e.status || '').toLowerCase().includes(topStatus.toLowerCase())) return false;
      }
      return true;
    });
  }, [ewps, topSearch, topStatus]);

  const selectedEwp = ewps.find((e) => e.id === selectedEwpId) || filteredEwps[0] || null;

  const handleOpenEwp = () => {
    const chosenId = selectedEwp?.id || selectedEwp?.ewp_id || 'ewp-draft-c6834357-8680-44be-a8d2-703f0303f100';
    localStorage.setItem('active_ewp_id', chosenId);
    sessionStorage.setItem('active_ewp_id', chosenId);
    navigate(`/ginfina/ewp/${chosenId}`);
  };
  const handleExport  = () => notifications.show({ title: 'Export initiated', message: `Exporting ${filteredEwps.length} EWPs\u2026`, color: 'green' });

  const inputStyles = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', height: 38, borderRadius: 6 } };

  return (
    <Box>
      {/* Page Header */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Engineering Work Package Register
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={560}>
              List all authorised engineering work packages with discipline, design stage,
              consultant, due dates, review status, release status and blockers.
            </Text>
          </Box>
          <Button color="green" onClick={handleOpenEwp}
            style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 20, paddingRight: 20, alignSelf: 'flex-start' }}>
            Open selected EWP
          </Button>
        </Group>
      </Box>

      {/* Top Filter Bar */}
      <Box mb="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Group align="flex-end" gap="md" style={{ flex: 1, minWidth: 300 }}>
            <Box style={{ flex: 1, minWidth: 180 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Search</Text>
              <TextInput placeholder="Search records..." value={topSearch} onChange={(e) => setTopSearch(e.target.value)} styles={inputStyles} />
            </Box>
            <Box style={{ width: 160 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Status</Text>
              <Select data={['Active / Open', 'All', 'In Design', 'In Review', 'Ready', 'Draft', 'Input Hold', 'Blocked', 'Approved']}
                value={topStatus} onChange={(v) => setTopStatus(v || 'Active / Open')} styles={inputStyles} />
            </Box>
            <Box style={{ width: 190 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Saved view</Text>
              <Select data={['My Priority Work', 'All EWPs', 'Blocked', 'Awaiting Review']}
                value={savedView} onChange={(v) => setSavedView(v || 'My Priority Work')} styles={inputStyles} />
            </Box>
          </Group>
          <Group gap="sm">
            <Button variant="default" onClick={handleExport}
              style={{ borderColor: '#d1d5db', color: '#374151', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 18, paddingRight: 18 }}>
              Export
            </Button>
            <Button color="green" onClick={handleOpenEwp}
              style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 18, paddingRight: 18 }}>
              Open selected EWP
            </Button>
          </Group>
        </Group>
      </Box>

      {/* Two-Column Body */}
      <Grid gutter="md">
        {/* Left: Filters */}
        <Grid.Col span={{ base: 12, md: 3.8, lg: 3.5 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Title order={4} fw={700} fz={15} c="#111827" mb="md">Filters and controlled inputs</Title>
              <Stack gap="md">
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Project</Text>
                  <TextInput value={project} onChange={(e) => setProject(e.target.value)}
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, height: 38 } }} />
                  <Text size="11px" c="#9ca3af" mt={4}>Select · Security trimmed</Text>
                </Box>
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Discipline</Text>
                  <MultiSelect data={['Electrical', 'Civil', 'Structural', 'Mechanical', 'Instrumentation']}
                    value={discipline} onChange={setDiscipline}
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }} />
                  <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Controlled taxonomy</Text>
                </Box>
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Status</Text>
                  <MultiSelect data={['Draft', 'In Design', 'Review', 'Input Hold', 'Ready', 'Approved', 'Blocked']}
                    value={ewpStatus} onChange={setEwpStatus}
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }} />
                  <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · EWP state machine</Text>
                </Box>
              </Stack>
            </Box>
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
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, position: 'relative', minHeight: 380, display: 'flex', flexDirection: 'column' }}>
            <LoadingOverlay visible={loading} overlayProps={{ blur: 1 }} />

            <Group justify="space-between" align="center" mb="sm">
              <Title order={4} fw={700} fz={15} c="#111827">Engineering Work Package Register</Title>
              <Badge size="sm" radius="xl" style={{ backgroundColor: '#e6fcf5', color: '#0ca678', textTransform: 'none', fontWeight: 600, fontSize: 11, padding: '4px 10px' }}>
                Current
              </Badge>
            </Group>

            <ScrollArea style={{ flex: 1 }}>
              <Table verticalSpacing="sm" horizontalSpacing="md" style={{ minWidth: 500, borderCollapse: 'separate', borderSpacing: '0 2px' }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    {['EWP Code', 'Discipline', 'Status', 'Owner'].map((h) => (
                      <Table.Th key={h} style={{ color: '#374151', fontSize: 13, fontWeight: 700, paddingBottom: 10 }}>{h}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredEwps.map((ewp) => {
                    const isSelected = selectedEwp?.id === ewp.id;
                    return (
                      <Table.Tr key={ewp.id} onClick={() => setSelectedEwpId(ewp.id)}
                        style={{ backgroundColor: isSelected ? '#ebfbee' : 'transparent', cursor: 'pointer', transition: 'background-color 150ms ease' }}>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" fw={isSelected ? 700 : 500} c={isSelected ? '#007336' : '#374151'}>
                            {ewp.ewp_code || ewp.ewp_id || ewp.id}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" c="#4b5563">{ewp.discipline || '—'}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" fw={600} style={{ color: getStatusColour(ewp.status) }}>{ewp.status}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" c="#4b5563">{ewp.owner || '—'}</Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                  {filteredEwps.length === 0 && !loading && (
                    <Table.Tr><Table.Td colSpan={4} style={{ textAlign: 'center', padding: '30px 0' }}>
                      <Text size="sm" c="dimmed">No EWPs found.</Text>
                    </Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Group justify="space-between" align="center" mt="auto" pt="md" style={{ borderTop: '1px solid #f3f4f6' }}>
              <Text size="11px" c="#9ca3af">Showing controlled R1.0 pilot data</Text>
              <Text size="11px" c="#9ca3af">{filteredEwps.length > 0 ? `1-${filteredEwps.length} of ${ewps.length}` : '0 of 0'}</Text>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
