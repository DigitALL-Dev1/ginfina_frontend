import { useState } from 'react';
import {
  Box, Button, Grid, Group, Paper, Table, Text, TextInput, Title, Progress, Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Pilot Approval Package Data ────────────────────────────────── */
const APPROVAL_ITEMS = [
  { id: 'GL-UNICEF-BOR-SLD-001', title: 'Single Line Diagram', revision: 'R2', status: 'IFR'     },
  { id: 'GL-UNICEF-BOR-LAY-001', title: 'PV Layout',            revision: 'R1', status: 'IFA'     },
  { id: 'GL-UNICEF-BOR-CAB-001', title: 'Cable Schedule',       revision: 'R1', status: 'Current' },
  { id: 'GL-UNICEF-BOR-EAR-001', title: 'Earthing Layout',      revision: 'R0', status: 'Draft'   },
];

/* ─── Evidence Timeline Item ─────────────────────────────────────── */
function EvidenceItem({ timestamp, title, subtitle, isLast }) {
  return (
    <Box style={{ position: 'relative', paddingLeft: 24, paddingBottom: isLast ? 0 : 20 }}>
      {!isLast && (
        <Box
          style={{
            position: 'absolute',
            left: 5,
            top: 14,
            bottom: 0,
            width: 2,
            backgroundColor: '#d1d5db',
          }}
        />
      )}
      <Box
        style={{
          position: 'absolute',
          left: 0,
          top: 4,
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: '#007336',
        }}
      />
      <Text size="11px" c="#9ca3af" mb={2}>{timestamp}</Text>
      <Text size="sm" fw={700} c="#111827">{title}</Text>
      <Text size="xs" c="#6b7280" mt={2}>{subtitle}</Text>
    </Box>
  );
}

export default function TechnicalCompletionLayout() {
  const [selectedDoc, setSelectedDoc]             = useState('GL-UNICEF-BOR-SLD-001');
  const [outstandingItems, setOutstandingItems]   = useState('None');

  const handleCertify = () => {
    notifications.show({
      title: 'Technical Completion Certified',
      message: 'Scope certified complete. Commercial invoice eligibility unlocked.',
      color: 'green',
    });
  };

  const handleReturn = () => {
    notifications.show({
      title: 'Returned for Revision',
      message: 'Package returned for revision before completion certification.',
      color: 'orange',
    });
  };

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6, height: 38 } };
  const roSt    = { input: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', borderRadius: 6, height: 38, color: '#374151', cursor: 'default' } };

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Technical Completion Certification
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={680}>
              Certify that the EWP/EWO technical scope, deliverables, comments, releases and required completion evidence are complete before commercial invoice eligibility is signalled.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleCertify}
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
            Certify technical completion
          </Button>
        </Group>
      </Box>

      {/* ── Top Section: 2 Columns ── */}
      <Grid gutter="md" mb="md" align="stretch">
        {/* Left: Approval Package */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Title order={4} fw={700} fz={15} c="#111827" mb="sm">Approval package</Title>
              <Table verticalSpacing="sm" horizontalSpacing="sm" style={{ minWidth: 320 }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Document</Table.Th>
                    <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Title</Table.Th>
                    <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Revision</Table.Th>
                    <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {APPROVAL_ITEMS.map((row) => {
                    const isSel = selectedDoc === row.id;
                    const revColor = row.revision === 'R0' ? '#c62828' : '#d97706';
                    return (
                      <Table.Tr
                        key={row.id}
                        onClick={() => setSelectedDoc(row.id)}
                        style={{
                          backgroundColor: isSel ? '#ebfbee' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 150ms ease',
                        }}
                      >
                        <Table.Td style={{ padding: '10px 8px' }}>
                          <Text size="xs" fw={isSel ? 700 : 500} c={isSel ? '#007336' : '#374151'}>{row.id}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '10px 8px' }}>
                          <Text size="xs" c="#4b5563">{row.title}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '10px 8px' }}>
                          <Text size="xs" fw={700} style={{ color: revColor }}>{row.revision}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '10px 8px' }}>
                          <Text size="xs" c="#6b7280">{row.status}</Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Box>

            {/* Notice Callout */}
            <Box mt="md" p="sm" style={{ backgroundColor: '#f2fbf5', borderLeft: '4px solid #007336', borderRadius: '0 6px 6px 0' }}>
              <Text size="xs" c="#182b23" lh={1.4}>
                All required review comments must be verified closed before engineering approval or IFC release.
              </Text>
            </Box>
          </Paper>
        </Grid.Col>

        {/* Right: Named Decision Authority */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Title order={4} fw={700} fz={15} c="#111827" mb="md">Named decision authority</Title>
              <Grid gutter="md">
                {/* Deliverable Completeness */}
                <Grid.Col span={6}>
                  <Box>
                    <Text size="xs" fw={600} c="#374151" mb={4}>Deliverable completeness <Text span c="red">*</Text></Text>
                    <TextInput value="12/12 complete" readOnly styles={roSt} />
                    <Text size="11px" c="#9ca3af" mt={4}>Read-only Status · System derived</Text>
                  </Box>
                </Grid.Col>

                {/* Open Comments */}
                <Grid.Col span={6}>
                  <Box>
                    <Text size="xs" fw={600} c="#374151" mb={4}>Open comments <Text span c="red">*</Text></Text>
                    <TextInput value="0 Major / 0 Critical" readOnly styles={roSt} />
                    <Text size="11px" c="#9ca3af" mt={4}>Read-only Count · System derived</Text>
                  </Box>
                </Grid.Col>

                {/* Current Release */}
                <Grid.Col span={6}>
                  <Box>
                    <Text size="xs" fw={600} c="#374151" mb={4}>Current release <Text span c="red">*</Text></Text>
                    <TextInput value="IFC-002" readOnly styles={roSt} />
                    <Text size="11px" c="#9ca3af" mt={4}>Read-only · Current baseline</Text>
                  </Box>
                </Grid.Col>

                {/* Outstanding Items */}
                <Grid.Col span={6}>
                  <Box>
                    <Text size="xs" fw={600} c="#374151" mb={4}>Outstanding items <Text span c="red">*</Text></Text>
                    <TextInput
                      value={outstandingItems}
                      onChange={(e) => setOutstandingItems(e.target.value)}
                      styles={inputSt}
                    />
                    <Text size="11px" c="#9ca3af" mt={4}>Checklist · Must be resolved or waived</Text>
                  </Box>
                </Grid.Col>
              </Grid>

              {/* Decision Readiness Progress */}
              <Box mt="md">
                <Text size="xs" fw={700} c="#111827" mb={6}>Decision readiness</Text>
                <Progress value={92} color="#007336" size="sm" radius="xl" />
                <Text size="11px" c="#6b7280" mt={4}>23 of 25 controlled checks passed</Text>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Group mt="lg" gap="sm">
              <Button
                variant="default"
                onClick={handleReturn}
                style={{ borderColor: '#d1d5db', color: '#374151', fontWeight: 600, height: 38, borderRadius: 6 }}
              >
                Return for revision
              </Button>
              <Button
                color="green"
                onClick={handleCertify}
                style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6 }}
              >
                Certify technical completion
              </Button>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* ── Bottom Section: Approval Evidence ── */}
      <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <Title order={4} fw={700} fz={15} c="#111827" mb="md">Approval evidence</Title>
        <Stack gap={0}>
          <EvidenceItem
            timestamp="16 Aug 2026 · 00:48"
            title="Electrical review completed"
            subtitle="Named reviewer submitted approved-with-comments decision; all comments closed."
          />
          <EvidenceItem
            timestamp="15 Aug 2026 · 18:32"
            title="Submission manifest frozen"
            subtitle="SUB-UNICEF-024 · hash recorded in immutable evidence ledger."
            isLast
          />
        </Stack>
      </Paper>
    </Box>
  );
}
