import { useState } from 'react';
import {
  Box, Button, Grid, Group, Paper, MultiSelect, Select,
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
  const [company, setCompany]             = useState('ABC Engineering Ltd');
  const [disciplines, setDisciplines]     = useState(['Electrical', 'Structural']);
  const [regNumber, setRegNumber]         = useState('PE-XXXX');
  const [ndaStatus, setNdaStatus]         = useState('Executed');
  const [evidenceFile, setEvidenceFile]   = useState('Professional indemnity.pdf');

  const handleSubmit = () => {
    notifications.show({
      title: 'Readiness Evidence Submitted',
      message: 'Consultant compliance evidence recorded and submitted for validation.',
      color: 'green',
    });
  };

  const handleDraft = () => {
    notifications.show({
      title: 'Draft Saved',
      message: 'Consultant profile draft saved.',
      color: 'blue',
    });
  };

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6, height: 38 } };
  const roSt    = { input: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#374151', borderRadius: 6, height: 38, cursor: 'default' } };

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
            {/* Row 1: Consultant company | Engineering disciplines */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Consultant company <Text span c="red">*</Text>
                </Text>
                <TextInput
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  styles={inputSt}
                />
                <Text size="11px" c="#9ca3af" mt={4}>TextInput · Bound to tenant/company record</Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Engineering disciplines <Text span c="red">*</Text>
                </Text>
                <MultiSelect
                  data={['Electrical', 'Structural', 'Civil', 'Mechanical', 'Solar PV']}
                  value={disciplines}
                  onChange={setDisciplines}
                  styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Controlled discipline taxonomy</Text>
              </Box>
            </Grid.Col>

            {/* Row 2: Professional registration | NDA status */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Professional registration <Text span c="red">*</Text>
                </Text>
                <TextInput
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  styles={inputSt}
                />
                <Text size="11px" c="#9ca3af" mt={4}>TextInput · Required where discipline/jurisdiction requires</Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  NDA status <Text span c="red">*</Text>
                </Text>
                <TextInput
                  value={ndaStatus}
                  readOnly
                  styles={roSt}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Read-only Badge · System derived; not consultant editable</Text>
              </Box>
            </Grid.Col>

            {/* Row 3: Insurance / compliance evidence (left col only) */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Insurance / compliance evidence <Text span c="red">*</Text>
                </Text>
                <TextInput
                  value={evidenceFile}
                  onChange={(e) => setEvidenceFile(e.target.value)}
                  styles={inputSt}
                />
                <Text size="11px" c="#9ca3af" mt={4}>FileInput · Virus scan; expiry if applicable</Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={6} />
          </Grid>

          {/* Action buttons */}
          <Group mt="xl" gap="sm">
            <Button
              color="green"
              onClick={handleSubmit}
              style={{
                backgroundColor: '#007336',
                fontWeight: 600,
                height: 38,
                borderRadius: 6,
              }}
            >
              Submit readiness evidence
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
            <OutputRow label="Readiness status"             sub="Controlled system output" />
            <OutputRow label="Approved disciplines"         sub="Controlled system output" />
            <OutputRow label="Credential expiry warnings"   sub="Controlled system output" />
            <OutputRow label="Blocking compliance gaps"     sub="Controlled system output" />
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
export default function ConsultantProfileLayout() {
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
              Consultant Profile and Engineering Readiness
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={680}>
              Maintain consultant discipline capability, credentials, NDA/compliance evidence and readiness status before engineering work can be issued.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={() =>
              notifications.show({
                title: 'Evidence Submitted',
                message: 'Consultant readiness evidence recorded successfully.',
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
            Submit readiness evidence
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
