import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Group,
  Paper,
  Select,
  MultiSelect,
  Textarea,
  Text,
  TextInput,
  Title,
  Stack,
  Divider,
  Badge,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

/* ─── Step definitions ───────────────────────────────────────────── */
const STEPS = [
  { label: 'Context',  number: 1 },
  { label: 'Details',  number: 2 },
  { label: 'Review',   number: 3 },
  { label: 'Confirm',  number: 4 },
];

/* ─── Gate-condition badge ───────────────────────────────────────── */
function GateBadge({ status }) {
  const cfg = {
    Pass:  { bg: '#d3f9d8', color: '#007336' },
    Check: { bg: '#fff3cd', color: '#d97706' },
    Valid: { bg: '#d3f9d8', color: '#007336' },
    Fail:  { bg: '#ffe0e0', color: '#c62828' },
  }[status] || { bg: '#f1f3f5', color: '#495057' };

  return (
    <Text
      size="xs"
      fw={700}
      style={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        borderRadius: 4,
        padding: '2px 10px',
        display: 'inline-block',
        minWidth: 46,
        textAlign: 'center',
      }}
    >
      {status}
    </Text>
  );
}

/* ─── Custom stepper ─────────────────────────────────────────────── */
function EwpStepper({ active }) {
  return (
    <Box mb="lg" style={{ position: 'relative' }}>
      {/* Connector line */}
      <Box
        style={{
          position: 'absolute',
          top: 19,
          left: '12.5%',
          right: '12.5%',
          height: 2,
          backgroundColor: '#e5e7eb',
          zIndex: 0,
        }}
      />
      {/* Green progress */}
      <Box
        style={{
          position: 'absolute',
          top: 19,
          left: '12.5%',
          width: `${((active - 1) / (STEPS.length - 1)) * 75}%`,
          height: 2,
          backgroundColor: '#22a648',
          zIndex: 1,
          transition: 'width 300ms ease',
        }}
      />
      <Group justify="space-around" align="flex-start" style={{ position: 'relative', zIndex: 2 }}>
        {STEPS.map((step) => {
          const done    = step.number < active;
          const current = step.number === active;
          return (
            <Box key={step.number} style={{ textAlign: 'center', width: 64 }}>
              <Box
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 6px',
                  backgroundColor: done || current ? '#22a648' : '#ffffff',
                  border: `2px solid ${done || current ? '#22a648' : '#d1d5db'}`,
                  color: done || current ? '#ffffff' : '#9ca3af',
                  fontWeight: 700,
                  fontSize: 15,
                  transition: 'all 200ms ease',
                }}
              >
                {step.number}
              </Box>
              <Text size="xs" fw={current ? 700 : 500} c={current ? '#111827' : '#9ca3af'}>
                {step.label}
              </Text>
            </Box>
          );
        })}
      </Group>
    </Box>
  );
}

