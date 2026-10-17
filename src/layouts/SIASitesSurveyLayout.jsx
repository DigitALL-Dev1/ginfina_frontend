import { formatDate, formatDisplayValue } from '../utils/dateOnly';
import { Children, cloneElement, isValidElement, useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader,
  Paper, Stack, Tabs, Table, Text, Textarea,
  TextInput, Title, NumberInput, Switch, Modal, Select,
} from '@mantine/core';
import DatePickerInput from '../components/common/DatePickerInput';
import PhoneNumberInput from '../components/common/PhoneNumberInput';
import { phoneNumberError } from '../utils/phoneNumber';
import SIASitesSurveyReport from '../components/common/SIASitesSurveyReport';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconMapPin, IconBuilding, IconDoor,
  IconLocation, IconCalendar, IconLock,
  IconShield, IconClipboard, IconTool, IconArrowRight,
  IconFolder, IconSearch, IconChevronRight, IconCheck, IconFileText, IconEdit,
} from '@tabler/icons-react';
import styles from './SIASitesSurveyLayout.module.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const POI_CATEGORIES = [
  'Electrical', 'Civil', 'Structural', 'Mechanical', 'Water Pumping',
  'SCADA', 'HSE/Environment', 'Industrial', 'Other',
];
const FLOOR_LEVELS = [
  'Basement 2', 'Basement 1', 'Ground Floor', 'Mezzanine',
  ...Array.from({ length: 10 }, (_, index) => `Floor ${index + 1}`),
  'Rooftop', 'Other',
];

// Fields required to create a meaningful record in each Sites and Survey form.
const REQUIRED_BY_PATH = {
  '/sia/sites': ['site_name', 'site_type', 'address', 'contact_name', 'contact_phone', 'latitude', 'longitude', 'status'],
  '/sia/buildings': ['building_name', 'building_type', 'floor_count'],
  '/sia/room-areas': ['area_name', 'area_type', 'floor_level'],
  '/sia/pois': ['poi_name', 'poi_type', 'category', 'latitude', 'longitude'],
  '/sia/survey-visits': ['visit_type', 'purpose', 'planned_date'],
  '/sia/site-access': ['access_type', 'road_condition', 'transport_method', 'working_hours'],
  '/sia/site-safety': ['hazard_type', 'risk_level', 'description', 'ppe_required', 'emergency_contact', 'control_action'],
  '/sia/survey-requirements': ['requirement_name', 'requirement_type', 'status', 'notes'],
  '/sia/survey-instruments': ['instrument_name', 'instrument_type', 'serial_number', 'calibration_status'],
};
const MANDATORY_FIELDS = new Set(Object.values(REQUIRED_BY_PATH).flat());

// â”€â”€ shared style â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const thS = {
  fontSize: 11, fontWeight: 700, color: '#374151',
  textTransform: 'uppercase', letterSpacing: '0.05em',
};

// â”€â”€ breadcrumb step indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STEPS = [
  { key: 'case',    label: 'SIA Case' },
  { key: 'sites',   label: 'Sites' },
  { key: 'survey',  label: 'Survey' },
];

