import { useState, useEffect } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select, MultiSelect,
  Text, TextInput, Title, Stack, Divider, Loader, Alert,
} from '@mantine/core';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { getFormalSubmissionById } from '../services/formalSubmissionService';
import { createReviewRouting, updateReviewRouting } from '../services/reviewRoutingService';
import { getUserId } from '../utils/storage';
import { IconAlertCircle } from '@tabler/icons-react';

/* ─── Steps ──────────────────────────────────────────────────────── */
const STEPS = [
  { number: 1, label: 'Context' },
  { number: 2, label: 'Details' },
  { number: 3, label: 'Review'  },
  { number: 4, label: 'Confirm' },
];

/* ─── Custom stepper ─────────────────────────────────────────────── */
function RoutingStepper({ active }) {
  return (
    <Box mb="lg" style={{ position: 'relative' }}>
      <Box style={{ position: 'absolute', top: 19, left: '12.5%', right: '12.5%', height: 2, backgroundColor: '#e5e7eb', zIndex: 0 }} />
      <Box style={{ position: 'absolute', top: 19, left: '12.5%', width: `${((active - 1) / (STEPS.length - 1)) * 75}%`, height: 2, backgroundColor: '#22a648', zIndex: 1, transition: 'width 300ms ease' }} />
      <Group justify="space-around" align="flex-start" style={{ position: 'relative', zIndex: 2 }}>
        {STEPS.map((s) => {
          const done = s.number < active;
          const current = s.number === active;
          return (
            <Box key={s.number} style={{ textAlign: 'center', width: 64 }}>
              <Box style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', backgroundColor: done || current ? '#22a648' : '#ffffff', border: `2px solid ${done || current ? '#22a648' : '#d1d5db'}`, color: done || current ? '#ffffff' : '#9ca3af', fontWeight: 700, fontSize: 15, transition: 'all 200ms ease' }}>
                {s.number}
              </Box>
              <Text size="xs" fw={current ? 700 : 500} c={current ? '#111827' : '#9ca3af'}>{s.label}</Text>
            </Box>
          );
        })}
      </Group>
    </Box>
  );
}

/* ─── Gate badge ─────────────────────────────────────────────────── */
function GateBadge({ status }) {
  const cfg = { Pass: { bg: '#d3f9d8', color: '#007336' }, Check: { bg: '#fff3cd', color: '#d97706' }, Valid: { bg: '#d3f9d8', color: '#007336' } }[status] || { bg: '#f1f3f5', color: '#495057' };
  return (
    <Text size="xs" fw={700} style={{ backgroundColor: cfg.bg, color: cfg.color, borderRadius: 4, padding: '2px 10px', display: 'inline-block', minWidth: 46, textAlign: 'center' }}>{status}</Text>
  );
}

