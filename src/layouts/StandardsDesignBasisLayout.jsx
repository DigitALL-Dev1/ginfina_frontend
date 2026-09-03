import { useState } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select, Textarea,
  Text, TextInput, Title, Stack, Divider, Badge, Tabs,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Controlled Output Row Helper ───────────────────────────────── */
function OutputRow({ label, sub }) {
  return (
    <>
      <Group justify="space-between" align="center" py={10}>
        <Box>
          <Text size="sm" fw={600} c="#111827">{label}</Text>
          <Text size="11px" c="#9ca3af" mt={1}>{sub}</Text>
        </Box>
        <Badge
          size="sm"
          radius="sm"
          style={{
            backgroundColor: '#ffffff',
            color: '#007336',
            border: '1px solid #22a648',
            fontWeight: 600,
            fontSize: 11,
            padding: '3px 12px',
            textTransform: 'none',
          }}
        >
          Current
        </Badge>
      </Group>
      <Divider color="#f3f4f6" />
    </>
  );
}

/* ─── Overview Tab ───────────────────────────────────────────────── */
function OverviewTab() {
  const [scope, setScope]               = useState('Project / EWP');
  const [standardCode, setStandardCode] = useState('IEC 62548');
  const [edition, setEdition]           = useState('2023');
  const [applicability, setApplicability] = useState('PV array design');
  const [status, setStatus]             = useState('Active');

  const handleApprove = () => {
    notifications.show({
      title: 'Design Basis Approved',
      message: 'Controlled standard record approved and applicable baseline established.',
      color: 'green',
    });
  };

  const handleDraft = () => {
    notifications.show({
      title: 'Draft Saved',
      message: 'Design basis draft saved.',
      color: 'blue',
    });
  };

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6, height: 38 } };
  const areaSt  = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6 } };

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
            {/* Row 1: Scope | Standard/code */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Scope <Text span c="red">*</Text>
                </Text>
                <Select
                  data={['Project / EWP', 'Project-wide', 'Discipline-specific', 'National Code']}
                  value={scope}
                  onChange={(v) => setScope(v || 'Project / EWP')}
                  styles={inputSt}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Select · Controlled scope</Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Standard/code <Text span c="red">*</Text>
                </Text>
                <TextInput
                  value={standardCode}
                  onChange={(e) => setStandardCode(e.target.value)}
                  styles={inputSt}
                />
                <Text size="11px" c="#9ca3af" mt={4}>TextInput · Identifier required</Text>
              </Box>
            </Grid.Col>

            {/* Row 2: Edition/version | Applicability */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Edition/version <Text span c="red">*</Text>
                </Text>
                <TextInput
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  styles={inputSt}
                />
                <Text size="11px" c="#9ca3af" mt={4}>TextInput · Explicit version</Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Applicability <Text span c="red">*</Text>
                </Text>
                <Textarea
                  value={applicability}
                  onChange={(e) => setApplicability(e.target.value)}
                  minRows={3}
                  styles={areaSt}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Textarea · Required</Text>
              </Box>
            </Grid.Col>

            {/* Row 3: Status (left col only) */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Status <Text span c="red">*</Text>
                </Text>
                <Select
                  data={['Active', 'Superseded', 'Pending Approval']}
                  value={status}
                  onChange={(v) => setStatus(v || 'Active')}
                  styles={inputSt}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Select · Active / superseded / pending</Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={6} />
          </Grid>

          {/* Action buttons */}
          <Group mt="xl" gap="sm">
            <Button
              color="green"
              onClick={handleApprove}
              style={{
                backgroundColor: '#007336',
                fontWeight: 600,
                height: 38,
                borderRadius: 6,
              }}
            >
              Approve design basis record
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

      {/* ── Right: Controlled outputs ── */}
      <Grid.Col span={{ base: 12, md: 4.5, lg: 4.5 }}>
        <Paper
          p="lg"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
          }}
        >
          <Title order={4} fw={700} fz={15} c="#111827" mb="sm">
            Controlled outputs and evidence
          </Title>
          <Divider color="#f3f4f6" mb={4} />
          <Stack gap={0}>
            <OutputRow label="Design basis register"   sub="Controlled system output" />
            <OutputRow label="Applicable EWP links"     sub="Controlled system output" />
            <OutputRow label="Supersession history"     sub="Controlled system output" />
            <OutputRow label="Approval state"           sub="Controlled system output" />
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
export default function StandardsDesignBasisLayout() {
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
              Standards, Design Basis and Applicable Requirements
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={680}>
              Maintain controlled project/EWP design basis references, standards, codes, client requirements, utility rules and approved applicability notes.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={() =>
              notifications.show({
                title: 'Record Approved',
                message: 'Design basis record approved successfully.',
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
            Approve design basis record
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
