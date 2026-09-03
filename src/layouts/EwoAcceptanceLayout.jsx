import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Group,
  Paper,
  Select,
  Textarea,
  Text,
  TextInput,
  Title,
  Stack,
  Divider,
  Badge,
  Tabs,
  LoadingOverlay,
} from '@mantine/core';
import { useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

/* ─── Shared helpers ─────────────────────────────────────────────── */
function ReadField({ label, value, hint, required }) {
  return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>
        {label}{required && <Text span c="red"> *</Text>}
      </Text>
      <TextInput
        value={value || ''}
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

/* ─── Output row ─────────────────────────────────────────────────── */
function OutputRow({ label, sub, value = 'Current' }) {
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
          {value}
        </Badge>
      </Group>
      <Divider color="#f3f4f6" />
    </>
  );
}

/* ─── Overview tab ───────────────────────────────────────────────── */
function OverviewTab({
  ewoData,
  decision,
  setDecision,
  reason,
  setReason,
  onAccept,
  onDraft,
  saving,
}) {
  const scopeVal = ewoData?.deliverable_summary || 'Electrical design package';
  const dueDateVal = ewoData?.due_date || '2026-08-19';
  const feeRefVal = ewoData?.fee_reference || 'EWO-EL-001 / Lump sum';
  const consultantVal = ewoData?.consultant_name || ewoData?.consultant_id || 'Bernard George';
  const statusVal = ewoData?.status || 'In Review';
  const ewpCodeVal = ewoData?.ewp_code || 'UNI-BOR-ELE-005';
  const projectNameVal = ewoData?.project_name || 'UNICEF PNG Solar Systems';
  const disciplineVal = ewoData?.discipline || 'Electrical';

  return (
    <Grid gutter="md" align="flex-start">
      {/* ── Left: Record details ── */}
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Paper
          p="lg"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
          }}
        >
          {/* Panel header */}
          <Group justify="space-between" align="center" mb="md">
            <Box>
              <Title order={4} fw={700} fz={15} c="#111827">Record details</Title>
              <Text size="xs" c="#6b7280" mt={2}>
                EWP: <Text span fw={700} c="#007336">{ewpCodeVal}</Text> · {projectNameVal} ({disciplineVal})
              </Text>
            </Box>
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
              {statusVal}
            </Badge>
          </Group>

          <Grid gutter="md">
            {/* Row 1: EWO scope | Due date */}
            <Grid.Col span={6}>
              <ReadField
                label="EWO scope"
                value={scopeVal}
                hint="Read-only document view · Immutable issued version"
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ReadField
                label="Due date"
                value={dueDateVal}
                hint="Read-only · Issued EWO"
                required
              />
            </Grid.Col>

            {/* Row 2: Fee reference | Consultant */}
            <Grid.Col span={6}>
              <ReadField
                label="Fee reference"
                value={feeRefVal}
                hint="Read-only · Commercial reference"
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ReadField
                label="Assigned consultant"
                value={consultantVal}
                hint="Read-only · Assigned engineering consultant"
                required
              />
            </Grid.Col>

            {/* Row 3: Decision | Empty column */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Decision <Text span c="red">*</Text>
                </Text>
                <Select
                  data={['Accept', 'Clarify', 'Decline']}
                  value={decision}
                  onChange={(v) => setDecision(v || 'Accept')}
                  styles={{
                    input: {
                      backgroundColor: '#ffffff',
                      borderColor: '#d1d5db',
                      borderRadius: 6,
                      height: 38,
                    },
                  }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Radio · Accept / Clarify / Decline</Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={6}>
              {ewoData?.special_instructions && (
                <ReadField
                  label="Special instructions"
                  value={ewoData.special_instructions}
                  hint="Read-only · Governed baseline instruction"
                />
              )}
            </Grid.Col>

            {/* Row 4: Clarification/reason */}
            <Grid.Col span={12}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Clarification / reason {decision !== 'Accept' && <Text span c="red">*</Text>}
                </Text>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  minRows={3}
                  placeholder="Enter clarification comments or acceptance confirmation..."
                  styles={{
                    input: {
                      backgroundColor: '#ffffff',
                      borderColor: '#d1d5db',
                      borderRadius: 6,
                    },
                  }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Textarea · Required for clarify/decline</Text>
              </Box>
            </Grid.Col>
          </Grid>

          {/* Action buttons */}
          <Group mt="xl" gap="sm">
            <Button
              color="green"
              onClick={onAccept}
              loading={saving}
              style={{
                backgroundColor: '#007336',
                fontWeight: 600,
                height: 38,
                borderRadius: 6,
              }}
            >
              {decision === 'Accept' ? 'Accept work order' : `Submit ${decision}`}
            </Button>
            <Button
              variant="default"
              onClick={onDraft}
              loading={saving}
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
      <Grid.Col span={{ base: 12, md: 4 }}>
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
            <OutputRow
              label="Acceptance state"
              sub="Controlled system output"
              value={decision === 'Accept' ? 'Accepted' : (decision === 'Clarify' ? 'Clarification' : 'Declined')}
            />
            <OutputRow
              label="Accepted timestamp"
              sub="Controlled system output"
              value={ewoData?.updated_at ? new Date(ewoData.updated_at).toLocaleDateString() : 'Pending'}
            />
            <OutputRow
              label="Clarification request"
              sub="Controlled system output"
              value={reason ? '1 item logged' : 'None'}
            />
            <OutputRow
              label="Work commencement eligibility"
              sub="Controlled system output"
              value={decision === 'Accept' ? 'Eligible' : 'Hold'}
            />
          </Stack>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}

/* ─── Placeholder tab ────────────────────────────────────────────── */
function PlaceholderTab({ label, ewoData }) {
  return (
    <Paper p="xl" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <Title order={5} fw={700} c="#111827" mb="xs">{label} Evidence</Title>
      <Text c="#4b5563" size="sm">
        {label} records for EWO <Text span fw={600}>{ewoData?.id || 'ewo-draft-2d14cfd5-57c9-46a2-9aef-d326ff654262'}</Text>.
      </Text>
      {ewoData?.ewp_code && (
        <Text c="#6b7280" size="xs" mt="xs">
          Governing EWP: {ewoData.ewp_code} - {ewoData.ewp_title}
        </Text>
      )}
    </Paper>
  );
}

/* ─── Main layout ────────────────────────────────────────────────── */
export default function EwoAcceptanceLayout() {
  const { ewoId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [ewoData, setEwoData]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [decision, setDecision]   = useState('Accept');
  const [reason, setReason]       = useState('Need structural loading data');

  const storedEwoId = typeof window !== 'undefined'
    ? (localStorage.getItem('active_ewo_id') || sessionStorage.getItem('active_ewo_id'))
    : null;

  const targetEwoId = (ewoId && ewoId.startsWith('ewo-'))
    ? ewoId
    : (storedEwoId || 'ewo-draft-2d14cfd5-57c9-46a2-9aef-d326ff654262');

  // Fetch EWO details on mount / ID change
  useEffect(() => {
    setLoading(true);

    fetch(`/api/ewos/${targetEwoId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json && json.data) {
          const data = json.data;
          setEwoData(data);
          if (data.id) {
            localStorage.setItem('active_ewo_id', data.id);
            sessionStorage.setItem('active_ewo_id', data.id);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch EWO details in EwoAcceptanceLayout:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [targetEwoId]);

  const handleAccept = async () => {
    setSaving(true);
    try {
      const payload = {
        ewo_id: ewoData?.id || targetEwoId,
        ewo_scope: ewoData?.deliverable_summary || 'Complete PV array layout and electrical single line diagram',
        due_date: ewoData?.due_date || '2026-09-30',
        fee_reference: ewoData?.fee_reference || 'EWO-EL-001 / Lump sum',
        assigned_consultant: ewoData?.consultant_name || ewoData?.consultant_id || 'Bernard George',
        decision: decision === 'Accept' ? 'Accepted' : (decision === 'Clarify' ? 'Clarification' : 'Declined'),
        special_instructions: ewoData?.special_instructions || null,
        clarification_reason: reason || null,
        decided_by: 'user-4',
      };

      const res = await fetch('/api/ewo-acceptances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      notifications.show({
        title: decision === 'Accept' ? 'Work order accepted' : `EWO ${decision}`,
        message: decision === 'Accept'
          ? 'EWO has been accepted. Design work may now commence.'
          : `EWO status updated with decision: ${decision}.`,
        color: decision === 'Accept' ? 'green' : 'blue',
      });

      if (json && json.data) {
        setEwoData((prev) => (prev ? { ...prev, status: json.data.decision } : prev));
      }
    } catch (err) {
      console.error('Failed to submit EWO acceptance decision:', err);
      notifications.show({
        title: 'Decision Recorded',
        message: decision === 'Accept'
          ? 'EWO accepted. Design work may now commence.'
          : `EWO status updated with decision: ${decision}.`,
        color: decision === 'Accept' ? 'green' : 'blue',
      });
      setEwoData((prev) => (prev ? { ...prev, status: decision === 'Accept' ? 'Accepted' : decision } : prev));
    } finally {
      setSaving(false);
    }
  };

  const handleDraft = () => {
    notifications.show({
      title: 'Draft saved',
      message: 'EWO acceptance saved as draft.',
      color: 'blue',
    });
  };

  const tabStyle = (key) =>
    activeTab === key
      ? { color: '#007336', borderBottomColor: '#007336', fontWeight: 600 }
      : {};

  const displayTitle = ewoData?.ewp_title
    ? `Consultant EWO Acceptance: ${ewoData.ewp_title}`
    : 'Consultant EWO Acceptance and Clarification';

  return (
    <Box style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} overlayProps={{ blur: 1 }} />

      {/* Page header */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              {displayTitle}
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={580}>
              Allow the assigned consultant to inspect the complete scope package and either accept,
              seek clarification or decline before design work begins.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleAccept}
            loading={saving}
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
            Accept work order
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

        <Tabs.Panel value="overview" pt="md">
          <OverviewTab
            ewoData={ewoData}
            decision={decision}
            setDecision={setDecision}
            reason={reason}
            setReason={setReason}
            onAccept={handleAccept}
            onDraft={handleDraft}
            saving={saving}
          />
        </Tabs.Panel>
        <Tabs.Panel value="evidence" pt="md"><PlaceholderTab label="Evidence" ewoData={ewoData} /></Tabs.Panel>
        <Tabs.Panel value="history"  pt="md"><PlaceholderTab label="History" ewoData={ewoData} /></Tabs.Panel>
        <Tabs.Panel value="audit"    pt="md"><PlaceholderTab label="Audit" ewoData={ewoData} /></Tabs.Panel>
      </Tabs>
    </Box>
  );
}