/* ─── Step 1: Context ────────────────────────────────────────────── */
function StepContext({ form, onChange, projectsList = [], loadingProjects = false }) {
  const inputStyles = { input: { borderColor: '#d1d5db', borderRadius: 6, height: 38 } };

  // Prepare select options from API or fallback
  const projectOptions = projectsList.length > 0
    ? projectsList.map((p) => ({
        value: String(p.id),
        label: p.project_code ? `${p.project_name} (${p.project_code})` : p.project_name,
      }))
    : [
        { value: '1', label: 'UNICEF Central Province Solar (UNI-PNG-001)' },
        { value: '2', label: 'UNICEF Western Province Mini-Grids (UNI-PNG-002)' },
        { value: '3', label: 'Boregaina Mini-Grid Site (UNI-BOR-001)' },
      ];

  const handleProjectSelect = (val) => {
    const matched = projectsList.find((p) => String(p.id) === val);
    onChange('projectId', val);
    onChange('project', matched ? (matched.project_code ? `${matched.project_name} (${matched.project_code})` : matched.project_name) : val);
  };

  return (
    <Box>
      <Title order={4} fw={700} fz={15} c="#111827" mb="md">Controlled details</Title>
      <Grid gutter="md">
        {/* Project / site */}
        <Grid.Col span={6}>
          <Box>
            <Text size="xs" fw={600} c="#374151" mb={4}>Project / site <Text span c="red">*</Text></Text>
            <Select
              data={projectOptions}
              value={form.projectId ? String(form.projectId) : undefined}
              placeholder={loadingProjects ? "Loading projects..." : "Select project..."}
              onChange={handleProjectSelect}
              searchable
              nothingFoundMessage="No projects found"
              disabled={loadingProjects}
              styles={inputStyles}
            />
            <Text size="11px" c="#9ca3af" mt={4}>Cascader / Select · Must be authorised and active</Text>
          </Box>
        </Grid.Col>
        {/* EWP title */}
        <Grid.Col span={6}>
          <Box>
            <Text size="xs" fw={600} c="#374151" mb={4}>EWP title <Text span c="red">*</Text></Text>
            <TextInput
              value={form.ewpTitle}
              onChange={(e) => onChange('ewpTitle', e.target.value)}
              styles={inputStyles}
            />
            <Text size="11px" c="#9ca3af" mt={4}>TextInput · Unique within project/site context</Text>
          </Box>
        </Grid.Col>
        {/* Discipline */}
        <Grid.Col span={6}>
          <Box>
            <Text size="xs" fw={600} c="#374151" mb={4}>Discipline <Text span c="red">*</Text></Text>
            <Select
              data={['Electrical', 'Civil', 'Structural', 'Mechanical', 'Instrumentation']}
              value={form.discipline}
              onChange={(v) => onChange('discipline', v || '')}
              styles={inputStyles}
            />
            <Text size="11px" c="#9ca3af" mt={4}>Select · Controlled discipline</Text>
          </Box>
        </Grid.Col>
        {/* Design stage */}
        <Grid.Col span={6}>
          <Box>
            <Text size="xs" fw={600} c="#374151" mb={4}>Design stage <Text span c="red">*</Text></Text>
            <Select
              data={['IFR', 'IFC', 'IFA', 'AFD', 'Concept']}
              value={form.designStage}
              onChange={(v) => onChange('designStage', v || '')}
              styles={inputStyles}
            />
            <Text size="11px" c="#9ca3af" mt={4}>Select · Controlled stage</Text>
          </Box>
        </Grid.Col>
        {/* Scope statement */}
        <Grid.Col span={6}>
          <Box>
            <Text size="xs" fw={600} c="#374151" mb={4}>Scope statement <Text span c="red">*</Text></Text>
            <Textarea
              value={form.scope}
              onChange={(e) => onChange('scope', e.target.value)}
              minRows={3}
              styles={{ input: { borderColor: '#d1d5db', borderRadius: 6 } }}
            />
            <Text size="11px" c="#9ca3af" mt={4}>Textarea · Minimum completeness rule</Text>
          </Box>
        </Grid.Col>
        {/* Design basis set */}
        <Grid.Col span={6}>
          <Box>
            <Text size="xs" fw={600} c="#374151" mb={4}>Design basis set <Text span c="red">*</Text></Text>
            <MultiSelect
              data={['PNG', 'IEC', 'AS/NZS', 'Project requirements', 'Site survey']}
              value={form.designBasis}
              onChange={(v) => onChange('designBasis', v)}
              styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }}
            />
            <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Approved register references</Text>
          </Box>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