/* ─── Right gate panel ───────────────────────────────────────────── */
function GatePanel() {
  const gates = [
    { label: 'Engineering scope',  sub: 'Complete',                    status: 'Pass'  },
    { label: 'Required evidence',  sub: '1 item requires confirmation', status: 'Check' },
    { label: 'Authority',          sub: 'Engineering Manager',          status: 'Valid' },
  ];
  return (
    <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <Title order={4} fw={700} fz={15} c="#111827" mb="sm">Review and gate conditions</Title>
      <Box p="sm" mb="md" style={{ backgroundColor: '#f2fbf5', borderLeft: '3px solid #22a648', borderRadius: '0 6px 6px 0' }}>
        <Text size="xs" c="#182b23" lh={1.5}>Baseline fields are versioned when the controlled action is confirmed.</Text>
      </Box>
      <Stack gap="sm">
        {gates.map((g) => (
          <Box key={g.label}>
            <Group justify="space-between" align="center">
              <Box>
                <Text size="sm" fw={600} c="#111827">{g.label}</Text>
                <Text size="11px" c="#9ca3af">{g.sub}</Text>
              </Box>
              <GateBadge status={g.status} />
            </Group>
            <Divider mt="xs" color="#f3f4f6" />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

/* ─── Shared style ───────────────────────────────────────────────── */
const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6, height: 38 } };
const roSt    = { input: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', borderRadius: 6, height: 38, cursor: 'default' } };
const L = ({ children, required }) => (
  <Text size="xs" fw={600} c="#374151" mb={4}>{children}{required && <Text span c="red"> *</Text>}</Text>
);
const H = ({ children }) => <Text size="11px" c="#9ca3af" mt={4}>{children}</Text>;

/* ─── Step 1: Context ────────────────────────────────────────────── */
function StepContext({ form, onChange, isLoading }) {
  if (isLoading) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Loader size="lg" color="green" />
      </Box>
    );
  }

  return (
    <Box>
      <Title order={4} fw={700} fz={15} c="#111827" mb="md">Controlled details</Title>
      <Grid gutter="md">
        <Grid.Col span={6}>
          <Box><L required>Submission ID</L>
            <TextInput value={form.submissionId} readOnly styles={roSt} />
            <H>Read-only · Derived from formal transmittal</H></Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box><L required>Submission Purpose</L>
            <TextInput value={form.submissionPurpose} readOnly styles={roSt} />
            <H>Read-only · Controlled type</H></Box>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

/* ─── Step 2: Details ────────────────────────────────────────────── */
function StepDetails({ form, onChange }) {
  return (
    <Box>
      <Title order={4} fw={700} fz={15} c="#111827" mb="md">Controlled details</Title>
      <Grid gutter="md">
        {/* Review profile */}
        <Grid.Col span={6}>
          <Box>
            <L required>Review profile</L>
            <Select
              data={['Multidisciplinary IFR', 'Lead Discipline Only', 'Independent Peer Review', 'Fast-track Verification']}
              value={form.reviewProfile}
              onChange={(v) => onChange('reviewProfile', v || '')}
              styles={inputSt}
            />
            <H>Select · Controlled profile</H>
          </Box>
        </Grid.Col>

        {/* Reviewers */}
        <Grid.Col span={6}>
          <Box>
            <L required>Reviewers</L>
            <TextInput
              value={form.reviewers}
              onChange={(e) => onChange('reviewers', e.target.value)}
              styles={inputSt}
            />
            <H>People MultiSelect · Authority/competency validated</H>
          </Box>
        </Grid.Col>

        {/* Routing mode */}
        <Grid.Col span={6}>
          <Box>
            <L required>Routing mode</L>
            <Select
              data={['Parallel', 'Sequential', 'Hybrid']}
              value={form.routingMode}
              onChange={(v) => onChange('routingMode', v || '')}
              styles={inputSt}
            />
            <H>Radio · Parallel / sequence</H>
          </Box>
        </Grid.Col>

        {/* Review due */}
        <Grid.Col span={6}>
          <Box>
            <L required>Review due</L>
            <TextInput
              value={form.reviewDue}
              onChange={(e) => onChange('reviewDue', e.target.value)}
              styles={inputSt}
            />
            <H>DatePickerInput · SLA rule</H>
          </Box>
        </Grid.Col>

        {/* Approval authority */}
        <Grid.Col span={6}>
          <Box>
            <L required>Approval authority</L>
            <Select
              data={['Engineering Manager', 'Project Director', 'Technical Lead', 'Principal Consultant']}
              value={form.approvalAuthority}
              onChange={(v) => onChange('approvalAuthority', v || '')}
              styles={inputSt}
            />
            <H>People Select · Authority matrix</H>
          </Box>
        </Grid.Col>
        <Grid.Col span={6} />
      </Grid>
    </Box>
  );
}

/* ─── Step 3: Review ─────────────────────────────────────────────── */
function StepReview({ form }) {
  const Row = ({ label, value }) => (
    <Group justify="space-between" py={7} style={{ borderBottom: '1px solid #f3f4f6' }}>
      <Text size="sm" c="#6b7280">{label}</Text>
      <Text size="sm" fw={600} c="#111827">{value || '—'}</Text>
    </Group>
  );
  return (
    <Box>
      <Title order={4} fw={700} fz={15} c="#111827" mb="md">Review configuration details</Title>
      <Row label="Review profile"      value={form.reviewProfile} />
      <Row label="Reviewers"           value={form.reviewers} />
      <Row label="Routing mode"        value={form.routingMode} />
      <Row label="Review due"          value={form.reviewDue} />
      <Row label="Approval authority"  value={form.approvalAuthority} />
    </Box>
  );
}

/* ─── Step 4: Confirm ────────────────────────────────────────────── */
function StepConfirm() {
  return (
    <Box>
      <Title order={4} fw={700} fz={15} c="#111827" mb="sm">Confirm review routing</Title>
      <Box p="md" style={{ backgroundColor: '#f2fbf5', borderLeft: '4px solid #007336', borderRadius: '0 6px 6px 0' }}>
        <Text size="sm" c="#182b23" lh={1.6}>
          Clicking <Text span fw={700}>Start review cycle</Text> will notify all assigned reviewers, initialize
          the collaborative review workspace, and start SLA tracking for response turnaround.
          Demo mode does not write to backend services.
        </Text>
      </Box>
    </Box>
  );
}

/* ─── Main layout ────────────────────────────────────────────────── */
export default function ReviewRoutingLayout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewRoutingId, setReviewRoutingId] = useState(null);
  const [form, setForm] = useState({
    submissionId:      '',
    submissionPurpose: '',
    reviewProfile:     'Multidisciplinary IFR',
    reviewers:         '',
    routingMode:       'Parallel',
    reviewDue:         '',
    approvalAuthority: 'Engineering Manager',
  });

  // Fetch formal submission data on component mount
  useEffect(() => {
    const fetchSubmissionData = async () => {
      setIsLoading(true);
      try {
        // Get submission ID from URL params or use a default for demo
        const submissionId = searchParams.get('submission_id') || 'formal-sub-b0904127-57ef-4e41-9856-0757c1d59c71';

        const response = await getFormalSubmissionById(submissionId);

        // Handle response
        const data = response?.data || response;
        
        setForm((f) => ({
          ...f,
          submissionId: data.id || submissionId,
          submissionPurpose: data.submission_type || data.purpose || 'IFR Multidisciplinary Review',
        }));
      } catch (err) {
        console.error('Error fetching formal submission data:', err);
        notifications.show({
          title: 'Error loading data',
          message: 'Failed to fetch submission details: ' + err.message,
          color: 'red',
        });

        // Set fallback data for demo
        setForm((f) => ({
          ...f,
          submissionId: 'SUB-2026-001',
          submissionPurpose: 'IFR Multidisciplinary Review',
        }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissionData();
  }, [searchParams]);

  const onChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleNext = async () => {
    // Step 1: Context - Create review routing via API
    if (step === 1) {
      // Validation
      if (!form.submissionId) {
        notifications.show({
          title: 'Validation Error',
          message: 'Submission ID is required',
          color: 'red',
        });
        return;
      }
      if (!form.submissionPurpose) {
        notifications.show({
          title: 'Validation Error',
          message: 'Submission purpose is required',
          color: 'red',
        });
        return;
      }

      // Create review routing via API
      setIsSubmitting(true);
      try {
        const reviewRoutingData = {
          submission_id: form.submissionId,
          submission_purpose: form.submissionPurpose,
          created_by: getUserId(),
        };

        const response = await createReviewRouting(reviewRoutingData);
        
        // Handle response
        const createdRouting = response?.data || response;
        if (createdRouting?.id) {
          setReviewRoutingId(createdRouting.id);
        }

        notifications.show({
          title: 'Context saved',
          message: 'Review routing context created successfully.',
          color: 'green',
        });

        // Move to next step
        setStep((s) => s + 1);
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to save context: ' + error.message,
          color: 'red',
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Step 2: Details - Update review routing details via API
    if (step === 2) {
      // Validation
      if (!form.reviewProfile) {
        notifications.show({
          title: 'Validation Error',
          message: 'Review profile is required',
          color: 'red',
        });
        return;
      }
      if (!form.reviewers.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'Reviewers are required',
          color: 'red',
        });
        return;
      }
      if (!form.routingMode) {
        notifications.show({
          title: 'Validation Error',
          message: 'Routing mode is required',
          color: 'red',
        });
        return;
      }
      if (!form.reviewDue.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'Review due date is required',
          color: 'red',
        });
        return;
      }
      if (!form.approvalAuthority) {
        notifications.show({
          title: 'Validation Error',
          message: 'Approval authority is required',
          color: 'red',
        });
        return;
      }

      // Check if we have a review routing ID
      if (!reviewRoutingId) {
        notifications.show({
          title: 'Error',
          message: 'Review routing ID not found. Please complete Step 1 first.',
          color: 'red',
        });
        return;
      }

      // Update review routing details via API
      setIsSubmitting(true);
      try {
        const detailsData = {
          review_profile: form.reviewProfile,
          reviewers: form.reviewers.trim(),
          routing_mode: form.routingMode,
          review_due: form.reviewDue.trim(),
          approval_authority: form.approvalAuthority,
        };

        await updateReviewRouting(reviewRoutingId, detailsData);

        notifications.show({
          title: 'Details saved',
          message: 'Review routing details updated successfully.',
          color: 'green',
        });

        // Move to next step
        setStep((s) => s + 1);
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to save details: ' + error.message,
          color: 'red',
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Step 3: Review - just navigate
    if (step === 3) {
      setStep((s) => s + 1);
      return;
    }

    // Step 4: Final step
    notifications.show({
      title: 'Review cycle started',
      message: 'Review cycle initiated and routing configured.',
      color: 'green',
    });
    navigate(-1);
  };

  const handleBack = () => {
    if (step === 1) { navigate(-1); return; }
    setStep((s) => s - 1);
  };

  return (
    <Box>
      {/* Page header */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Review Cycle Configuration and Routing
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={640}>
              Configure review disciplines, named reviewers, sequence or parallel routing, due dates
              and approval authority for one formal submission.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleNext}
            disabled={isLoading || isSubmitting}
            loading={isSubmitting && step === 4}
            style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 20, paddingRight: 20, alignSelf: 'flex-start' }}>
            Start review cycle
          </Button>
        </Group>
      </Box>

      {/* Stepper */}
      <RoutingStepper active={step} />

      {/* Two-column body */}
      <Grid gutter="md" align="flex-start">
        {/* Left: form */}
        <Grid.Col span={{ base: 12, md: 8.5 }}>
          <Paper p="lg" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            {step === 1 && <StepContext form={form} onChange={onChange} isLoading={isLoading} />}
            {step === 2 && <StepDetails  form={form} onChange={onChange} />}
            {step === 3 && <StepReview   form={form} />}
            {step === 4 && <StepConfirm />}

            <Group mt="xl" gap="sm">
              <Button
                variant="default"
                onClick={handleBack}
                disabled={isSubmitting}
                style={{ borderColor: '#d1d5db', color: '#374151', fontWeight: 600, height: 38, borderRadius: 6 }}>
                Back
              </Button>
              <Button
                color="green"
                onClick={handleNext}
                loading={isSubmitting}
                disabled={isLoading && step === 1}
                style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6 }}>
                {step === 4 ? 'Start review cycle' : step === 1 ? 'Continue' : 'Continue'}
              </Button>
            </Group>
          </Paper>
        </Grid.Col>

        {/* Right: gate conditions */}
        <Grid.Col span={{ base: 12, md: 3.5 }}>
          <GatePanel />
        </Grid.Col>
      </Grid>
    </Box>
  );
}
