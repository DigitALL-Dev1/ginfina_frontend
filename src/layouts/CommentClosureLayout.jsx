import { useState } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select, Textarea,
  Text, TextInput, Title, Stack, Divider, Badge, Tabs,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createReviewComment } from '../services/reviewCommentService';
import { getUserId } from '../utils/storage';

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

/* ─── Overview Tab ───────────────────────────────────────────────── */
function OverviewTab() {
  const [originalComment] = useState('Major: provide cable derating evidence');
  const [consultantResponse, setConsultantResponse] = useState('');
  const [correctiveRevision, setCorrectiveRevision] = useState('');
  const [verifierDecision, setVerifierDecision]     = useState('Close');
  const [verifierNote, setVerifierNote]             = useState('');
  const [isSubmitting, setIsSubmitting]             = useState(false);

  const handleVerify = async () => {
    // Validation
    if (!consultantResponse.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Consultant response is required',
        color: 'red',
      });
      return;
    }
    if (!correctiveRevision.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Corrective revision is required',
        color: 'red',
      });
      return;
    }
    if (!verifierDecision) {
      notifications.show({
        title: 'Validation Error',
        message: 'Verifier decision is required',
        color: 'red',
      });
      return;
    }
    if (!verifierNote.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Verifier note is required',
        color: 'red',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const commentData = {
        review_routing_id: '', // Can be populated from props or URL params if available
        original_comment: originalComment,
        consultant_response: consultantResponse.trim(),
        corrective_revision: correctiveRevision.trim(),
        verifier_decision: verifierDecision,
        verifier_note: verifierNote.trim(),
        submitted_by: getUserId(),
      };

      await createReviewComment(commentData);

      notifications.show({
        title: 'Comment Closed',
        message: 'Comment verification complete and status updated to Closed.',
        color: 'green',
      });

      // Optionally reset form or navigate away
      // Clear form fields if needed
      setConsultantResponse('');
      setCorrectiveRevision('');
      setVerifierNote('');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to close comment: ' + error.message,
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDraft = async () => {
    setIsSubmitting(true);
    try {
      const commentData = {
        review_routing_id: '', // Can be populated from props or URL params if available
        original_comment: originalComment,
        consultant_response: consultantResponse.trim() || 'Draft',
        corrective_revision: correctiveRevision.trim() || 'Draft',
        verifier_decision: verifierDecision || 'Close',
        verifier_note: verifierNote.trim() || 'Draft',
        submitted_by: getUserId(),
      };

      await createReviewComment(commentData);

      notifications.show({
        title: 'Draft Saved',
        message: 'Comment disposition draft saved.',
        color: 'blue',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save draft: ' + error.message,
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
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
            {/* Row 1: Original comment | Consultant response */}
            <Grid.Col span={6}>
              <ReadField
                label="Original comment"
                value={originalComment}
                hint="Read-only · Immutable"
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Consultant response <Text span c="red">*</Text>
                </Text>
                <Textarea
                  value={consultantResponse}
                  onChange={(e) => setConsultantResponse(e.target.value)}
                  placeholder="Enter consultant response..."
                  minRows={3}
                  styles={{
                    input: {
                      backgroundColor: '#ffffff',
                      borderColor: '#d1d5db',
                      borderRadius: 6,
                    },
                  }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Textarea · Required for response</Text>
              </Box>
            </Grid.Col>

            {/* Row 2: Corrective revision | Verifier decision */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Corrective revision <Text span c="red">*</Text>
                </Text>
                <TextInput
                  value={correctiveRevision}
                  onChange={(e) => setCorrectiveRevision(e.target.value)}
                  placeholder="Enter corrective revision..."
                  styles={{
                    input: {
                      backgroundColor: '#ffffff',
                      borderColor: '#d1d5db',
                      borderRadius: 6,
                      height: 38,
                    },
                  }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Select / Link · Must belong to EWP</Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Verifier decision <Text span c="red">*</Text>
                </Text>
                <Select
                  data={['Close', 'Reject response', 'Reopen']}
                  value={verifierDecision}
                  onChange={(v) => setVerifierDecision(v || 'Close')}
                  styles={{
                    input: {
                      backgroundColor: '#ffffff',
                      borderColor: '#d1d5db',
                      borderRadius: 6,
                      height: 38,
                    },
                  }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Radio · Close / reject response / reopen</Text>
              </Box>
            </Grid.Col>

            {/* Row 3: Verifier note (left col only) */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>
                  Verifier note <Text span c="red">*</Text>
                </Text>
                <Textarea
                  value={verifierNote}
                  onChange={(e) => setVerifierNote(e.target.value)}
                  placeholder="Enter verifier note..."
                  minRows={3}
                  styles={{
                    input: {
                      backgroundColor: '#ffffff',
                      borderColor: '#d1d5db',
                      borderRadius: 6,
                    },
                  }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Textarea · Required for decision</Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={6} />
          </Grid>

          {/* Action buttons */}
          <Group mt="xl" gap="sm">
            <Button
              color="green"
              onClick={handleVerify}
              loading={isSubmitting}
              disabled={!consultantResponse || !correctiveRevision || !verifierNote}
              style={{
                backgroundColor: '#007336',
                fontWeight: 600,
                height: 38,
                borderRadius: 6,
              }}
            >
              Verify and close comment
            </Button>
            <Button
              variant="default"
              onClick={handleDraft}
              loading={isSubmitting}
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
export default function CommentClosureLayout() {
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
              Comment Response, Verification and Closure
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={680}>
              Control the complete comment lifecycle from issue through consultant response, corrective evidence,
              reviewer verification, closure and controlled reopen.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={() =>
              notifications.show({
                title: 'Comment Closed',
                message: 'Comment verified and closed successfully.',
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
            Verify and close comment
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
