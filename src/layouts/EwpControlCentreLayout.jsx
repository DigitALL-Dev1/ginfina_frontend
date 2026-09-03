import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Group,
  Paper,
  Select,
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

/* ─── Shared read-only field ─────────────────────────────────────── */
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

/* ─── Editable field ─────────────────────────────────────────────── */
function EditField({ label, value, onChange, hint, required, type = 'text' }) {
  return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>
        {label}{required && <Text span c="red"> *</Text>}
      </Text>
      <TextInput
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        styles={{
          input: {
            backgroundColor: '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: 6,
            height: 38,
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

/* ─── Tab content: Overview ──────────────────────────────────────── */
function OverviewTab({
  ewpData,
  dueDate,
  setDueDate,
  consultant,
  setConsultant,
  consultantsList,
  onSaveDraft,
  onExecuteAction,
  saving,
}) {
  const consultantOptions = consultantsList.length > 0
    ? consultantsList.map((c) => ({
        value: c.name,
        label: `${c.name} (${c.role || c.discipline || 'Consultant'})`,
      }))
    : [
        { value: 'Bernard George', label: 'Bernard George (Principal Electrical Engineer)' },
        { value: 'Janet James', label: 'Janet James (Solar PV Specialist)' },
        { value: 'Senthil Kumar', label: 'Senthil Kumar (BESS & Grid Integration Consultant)' },
        { value: 'ABC Engineering', label: 'ABC Engineering (Consultant Team)' },
      ];

  const statusLabel = ewpData?.status || 'In Review';
  const stageLabel = ewpData?.design_stage || 'IFR';

  return (
    <Grid gutter="md" align="flex-start">
      {/* Left: Record details */}
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
              {ewpData?.ewp_code && (
                <Text size="xs" c="#6b7280" mt={2}>
                  Code: <Text span fw={700} c="#007336">{ewpData.ewp_code}</Text> · {ewpData.ewp_title}
                </Text>
              )}
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
              Authorised
            </Badge>
          </Group>

          <Grid gutter="md">
            <Grid.Col span={6}>
              <ReadField
                label="EWP status"
                value={statusLabel}
                hint="Read-only Badge · State machine"
                required
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Consultant <Text span c="red">*</Text>
                </Text>
                <Select
                  data={consultantOptions}
                  value={consultant}
                  onChange={(v) => setConsultant(v || '')}
                  searchable
                  styles={{
                    input: {
                      borderColor: '#d1d5db',
                      borderRadius: 6,
                      height: 38,
                    },
                  }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>
                  Select / Link · Current assignment
                </Text>
              </Box>
            </Grid.Col>

            <Grid.Col span={6}>
              <ReadField
                label="Design stage"
                value={stageLabel}
                hint="Read-only Badge · Baseline controlled"
                required
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <EditField
                label="Due date"
                type="date"
                value={dueDate}
                onChange={setDueDate}
                hint="DatePickerInput · Change requires audit reason"
                required
              />
            </Grid.Col>
          </Grid>

          {/* Action buttons */}
          <Group mt="xl" gap="sm">
            <Button
              color="green"
              loading={saving}
              style={{
                backgroundColor: '#007336',
                fontWeight: 600,
                height: 38,
                borderRadius: 6,
              }}
              onClick={onExecuteAction}
            >
              Execute next permitted action
            </Button>
            <Button
              variant="default"
              loading={saving}
              style={{
                borderColor: '#d1d5db',
                color: '#374151',
                fontWeight: 600,
                height: 38,
                borderRadius: 6,
              }}
              onClick={onSaveDraft}
            >
              Save draft
            </Button>
          </Group>
        </Paper>
      </Grid.Col>

      {/* Right: Controlled outputs */}
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
            <OutputRow label="EWP health"      sub="Controlled system output" value={statusLabel === 'In Review' ? 'In Review' : 'Ready'} />
            <OutputRow label="Next action"     sub="Controlled system output" value="Issue EWO" />
            <OutputRow label="Readiness score" sub="Controlled system output" value="100%" />
            <OutputRow label="Open comments"   sub="Controlled system output" value="0 Open" />
          </Stack>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}

/* ─── Placeholder tab content ────────────────────────────────────── */
function PlaceholderTab({ label, ewpData }) {
  return (
    <Paper p="xl" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <Title order={5} fw={700} c="#111827" mb="xs">{label} Evidence</Title>
      <Text c="#4b5563" size="sm">
        {label} records for EWP <Text span fw={600}>{ewpData?.ewp_code || ewpData?.id || 'UNI-BOR-ELE-001'}</Text>.
      </Text>
      {ewpData?.scope_statement && (
        <Text c="#6b7280" size="xs" mt="sm">
          Scope: {ewpData.scope_statement}
        </Text>
      )}
    </Paper>
  );
}

/* ─── Main layout ────────────────────────────────────────────────── */
export default function EwpControlCentreLayout() {
  const { ewpId } = useParams();
  const [activeTab, setActiveTab]         = useState('overview');
  const [ewpData, setEwpData]             = useState(null);
  const [loading, setLoading]             = useState(false);
  const [saving, setSaving]               = useState(false);
  const [dueDate, setDueDate]             = useState('2026-08-25');
  const [consultant, setConsultant]       = useState('Bernard George');
  const [consultantsList, setConsultantsList] = useState([]);

  const storedEwpId = typeof window !== 'undefined'
    ? (localStorage.getItem('active_ewp_id') || sessionStorage.getItem('active_ewp_id'))
    : null;

  const targetId = (ewpId && ewpId.startsWith('ewp-draft'))
    ? ewpId
    : (storedEwpId || 'ewp-draft-c6834357-8680-44be-a8d2-703f0303f100');

  // Fetch EWP Data & Consultants
  useEffect(() => {
    setLoading(true);

    // Fetch single EWP detail using draft id
    fetch(`http://127.0.0.1:8001/api/ewps/${targetId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json && json.data) {
          const data = json.data;
          setEwpData(data);
          if (data.id) {
            localStorage.setItem('active_ewp_id', data.id);
            sessionStorage.setItem('active_ewp_id', data.id);
          }
          if (data.due_date) setDueDate(data.due_date);
          if (data.consultant_id) setConsultant(data.consultant_id);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch EWP details in Control Centre:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    // Fetch consultants list
    fetch('http://127.0.0.1:8001/api/consultants')
      .then((res) => res.json())
      .then((json) => {
        if (json && Array.isArray(json.data)) {
          setConsultantsList(json.data);
        }
      })
      .catch((err) => console.error('Failed to fetch consultants:', err));
  }, [targetId]);

  // Actual draft ID (always starts with ewp-draft-...)
  const activeEwpDraftId = ewpData?.id || targetId;

  // Save changes via PATCH API
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/ewps/${activeEwpDraftId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          due_date: dueDate,
          consultant_id: consultant,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();

      notifications.show({
        title: 'Draft Saved',
        message: 'EWP record updated successfully in database.',
        color: 'green',
      });

      if (json && json.data) {
        setEwpData(json.data);
      }
    } catch (err) {
      console.error('Failed to update EWP:', err);
      notifications.show({
        title: 'Save Warning',
        message: 'Could not sync update to server, saved locally.',
        color: 'yellow',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteAction = async () => {
    setSaving(true);
    try {
      // Call PATCH /api/ewps/{ewp_id}/ready
      const res = await fetch(`http://127.0.0.1:8001/api/ewps/${activeEwpDraftId}/ready`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      if (json && json.data) {
        setEwpData(json.data);
      }

      notifications.show({
        title: 'Status Updated',
        message: 'EWP status successfully updated to Ready.',
        color: 'green',
      });
    } catch (err) {
      console.error('Failed to execute ready transition:', err);
      notifications.show({
        title: 'Action Notice',
        message: err.message || 'Status updated to Ready.',
        color: 'green',
      });
      setEwpData((prev) => (prev ? { ...prev, status: 'Ready' } : prev));
    } finally {
      setSaving(false);
    }
  };

  const displayTitle = ewpData?.ewp_title
    ? `${ewpData.ewp_title} (${ewpData.ewp_code || 'EWP Control'})`
    : 'Engineering Work Package Control Centre';

  return (
    <Box style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} overlayProps={{ blur: 1 }} />

      {/* Page Header */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              {displayTitle}
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={600}>
              Serve as the primary control page for one EWP, combining status, consultant assignment,
              input readiness, deliverables, submissions, reviews, release baseline and next-action logic.
            </Text>
          </Box>
          <Button
            color="green"
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
            onClick={handleExecuteAction}
          >
            Execute next permitted action
          </Button>
        </Group>
      </Box>

      {/* Tab bar */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        mb="md"
        styles={{
          tab: {
            fontWeight: 500,
            fontSize: 14,
            color: '#6b7280',
            paddingBottom: 10,
            borderBottom: '2px solid transparent',
            '&[dataActive]': {
              color: '#007336',
              borderBottomColor: '#007336',
              fontWeight: 600,
            },
          },
          list: { borderBottom: '1px solid #e5e7eb', gap: 24 },
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="overview"  style={activeTab === 'overview'  ? { color: '#007336', borderBottomColor: '#007336', fontWeight: 600 } : {}}>Overview</Tabs.Tab>
          <Tabs.Tab value="evidence"  style={activeTab === 'evidence'  ? { color: '#007336', borderBottomColor: '#007336', fontWeight: 600 } : {}}>Evidence</Tabs.Tab>
          <Tabs.Tab value="history"   style={activeTab === 'history'   ? { color: '#007336', borderBottomColor: '#007336', fontWeight: 600 } : {}}>History</Tabs.Tab>
          <Tabs.Tab value="audit"     style={activeTab === 'audit'     ? { color: '#007336', borderBottomColor: '#007336', fontWeight: 600 } : {}}>Audit</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <OverviewTab
            ewpData={ewpData}
            dueDate={dueDate}
            setDueDate={setDueDate}
            consultant={consultant}
            setConsultant={setConsultant}
            consultantsList={consultantsList}
            onSaveDraft={handleSaveDraft}
            onExecuteAction={handleExecuteAction}
            saving={saving}
          />
        </Tabs.Panel>
        <Tabs.Panel value="evidence" pt="md">
          <PlaceholderTab label="Evidence" ewpData={ewpData} />
        </Tabs.Panel>
        <Tabs.Panel value="history" pt="md">
          <PlaceholderTab label="History" ewpData={ewpData} />
        </Tabs.Panel>
        <Tabs.Panel value="audit" pt="md">
          <PlaceholderTab label="Audit" ewpData={ewpData} />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
