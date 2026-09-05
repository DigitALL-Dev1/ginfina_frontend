import { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader,
  Paper, Stack, Tabs, Table, Text, Textarea,
  TextInput, Title, NumberInput, Switch, Modal, Select,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconMapPin, IconBuilding, IconDoor,
  IconLocation, IconCalendar, IconUsers, IconLock,
  IconShield, IconClipboard, IconTool, IconArrowRight,
  IconFolder, IconSearch, IconChevronRight, IconCheck,
} from '@tabler/icons-react';
import { autoCode } from '../utils/autoCode';

const API = '/api';

// ── shared style ─────────────────────────────────────────
const thS = {
  fontSize: 11, fontWeight: 700, color: '#374151',
  textTransform: 'uppercase', letterSpacing: '0.05em',
};

// ── breadcrumb step indicator ─────────────────────────────
const STEPS = [
  { key: 'case',    label: 'SIA Case' },
  { key: 'sites',   label: 'Sites' },
  { key: 'survey',  label: 'Survey' },
];

function Breadcrumb({ step, caseObj, site, onCase, onSites }) {
  const idx = STEPS.findIndex(s => s.key === step);
  return (
    <Group gap={0} wrap="nowrap" mb="lg" align="center">
      {STEPS.map((s, i) => {
        const done    = i < idx;
        const active  = i === idx;
        const canClick = done;
        return (
          <Group key={s.key} gap={0} align="center" wrap="nowrap">
            <Box
              onClick={() => { if (s.key === 'case' && canClick) onCase(); if (s.key === 'sites' && canClick && idx > 1) onSites(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 20,
                backgroundColor: active ? '#007336' : done ? '#f0fdf4' : '#f3f4f6',
                border: `1.5px solid ${active ? '#007336' : done ? '#86efac' : '#e5e7eb'}`,
                cursor: canClick ? 'pointer' : 'default',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {done && <IconCheck size={12} color="#007336" />}
              <Text size="xs" fw={active ? 700 : 500}
                style={{ color: active ? '#fff' : done ? '#007336' : '#9ca3af' }}>
                {s.key === 'case' && caseObj ? caseObj.case_code
                  : s.key === 'sites' && site ? site.site_name || site.site_code
                  : s.label}
              </Text>
            </Box>
            {i < STEPS.length - 1 && (
              <IconChevronRight size={14} color="#d1d5db" style={{ flexShrink: 0, margin: '0 4px' }} />
            )}
          </Group>
        );
      })}
    </Group>
  );
}

// ── helpers ───────────────────────────────────────────────
function EmptyRow({ cols, msg = 'No records found.' }) {
  return (
    <Table.Tr>
      <Table.Td colSpan={cols} style={{ textAlign: 'center', padding: '32px 0' }}>
        <Text size="sm" c="dimmed">{msg}</Text>
      </Table.Td>
    </Table.Tr>
  );
}

function useApi(url, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const reload = () => {
    if (!url) return;
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => { })
      .finally(() => setLoading(false));
  };
  useEffect(() => { reload(); }, deps); // eslint-disable-line
  return { data, loading, reload };
}

async function postApi(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || `HTTP ${res.status}`); }
  return res.json();
}

function DataTable({ loading, cols, rows, render }) {
  return (
    <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 8, position: 'relative', minHeight: 120 }}>
      {loading && <Group justify="center" py="xl"><Loader color="green" size="sm" /></Group>}
      {!loading && (
        <Table verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
            <Table.Tr>{cols.map(c => <Table.Th key={c} style={thS}>{c}</Table.Th>)}</Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length === 0 ? <EmptyRow cols={cols.length} /> : rows.map(render)}
          </Table.Tbody>
        </Table>
      )}
    </Paper>
  );
}

function TabHeader({ title, onAdd, addLabel, disabled }) {
  return (
    <Group justify="space-between" align="center" mb="sm">
      <Text size="sm" fw={700} c="#111827">{title}</Text>
      <Button size="xs" leftSection={<IconPlus size={13} />}
        onClick={onAdd} disabled={disabled}
        style={{ backgroundColor: disabled ? undefined : '#007336' }}
        color="green">
        {addLabel}
      </Button>
    </Group>
  );
}

function FormModal({ opened, onClose, title, saving, onSubmit, children }) {
  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700} size="sm">{title}</Text>} size="lg">
      <Stack gap="sm">
        {children}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="green" loading={saving} onClick={onSubmit}
            style={{ backgroundColor: '#007336' }}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function FormRow({ children }) { return <Group grow align="flex-start" gap="sm">{children}</Group>; }

