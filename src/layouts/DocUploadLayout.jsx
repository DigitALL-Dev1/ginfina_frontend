import { useState, useEffect } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select, Textarea,
  Text, TextInput, Title, Stack, Divider, Loader,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { getEwpRecords } from '../services/ewpService';
import { createDocRevision, updateControlledDetails } from '../services/docRevisionService';
import { getProjectId, getUserId } from '../utils/storage';

/* ─── Steps ──────────────────────────────────────────────────────── */
const STEPS = [
  { number: 1, label: 'Context' },
  { number: 2, label: 'Details' },
  { number: 3, label: 'Review'  },
  { number: 4, label: 'Confirm' },
];

/* ─── Custom stepper ─────────────────────────────────────────────── */
function DocStepper({ active }) {
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
                  // Auto-populate discipline based on EWP selection
                  if (v && ewpMap[v]) {
                    onChange('discipline', ewpMap[v].discipline || 'N/A');
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
          <Box><L required>Document code</L>
            <TextInput value={form.docCode} onChange={(e) => onChange('docCode', e.target.value)} placeholder="Enter document code..." styles={inputSt} />
            <H>TextInput · Unique within EWP</H></Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box><L required>Document title</L>
            <TextInput value={form.docTitle} onChange={(e) => onChange('docTitle', e.target.value)} placeholder="Enter document title..." styles={inputSt} />
            <H>TextInput · Descriptive, unique within discipline</H></Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box><L required>Discipline</L>
            <TextInput value={form.discipline} readOnly styles={roSt} placeholder="Auto-filled from EWP" />
            <H>Read-only · Derived from EWP</H></Box>
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
        {/* Deliverable */}
        <Grid.Col span={6}>
          <Box><L required>Deliverable</L>
            <TextInput value={form.deliverable} onChange={(e) => onChange('deliverable', e.target.value)} styles={inputSt} />
            <H>Select · Must belong to EWP</H></Box>
        </Grid.Col>
        {/* Native file */}
        <Grid.Col span={6}>
          <Box><L required>Native file</L>
            <TextInput value={form.nativeFile} onChange={(e) => onChange('nativeFile', e.target.value)} styles={inputSt} />
            <H>Dropzone · Allowed type, size, virus scan</H></Box>
        </Grid.Col>
        {/* PDF review rendition */}
        <Grid.Col span={6}>
          <Box><L required>PDF review rendition</L>
            <TextInput value={form.pdfRendition} onChange={(e) => onChange('pdfRendition', e.target.value)} styles={inputSt} />
            <H>Dropzone · Mandatory for review in R1.0</H></Box>
        </Grid.Col>
        {/* Revision code */}
        <Grid.Col span={6}>
          <Box><L required>Revision code</L>
            <TextInput value={form.revCode} onChange={(e) => onChange('revCode', e.target.value)} styles={inputSt} />
            <H>TextInput · Unique within document</H></Box>
        </Grid.Col>
        {/* Revision purpose */}
        <Grid.Col span={6}>
          <Box><L required>Revision purpose</L>
            <Select data={['For Review', 'For Construction', 'For Approval', 'As Built']}
              value={form.revPurpose} onChange={(v) => onChange('revPurpose', v || '')} styles={inputSt} />
            <H>Select · Controlled purpose</H></Box>
        </Grid.Col>
        {/* Revision notes */}
        <Grid.Col span={6}>
          <Box><L required>Revision notes</L>
            <Textarea value={form.revNotes} onChange={(e) => onChange('revNotes', e.target.value)} minRows={4} styles={areaSt} />
            <H>Textarea · Meaningful delta required</H></Box>
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
      <Title order={4} fw={700} fz={15} c="#111827" mb="md">Review upload details</Title>
      <Row label="EWP reference"       value={form.ewpRef} />
      <Row label="Deliverable"         value={form.deliverable} />
      <Row label="Native file"         value={form.nativeFile} />
      <Row label="PDF review rendition" value={form.pdfRendition} />
      <Row label="Revision code"       value={form.revCode} />
      <Row label="Revision purpose"    value={form.revPurpose} />
      <Row label="Revision notes"      value={form.revNotes} />
    </Box>
  );
}

/* ─── Step 4: Confirm ────────────────────────────────────────────── */
function StepConfirm() {
  return (
    <Box>
      <Title order={4} fw={700} fz={15} c="#111827" mb="sm">Confirm revision registration</Title>
      <Box p="md" style={{ backgroundColor: '#f2fbf5', borderLeft: '4px solid #007336', borderRadius: '0 6px 6px 0' }}>
        <Text size="sm" c="#182b23" lh={1.6}>
          Clicking <Text span fw={700}>Register revision</Text> will create an immutable, audited document revision.
          The prior revision is preserved as evidence. Files are virus-scanned and hash-verified before storage.
          Demo mode does not write to backend services.
        </Text>
      </Box>
    </Box>
  );
}

