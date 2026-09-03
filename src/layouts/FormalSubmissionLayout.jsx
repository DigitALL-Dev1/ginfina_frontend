import { useState, useEffect } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select, MultiSelect, Textarea,
  Text, TextInput, Title, Stack, Divider, Loader,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { getEwpRecords } from '../services/ewpService';
import { createFormalSubmission, updateFormalSubmission } from '../services/formalSubmissionService';
import { getProjectId, getUserId } from '../utils/storage';

/* ─── Steps ──────────────────────────────────────────────────────── */
const STEPS = [
  { number: 1, label: 'Context' },
  { number: 2, label: 'Details' },
  { number: 3, label: 'Review'  },
  { number: 4, label: 'Confirm' },
];

/* ─── Custom stepper ─────────────────────────────────────────────── */
function SubmissionStepper({ active }) {
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
const areaSt  = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6 } };
const roSt    = { input: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', borderRadius: 6, height: 38, cursor: 'default' } };
const L = ({ children, required }) => (
  <Text size="xs" fw={600} c="#374151" mb={4}>{children}{required && <Text span c="red"> *</Text>}</Text>
);
const H = ({ children }) => <Text size="11px" c="#9ca3af" mt={4}>{children}</Text>;

/* ─── Step 1: Context ────────────────────────────────────────────── */
function StepContext({ form, onChange, ewpOptions, ewpMap, isLoadingEwp }) {
  return (
    <Box>
      <Title order={4} fw={700} fz={15} c="#111827" mb="md">Controlled details</Title>
      <Grid gutter="md">
        <Grid.Col span={6}>
          <Box>
            <L required>EWP reference</L>
            {isLoadingEwp ? (
              <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 38, border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: '#f9fafb' }}>
                <Loader size="xs" color="green" />
              </Box>
            ) : (
              <Select
                data={ewpOptions}
                value={form.ewpRef}
                onChange={(v) => {
                  onChange('ewpRef', v || '');
                  // Auto-populate project based on EWP selection
                  if (v && ewpMap[v]) {
                    onChange('project', ewpMap[v].project_id || 'N/A');
                  }
                }}
                placeholder="Select EWP..."
                searchable
                styles={inputSt}
              />
            )}
            <H>Select · Must be in design state</H>
          </Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box><L required>Originator</L>
            <TextInput
              value={form.originator}
              onChange={(e) => onChange('originator', e.target.value)}
              placeholder="Enter originator..."
              styles={inputSt}
            />
            <H>TextInput · Authorised submitter</H></Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box><L required>Project / Site</L>
            <TextInput
              value={form.project}
              readOnly
              placeholder="Auto-filled from EWP"
              styles={roSt}
            />
            <H>Read-only · Derived from EWP</H></Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box><L required>Target Review Due Date</L>
            <TextInput
              value={form.targetDate}
              onChange={(e) => onChange('targetDate', e.target.value)}
              placeholder="YYYY-MM-DD"
              styles={inputSt}
            />
            <H>DatePickerInput · SLA validated</H></Box>
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
        {/* Submission type */}
        <Grid.Col span={6}>
          <Box>
            <L required>Submission type</L>
            <Select
              data={['For Review', 'For Approval', 'For Construction', 'For Information']}
              value={form.submissionType}
              onChange={(v) => onChange('submissionType', v || '')}
              styles={inputSt}
            />
            <H>Select · Controlled type</H>
          </Box>
        </Grid.Col>

        {/* Included revisions */}
        <Grid.Col span={6}>
          <Box>
            <L required>Included revisions</L>
            <TextInput
              value={form.includedRevisions}
              onChange={(e) => onChange('includedRevisions', e.target.value)}
              styles={inputSt}
            />
            <H>MultiSelect / manifest grid · Exact revision IDs</H>
          </Box>
        </Grid.Col>

        {/* Purpose */}
        <Grid.Col span={6}>
          <Box>
            <L required>Purpose</L>
            <Textarea
              value={form.purpose}
              onChange={(e) => onChange('purpose', e.target.value)}
              minRows={4}
              styles={areaSt}
            />
            <H>Textarea · Required</H>
          </Box>
        </Grid.Col>

        {/* Transmittal note */}
        <Grid.Col span={6}>
          <Box>
            <L>Transmittal note</L>
            <Textarea
              value={form.transmittalNote}
              onChange={(e) => onChange('transmittalNote', e.target.value)}
              minRows={4}
              styles={areaSt}
            />
            <H>Textarea · Optional but audited</H>
          </Box>
        </Grid.Col>
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
      <Title order={4} fw={700} fz={15} c="#111827" mb="md">Review submission details</Title>
      <Row label="Submission type"     value={form.submissionType} />
      <Row label="Included revisions"  value={form.includedRevisions} />
      <Row label="Purpose"             value={form.purpose} />
      <Row label="Transmittal note"    value={form.transmittalNote} />
    </Box>
  );
}

