import { useState } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select, Table, Text, TextInput, Textarea,
  Title, Badge, Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Evidence Cited Data ────────────────────────────────────────── */
const EVIDENCE_CITED = [
  { id: 'GL-UNICEF-BOR-SLD-001', title: 'Single Line Diagram', revision: 'R2', status: 'IFR'     },
  { id: 'GL-UNICEF-BOR-LAY-001', title: 'PV Layout',            revision: 'R1', status: 'IFA'     },
  { id: 'GL-UNICEF-BOR-CAB-001', title: 'Cable Schedule',       revision: 'R1', status: 'Current' },
];

export default function AiEvidenceLedgerLayout() {
  const [selectedDoc, setSelectedDoc]   = useState('GL-UNICEF-BOR-SLD-001');
  const [decision, setDecision]         = useState('Requires engineering review');
  const [note, setNote]                 = useState('Route to electrical reviewer. No engineering release impact until verified.');

  const handleRecord = () => {
    notifications.show({
      title: 'Human Disposition Recorded',
      message: 'Disposition saved to immutable evidence ledger.',
      color: 'green',
    });
  };

  const roSt = {
    input: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      color: '#374151',
      borderRadius: 6,
      height: 38,
    },
  };
  const areaSt = {
    input: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderRadius: 6,
    },
  };

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              AI Evidence and Human Disposition Ledger
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={720}>
              When AI assistance is enabled, expose each AI observation with source evidence, model/prompt version, confidence/uncertainty, human decision and immutable disposition.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleRecord}
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
            Record human disposition
          </Button>
        </Group>
      </Box>

      {/* ── 3-Column Layout ── */}
      <Grid gutter="md" align="stretch">
        {/* ── Column 1: AI context ── */}
        <Grid.Col span={{ base: 12, md: 3.5, lg: 3.2 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Title order={4} fw={700} fz={15} c="#111827" mb="md">AI context</Title>
              <Stack gap="md">
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Engineering object</Text>
                  <TextInput value="UNI-BOR-ELE-001" readOnly styles={roSt} />
                </Box>
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Evidence sources</Text>
                  <Textarea
                    value={`Design basis DBR-01 SLD R2 Deye inverter datasheet\nReview comments`}
                    readOnly
                    minRows={3}
                    styles={areaSt}
                  />
                </Box>
              </Stack>
            </Box>

            {/* Purple Callout */}
            <Box mt="xl" p="sm" style={{ backgroundColor: '#f8f0fc', borderLeft: '4px solid #7950f2', borderRadius: '0 6px 6px 0' }}>
              <Text size="xs" c="#3b1d7d" lh={1.4}>
                AI is advisory. It cannot approve, close comments, issue IFC or certify completion.
              </Text>
            </Box>
          </Paper>
        </Grid.Col>

        {/* ── Column 2: AI evidence and disposition workspace ── */}
        <Grid.Col span={{ base: 12, md: 5, lg: 5.5 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Group justify="space-between" align="center" mb="md">
                <Title order={4} fw={700} fz={15} c="#111827">AI evidence and disposition workspace</Title>
                <Badge
                  size="sm"
                  radius="xl"
                  style={{ backgroundColor: '#f3f0ff', color: '#7950f2', fontWeight: 600, fontSize: 11, padding: '3px 10px', textTransform: 'none' }}
                >
                  AI active
                </Badge>
              </Group>

              {/* Chat / Bubble Observation */}
              <Stack gap="sm" mb="md">
                {/* User Prompt Bubble */}
                <Box p="sm" style={{ backgroundColor: '#ebfbee', borderRadius: 8, border: '1px solid #d3f9d8', marginLeft: 'auto', maxWidth: '90%' }}>
                  <Text size="xs" c="#182b23" lh={1.5}>
                    Check whether the proposed inverter and battery configuration is internally consistent with the approved design basis.
                  </Text>
                </Box>

                {/* AI Response Bubble */}
                <Box p="sm" style={{ backgroundColor: '#f8f0fc', borderLeft: '4px solid #7950f2', borderRadius: '0 8px 8px 0' }}>
                  <Text size="xs" c="#212529" lh={1.5}>
                    I found one item requiring human verification: the maximum battery charge/discharge current in the design basis should be reconciled with the selected inverter operating limit. Source evidence is attached below.
                  </Text>
                </Box>
              </Stack>

              {/* Evidence Cited Table */}
              <Box mt="md">
                <Title order={5} fw={700} fz={13} c="#111827" mb="xs">Evidence cited</Title>
                <Table verticalSpacing="xs" horizontalSpacing="xs" style={{ minWidth: 320 }}>
                  <Table.Thead>
                    <Table.Tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Document</Table.Th>
                      <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Title</Table.Th>
                      <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Revision</Table.Th>
                      <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {EVIDENCE_CITED.map((row) => {
                      const isSel = selectedDoc === row.id;
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
                          <Table.Td style={{ padding: '8px 6px' }}>
                            <Text size="xs" fw={isSel ? 700 : 500} c={isSel ? '#007336' : '#374151'}>{row.id}</Text>
                          </Table.Td>
                          <Table.Td style={{ padding: '8px 6px' }}>
                            <Text size="xs" c="#4b5563">{row.title}</Text>
                          </Table.Td>
                          <Table.Td style={{ padding: '8px 6px' }}>
                            <Text size="xs" fw={700} c="#d97706">{row.revision}</Text>
                          </Table.Td>
                          <Table.Td style={{ padding: '8px 6px' }}>
                            <Text size="xs" c="#6b7280">{row.status}</Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Box>
            </Box>
          </Paper>
        </Grid.Col>

        {/* ── Column 3: Human disposition ── */}
        <Grid.Col span={{ base: 12, md: 3.5, lg: 3.3 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Title order={4} fw={700} fz={15} c="#111827" mb="md">Human disposition</Title>
              <Stack gap="md">
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Decision</Text>
                  <Select
                    data={['Requires engineering review', 'Accept observation', 'Dismiss observation', 'Request revised prompt']}
                    value={decision}
                    onChange={(v) => setDecision(v || 'Requires engineering review')}
                    styles={roSt}
                  />
                </Box>
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Disposition note</Text>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    minRows={4}
                    styles={areaSt}
                  />
                </Box>
              </Stack>
            </Box>

            <Button
              fullWidth
              color="green"
              onClick={handleRecord}
              mt="xl"
              style={{ backgroundColor: '#007336', fontWeight: 600, height: 40, borderRadius: 6 }}
            >
              Record human disposition
            </Button>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
