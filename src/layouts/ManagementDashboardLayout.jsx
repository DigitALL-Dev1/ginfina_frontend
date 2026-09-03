import { useState } from 'react';
import {
  Box, Button, Grid, Group, Paper, Table, Text, Title, Badge, Progress, RingProgress, Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Pilot Packages Data ────────────────────────────────────────── */
const PILOT_PACKAGES = [
  { id: 'UNI-BOR-ELE-001', discipline: 'Electrical / Mini-grid', status: 'In Review',  owner: 'Senthil'     },
  { id: 'UNI-BOR-STR-001', discipline: 'Structural / Mounting',  status: 'In Design',   owner: 'Consultant A' },
  { id: 'UNI-BOR-CIV-001', discipline: 'Civil / Site',          status: 'Input Hold',  owner: 'Consultant B' },
  { id: 'UNI-KEM-ELE-001', discipline: 'Electrical / ATS',      status: 'Ready',       owner: 'Consultant C' },
  { id: 'UNI-KEM-STR-001', discipline: 'Structural / Mounting',  status: 'Draft',       owner: 'Consultant D' },
];

/* ─── Decision Queue Items ───────────────────────────────────────── */
const DECISION_QUEUE = [
  {
    priority: 'P0',
    title: 'IFC approval required',
    subtitle: 'UNI-KEM-ELE-001 · 3h',
    badge: 'Decision',
    badgeBg: '#ffe3e3',
    badgeColor: '#c92a2a',
    priorityColor: '#c92a2a',
    priorityBg: '#ffe3e3',
  },
  {
    priority: 'P1',
    title: 'Electrical review overdue',
    subtitle: 'UNI-BOR-ELE-001 · 1d',
    badge: 'Review',
    badgeBg: '#fff3bf',
    badgeColor: '#d9480f',
    priorityColor: '#d9480f',
    priorityBg: '#fff3bf',
  },
  {
    priority: 'P1',
    title: 'Missing topographic survey',
    subtitle: 'UNI-BOR-CIV-001 · 2d',
    badge: 'Blocker',
    badgeBg: '#fff3bf',
    badgeColor: '#d9480f',
    priorityColor: '#d9480f',
    priorityBg: '#fff3bf',
  },
  {
    priority: 'P2',
    title: 'PEP ready for GSOLVE',
    subtitle: 'UNI-COM-PRE-001',
    badge: 'Ready',
    badgeBg: '#d3f9d8',
    badgeColor: '#007336',
    priorityColor: '#e03131',
    priorityBg: '#ffe3e3',
  },
];

/* ─── Trend SVG Chart ────────────────────────────────────────────── */
function TrendChart() {
  const points = [
    { x: 30,  y: 130, label: '12 Aug' },
    { x: 130, y: 110, label: '13 Aug' },
    { x: 230, y: 120, label: '' },
    { x: 330, y: 80,  label: '14 Aug' },
    { x: 430, y: 60,  label: '15 Aug' },
    { x: 530, y: 40,  label: '16 Aug' },
  ];

  const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  return (
    <Box style={{ width: '100%', height: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box style={{ flex: 1, position: 'relative', width: '100%' }}>
        <svg viewBox="0 0 560 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* Subtle Grid Lines */}
          <line x1="0" y1="40" x2="560" y2="40" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="0" y1="80" x2="560" y2="80" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="0" y1="120" x2="560" y2="120" stroke="#f1f5f9" strokeWidth="1" />

          {/* Green Line */}
          <path d={pathD} fill="none" stroke="#22a648" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Circle Nodes */}
          {points.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r="5"
              fill="#ffffff"
              stroke="#22a648"
              strokeWidth="2.5"
            />
          ))}
        </svg>
      </Box>

      {/* X Axis Labels */}
      <Group justify="space-between" px="xs" mt={4}>
        <Text size="11px" c="#9ca3af">12 Aug</Text>
        <Text size="11px" c="#9ca3af">13 Aug</Text>
        <Text size="11px" c="#9ca3af">14 Aug</Text>
        <Text size="11px" c="#9ca3af">15 Aug</Text>
        <Text size="11px" c="#9ca3af">16 Aug</Text>
      </Group>
    </Box>
  );
}

