import { useState } from 'react';
import {
  Box, Button, Grid, Group, Paper, Table, Text, Title, Badge, Stack, Divider, ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

const REVIEW_SET = [
  { id: 'DEL-001', name: 'Electrical SLD', revision: 'R2', status: 'In Review' },
  { id: 'DEL-002', name: 'Cable schedule',  revision: 'R1', status: 'In Review' },
  { id: 'DEL-003', name: 'PV layout',       revision: 'R1', status: 'Revise'   },
  { id: 'DEL-004', name: 'Earthing layout', revision: 'R0', status: 'Draft'    },
];

const COMMENTS = [
  {
    id: 'CMT-014',
    reviewer: 'Electrical Reviewer',
    status: 'Open',
    statusColor: '#d97706',
    statusBg: '#fff3cd',
    body: 'Verify DC isolator rating against inverter maximum input current.',
    ref: 'CMT-014 · SLD R2',
  },
  {
    id: 'CMT-011',
    reviewer: 'Structural Reviewer',
    status: 'Closed',
    statusColor: '#007336',
    statusBg: '#d3f9d8',
    body: 'Mounting rail spacing aligned to approved structural calculation.',
    ref: 'CMT-011 · Layout R1',
  },
  {
    id: 'CMT-017',
    reviewer: 'Engineering Manager',
    status: 'P0',
    statusColor: '#c62828',
    statusBg: '#ffe0e0',
    body: 'Grid protection interface requires named approval before IFC.',
    ref: 'CMT-017 · Protection',
  },
];

export default function ReviewWorkspaceLayout() {
  const [selectedId, setSelectedId] = useState('DEL-001');

  const handleSubmit = () => {
    notifications.show({
      title: 'Review Decision Submitted',
      message: 'Named review decision recorded and logged in audit trial.',
      color: 'green',
    });
  };

  const handleAddComment = () => {
    notifications.show({
      title: 'Add Comment',
      message: 'Opening comment tool at current coordinates.',
      color: 'blue',
    });
  };

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Engineering Review Workspace
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={680}>
              Provide a controlled desktop-first workspace to review the PDF rendition, raise structured comments,
              inspect evidence, compare revisions and submit a named review decision.
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
            Submit review decision
          </Button>
        </Group>
      </Box>

      {/* ── 3-Column Layout ── */}
      <Grid gutter="md" align="stretch">
        {/* ── Col 1: Review Set (Left) ── */}
        <Grid.Col span={{ base: 12, md: 3.5, lg: 3.2 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Title order={4} fw={700} fz={15} c="#111827" mb="sm">Review set</Title>
              <ScrollArea>
                <Table verticalSpacing="xs" horizontalSpacing="xs" style={{ minWidth: 260 }}>
                  <Table.Thead>
                    <Table.Tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>ID</Table.Th>
                      <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Deliverable</Table.Th>
                      <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Revision</Table.Th>
                      <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {REVIEW_SET.map((row) => {
                      const isSel = selectedId === row.id;
                      const revColor = row.revision === 'R0' ? '#c62828' : '#d97706';
                      return (
                        <Table.Tr
                          key={row.id}
                          onClick={() => setSelectedId(row.id)}
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
                            <Text size="xs" c="#4b5563">{row.name}</Text>
                          </Table.Td>
                          <Table.Td style={{ padding: '8px 6px' }}>
                            <Text size="xs" fw={700} style={{ color: revColor }}>{row.revision}</Text>
                          </Table.Td>
                          <Table.Td style={{ padding: '8px 6px' }}>
                            <Text size="xs" c="#6b7280">{row.status}</Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Box>

            <Box mt="md" p="sm" style={{ backgroundColor: '#f2fbf5', borderLeft: '4px solid #007336', borderRadius: '0 6px 6px 0' }}>
              <Text size="xs" c="#182b23" lh={1.4}>
                Submission SUB-UNICEF-024 is immutable. Later uploads do not change this review set.
              </Text>
            </Box>
          </Paper>
        </Grid.Col>

        {/* ── Col 2: Engineering Review Rendition (Center) ── */}
        <Grid.Col span={{ base: 12, md: 5, lg: 5.3 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Group justify="space-between" align="center" mb="sm">
              <Title order={4} fw={700} fz={15} c="#111827">Engineering review rendition</Title>
              <Badge
                size="sm"
                radius="sm"
                style={{ backgroundColor: '#e7f5ff', color: '#1971c2', fontWeight: 700, fontSize: 11, padding: '2px 8px', textTransform: 'none' }}
              >
                R2
              </Badge>
            </Group>

            {/* Rendition Canvas Container */}
            <Box style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 380 }}>
              {/* Simulated document sheet */}
              <Box style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: 6, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: 14, gap: 10 }}>
                {/* Title block lines */}
                <Box style={{ height: 10, width: '55%', backgroundColor: '#e5e7eb', borderRadius: 3 }} />
                <Box style={{ height: 8,  width: '35%', backgroundColor: '#f3f4f6', borderRadius: 3 }} />

                {/* Drawing area with cross-hair */}
                <Box style={{ flex: 1, border: '2px dashed #d1d5db', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px 0', position: 'relative', minHeight: 180 }}>
                  <Box style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, backgroundColor: '#22a648', transform: 'translateY(-50%)' }} />
                  <Box style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, backgroundColor: '#22a648', transform: 'translateX(-50%)' }} />
                </Box>

                {/* Footer lines */}
                <Box style={{ height: 8,  width: '70%', backgroundColor: '#e5e7eb', borderRadius: 3 }} />
                <Box style={{ height: 6,  width: '45%', backgroundColor: '#f3f4f6', borderRadius: 3 }} />
              </Box>

              {/* Fit width pill */}
              <Box style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <Button variant="default" size="compact-xs" style={{ borderColor: '#d1d5db', color: '#6b7280', fontSize: 11, height: 22 }}>
                  Fit width
                </Button>
              </Box>
            </Box>

            {/* Actions below viewer */}
            <Group mt="md" gap="sm">
              <Button
                variant="default"
                onClick={handleAddComment}
                style={{ borderColor: '#d1d5db', color: '#374151', fontWeight: 600, height: 38, borderRadius: 6 }}
              >
                Add comment
              </Button>
              <Button
                color="green"
                onClick={handleSubmit}
                style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6 }}
              >
                Submit review decision
              </Button>
            </Group>
          </Paper>
        </Grid.Col>

        {/* ── Col 3: Review Comments (Right) ── */}
        <Grid.Col span={{ base: 12, md: 3.5, lg: 3.5 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%' }}>
            <Group justify="space-between" align="center" mb="sm">
              <Title order={4} fw={700} fz={15} c="#111827">Review comments</Title>
              <Badge
                size="sm"
                radius="sm"
                style={{ backgroundColor: '#fff3cd', color: '#d97706', fontWeight: 700, fontSize: 11, padding: '2px 8px', textTransform: 'none' }}
              >
                3 open
              </Badge>
            </Group>

            <Stack gap="sm">
              {COMMENTS.map((c) => (
                <Paper key={c.id} p="sm" style={{ border: '1px solid #e5e7eb', borderRadius: 6, backgroundColor: '#ffffff' }}>
                  <Group justify="space-between" align="center" mb={4}>
                    <Text size="xs" fw={700} c="#111827">{c.reviewer}</Text>
                    <Text size="xs" fw={700} style={{ backgroundColor: c.statusBg, color: c.statusColor, borderRadius: 4, padding: '2px 8px' }}>
                      {c.status}
                    </Text>
                  </Group>
                  <Text size="xs" c="#374151" mb={6} lh={1.4}>{c.body}</Text>
                  <Text size="11px" c="#9ca3af">{c.ref}</Text>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
