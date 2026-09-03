import { useState } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select, Textarea,
  Text, TextInput, Title, Stack, Divider, Badge, Tabs, Loader, Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createRfiRecord, updateRfiRecord } from '../services/rfiService';
import { IconAlertCircle } from '@tabler/icons-react';
import { getEwoId, getEwpId, getUserId } from '../utils/storage';

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
function OverviewTab() {
  const [queryType,  setQueryType]  = useState('Technical');
  const [subject,    setSubject]    = useState('');
  const [question,   setQuestion]   = useState('');
  const [requiredBy, setRequiredBy] = useState('');
  const [evidence,   setEvidence]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rfiId, setRfiId] = useState(null);

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6, height: 38 } };
  const areaSt  = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6 } };

  const handleSubmit = async () => {
    // Validation
    if (!subject.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Subject is required',
        color: 'red',
      });
      return;
    }
    if (!question.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Technical question is required',
        color: 'red',
      });
      return;
    }
    if (!requiredBy.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Required by date is required',
        color: 'red',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const rfiData = {
        query_type: queryType,
        subject: subject.trim(),
        technical_question: question.trim(),
        required_by: requiredBy.trim(),
        evidence_link: evidence.trim() || undefined,
        submitted_by: getUserId(),
        ewo_id: getEwoId(),
        ewp_id: getEwpId(),
      };

      const response = await createRfiRecord(rfiData);
      
      // Handle response
      const createdRfi = response?.data || response;
      if (createdRfi?.id) {
        setRfiId(createdRfi.id);
      }

      notifications.show({
        title: 'RFI submitted',
        message: 'Technical query has been submitted successfully.',
        color: 'green',
      });

      // Optionally reset form after successful submission
      // setSubject('');
      // setQuestion('');
      // setRequiredBy('');
      // setEvidence('');
    } catch (error) {
      notifications.show({
        title: 'Submission Error',
        message: 'Failed to submit RFI: ' + error.message,
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const rfiData = {
        query_type: queryType,
        subject: subject.trim() || 'Draft',
        technical_question: question.trim() || 'Draft',
        required_by: requiredBy.trim() || new Date().toISOString().split('T')[0],
        evidence_link: evidence.trim() || undefined,
        submitted_by: getUserId(),
        ewo_id: getEwoId(),
        ewp_id: getEwpId(),
        status: 'Draft',
      };

      const response = await createRfiRecord(rfiData);
      const createdRfi = response?.data || response;
      if (createdRfi?.id) {
        setRfiId(createdRfi.id);
      }

      notifications.show({
        title: 'Draft saved',
        message: 'RFI saved as draft.',
        color: 'blue',
      });
    } catch (error) {
      notifications.show({
        title: 'Save Error',
        message: 'Failed to save draft: ' + error.message,
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Grid gutter="md" align="flex-start">
      {/* Left: Record details */}
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Paper p="lg" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          {/* Panel header */}
          <Group justify="space-between" align="center" mb="md">
            <Title order={4} fw={700} fz={15} c="#111827">Record details</Title>
            {rfiId && (
              <Badge size="sm" radius="sm"
                style={{ backgroundColor: '#e6fcf5', color: '#0ca678', fontWeight: 700, fontSize: 11, padding: '3px 12px', textTransform: 'none' }}>
                Submitted
              </Badge>
            )}
          </Group>

          <Grid gutter="md">
            {/* Query type */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>Query type <Text span c="red">*</Text></Text>
                <Select data={['Technical', 'RFI', 'Clarification']}
                  value={queryType} onChange={(v) => setQueryType(v || 'Technical')} styles={inputSt} />
                <Text size="11px" c="#9ca3af" mt={4}>Select · Technical / RFI / Clarification</Text>
              </Box>
            </Grid.Col>

            {/* Subject */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>Subject <Text span c="red">*</Text></Text>
                <TextInput
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject..."
                  styles={inputSt}
                />
                <Text size="11px" c="#9ca3af" mt={4}>TextInput · Concise subject</Text>
              </Box>
            </Grid.Col>

            {/* Technical question */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>Technical question <Text span c="red">*</Text></Text>
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter detailed technical question..."
                  minRows={4}
                  styles={areaSt}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Textarea · No vague request allowed</Text>
              </Box>
            </Grid.Col>

            {/* Required by */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>Required by <Text span c="red">*</Text></Text>
                <TextInput
                  value={requiredBy}
                  onChange={(e) => setRequiredBy(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  styles={inputSt}
                />
                <Text size="11px" c="#9ca3af" mt={4}>DatePickerInput · SLA validated</Text>
              </Box>
            </Grid.Col>

            {/* Evidence — left column only */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>Evidence</Text>
                <TextInput
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="Enter link or reference..."
                  styles={inputSt}
                />
                <Text size="11px" c="#9ca3af" mt={4}>File/Link · Controlled evidence</Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={6} />
          </Grid>

          {/* Action buttons */}
          <Group mt="xl" gap="sm">
            <Button
              color="green"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!subject || !question || !requiredBy}
              style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6 }}>
              Submit technical query
            </Button>
            <Button
              variant="default"
              onClick={handleSaveDraft}
              loading={isSubmitting}
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
            <OutputRow label="RFI/TQ number"                    sub="Controlled system output" />
            <OutputRow label="Owner and due date"               sub="Controlled system output" />
            <OutputRow label="Response status"                  sub="Controlled system output" />
            <OutputRow label="Linked affected inputs/deliverables" sub="Controlled system output" />
          </Stack>

          {/* Display context information */}
          <Box mt="lg" pt="lg" style={{ borderTop: '1px solid #f3f4f6' }}>
            <Text size="xs" fw={600} c="#374151" mb={8}>Context Information</Text>
            <Stack gap={8}>
              <Box>
                <Text size="11px" c="#9ca3af">EWO ID</Text>
                <Text size="xs" c="#374151">{getEwoId()}</Text>
              </Box>
              <Box>
                <Text size="11px" c="#9ca3af">EWP ID</Text>
                <Text size="xs" c="#374151">{getEwpId()}</Text>
              </Box>
              <Box>
                <Text size="11px" c="#9ca3af">Submitted By</Text>
                <Text size="xs" c="#374151">{getUserId()}</Text>
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
export default function RfiQueryLayout() {
  const [activeTab, setActiveTab] = useState('overview');
  const tabStyle = (key) =>
    activeTab === key ? { color: '#007336', borderBottomColor: '#007336', fontWeight: 600 } : {};

  const handleHeaderSubmit = () => {
    notifications.show({
      title: 'Info',
      message: 'Please use the form below to submit your technical query.',
      color: 'blue',
    });
  };

  return (
    <Box>
      {/* Page header */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Engineering RFI and Technical Query
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={580}>
              Raise, respond to and control engineering questions that affect the EWP scope,
              input basis or deliverable completion.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleHeaderSubmit}
            style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 20, paddingRight: 20, alignSelf: 'flex-start' }}>
            Submit technical query
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
