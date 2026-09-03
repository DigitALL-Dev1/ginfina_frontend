import { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Checkbox, Group, Loader,
  Paper, Select, Stack, Table, Text, Textarea,
  TextInput, Title, Stepper,
} from '@mantine/core';
import {
  IconCheck, IconArrowRight, IconArrowLeft,
  IconFolderOpen, IconTag, IconTarget,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

const API = 'http://127.0.0.1:8001/api';

const ASSESSMENT_STAGES = [
  'Initial Review',
  'Field Survey',
  'Engineering Assessment',
  'Final Review',
  'Closed',
];

const STATUS_COLORS = {
  'in progress': { bg: '#e7f5ff', color: '#1971c2' },
  'planning': { bg: '#fff4e6', color: '#d9480f' },
  'on hold': { bg: '#fff9db', color: '#f08c00' },
  'completed': { bg: '#eaf5ef', color: '#007336' },
};

function statusBadge(status) {
  const key = (status || '').toLowerCase();
  const s = STATUS_COLORS[key] || { bg: '#f1f3f5', color: '#495057' };
  return (
    <Badge size="sm" radius="xl"
      style={{ backgroundColor: s.bg, color: s.color, textTransform: 'none', fontWeight: 600, fontSize: 11, padding: '2px 10px', border: 'none' }}>
      {status || '—'}
    </Badge>
  );
}

export default function SIAStartCaseControlLayout() {
  const navigate = useNavigate();

  // ── Stepper: 0=Select Project, 1=Create Case, 2=Assessment Packs, 3=Done
  const [active, setActive] = useState(0);

  // ── Step 0: Projects ─────────────────────────────────────
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectSearch, setProjectSearch] = useState('');

  useEffect(() => {
    fetch(`${API}/projects`)
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => notifications.show({ title: 'Error', message: 'Failed to load projects', color: 'red' }))
      .finally(() => setProjectsLoading(false));
  }, []);

  const filteredProjects = projects.filter((p) => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.project_name || '').toLowerCase().includes(q) ||
      (p.project_code || '').toLowerCase().includes(q)
    );
  });

  // ── Step 1: SIA Case form ────────────────────────────────
  const [caseForm, setCaseForm] = useState({
    case_code: '', assessment_purpose: '', assessment_stage: '', opportunity_id: '',
  });
  const [caseSubmitting, setCaseSubmitting] = useState(false);
  const [createdCase, setCreatedCase] = useState(null);

  // ── CRM opportunities ────────────────────────────────────
  const [crmRecords, setCrmRecords] = useState([]);
  const [crmLoading, setCrmLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/crm`)
      .then((r) => r.json())
      .then((data) => setCrmRecords(Array.isArray(data) ? data : []))
      .catch(() => notifications.show({ title: 'Error', message: 'Failed to load CRM records', color: 'red' }))
      .finally(() => setCrmLoading(false));
  }, []);

  // ── Step 2: Assessment packs ─────────────────────────────
  const [packs, setPacks] = useState([]);
  const [packsLoading, setPacksLoading] = useState(false);
  const [selectedPacks, setSelectedPacks] = useState([]);
  const [linkingPacks, setLinkingPacks] = useState(false);
  const [linkedPacks, setLinkedPacks] = useState([]);

  useEffect(() => {
    if (active !== 2) return;
    setPacksLoading(true);
    fetch(`${API}/sia/assessment-packs`)
      .then((r) => r.json())
      .then((data) => setPacks(Array.isArray(data) ? data : []))
      .catch(() => notifications.show({ title: 'Error', message: 'Failed to load assessment packs', color: 'red' }))
      .finally(() => setPacksLoading(false));
  }, [active]);

  // ── Helpers ──────────────────────────────────────────────
  const updateCase = (field, value) =>
    setCaseForm((prev) => ({ ...prev, [field]: value }));

  const togglePack = (id) =>
    setSelectedPacks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const resetAll = () => {
    setActive(0);
    setSelectedProject(null);
    setProjectSearch('');
    setCreatedCase(null);
    setSelectedPacks([]);
    setLinkedPacks([]);
    setCaseForm({ case_code: '', assessment_purpose: '', assessment_stage: '', opportunity_id: '' });
    // Clear stored case context
    localStorage.removeItem('sia_case_id');
    localStorage.removeItem('sia_project_id');
  };

  // ── Step 1 submit ────────────────────────────────────────
  const handleCreateCase = async () => {
    if (!caseForm.case_code.trim()) {
      notifications.show({ title: 'Validation', message: 'Case code is required.', color: 'orange' });
      return;
    }
    setCaseSubmitting(true);
    try {
      const res = await fetch(`${API}/sia/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          owner_user_id: localStorage.getItem('user_id') || null,
          case_code: caseForm.case_code,
          assessment_purpose: caseForm.assessment_purpose || null,
          assessment_stage: caseForm.assessment_stage || null,
          crm_reference_id: 'CRM-DUMMY-001',
          opportunity_id: caseForm.opportunity_id || null,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || `HTTP ${res.status}`); }
      const data = await res.json();
      setCreatedCase(data);
      // Store active case and site context for use across all SIA modules
      localStorage.setItem('sia_case_id', data.id);
      localStorage.setItem('sia_project_id', selectedProject.id);
      notifications.show({ title: 'SIA Case created', message: `Case ${data.case_code} saved.`, color: 'green' });
      setActive(2);
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setCaseSubmitting(false);
    }
  };

  // ── Step 2 submit ────────────────────────────────────────
  const handleLinkPacks = async () => {
    if (selectedPacks.length === 0) {
      notifications.show({ title: 'None selected', message: 'Select at least one pack.', color: 'orange' });
      return;
    }
    setLinkingPacks(true);
    const results = [];
    try {
      for (const packId of selectedPacks) {
        const res = await fetch(`${API}/sia/case-assessment-packs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sia_case_id: createdCase.id,
            assessment_pack_id: packId,
            is_applicable: true,
            selected_by: localStorage.getItem('user_id') || null,
          }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.detail || `HTTP ${res.status}`); }
        results.push(await res.json());
      }
      setLinkedPacks(results);
      notifications.show({ title: 'Packs linked', message: `${results.length} pack(s) linked.`, color: 'green' });
      setActive(3);
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setLinkingPacks(false);
    }
  };

  // ────────────────────────────────────────────────────────
  return (
    <Box p="lg">
      {/* Header */}
      <Box mb="lg">
        <Group align="center" gap="sm" mb={4}>
          <Badge color="green" variant="light" size="lg" radius="sm">SIA</Badge>
          <Text size="xs" c="dimmed" fw={500}>Module 1</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">Start and Case Control</Title>
        <Text size="sm" c="#6b7280" mt={4}>
          Select a project, create an SIA case, and link assessment packs.
        </Text>
      </Box>

      {/* Stepper */}
      <Stepper active={active} color="green" mb="xl">
        <Stepper.Step label="Select Project" description="Choose a project" />
        <Stepper.Step label="Create Case" description="SIA case details" />
        <Stepper.Step label="Assessment Packs" description="Select applicable packs" />
        <Stepper.Step label="Done" description="Case ready" completedIcon={<IconCheck size={16} />} />
      </Stepper>

      {/* ══ STEP 0 — Select Project ══════════════════════════ */}
      {active === 0 && (
        <Paper p="lg" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Title order={4} fw={600} c="#111827" mb="md">Select Project</Title>

          <TextInput
            placeholder="Search by name or code…"
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            mb="md"
            styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, height: 38 } }}
          />

          <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 6, position: 'relative', minHeight: 200 }}>
            <LoadingRow visible={projectsLoading} />
            {!projectsLoading && (
              <Table verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
                  <Table.Tr>
                    <Table.Th style={thStyle}>Code</Table.Th>
                    <Table.Th style={thStyle}>Project Name</Table.Th>
                    <Table.Th style={thStyle}>Status</Table.Th>
                    <Table.Th style={thStyle}>Gsolve ID</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredProjects.map((p) => {
                    const isSel = selectedProject?.id === p.id;
                    return (
                      <Table.Tr key={p.id} onClick={() => setSelectedProject(isSel ? null : p)}
                        style={{
                          cursor: 'pointer', backgroundColor: isSel ? '#f0fdf4' : 'transparent',
                          outline: isSel ? '2px solid #007336' : 'none', outlineOffset: '-2px', transition: 'background 120ms'
                        }}
                        onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <Table.Td><Text size="sm" fw={600} c="#007336">{p.project_code}</Text></Table.Td>
                        <Table.Td><Text size="sm" fw={isSel ? 700 : 500} c="#111827">{p.project_name}</Text></Table.Td>
                        <Table.Td>{statusBadge(p.project_status)}</Table.Td>
                        <Table.Td><Text size="sm" c="#6b7280">{p.gsolve_project_id}</Text></Table.Td>
                      </Table.Tr>
                    );
                  })}
                  {filteredProjects.length === 0 && (
                    <Table.Tr><Table.Td colSpan={4} style={{ textAlign: 'center', padding: '30px 0' }}>
                      <Text size="sm" c="dimmed">No projects found.</Text>
                    </Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            )}
          </Paper>

          <Group justify="space-between" align="center" mt="md">
            <Text size="xs" c="dimmed">
              {selectedProject
                ? <><Text span fw={600} c="#007336">{selectedProject.project_name}</Text> selected</>
                : 'Click a row to select a project'}
            </Text>
            <Button color="green" rightSection={<IconArrowRight size={15} />}
              disabled={!selectedProject} onClick={() => setActive(1)}
              style={{ backgroundColor: selectedProject ? '#007336' : undefined }}>
              Continue
            </Button>
          </Group>
        </Paper>
      )}

      {/* ══ STEP 1 — Create SIA Case ════════════════════════ */}
      {active === 1 && (
        <Paper p="lg" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>

          {/* Selected project strip */}
          <Paper p="sm" mb="lg" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
            <Group gap="xl" wrap="wrap">
              <Group gap="xs"><IconFolderOpen size={14} color="#007336" />
                <Text size="sm" fw={700} c="#111827">{selectedProject?.project_name}</Text>
              </Group>
              <Group gap="xs"><IconTag size={14} color="#6b7280" />
                <Text size="sm" c="#6b7280">Code: <Text span fw={600} c="#374151">{selectedProject?.project_code}</Text></Text>
              </Group>
              <Group gap="xs"><IconTarget size={14} color="#6b7280" />
                <Text size="sm" c="#6b7280">Status: <Text span fw={600} c="#374151">{selectedProject?.project_status || '—'}</Text></Text>
              </Group>
            </Group>
          </Paper>

          <Title order={4} fw={600} c="#111827" mb="md">SIA Case Details</Title>

          <Stack gap="md">
            <Group grow>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>Case Code <Text span c="red">*</Text></Text>
                <TextInput placeholder="e.g. SIA-2026-001"
                  value={caseForm.case_code} onChange={(e) => updateCase('case_code', e.target.value)}
                  styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, height: 38 } }} />
              </Box>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>Assessment Stage</Text>
                <Select placeholder="Select stage" data={ASSESSMENT_STAGES}
                  value={caseForm.assessment_stage} onChange={(val) => updateCase('assessment_stage', val || '')}
                  clearable styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, height: 38 } }} />
              </Box>
            </Group>

            <Box>
              <Text size="xs" fw={600} c="#374151" mb={4}>CRM Opportunity</Text>
              <Select
                placeholder={crmLoading ? 'Loading…' : 'Select CRM opportunity'}
                disabled={crmLoading}
                data={crmRecords.map((c) => ({
                  value: c.opportunity_id,
                  label: `${c.opportunity_id} · ${c.reference_type} · ${c.source_system}`,
                }))}
                value={caseForm.opportunity_id}
                onChange={(val) => updateCase('opportunity_id', val || '')}
                clearable searchable
                styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, height: 38 } }}
              />
            </Box>

            <Box>
              <Text size="xs" fw={600} c="#374151" mb={4}>Assessment Purpose</Text>
              <Textarea placeholder="Describe the purpose of this assessment…"
                value={caseForm.assessment_purpose} onChange={(e) => updateCase('assessment_purpose', e.target.value)}
                autosize minRows={3} styles={{ input: { borderColor: '#d1d5db', borderRadius: 6 } }} />
            </Box>
          </Stack>

          <Group justify="space-between" mt="lg">
            <Button variant="default" leftSection={<IconArrowLeft size={15} />} onClick={() => setActive(0)}>Back</Button>
            <Button color="green"
              rightSection={caseSubmitting ? <Loader size={14} color="white" /> : <IconArrowRight size={15} />}
              loading={caseSubmitting} disabled={!caseForm.case_code.trim()}
              onClick={handleCreateCase} style={{ backgroundColor: '#007336' }}>
              Create Case & Continue
            </Button>
          </Group>
        </Paper>
      )}

      {/* ══ STEP 2 — Assessment Packs ═══════════════════════ */}
      {active === 2 && createdCase && (
        <Paper p="lg" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>

          {/* Case summary */}
          <Paper p="sm" mb="lg" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
            <Text size="xs" fw={700} c="#007336" mb={4}>Case Created</Text>
            <Group gap="xl" wrap="wrap">
              <Text size="xs" c="#374151">Code: <Text span fw={600}>{createdCase.case_code}</Text></Text>
              <Text size="xs" c="#374151">Stage: <Text span fw={600}>{createdCase.assessment_stage || '—'}</Text></Text>
              <Text size="xs" c="#374151">Opportunity: <Text span fw={600}>{createdCase.opportunity_id || '—'}</Text></Text>
            </Group>
          </Paper>

          <Title order={4} fw={600} c="#111827" mb="xs">Select Assessment Packs</Title>
          <Text size="sm" c="#6b7280" mb="md">Choose which packs apply to this SIA case.</Text>

          {packsLoading ? (
            <Group justify="center" py="xl"><Loader color="green" /></Group>
          ) : (
            <Table verticalSpacing="sm" horizontalSpacing="md"
              style={{ border: '1px solid #e5e7eb', borderRadius: 6 }}>
              <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
                <Table.Tr>
                  <Table.Th style={{ width: 48 }} />
                  <Table.Th style={thStyle}>Pack Code</Table.Th>
                  <Table.Th style={thStyle}>Pack Name</Table.Th>
                  <Table.Th style={thStyle}>Type</Table.Th>
                  <Table.Th style={thStyle}>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {packs.map((pack) => {
                  const checked = selectedPacks.includes(pack.id);
                  return (
                    <Table.Tr key={pack.id} onClick={() => togglePack(pack.id)}
                      style={{ cursor: 'pointer', backgroundColor: checked ? '#f0fdf4' : 'transparent', transition: 'background 120ms' }}
                      onMouseEnter={(e) => { if (!checked) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseLeave={(e) => { if (!checked) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <Table.Td>
                        <Checkbox checked={checked} onChange={() => togglePack(pack.id)}
                          color="green" onClick={(e) => e.stopPropagation()} />
                      </Table.Td>
                      <Table.Td><Text size="sm" fw={600} c="#007336">{pack.pack_code}</Text></Table.Td>
                      <Table.Td><Text size="sm" c="#111827">{pack.pack_name}</Text></Table.Td>
                      <Table.Td><Text size="sm" c="#6b7280">{pack.pack_type || '—'}</Text></Table.Td>
                      <Table.Td>
                        <Badge size="sm" radius="xl"
                          style={{
                            backgroundColor: pack.is_active ? '#eaf5ef' : '#f1f3f5',
                            color: pack.is_active ? '#007336' : '#6b7280', border: 'none', fontWeight: 600
                          }}>
                          {pack.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {packs.length === 0 && (
                  <Table.Tr><Table.Td colSpan={5} style={{ textAlign: 'center', padding: '30px 0' }}>
                    <Text size="sm" c="dimmed">No assessment packs found.</Text>
                  </Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}

          <Group justify="space-between" mt="lg">
            <Button variant="default" leftSection={<IconArrowLeft size={15} />} onClick={() => setActive(1)}>Back</Button>
            <Group gap="sm">
              <Text size="xs" c="dimmed">{selectedPacks.length} pack{selectedPacks.length !== 1 ? 's' : ''} selected</Text>
              <Button color="green"
                rightSection={linkingPacks ? <Loader size={14} color="white" /> : <IconArrowRight size={15} />}
                loading={linkingPacks} disabled={selectedPacks.length === 0}
                onClick={handleLinkPacks} style={{ backgroundColor: '#007336' }}>
                Link Packs & Finish
              </Button>
            </Group>
          </Group>
        </Paper>
      )}

      {/* ══ STEP 3 — Done ═══════════════════════════════════ */}
      {active === 3 && (
        <Paper p="xl" style={{ border: '1px solid #bbf7d0', borderRadius: 8, backgroundColor: '#f0fdf4', textAlign: 'center' }}>
          <Stack align="center" gap="md">
            <Box style={{
              width: 56, height: 56, borderRadius: '50%', backgroundColor: '#007336',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IconCheck size={28} color="white" />
            </Box>
            <Title order={3} fw={700} c="#111827">SIA Case Ready</Title>
            <Text size="sm" c="#6b7280" maw={480}>
              Case <Text span fw={700} c="#007336">{createdCase?.case_code}</Text> created and{' '}
              <Text span fw={700} c="#007336">{linkedPacks.length}</Text> pack{linkedPacks.length !== 1 ? 's' : ''} linked.
            </Text>

            <Paper p="md" style={{ border: '1px solid #d1d5db', borderRadius: 6, width: '100%', maxWidth: 520, textAlign: 'left' }}>
              <Text size="xs" fw={700} c="#374151" mb="xs" tt="uppercase" style={{ letterSpacing: '0.05em' }}>Summary</Text>
              <Stack gap={4}>
                <Group justify="space-between"><Text size="xs" c="#6b7280">Case ID</Text><Text size="xs" fw={600} style={{ fontFamily: 'monospace' }}>{createdCase?.id}</Text></Group>
                <Group justify="space-between"><Text size="xs" c="#6b7280">Case Code</Text><Text size="xs" fw={600}>{createdCase?.case_code}</Text></Group>
                <Group justify="space-between"><Text size="xs" c="#6b7280">Project</Text><Text size="xs" fw={600}>{selectedProject?.project_name}</Text></Group>
                <Group justify="space-between"><Text size="xs" c="#6b7280">Stage</Text><Text size="xs" fw={600}>{createdCase?.assessment_stage || '—'}</Text></Group>
                <Group justify="space-between"><Text size="xs" c="#6b7280">CRM Opportunity</Text><Text size="xs" fw={600}>{createdCase?.opportunity_id || '—'}</Text></Group>
                <Group justify="space-between"><Text size="xs" c="#6b7280">Packs linked</Text><Text size="xs" fw={600}>{linkedPacks.length}</Text></Group>
              </Stack>
            </Paper>

            <Group gap="sm" mt="sm">
              <Button variant="default" onClick={resetAll}>Create Another Case</Button>
              <Button color="green" style={{ backgroundColor: '#007336' }}
                onClick={() => navigate('/ginfina')}>Back to Home</Button>
            </Group>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

// ── small helpers ────────────────────────────────────────
const thStyle = { fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' };

function LoadingRow({ visible }) {
  if (!visible) return null;
  return <Group justify="center" py="xl"><Loader color="green" /></Group>;
}