function FI({ label, field, form, textarea, number, select }) {
  const val = form.values[field] ?? '';
  const onChange = (v) => form.setFieldValue(field, v);
  
  // Auto-detect Type and Role fields and convert to dropdowns
  const fieldLower = field.toLowerCase();
  const isTypeOrRoleField = fieldLower.includes('type') || fieldLower.includes('role');
  const isDateField = fieldLower.includes('date') || fieldLower.includes('_at');
  
  // Import field options for Type and Role fields
  const getTypeRoleOptions = (fieldName) => {
    const optionsMap = {
      site_type: ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Mixed Use', 'Institutional'],
      building_type: ['Single Family', 'Multi Family', 'Office', 'Retail', 'Warehouse', 'Educational', 'Healthcare', 'Religious'],
      area_type: ['Interior', 'Exterior', 'Rooftop', 'Ground Level', 'Basement', 'Parking'],
      poi_type: ['Electrical Panel', 'Junction Box', 'Meter Location', 'Equipment Room', 'Access Point', 'Utility Connection'],
      visit_type: ['Initial Survey', 'Follow-up', 'Technical Assessment', 'Final Inspection', 'Progress Review'],
      team_role: ['Team Lead', 'Site Engineer', 'Electrical Engineer', 'Structural Engineer', 'Survey Technician', 'Safety Officer', 'Documentation Specialist'],
      access_type: ['Public Road', 'Private Road', 'Footpath Only', 'Restricted Access', 'No Direct Access'],
      hazard_type: ['Electrical', 'Structural', 'Chemical', 'Biological', 'Environmental', 'Height', 'Confined Space', 'Traffic'],
      requirement_type: ['Safety', 'Regulatory', 'Technical', 'Environmental', 'Documentation', 'Equipment'],
      instrument_type: ['Multimeter', 'Thermal Camera', 'Distance Meter', 'GPS Device', 'Inclinometer', 'Soil Tester'],
    };
    return optionsMap[fieldName] || [];
  };
  
  const autoDetectedOptions = getTypeRoleOptions(field);
  const inputStyle = { input: { borderColor: '#d1d5db', borderRadius: 6, height: textarea ? undefined : 36 } };
  if (select) return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
      <Select data={select} value={val} onChange={v => onChange(v || '')} clearable styles={inputStyle} />
    </Box>
  );
  if (textarea) return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
      <Textarea value={val} onChange={e => onChange(e.target.value)} autosize minRows={2} styles={inputStyle} />
    </Box>
  );
  if (number) return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
      <NumberInput value={val === '' ? undefined : val} onChange={v => onChange(v)} styles={inputStyle} />
    </Box>
  );
  
  // Date fields with DD-MMM-YYYY format
  if (isDateField) {
    return (
      <Box>
        <Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
        <DateInput 
          value={val ? (typeof val === 'string' ? new Date(val) : val) : null}
          onChange={(date) => onChange(date ? date.toISOString() : '')}
          valueFormat="DD-MMM-YYYY"
          placeholder="DD-MMM-YYYY"
          clearable
          styles={inputStyle}
        />
      </Box>
    );
  }
  
  // Convert Type and Role fields to dropdowns automatically
  if (isTypeOrRoleField && autoDetectedOptions.length > 0) {
    return (
      <Box>
        <Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
        <Select data={autoDetectedOptions} value={val || null} onChange={v => onChange(v || '')} clearable searchable placeholder={`Select ${label}`} styles={inputStyle} />
      </Box>
    );
  }
  
  return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
      <TextInput value={val} onChange={e => onChange(e.target.value)} styles={inputStyle} />
    </Box>
  );
}

function StatusBadge({ v }) {
  const m = {
    active: '#007336', completed: '#007336', valid: '#007336',
    planned: '#1971c2', 'in progress': '#1971c2',
    pending: '#f08c00', cancelled: '#e03131', expired: '#e03131',
    critical: '#e03131', high: '#e03131', medium: '#f08c00',
    low: '#2f9e44', inactive: '#6b7280',
  };
  const key = (v || '').toLowerCase();
  const col = m[key] || '#6b7280';
  return (
    <Badge size="sm" radius="xl"
      style={{ backgroundColor: col + '18', color: col, border: 'none', fontWeight: 600 }}>
      {v || '—'}
    </Badge>
  );
}

function RiskBadge({ v }) { return <StatusBadge v={v} />; }

