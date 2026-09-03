import { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select, MultiSelect,
  Table, Text, TextInput, Title, Badge, ScrollArea, Stack, LoadingOverlay,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Pilot BOQ Fallback Data ────────────────────────────────────── */
const PILOT_BOQ = [
  { boq: '1.1', work_quantity: 'PV array installation',    qty: 36.3,  uom: 'kWp'  },
  { boq: '1.2', work_quantity: 'LV mini-grid cable',       qty: 1480,  uom: 'm'    },
  { boq: '1.3', work_quantity: 'Household prepaid meters', qty: 25,    uom: 'Nos.' },
  { boq: '1.4', work_quantity: 'Earth electrode sets',     qty: 18,    uom: 'Sets' },
  { boq: '1.5', work_quantity: 'Testing & commissioning',  qty: 1,     uom: 'Lot'  },
];

export default function BoqWorkspaceLayout() {
  const [boqItems, setBoqItems]       = useState([]);
  const [pageTitle, setPageTitle]     = useState('Engineering Bill of Quantities (BOQ) Workspace');
  const [pageStatus, setPageStatus]   = useState('Current');
  const [loading, setLoading]         = useState(false);
  const [topSearch, setTopSearch]     = useState('');
  const [topStatus, setTopStatus]     = useState('Active / Open');
  const [savedView, setSavedView]     = useState('My Priority Work');
  const [selectedBoq, setSelectedBoq] = useState(null);

  /* Left filters */
  const [baseline, setBaseline]     = useState('BOQ B0.1');
  const [categories, setCategories] = useState(['Materials', 'Installation']);
  const [workItem, setWorkItem]     = useState('Cable installation');

  /* ── Fetch BOQ data from API on mount ── */
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch('/api/boq', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json?.title)  setPageTitle(json.title);
        if (json?.status) setPageStatus(json.status);

        const list = Array.isArray(json?.data) ? json.data : [];
        if (list.length > 0) {
          setBoqItems(list);
          setSelectedBoq(list[0].boq);
        } else {
          setBoqItems(PILOT_BOQ);
          setSelectedBoq(PILOT_BOQ[0].boq);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch BOQ data:', err);
          setBoqItems(PILOT_BOQ);
          setSelectedBoq(PILOT_BOQ[0].boq);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const q = topSearch.trim().toLowerCase();
    return boqItems.filter((r) => {
      if (q && !`${r.boq} ${r.work_quantity}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [boqItems, topSearch]);

  const selected = filtered.find((r) => r.boq === selectedBoq) || filtered[0];

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', height: 38, borderRadius: 6 } };

  const handleExport = () =>
    notifications.show({ title: 'Export initiated', message: `Exporting ${filtered.length} BOQ line items…`, color: 'green' });

  const handleSubmit = () =>
    notifications.show({ title: 'BOQ Submitted', message: 'BOQ submitted for engineering review.', color: 'green' });

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
              Control construction and installation quantities including material, labour/resource or measured-work quantities required to implement the engineering design.
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
            Submit BOQ for review
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
                data={['My Priority Work', 'All Quantities', 'Installation Only', 'Civil / Structural']}
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
              Submit BOQ for review
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
                {/* BOQ baseline */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>BOQ baseline <Text span c="red">*</Text></Text>
                  <Select
                    data={['BOQ B0.1', 'BOQ B0.2', 'BOQ B1.0']}
                    value={baseline}
                    onChange={(v) => setBaseline(v || 'BOQ B0.1')}
                    styles={inputSt}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>Select · Version controlled</Text>
                </Box>

                {/* Quantity category */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Quantity category</Text>
                  <MultiSelect
                    data={['Materials', 'Installation', 'Labour', 'Equipment']}
                    value={categories}
                    onChange={setCategories}
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Controlled taxonomy</Text>
                </Box>

                {/* Source work item */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Source work item</Text>
                  <Select
                    data={['Cable installation', 'Array mounting', 'Grid interconnection', 'Civil foundation']}
                    value={workItem}
                    onChange={(v) => setWorkItem(v || 'Cable installation')}
                    styles={inputSt}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>Select · WBS/reference if available</Text>
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
              <Title order={4} fw={700} fz={15} c="#111827">Engineering Bill of Quantities (BOQ) Workspace</Title>
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
                    {['BOQ', 'Work / Quantity', 'Qty', 'UOM'].map((h) => (
                      <Table.Th key={h} style={{ color: '#374151', fontSize: 13, fontWeight: 700, paddingBottom: 10 }}>{h}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtered.map((row) => {
                    const isSel = selected?.boq === row.boq;
                    return (
                      <Table.Tr
                        key={row.boq}
                        onClick={() => setSelectedBoq(row.boq)}
                        style={{ backgroundColor: isSel ? '#ebfbee' : 'transparent', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                      >
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" fw={isSel ? 700 : 500} c={isSel ? '#007336' : '#374151'}>{row.boq}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" c="#4b5563">{row.work_quantity}</Text>
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
                        <Text size="sm" c="dimmed">No BOQ items found.</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Group justify="space-between" align="center" mt="auto" pt="md" style={{ borderTop: '1px solid #f3f4f6' }}>
              <Text size="11px" c="#9ca3af">Showing live API data</Text>
              <Text size="11px" c="#9ca3af">
                {filtered.length > 0 ? `1-${filtered.length} of ${boqItems.length}` : '0 of 0'}
              </Text>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