function Breadcrumb({ step, caseObj, site, onCase, onSites }) {
  const idx = STEPS.findIndex(s => s.key === step);
  return (
    <Group gap="xs" wrap="wrap" mb="lg" align="center" aria-label="Survey progress">
      {STEPS.map((s, i) => {
        const done    = i < idx;
        const active  = i === idx;
        const canClick = done;
        return (
          <Group className={styles.breadcrumbItem} key={s.key} gap={0} align="center" wrap="nowrap">
            <Box
              component="button" type="button" disabled={!canClick} aria-current={active ? 'step' : undefined}
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
              <Text className={styles.breadcrumbLabel} size="xs" fw={active ? 700 : 500}
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

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

async function patchApi(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `HTTP ${res.status}`); }
  return res.json();
}

function DataTable({ loading, cols, rows, render }) {
  return (
    <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 8, position: 'relative', minHeight: 120 }}>
      {loading && <Group justify="center" py="xl"><Loader color="green" size="sm" /></Group>}
      {!loading && (
        <ResponsiveTable verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
            <Table.Tr>{cols.map(c => <Table.Th key={c} style={thS}>{c}</Table.Th>)}</Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length === 0 ? <EmptyRow cols={cols.length} /> : rows.map(render)}
          </Table.Tbody>
        </ResponsiveTable>
      )}
    </Paper>
  );
}

function TabHeader({ title, onAdd, addLabel, disabled }) {
  return (
    <Group className={styles.actions} justify="space-between" align="center" mb="sm">
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
    <Modal classNames={{ content: styles.modal }} opened={opened} onClose={onClose} title={<Text fw={700} size="sm">{title}</Text>} size="lg" padding="md">
      <Stack gap="sm">
        {children}
        <Group className={styles.actions} justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="green" loading={saving} onClick={onSubmit}
            style={{ backgroundColor: '#007336' }}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function FormRow({ children }) { return <Box className={styles.formRow}>{children}</Box>; }

// Reuse the same cells and event handlers in desktop tables and phone cards.
function ResponsiveTable({ children, ...props }) {
  const parts = Children.toArray(children);
  const head = parts.find(part => part.type === Table.Thead);
  const headings = Children.toArray(Children.toArray(head?.props.children)[0]?.props.children).map(cell => cell.props.children);
  return <Box className={styles.tableViewport}><Table {...props} className={styles.recordTable}>{parts.map(part => {
    if (part.type !== Table.Tbody) return part;
    return cloneElement(part, {}, Children.map(part.props.children, row => {
      if (!isValidElement(row) || row.type !== Table.Tr) return row;
      return cloneElement(row, {}, Children.map(row.props.children, (cell, index) => isValidElement(cell) && cell.type === Table.Td && !cell.props.colSpan
        ? cloneElement(cell, { 'data-label': headings[index] || '' }) : cell));
    }));
  })}</Table></Box>;
}

function FI({ label, field, form, textarea, number, select, min, digitsOnly }) {
  const val = form.values[field] ?? '';
  const onChange = (v) => form.setFieldValue(field, v);
  
  const displayLabel = MANDATORY_FIELDS.has(field) ? `${label} *` : label;
  if (field === 'contact_phone' || field === 'emergency_contact') return <PhoneNumberInput label={displayLabel} value={val} onChange={onChange} />;

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
      <Text size="xs" fw={600} c="#374151" mb={4}>{displayLabel}</Text>
      <Select data={select} aria-label={label} value={val} onChange={v => onChange(v || '')} clearable styles={inputStyle} />
    </Box>
  );
  if (textarea) return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>{displayLabel}</Text>
      <Textarea aria-label={label} value={val} onChange={e => onChange(e.target.value)} autosize minRows={2} styles={inputStyle} />
    </Box>
  );
  if (number) return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>{displayLabel}</Text>
      <NumberInput aria-label={label} value={val === '' ? undefined : val} onChange={v => onChange(v)} min={min} allowNegative={min === undefined || min < 0} styles={inputStyle} />
    </Box>
  );
  
  if (isDateField) return <DatePickerInput label={displayLabel} aria-label={label} value={val} onChange={onChange} styles={inputStyle} />;
  
  // Convert Type and Role fields to dropdowns automatically
  if (isTypeOrRoleField && autoDetectedOptions.length > 0) {
    return (
      <Box>
        <Text size="xs" fw={600} c="#374151" mb={4}>{displayLabel}</Text>
        <Select data={autoDetectedOptions} aria-label={label} value={val || null} onChange={v => onChange(v || '')} clearable searchable placeholder={`Select ${label}`} styles={inputStyle} />
      </Box>
    );
  }
  
  return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>{displayLabel}</Text>
      <TextInput aria-label={label} value={val} inputMode={digitsOnly ? 'numeric' : undefined}
        pattern={digitsOnly ? '[0-9]*' : undefined}
        onChange={e => onChange(digitsOnly ? e.target.value.replace(/[^0-9]/g, '') : e.target.value)} styles={inputStyle} />
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
      {v || 'â€”'}
    </Badge>
  );
}