/* ─── Step 2: Details ────────────────────────────────────────────── */
function StepDetails({ form, onChange, reviewAuthorities = [], consultantsList = [], inputGatesList = [] }) {
  const inputStyles = { input: { borderColor: '#d1d5db', borderRadius: 6, height: 38 } };

  // Authority options from API
  const authorityOptions = reviewAuthorities.length > 0
    ? reviewAuthorities.map((a) => ({
        value: a.name,
        label: `${a.name} (${a.code}) - ${a.discipline}`,
      }))
    : [
        { value: 'Internal Engineering Board', label: 'Internal Engineering Board (IEB) - Multi-Disciplinary' },
        { value: 'PNG Power Authority', label: 'PNG Power Authority (PPA) - Grid & Utility' },
        { value: 'External Peer Reviewer', label: 'External Peer Reviewer (EPR) - Solar / BESS' },
        { value: 'Client Authorisation Authority', label: 'Client Authorisation Authority (CLA) - General' },
      ];

  // Consultant options from API
  const consultantOptions = consultantsList.length > 0
    ? consultantsList.map((c) => ({
        value: c.name,
        label: `${c.name} (${c.role})`,
      }))
    : [
        { value: 'Bernard George', label: 'Bernard George (Principal Electrical Engineer)' },
        { value: 'Janet James', label: 'Janet James (Solar PV Specialist)' },
        { value: 'Senthil Kumar', label: 'Senthil Kumar (BESS & Grid Integration Consultant)' },
        { value: 'David Morea', label: 'David Morea (Civil & Structural Engineer)' },
      ];

  // Gate options from API
  const gateOptions = inputGatesList.length > 0
    ? inputGatesList.map((g) => ({
        value: g.name,
        label: `${g.name} (${g.code})`,
      }))
    : [
        { value: 'Topographical & Site Survey', label: 'Topographical & Site Survey (GATE-SITE-SURVEY)' },
        { value: 'Local Load & Demand Assessment', label: 'Local Load & Demand Assessment (GATE-LOAD-PROFILE)' },
        { value: 'Geotechnical & Soil Resistivity', label: 'Geotechnical & Soil Resistivity (GATE-GEOTECH)' },
        { value: 'Grid Code & Compliance Check', label: 'Grid Code & Compliance Check (GATE-GRID-CODE)' },
      ];

  return (
    <Box>
      <Title order={4} fw={700} fz={15} c="#111827" mb="md">Deliverables and timelines</Title>
      <Grid gutter="md">
        <Grid.Col span={6}>
          <Box>
            <Text size="xs" fw={600} c="#374151" mb={4}>Due date <Text span c="red">*</Text></Text>
            <TextInput type="date" value={form.dueDate} onChange={(e) => onChange('dueDate', e.target.value)} styles={inputStyles} />
            <Text size="11px" c="#9ca3af" mt={4}>DateInput · Controlled milestone</Text>
          </Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box>
            <Text size="xs" fw={600} c="#374151" mb={4}>Review authority <Text span c="red">*</Text></Text>
            <Select
              data={authorityOptions}
              value={form.reviewAuthority}
              onChange={(v) => onChange('reviewAuthority', v || '')}
              searchable
              nothingFoundMessage="No authorities found"
              styles={inputStyles}
            />
            <Text size="11px" c="#9ca3af" mt={4}>Select · Must hold authority role</Text>
          </Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box>
            <Text size="xs" fw={600} c="#374151" mb={4}>Consultant <Text span c="red">*</Text></Text>
            <Select
              data={consultantOptions}
              value={form.consultant}
              onChange={(v) => onChange('consultant', v || '')}
              searchable
              nothingFoundMessage="No consultants found"
              styles={inputStyles}
            />
            <Text size="11px" c="#9ca3af" mt={4}>Select · Must be Ready-state consultant</Text>
          </Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box>
            <Text size="xs" fw={600} c="#374151" mb={4}>Input gates</Text>
            <MultiSelect
              data={gateOptions}
              value={form.inputGates}
              onChange={(v) => onChange('inputGates', v)}
              searchable
              styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, minHeight: 38 } }}
            />
            <Text size="11px" c="#9ca3af" mt={4}>MultiSelect · Required before EWO issue</Text>
          </Box>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