/* ─── Step 4: Confirm ────────────────────────────────────────────── */
function StepConfirm() {
  return (
    <Box>
      <Title order={4} fw={700} fz={15} c="#111827" mb="sm">Confirm formal submission</Title>
      <Box p="md" style={{ backgroundColor: '#f2fbf5', borderLeft: '4px solid #007336', borderRadius: '0 6px 6px 0' }}>
        <Text size="sm" c="#182b23" lh={1.6}>
          Clicking <Text span fw={700}>Submit formal transmittal</Text> will freeze the selected revisions and
          create an immutable transmittal record for review. Automated hash checks and virus scans are audited.
          Demo mode does not write to backend services.
        </Text>
      </Box>
    </Box>
  );
}

/* ─── Main layout ────────────────────────────────────────────────── */
export default function FormalSubmissionLayout() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [ewpOptions, setEwpOptions] = useState([]);
  const [ewpMap, setEwpMap] = useState({});
  const [isLoadingEwp, setIsLoadingEwp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formalSubmissionId, setFormalSubmissionId] = useState(null);
  const [form, setForm] = useState({
    ewpRef:            '',
    originator:        '',
    project:           '',
    targetDate:        '',
    submissionType:    '',
    includedRevisions: '',
    purpose:           '',
    transmittalNote:   '',
  });

  // Fetch EWP data on component mount
  useEffect(() => {
    const fetchEwpData = async () => {
      setIsLoadingEwp(true);
      try {
        // Get project_id from storage
        const projectId = getProjectId();
        
        // Fetch EWP records filtered by project_id and status
        const response = await getEwpRecords({
          project_id: projectId,
          status: 'ready'
        });
        
        // Handle different response structures
        let ewpData = [];
        if (response?.data) {
          ewpData = Array.isArray(response.data) ? response.data : [response.data];
        } else if (Array.isArray(response)) {
          ewpData = response;
        } else if (response) {
          ewpData = [response];
        }

        // Create options array for Select component and map for lookup
        const options = ewpData.map(ewp => ({
          value: ewp.id,
          label: `${ewp.ewp_title || 'Untitled'} (${ewp.discipline || 'N/A'})`,
        }));

        // Create a map for quick lookup
        const map = {};
        ewpData.forEach(ewp => {
          map[ewp.id] = {
            id: ewp.id,
            project_id: ewp.project_id,
            ewp_title: ewp.ewp_title,
            discipline: ewp.discipline,
            design_stage: ewp.design_stage,
            scope_statement: ewp.scope_statement,
            design_basis: ewp.design_basis,
            ...ewp
          };
        });

        setEwpOptions(options);
        setEwpMap(map);

        // If no EWPs found, show info notification
        if (options.length === 0) {
          notifications.show({
            title: 'No EWPs available',
            message: `No EWPs found for project ${projectId} with status "ready"`,
            color: 'blue',
          });
        }
      } catch (error) {
        console.error('Error fetching EWP data:', error);
        notifications.show({
          title: 'Error loading EWP data',
          message: 'Failed to fetch EWP records: ' + error.message,
          color: 'red',
        });
        
        // Set fallback options in case of error
        setEwpOptions([
          { value: 'ewp-sample-001', label: 'Boregaina Electrical Design (Electrical)' },
          { value: 'ewp-sample-002', label: 'Boregaina Structural Design (Structural)' },
        ]);
        setEwpMap({
          'ewp-sample-001': { project_id: 'UNICEF PNG Solar Systems', discipline: 'Electrical', ewp_title: 'Boregaina Electrical Design', id: 'ewp-sample-001' },
          'ewp-sample-002': { project_id: 'UNICEF PNG Solar Systems', discipline: 'Structural', ewp_title: 'Boregaina Structural Design', id: 'ewp-sample-002' },
        });
      } finally {
        setIsLoadingEwp(false);
      }
    };

    fetchEwpData();
  }, []);

  const onChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleNext = async () => {
    // Step 1: Context - Create formal submission via API
    if (step === 1) {
      // Validation for Step 1
      if (!form.ewpRef) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please select an EWP reference',
          color: 'red',
        });
        return;
      }
      if (!form.originator.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please enter an originator',
          color: 'red',
        });
        return;
      }
      if (!form.project) {
        notifications.show({
          title: 'Validation Error',
          message: 'Project is required (auto-filled from EWP)',
          color: 'red',
        });
        return;
      }
      if (!form.targetDate.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please enter a target review due date',
          color: 'red',
        });
        return;
      }

      // Create formal submission via API
      setIsSubmitting(true);
      try {
        const formalSubmissionData = {
          ewp_reference: form.ewpRef,
          originator: form.originator.trim(),
          project: form.project,
          target_review_due_date: form.targetDate.trim(),
          submitted_by: getUserId(),
        };

        const response = await createFormalSubmission(formalSubmissionData);
        
        // Handle response
        const createdSubmission = response?.data || response;
        if (createdSubmission?.id) {
          setFormalSubmissionId(createdSubmission.id);
        }

        notifications.show({
          title: 'Context saved',
          message: 'Formal submission context created successfully.',
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

    // Step 2: Details - Update formal submission details via API
    if (step === 2) {
      // Validation for Step 2
      if (!form.submissionType) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please select a submission type',
          color: 'red',
        });
        return;
      }
      if (!form.includedRevisions.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please enter included revisions',
          color: 'red',
        });
        return;
      }
      if (!form.purpose.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please enter a purpose',
          color: 'red',
        });
        return;
      }

      // Check if we have a formal submission ID
      if (!formalSubmissionId) {
        notifications.show({
          title: 'Error',
          message: 'Formal submission ID not found. Please complete Step 1 first.',
          color: 'red',
        });
        return;
      }

      // Update formal submission details via API
      setIsSubmitting(true);
      try {
        const detailsData = {
          submission_type: form.submissionType,
          included_revisions: form.includedRevisions.trim(),
          purpose: form.purpose.trim(),
          transmittal_note: form.transmittalNote.trim() || '',
        };

        await updateFormalSubmission(formalSubmissionId, detailsData);

        notifications.show({
          title: 'Details saved',
          message: 'Formal submission details updated successfully.',
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

    // Step 4: Final step - Complete submission
    notifications.show({
      title: 'Submission sent',
      message: 'Formal transmittal has been submitted for review.',
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
              Formal Submission and Transmittal
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={640}>
              Create an immutable submission manifest containing exact document revision IDs, purpose,
              notes and transmittal evidence for formal review.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleNext}
            disabled={isLoadingEwp || isSubmitting}
            loading={isSubmitting && step === 4}
            style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 20, paddingRight: 20, alignSelf: 'flex-start' }}>
            Submit formal transmittal
          </Button>
        </Group>
      </Box>

      {/* Stepper */}
      <SubmissionStepper active={step} />

      {/* Two-column body */}
      <Grid gutter="md" align="flex-start">
        {/* Left: form */}
        <Grid.Col span={{ base: 12, md: 8.5 }}>
          <Paper p="lg" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            {step === 1 && <StepContext form={form} onChange={onChange} ewpOptions={ewpOptions} ewpMap={ewpMap} isLoadingEwp={isLoadingEwp} />}
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
                disabled={isLoadingEwp && step === 1}
                style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6 }}>
                {step === 4 ? 'Submit formal transmittal' : step === 1 ? 'Continue' : 'Continue'}
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
