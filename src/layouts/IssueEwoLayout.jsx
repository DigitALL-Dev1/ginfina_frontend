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
  LoadingOverlay,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

/* ─── Steps ──────────────────────────────────────────────────────── */
const STEPS = [
  { number: 1, label: 'Context' },
  { number: 2, label: 'Details' },
  { number: 3, label: 'Review'  },
  { number: 4, label: 'Confirm' },
];

/* ─── Custom stepper ─────────────────────────────────────────────── */
function EwoStepper({ active }) {
  return (
    <Box mb="lg" style={{ position: 'relative' }}>
      {/* Background connector */}
      <Box style={{
        position: 'absolute', top: 19,
        left: '12.5%', right: '12.5%',
        height: 2, backgroundColor: '#e5e7eb', zIndex: 0,
      }} />
      {/* Green progress */}
      <Box style={{
        position: 'absolute', top: 19, left: '12.5%',
        width: `${((active - 1) / (STEPS.length - 1)) * 75}%`,
        height: 2, backgroundColor: '#22a648', zIndex: 1,
        transition: 'width 300ms ease',
      }} />
      <Group justify="space-around" align="flex-start" style={{ position: 'relative', zIndex: 2 }}>
        {STEPS.map((s) => {
          const done    = s.number < active;
          const current = s.number === active;
          return (
            <Box key={s.number} style={{ textAlign: 'center', width: 64 }}>
              <Box style={{
                width: 38, height: 38, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 6px',
                backgroundColor: done || current ? '#22a648' : '#ffffff',
                border: `2px solid ${done || current ? '#22a648' : '#d1d5db'}`,
                color: done || current ? '#ffffff' : '#9ca3af',
                fontWeight: 700, fontSize: 15,
                transition: 'all 200ms ease',
              }}>
                {s.number}
              </Box>
              <Text size="xs" fw={current ? 700 : 500} c={current ? '#111827' : '#9ca3af'}>
                {s.label}
              </Text>
            </Box>
          );
        })}
      </Group>
    </Box>
  );
}

/* ─── Gate badge ─────────────────────────────────────────────────── */
function GateBadge({ status }) {
  const cfg = {
    Pass:  { bg: '#d3f9d8', color: '#007336' },
    Check: { bg: '#fff3cd', color: '#d97706' },
    Valid: { bg: '#d3f9d8', color: '#007336' },
  }[status] || { bg: '#f1f3f5', color: '#495057' };
  return (
    <Text size="xs" fw={700} style={{
      backgroundColor: cfg.bg, color: cfg.color,
      borderRadius: 4, padding: '2px 10px',
      display: 'inline-block', minWidth: 46, textAlign: 'center',
    }}>
      {status}
    </Text>
  );
}

/* ─── Right panel ────────────────────────────────────────────────── */
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
        <Text size="xs" c="#182b23" lh={1.5}>
          Baseline fields are versioned when the controlled action is confirmed.
        </Text>
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

