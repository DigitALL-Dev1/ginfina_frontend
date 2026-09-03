import { useState } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select, Table, Text, TextInput, Title, Badge, Stack, Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createProcurementPackage } from '../services/procurementPackageService';
import { getUserId, getEwpId, getProjectId } from '../utils/storage';

/* ─── Pilot Baseline Items ───────────────────────────────────────── */
const BASELINE_ITEMS = [
  { item: 'PV-MOD-580', description: 'PV module 580 Wp',        qty: '63',    uom: 'Nos.' },
  { item: 'INV-30K',    description: 'Hybrid inverter 30 kW',     qty: '1',     uom: 'No.'  },
  { item: 'BAT-BOS-G',  description: 'BOS-G battery module',      qty: '12',    uom: 'Nos.' },
  { item: 'CAB-DC-4',   description: 'PV cable 4 mm²',            qty: '1,250', uom: 'm'    },
  { item: 'SPD-DC-II',  description: 'DC SPD Type II',            qty: '6',     uom: 'Nos.' },
];

/* ─── Gate / Checklist Item ──────────────────────────────────────── */
function HandoffGate({ title, subtitle, status }) {
  const isReady = status === 'Ready';
  return (
    <Paper p="xs" style={{ border: '1px solid #e5e7eb', borderRadius: 6, backgroundColor: '#ffffff' }}>
      <Group justify="space-between" align="center">
        <Box>
          <Text size="xs" fw={700} c="#111827">{title}</Text>
          <Text size="11px" c="#9ca3af">{subtitle}</Text>
        </Box>
        <Badge
          size="sm"
          radius="sm"
          style={{
            backgroundColor: isReady ? '#d3f9d8' : '#fff3cd',
            color: isReady ? '#007336' : '#d97706',
            fontWeight: 700,
            fontSize: 11,
            padding: '2px 10px',
            textTransform: 'none',
          }}
        >
          {status}
        </Badge>
      </Group>
    </Paper>
  );
}

