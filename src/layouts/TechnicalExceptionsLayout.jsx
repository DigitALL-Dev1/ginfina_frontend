import { useState } from 'react';
import {
  Box, Button, Grid, Group, Paper, MultiSelect, Select,
  Text, TextInput, Title, Stack, Badge, Tabs,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Overview Tab ───────────────────────────────────────────────── */
function OverviewTab() {
  const [exceptionType, setExceptionType] = useState(['Deviation', 'Waiver']);
  const [riskLevel, setRiskLevel]         = useState(['High', 'Medium']);
  const [status, setStatus]               = useState(['Open', 'Approved']);
  const [expiry, setExpiry]               = useState('Next 30 days');

  const handleOpen = () => {
    notifications.show({
      title: 'Exception Opened',
      message: 'Opening selected technical exception and waiver record.',
      color: 'green',
    });
  };

  const handleDraft = () => {
    notifications.show({
      title: 'Draft Saved',
      message: 'Exception filters and draft state saved.',
      color: 'blue',
    });
  };

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6, height: 38 } };

  return (
    <Grid gutter="md" align="flex-start">
      {/* ── Left: Record details ── */}
      <Grid.Col span={{ base: 12, md: 7.5, lg: 7.5 }}>
        <Paper
          p="lg"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
          }}
        >
          {/* Panel Header */}
          <Group justify="space-between" align="center" mb="md">
            <Title order={4} fw={700} fz={15} c="#111827">Record details</Title>
            <Badge
              size="sm"
              radius="sm"
              style={{
                backgroundColor: '#e6fcf5',
                color: '#0ca678',
                fontWeight: 700,
                fontSize: 11,
                padding: '3px 12px',
                textTransform: 'none',
              }}
            >
              Authorised
            </Badge>
          </Group>

          <Grid gutter="md">
            {/* Row 1: Exception type | Risk level */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>Exception type</Text>
                <MultiSelect
                  data={['Deviation', 'Waiver', 'Concession', 'Non-conformance']}
                  value={exceptionType}
                  onChange={setExceptionType}
                  styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Controlled taxonomy</Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>Risk level</Text>
                <MultiSelect
                  data={['High', 'Medium', 'Low', 'Critical']}
                  value={riskLevel}
                  onChange={setRiskLevel}
                  styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Controlled risk</Text>
              </Box>
            </Grid.Col>

            {/* Row 2: Status | Expiry */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>Status</Text>
                <MultiSelect
                  data={['Open', 'Approved', 'Pending', 'Closed', 'Expired']}
                  value={status}
                  onChange={setStatus}
                  styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Lifecycle state</Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>Expiry</Text>
                <TextInput
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  styles={inputSt}
                />
                <Text size="11px" c="#9ca3af" mt={4}>DateRangePicker · Applies to temporary approvals</Text>
              </Box>
            </Grid.Col>
          </Grid>

          {/* Action buttons */}
          <Group mt="xl" gap="sm">
            <Button
              color="green"
              onClick={handleOpen}
              style={{
                backgroundColor: '#007336',
                fontWeight: 600,
                height: 38,
                borderRadius: 6,
              }}
            >
              Open selected exception
            </Button>
            <Button
              variant="default"
              onClick={handleDraft}
              style={{
                borderColor: '#d1d5db',
                color: '#374151',
                fontWeight: 600,
                height: 38,
                borderRadius: 6,
              }}
            >
              Save draft
            </Button>
          </Group>
        </Paper>
      </Grid.Col>

      {/* ── Right: Evidence and disposition ── */}
      <Grid.Col span={{ base: 12, md: 4.5, lg: 4.5 }}>
        <Paper
          p="lg"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
          }}
        >
          <Title order={4} fw={700} fz={15} c="#111827" mb="md">
            Evidence and disposition
          </Title>

          <Stack gap="md">
            {/* Card 1: Reviewer comment */}
            <Paper p="sm" style={{ border: '1px solid #e5e7eb', borderRadius: 6, backgroundColor: '#ffffff' }}>
              <Group justify="space-between" align="center" mb={6}>
                <Text size="xs" fw={700} c="#111827">Reviewer - Electrical</Text>
                <Badge
                  size="sm"
                  radius="sm"
                  style={{
                    backgroundColor: '#fff3cd',
                    color: '#d97706',
                    fontWeight: 700,
                    fontSize: 11,
                    padding: '2px 8px',
                    textTransform: 'none',
                  }}
                >
                  Open
                </Badge>
              </Group>
              <Text size="xs" c="#374151" mb={6} lh={1.4}>
                Confirm cable size against revised route length and voltage-drop limit.
              </Text>
              <Text size="11px" c="#9ca3af">
                Raised against R2 · Drawing GL-UNICEF-BOR-SLD-001
              </Text>
            </Paper>

            {/* Card 2: Consultant response */}
            <Paper p="sm" style={{ border: '1px solid #e5e7eb', borderRadius: 6, backgroundColor: '#ffffff' }}>
              <Group justify="space-between" align="center" mb={6}>
                <Text size="xs" fw={700} c="#111827">Consultant response</Text>
                <Badge
                  size="sm"
                  radius="sm"
                  style={{
                    backgroundColor: '#e7f5ff',
                    color: '#1971c2',
                    fontWeight: 700,
                    fontSize: 11,
                    padding: '2px 8px',
                    textTransform: 'none',
                  }}
                >
                  Response
                </Badge>
              </Group>
              <Text size="xs" c="#374151" lh={1.4}>
                Updated cable sizing calculation and revised schedule attached for verification.
              </Text>
            </Paper>
          </Stack>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}

/* ─── Placeholder Tab ────────────────────────────────────────────── */
function PlaceholderTab({ label }) {
  return (
    <Paper p="xl" style={{ border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
      <Text c="dimmed" size="sm">{label} content — controlled R1.0 pilot data.</Text>
    </Paper>
  );
}

/* ─── Main Layout ────────────────────────────────────────────────── */
export default function TechnicalExceptionsLayout() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabStyle = (key) =>
    activeTab === key ? { color: '#007336', borderBottomColor: '#007336', fontWeight: 600 } : {};

  return (
    <Box>
      {/* Page Header */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Technical Exception, Deviation and Waiver Control
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={680}>
              Control technical exceptions that cannot be resolved through normal workflow, including rationale, risk, evidence, authority, expiry and affected engineering objects.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={() =>
              notifications.show({
                title: 'Exception Opened',
                message: 'Opening selected technical exception and waiver record.',
                color: 'green',
              })
            }
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
            Open selected exception
          </Button>
        </Group>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab} mb="md">
        <Tabs.List style={{ borderBottom: '1px solid #e5e7eb', gap: 24 }}>
          <Tabs.Tab value="overview"  style={tabStyle('overview')}>Overview</Tabs.Tab>
          <Tabs.Tab value="evidence"  style={tabStyle('evidence')}>Evidence</Tabs.Tab>
          <Tabs.Tab value="history"   style={tabStyle('history')}>History</Tabs.Tab>
          <Tabs.Tab value="audit"     style={tabStyle('audit')}>Audit</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="overview" pt="md"><OverviewTab /></Tabs.Panel>
        <Tabs.Panel value="evidence" pt="md"><PlaceholderTab label="Evidence" /></Tabs.Panel>
        <Tabs.Panel value="history"  pt="md"><PlaceholderTab label="History" /></Tabs.Panel>
        <Tabs.Panel value="audit"    pt="md"><PlaceholderTab label="Audit" /></Tabs.Panel>
      </Tabs>
    </Box>
  );
}