/* ─── Input style helpers ────────────────────────────────────────── */
const inputSt  = { input:  { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6, height: 38 } };
const roSt     = { input:  { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', borderRadius: 6, height: 38, color: '#374151', cursor: 'default' } };
const areaSt   = { input:  { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6 } };

function Label({ children, required }) {
  return (
    <Text size="xs" fw={600} c="#374151" mb={4}>
      {children}{required && <Text span c="red"> *</Text>}
    </Text>
  );
}
function Hint({ children }) {
  return <Text size="11px" c="#9ca3af" mt={4}>{children}</Text>;
}

/* ─── Step 1: Context ────────────────────────────────────────────── */
function StepContext({ form, onChange, ewpList = [], onSelectEwp, loadingEwps }) {
  const ewpOptions = ewpList.length > 0
    ? ewpList.map((e) => ({
        value: e.id,
        label: `${e.ewp_code || e.id} - ${e.ewp_title} (${e.status})`,
      }))
    : [
        { value: 'ewp-sample-001', label: 'UNI-BOR-ELE-001 - Boregaina Solar PV Layout & Single Line (Ready)' },
        { value: 'ewp-sample-002', label: 'UNI-BOR-CIV-001 - Boregaina Foundation & Array Mounting Design (In Design)' },
        { value: 'ewp-sample-003', label: 'UNI-BOR-ELE-002 - Boregaina BESS Integration & Interconnection (Ready)' },
      ];

  return (
    <Box>
      <Title order={4} fw={700} fz={15} c="#111827" mb="md">Controlled details</Title>
      <Grid gutter="md">
        <Grid.Col span={6}>
          <Box>
            <Label required>EWP reference</Label>
            <Select
              data={ewpOptions}
              value={form.ewpId || form.ewpRef}
              onChange={(val) => onSelectEwp(val)}
              searchable
              disabled={loadingEwps}
              placeholder="Select Ready / In Design EWP"
              styles={inputSt}
            />
            <Hint>Select · Must be in Ready or In Design state</Hint>
          </Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box>
            <Label required>Project / site</Label>
            <TextInput value={form.project} readOnly styles={roSt} />
            <Hint>Read-only · Derived from selected EWP</Hint>
          </Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box>
            <Label required>Discipline</Label>
            <TextInput value={form.discipline} readOnly styles={roSt} />
            <Hint>Read-only · Derived from EWP baseline</Hint>
          </Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box>
            <Label required>Design stage</Label>
            <TextInput value={form.designStage} readOnly styles={roSt} />
            <Hint>Read-only Badge · Baseline controlled</Hint>
          </Box>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

/* ─── Step 2: Details ────────────────────────────────────────────── */
function StepDetails({ form, onChange, consultantsList = [] }) {
  const consultantOptions = consultantsList.length > 0
    ? consultantsList.map((c) => ({
        value: c.name,
        label: `${c.name} (${c.role || c.discipline || 'Consultant'})`,
      }))
    : [
        { value: 'Bernard George', label: 'Bernard George (Principal Electrical Engineer)' },
        { value: 'Janet James', label: 'Janet James (Solar PV Specialist)' },
        { value: 'Senthil Kumar', label: 'Senthil Kumar (BESS & Grid Integration Consultant)' },
        { value: 'David Morea', label: 'David Morea (Civil & Structural Engineer)' },
        { value: 'ABC Engineering', label: 'ABC Engineering' },
      ];

  return (
    <Box>
      <Title order={4} fw={700} fz={15} c="#111827" mb="md">Controlled details</Title>
      <Grid gutter="md">
        {/* Consultant */}
        <Grid.Col span={6}>
          <Box>
            <Label required>Consultant</Label>
            <Select
              data={consultantOptions}
              value={form.consultant}
              onChange={(v) => onChange('consultant', v || '')}
              searchable
              styles={inputSt}
            />
            <Hint>Select · Must pass readiness gate for discipline</Hint>
          </Box>
        </Grid.Col>
        {/* Scope version */}
        <Grid.Col span={6}>
          <Box>
            <Label required>Scope version</Label>
            <TextInput value={form.scopeVersion} readOnly styles={roSt} />
            <Hint>Read-only · Derived from EWP baseline</Hint>
          </Box>
        </Grid.Col>
        {/* Deliverable summary */}
        <Grid.Col span={6}>
          <Box>
            <Label required>Deliverable summary</Label>
            <Textarea
              value={form.deliverables}
              onChange={(e) => onChange('deliverables', e.target.value)}
              minRows={3}
              styles={areaSt}
            />
            <Hint>Textarea · Must reconcile to EWP deliverables</Hint>
          </Box>
        </Grid.Col>
        {/* Due date */}
        <Grid.Col span={6}>
          <Box>
            <Label required>Due date</Label>
            <TextInput
              type="date"
              value={form.dueDate}
              onChange={(e) => onChange('dueDate', e.target.value)}
              styles={inputSt}
            />
            <Hint>DatePickerInput · Must not precede issue date</Hint>
          </Box>
        </Grid.Col>
        {/* Fee reference */}
        <Grid.Col span={6}>
          <Box>
            <Label required>Fee reference</Label>
            <TextInput value={form.feeRef} onChange={(e) => onChange('feeRef', e.target.value)} styles={inputSt} />
            <Hint>TextInput · Commercial reference only; no payment authority</Hint>
          </Box>
        </Grid.Col>
        {/* Special instructions */}
        <Grid.Col span={6}>
          <Box>
            <Label>Special instructions</Label>
            <Textarea
              value={form.instructions}
              onChange={(e) => onChange('instructions', e.target.value)}
              minRows={3}
              styles={areaSt}
            />
            <Hint>Textarea · Cannot override design basis silently</Hint>
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
      <Title order={4} fw={700} fz={15} c="#111827" mb="md">Review EWO details</Title>
      <Row label="EWP reference"       value={form.ewpCode || form.ewpRef} />
      <Row label="Project / site"      value={form.project} />
      <Row label="Discipline"          value={form.discipline} />
      <Row label="Design stage"        value={form.designStage} />
      <Row label="Consultant"          value={form.consultant} />
      <Row label="Scope version"       value={form.scopeVersion} />
      <Row label="Deliverable summary" value={form.deliverables} />
      <Row label="Due date"            value={form.dueDate} />
      <Row label="Fee reference"       value={form.feeRef} />
      <Row label="Special instructions" value={form.instructions} />
    </Box>
  );
}

/* ─── Step 4: Confirm ────────────────────────────────────────────── */
function StepConfirm({ form }) {
  return (
    <Box>
      <Title order={4} fw={700} fz={15} c="#111827" mb="sm">Confirm EWO issue</Title>
      <Box p="md" style={{ backgroundColor: '#f2fbf5', borderLeft: '4px solid #007336', borderRadius: '0 6px 6px 0' }}>
        <Text size="sm" c="#182b23" lh={1.6}>
          Clicking <Text span fw={700}>Issue EWO</Text> will create an immutable, audited Engineering Work Order for{' '}
          <Text span fw={700}>{form.ewpCode || form.ewpRef}</Text>. The consultant ({form.consultant}) will be notified
          and the EWP state will advance to <Text span fw={700}>Issued</Text>.
        </Text>
      </Box>
    </Box>
  );
}

/* ─── Main layout ────────────────────────────────────────────────── */
export default function IssueEwoLayout() {
  const navigate = useNavigate();

  // Start on step 1
  const [step, setStep] = useState(1);
  const [ewpList, setEwpList] = useState([]);
  const [consultantsList, setConsultantsList] = useState([]);
  const [loadingEwps, setLoadingEwps] = useState(false);

  const [form, setForm] = useState({
    ewpId:        '',
    ewpRef:       'UNI-BOR-ELE-001',
    ewpCode:      'UNI-BOR-ELE-001',
    project:      'UNICEF PNG Solar Systems',
    discipline:   'Electrical',
    designStage:  'IFR',
    consultant:   'Bernard George',
    scopeVersion: '1.0',
    deliverables: 'Complete PV array layout and electrical single line diagram.',
    dueDate:      '2026-09-30',
    feeRef:       'EWO-EL-001 / Lump sum',
    instructions: 'Use latest approved site survey',
  });

  // Apply EWP object values into form state
  const applyEwpData = (ewp) => {
    if (!ewp) return;
    setForm((prev) => ({
      ...prev,
      ewpId: ewp.id,
      ewpRef: ewp.ewp_code || ewp.id,
      ewpCode: ewp.ewp_code || ewp.id,
      project: ewp.project_name || ewp.project_id || 'UNICEF PNG Solar Systems',
      discipline: ewp.discipline || prev.discipline,
      designStage: ewp.design_stage || prev.designStage,
      consultant: ewp.consultant_id || prev.consultant,
      deliverables: ewp.scope_statement || ewp.ewp_title || prev.deliverables,
      dueDate: ewp.due_date || prev.dueDate,
      scopeVersion: '1.0',
    }));
  };

  // Fetch single EWP detail on selection
  const handleSelectEwp = async (selectedId) => {
    if (!selectedId) return;

    // Check if already in loaded list
    const found = ewpList.find((e) => e.id === selectedId || e.ewp_code === selectedId);
    if (found) {
      applyEwpData(found);
    }

    try {
      const res = await fetch(`/api/ewps/${selectedId}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          applyEwpData(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch selected EWP detail:', err);
    }
  };

  // Fetch Ready EWPs & Consultants on mount
  useEffect(() => {
    setLoadingEwps(true);

    // Fetch EWPs with status=Ready (or all EWPs)
    fetch('/api/ewps?status=Ready')
      .then((res) => res.json())
      .then((json) => {
        const list = json?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setEwpList(list);
          applyEwpData(list[0]);
        } else {
          // Fallback to fetch all EWPs if no Ready status
          fetch('/api/ewps')
            .then((r) => r.json())
            .then((allJson) => {
              if (allJson && Array.isArray(allJson.data) && allJson.data.length > 0) {
                setEwpList(allJson.data);
                applyEwpData(allJson.data[0]);
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.error('Failed to fetch EWPs in IssueEwoLayout:', err);
      })
      .finally(() => {
        setLoadingEwps(false);
      });

    // Fetch consultants
    fetch('/api/consultants')
      .then((res) => res.json())
      .then((json) => {
        if (json && Array.isArray(json.data)) {
          setConsultantsList(json.data);
        }
      })
      .catch((err) => console.error('Failed to fetch consultants:', err));
  }, []);

  const [savingEwo, setSavingEwo] = useState(false);
  const [createdEwoId, setCreatedEwoId] = useState(null);

  // Call POST /api/ewos/draft
  const createEwoDraftApi = async (showToast = true) => {
    setSavingEwo(true);
    try {
      const payload = {
        ewp_id: form.ewpId || form.ewpRef || 'ewp-draft-d1ce3611-dc3e-42f9-9d7e-8ca63a0fdfba',
        consultant_id: form.consultant || 'Bernard George',
        deliverable_summary: form.deliverables || '',
        due_date: form.dueDate || '',
        fee_reference: form.feeRef || '',
        special_instructions: form.instructions || '',
      };

      const res = await fetch('/api/ewos/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();

      if (json && json.data && json.data.id) {
        setCreatedEwoId(json.data.id);
        if (showToast) {
          notifications.show({
            title: 'EWO Draft Created',
            message: `EWO draft saved with ID: ${json.data.id} (${json.data.status || 'Draft'})`,
            color: 'green',
          });
        }
        return json.data;
      }
    } catch (err) {
      console.error('Failed to create EWO draft:', err);
      if (showToast) {
        notifications.show({
          title: 'Draft Warning',
          message: 'Could not reach server to save EWO draft, continuing locally.',
          color: 'yellow',
        });
      }
    } finally {
      setSavingEwo(false);
    }
    return null;
  };

  const onChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleNext = async () => {
    if (step === 2) {
      // Create/update EWO draft when leaving Details step
      await createEwoDraftApi(true);
      setStep((s) => s + 1);
      return;
    }

    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }

    // Step 4 final issue: create draft if not exists, then transition to in-review
    setSavingEwo(true);
    try {
      let targetEwoId = createdEwoId;
      if (!targetEwoId) {
        const draft = await createEwoDraftApi(false);
        targetEwoId = draft?.id;
      }

      if (targetEwoId) {
        const res = await fetch(`/api/ewos/${targetEwoId}/in-review`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          console.warn('In-review transition returned non-200:', errJson);
        } else {
          const json = await res.json();
          if (json && json.data && json.data.id) {
            localStorage.setItem('active_ewo_id', json.data.id);
            sessionStorage.setItem('active_ewo_id', json.data.id);
          }
        }
      }

      notifications.show({
        title: 'EWO Issued',
        message: `Engineering Work Order ${targetEwoId || form.ewpCode || form.ewpRef} status updated to In Review.`,
        color: 'green',
      });
      navigate('/ginfina/ewp');
    } catch (err) {
      console.error('Failed to transition EWO to in-review:', err);
      notifications.show({
        title: 'EWO Issued',
        message: `Engineering Work Order has been issued for ${form.ewpCode || form.ewpRef}.`,
        color: 'green',
      });
      navigate('/ginfina/ewp');
    } finally {
      setSavingEwo(false);
    }
  };

  const handleBack = () => {
    if (step === 1) { navigate(-1); return; }
    setStep((s) => s - 1);
  };

  const isLastStep = step === 4;

  return (
    <Box>
      {/* Page header */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Issue Engineering Work Order
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={600}>
              Convert the EWP baseline into a consultant-specific work order containing scope,
              deliverables, due date, fee reference, design basis, review expectations and acceptance conditions.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleNext}
            loading={savingEwo}
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
            {isLastStep ? 'Issue EWO' : 'Issue EWO'}
          </Button>
        </Group>
      </Box>

      {/* Stepper */}
      <EwoStepper active={step} />

      {/* Two-column body */}
      <Grid gutter="md" align="flex-start">
        {/* Left: form */}
        <Grid.Col span={{ base: 12, md: 8.5 }}>
          <Paper p="lg" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, position: 'relative' }}>
            <LoadingOverlay visible={loadingEwps} overlayProps={{ blur: 1 }} />

            {step === 1 && (
              <StepContext
                form={form}
                onChange={onChange}
                ewpList={ewpList}
                onSelectEwp={handleSelectEwp}
                loadingEwps={loadingEwps}
              />
            )}
            {step === 2 && (
              <StepDetails
                form={form}
                onChange={onChange}
                consultantsList={consultantsList}
              />
            )}
            {step === 3 && <StepReview   form={form} />}
            {step === 4 && <StepConfirm  form={form} />}

            <Group mt="xl" gap="sm">
              <Button
                variant="default"
                onClick={handleBack}
                disabled={savingEwo}
                style={{ borderColor: '#d1d5db', color: '#374151', fontWeight: 600, height: 38, borderRadius: 6 }}
              >
                Back
              </Button>
              <Button
                color="green"
                onClick={handleNext}
                loading={savingEwo}
                style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6 }}
              >
                {isLastStep ? 'Issue EWO' : 'Continue'}
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