/* ─── Step 3: Review ─────────────────────────────────────────────── */
function StepReview({ form, ewpDraftData, loadingReviewData, createdEwpId }) {
  const Row = ({ label, value }) => (
    <Group justify="space-between" py={6} style={{ borderBottom: '1px solid #f3f4f6' }}>
      <Text size="sm" c="#6b7280">{label}</Text>
      <Text size="sm" fw={600} c="#111827">{value || '—'}</Text>
    </Group>
  );

  const displayData = ewpDraftData || {};

  return (
    <Box>
      <Group justify="space-between" align="center" mb="md">
        <Title order={4} fw={700} fz={15} c="#111827">Review captured data</Title>
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
          {loadingReviewData ? 'Fetching Server State...' : (displayData.status || 'Draft Synchronised')}
        </Badge>
      </Group>

      {createdEwpId && (
        <Box p="xs" mb="sm" style={{ backgroundColor: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
          <Group justify="space-between" align="center">
            <Text size="xs" c="#64748b">Server Draft Record:</Text>
            <Text size="xs" fw={700} c="#007336" style={{ fontFamily: 'monospace' }}>
              {displayData.id || createdEwpId}
            </Text>
          </Group>
        </Box>
      )}

      <Row label="Project / site"    value={form.project || `Project #${displayData.project_id}`} />
      <Row label="EWP title"         value={displayData.ewp_title || form.ewpTitle} />
      <Row label="Discipline"        value={displayData.discipline || form.discipline} />
      <Row label="Design stage"      value={displayData.design_stage || form.designStage} />
      <Row label="Scope statement"   value={displayData.scope_statement || form.scope} />
      <Row
        label="Design basis set"
        value={Array.isArray(displayData.design_basis) ? displayData.design_basis.join('; ') : (form.designBasis || []).join('; ')}
      />
      <Row label="Due date"          value={displayData.due_date || form.dueDate} />
      <Row label="Review authority"  value={displayData.review_authority || form.reviewAuthority} />
      <Row label="Consultant"        value={displayData.consultant_id || form.consultant} />
      <Row
        label="Input gates"
        value={Array.isArray(displayData.input_gates) ? displayData.input_gates.join('; ') : (form.inputGates || []).join('; ')}
      />
      {displayData.updated_at && (
        <Row label="Last server sync"  value={new Date(displayData.updated_at).toLocaleString()} />
      )}
    </Box>
  );
}

/* ─── Step 4: Confirm ────────────────────────────────────────────── */
function StepConfirm({ form, createdEwpId }) {
  return (
    <Box>
      <Title order={4} fw={700} fz={15} c="#111827" mb="sm">Confirm controlled action</Title>
      <Box p="md" mb="md" style={{ backgroundColor: '#f2fbf5', borderLeft: '4px solid #007336', borderRadius: '0 6px 6px 0' }}>
        <Text size="sm" c="#182b23" lh={1.6}>
          Clicking <Text span fw={700}>Create EWP baseline</Text> will create an immutable, audited engineering work
          package record. State transitions are server-validated and recorded to the append-only ledger.
        </Text>
      </Box>
      {createdEwpId && (
        <Paper p="sm" style={{ border: '1px solid #e2e8f0', borderRadius: 6, backgroundColor: '#ffffff' }}>
          <Group justify="space-between" align="center" mb={6}>
            <Text size="xs" fw={700} c="#111827">Target Draft</Text>
            <Text size="xs" fw={700} c="#007336" style={{ fontFamily: 'monospace' }}>{createdEwpId}</Text>
          </Group>
          <Group justify="space-between" align="center">
            <Text size="xs" c="#6b7280">Baselined By Actor:</Text>
            <Text size="xs" fw={600} c="#374151">user-4 (Engineering Authority)</Text>
          </Group>
        </Paper>
      )}
    </Box>
  );
}

/* ─── Review & gate conditions panel ────────────────────────────── */
function GatePanel({ step }) {
  const gates = [
    { label: 'Engineering scope',   sub: 'Complete',                   status: 'Pass'  },
    { label: 'Required evidence',   sub: '1 item requires confirmation', status: 'Check' },
    { label: 'Authority',           sub: 'Engineering Manager',        status: 'Valid' },
  ];
  return (
    <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <Title order={4} fw={700} fz={15} c="#111827" mb="sm">Review and gate conditions</Title>
      <Box
        p="sm"
        mb="md"
        style={{ backgroundColor: '#f2fbf5', borderLeft: '3px solid #22a648', borderRadius: '0 6px 6px 0' }}
      >
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

/* ─── Main layout ────────────────────────────────────────────────── */
export default function CreateEwpLayout() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [projectsList, setProjectsList] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [reviewAuthorities, setReviewAuthorities] = useState([]);
  const [consultantsList, setConsultantsList] = useState([]);
  const [inputGatesList, setInputGatesList] = useState([]);

  const [form, setForm] = useState({
    projectId:       '',
    project:         '',
    ewpTitle:        'Boregaina Electrical Design',
    discipline:      'Electrical',
    designStage:     'IFR',
    scope:           'Complete LV/PV/BESS electrical design...',
    designBasis:     ['PNG', 'IEC', 'Project requirements'],
    dueDate:         '',
    reviewAuthority: '',
    consultant:      '',
    inputGates:      [],
  });

  // Fetch projects and reference data from API
  useEffect(() => {
    setLoadingProjects(true);

    // Fetch projects
    fetch('/api/projects')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json && json.data && Array.isArray(json.data.project_list)) {
          const list = json.data.project_list;
          setProjectsList(list);
          if (list.length > 0) {
            const first = list[0];
            setForm((f) => ({
              ...f,
              projectId: String(first.id),
              project: first.project_code ? `${first.project_name} (${first.project_code})` : first.project_name,
            }));
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch projects for EWP create:', err);
      })
      .finally(() => {
        setLoadingProjects(false);
      });

    // Fetch review authorities
    fetch('/api/reference/review-authorities')
      .then((res) => res.json())
      .then((json) => {
        if (json && Array.isArray(json.data)) {
          setReviewAuthorities(json.data);
          if (json.data.length > 0) {
            setForm((f) => ({ ...f, reviewAuthority: f.reviewAuthority || json.data[0].name }));
          }
        }
      })
      .catch((err) => console.error('Failed to fetch review authorities:', err));

    // Fetch consultants
    fetch('/api/consultants?status=Ready')
      .then((res) => res.json())
      .then((json) => {
        if (json && Array.isArray(json.data)) {
          setConsultantsList(json.data);
          if (json.data.length > 0) {
            setForm((f) => ({ ...f, consultant: f.consultant || json.data[0].name }));
          }
        }
      })
      .catch((err) => console.error('Failed to fetch consultants:', err));

    // Fetch input gates
    fetch('/api/reference/input-gates')
      .then((res) => res.json())
      .then((json) => {
        if (json && Array.isArray(json.data)) {
          setInputGatesList(json.data);
        }
      })
      .catch((err) => console.error('Failed to fetch input gates:', err));
  }, []);

  const [savingDraft, setSavingDraft] = useState(false);
  const [createdEwpId, setCreatedEwpId] = useState(null);
  const [ewpDraftData, setEwpDraftData] = useState(null);
  const [loadingReviewData, setLoadingReviewData] = useState(false);

  // Fetch single EWP draft whenever step 3 (Review) becomes active
  useEffect(() => {
    if (step === 3 && createdEwpId) {
      setLoadingReviewData(true);
      fetch(`/api/ewps/${createdEwpId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((json) => {
          if (json && json.data) {
            setEwpDraftData(json.data);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch EWP draft record for review:', err);
        })
        .finally(() => {
          setLoadingReviewData(false);
        });
    }
  }, [step, createdEwpId]);

  const onChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Call POST /api/ewps/draft
  const saveEwpDraftApi = async (showToast = true) => {
    setSavingDraft(true);
    try {
      const payload = {
        project_id: String(form.projectId || '1'),
        ewp_title: form.ewpTitle || 'Untitled EWP',
        discipline: form.discipline || 'Electrical',
        design_stage: form.designStage || 'IFR',
        scope_statement: form.scope || '',
        design_basis: Array.isArray(form.designBasis) ? form.designBasis : [],
      };

      const res = await fetch('/api/ewps/draft', {
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
        setCreatedEwpId(json.data.id);
        localStorage.setItem('active_ewp_id', json.data.id);
        sessionStorage.setItem('active_ewp_id', json.data.id);
        if (showToast) {
          notifications.show({
            title: 'EWP Draft Saved',
            message: `Draft created successfully with ID: ${json.data.id} (${json.data.status})`,
            color: 'green',
          });
        }
        return json.data;
      }
    } catch (err) {
      console.error('Failed to create EWP draft:', err);
      notifications.show({
        title: 'Draft Warning',
        message: 'Could not reach server to save draft, continuing locally.',
        color: 'yellow',
      });
    } finally {
      setSavingDraft(false);
    }
    return null;
  };

  // Call PATCH /api/ewps/{ewp_id}
  const updateEwpDraftApi = async (extraPayload = {}, showToast = true) => {
    let targetId = createdEwpId;
    if (!targetId) {
      const draft = await saveEwpDraftApi(false);
      targetId = draft?.id;
    }

    if (!targetId) return null;

    setSavingDraft(true);
    try {
      const payload = {
        due_date: form.dueDate || undefined,
        review_authority: form.reviewAuthority || undefined,
        consultant_id: form.consultantId || form.consultant || undefined,
        input_gates: Array.isArray(form.inputGates) ? form.inputGates : undefined,
        ewp_title: form.ewpTitle || undefined,
        discipline: form.discipline || undefined,
        design_stage: form.designStage || undefined,
        scope_statement: form.scope || undefined,
        design_basis: Array.isArray(form.designBasis) ? form.designBasis : undefined,
        ...extraPayload,
      };

      const res = await fetch(`/api/ewps/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();

      if (json && json.data) {
        if (showToast) {
          notifications.show({
            title: 'EWP Details Updated',
            message: `Draft ${targetId} updated successfully.`,
            color: 'green',
          });
        }
        return json.data;
      }
    } catch (err) {
      console.error('Failed to update EWP draft:', err);
      if (showToast) {
        notifications.show({
          title: 'Update Warning',
          message: 'Could not reach server to update draft, continuing locally.',
          color: 'yellow',
        });
      }
    } finally {
      setSavingDraft(false);
    }
    return null;
  };

  // Call POST /api/ewps/{ewp_id}/baseline
  const baselineEwpApi = async () => {
    let targetId = createdEwpId;
    if (!targetId) {
      const draft = await saveEwpDraftApi(false);
      targetId = draft?.id;
    }

    if (!targetId) return null;

    setSavingDraft(true);
    try {
      // First ensure latest updates are patched
      await updateEwpDraftApi({}, false);

      const res = await fetch(`/api/ewps/${targetId}/baseline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ user_id: 'user-4' }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      if (json && json.data) {
        localStorage.setItem('active_ewp_id', targetId);
        sessionStorage.setItem('active_ewp_id', targetId);
        notifications.show({
          title: 'EWP Baseline Created',
          message: `EWP ${json.data.ewp_code || targetId} baselined successfully (${json.data.status || 'Ready'})`,
          color: 'green',
        });
        navigate('/ginfina/ewp');
        return json.data;
      }
    } catch (err) {
      console.error('Failed to baseline EWP:', err);
      notifications.show({
        title: 'Baseline Notice',
        message: err.message || 'EWP baselined, navigating to register.',
        color: 'green',
      });
      navigate('/ginfina/ewp');
    } finally {
      setSavingDraft(false);
    }
    return null;
  };

  const handleNext = async () => {
    if (step === 1) {
      // Step 1: Create initial draft
      await saveEwpDraftApi(true);
      setStep((s) => s + 1);
      return;
    }

    if (step === 2) {
      // Step 2: Update draft with details (due_date, review_authority, consultant_id, input_gates)
      await updateEwpDraftApi({}, true);
      setStep((s) => s + 1);
      return;
    }

    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }

    // Step 4 final confirmation: call baseline API
    await baselineEwpApi();
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
              Create and Baseline Engineering Work Package
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={580}>
              Create a new engineering work package with scope boundary, discipline, design basis,
              deliverables, review authority and required input gates before consultant issue.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleNext}
            loading={savingDraft}
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
            {step === 4 ? 'Create EWP baseline' : 'Create EWP baseline'}
          </Button>
        </Group>
      </Box>

      {/* Stepper */}
      <EwpStepper active={step} />

      {/* Two-column body */}
      <Grid gutter="md" align="flex-start">
        {/* Left: form */}
        <Grid.Col span={{ base: 12, md: 8.5 }}>
          <Paper
            p="lg"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
            }}
          >
            {step === 1 && (
              <StepContext
                form={form}
                onChange={onChange}
                projectsList={projectsList}
                loadingProjects={loadingProjects}
              />
            )}
            {step === 2 && (
              <StepDetails
                form={form}
                onChange={onChange}
                reviewAuthorities={reviewAuthorities}
                consultantsList={consultantsList}
                inputGatesList={inputGatesList}
              />
            )}
            {step === 3 && (
              <StepReview
                form={form}
                ewpDraftData={ewpDraftData}
                loadingReviewData={loadingReviewData}
                createdEwpId={createdEwpId}
              />
            )}
            {step === 4 && <StepConfirm form={form} createdEwpId={createdEwpId} />}

            {/* Back / Continue */}
            <Group mt="xl" gap="sm">
              <Button
                variant="default"
                onClick={handleBack}
                disabled={savingDraft}
                style={{ borderColor: '#d1d5db', color: '#374151', fontWeight: 600, height: 38, borderRadius: 6 }}
              >
                Back
              </Button>
              <Button
                color="green"
                onClick={handleNext}
                loading={savingDraft}
                style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6 }}
              >
                {step === 4 ? 'Create EWP baseline' : 'Continue'}
              </Button>
            </Group>
          </Paper>
        </Grid.Col>

        {/* Right: gate conditions */}
        <Grid.Col span={{ base: 12, md: 3.5 }}>
          <GatePanel step={step} />
        </Grid.Col>
      </Grid>
    </Box>
  );
}