function RiskBadge({ v }) { return <StatusBadge v={v} />; }

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN COMPONENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function SIASitesSurveyLayout() {

  // â”€â”€ Step tracking: 'case' | 'sites' | 'survey' â”€â”€â”€â”€â”€â”€â”€
  const [step, setStep] = useState('case');

  // â”€â”€ Step 1: SIA Case â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Step 2: Sites â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Step 3: Survey tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  useEffect(() => {
    const rememberedVisitId = localStorage.getItem('sia_survey_visit_id');
    if (!rememberedVisitId || !visits.length) return;
    const rememberedVisit = visits.find(visit => visit.id === rememberedVisitId);
    if (rememberedVisit) setSelectedVisit(rememberedVisit);
  }, [visits]);
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

  // â”€â”€ Modal / form state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState({});
  const form = {
    values: formValues,
    setFieldValue: (k, v) => setFormValues(prev => ({ ...prev, [k]: v })),
    reset: () => setFormValues({}),
  };
  const openModal = (key) => {
    setFormValues(key === 'visit' ? { status: 'Planned' } : {});
    setModal(key);
  };
  const closeModal = () => { setModal(null); setFormValues({}); };

  const save = async (path, body, reload) => {
    const missing = (REQUIRED_BY_PATH[path] || []).filter(field => {
      const value = body[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      const labels = missing.map(field => field.replace(/_/g, ' '));
      notifications.show({
        title: 'Required fields missing',
        message: `Complete: ${labels.join(', ')}.`,
        color: 'orange',
      });
      return;
    }
    const phoneField = path === '/sia/sites' ? 'contact_phone' : path === '/sia/site-safety' ? 'emergency_contact' : null;
    if (phoneField && phoneNumberError(body[phoneField])) {
      notifications.show({ title: 'Check contact phone', message: phoneNumberError(body[phoneField]), color: 'red' });
      return;
    }
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

  const updateSite = async () => {
    const body = form.values;
    const missing = REQUIRED_BY_PATH['/sia/sites'].filter(field => {
      const value = body[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    const phoneError = phoneNumberError(body.contact_phone);
    if (phoneError) {
      notifications.show({ title: 'Check contact phone', message: phoneError, color: 'red' });
      return;
    }
    setSaving(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(body).map(([key, value]) => [key, value === '' ? null : value]));
      const result = await patchApi(`/sia/sites/${encodeURIComponent(form.values.id)}`, cleaned);
      setSelectedSite(current => current?.id === result.id ? result : current);
      notifications.show({ title: 'Site updated', message: 'The site details were saved successfully.', color: 'green' });
      reloadSites();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update site', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditSite = site => {
    setFormValues({
      id: site.id,
      site_name: site.site_name || '', site_type: site.site_type || '', address: site.address || '',
      contact_name: site.contact_name || '', contact_phone: site.contact_phone || '',
      latitude: site.latitude ?? '', longitude: site.longitude ?? '', status: site.status || '',
    });
    setModal('edit-site');
  };

  const updateBuilding = async () => {
    const body = form.values;
    const missing = REQUIRED_BY_PATH['/sia/buildings'].filter(field => {
      const value = body[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      const result = await patchApi(`/sia/buildings/${encodeURIComponent(form.values.id)}`, cleaned);
      setSelectedBuilding(current => current?.id === result.id ? result : current);
      notifications.show({ title: 'Building updated', message: 'The building details were saved successfully.', color: 'green' });
      reloadBuildings();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update building', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditBuilding = building => {
    setFormValues({
      id: building.id,
      building_name: building.building_name || '', building_type: building.building_type || '',
      floor_count: building.floor_count ?? '', description: building.description || '',
    });
    setModal('edit-building');
  };

  const updateRoom = async () => {
    const body = form.values;
    const missing = REQUIRED_BY_PATH['/sia/room-areas'].filter(field => {
      const value = body[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      const result = await patchApi(`/sia/room-areas/${encodeURIComponent(form.values.id)}`, cleaned);
      notifications.show({ title: 'Room / Area updated', message: 'The room or area details were saved successfully.', color: 'green' });
      reloadRooms();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update room / area', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditRoom = room => {
    setFormValues({
      id: room.id, area_name: room.area_name || '', area_type: room.area_type || '',
      floor_level: room.floor_level || '', description: room.description || '',
    });
    setModal('edit-room');
  };

  const updatePoi = async () => {
    const body = form.values;
    const missing = REQUIRED_BY_PATH['/sia/pois'].filter(field => {
      const value = body[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/pois/${encodeURIComponent(form.values.id)}`, cleaned);
      notifications.show({ title: 'Point of Interest updated', message: 'The POI details were saved successfully.', color: 'green' });
      reloadPois();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Point of Interest', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditPoi = poi => {
    setFormValues({
      id: poi.id, poi_name: poi.poi_name || '', poi_type: poi.poi_type || '', category: poi.category || '',
      latitude: poi.latitude ?? '', longitude: poi.longitude ?? '', description: poi.description || '',
    });
    setModal('edit-poi');
  };

  const updateVisit = async () => {
    const body = form.values;
    const missing = REQUIRED_BY_PATH['/sia/survey-visits'].filter(field => {
      const value = body[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      const result = await patchApi(`/sia/survey-visits/${encodeURIComponent(form.values.id)}`, cleaned);
      setSelectedVisit(current => current?.id === result.id ? result : current);
      notifications.show({ title: 'Survey Visit updated', message: 'The survey visit details were saved successfully.', color: 'green' });
      reloadVisits();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Survey Visit', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditVisit = visit => {
    setFormValues({
      id: visit.id, visit_type: visit.visit_type || '', purpose: visit.purpose || '',
      planned_date: visit.planned_date || '', planned_start_time: visit.planned_start_time || '',
      planned_end_time: visit.planned_end_time || '', actual_start: visit.actual_start || '', actual_end: visit.actual_end || '',
    });
    setModal('edit-visit');
  };

  const updateAccess = async () => {
    const body = form.values;
    const missing = REQUIRED_BY_PATH['/sia/site-access'].filter(field => {
      const value = body[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/site-access/${encodeURIComponent(form.values.id)}`, cleaned);
      notifications.show({ title: 'Site Access updated', message: 'The site access details were saved successfully.', color: 'green' });
      reloadAccess();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Site Access', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditAccess = accessRecord => {
    setFormValues({
      id: accessRecord.id, access_type: accessRecord.access_type || '', road_condition: accessRecord.road_condition || '',
      transport_method: accessRecord.transport_method || '', working_hours: accessRecord.working_hours ?? '',
      access_restriction: accessRecord.access_restriction || '', logistics_notes: accessRecord.logistics_notes || '',
      entry_permission: !!accessRecord.entry_permission,
    });
    setModal('edit-access');
  };

  const updateSafety = async () => {
    const body = form.values;
    const missing = REQUIRED_BY_PATH['/sia/site-safety'].filter(field => {
      const value = body[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/site-safety/${encodeURIComponent(form.values.id)}`, cleaned);
      notifications.show({ title: 'Site Safety updated', message: 'The site safety details were saved successfully.', color: 'green' });
      reloadSafety();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Site Safety', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditSafety = safetyRecord => {
    setFormValues({
      id: safetyRecord.id, hazard_type: safetyRecord.hazard_type || '', risk_level: safetyRecord.risk_level || '',
      description: safetyRecord.description || '', ppe_required: safetyRecord.ppe_required || '',
      restricted_area: !!safetyRecord.restricted_area, emergency_contact: safetyRecord.emergency_contact || '',
      control_action: safetyRecord.control_action || '',
    });
    setModal('edit-safety');
  };

  const updateRequirement = async () => {
    const body = form.values;
    const missing = REQUIRED_BY_PATH['/sia/survey-requirements'].filter(field => {
      const value = body[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/survey-requirements/${encodeURIComponent(form.values.id)}`, cleaned);
      notifications.show({ title: 'Survey Requirement updated', message: 'The survey requirement details were saved successfully.', color: 'green' });
      reloadReqs();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Survey Requirement', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditRequirement = requirement => {
    setFormValues({
      id: requirement.id, requirement_name: requirement.requirement_name || '', requirement_type: requirement.requirement_type || '',
      status: requirement.status || '', notes: requirement.notes || '', is_mandatory: !!requirement.is_mandatory,
    });
    setModal('edit-req');
  };

  const updateInstrument = async () => {
    const body = form.values;
    const missing = REQUIRED_BY_PATH['/sia/survey-instruments'].filter(field => {
      const value = body[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/survey-instruments/${encodeURIComponent(form.values.id)}`, cleaned);
      notifications.show({ title: 'Survey Instrument updated', message: 'The survey instrument details were saved successfully.', color: 'green' });
      reloadInst();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Survey Instrument', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditInstrument = instrument => {
    setFormValues({
      id: instrument.id, instrument_name: instrument.instrument_name || '', instrument_type: instrument.instrument_type || '',
      serial_number: instrument.serial_number || '', calibration_status: instrument.calibration_status || '', required: !!instrument.required,
    });
    setModal('edit-instrument');
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const surveySections = [
                  { value: 'buildings', label: 'Buildings',     icon: <IconBuilding size={14} />,  enabled: true },
                  { value: 'rooms',     label: 'Room / Areas',  icon: <IconDoor size={14} />,      enabled: !!selectedBuilding },
                  { value: 'pois',      label: 'POIs',          icon: <IconLocation size={14} />,  enabled: true },
                  { value: 'visits',    label: 'Survey Visits', icon: <IconCalendar size={14} />,  enabled: true },
                  { value: 'access',    label: 'Access',        icon: <IconLock size={14} />,      enabled: true },
                  { value: 'safety',    label: 'Safety',        icon: <IconShield size={14} />,    enabled: true },
                  { value: 'reqs',      label: 'Requirements',  icon: <IconClipboard size={14} />, enabled: true },
                  { value: 'instruments', label: 'Instruments', icon: <IconTool size={14} />,      enabled: true },
                  { value: 'report', label: 'Report', icon: <IconFileText size={14} />, enabled: true },
                ];

  return (
    <Box className={styles.root} p={{ base: 0, sm: 'xs', lg: 'lg' }}>

      {/* â”€â”€ Page header â”€â”€ */}
      <Box mb="md">
        <Group gap="sm" mb={4}>
          <Badge color="green" variant="light" size="lg" radius="sm">SIA</Badge>
          <Text size="xs" c="dimmed" fw={500}>Module 1 Â· Section 2</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">Sites and Survey</Title>
        <Text size="sm" c="#6b7280" mt={2}>
          Select a case, choose a site, then manage buildings, rooms, visits and more.
        </Text>
      </Box>

      {/* â”€â”€ Breadcrumb â”€â”€ */}
      <Breadcrumb
        step={step}
        caseObj={activeCase}
        site={selectedSite}
        onCase={() => { setStep('case'); setSelectedSite(null); setSelectedBuilding(null); setSelectedVisit(null); }}
        onSites={() => { setStep('sites'); setSelectedSite(null); setSelectedBuilding(null); setSelectedVisit(null); }}
      />

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          STEP 1 â€” Select SIA Case
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {step === 'case' && (
        <Paper p={{ base: 'md', sm: 'lg' }} style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
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
              aria-label="Search cases" placeholder="Search by case code, purpose or stageâ€¦"
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
                <ResponsiveTable verticalSpacing="sm" horizontalSpacing="md">
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
                          <Table.Td><Text size="sm" c="#374151">{c.assessment_purpose || 'â€”'}</Text></Table.Td>
                          <Table.Td>
                            <Badge size="sm" radius="xl" variant="light" color="green">
                              {c.assessment_stage || 'â€”'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="#6b7280" style={{ fontFamily: 'monospace' }}>
                              {c.opportunity_id || 'â€”'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="#9ca3af">
                              {formatDate(c.created_at)}
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
                </ResponsiveTable>
              )}
          </Paper>

          <Group className={styles.actions} justify="space-between" align="center" mt="md">
            <Text size="xs" c="dimmed">
              {pendingCase
                ? <><Text span fw={600} c="#007336">{pendingCase.case_code}</Text> selected â€” click Continue</>
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          STEP 2 â€” Sites under the selected case
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
          <Paper p={{ base: 'md', sm: 'lg' }} style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <Group className={styles.actions} justify="space-between" align="center" mb="sm">
              <Group gap="xs">
                <IconMapPin size={16} color="#007336" />
                <Title order={4} fw={600} c="#111827">Sites</Title>
                <Badge size="sm" variant="light" color="green">{sites.length}</Badge>
              </Group>
              <Group gap="sm">
                <Group gap="xs" align="center">
                  <IconSearch size={13} color="#9ca3af" />
                  <TextInput
                    className={styles.siteSearch} aria-label="Search sites" placeholder="Search sitesâ€¦"
                    value={siteSearch}
                    onChange={e => setSiteSearch(e.target.value)}
                    size="xs"
                    styles={{ input: { borderColor: '#d1d5db', borderRadius: 6 } }}
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
                <ResponsiveTable verticalSpacing="sm" horizontalSpacing="md">
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
                          <Table.Td><Text size="sm" fw={500} c="#111827">{s.site_name || 'â€”'}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#6b7280">{s.site_type || 'â€”'}</Text></Table.Td>
                          <Table.Td><StatusBadge v={s.status} /></Table.Td>
                          <Table.Td><Text size="xs" c="#6b7280">{s.contact_name || 'â€”'}</Text></Table.Td>
                          <Table.Td>
                            <Text size="xs" c="#9ca3af">
                              {s.latitude != null ? `${s.latitude}, ${s.longitude}` : 'â€”'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4} justify="flex-end">
                              <Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={12} />}
                                onClick={e => { e.stopPropagation(); openEditSite(s); }}>
                                Edit
                              </Button>
                      <Button size="xs" variant="subtle" color="green" rightSection={<IconArrowRight size={12} />}
                                onClick={e => { e.stopPropagation(); confirmSite(s); }}>
                                Open
                              </Button>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                  </Table.Tbody>
                </ResponsiveTable>
              )}
          </Paper>
        </Box>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          STEP 3 â€” Survey: tabs for buildings, rooms, etc.
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
                â† Back to Sites
              </Button>
            </Group>
          </Paper>

          {/* Survey tabs */}
          <Group justify="flex-end" mb="md">
            <Button color="green" variant="light" leftSection={<IconFileText size={16} />} onClick={() => setSurveyTab('report')}>View site report</Button>
          </Group>
          <Tabs value={surveyTab} onChange={setSurveyTab} color="green">

            <Select className={styles.sectionSelect} label="Survey section" mb="md" value={surveyTab}
              onChange={value => value && setSurveyTab(value)} allowDeselect={false}
              data={surveySections.map(section => ({ value: section.value, label: section.label, disabled: !section.enabled }))} />
            {/* Step-flow tab bar */}
            <Box className={styles.sectionStrip} mb="md" style={{ overflowX: 'auto' }}>
              <Group gap={0} wrap="nowrap" style={{ minWidth: 'max-content' }}>
                {surveySections.map((tab, idx, arr) => {
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
              {['buildings','rooms','pois','visits','access','safety','reqs','instruments','report'].map(v =>
                <Tabs.Tab key={v} value={v}>{v}</Tabs.Tab>
              )}
            </Tabs.List>

            {/* â”€â”€ Buildings â”€â”€ */}
            <Tabs.Panel value="buildings">
              <TabHeader title="Buildings" onAdd={() => openModal('building')} addLabel="Add Building" />
              <DataTable loading={buildingsL} cols={['Code', 'Name', 'Type', 'Floors', 'Description', '']}
                rows={buildings} render={b => (
                  <Table.Tr key={b.id}
                    style={{ cursor: 'pointer', transition: 'background 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => { setSelectedBuilding(b); setSurveyTab('rooms'); }}>
                    <Table.Td><Text size="sm" fw={700} c="#007336">{b.building_code || 'â€”'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{b.building_name || 'â€”'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{b.building_type || 'â€”'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{b.floor_count ?? 'â€”'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#9ca3af">{b.description || 'â€”'}</Text></Table.Td>
                    <Table.Td>
                      <Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={12} />}
                        onClick={e => { e.stopPropagation(); openEditBuilding(b); }}>
                        Edit
                      </Button>
                      <Button size="xs" variant="subtle" color="green" rightSection={<IconArrowRight size={12} />}
                        onClick={e => { e.stopPropagation(); setSelectedBuilding(b); setSurveyTab('rooms'); }}>
                        Rooms
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                )} />
            </Tabs.Panel>

            {/* â”€â”€ Room Areas â”€â”€ */}
            <Tabs.Panel value="rooms">
              {!selectedBuilding
                ? <Paper p="md" style={{ border: '1px dashed #d1d5db', borderRadius: 8, textAlign: 'center' }}>
                    <Text size="sm" c="dimmed">Select a building from the Buildings tab first.</Text>
                    <Button size="xs" mt="sm" variant="subtle" color="green" onClick={() => setSurveyTab('buildings')}>â† Go to Buildings</Button>
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
                    <DataTable loading={roomsL} cols={['Code', 'Name', 'Type', 'Floor', 'Description', '']}
                      rows={roomAreas} render={r => (
                        <Table.Tr key={r.id}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <Table.Td><Text size="sm" fw={600} c="#007336">{r.area_code || 'â€”'}</Text></Table.Td>
                          <Table.Td><Text size="sm">{r.area_name || 'â€”'}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#6b7280">{r.area_type || 'â€”'}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#6b7280">{r.floor_level || 'â€”'}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#9ca3af">{r.description || 'â€”'}</Text></Table.Td>
                          <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={12} />}
                            onClick={() => openEditRoom(r)}>Edit</Button></Table.Td>
                        </Table.Tr>
                      )} />
                  </>}
            </Tabs.Panel>

            {/* â”€â”€ POIs â”€â”€ */}
            <Tabs.Panel value="pois">
              <TabHeader title="Points of Interest" onAdd={() => openModal('poi')} addLabel="Add POI" />
              <DataTable loading={poisL} cols={['Code', 'Name', 'Type', 'Category', 'Lat', 'Lng', '']}
                rows={pois} render={p => (
                  <Table.Tr key={p.id}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <Table.Td><Text size="sm" fw={600} c="#007336">{p.poi_code || 'â€”'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{p.poi_name || 'â€”'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{p.poi_type || 'â€”'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{p.category || 'â€”'}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="#9ca3af">{p.latitude ?? 'â€”'}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="#9ca3af">{p.longitude ?? 'â€”'}</Text></Table.Td>
                    <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={12} />}
                      onClick={() => openEditPoi(p)}>Edit</Button></Table.Td>
                  </Table.Tr>
                )} />
            </Tabs.Panel>

            {/* â”€â”€ Survey Visits â”€â”€ */}
            <Tabs.Panel value="visits">
              <TabHeader title="Survey Visits" onAdd={() => openModal('visit')} addLabel="Add Visit" />
              <DataTable loading={visitsL} cols={['Code', 'Type', 'Purpose', 'Planned Date', 'Status', '']}
                rows={visits} render={v => (
                  <Table.Tr key={v.id}
                    style={{ cursor: 'pointer', transition: 'background 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => { setSelectedVisit(v); localStorage.setItem('sia_survey_visit_id', v.id); setSurveyTab('reqs'); }}>
                    <Table.Td><Text size="sm" fw={700} c="#007336">{v.visit_code || 'â€”'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{v.visit_type || 'â€”'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{v.purpose || 'â€”'}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="#6b7280">{formatDisplayValue(v.planned_date || 'â€”')}</Text></Table.Td>
                    <Table.Td><StatusBadge v={v.status} /></Table.Td>
                    <Table.Td>
                      <Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={12} />}
                        onClick={e => { e.stopPropagation(); openEditVisit(v); }}>
                        Edit
                      </Button>
                      <Button size="xs" variant="subtle" color="green" rightSection={<IconArrowRight size={12} />}
                        onClick={e => { e.stopPropagation(); setSelectedVisit(v); localStorage.setItem('sia_survey_visit_id', v.id); setSurveyTab('reqs'); }}>
                        Open
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                )} />
            </Tabs.Panel>


            {/* â”€â”€ Site Access â”€â”€ */}
            <Tabs.Panel value="access">
              <TabHeader title="Site Access" onAdd={() => openModal('access')} addLabel="Add Access Record" />
              <DataTable loading={accessL} cols={['Access Type', 'Road Condition', 'Transport', 'Entry Permission', 'Working Hours', '']}
                rows={access} render={a => (
                  <Table.Tr key={a.id}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <Table.Td><Text size="sm">{a.access_type || 'â€”'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{a.road_condition || 'â€”'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{a.transport_method || 'â€”'}</Text></Table.Td>
                    <Table.Td><Badge size="sm" color={a.entry_permission ? 'green' : 'red'} variant="light">{a.entry_permission ? 'Permitted' : 'Denied'}</Badge></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{a.working_hours || 'â€”'}</Text></Table.Td>
                    <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={12} />}
                      onClick={() => openEditAccess(a)}>Edit</Button></Table.Td>
                  </Table.Tr>
                )} />
            </Tabs.Panel>

            {/* â”€â”€ Site Safety â”€â”€ */}
            <Tabs.Panel value="safety">
              <TabHeader title="Site Safety" onAdd={() => openModal('safety')} addLabel="Add Safety Record" />
              <DataTable loading={safetyL} cols={['Hazard Type', 'Risk Level', 'PPE Required', 'Restricted', 'Emergency Contact', '']}
                rows={safety} render={s => (
                  <Table.Tr key={s.id}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <Table.Td><Text size="sm">{s.hazard_type || 'â€”'}</Text></Table.Td>
                    <Table.Td><RiskBadge v={s.risk_level} /></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{s.ppe_required || 'â€”'}</Text></Table.Td>
                    <Table.Td><Badge size="sm" color={s.restricted_area ? 'red' : 'green'} variant="light">{s.restricted_area ? 'Yes' : 'No'}</Badge></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{s.emergency_contact || 'â€”'}</Text></Table.Td>
                    <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={12} />}
                      onClick={() => openEditSafety(s)}>Edit</Button></Table.Td>
                  </Table.Tr>
                )} />
            </Tabs.Panel>

            {/* â”€â”€ Requirements â”€â”€ */}
            <Tabs.Panel value="reqs">
              {!selectedVisit
                ? <Paper p="md" style={{ border: '1px dashed #d1d5db', borderRadius: 8, textAlign: 'center' }}>
                    <Text size="sm" c="dimmed">Select a visit from Survey Visits first.</Text>
                    <Button size="xs" mt="sm" variant="subtle" color="green" onClick={() => setSurveyTab('visits')}>â† Go to Visits</Button>
                  </Paper>
                : <>
                    <VisitBanner visit={selectedVisit} onClear={() => setSelectedVisit(null)} />
                    <TabHeader title="Survey Requirements" onAdd={() => openModal('req')} addLabel="Add Requirement" />
                    <DataTable loading={reqsL} cols={['Name', 'Type', 'Mandatory', 'Status', '']}
                      rows={reqs} render={r => (
                        <Table.Tr key={r.id}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <Table.Td><Text size="sm">{r.requirement_name || 'â€”'}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#6b7280">{r.requirement_type || 'â€”'}</Text></Table.Td>
                          <Table.Td><Badge size="sm" color={r.is_mandatory ? 'red' : 'gray'} variant="light">{r.is_mandatory ? 'Mandatory' : 'Optional'}</Badge></Table.Td>
                          <Table.Td><StatusBadge v={r.status} /></Table.Td>
                          <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={12} />}
                            onClick={() => openEditRequirement(r)}>Edit</Button></Table.Td>
                        </Table.Tr>
                      )} />
                  </>}
            </Tabs.Panel>

            {/* â”€â”€ Instruments â”€â”€ */}
            <Tabs.Panel value="instruments">
              {!selectedVisit
                ? <Paper p="md" style={{ border: '1px dashed #d1d5db', borderRadius: 8, textAlign: 'center' }}>
                    <Text size="sm" c="dimmed">Select a visit from Survey Visits first.</Text>
                    <Button size="xs" mt="sm" variant="subtle" color="green" onClick={() => setSurveyTab('visits')}>â† Go to Visits</Button>
                  </Paper>
                : <>
                    <VisitBanner visit={selectedVisit} onClear={() => setSelectedVisit(null)} />
                    <TabHeader title="Survey Instruments" onAdd={() => openModal('instrument')} addLabel="Add Instrument" />
                    <DataTable loading={instL} cols={['Name', 'Type', 'Serial No', 'Calibration', 'Required', '']}
                      rows={instruments} render={i => (
                        <Table.Tr key={i.id}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <Table.Td><Text size="sm">{i.instrument_name || 'â€”'}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#6b7280">{i.instrument_type || 'â€”'}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="#6b7280">{i.serial_number || 'â€”'}</Text></Table.Td>
                          <Table.Td><StatusBadge v={i.calibration_status} /></Table.Td>
                          <Table.Td><Badge size="sm" color={i.required ? 'green' : 'gray'} variant="light">{i.required ? 'Yes' : 'No'}</Badge></Table.Td>
                          <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={12} />}
                            onClick={() => openEditInstrument(i)}>Edit</Button></Table.Td>
                        </Table.Tr>
                      )} />
                  </>}
            </Tabs.Panel>

            {surveyTab === 'instruments' && <Group justify="flex-end" mt="lg"><Button color="green" rightSection={<IconArrowRight size={16} />} onClick={() => setSurveyTab('report')}>Continue to Report</Button></Group>}
            <Tabs.Panel value="report">
              {surveyTab === 'report' && <SIASitesSurveyReport api={API} siaCase={activeCase} siteId={selectedSite.id} />}
            </Tabs.Panel>
          </Tabs>
        </Box>
      )}

      {/* â•â•â•â• MODALS â•â•â•â• */}

      {/* Site Modal */}
      <FormModal opened={modal === 'site'} onClose={closeModal} title="Add Site" saving={saving}
        onSubmit={() => save('/sia/sites', { sia_case_id: siaCaseId, ...form.values }, reloadSites)}>
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

      <FormModal opened={modal === 'edit-site'} onClose={closeModal} title="Edit Site" saving={saving} onSubmit={updateSite}>
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
          <FI label="Building Name" field="building_name" form={form} />
        </FormRow>
        <FormRow>
          <FI label="Building Type" field="building_type" form={form} />
          <FI label="Floor Count" field="floor_count" form={form} number />
        </FormRow>
        <FI label="Description" field="description" form={form} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-building'} onClose={closeModal} title="Edit Building" saving={saving} onSubmit={updateBuilding}>
        <FormRow>
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
          <FI label="Area Name" field="area_name" form={form} />
        </FormRow>
        <FormRow>
          <FI label="Area Type" field="area_type" form={form} />
          <FI label="Floor Level" field="floor_level" form={form} select={FLOOR_LEVELS} />
        </FormRow>
        <FI label="Description" field="description" form={form} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-room'} onClose={closeModal} title="Edit Room / Area" saving={saving} onSubmit={updateRoom}>
        <FormRow>
          <FI label="Area Name" field="area_name" form={form} />
        </FormRow>
        <FormRow>
          <FI label="Area Type" field="area_type" form={form} />
          <FI label="Floor Level" field="floor_level" form={form} select={FLOOR_LEVELS} />
        </FormRow>
        <FI label="Description" field="description" form={form} textarea />
      </FormModal>

      {/* POI Modal */}
      <FormModal opened={modal === 'poi'} onClose={closeModal} title="Add Point of Interest" saving={saving}
        onSubmit={() => save('/sia/pois', { site_id: selectedSite?.id, ...form.values }, reloadPois)}>
        <FormRow>
          <FI label="POI Name" field="poi_name" form={form} />
        </FormRow>
        <FormRow>
          <FI label="POI Type" field="poi_type" form={form} />
          <FI label="Category" field="category" form={form} select={POI_CATEGORIES} />
        </FormRow>
        <FormRow>
          <FI label="Latitude" field="latitude" form={form} number />
          <FI label="Longitude" field="longitude" form={form} number />
        </FormRow>
        <FI label="Description" field="description" form={form} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-poi'} onClose={closeModal} title="Edit Point of Interest" saving={saving} onSubmit={updatePoi}>
        <FormRow>
          <FI label="POI Name" field="poi_name" form={form} />
        </FormRow>
        <FormRow>
          <FI label="POI Type" field="poi_type" form={form} />
          <FI label="Category" field="category" form={form} select={POI_CATEGORIES} />
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
          <FI label="Visit Type" field="visit_type" form={form} />
        </FormRow>
        <FI label="Purpose" field="purpose" form={form} />
        <FI label="Planned Date (DD/MMM/YYYY)" field="planned_date" form={form} />
        <Text size="xs" c="dimmed">Initial status: <Text span fw={700} c="green.8">Planned</Text>. Status is updated automatically as the survey workflow progresses.</Text>
      </FormModal>

      <FormModal opened={modal === 'edit-visit'} onClose={closeModal} title="Edit Survey Visit" saving={saving} onSubmit={updateVisit}>
        <FormRow>
          <FI label="Visit Type" field="visit_type" form={form} />
        </FormRow>
        <FI label="Purpose" field="purpose" form={form} />
        <FI label="Planned Date (DD/MMM/YYYY)" field="planned_date" form={form} />
        <FormRow>
          <FI label="Planned Start Time" field="planned_start_time" form={form} />
          <FI label="Planned End Time" field="planned_end_time" form={form} />
        </FormRow>
        <FormRow>
          <FI label="Actual Start" field="actual_start" form={form} />
          <FI label="Actual End" field="actual_end" form={form} />
        </FormRow>
        <Text size="xs" c="dimmed">Status is workflow-managed and cannot be edited here.</Text>
      </FormModal>


      {/* Access Modal */}
      <FormModal opened={modal === 'access'} onClose={closeModal} title="Add Site Access" saving={saving}
        onSubmit={() => save('/sia/site-access', { site_id: selectedSite?.id, ...form.values, working_hours: String(form.values.working_hours ?? '') }, reloadAccess)}>
        <FormRow>
          <FI label="Access Type" field="access_type" form={form} />
          <FI label="Road Condition" field="road_condition" form={form} select={['Good', 'Fair', 'Poor', 'Under Construction', 'Impassable', 'Not Applicable']} />
        </FormRow>
        <FormRow>
          <FI label="Transport Method" field="transport_method" form={form} select={['Car', '4WD / SUV', 'Motorcycle', 'Van / Minibus', 'Bus', 'Truck', 'Boat', 'On Foot', 'Other']} />
          <FI label="Working Hours" field="working_hours" form={form} number min={0} />
        </FormRow>
        <FI label="Access Restriction" field="access_restriction" form={form} textarea />
        <FI label="Logistics Notes" field="logistics_notes" form={form} textarea />
        <Group mt="sm">
          <Text size="xs" fw={600} c="#374151">Entry Permission</Text>
          <Switch checked={!!form.values.entry_permission} onChange={e => form.setFieldValue('entry_permission', e.currentTarget.checked)} color="green" />
        </Group>
      </FormModal>

      <FormModal opened={modal === 'edit-access'} onClose={closeModal} title="Edit Site Access" saving={saving} onSubmit={updateAccess}>
        <FormRow>
          <FI label="Access Type" field="access_type" form={form} />
          <FI label="Road Condition" field="road_condition" form={form} select={['Good', 'Fair', 'Poor', 'Under Construction', 'Impassable', 'Not Applicable']} />
        </FormRow>
        <FormRow>
          <FI label="Transport Method" field="transport_method" form={form} select={['Car', '4WD / SUV', 'Motorcycle', 'Van / Minibus', 'Bus', 'Truck', 'Boat', 'On Foot', 'Other']} />
          <FI label="Working Hours" field="working_hours" form={form} number min={0} />
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

      <FormModal opened={modal === 'edit-safety'} onClose={closeModal} title="Edit Site Safety" saving={saving} onSubmit={updateSafety}>
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

      <FormModal opened={modal === 'edit-req'} onClose={closeModal} title="Edit Survey Requirement" saving={saving} onSubmit={updateRequirement}>
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
          <FI label="Serial Number" field="serial_number" form={form} digitsOnly />
          <FI label="Calibration Status" field="calibration_status" form={form}
            select={['Valid', 'Expired', 'Pending', 'Unknown']} />
        </FormRow>
        <Group mt="sm">
          <Text size="xs" fw={600} c="#374151">Required</Text>
          <Switch checked={!!form.values.required} onChange={e => form.setFieldValue('required', e.currentTarget.checked)} color="green" />
        </Group>
      </FormModal>

      <FormModal opened={modal === 'edit-instrument'} onClose={closeModal} title="Edit Survey Instrument" saving={saving} onSubmit={updateInstrument}>
        <FormRow>
          <FI label="Instrument Name" field="instrument_name" form={form} />
          <FI label="Instrument Type" field="instrument_type" form={form} />
        </FormRow>
        <FormRow>
          <FI label="Serial Number" field="serial_number" form={form} digitsOnly />
          <FI label="Calibration Status" field="calibration_status" form={form} select={['Valid', 'Expired', 'Pending', 'Unknown']} />
        </FormRow>
        <Group mt="sm">
          <Text size="xs" fw={600} c="#374151">Required</Text>
          <Switch checked={!!form.values.required} onChange={e => form.setFieldValue('required', e.currentTarget.checked)} color="green" />
        </Group>
      </FormModal>

    </Box>
  );
}

// â”€â”€ small inline component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function VisitBanner({ visit, onClear }) {
  return (
    <Paper p="xs" mb="sm" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
      <Group gap="xs">
        <IconCalendar size={13} color="#007336" />
        <Text size="xs" c="#374151">Visit: <Text span fw={600} c="#007336">{visit.visit_code}</Text></Text>
        {visit.visit_type && <Text size="xs" c="#6b7280">Â· {visit.visit_type}</Text>}
        {visit.planned_date && <Text size="xs" c="#9ca3af">Â· {formatDisplayValue(visit.planned_date)}</Text>}
        <StatusBadge v={visit.status} />
        <Text size="xs" c="#9ca3af" style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={onClear}>Clear</Text>
      </Group>
    </Paper>
  );
}



