import { useState } from 'react';
import {
  Box, Button, Grid, Group, Paper, Table, Text, TextInput, Textarea, Title, Badge, Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createDeviation } from '../services/deviationService';
import { getUserId, getEwpId } from '../utils/storage';

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

export default function TechnicalDeviationLayout() {
  const [selectedItem, setSelectedItem]       = useState('PV-MOD-580');
  const [originalReq, setOriginalReq]         = useState('580 W module, Voc <= ...');
  const [substitute, setSubstitute]           = useState('');
  const [deviationSummary, setDeviationSummary] = useState('');
  const [evidence, setEvidence]               = useState('');
  const [procPackageId, setProcPackageId]     = useState('proc-pkg-default');
  const [isSubmitting, setIsSubmitting]       = useState(false);

  // Handoff gate statuses
  const [techSpecStatus, setTechSpecStatus]   = useState('Ready (Complete · 8 files)');
  const [ebomBoqStatus, setEbomBoqStatus]     = useState('Ready (Baseline IFC-001)');
  const [gsolveStatus, setGsolveStatus]       = useState('Pending');

  const handleSubmit = async () => {
    // Validation
    if (!originalReq.trim()) {
      notifications.show({ title: 'Validation Error', message: 'Original requirement is required', color: 'red' });
      return;
    }
    if (!substitute.trim()) {
      notifications.show({ title: 'Validation Error', message: 'Proposed substitute is required', color: 'red' });
      return;
    }
    if (!deviationSummary.trim()) {
      notifications.show({ title: 'Validation Error', message: 'Deviation summary is required', color: 'red' });
      return;
    }
    if (!evidence.trim()) {
      notifications.show({ title: 'Validation Error', message: 'Evidence is required', color: 'red' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        original_requirement: originalReq.trim(),
        proposed_substitute: substitute.trim(),
        deviation_summary: deviationSummary.trim(),
        evidence: evidence.trim(),
        technical_specification_status: techSpecStatus,
        approved_ebom_boq_status: ebomBoqStatus,
        gsolve_integration_status: gsolveStatus,
        procurement_package_id: procPackageId,
        ewp_id: getEwpId(),
        submitted_by: getUserId(),
      };

      const response = await createDeviation(payload);

      // Update gate statuses if available in response
      if (response?.data) {
        if (response.data.technical_specification_status) setTechSpecStatus(response.data.technical_specification_status);
        if (response.data.approved_ebom_boq_status) setEbomBoqStatus(response.data.approved_ebom_boq_status);
        if (response.data.gsolve_integration_status) setGsolveStatus(response.data.gsolve_integration_status);
      }

      notifications.show({
        title: 'Disposition Submitted',
        message: 'Engineering disposition recorded and transmitted to Procurement.',
        color: 'green',
      });

      // Clear user-editable fields
      setSubstitute('');
      setDeviationSummary('');
      setEvidence('');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to submit deviation: ' + error.message,
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6, height: 38 } };
  const roSt    = { input: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', borderRadius: 6, height: 38, color: '#374151', cursor: 'default' } };
  const areaSt  = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6 } };

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Technical Substitution and Deviation Request
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={680}>
              Evaluate proposed supplier/material substitutions or technical deviations against the released engineering requirement and record an engineering disposition.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!substitute.trim() || !deviationSummary.trim() || !evidence.trim()}
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
            Submit engineering disposition
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
                {/* Original Requirement */}
                <Grid.Col span={6}>
                  <Box>
                    <Text size="xs" fw={600} c="#374151" mb={4}>Original requirement <Text span c="red">*</Text></Text>
                    <TextInput
                      value={originalReq}
                      readOnly
                      styles={roSt}
                    />
                    <Text size="11px" c="#9ca3af" mt={4}>Read-only · Released PEP source</Text>
                  </Box>
                </Grid.Col>

                {/* Proposed Substitute */}
                <Grid.Col span={6}>
                  <Box>
                    <Text size="xs" fw={600} c="#374151" mb={4}>Proposed substitute <Text span c="red">*</Text></Text>
                    <TextInput
                      value={substitute}
                      onChange={(e) => setSubstitute(e.target.value)}
                      placeholder="Enter proposed substitute..."
                      styles={inputSt}
                    />
                    <Text size="11px" c="#9ca3af" mt={4}>TextInput / Link · Supplier evidence required</Text>
                  </Box>
                </Grid.Col>

                {/* Deviation Summary */}
                <Grid.Col span={6}>
                  <Box>
                    <Text size="xs" fw={600} c="#374151" mb={4}>Deviation summary <Text span c="red">*</Text></Text>
                    <Textarea
                      value={deviationSummary}
                      onChange={(e) => setDeviationSummary(e.target.value)}
                      placeholder="Enter deviation summary..."
                      minRows={3}
                      styles={areaSt}
                    />
                    <Text size="11px" c="#9ca3af" mt={4}>Textarea · Specific differences</Text>
                  </Box>
                </Grid.Col>

                {/* Evidence */}
                <Grid.Col span={6}>
                  <Box>
                    <Text size="xs" fw={600} c="#374151" mb={4}>Evidence <Text span c="red">*</Text></Text>
                    <TextInput
                      value={evidence}
                      onChange={(e) => setEvidence(e.target.value)}
                      placeholder="e.g. datasheet.pdf"
                      styles={inputSt}
                    />
                    <Text size="11px" c="#9ca3af" mt={4}>Dropzone / Links · Controlled evidence</Text>
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
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!substitute.trim() || !deviationSummary.trim() || !evidence.trim()}
              mt="lg"
              style={{ backgroundColor: '#007336', fontWeight: 600, height: 40, borderRadius: 6 }}
            >
              Submit engineering disposition
            </Button>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