export default function ProcurementPackageLayout() {
  const [selectedItem, setSelectedItem] = useState('PV-MOD-580');
  const [engRelease, setEngRelease]     = useState('IFC');
  const [ebomBaseline, setEbomBaseline] = useState('EBOM');
  const [boqBaseline, setBoqBaseline]   = useState('BOQ');
  const [techAttach, setTechAttach]     = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handoff gate statuses — driven by API response after create
  const [techSpecStatus, setTechSpecStatus]         = useState('Ready (Complete · 8 files)');
  const [ebomBoqStatus, setEbomBoqStatus]           = useState('Ready (Baseline IFC-001)');
  const [gsolveStatus, setGsolveStatus]             = useState('Pending');

  const handleRelease = async () => {
    // Validation
    if (!engRelease) {
      notifications.show({ title: 'Validation Error', message: 'Engineering release is required', color: 'red' });
      return;
    }
    if (!ebomBaseline) {
      notifications.show({ title: 'Validation Error', message: 'EBOM baseline is required', color: 'red' });
      return;
    }
    if (!boqBaseline) {
      notifications.show({ title: 'Validation Error', message: 'BOQ baseline is required', color: 'red' });
      return;
    }
    if (!techAttach.trim()) {
      notifications.show({ title: 'Validation Error', message: 'Technical attachments are required', color: 'red' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        engineering_release: engRelease,
        ebom_baseline: ebomBaseline,
        boq_baseline: boqBaseline,
        technical_attachments: techAttach.trim(),
        technical_specification_status: techSpecStatus,
        approved_ebom_boq_status: ebomBoqStatus,
        gsolve_integration_status: gsolveStatus,
        project_id: getProjectId(),
        ewp_id: getEwpId(),
        submitted_by: getUserId(),
      };

      const response = await createProcurementPackage(payload);

      // Update gate statuses from API response if available
      if (response?.data) {
        if (response.data.technical_specification_status) setTechSpecStatus(response.data.technical_specification_status);
        if (response.data.approved_ebom_boq_status)       setEbomBoqStatus(response.data.approved_ebom_boq_status);
        if (response.data.gsolve_integration_status)      setGsolveStatus(response.data.gsolve_integration_status);
      }

      notifications.show({
        title: 'Released to GSOLVE',
        message: 'Technical procurement package released to GSOLVE system.',
        color: 'green',
      });

      // Clear user-editable fields after success
      setTechAttach('');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create procurement package: ' + error.message,
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6, height: 38 } };

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Procurement Engineering Package
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={680}>
              Assemble the approved technical procurement package from current engineering release, EBOM, BOQ, datasheets, technical notes and substitution rules for GSOLVE procurement execution.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleRelease}
            loading={isSubmitting}
            disabled={!techAttach.trim()}
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
            Release package to GSOLVE
          </Button>
        </Group>
      </Box>

      {/* ── Two-Column Main Layout ── */}
      <Grid gutter="md" align="stretch">
        {/* Left Column: Engineering Baseline */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Title order={4} fw={700} fz={15} c="#111827" mb="sm">Engineering baseline</Title>
              <Table verticalSpacing="sm" horizontalSpacing="sm" style={{ minWidth: 320 }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Item</Table.Th>
                    <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Description</Table.Th>
                    <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Qty</Table.Th>
                    <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>UOM</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {BASELINE_ITEMS.map((row) => {
                    const isSel = selectedItem === row.item;
                    return (
                      <Table.Tr
                        key={row.item}
                        onClick={() => setSelectedItem(row.item)}
                        style={{
                          backgroundColor: isSel ? '#ebfbee' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 150ms ease',
                        }}
                      >
                        <Table.Td style={{ padding: '10px 8px' }}>
                          <Text size="xs" fw={isSel ? 700 : 500} c={isSel ? '#007336' : '#374151'}>{row.item}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '10px 8px' }}>
                          <Text size="xs" c="#4b5563">{row.description}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '10px 8px' }}>
                          <Text size="xs" fw={700} c="#d97706">{row.qty}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '10px 8px' }}>
                          <Text size="xs" c="#6b7280">{row.uom}</Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Box>

            {/* Green Notice Box */}
            <Box mt="md" p="sm" style={{ backgroundColor: '#f2fbf5', borderLeft: '4px solid #007336', borderRadius: '0 6px 6px 0' }}>
              <Text size="xs" c="#182b23" lh={1.4}>
                Released technical data remains authoritative. Procurement cannot substitute equipment without engineering disposition.
              </Text>
            </Box>
          </Paper>
        </Grid.Col>

        {/* Right Column: Package and GSOLVE Handoff */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Title order={4} fw={700} fz={15} c="#111827" mb="md">Package and GSOLVE handoff</Title>
              <Grid gutter="md">
                {/* Engineering Release */}
                <Grid.Col span={6}>
                  <Box>
                    <Text size="xs" fw={600} c="#374151" mb={4}>Engineering release <Text span c="red">*</Text></Text>
                    <Select
                      data={['IFC', 'IFA', 'IFR']}
                      value={engRelease}
                      onChange={(v) => setEngRelease(v || 'IFC')}
                      styles={inputSt}
                    />
                    <Text size="11px" c="#9ca3af" mt={4}>Select · Must be current approved release</Text>
                  </Box>
                </Grid.Col>

                {/* EBOM Baseline */}
                <Grid.Col span={6}>
                  <Box>
                    <Text size="xs" fw={600} c="#374151" mb={4}>EBOM baseline <Text span c="red">*</Text></Text>
                    <Select
                      data={['EBOM', 'EBOM B1.0', 'EBOM B0.2', 'EBOM B0.1']}
                      value={ebomBaseline}
                      onChange={(v) => setEbomBaseline(v || 'EBOM')}
                      styles={inputSt}
                    />
                    <Text size="11px" c="#9ca3af" mt={4}>Select · Approved only</Text>
                  </Box>
                </Grid.Col>

                {/* BOQ Baseline */}
                <Grid.Col span={6}>
                  <Box>
                    <Text size="xs" fw={600} c="#374151" mb={4}>BOQ baseline <Text span c="red">*</Text></Text>
                    <Select
                      data={['BOQ', 'BOQ B1.0', 'BOQ B0.2', 'BOQ B0.1']}
                      value={boqBaseline}
                      onChange={(v) => setBoqBaseline(v || 'BOQ')}
                      styles={inputSt}
                    />
                    <Text size="11px" c="#9ca3af" mt={4}>Select · Approved only</Text>
                  </Box>
                </Grid.Col>

                {/* Technical Attachments */}
                <Grid.Col span={6}>
                  <Box>
                    <Text size="xs" fw={600} c="#374151" mb={4}>Technical attachments <Text span c="red">*</Text></Text>
                    <TextInput
                      value={techAttach}
                      onChange={(e) => setTechAttach(e.target.value)}
                      placeholder="e.g. Datasheets; specifications"
                      styles={inputSt}
                    />
                    <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Controlled document refs</Text>
                  </Box>
                </Grid.Col>
              </Grid>

              {/* Handoff Gates List */}
              <Stack gap="xs" mt="md">
                <HandoffGate
                  title="Technical specification"
                  subtitle={techSpecStatus.replace(/^Ready \(/, '').replace(/\)$/, '')}
                  status={techSpecStatus.startsWith('Ready') ? 'Ready' : techSpecStatus}
                />
                <HandoffGate
                  title="Approved EBOM / BOQ"
                  subtitle={ebomBoqStatus.replace(/^Ready \(/, '').replace(/\)$/, '')}
                  status={ebomBoqStatus.startsWith('Ready') ? 'Ready' : ebomBoqStatus}
                />
                <HandoffGate
                  title="GSOLVE integration"
                  subtitle="Awaiting release command"
                  status={gsolveStatus}
                />
              </Stack>
            </Box>

            {/* Bottom Button */}
            <Button
              fullWidth
              color="green"
              onClick={handleRelease}
              loading={isSubmitting}
              disabled={!techAttach.trim()}
              mt="lg"
              style={{ backgroundColor: '#007336', fontWeight: 600, height: 40, borderRadius: 6 }}
            >
              Release package to GSOLVE
            </Button>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
