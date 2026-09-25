import { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Checkbox, Group, Loader,
  Paper, Select, Stack, Table, Text, Textarea,
  TextInput, Title, Stepper, SimpleGrid, Progress,
} from '@mantine/core';
import {
  IconCheck, IconArrowRight, IconArrowLeft,
  IconFolderOpen, IconTag, IconTarget,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { autoCode } from '../utils/autoCode';
import SIACaseReport from '../components/common/SIACaseReport';
import styles from './SIAStartCaseControlLayout.module.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

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
    case_code: autoCode('SIA'), assessment_purpose: '', assessment_stage: '', opportunity_id: '',
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
    setCaseForm({ case_code: autoCode('SIA'), assessment_purpose: '', assessment_stage: '', opportunity_id: '' });
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
    <Box className={styles.root} p={{ base: 0, sm: 'xs', lg: 'lg' }}>
      {/* Header */}
      <Box mb="lg">
        <Group align="center" gap="sm" mb={4}>
          <Badge color="green" variant="light" size="lg" radius="sm">SIA</Badge>
        </Group>
        <Title order={2} fw={700} c="#111827">Start and Case Control</Title>
        <Text size="sm" c="#6b7280" mt={4}>
          Select a project, create an SIA case, and link assessment packs.
        </Text>
      </Box>

      {/* Stepper */}
      <Paper className={styles.compactStepper} withBorder radius="md" p="md" mb="lg" aria-label="Case setup progress">
        <Group justify="space-between" mb="sm"><Text size="sm" fw={700}>{['Select Project', 'Create Case', 'Assessment Packs', 'Report'][active]}</Text><Text size="xs" c="dimmed">Step {active + 1} of 4</Text></Group>
        <Progress value={(active + 1) * 25} color="green" size="sm" aria-label={`Step ${active + 1} of 4`} />
      </Paper>
      <Stepper className={styles.desktopStepper} active={active} color="green" mb="xl">
        <Stepper.Step label="Select Project" description="Choose a project" />
        <Stepper.Step label="Create Case" description="SIA case details" />
        <Stepper.Step label="Assessment Packs" description="Select applicable packs" />
        <Stepper.Step label="Report" description="Review & download" completedIcon={<IconCheck size={16} />} />
      </Stepper>

      {/* ══ STEP 0 — Select Project ══════════════════════════ */}
      {active === 0 && (
        <Paper p={{ base: 'md', sm: 'lg' }} style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Title order={4} fw={600} c="#111827" mb="md">Select Project</Title>

          <TextInput
            aria-label="Search projects"
            placeholder="Search by name or code…"
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            mb="md"
            styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, height: 38 } }}
          />

          <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 6, position: 'relative', minHeight: 200 }}>
            <LoadingRow visible={projectsLoading} />
            {!projectsLoading && <Stack className={styles.mobileCards} gap="sm" p="sm">
              {filteredProjects.map(project => <button type="button" key={project.id} className={styles.choiceCard}
                aria-pressed={selectedProject?.id === project.id} onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}>
                <Group justify="space-between" gap="xs" mb="xs"><Text size="xs" fw={700} c="green">{project.project_code}</Text>{statusBadge(project.project_status)}</Group>
                <Text size="sm" fw={600}>{project.project_name}</Text><Text size="xs" c="dimmed" mt="xs">Gsolve ID: {project.gsolve_project_id || 'Not provided'}</Text>
                {selectedProject?.id === project.id && <Text size="xs" c="green" fw={700} mt="xs">Selected</Text>}
              </button>)}
              {!filteredProjects.length && <Text size="sm" c="dimmed" p="md">No projects found.</Text>}
            </Stack>}
            {!projectsLoading && (
              <Box className={`${styles.desktopTable} ${styles.tableViewport}`}><Table miw={560} verticalSpacing="sm" horizontalSpacing="md">
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
              </Table></Box>
            )}
          </Paper>

          <Group className={styles.actions} justify="space-between" align="center" mt="md">
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
        <Paper p={{ base: 'md', sm: 'lg' }} style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>

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
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>Case Code <Text span c="red">*</Text></Text>
                <TextInput aria-label="Case Code" placeholder="e.g. SIA-2026-001"
                  value={caseForm.case_code} onChange={(e) => updateCase('case_code', e.target.value)}
                  styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, height: 38 } }} />
              </Box>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>Assessment Stage</Text>
                <Select aria-label="Assessment Stage" placeholder="Select stage" data={ASSESSMENT_STAGES}
                  value={caseForm.assessment_stage} onChange={(val) => updateCase('assessment_stage', val || '')}
                  clearable styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, height: 38 } }} />
              </Box>
            </SimpleGrid>

            <Box>
              <Text size="xs" fw={600} c="#374151" mb={4}>CRM Opportunity</Text>
              <Select
                aria-label="CRM Opportunity"
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
              <Textarea aria-label="Assessment Purpose" placeholder="Describe the purpose of this assessment…"
                value={caseForm.assessment_purpose} onChange={(e) => updateCase('assessment_purpose', e.target.value)}
                autosize minRows={3} styles={{ input: { borderColor: '#d1d5db', borderRadius: 6 } }} />
            </Box>
          </Stack>

          <Group className={styles.actions} justify="space-between" mt="lg">
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
        <Paper p={{ base: 'md', sm: 'lg' }} style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>

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
            <>
            <Stack className={styles.mobileCards} gap="sm">
              {packs.map(pack => <Paper withBorder radius="md" p="md" key={pack.id} style={{ background: selectedPacks.includes(pack.id) ? '#f0fdf4' : 'white', borderColor: selectedPacks.includes(pack.id) ? '#007336' : undefined }}>
                <Checkbox color="green" size="md" checked={selectedPacks.includes(pack.id)} onChange={() => togglePack(pack.id)}
                  classNames={{ label: styles.packLabel }} label={<Box><Text size="xs" fw={700} c="green">{pack.pack_code}</Text><Text size="sm" fw={600}>{pack.pack_name}</Text>
                    <Text size="xs" c="dimmed" mt={6}>{pack.pack_type || 'Type not provided'} ? {pack.is_active ? 'Active' : 'Inactive'}</Text></Box>} />
              </Paper>)}
              {!packs.length && <Text size="sm" c="dimmed">No assessment packs found.</Text>}
            </Stack>
            <Box className={`${styles.desktopTable} ${styles.tableViewport}`}>
            <Table miw={560} verticalSpacing="sm" horizontalSpacing="md"
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
                        <Checkbox aria-label={`Select ${pack.pack_name}`} checked={checked} onChange={() => togglePack(pack.id)}
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
            </Table></Box></>
          )}

          <Group className={styles.actions} justify="space-between" mt="lg">
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
      {active === 3 && createdCase && selectedProject && (
        <Paper p={{ base: 'sm', sm: 'lg', lg: 'xl' }} style={{ border: '1px solid #bbf7d0', borderRadius: 8, backgroundColor: '#f0fdf4', textAlign: 'center' }}>
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

            <SIACaseReport project={selectedProject} siaCase={createdCase} links={linkedPacks} packs={packs} />

            <Group className={styles.actions} gap="sm" mt="sm">
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
