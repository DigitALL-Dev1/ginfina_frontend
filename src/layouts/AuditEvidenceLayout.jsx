import { useState } from 'react';
import {
  Box, Button, Grid, Group, Paper, Text, TextInput, Title, Badge, Code, Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Audit Events Data ──────────────────────────────────────────── */
const AUDIT_EVENTS = [
  {
    id: 'AUD-20260816-00184',
    timestamp: '16 Aug 2026 · 01:02',
    name: 'engineering.release.created',
    detail: 'IFC-001 baseline created by Engineering Manager.',
    actor: 'Engineering Manager',
    object: 'UNI-BOR-ELE-001 / IFC-001',
    hash: '77f2...9ab1',
    rawPayload: `event: engineering.release.created
source: GINFINA
manifest_hash: 77f2...9ab1
role_scope_check: PASS
authority_check: PASS`,
  },
  {
    id: 'AUD-20260816-00183',
    timestamp: '16 Aug 2026 · 00:48',
    name: 'engineering.approval.approved',
    detail: 'Named technical approval with MFA assurance level AAL2.',
    actor: 'Engineering Manager',
    object: 'UNI-BOR-ELE-001 / SUB-003',
    hash: 'a3d4...88c2',
    rawPayload: `event: engineering.approval.approved
source: GINFINA
manifest_hash: a3d4...88c2
role_scope_check: PASS
authority_check: PASS`,
  },
  {
    id: 'AUD-20260815-00122',
    timestamp: '15 Aug 2026 · 18:32',
    name: 'submission.manifest.frozen',
    detail: 'SUB-UNICEF-024 · SHA-256 recorded.',
    actor: 'Design Lead',
    object: 'SUB-UNICEF-024',
    hash: '90e1...7bc4',
    rawPayload: `event: submission.manifest.frozen
source: GINFINA
manifest_hash: 90e1...7bc4
role_scope_check: PASS
authority_check: PASS`,
  },
  {
    id: 'AUD-20260815-00098',
    timestamp: '15 Aug 2026 · 16:14',
    name: 'review.comment.closed',
    detail: 'CMT-014 verified by originator.',
    actor: 'Electrical Reviewer',
    object: 'CMT-014 · SLD R2',
    hash: '12b8...44f9',
    rawPayload: `event: review.comment.closed
source: GINFINA
manifest_hash: 12b8...44f9
role_scope_check: PASS
authority_check: PASS`,
  },
];

export default function AuditEvidenceLayout() {
  const [selectedEventId, setSelectedEventId] = useState('AUD-20260816-00184');

  const selectedEvent = AUDIT_EVENTS.find((e) => e.id === selectedEventId) || AUDIT_EVENTS[0];

  const handleInspect = () => {
    notifications.show({
      title: 'Cryptographic Verification',
      message: `SHA-256 hash valid for ${selectedEvent.name}. No tampering detected.`,
      color: 'green',
    });
  };

  const roSt = {
    input: {
      backgroundColor: '#f9fafb',
      borderColor: '#e5e7eb',
      color: '#374151',
      borderRadius: 6,
      height: 38,
      cursor: 'default',
    },
  };

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Audit and Immutable Engineering Evidence
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={680}>
              Provide searchable, security-trimmed evidence of material engineering events, actor identity, before/after references, hashes, correlation IDs and linked objects.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleInspect}
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
            Inspect selected event evidence
          </Button>
        </Group>
      </Box>

      {/* ── Two-Column Body ── */}
      <Grid gutter="md" align="stretch">
        {/* Left Column: Immutable audit timeline */}
        <Grid.Col span={{ base: 12, md: 4.5, lg: 4 }}>
          <Paper
            p="md"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              height: '100%',
            }}
          >
            <Title order={4} fw={700} fz={15} c="#111827" mb="lg">
              Immutable audit timeline
            </Title>

            <Stack gap={0}>
              {AUDIT_EVENTS.map((item, idx) => {
                const isSelected = item.id === selectedEvent.id;
                const isLast = idx === AUDIT_EVENTS.length - 1;
                return (
                  <Box
                    key={item.id}
                    onClick={() => setSelectedEventId(item.id)}
                    style={{
                      position: 'relative',
                      paddingLeft: 26,
                      paddingBottom: isLast ? 8 : 24,
                      cursor: 'pointer',
                    }}
                  >
                    {/* Vertical connecting line */}
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
                    {/* Green node indicator */}
                    <Box
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 3,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#007336' : '#22a648',
                        border: isSelected ? '2px solid #bbf7d0' : 'none',
                      }}
                    />

                    <Text size="11px" c="#9ca3af" mb={2}>{item.timestamp}</Text>
                    <Text size="xs" fw={700} c={isSelected ? '#007336' : '#111827'}>
                      {item.name}
                    </Text>
                    <Text size="xs" c="#6b7280" mt={2}>
                      {item.detail}
                    </Text>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Right Column: Selected event evidence */}
        <Grid.Col span={{ base: 12, md: 7.5, lg: 8 }}>
          <Paper
            p="lg"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <Group justify="space-between" align="center" mb="md">
              <Title order={4} fw={700} fz={15} c="#111827">Selected event evidence</Title>
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
                Verified
              </Badge>
            </Group>

            <Grid gutter="md" mb="md">
              {/* Event ID */}
              <Grid.Col span={6}>
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Event ID</Text>
                  <TextInput value={selectedEvent.id} readOnly styles={roSt} />
                </Box>
              </Grid.Col>

              {/* Actor */}
              <Grid.Col span={6}>
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Actor</Text>
                  <TextInput value={selectedEvent.actor} readOnly styles={roSt} />
                </Box>
              </Grid.Col>

              {/* Object */}
              <Grid.Col span={12}>
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Object</Text>
                  <TextInput value={selectedEvent.object} readOnly styles={roSt} />
                </Box>
              </Grid.Col>

              {/* Evidence hash */}
              <Grid.Col span={12}>
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Evidence hash</Text>
                  <TextInput value={selectedEvent.hash} readOnly styles={roSt} />
                </Box>
              </Grid.Col>
            </Grid>

            {/* Dark Console / Terminal Block */}
            <Box
              p="md"
              style={{
                backgroundColor: '#0f172a',
                borderRadius: 6,
                marginTop: 'auto',
                fontFamily: 'monospace',
              }}
            >
              <Text
                component="pre"
                style={{
                  color: '#e2e8f0',
                  fontSize: '12px',
                  lineHeight: 1.6,
                  margin: 0,
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                }}
              >
                {selectedEvent.rawPayload}
              </Text>
            </Box>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