// ════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════
export default function SIASitesSurveyLayout() {

  // ── Step tracking: 'case' | 'sites' | 'survey' ───────
  const [step, setStep] = useState('case');

  // ── Step 1: SIA Case ──────────────────────────────────
  const [allCases, setAllCases] = useState([]);
  const [casesLoading, setCasesL] = useState(true);
  const [caseSearch, setCaseSearch] = useState('');
  const [pendingCase, setPendingCase] = useState(null);     // highlighted but not confirmed
  const [activeCase, setActiveCase] = useState(null);       // confirmed

  // Restore from localStorage on mount
  const [siaCaseId, setSiaCaseId] = useState(() => localStorage.getItem('sia_case_id') || '');

  useEffect(() => {
    fetch(`${API}/sia/cases`)
      .then(r => r.json())
      .then(d => setAllCases(Array.isArray(d) ? d : []))
      .catch(() => notifications.show({ title: 'Error', message: 'Failed to load SIA cases', color: 'red' }))
      .finally(() => setCasesL(false));
  }, []);

  // Auto-restore case object from localStorage id
  useEffect(() => {
    if (siaCaseId && allCases.length > 0 && !activeCase) {
      const found = allCases.find(c => c.id === siaCaseId);
      if (found) { setActiveCase(found); setPendingCase(found); setStep('sites'); }
    }
  }, [allCases, siaCaseId]); // eslint-disable-line

  const filteredCases = allCases.filter(c => {
    const q = caseSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.case_code || '').toLowerCase().includes(q) ||
      (c.assessment_purpose || '').toLowerCase().includes(q) ||
      (c.assessment_stage || '').toLowerCase().includes(q)
    );
  });

  const confirmCase = (c) => {
    setActiveCase(c);
    setPendingCase(c);
    setSiaCaseId(c.id);
    localStorage.setItem('sia_case_id', c.id);
    setStep('sites');
    setSelectedSite(null);
    setSelectedBuilding(null);
    setSelectedVisit(null);
    setSurveyTab('buildings');
  };

  // ── Step 2: Sites ─────────────────────────────────────
  const [siteSearch, setSiteSearch] = useState('');
  const { data: sites, loading: sitesL, reload: reloadSites } = useApi(
    siaCaseId ? `${API}/sia/cases/${siaCaseId}/sites` : null, [siaCaseId]
  );
  const filteredSites = sites.filter(s => {
    const q = siteSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.site_code || '').toLowerCase().includes(q) ||
      (s.site_name || '').toLowerCase().includes(q) ||
      (s.site_type || '').toLowerCase().includes(q)
    );
  });

  const [selectedSite, setSelectedSite] = useState(null);
  const confirmSite = (s) => {
    setSelectedSite(s);
    localStorage.setItem('sia_site_id', s.id);
    setSelectedBuilding(null);
    setSelectedVisit(null);
    setSurveyTab('buildings');
    setStep('survey');
  };

  // ── Step 3: Survey tabs ───────────────────────────────
  const [surveyTab, setSurveyTab] = useState('buildings');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);

  const { data: buildings, loading: buildingsL, reload: reloadBuildings } = useApi(
    selectedSite ? `${API}/sia/sites/${selectedSite.id}/buildings` : null, [selectedSite]
  );
  const { data: roomAreas, loading: roomsL, reload: reloadRooms } = useApi(
    selectedBuilding ? `${API}/sia/buildings/${selectedBuilding.id}/room-areas` : null, [selectedBuilding]
  );
  const { data: pois, loading: poisL, reload: reloadPois } = useApi(
    selectedSite ? `${API}/sia/sites/${selectedSite.id}/pois` : null, [selectedSite]
  );
  const { data: visits, loading: visitsL, reload: reloadVisits } = useApi(
    selectedSite ? `${API}/sia/sites/${selectedSite.id}/survey-visits` : null, [selectedSite]
  );
  const { data: team, loading: teamL, reload: reloadTeam } = useApi(
    selectedVisit ? `${API}/sia/survey-visits/${selectedVisit.id}/team` : null, [selectedVisit]
  );
  const { data: access, loading: accessL, reload: reloadAccess } = useApi(
    selectedSite ? `${API}/sia/sites/${selectedSite.id}/access` : null, [selectedSite]
  );
  const { data: safety, loading: safetyL, reload: reloadSafety } = useApi(
    selectedSite ? `${API}/sia/sites/${selectedSite.id}/safety` : null, [selectedSite]
  );
  const { data: reqs, loading: reqsL, reload: reloadReqs } = useApi(
    selectedVisit ? `${API}/sia/survey-visits/${selectedVisit.id}/requirements` : null, [selectedVisit]
  );
  const { data: instruments, loading: instL, reload: reloadInst } = useApi(
    selectedVisit ? `${API}/sia/survey-visits/${selectedVisit.id}/instruments` : null, [selectedVisit]
  );

  // ── Modal / form state ────────────────────────────────
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState({});
  const form = {
    values: formValues,
    setFieldValue: (k, v) => setFormValues(prev => ({ ...prev, [k]: v })),
    reset: () => setFormValues({}),
  };
  const openModal = (key) => { setFormValues({ ...(key === 'site' && { site_code: autoCode('SITE') }), ...(key === 'building' && { building_code: autoCode('BLDG') }), ...(key === 'room' && { area_code: autoCode('AREA') }), ...(key === 'poi' && { poi_code: autoCode('POI') }), ...(key === 'visit' && { visit_code: autoCode('VISIT') }), }); setModal(key); };
  const closeModal = () => { setModal(null); setFormValues({}); };

  const save = async (path, body, reload) => {
    setSaving(true);
    const cleaned = Object.fromEntries(
      Object.entries(body).map(([k, v]) => [k, v === '' ? null : v])
    );
    try {
      const result = await postApi(path, cleaned);
      if (path === '/sia/sites' && result?.id) localStorage.setItem('sia_site_id', result.id);
      if (path === '/sia/survey-visits' && result?.id) localStorage.setItem('sia_survey_visit_id', result.id);
      notifications.show({ title: 'Saved', message: 'Record created successfully.', color: 'green' });
      reload();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  // ════════════════════════════════════════════════════
  return (
    <Box p="lg">

      {/* ── Page header ── */}
      <Box mb="md">
        <Group gap="sm" mb={4}>
          <Badge color="green" variant="light" size="lg" radius="sm">SIA</Badge>
          <Text size="xs" c="dimmed" fw={500}>Module 1 · Section 2</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">Sites and Survey</Title>
        <Text size="sm" c="#6b7280" mt={2}>
          Select a case, choose a site, then manage buildings, rooms, visits and more.
        </Text>
      </Box>

      {/* ── Breadcrumb ── */}
      <Breadcrumb
        step={step}
        caseObj={activeCase}
        site={selectedSite}
        onCase={() => { setStep('case'); setSelectedSite(null); setSelectedBuilding(null); setSelectedVisit(null); }}
        onSites={() => { setStep('sites'); setSelectedSite(null); setSelectedBuilding(null); setSelectedVisit(null); }}
      />

      {/* ════════════════════════════════════════════════
          STEP 1 — Select SIA Case
      ════════════════════════════════════════════════ */}
      {step === 'case' && (
        <Paper p="lg" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Group gap="xs" mb="xs" align="center">
            <IconFolder size={17} color="#007336" />
            <Title order={4} fw={600} c="#111827">Select SIA Case</Title>
          </Group>
          <Text size="sm" c="#6b7280" mb="md">
            Choose the case you want to work on. All sites and survey data will be scoped to it.
          </Text>

          {/* Search */}
          <Group gap="xs" mb="md" align="center">
            <IconSearch size={14} color="#9ca3af" />
            <TextInput
              placeholder="Search by case code, purpose or stage…"
              value={caseSearch}
              onChange={e => setCaseSearch(e.target.value)}
              style={{ flex: 1 }}
              styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, height: 36 } }}
            />
          </Group>

          <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 6, minHeight: 140 }}>
            {casesLoading
              ? <Group justify="center" py="xl"><Loader color="green" size="sm" /></Group>
              : (
                <Table verticalSpacing="sm" horizontalSpacing="md">
                  <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
                    <Table.Tr>
                      <Table.Th style={thS}>Case Code</Table.Th>
                      <Table.Th style={thS}>Assessment Purpose</Table.Th>
                      <Table.Th style={thS}>Stage</Table.Th>
                      <Table.Th style={thS}>CRM Opportunity</Table.Th>
                      <Table.Th style={thS}>Created</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredCases.map(c => {
                      const isSel = pendingCase?.id === c.id;
                      return (
                        <Table.Tr key={c.id}
                          onClick={() => setPendingCase(c)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isSel ? '#f0fdf4' : 'transparent',
                            outline: isSel ? '2px solid #007336' : 'none',
                            outlineOffset: '-2px',
                            transition: 'background 120ms',
                          }}
                          onMouseEnter={e => { if (!isSel) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                          onMouseLeave={e => { if (!isSel) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <Table.Td><Text size="sm" fw={700} c="#007336">{c.case_code}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#374151">{c.assessment_purpose || '—'}</Text></Table.Td>
                          <Table.Td>
                            <Badge size="sm" radius="xl" variant="light" color="green">
                              {c.assessment_stage || '—'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="#6b7280" style={{ fontFamily: 'monospace' }}>
                              {c.opportunity_id || '—'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="#9ca3af">
                              {new Date(c.created_at).toLocaleDateString()}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            {isSel && <Badge size="xs" color="green" variant="filled">Selected</Badge>}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                    {!casesLoading && filteredCases.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '32px 0' }}>
                          <Text size="sm" c="dimmed">
                            {allCases.length === 0
                              ? 'No SIA cases found. Create one in Start and Case Control first.'
                              : 'No cases match your search.'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              )}
          </Paper>

          <Group justify="space-between" align="center" mt="md">
            <Text size="xs" c="dimmed">
              {pendingCase
                ? <><Text span fw={600} c="#007336">{pendingCase.case_code}</Text> selected — click Continue</>
                : 'Click a row to select a case'}
            </Text>
            <Button color="green" rightSection={<IconArrowRight size={15} />}
              disabled={!pendingCase} onClick={() => confirmCase(pendingCase)}
              style={{ backgroundColor: pendingCase ? '#007336' : undefined }}>
              Continue to Sites
            </Button>
          </Group>
        </Paper>
      )}

      {/* ════════════════════════════════════════════════
          STEP 2 — Sites under the selected case
      ════════════════════════════════════════════════ */}
      {step === 'sites' && (
        <Box>
          {/* Active case banner */}
          <Paper p="sm" mb="lg" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
            <Group justify="space-between" align="center">
              <Group gap="md" wrap="wrap">
                <Group gap="xs">
                  <IconFolder size={14} color="#007336" />
                  <Text size="xs" fw={700} c="#374151">Case:</Text>
                  <Text size="xs" fw={700} c="#007336">{activeCase?.case_code}</Text>
                </Group>
                {activeCase?.assessment_stage && (
                  <Badge size="sm" variant="light" color="green" radius="xl">{activeCase.assessment_stage}</Badge>
                )}
                {activeCase?.assessment_purpose && (
                  <Text size="xs" c="#6b7280">{activeCase.assessment_purpose}</Text>
                )}
              </Group>
              <Button size="xs" variant="subtle" color="gray"
                onClick={() => { setStep('case'); setSelectedSite(null); }}>
                Change Case
              </Button>
            </Group>
          </Paper>

          {/* Sites list */}
          <Paper p="lg" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <Group justify="space-between" align="center" mb="sm">
              <Group gap="xs">
                <IconMapPin size={16} color="#007336" />
                <Title order={4} fw={600} c="#111827">Sites</Title>
                <Badge size="sm" variant="light" color="green">{sites.length}</Badge>
              </Group>
              <Group gap="sm">
                <Group gap="xs" align="center">
                  <IconSearch size={13} color="#9ca3af" />
                  <TextInput
                    placeholder="Search sites…"
                    value={siteSearch}
                    onChange={e => setSiteSearch(e.target.value)}
                    size="xs"
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, width: 200 } }}
                  />
                </Group>
                <Button size="xs" leftSection={<IconPlus size={13} />}
                  onClick={() => openModal('site')} color="green"
                  style={{ backgroundColor: '#007336' }}>
                  Add Site
                </Button>
              </Group>
            </Group>

            {sitesL
              ? <Group justify="center" py="xl"><Loader color="green" size="sm" /></Group>
              : (
                <Table verticalSpacing="sm" horizontalSpacing="md">
                  <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
                    <Table.Tr>
                      <Table.Th style={thS}>Code</Table.Th>
                      <Table.Th style={thS}>Name</Table.Th>
                      <Table.Th style={thS}>Type</Table.Th>
                      <Table.Th style={thS}>Status</Table.Th>
                      <Table.Th style={thS}>Contact</Table.Th>
                      <Table.Th style={thS}>Lat / Lng</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredSites.length === 0
                      ? <EmptyRow cols={7} msg="No sites yet. Click Add Site to create the first one." />
                      : filteredSites.map(s => (
                        <Table.Tr key={s.id}
                          style={{ cursor: 'pointer', transition: 'background 120ms' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => confirmSite(s)}
                        >
                          <Table.Td><Text size="sm" fw={700} c="#007336">{s.site_code}</Text></Table.Td>
                          <Table.Td><Text size="sm" fw={500} c="#111827">{s.site_name || '—'}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#6b7280">{s.site_type || '—'}</Text></Table.Td>
                          <Table.Td><StatusBadge v={s.status} /></Table.Td>
                          <Table.Td><Text size="xs" c="#6b7280">{s.contact_name || '—'}</Text></Table.Td>
                          <Table.Td>
                            <Text size="xs" c="#9ca3af">
                              {s.latitude != null ? `${s.latitude}, ${s.longitude}` : '—'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4} justify="flex-end">
                              <Button size="xs" variant="subtle" color="green" rightSection={<IconArrowRight size={12} />}
                                onClick={e => { e.stopPropagation(); confirmSite(s); }}>
                                Open
                              </Button>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                  </Table.Tbody>
                </Table>
              )}
          </Paper>
        </Box>
      )}

      {/* ════════════════════════════════════════════════
          STEP 3 — Survey: tabs for buildings, rooms, etc.
      ════════════════════════════════════════════════ */}
      {step === 'survey' && selectedSite && (
        <Box>
          {/* Active case + site banner */}
          <Paper p="sm" mb="md" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
            <Group justify="space-between" align="center" wrap="wrap">
              <Group gap="lg" wrap="wrap">
                <Group gap="xs">
                  <IconFolder size={14} color="#007336" />
                  <Text size="xs" c="#374151" fw={600}>Case:</Text>
                  <Text size="xs" fw={700} c="#007336">{activeCase?.case_code}</Text>
                </Group>
                <Group gap="xs">
                  <IconMapPin size={14} color="#007336" />
                  <Text size="xs" c="#374151" fw={600}>Site:</Text>
                  <Text size="xs" fw={700} c="#111827">{selectedSite.site_name || selectedSite.site_code}</Text>
                  <StatusBadge v={selectedSite.status} />
                </Group>
                {selectedBuilding && (
                  <Group gap="xs">
                    <IconBuilding size={14} color="#6b7280" />
                    <Text size="xs" c="#374151">Building: <Text span fw={600}>{selectedBuilding.building_name || selectedBuilding.building_code}</Text></Text>
                  </Group>
                )}
                {selectedVisit && (
                  <Group gap="xs">
                    <IconCalendar size={14} color="#6b7280" />
                    <Text size="xs" c="#374151">Visit: <Text span fw={600}>{selectedVisit.visit_code}</Text></Text>
                  </Group>
                )}
              </Group>
              <Button size="xs" variant="subtle" color="green"
                onClick={() => { setStep('sites'); setSelectedSite(null); setSelectedBuilding(null); setSelectedVisit(null); setSurveyTab('buildings'); }}>
                ← Back to Sites
              </Button>
            </Group>
          </Paper>

          {/* Survey tabs */}
          <Tabs value={surveyTab} onChange={setSurveyTab} color="green">

            {/* Step-flow tab bar */}
            <Box mb="md" style={{ overflowX: 'auto' }}>
              <Group gap={0} wrap="nowrap" style={{ minWidth: 'max-content' }}>
                {[
                  { value: 'buildings', label: 'Buildings',     icon: <IconBuilding size={14} />,  enabled: true },
                  { value: 'rooms',     label: 'Room / Areas',  icon: <IconDoor size={14} />,      enabled: !!selectedBuilding },
                  { value: 'pois',      label: 'POIs',          icon: <IconLocation size={14} />,  enabled: true },
                  { value: 'visits',    label: 'Survey Visits', icon: <IconCalendar size={14} />,  enabled: true },
                  { value: 'team',      label: 'Team',          icon: <IconUsers size={14} />,     enabled: !!selectedVisit },
                  { value: 'access',    label: 'Access',        icon: <IconLock size={14} />,      enabled: true },
                  { value: 'safety',    label: 'Safety',        icon: <IconShield size={14} />,    enabled: true },
                  { value: 'reqs',      label: 'Requirements',  icon: <IconClipboard size={14} />, enabled: !!selectedVisit },
                  { value: 'instruments', label: 'Instruments', icon: <IconTool size={14} />,      enabled: !!selectedVisit },
                ].map((tab, idx, arr) => {
                  const isActive = surveyTab === tab.value;
                  const isDone   = arr.findIndex(t => t.value === surveyTab) > idx;
                  const bgColor  = isActive ? '#007336' : isDone ? '#bbf7d0' : tab.enabled ? '#f3f4f6' : '#f9fafb';
                  const txtColor = isActive ? '#fff' : isDone ? '#007336' : tab.enabled ? '#374151' : '#9ca3af';
                  const border   = isActive ? '#007336' : isDone ? '#86efac' : '#e5e7eb';
                  return (
                    <Group key={tab.value} gap={0} align="center" wrap="nowrap">
                      <Box
                        onClick={() => tab.enabled && setSurveyTab(tab.value)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '7px 14px', borderRadius: 20,
                          backgroundColor: bgColor, border: `1.5px solid ${border}`,
                          cursor: tab.enabled ? 'pointer' : 'not-allowed',
                          opacity: tab.enabled ? 1 : 0.45,
                          transition: 'all 0.15s', whiteSpace: 'nowrap',
                        }}
                      >
                        <Box style={{ color: txtColor, display: 'flex', alignItems: 'center' }}>{tab.icon}</Box>
                        <Text size="xs" fw={isActive ? 700 : 500} style={{ color: txtColor }}>{tab.label}</Text>
                      </Box>
                      {idx < arr.length - 1 && (
                        <Box style={{ width: 16, height: 2, backgroundColor: isDone ? '#86efac' : '#e5e7eb', flexShrink: 0 }} />
                      )}
                    </Group>
                  );
                })}
              </Group>
            </Box>

            {/* Hidden Mantine tab list for routing */}
            <Tabs.List style={{ display: 'none' }}>
              {['buildings','rooms','pois','visits','team','access','safety','reqs','instruments'].map(v =>
                <Tabs.Tab key={v} value={v}>{v}</Tabs.Tab>
              )}
            </Tabs.List>

            {/* ── Buildings ── */}
            <Tabs.Panel value="buildings">
              <TabHeader title="Buildings" onAdd={() => openModal('building')} addLabel="Add Building" />
              <DataTable loading={buildingsL} cols={['Code', 'Name', 'Type', 'Floors', 'Description', '']}
                rows={buildings} render={b => (
                  <Table.Tr key={b.id}
                    style={{ cursor: 'pointer', transition: 'background 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => { setSelectedBuilding(b); setSurveyTab('rooms'); }}>
                    <Table.Td><Text size="sm" fw={700} c="#007336">{b.building_code || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{b.building_name || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{b.building_type || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{b.floor_count ?? '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#9ca3af">{b.description || '—'}</Text></Table.Td>
                    <Table.Td>
                      <Button size="xs" variant="subtle" color="green" rightSection={<IconArrowRight size={12} />}
                        onClick={e => { e.stopPropagation(); setSelectedBuilding(b); setSurveyTab('rooms'); }}>
                        Rooms
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                )} />
            </Tabs.Panel>

            {/* ── Room Areas ── */}
            <Tabs.Panel value="rooms">
              {!selectedBuilding
                ? <Paper p="md" style={{ border: '1px dashed #d1d5db', borderRadius: 8, textAlign: 'center' }}>
                    <Text size="sm" c="dimmed">Select a building from the Buildings tab first.</Text>
                    <Button size="xs" mt="sm" variant="subtle" color="green" onClick={() => setSurveyTab('buildings')}>← Go to Buildings</Button>
                  </Paper>
                : <>
                    <Paper p="xs" mb="sm" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
                      <Group gap="xs">
                        <IconBuilding size={13} color="#007336" />
                        <Text size="xs" c="#374151">Building: <Text span fw={600} c="#007336">{selectedBuilding.building_name || selectedBuilding.building_code}</Text></Text>
                        <Text size="xs" c="#9ca3af" style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={() => setSelectedBuilding(null)}>Clear</Text>
                      </Group>
                    </Paper>
                    <TabHeader title="Room / Areas" onAdd={() => openModal('room')} addLabel="Add Room/Area" />
                    <DataTable loading={roomsL} cols={['Code', 'Name', 'Type', 'Floor', 'Description']}
                      rows={roomAreas} render={r => (
                        <Table.Tr key={r.id}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <Table.Td><Text size="sm" fw={600} c="#007336">{r.area_code || '—'}</Text></Table.Td>
                          <Table.Td><Text size="sm">{r.area_name || '—'}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#6b7280">{r.area_type || '—'}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#6b7280">{r.floor_level || '—'}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#9ca3af">{r.description || '—'}</Text></Table.Td>
                        </Table.Tr>
                      )} />
                  </>}
            </Tabs.Panel>

            {/* ── POIs ── */}
            <Tabs.Panel value="pois">
              <TabHeader title="Points of Interest" onAdd={() => openModal('poi')} addLabel="Add POI" />
              <DataTable loading={poisL} cols={['Code', 'Name', 'Type', 'Category', 'Lat', 'Lng']}
                rows={pois} render={p => (
                  <Table.Tr key={p.id}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <Table.Td><Text size="sm" fw={600} c="#007336">{p.poi_code || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{p.poi_name || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{p.poi_type || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{p.category || '—'}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="#9ca3af">{p.latitude ?? '—'}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="#9ca3af">{p.longitude ?? '—'}</Text></Table.Td>
                  </Table.Tr>
                )} />
            </Tabs.Panel>

            {/* ── Survey Visits ── */}
            <Tabs.Panel value="visits">
              <TabHeader title="Survey Visits" onAdd={() => openModal('visit')} addLabel="Add Visit" />
              <DataTable loading={visitsL} cols={['Code', 'Type', 'Purpose', 'Planned Date', 'Status', '']}
                rows={visits} render={v => (
                  <Table.Tr key={v.id}
                    style={{ cursor: 'pointer', transition: 'background 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => { setSelectedVisit(v); localStorage.setItem('sia_survey_visit_id', v.id); setSurveyTab('team'); }}>
                    <Table.Td><Text size="sm" fw={700} c="#007336">{v.visit_code || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{v.visit_type || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{v.purpose || '—'}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="#6b7280">{v.planned_date || '—'}</Text></Table.Td>
                    <Table.Td><StatusBadge v={v.status} /></Table.Td>
                    <Table.Td>
                      <Button size="xs" variant="subtle" color="green" rightSection={<IconArrowRight size={12} />}
                        onClick={e => { e.stopPropagation(); setSelectedVisit(v); localStorage.setItem('sia_survey_visit_id', v.id); setSurveyTab('team'); }}>
                        Open
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                )} />
            </Tabs.Panel>

            {/* ── Team ── */}
            <Tabs.Panel value="team">
              {!selectedVisit
                ? <Paper p="md" style={{ border: '1px dashed #d1d5db', borderRadius: 8, textAlign: 'center' }}>
                    <Text size="sm" c="dimmed">Select a visit from Survey Visits first.</Text>
                    <Button size="xs" mt="sm" variant="subtle" color="green" onClick={() => setSurveyTab('visits')}>← Go to Visits</Button>
                  </Paper>
                : <>
                    <VisitBanner visit={selectedVisit} onClear={() => setSelectedVisit(null)} />
                    <TabHeader title="Survey Team" onAdd={() => openModal('team')} addLabel="Add Member" />
                    <DataTable loading={teamL} cols={['User ID', 'Role', 'Lead']}
                      rows={team} render={t => (
                        <Table.Tr key={t.id}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <Table.Td><Text size="sm" style={{ fontFamily: 'monospace' }}>{t.user_id}</Text></Table.Td>
                          <Table.Td><Text size="sm">{t.team_role || '—'}</Text></Table.Td>
                          <Table.Td><Badge size="sm" color={t.is_lead ? 'green' : 'gray'} variant="light">{t.is_lead ? 'Lead' : 'Member'}</Badge></Table.Td>
                        </Table.Tr>
                      )} />
                  </>}
            </Tabs.Panel>

            {/* ── Site Access ── */}
            <Tabs.Panel value="access">
              <TabHeader title="Site Access" onAdd={() => openModal('access')} addLabel="Add Access Record" />
              <DataTable loading={accessL} cols={['Access Type', 'Road Condition', 'Transport', 'Entry Permission', 'Working Hours']}
                rows={access} render={a => (
                  <Table.Tr key={a.id}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <Table.Td><Text size="sm">{a.access_type || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{a.road_condition || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{a.transport_method || '—'}</Text></Table.Td>
                    <Table.Td><Badge size="sm" color={a.entry_permission ? 'green' : 'red'} variant="light">{a.entry_permission ? 'Permitted' : 'Denied'}</Badge></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{a.working_hours || '—'}</Text></Table.Td>
                  </Table.Tr>
                )} />
            </Tabs.Panel>

            {/* ── Site Safety ── */}
            <Tabs.Panel value="safety">
              <TabHeader title="Site Safety" onAdd={() => openModal('safety')} addLabel="Add Safety Record" />
              <DataTable loading={safetyL} cols={['Hazard Type', 'Risk Level', 'PPE Required', 'Restricted', 'Emergency Contact']}
                rows={safety} render={s => (
                  <Table.Tr key={s.id}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <Table.Td><Text size="sm">{s.hazard_type || '—'}</Text></Table.Td>
                    <Table.Td><RiskBadge v={s.risk_level} /></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{s.ppe_required || '—'}</Text></Table.Td>
                    <Table.Td><Badge size="sm" color={s.restricted_area ? 'red' : 'green'} variant="light">{s.restricted_area ? 'Yes' : 'No'}</Badge></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{s.emergency_contact || '—'}</Text></Table.Td>
                  </Table.Tr>
                )} />
            </Tabs.Panel>

            {/* ── Requirements ── */}
            <Tabs.Panel value="reqs">
              {!selectedVisit
                ? <Paper p="md" style={{ border: '1px dashed #d1d5db', borderRadius: 8, textAlign: 'center' }}>
                    <Text size="sm" c="dimmed">Select a visit from Survey Visits first.</Text>
                    <Button size="xs" mt="sm" variant="subtle" color="green" onClick={() => setSurveyTab('visits')}>← Go to Visits</Button>
                  </Paper>
                : <>
                    <VisitBanner visit={selectedVisit} onClear={() => setSelectedVisit(null)} />
                    <TabHeader title="Survey Requirements" onAdd={() => openModal('req')} addLabel="Add Requirement" />
                    <DataTable loading={reqsL} cols={['Name', 'Type', 'Mandatory', 'Status']}
                      rows={reqs} render={r => (
                        <Table.Tr key={r.id}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <Table.Td><Text size="sm">{r.requirement_name || '—'}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#6b7280">{r.requirement_type || '—'}</Text></Table.Td>
                          <Table.Td><Badge size="sm" color={r.is_mandatory ? 'red' : 'gray'} variant="light">{r.is_mandatory ? 'Mandatory' : 'Optional'}</Badge></Table.Td>
                          <Table.Td><StatusBadge v={r.status} /></Table.Td>
                        </Table.Tr>
                      )} />
                  </>}
            </Tabs.Panel>

            {/* ── Instruments ── */}
            <Tabs.Panel value="instruments">
              {!selectedVisit
                ? <Paper p="md" style={{ border: '1px dashed #d1d5db', borderRadius: 8, textAlign: 'center' }}>
                    <Text size="sm" c="dimmed">Select a visit from Survey Visits first.</Text>
                    <Button size="xs" mt="sm" variant="subtle" color="green" onClick={() => setSurveyTab('visits')}>← Go to Visits</Button>
                  </Paper>
                : <>
                    <VisitBanner visit={selectedVisit} onClear={() => setSelectedVisit(null)} />
                    <TabHeader title="Survey Instruments" onAdd={() => openModal('instrument')} addLabel="Add Instrument" />
                    <DataTable loading={instL} cols={['Name', 'Type', 'Serial No', 'Calibration', 'Required']}
                      rows={instruments} render={i => (
                        <Table.Tr key={i.id}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <Table.Td><Text size="sm">{i.instrument_name || '—'}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#6b7280">{i.instrument_type || '—'}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#6b7280">{i.serial_number || '—'}</Text></Table.Td>
                          <Table.Td><StatusBadge v={i.calibration_status} /></Table.Td>
                          <Table.Td><Badge size="sm" color={i.required ? 'green' : 'gray'} variant="light">{i.required ? 'Yes' : 'No'}</Badge></Table.Td>
                        </Table.Tr>
                      )} />
                  </>}
            </Tabs.Panel>

          </Tabs>
        </Box>
      )}

      {/* ════ MODALS ════ */}

      {/* Site Modal */}
      <FormModal opened={modal === 'site'} onClose={closeModal} title="Add Site" saving={saving}
        onSubmit={() => save('/sia/sites', { sia_case_id: siaCaseId, ...form.values }, reloadSites)}>
        <FormRow><FI label="Site Code *" field="site_code" form={form} /></FormRow>
        <FormRow>
          <FI label="Site Name" field="site_name" form={form} />
          <FI label="Site Type" field="site_type" form={form} />
        </FormRow>
        <FI label="Address" field="address" form={form} textarea />
        <FormRow>
          <FI label="Contact Name" field="contact_name" form={form} />
          <FI label="Contact Phone" field="contact_phone" form={form} />
        </FormRow>
        <FormRow>
          <FI label="Latitude" field="latitude" form={form} number />
          <FI label="Longitude" field="longitude" form={form} number />
        </FormRow>
        <FI label="Status" field="status" form={form} select={['Active', 'Inactive', 'Pending', 'Surveyed']} />
      </FormModal>

      {/* Building Modal */}
      <FormModal opened={modal === 'building'} onClose={closeModal} title="Add Building" saving={saving}
        onSubmit={() => save('/sia/buildings', { site_id: selectedSite?.id, ...form.values }, reloadBuildings)}>
        <FormRow>
          <FI label="Building Code" field="building_code" form={form} />
          <FI label="Building Name" field="building_name" form={form} />
        </FormRow>
        <FormRow>
          <FI label="Building Type" field="building_type" form={form} />
          <FI label="Floor Count" field="floor_count" form={form} number />
        </FormRow>
        <FI label="Description" field="description" form={form} textarea />
      </FormModal>

      {/* Room Area Modal */}
      <FormModal opened={modal === 'room'} onClose={closeModal} title="Add Room / Area" saving={saving}
        onSubmit={() => save('/sia/room-areas', { site_id: selectedSite?.id, building_id: selectedBuilding?.id, ...form.values }, reloadRooms)}>
        <FormRow>
          <FI label="Area Code" field="area_code" form={form} />
          <FI label="Area Name" field="area_name" form={form} />
        </FormRow>
        <FormRow>
          <FI label="Area Type" field="area_type" form={form} />
          <FI label="Floor Level" field="floor_level" form={form} />
        </FormRow>
        <FI label="Description" field="description" form={form} textarea />
      </FormModal>

      {/* POI Modal */}
      <FormModal opened={modal === 'poi'} onClose={closeModal} title="Add Point of Interest" saving={saving}
        onSubmit={() => save('/sia/pois', { site_id: selectedSite?.id, ...form.values }, reloadPois)}>
        <FormRow>
          <FI label="POI Code" field="poi_code" form={form} />
          <FI label="POI Name" field="poi_name" form={form} />
        </FormRow>
        <FormRow>
          <FI label="POI Type" field="poi_type" form={form} />
          <FI label="Category" field="category" form={form} />
        </FormRow>
        <FormRow>
          <FI label="Latitude" field="latitude" form={form} number />
          <FI label="Longitude" field="longitude" form={form} number />
        </FormRow>
        <FI label="Description" field="description" form={form} textarea />
      </FormModal>

      {/* Survey Visit Modal */}
      <FormModal opened={modal === 'visit'} onClose={closeModal} title="Add Survey Visit" saving={saving}
        onSubmit={() => save('/sia/survey-visits', { site_id: selectedSite?.id, ...form.values }, reloadVisits)}>
        <FormRow>
          <FI label="Visit Code" field="visit_code" form={form} />
          <FI label="Visit Type" field="visit_type" form={form} />
        </FormRow>
        <FI label="Purpose" field="purpose" form={form} />
        <FI label="Planned Date (YYYY-MM-DD)" field="planned_date" form={form} />
        <FI label="Status" field="status" form={form} select={['Planned', 'In Progress', 'Completed', 'Cancelled']} />
      </FormModal>

      {/* Team Modal */}
      <FormModal opened={modal === 'team'} onClose={closeModal} title="Add Team Member" saving={saving}
        onSubmit={() => save('/sia/survey-team', { survey_visit_id: selectedVisit?.id, user_id: localStorage.getItem('user_id') || 'unknown', ...form.values }, reloadTeam)}>
        <FI label="Team Role" field="team_role" form={form} />
        <Group mt="sm">
          <Text size="xs" fw={600} c="#374151">Is Lead</Text>
          <Switch checked={!!form.values.is_lead} onChange={e => form.setFieldValue('is_lead', e.currentTarget.checked)} color="green" />
        </Group>
      </FormModal>

      {/* Access Modal */}
      <FormModal opened={modal === 'access'} onClose={closeModal} title="Add Site Access" saving={saving}
        onSubmit={() => save('/sia/site-access', { site_id: selectedSite?.id, ...form.values }, reloadAccess)}>
        <FormRow>
          <FI label="Access Type" field="access_type" form={form} />
          <FI label="Road Condition" field="road_condition" form={form} />
        </FormRow>
        <FormRow>
          <FI label="Transport Method" field="transport_method" form={form} />
          <FI label="Working Hours" field="working_hours" form={form} />
        </FormRow>
        <FI label="Access Restriction" field="access_restriction" form={form} textarea />
        <FI label="Logistics Notes" field="logistics_notes" form={form} textarea />
        <Group mt="sm">
          <Text size="xs" fw={600} c="#374151">Entry Permission</Text>
          <Switch checked={!!form.values.entry_permission} onChange={e => form.setFieldValue('entry_permission', e.currentTarget.checked)} color="green" />
        </Group>
      </FormModal>

      {/* Safety Modal */}
      <FormModal opened={modal === 'safety'} onClose={closeModal} title="Add Safety Record" saving={saving}
        onSubmit={() => save('/sia/site-safety', { site_id: selectedSite?.id, ...form.values }, reloadSafety)}>
        <FormRow>
          <FI label="Hazard Type" field="hazard_type" form={form} />
          <FI label="Risk Level" field="risk_level" form={form} select={['Low', 'Medium', 'High', 'Critical']} />
        </FormRow>
        <FI label="Description" field="description" form={form} textarea />
        <FI label="PPE Required" field="ppe_required" form={form} />
        <FI label="Emergency Contact" field="emergency_contact" form={form} />
        <FI label="Control Action" field="control_action" form={form} textarea />
        <Group mt="sm">
          <Text size="xs" fw={600} c="#374151">Restricted Area</Text>
          <Switch checked={!!form.values.restricted_area} onChange={e => form.setFieldValue('restricted_area', e.currentTarget.checked)} color="red" />
        </Group>
      </FormModal>

      {/* Requirement Modal */}
      <FormModal opened={modal === 'req'} onClose={closeModal} title="Add Survey Requirement" saving={saving}
        onSubmit={() => save('/sia/survey-requirements', { survey_visit_id: selectedVisit?.id, ...form.values }, reloadReqs)}>
        <FI label="Requirement Name" field="requirement_name" form={form} />
        <FormRow>
          <FI label="Requirement Type" field="requirement_type" form={form} />
          <FI label="Status" field="status" form={form} select={['Pending', 'In Progress', 'Completed', 'Not Applicable']} />
        </FormRow>
        <FI label="Notes" field="notes" form={form} textarea />
        <Group mt="sm">
          <Text size="xs" fw={600} c="#374151">Mandatory</Text>
          <Switch checked={!!form.values.is_mandatory} onChange={e => form.setFieldValue('is_mandatory', e.currentTarget.checked)} color="red" />
        </Group>
      </FormModal>

      {/* Instrument Modal */}
      <FormModal opened={modal === 'instrument'} onClose={closeModal} title="Add Survey Instrument" saving={saving}
        onSubmit={() => save('/sia/survey-instruments', { survey_visit_id: selectedVisit?.id, ...form.values }, reloadInst)}>
        <FormRow>
          <FI label="Instrument Name" field="instrument_name" form={form} />
          <FI label="Instrument Type" field="instrument_type" form={form} />
        </FormRow>
        <FormRow>
          <FI label="Serial Number" field="serial_number" form={form} />
          <FI label="Calibration Status" field="calibration_status" form={form}
            select={['Valid', 'Expired', 'Pending', 'Unknown']} />
        </FormRow>
        <Group mt="sm">
          <Text size="xs" fw={600} c="#374151">Required</Text>
          <Switch checked={!!form.values.required} onChange={e => form.setFieldValue('required', e.currentTarget.checked)} color="green" />
        </Group>
      </FormModal>

    </Box>
  );
}

// ── small inline component ────────────────────────────────
function VisitBanner({ visit, onClear }) {
  return (
    <Paper p="xs" mb="sm" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
      <Group gap="xs">
        <IconCalendar size={13} color="#007336" />
        <Text size="xs" c="#374151">Visit: <Text span fw={600} c="#007336">{visit.visit_code}</Text></Text>
        {visit.visit_type && <Text size="xs" c="#6b7280">· {visit.visit_type}</Text>}
        {visit.planned_date && <Text size="xs" c="#9ca3af">· {visit.planned_date}</Text>}
        <StatusBadge v={visit.status} />
        <Text size="xs" c="#9ca3af" style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={onClear}>Clear</Text>
      </Group>
    </Paper>
  );
}
