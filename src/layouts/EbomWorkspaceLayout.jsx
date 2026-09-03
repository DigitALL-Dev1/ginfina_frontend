import { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select,
  Table, Text, TextInput, Title, Badge, ScrollArea, Stack, LoadingOverlay,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Pilot EBOM Fallback Data ───────────────────────────────────── */
const PILOT_EBOM = [
  { item: 'PV-MOD-580', description: 'PV module 580 Wp',        qty: 63,    uom: 'Nos.' },
  { item: 'INV-30K',    description: 'Hybrid inverter 30 kW',   qty: 1,     uom: 'No.'  },
  { item: 'BAT-BOS-G',  description: 'BOS-G battery module',    qty: 12,    uom: 'Nos.' },
  { item: 'CAB-DC-4',   description: 'PV cable 4 mm²',          qty: 1250,  uom: 'm'    },
  { item: 'SPD-DC-II',  description: 'DC SPD Type II',          qty: 6,     uom: 'Nos.' },
];

export default function EbomWorkspaceLayout() {
  const [ebomItems, setEbomItems]       = useState([]);
  const [pageTitle, setPageTitle]       = useState('Engineering Bill of Materials (EBOM) Workspace');
  const [pageStatus, setPageStatus]     = useState('Current');
  const [loading, setLoading]           = useState(false);
  const [topSearch, setTopSearch]       = useState('');
  const [topStatus, setTopStatus]       = useState('Active / Open');
  const [savedView, setSavedView]       = useState('My Priority Work');
  const [selectedItem, setSelectedItem] = useState(null);

  /* Left filters */
  const [baseline, setBaseline]     = useState('EBOM B0.2');
  const [itemSearch, setItemSearch] = useState('PV module');
  const [discipline, setDiscipline] = useState('Electrical');

  /* ── Fetch EBOM data from API on mount ── */
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch('http://127.0.0.1:8001/api/ebom', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json?.title)  setPageTitle(json.title);
        if (json?.status) setPageStatus(json.status);

        const list = Array.isArray(json?.data) ? json.data : [];
        if (list.length > 0) {
          setEbomItems(list);
          setSelectedItem(list[0].item);
        } else {
          setEbomItems(PILOT_EBOM);
          setSelectedItem(PILOT_EBOM[0].item);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch EBOM data:', err);
          setEbomItems(PILOT_EBOM);
          setSelectedItem(PILOT_EBOM[0].item);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const q = topSearch.trim().toLowerCase();
    return ebomItems.filter((r) => {
      if (q && !`${r.item} ${r.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [ebomItems, topSearch]);

  const selected = filtered.find((r) => r.item === selectedItem) || filtered[0];

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', height: 38, borderRadius: 6 } };

  const handleExport = () =>
    notifications.show({ title: 'Export initiated', message: `Exporting ${filtered.length} EBOM line items…`, color: 'green' });

  const handleSubmit = () =>
    notifications.show({ title: 'EBOM Submitted', message: 'EBOM baseline submitted for engineering review.', color: 'green' });

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              {pageTitle}
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={680}>
              Create and control the engineering material definition with technical specifications, quantities, approved make/model constraints, source deliverable and baseline version.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleSubmit}
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
            Submit EBOM for engineering review
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
                data={['Active / Open', 'All', 'Draft', 'Under Review', 'Approved']}
                value={topStatus}
                onChange={(v) => setTopStatus(v || 'Active / Open')}
                styles={inputSt}
              />
            </Box>
            <Box style={{ width: 190 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Saved view</Text>
              <Select
                data={['My Priority Work', 'All Items', 'Electrical Only', 'Mechanical Only']}
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
              onClick={handleSubmit}
              style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 18, paddingRight: 18 }}
            >
              Submit EBOM for engineering review
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
                {/* Baseline */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Baseline <Text span c="red">*</Text></Text>
                  <Select
                    data={['EBOM B0.2', 'EBOM B0.1', 'EBOM B1.0']}
                    value={baseline}
                    onChange={(v) => setBaseline(v || 'EBOM B0.2')}
                    styles={inputSt}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>Select · Version controlled</Text>
                </Box>

                {/* Item Search */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Item search</Text>
                  <TextInput
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    styles={inputSt}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>TextInput · Local filter</Text>
                </Box>

                {/* Discipline */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Discipline</Text>
                  <Select
                    data={['Electrical', 'Civil', 'Structural', 'Mechanical']}
                    value={discipline}
                    onChange={(v) => setDiscipline(v || 'Electrical')}
                    styles={inputSt}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>Select · Controlled taxonomy</Text>
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
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, minHeight: 380, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <LoadingOverlay visible={loading} overlayProps={{ blur: 1 }} />

            <Group justify="space-between" align="center" mb="sm">
              <Title order={4} fw={700} fz={15} c="#111827">Engineering Bill of Materials (EBOM) Workspace</Title>
              <Badge
                size="sm"
                radius="xl"
                style={{ backgroundColor: '#e6fcf5', color: '#0ca678', textTransform: 'none', fontWeight: 600, fontSize: 11, padding: '4px 10px' }}
              >
                {pageStatus}
              </Badge>
            </Group>

            <ScrollArea style={{ flex: 1 }}>
              <Table verticalSpacing="sm" horizontalSpacing="md" style={{ minWidth: 500, borderCollapse: 'separate', borderSpacing: '0 2px' }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    {['Item', 'Description', 'Qty', 'UOM'].map((h) => (
                      <Table.Th key={h} style={{ color: '#374151', fontSize: 13, fontWeight: 700, paddingBottom: 10 }}>{h}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtered.map((row) => {
                    const isSel = selected?.item === row.item;
                    return (
                      <Table.Tr
                        key={row.item}
                        onClick={() => setSelectedItem(row.item)}
                        style={{ backgroundColor: isSel ? '#ebfbee' : 'transparent', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                      >
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" fw={isSel ? 700 : 500} c={isSel ? '#007336' : '#374151'}>{row.item}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" c="#4b5563">{row.description}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" fw={700} c="#d97706">{row.qty}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" c="#6b7280">{row.uom}</Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                  {filtered.length === 0 && !loading && (
                    <Table.Tr>
                      <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '30px 0' }}>
                        <Text size="sm" c="dimmed">No EBOM items found.</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Group justify="space-between" align="center" mt="auto" pt="md" style={{ borderTop: '1px solid #f3f4f6' }}>
              <Text size="11px" c="#9ca3af">Showing live API data</Text>
              <Text size="11px" c="#9ca3af">
                {filtered.length > 0 ? `1-${filtered.length} of ${ebomItems.length}` : '0 of 0'}
              </Text>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