export default function ManagementDashboardLayout() {
  const [selectedPkg, setSelectedPkg] = useState('UNI-BOR-ELE-001');

  const handleImpactDecision = () => {
    notifications.show({
      title: 'Highest-Impact Decision',
      message: 'Navigating to IFC Approval for UNI-KEM-ELE-001.',
      color: 'green',
    });
  };

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Management Engineering Command Dashboard
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={720}>
              Give management concise visibility of project engineering health, consultant throughput, overdue reviews, approvals waiting, release readiness and decisions needing intervention.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleImpactDecision}
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
            Open highest-impact decision
          </Button>
        </Group>
      </Box>

      {/* ── 4 Top KPI Cards ── */}
      <Grid gutter="md" mb="md">
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <Text size="xs" fw={600} c="#6b7280" mb={4}>EWP health KPIs</Text>
            <Title order={2} fz={28} fw={700} c="#111827" lh={1.1}>12</Title>
            <Text size="11px" c="#22a648" mt={6} fw={600}>Live controlled value</Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <Text size="xs" fw={600} c="#6b7280" mb={4}>Decision queue</Text>
            <Title order={2} fz={28} fw={700} c="#111827" lh={1.1}>4</Title>
            <Text size="11px" c="#22a648" mt={6} fw={600}>Live controlled value</Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <Text size="xs" fw={600} c="#6b7280" mb={4}>Consultant bottlenecks</Text>
            <Title order={2} fz={28} fw={700} c="#111827" lh={1.1}>86%</Title>
            <Text size="11px" c="#22a648" mt={6} fw={600}>Live controlled value</Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <Text size="xs" fw={600} c="#6b7280" mb={4}>Review ageing</Text>
            <Title order={2} fz={28} fw={700} c="#111827" lh={1.1}>Ready</Title>
            <Text size="11px" c="#22a648" mt={6} fw={600}>Live controlled value</Text>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* ── Middle Section: Trend Line Chart & Decision Queue ── */}
      <Grid gutter="md" mb="md" align="stretch">
        {/* Engineering Execution Trend */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Group justify="space-between" align="center" mb="sm">
              <Title order={4} fw={700} fz={15} c="#111827">Engineering execution trend</Title>
              <Badge
                size="sm"
                radius="sm"
                style={{ backgroundColor: '#e6fcf5', color: '#0ca678', fontWeight: 700, fontSize: 11, padding: '2px 8px', textTransform: 'none' }}
              >
                Live
              </Badge>
            </Group>
            <TrendChart />
          </Paper>
        </Grid.Col>

        {/* Decision & Exception Queue */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%' }}>
            <Group justify="space-between" align="center" mb="sm">
              <Title order={4} fw={700} fz={15} c="#111827">Decision and exception queue</Title>
              <Text size="11px" c="#9ca3af">Prioritised</Text>
            </Group>
            <Stack gap="xs">
              {DECISION_QUEUE.map((item, idx) => (
                <Paper
                  key={idx}
                  p="xs"
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    notifications.show({ title: item.title, message: item.subtitle, color: 'blue' })
                  }
                >
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <Badge
                        size="xs"
                        radius="xs"
                        style={{
                          backgroundColor: item.priorityBg,
                          color: item.priorityColor,
                          fontWeight: 700,
                          padding: '1px 6px',
                        }}
                      >
                        {item.priority}
                      </Badge>
                      <Box>
                        <Text size="xs" fw={700} c="#111827">{item.title}</Text>
                        <Text size="10px" c="#9ca3af">{item.subtitle}</Text>
                      </Box>
                    </Group>
                    <Badge
                      size="sm"
                      radius="sm"
                      style={{
                        backgroundColor: item.badgeBg,
                        color: item.badgeColor,
                        fontWeight: 700,
                        fontSize: 11,
                        padding: '2px 8px',
                        textTransform: 'none',
                      }}
                    >
                      {item.badge}
                    </Badge>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* ── Bottom Section: Packages Table & Readiness ── */}
      <Grid gutter="md" align="stretch">
        {/* UNICEF Pilot Engineering Packages */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%' }}>
            <Title order={4} fw={700} fz={15} c="#111827" mb="sm">
              UNICEF pilot engineering packages
            </Title>
            <Table verticalSpacing="xs" horizontalSpacing="sm" style={{ minWidth: 400 }}>
              <Table.Thead>
                <Table.Tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>EWP ID</Table.Th>
                  <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Discipline</Table.Th>
                  <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Status</Table.Th>
                  <Table.Th style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Owner</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {PILOT_PACKAGES.map((row) => {
                  const isSel = selectedPkg === row.id;
                  const statusColor = row.status === 'Ready' ? '#007336' : row.status === 'Draft' ? '#6b7280' : '#d97706';
                  const statusBg = row.status === 'Ready' ? '#d3f9d8' : row.status === 'Draft' ? '#f3f4f6' : '#fff3cd';
                  return (
                    <Table.Tr
                      key={row.id}
                      onClick={() => setSelectedPkg(row.id)}
                      style={{
                        backgroundColor: isSel ? '#ebfbee' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 150ms ease',
                      }}
                    >
                      <Table.Td style={{ padding: '8px 10px' }}>
                        <Text size="xs" fw={isSel ? 700 : 500} c={isSel ? '#007336' : '#374151'}>{row.id}</Text>
                      </Table.Td>
                      <Table.Td style={{ padding: '8px 10px' }}>
                        <Text size="xs" c="#4b5563">{row.discipline}</Text>
                      </Table.Td>
                      <Table.Td style={{ padding: '8px 10px' }}>
                        <Badge
                          size="xs"
                          radius="xs"
                          style={{
                            backgroundColor: statusBg,
                            color: statusColor,
                            fontWeight: 700,
                            padding: '2px 8px',
                            textTransform: 'none',
                          }}
                        >
                          {row.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ padding: '8px 10px' }}>
                        <Text size="xs" c="#6b7280">{row.owner}</Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Paper>
        </Grid.Col>

        {/* Readiness by Workflow Gate */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Title order={4} fw={700} fz={15} c="#111827" mb="md">
              Readiness by workflow gate
            </Title>
            <Group align="center" gap="lg">
              <RingProgress
                size={95}
                thickness={10}
                roundCaps
                sections={[{ value: 72, color: '#22a648' }]}
                label={
                  <Text size="md" fw={700} ta="center" c="#111827">
                    72%
                  </Text>
                }
              />
              <Box style={{ flex: 1 }}>
                <Text size="xs" fw={700} c="#111827" mb={6}>R1.0 pilot readiness</Text>
                <Progress value={72} color="#22a648" size="sm" radius="xl" mb={6} />
                <Text size="11px" c="#9ca3af" lh={1.4}>
                  Security isolation, IFC baseline and restore proof remain production blockers.
                </Text>
              </Box>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
