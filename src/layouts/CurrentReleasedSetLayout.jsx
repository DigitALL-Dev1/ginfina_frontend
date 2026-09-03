import { useState, useMemo } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select,
  Table, Text, TextInput, Title, Badge, ScrollArea, Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Pilot Released Data ────────────────────────────────────────── */
const PILOT_RELEASED = [
  { id: 'GL-UNICEF-BOR-SLD-001', title: 'Single Line Diagram', revision: 'R2', status: 'IFR'     },
  { id: 'GL-UNICEF-BOR-LAY-001', title: 'PV Layout',            revision: 'R1', status: 'IFA'     },
  { id: 'GL-UNICEF-BOR-CAB-001', title: 'Cable Schedule',       revision: 'R1', status: 'Current' },
  { id: 'GL-UNICEF-BOR-EAR-001', title: 'Earthing Layout',      revision: 'R0', status: 'Draft'   },
];

export default function CurrentReleasedSetLayout() {
  const [topSearch, setTopSearch]       = useState('');
  const [topStatus, setTopStatus]       = useState('Active / Open');
  const [savedView, setSavedView]       = useState('My Priority Work');
  const [selectedDoc, setSelectedDoc]   = useState('GL-UNICEF-BOR-SLD-001');

  /* Left filters */
  const [releaseType, setReleaseType]         = useState('IFC');
  const [releaseSelector, setReleaseSelector] = useState('IFC-002 Current');
  const [discipline, setDiscipline]           = useState('All');

  const filtered = useMemo(() => {
    const q = topSearch.trim().toLowerCase();
    return PILOT_RELEASED.filter((r) => {
      if (q && !`${r.id} ${r.title}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [topSearch]);

  const selected = filtered.find((r) => r.id === selectedDoc) || filtered[0];

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', height: 38, borderRadius: 6 } };

  const handleExport = () =>
    notifications.show({ title: 'Export initiated', message: `Exporting ${filtered.length} documents…`, color: 'green' });

  const handleOpen = () =>
    notifications.show({ title: 'Open document', message: `Opening ${selected?.title || ''}…`, color: 'green' });

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Current Released Engineering Set
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={680}>
              Provide one authoritative view of the current released engineering documents and clearly distinguish superseded baselines.
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
            Open released document
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
                data={['Active / Open', 'All', 'IFR', 'IFA', 'IFC', 'Draft']}
                value={topStatus}
                onChange={(v) => setTopStatus(v || 'Active / Open')}
                styles={inputSt}
              />
            </Box>
            <Box style={{ width: 190 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Saved view</Text>
              <Select
                data={['My Priority Work', 'Current Released', 'All Packages', 'Superseded']}
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
              Open released document
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
                {/* Release type */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Release type <Text span c="red">*</Text></Text>
                  <Select
                    data={['IFC', 'IFA', 'IFR']}
                    value={releaseType}
                    onChange={(v) => setReleaseType(v || 'IFC')}
                    styles={inputSt}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>SegmentedControl · IFR / IFA / IFC</Text>
                </Box>

                {/* Release selector */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Release selector <Text span c="red">*</Text></Text>
                  <Select
                    data={['IFC-002 Current', 'IFC-001 Superseded', 'IFA-002 Superseded']}
                    value={releaseSelector}
                    onChange={(v) => setReleaseSelector(v || 'IFC-002 Current')}
                    styles={inputSt}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>Select · Current first</Text>
                </Box>

                {/* Discipline */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Discipline</Text>
                  <Select
                    data={['All', 'Electrical', 'Structural', 'Civil', 'Mechanical']}
                    value={discipline}
                    onChange={(v) => setDiscipline(v || 'All')}
                    styles={inputSt}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Controlled taxonomy</Text>
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

        {/* Right: Current Released Engineering Set Table */}
        <Grid.Col span={{ base: 12, md: 8.2, lg: 8.5 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, minHeight: 380, display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" align="center" mb="sm">
              <Title order={4} fw={700} fz={15} c="#111827">Current Released Engineering Set</Title>
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
                    {['Document', 'Title', 'Revision', 'Status'].map((h) => (
                      <Table.Th key={h} style={{ color: '#374151', fontSize: 13, fontWeight: 700, paddingBottom: 10 }}>{h}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtered.map((row) => {
                    const isSel = selected?.id === row.id;
                    const revColor = row.revision === 'R0' ? '#c62828' : '#d97706';
                    return (
                      <Table.Tr
                        key={row.id}
                        onClick={() => setSelectedDoc(row.id)}
                        style={{ backgroundColor: isSel ? '#ebfbee' : 'transparent', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                      >
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" fw={isSel ? 700 : 500} c={isSel ? '#007336' : '#374151'}>{row.id}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" c="#4b5563">{row.title}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" fw={700} style={{ color: revColor }}>{row.revision}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" c="#6b7280">{row.status}</Text>
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
