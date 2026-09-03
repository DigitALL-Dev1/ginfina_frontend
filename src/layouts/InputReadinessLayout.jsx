import { useState, useEffect } from 'react';
import {
  Box, Button, Grid, Group, Paper, Textarea,
  Text, TextInput, Title, Stack, Divider, Badge, Tabs, Loader, Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { getReadinessRecords, createReadinessRecord, updateReadinessRecord } from '../services/readinessService';
import { IconAlertCircle } from '@tabler/icons-react';
import { getEwoId, getEwpId, getUserId } from '../utils/storage';

/* ─── Read-only field ────────────────────────────────────────────── */
function ReadField({ label, value, hint, required }) {
  return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>
        {label}{required && <Text span c="red"> *</Text>}
      </Text>
      <TextInput value={value} readOnly
        styles={{ input: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#374151', borderRadius: 6, height: 38, cursor: 'default' } }} />
      {hint && <Text size="11px" c="#9ca3af" mt={4}>{hint}</Text>}
    </Box>
  );
}

/* ─── Output row ─────────────────────────────────────────────────── */
function OutputRow({ label, sub }) {
  return (
    <>
      <Group justify="space-between" align="center" py={10}>
        <Box>
          <Text size="sm" fw={600} c="#111827">{label}</Text>
          <Text size="11px" c="#9ca3af" mt={1}>{sub}</Text>
        </Box>
        <Badge size="sm" radius="sm"
          style={{ backgroundColor: '#ffffff', color: '#007336', border: '1px solid #22a648', fontWeight: 600, fontSize: 11, padding: '3px 12px', textTransform: 'none' }}>
          Current
        </Badge>
      </Group>
      <Divider color="#f3f4f6" />
    </>
  );
}

/* ─── Overview tab ───────────────────────────────────────────────── */
function OverviewTab({ readinessData, onUpdate, isLoading }) {
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideExpiry, setOverrideExpiry] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when readiness data changes
  useEffect(() => {
    if (readinessData) {
      setOverrideReason(readinessData.override_reason || '');
      setOverrideExpiry(readinessData.override_expiry || '');
    }
  }, [readinessData]);

  const handleSaveDraft = async () => {
    if (!readinessData?.id) return;
    
    setIsSaving(true);
    try {
      const updatedData = {
        ewo_id: getEwoId(),
        ewp_id: getEwpId(),
        override_reason: overrideReason,
        override_expiry: overrideExpiry,
        status: 'Draft',
      };
      
      await updateReadinessRecord(readinessData.id, updatedData);
      notifications.show({
        title: 'Draft saved',
        message: 'Readiness record saved as draft.',
        color: 'blue',
      });
      onUpdate(); // Refresh data
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save draft: ' + error.message,
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAuthorize = async () => {
    if (!readinessData?.id) return;
    
    setIsSaving(true);
    try {
      const updatedData = {
        ewo_id: getEwoId(),
        ewp_id: getEwpId(),
        override_reason: overrideReason,
        override_expiry: overrideExpiry,
        status: 'Authorised',
      };
      
      await updateReadinessRecord(readinessData.id, updatedData);
      notifications.show({
        title: 'Design start authorised',
        message: 'Design commencement has been formally authorised.',
        color: 'green',
      });
      onUpdate(); // Refresh data
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to authorize: ' + error.message,
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Loader size="lg" color="green" />
      </Box>
    );
  }

  if (!readinessData) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="No data" color="gray">
        No readiness record found. Please create one first.
      </Alert>
    );
  }

  return (
    <Grid gutter="md" align="flex-start">
      {/* Left: Record details */}
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Paper p="lg" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Group justify="space-between" align="center" mb="md">
            <Title order={4} fw={700} fz={15} c="#111827">Record details</Title>
            <Badge size="sm" radius="sm"
              style={{
                backgroundColor: readinessData.status === 'Authorised' ? '#e6fcf5' : '#fef3c7',
                color: readinessData.status === 'Authorised' ? '#0ca678' : '#d97706',
                fontWeight: 700,
                fontSize: 11,
                padding: '3px 12px',
                textTransform: 'none'
              }}>
              {readinessData.status || 'Draft'}
            </Badge>
          </Group>

          <Grid gutter="md">
            {/* Readiness profile */}
            <Grid.Col span={6}>
              <ReadField
                label="Readiness profile"
                value={readinessData.readiness_profile || 'N/A'}
                hint="Read-only · EWP baseline"
                required
              />
            </Grid.Col>

            {/* Critical input checklist */}
            <Grid.Col span={6}>
              <ReadField
                label="Critical input checklist"
                value={readinessData.checklist_summary || '0 of 0 confirmed'}
                hint="Checklist · System generated"
                required
              />
            </Grid.Col>

            {/* Override reason */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Override reason <Text span c="red">*</Text>
                </Text>
                <Textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  minRows={4}
                  placeholder="Enter override reason..."
                  styles={{ input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6 } }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Textarea · Required only for authorised override</Text>
              </Box>
            </Grid.Col>

            {/* Override expiry */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Override expiry <Text span c="red">*</Text>
                </Text>
                <TextInput
                  value={overrideExpiry}
                  onChange={(e) => setOverrideExpiry(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  styles={{ input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6, height: 38 } }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>DatePickerInput · Required for temporary override</Text>
              </Box>
            </Grid.Col>
          </Grid>

          {/* Action buttons */}
          <Group mt="xl" gap="sm">
            <Button
              color="green"
              onClick={handleAuthorize}
              loading={isSaving}
              disabled={!overrideReason || !overrideExpiry}
              style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6 }}>
              Authorise design start
            </Button>
            <Button
              variant="default"
              onClick={handleSaveDraft}
              loading={isSaving}
              style={{ borderColor: '#d1d5db', color: '#374151', fontWeight: 600, height: 38, borderRadius: 6 }}>
              Save draft
            </Button>
          </Group>
        </Paper>
      </Grid.Col>

      {/* Right: Controlled outputs */}
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper p="lg" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Title order={4} fw={700} fz={15} c="#111827" mb="sm">Controlled outputs and evidence</Title>
          <Divider color="#f3f4f6" mb={4} />
          <Stack gap={0}>
            <OutputRow label="Gate status"            sub="Controlled system output" />
            <OutputRow label="Blocking inputs"        sub="Controlled system output" />
            <OutputRow label="Override record"        sub="Controlled system output" />
            <OutputRow label="Design-start timestamp" sub="Controlled system output" />
          </Stack>

          {/* Display timestamps */}
          <Box mt="lg" pt="lg" style={{ borderTop: '1px solid #f3f4f6' }}>
            <Text size="xs" fw={600} c="#374151" mb={8}>Record Information</Text>
            <Stack gap={8}>
              <Box>
                <Text size="11px" c="#9ca3af">Created</Text>
                <Text size="xs" c="#374151">{readinessData.created_at ? new Date(readinessData.created_at).toLocaleString() : 'N/A'}</Text>
              </Box>
              <Box>
                <Text size="11px" c="#9ca3af">Last Updated</Text>
                <Text size="xs" c="#374151">{readinessData.updated_at ? new Date(readinessData.updated_at).toLocaleString() : 'N/A'}</Text>
              </Box>
              <Box>
                <Text size="11px" c="#9ca3af">Submitted By</Text>
                <Text size="xs" c="#374151">{readinessData.submitted_by || 'N/A'}</Text>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}

/* ─── Placeholder ────────────────────────────────────────────────── */
function PlaceholderTab({ label }) {
  return (
    <Paper p="xl" style={{ border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
      <Text c="dimmed" size="sm">{label} content — controlled R1.0 pilot data.</Text>
    </Paper>
  );
}

/* ─── Main layout ────────────────────────────────────────────────── */
export default function InputReadinessLayout() {
  const [activeTab, setActiveTab] = useState('overview');
  const [readinessData, setReadinessData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabStyle = (key) =>
    activeTab === key ? { color: '#007336', borderBottomColor: '#007336', fontWeight: 600 } : {};

  // Fetch readiness data
  const fetchReadinessData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getReadinessRecords();
      
      // Handle different response structures
      if (response?.data) {
        // If response has a data property, check if it's an array or single object
        if (Array.isArray(response.data)) {
          setReadinessData(response.data[0] || null);
        } else {
          setReadinessData(response.data);
        }
      } else if (Array.isArray(response)) {
        // If response is directly an array
        setReadinessData(response[0] || null);
      } else {
        // If response is a single object
        setReadinessData(response);
      }
    } catch (err) {
      console.error('Error fetching readiness data:', err);
      setError(err.message);
      notifications.show({
        title: 'Error loading data',
        message: 'Failed to fetch readiness records: ' + err.message,
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchReadinessData();
  }, []);

  const handleAuthorizeFromHeader = async () => {
    if (!readinessData?.id) {
      notifications.show({
        title: 'No record',
        message: 'Please load or create a readiness record first.',
        color: 'yellow',
      });
      return;
    }

    // Get EWO ID and EWP ID from storage
    const ewoId = getEwoId(readinessData.ewo_id);
    const ewpId = getEwpId(readinessData.ewp_id);

    try {
      const updatedData = {
        ewo_id: ewoId,
        ewp_id: ewpId,
        status: 'Authorised',
      };
      
      await updateReadinessRecord(readinessData.id, updatedData);
      notifications.show({
        title: 'Design start authorised',
        message: 'Design commencement has been formally authorised.',
        color: 'green',
      });
      fetchReadinessData(); // Refresh data
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to authorize: ' + error.message,
        color: 'red',
      });
    }
  };

  return (
    <Box>
      {/* Page header */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Input Readiness and Design Start Gate
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={560}>
              Assess mandatory engineering input completeness and formally allow or block design commencement.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleAuthorizeFromHeader}
            disabled={!readinessData || isLoading}
            style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 20, paddingRight: 20, alignSelf: 'flex-start' }}>
            Authorise design start
          </Button>
        </Group>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mb="md" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

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
            readinessData={readinessData}
            onUpdate={fetchReadinessData}
            isLoading={isLoading}
          />
        </Tabs.Panel>
        <Tabs.Panel value="evidence" pt="md"><PlaceholderTab label="Evidence" /></Tabs.Panel>
        <Tabs.Panel value="history"  pt="md"><PlaceholderTab label="History" /></Tabs.Panel>
        <Tabs.Panel value="audit"    pt="md"><PlaceholderTab label="Audit" /></Tabs.Panel>
      </Tabs>
    </Box>
  );
}