/* ─── Main layout ────────────────────────────────────────────────── */
export default function DocUploadLayout() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [ewpOptions, setEwpOptions] = useState([]);
  const [ewpMap, setEwpMap] = useState({});
  const [isLoadingEwp, setIsLoadingEwp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docRevisionId, setDocRevisionId] = useState(null);
  const [form, setForm] = useState({
    ewpRef:       '',
    docCode:      '',
    docTitle:     '',
    discipline:   '',
    deliverable:  '',
    nativeFile:   '',
    pdfRendition: '',
    revCode:      '',
    revPurpose:   '',
    revNotes:     '',
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
          'ewp-sample-001': { discipline: 'Electrical', ewp_title: 'Boregaina Electrical Design', id: 'ewp-sample-001' },
          'ewp-sample-002': { discipline: 'Structural', ewp_title: 'Boregaina Structural Design', id: 'ewp-sample-002' },
        });
      } finally {
        setIsLoadingEwp(false);
      }
    };

    fetchEwpData();
  }, []);

  const onChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleNext = async () => {
    // Step 1: Context - Create document revision via API
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
      if (!form.docCode.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please enter a document code',
          color: 'red',
        });
        return;
      }
      if (!form.docTitle.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please enter a document title',
          color: 'red',
        });
        return;
      }
      if (!form.discipline) {
        notifications.show({
          title: 'Validation Error',
          message: 'Discipline is required (auto-filled from EWP)',
          color: 'red',
        });
        return;
      }

      // Create document revision via API
      setIsSubmitting(true);
      try {
        const docRevisionData = {
          ewp_reference: form.ewpRef,
          document_code: form.docCode.trim(),
          document_title: form.docTitle.trim(),
          discipline: form.discipline,
          submitted_by: getUserId(),
        };

        const response = await createDocRevision(docRevisionData);
        
        // Handle response
        const createdDocRevision = response?.data || response;
        if (createdDocRevision?.id) {
          setDocRevisionId(createdDocRevision.id);
        }

        notifications.show({
          title: 'Context saved',
          message: 'Document revision context created successfully.',
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

    // Step 2: Details - Update controlled details via API
    if (step === 2) {
      // Validation for Step 2
      if (!form.deliverable.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please enter a deliverable',
          color: 'red',
        });
        return;
      }
      if (!form.nativeFile.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please enter a native file',
          color: 'red',
        });
        return;
      }
      if (!form.pdfRendition.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please enter a PDF rendition',
          color: 'red',
        });
        return;
      }
      if (!form.revCode.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please enter a revision code',
          color: 'red',
        });
        return;
      }
      if (!form.revPurpose) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please select a revision purpose',
          color: 'red',
        });
        return;
      }
      if (!form.revNotes.trim()) {
        notifications.show({
          title: 'Validation Error',
          message: 'Please enter revision notes',
          color: 'red',
        });
        return;
      }

      // Check if we have a document revision ID
      if (!docRevisionId) {
        notifications.show({
          title: 'Error',
          message: 'Document revision ID not found. Please complete Step 1 first.',
          color: 'red',
        });
        return;
      }

      // Update controlled details via API
      setIsSubmitting(true);
      try {
        const controlledDetailsData = {
          deliverable: form.deliverable.trim(),
          revision_code: form.revCode.trim(),
          revision_purpose: form.revPurpose,
          revision_notes: form.revNotes.trim(),
          native_file: form.nativeFile.trim(),
          pdf_rendition: form.pdfRendition.trim(),
        };

        await updateControlledDetails(docRevisionId, controlledDetailsData);

        notifications.show({
          title: 'Details saved',
          message: 'Controlled details updated successfully.',
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

    // Step 4: Final step - Complete registration
    notifications.show({
      title: 'Revision registered',
      message: 'Document revision has been registered successfully.',
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
              Document Upload and Revision Registration
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={620}>
              Upload a native engineering file and mandatory review rendition, capture metadata, scan
              the file and create a controlled revision without overwriting prior evidence.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleNext}
            disabled={isLoadingEwp || isSubmitting}
            loading={isSubmitting && step === 4}
            style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 20, paddingRight: 20, alignSelf: 'flex-start' }}>
            Register revision
          </Button>
        </Group>
      </Box>

      {/* Stepper */}
      <DocStepper active={step} />

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
                {step === 4 ? 'Register revision' : step === 1 ? 'Continue' : 'Continue'}
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
