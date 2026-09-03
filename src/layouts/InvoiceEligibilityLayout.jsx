import { useState } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select, Textarea,
  Text, TextInput, Title, Stack, Divider, Badge, Tabs,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Read-only Field Helper ─────────────────────────────────────── */
function ReadField({ label, value, hint, required }) {
  return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>
        {label}{required && <Text span c="red"> *</Text>}
      </Text>
      <TextInput
        value={value}
        readOnly
        styles={{
          input: {
            backgroundColor: '#f9fafb',
            borderColor: '#e5e7eb',
            color: '#374151',
            borderRadius: 6,
            height: 38,
            cursor: 'default',
          },
        }}
      />
      {hint && <Text size="11px" c="#9ca3af" mt={4}>{hint}</Text>}
    </Box>
  );
}

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
  const [eligibilityStatus, setEligibilityStatus] = useState('Eligible');
  const [holdReason, setHoldReason]               = useState('Missing tax invoice reference');

  const handleSendSignal = () => {
    notifications.show({
      title: 'Signal Dispatched',
      message: 'Eligibility status signal sent to GSOLVE / FINAC commercial stream.',
      color: 'green',
    });
  };

  const handleDraft = () => {
    notifications.show({
      title: 'Draft Saved',
      message: 'Invoice eligibility draft saved.',
      color: 'blue',
    });
  };

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
            {/* Row 1: Technical completion | EWO commercial reference */}
            <Grid.Col span={6}>
              <ReadField
                label="Technical completion"
                value="Certified"
                hint="Read-only Status · Required"
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ReadField
                label="EWO commercial reference"
                value="EWO-EL-001"
                hint="Read-only · Issued EWO"
                required
              />
            </Grid.Col>

            {/* Row 2: Eligibility status | Hold reason */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Eligibility status <Text span c="red">*</Text>
                </Text>
                <Select
                  data={['Eligible', 'On Hold', 'Not Eligible']}
                  value={eligibilityStatus}
                  onChange={(v) => setEligibilityStatus(v || 'Eligible')}
                  styles={{
                    input: {
                      backgroundColor: '#ffffff',
                      borderColor: '#d1d5db',
                      borderRadius: 6,
                      height: 38,
                    },
                  }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Read-only / Decision · Derived plus authorised hold</Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Hold reason <Text span c="red">*</Text>
                </Text>
                <Textarea
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  minRows={3}
                  styles={{
                    input: {
                      backgroundColor: '#ffffff',
                      borderColor: '#d1d5db',
                      borderRadius: 6,
                    },
                  }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Textarea · Only for authorised hold if technically relevant</Text>
              </Box>
            </Grid.Col>
          </Grid>

          {/* Action buttons */}
          <Group mt="xl" gap="sm">
            <Button
              color="green"
              onClick={handleSendSignal}
              style={{
                backgroundColor: '#007336',
                fontWeight: 600,
                height: 38,
                borderRadius: 6,
              }}
            >
              Send eligibility signal
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
            <OutputRow label="Eligibility signal"             sub="Controlled system output" />
            <OutputRow label="EWO/consultant reference"       sub="Controlled system output" />
            <OutputRow label="Completion evidence link"       sub="Controlled system output" />
            <OutputRow label="GSOLVE/FINAC handoff receipt"   sub="Controlled system output" />
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
export default function InvoiceEligibilityLayout() {
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
              Invoice Eligibility and Commercial Handoff
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={680}>
              Expose the technical conditions required for consultant billing and send an eligibility status to the commercial/FINAC process without creating or approving a payment.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={() =>
              notifications.show({
                title: 'Signal Dispatched',
                message: 'Eligibility status signal sent to GSOLVE / FINAC commercial stream.',
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
            Send eligibility signal
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
