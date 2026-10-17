import { formatDateTime, formatDisplayValue } from '../utils/dateOnly';
import React, { Children, cloneElement, isValidElement, useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader, Modal,
  Paper, Select, Stack, Tabs, Table, Text, Textarea,
  TextInput, Title, NumberInput, Switch,
} from '@mantine/core';
import DatePickerInput from '../components/common/DatePickerInput';
import { getFieldOptions } from '../constants/fieldOptions';
import SIAEngineeringAssessmentReport from '../components/common/SIAEngineeringAssessmentReport';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconBolt, IconBuildingBridge, IconBuildingSkyscraper,
  IconEngine, IconDroplet, IconRadar, IconShield,
  IconBuildingFactory2, IconAlertTriangle, IconAlertCircle, IconUserCheck, IconFileText, IconArrowRight,
  IconEdit,
} from '@tabler/icons-react';
import SIAStepFlow from '../components/common/SIAStepFlow';
import { autoCode } from '../utils/autoCode';
import styles from './SIAEngineeringAssessmentLayout.module.css';
import useDisciplines from '../hooks/useDisciplines';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const thS = { fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' };

const assessmentSections = [
              { value:'electrical',  label:'Electrical',     icon:<IconBolt size={13}/>,              enabled:true },
              { value:'civil',       label:'Civil',          icon:<IconBuildingBridge size={13}/>,    enabled:true },
              { value:'structural',  label:'Structural',     icon:<IconBuildingSkyscraper size={13}/>,enabled:true },
              { value:'mechanical',  label:'Mechanical',     icon:<IconEngine size={13}/>,            enabled:true },
              { value:'water',       label:'Water Pumping',  icon:<IconDroplet size={13}/>,           enabled:true },
              { value:'scada',       label:'SCADA',          icon:<IconRadar size={13}/>,             enabled:true },
              { value:'hse',         label:'HSE / Env',      icon:<IconShield size={13}/>,            enabled:true },
              { value:'industrial',  label:'Industrial',     icon:<IconBuildingFactory2 size={13}/>,  enabled:true },
              { value:'findings',    label:'Findings',       icon:<IconAlertTriangle size={13}/>,     enabled:true },
              { value:'gaps',        label:'Gaps',           icon:<IconAlertCircle size={13}/>,       enabled:true },
              { value:'reviews',     label:'Reviews',        icon:<IconUserCheck size={13}/>,         enabled:true },
              { value:'report',      label:'Report',         icon:<IconFileText size={13}/>,          enabled:true },
            ];

const STATUS_OPTS = ['Draft', 'In Progress', 'Completed', 'Verified', 'Rejected'];
const RELIABILITY = ['Confirmed', 'Estimated', 'Unverified', 'Not Assessed'];

const REQUIRED_BY_PATH = {
  '/sia/engineering-assessments': ['discipline', 'assessment_date', 'status', 'reliability_status', 'summary'],
  '/sia/electrical-assessments': ['supply_type', 'voltage', 'phase', 'frequency', 'utility_condition'],
  '/sia/civil-assessments': ['ground_condition', 'foundation_condition', 'drainage_condition', 'road_condition', 'erosion_risk', 'flood_risk'],
  '/sia/structural-assessments': ['structure_type', 'roof_type', 'material_type', 'structural_condition', 'roof_condition', 'support_condition'],
  '/sia/mechanical-assessments': ['equipment_zone', 'plant_condition', 'ventilation_condition', 'lifting_access', 'maintenance_access', 'pipework_condition'],
  '/sia/water-pumping-assessments': ['water_source_type', 'daily_water_demand', 'pipe_material', 'pump_make_model', 'pump_condition'],
  '/sia/scada-assessments': ['control_system_type', 'communication_type', 'protocol_details', 'connectivity_condition'],
  '/sia/hse-assessments': ['hazard_level', 'fire_risk', 'emergency_access', 'electrical_safety', 'roof_safety', 'environmental_condition'],
  '/sia/industrial-assessments': ['equipment_name', 'process_type', 'operating_hours', 'duty_cycle', 'criticality'],
  '/sia/engineering-findings': ['finding_type', 'severity', 'reliability_status', 'status', 'description', 'recommendation'],
  '/sia/engineering-gaps': ['gap_type', 'priority', 'status', 'target_date', 'description'],
  '/sia/engineering-reviews': ['review_status', 'verification_status', 'review_comment'],
};
const MANDATORY_FIELDS = new Set(Object.values(REQUIRED_BY_PATH).flat());

// â”€â”€ tiny hooks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useApi(url, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const urlRef = React.useRef(url);
  urlRef.current = url;
  const reload = React.useCallback(() => {
    if (!urlRef.current) return;
    setLoading(true);
    fetch(urlRef.current).then(r => r.json()).then(d => setData(Array.isArray(d) ? d : [])).catch(() => { }).finally(() => setLoading(false));
  }, []); // eslint-disable-line
  useEffect(() => { reload(); }, deps); // eslint-disable-line
  return { data, loading, reload };
}

async function postApi(path, body) {
  const cleaned = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, v === '' ? null : v]));
  const res = await fetch(`${API}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleaned),
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

// â”€â”€ reusable sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EmptyRow({ cols }) {
  return <Table.Tr><Table.Td colSpan={cols} style={{ textAlign: 'center', padding: '30px 0' }}><Text size="sm" c="dimmed">No records found.</Text></Table.Td></Table.Tr>;
}
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

function DataTable({ loading, cols, rows, render }) {
  return (
    <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 8, position: 'relative', minHeight: 120 }}>
      {loading && <Group justify="center" py="xl"><Loader color="green" size="sm" /></Group>}
      {!loading && <ResponsiveTable verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
          <Table.Tr>{cols.map(c => <Table.Th key={c} style={thS}>{c}</Table.Th>)}</Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows.length === 0 ? <EmptyRow cols={cols.length} /> : rows.map(render)}</Table.Tbody>
      </ResponsiveTable>}
    </Paper>
  );
}
function TabHeader({ title, onAdd, addLabel, disabled = false }) {
  return (
    <Group className={styles.actions} justify="space-between" mb="sm">
      <Text fw={600} size="sm" c="#374151">{title}</Text>
      <Button size="xs" color="green" leftSection={<IconPlus size={13} />} disabled={disabled}
        onClick={onAdd} style={{ backgroundColor: disabled ? undefined : '#007336' }}>{addLabel}</Button>
    </Group>
  );
}
function FormModal({ opened, onClose, title, saving, onSubmit, children }) {
  return (
    <Modal classNames={{ content: styles.modal }} opened={opened} onClose={onClose} title={<Text fw={700} size="sm">{title}</Text>} size="lg">
      <Stack gap="sm">
        {children}
        <Group className={styles.actions} justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="green" loading={saving} onClick={onSubmit} style={{ backgroundColor: '#007336' }}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
function FormRow({ children }) { return <Box className={styles.formRow}>{children}</Box>; }
function FI({ label, field, fv, setFv, textarea, number, select, readonly }) {
  const val = fv[field] ?? '';
  const onChange = v => setFv(p => ({ ...p, [field]: v }));
  const displayLabel = MANDATORY_FIELDS.has(field) ? `${label} *` : label;
  
  // Auto-detect Type, Role, and Date fields
  const fieldLower = field.toLowerCase();
  const isTypeOrRoleField = fieldLower.includes('type') || fieldLower.includes('role');
  const isDateField = fieldLower.includes('date') || fieldLower.includes('_at');
  const getTypeRoleOptions = (fieldName) => {
    const opts = {
      assessment_type: ['Technical', 'Commercial', 'Environmental', 'Safety', 'Quality'],
      role: ['Lead Engineer', 'Reviewer', 'Approver', 'Consultant', 'Team Member'],
    };
    return opts[fieldName] || [];
  };
  const autoOpts = getFieldOptions(field).length ? getFieldOptions(field) : getTypeRoleOptions(field);
  
  const s = { input: { borderColor: readonly ? '#bbf7d0' : '#d1d5db', borderRadius: 6, minHeight: 44, backgroundColor: readonly ? '#f0fdf4' : undefined } };
  if (select) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{displayLabel}</Text><Select aria-label={label} data={select} value={val} onChange={v => onChange(v || '')} clearable styles={s} /></Box>;
  if (textarea) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{displayLabel}</Text><Textarea aria-label={label} value={val} onChange={e => onChange(e.target.value)} autosize minRows={2} styles={s} /></Box>;
  if (number) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{displayLabel}</Text><NumberInput aria-label={label} value={val === '' ? undefined : val} onChange={v => onChange(v)} styles={s} /></Box>;
  
  if (isDateField) return <DatePickerInput label={displayLabel} value={val} onChange={onChange} styles={s} />;
  
  // Convert Type and Role fields to dropdowns
  if (autoOpts.length > 0) {
    return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{displayLabel}</Text><Select aria-label={label} data={autoOpts} value={val || null} onChange={v => onChange(v || '')} clearable searchable placeholder={`Select ${label}`} styles={s} /></Box>;
  }
  
  return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{displayLabel}</Text><TextInput aria-label={label} value={val} onChange={e => onChange(e.target.value)} readOnly={readonly} styles={s} /></Box>;
}
function SBadge({ v }) {
  const m = { completed: '#007336', verified: '#007336', confirmed: '#007336', draft: '#6b7280', 'in progress': '#1971c2', rejected: '#e03131', unverified: '#f08c00', estimated: '#f08c00', 'not assessed': '#6b7280' };
  const col = m[(v || '').toLowerCase()] || '#6b7280';
  return <Badge size="sm" radius="xl" style={{ backgroundColor: col + '18', color: col, border: 'none', fontWeight: 600 }}>{v || 'â€”'}</Badge>;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function SIAEngineeringAssessmentLayout() {
  const { names: disciplineNames } = useDisciplines();
  // â”€â”€ EA lookup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [eaId, setEaId] = useState('');
  const [caseId, setCaseId] = useState(() => localStorage.getItem('sia_case_id') || '');
  const [loadedCaseId, setLoaded] = useState(() => localStorage.getItem('sia_case_id') || '');
  const [eaList, setEaList] = useState([]);
  const [eaLoading, setEaL] = useState(false);
  const [selectedEa, setEa] = useState(null);
  const [activeTab, setTab] = useState('overview');
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fv, setFv] = useState({});
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState('');
  const [sitesLoading, setSitesLoading] = useState(Boolean(caseId));
  const [sitesError, setSitesError] = useState('');
  const [sitesReload, setSitesReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setSites([]);
    setSiteId('');
    setSitesError('');
    setSitesLoading(Boolean(caseId));
    if (!caseId) return () => controller.abort();
    fetch(`${API}/sia/cases/${encodeURIComponent(caseId)}/sites`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Unable to load sites. Please try Reload.');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Unable to load sites. Please try Reload.');
        return data.filter(site => typeof site.id === 'string' && site.id.trim() && site.sia_case_id === caseId);
      })
      .then(rows => {
        if (controller.signal.aborted) return;
        const remembered = localStorage.getItem('sia_site_id');
        const selected = rows.find(site => site.id === remembered) || (rows.length === 1 ? rows[0] : null);
        setSites(rows);
        setSiteId(selected?.id || '');
        if (selected) localStorage.setItem('sia_site_id', selected.id);
        else localStorage.removeItem('sia_site_id');
      })
      .catch(error => { if (!controller.signal.aborted) setSitesError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setSitesLoading(false); });
    return () => controller.abort();
  }, [caseId, sitesReload]);

  const selectedSite = sites.find(site => site.id === siteId);
  const canCreateAssessment = Boolean(caseId && selectedSite && !sitesLoading && !sitesError);
  const siteLabel = site => [site.site_code, site.site_name].filter(Boolean).join(' / ') || 'Unnamed site';

  const loadByCaseId = (id) => {
    const cid = id || localStorage.getItem('sia_case_id') || '';
    if (!cid) return;
    setCaseId(cid);
    setEaL(true);
    fetch(`${API}/sia/cases/${cid}/engineering-assessments`)
      .then(r => r.json()).then(d => setEaList(Array.isArray(d) ? d : [])).catch(() => { }).finally(() => setEaL(false));
  };

  // Auto-load on mount if case ID is already in storage
  useEffect(() => {
    const id = localStorage.getItem('sia_case_id');
    if (id) loadByCaseId(id);
  }, []); // eslint-disable-line

  // â”€â”€ child data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const eid = selectedEa?.id;
  const { data: electrical, loading: elecL, reload: rElec } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/electrical` : null, [eid]);
  const { data: civil, loading: civL, reload: rCivil } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/civil` : null, [eid]);
  const { data: structural, loading: strL, reload: rStruct } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/structural` : null, [eid]);
  const { data: mechanical, loading: mechL, reload: rMech } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/mechanical` : null, [eid]);
  const { data: water, loading: watL, reload: rWater } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/water-pumping` : null, [eid]);
  const { data: scada, loading: scaL, reload: rScada } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/scada` : null, [eid]);
  const { data: hse, loading: hseL, reload: rHse } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/hse` : null, [eid]);
  const { data: industrial, loading: indL, reload: rInd } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/industrial` : null, [eid]);
  const { data: findings, loading: findL, reload: rFind } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/findings` : null, [eid]);
  const { data: gaps, loading: gapL, reload: rGap } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/gaps` : null, [eid]);
  const { data: reviews, loading: revL, reload: rRev } = useApi(eid ? `${API}/sia/engineering-assessments/${eid}/reviews` : null, [eid]);

  const openModal = (key, defaults = {}) => {
    const codePrefills = {
      // assessment_code removed - now auto-generated by backend
    };
    setFv({ ...(codePrefills[key] || {}), ...defaults });
    setModal(key);
  };
  const closeModal = () => { setModal(null); setFv({}); };

  const save = async (path, body, reload) => {
    if (path === '/sia/engineering-assessments' && (!canCreateAssessment || body.site_id !== selectedSite.id)) {
      notifications.show({ title: 'Site required', message: 'Select a site for the active SIA case before creating an assessment.', color: 'red' });
      return;
    }
    const missing = (REQUIRED_BY_PATH[path] || []).filter(field => {
      const value = body[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({
        title: 'Required fields missing',
        message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`,
        color: 'orange',
      });
      return;
    }
    setSaving(true);
    try {
      await postApi(path, body);
      notifications.show({ title: 'Saved', message: 'Record created.', color: 'green' });
      reload(); closeModal();
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditAssessment = assessment => {
    setFv({
      id: assessment.id, discipline: assessment.discipline || '', assessment_date: assessment.assessment_date || '',
      assessed_by: assessment.assessed_by || '', reliability_status: assessment.reliability_status || '',
      status: assessment.status || '', summary: assessment.summary || '',
    });
    setModal('edit-ea');
  };

  const updateAssessment = async () => {
    const missing = REQUIRED_BY_PATH['/sia/engineering-assessments'].filter(field => {
      const value = fv[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(fv).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      const result = await patchApi(`/sia/engineering-assessments/${encodeURIComponent(fv.id)}`, body);
      setEa(result);
      notifications.show({ title: 'Assessment updated', message: 'The engineering assessment was saved successfully.', color: 'green' });
      loadByCaseId(caseId);
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update assessment', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditElectrical = record => {
    setFv({
      id: record.id, supply_type: record.supply_type || '', voltage: record.voltage ?? '', phase: record.phase || '',
      frequency: record.frequency ?? '', connected_load: record.connected_load ?? '', peak_load: record.peak_load ?? '',
      utility_condition: record.utility_condition || '', transformer_details: record.transformer_details || '',
      switchboard_details: record.switchboard_details || '', protection_details: record.protection_details || '', remarks: record.remarks || '',
    });
    setModal('edit-elec');
  };

  const updateElectrical = async () => {
    const missing = REQUIRED_BY_PATH['/sia/electrical-assessments'].filter(field => {
      const value = fv[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(fv).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/electrical-assessments/${encodeURIComponent(fv.id)}`, body);
      notifications.show({ title: 'Electrical Assessment updated', message: 'The electrical assessment was saved successfully.', color: 'green' });
      rElec();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Electrical Assessment', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditCivil = record => {
    setFv({
      id: record.id, ground_condition: record.ground_condition || '', foundation_condition: record.foundation_condition || '',
      drainage_condition: record.drainage_condition || '', road_condition: record.road_condition || '',
      erosion_risk: record.erosion_risk || '', flood_risk: record.flood_risk || '',
      trench_requirement: record.trench_requirement || '', route_constraint: record.route_constraint || '', remarks: record.remarks || '',
    });
    setModal('edit-civil');
  };

  const updateCivil = async () => {
    const missing = REQUIRED_BY_PATH['/sia/civil-assessments'].filter(field => {
      const value = fv[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(fv).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/civil-assessments/${encodeURIComponent(fv.id)}`, body);
      notifications.show({ title: 'Civil Assessment updated', message: 'The civil assessment was saved successfully.', color: 'green' });
      rCivil();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Civil Assessment', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditStructural = record => {
    setFv({
      id: record.id, structure_type: record.structure_type || '', roof_type: record.roof_type || '', material_type: record.material_type || '',
      structural_condition: record.structural_condition || '', roof_condition: record.roof_condition || '', support_condition: record.support_condition || '',
      visible_damage: record.visible_damage || '', loading_constraint: record.loading_constraint || '', remarks: record.remarks || '',
    });
    setModal('edit-structural');
  };

  const updateStructural = async () => {
    const missing = REQUIRED_BY_PATH['/sia/structural-assessments'].filter(field => {
      const value = fv[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(fv).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/structural-assessments/${encodeURIComponent(fv.id)}`, body);
      notifications.show({ title: 'Structural Assessment updated', message: 'The structural assessment was saved successfully.', color: 'green' });
      rStruct();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Structural Assessment', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditMechanical = record => {
    setFv({
      id: record.id, equipment_zone: record.equipment_zone || '', plant_condition: record.plant_condition || '',
      ventilation_condition: record.ventilation_condition || '', lifting_access: record.lifting_access || '',
      maintenance_access: record.maintenance_access || '', pipework_condition: record.pipework_condition || '',
      route_constraint: record.route_constraint || '', operational_constraint: record.operational_constraint || '', remarks: record.remarks || '',
    });
    setModal('edit-mechanical');
  };

  const updateMechanical = async () => {
    const missing = REQUIRED_BY_PATH['/sia/mechanical-assessments'].filter(field => {
      const value = fv[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(fv).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/mechanical-assessments/${encodeURIComponent(fv.id)}`, body);
      notifications.show({ title: 'Mechanical Assessment updated', message: 'The mechanical assessment was saved successfully.', color: 'green' });
      rMech();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Mechanical Assessment', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditWater = record => {
    setFv({
      id: record.id, water_source_type: record.water_source_type || '', daily_water_demand: record.daily_water_demand ?? '',
      source_water_level: record.source_water_level ?? '', delivery_elevation: record.delivery_elevation ?? '', route_length: record.route_length ?? '',
      pipe_diameter: record.pipe_diameter ?? '', pipe_material: record.pipe_material || '', pump_make_model: record.pump_make_model || '',
      pump_power_kw: record.pump_power_kw ?? '', pump_condition: record.pump_condition || '', tank_capacity: record.tank_capacity ?? '',
      required_pressure: record.required_pressure ?? '', controller_type: record.controller_type || '', monitoring_available: !!record.monitoring_available, remarks: record.remarks || '',
    });
    setModal('edit-water');
  };

  const updateWater = async () => {
    const missing = REQUIRED_BY_PATH['/sia/water-pumping-assessments'].filter(field => {
      const value = fv[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(fv).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/water-pumping-assessments/${encodeURIComponent(fv.id)}`, body);
      notifications.show({ title: 'Water Pumping Assessment updated', message: 'The water pumping assessment was saved successfully.', color: 'green' });
      rWater();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Water Pumping Assessment', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditScada = record => {
    setFv({
      id: record.id, control_system_type: record.control_system_type || '', scada_available: !!record.scada_available,
      communication_type: record.communication_type || '', network_available: !!record.network_available,
      telemetry_available: !!record.telemetry_available, remote_monitoring: !!record.remote_monitoring,
      sensor_details: record.sensor_details || '', protocol_details: record.protocol_details || '',
      connectivity_condition: record.connectivity_condition || '', remarks: record.remarks || '',
    });
    setModal('edit-scada');
  };

  const updateScada = async () => {
    const missing = REQUIRED_BY_PATH['/sia/scada-assessments'].filter(field => {
      const value = fv[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(fv).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/scada-assessments/${encodeURIComponent(fv.id)}`, body);
      notifications.show({ title: 'SCADA Assessment updated', message: 'The SCADA / Communication assessment was saved successfully.', color: 'green' });
      rScada();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update SCADA Assessment', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditHse = record => {
    setFv({
      id: record.id, hazard_level: record.hazard_level || '', fire_risk: record.fire_risk || '',
      emergency_access: record.emergency_access || '', electrical_safety: record.electrical_safety || '',
      roof_safety: record.roof_safety || '', restricted_area: !!record.restricted_area,
      environmental_condition: record.environmental_condition || '',
      environmental_constraint: record.environmental_constraint || '',
      hse_constraint: record.hse_constraint || '', remarks: record.remarks || '',
    });
    setModal('edit-hse');
  };

  const updateHse = async () => {
    const missing = REQUIRED_BY_PATH['/sia/hse-assessments'].filter(field => {
      const value = fv[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(fv).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/hse-assessments/${encodeURIComponent(fv.id)}`, body);
      notifications.show({ title: 'HSE Assessment updated', message: 'The HSE / Environment assessment was saved successfully.', color: 'green' });
      rHse();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update HSE Assessment', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditIndustrial = record => {
    setFv({
      id: record.id, equipment_name: record.equipment_name || '', process_type: record.process_type || '',
      operating_hours: record.operating_hours ?? '', duty_cycle: record.duty_cycle ?? '',
      start_frequency: record.start_frequency || '', diversity_factor: record.diversity_factor ?? '',
      throughput: record.throughput || '', criticality: record.criticality || '',
      operating_parameters: record.operating_parameters || '', remarks: record.remarks || '',
    });
    setModal('edit-industrial');
  };

  const updateIndustrial = async () => {
    const missing = REQUIRED_BY_PATH['/sia/industrial-assessments'].filter(field => {
      const value = fv[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(fv).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/industrial-assessments/${encodeURIComponent(fv.id)}`, body);
      notifications.show({ title: 'Industrial Assessment updated', message: 'The industrial assessment was saved successfully.', color: 'green' });
      rInd();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Industrial Assessment', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditFinding = record => {
    setFv({
      id: record.id, poi_id: record.poi_id || '', finding_type: record.finding_type || '',
      severity: record.severity || '', reliability_status: record.reliability_status || '',
      status: record.status || '', description: record.description || '',
      constraint: record.constraint || '', recommendation: record.recommendation || '',
    });
    setModal('edit-finding');
  };

  const updateFinding = async () => {
    const missing = REQUIRED_BY_PATH['/sia/engineering-findings'].filter(field => {
      const value = fv[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(fv).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/engineering-findings/${encodeURIComponent(fv.id)}`, body);
      notifications.show({ title: 'Engineering Finding updated', message: 'The engineering finding was saved successfully.', color: 'green' });
      rFind();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Engineering Finding', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditGap = record => {
    setFv({
      id: record.id, gap_type: record.gap_type || '', priority: record.priority || '', status: record.status || '',
      target_date: record.target_date || '', description: record.description || '', impact: record.impact || '',
      owner_user_id: record.owner_user_id || '',
    });
    setModal('edit-gap');
  };

  const updateGap = async () => {
    const missing = REQUIRED_BY_PATH['/sia/engineering-gaps'].filter(field => {
      const value = fv[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(fv).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/engineering-gaps/${encodeURIComponent(fv.id)}`, body);
      notifications.show({ title: 'Engineering Gap updated', message: 'The engineering gap was saved successfully.', color: 'green' });
      rGap();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Engineering Gap', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditReview = record => {
    setFv({
      id: record.id, reviewer_user_id: record.reviewer_user_id || '', review_status: record.review_status || '',
      verification_status: record.verification_status || '', review_comment: record.review_comment || '',
      reviewed_at: record.reviewed_at || '',
    });
    setModal('edit-review');
  };

  const updateReview = async () => {
    const missing = REQUIRED_BY_PATH['/sia/engineering-reviews'].filter(field => {
      const value = fv[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missing.length) {
      notifications.show({ title: 'Required fields missing', message: `Complete: ${missing.map(field => field.replace(/_/g, ' ')).join(', ')}.`, color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(fv).filter(([key]) => key !== 'id').map(([key, value]) => [key, value === '' ? null : value]));
      await patchApi(`/sia/engineering-reviews/${encodeURIComponent(fv.id)}`, body);
      notifications.show({ title: 'Engineering Review updated', message: 'The engineering review was saved successfully.', color: 'green' });
      rRev();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update Engineering Review', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  return (
    <Box className={styles.root} p={{ base: 'sm', sm: 'lg' }}>
      {/* Header */}
      <Box mb="lg">
        <Group gap="sm" mb={4}>
          <Badge color="green" variant="light" size="lg" radius="sm">SIA</Badge>
          <Text size="xs" c="dimmed" fw={500}>Module 1 Â· Section 3</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">Engineering Assessment</Title>
        <Text size="sm" c="#6b7280" mt={4}>Manage discipline assessments, findings, gaps and reviews.</Text>
      </Box>

      {/* Case ID loader */}
      <Paper p="sm" mb="md" style={{ border:'1px solid #e5e7eb', borderRadius:8, backgroundColor:'#f9fafb' }}>
        <Group className={styles.actions} justify="space-between" align="center">
          <Group gap="xs">
            <Text size="xs" fw={700} c="#374151">Active SIA Case:</Text>
            {caseId
              ? <Text size="xs" fw={600} c="#007336" style={{ fontFamily:'monospace' }}>{caseId}</Text>
              : <Text size="xs" c="red">No active case â€” create one in Start and Case Control first.</Text>}
          </Group>
          <Group className={styles.actions} gap="sm">
            <Button size="xs" variant="subtle" color="green" onClick={() => { loadByCaseId(caseId); setSitesReload(value => value + 1); }} disabled={!caseId}>Reload</Button>
            <Button size="xs" color="green" variant="outline" disabled={!canCreateAssessment}
              onClick={() => openModal('ea', { sia_case_id: caseId, site_id: siteId })}>+ New Assessment</Button>
          </Group>
        </Group>
        {caseId && <Box mt="sm">
          <Select label="Active site" placeholder={sitesLoading ? 'Loading sites...' : 'Select a site'} searchable
            data={sites.map(site => ({ value: site.id, label: siteLabel(site) }))}
            value={siteId || null} disabled={sitesLoading || !sites.length} allowDeselect={false}
            error={sitesError || undefined}
            onChange={value => {
              setSiteId(value || '');
              if (value) localStorage.setItem('sia_site_id', value);
              else localStorage.removeItem('sia_site_id');
            }} />
          {!sitesLoading && !sitesError && !sites.length && <Text size="xs" c="dimmed" mt={6}>Create a site in Sites and Survey for this SIA case before adding an assessment.</Text>}
          {!sitesLoading && !sitesError && sites.length > 1 && !siteId && <Text size="xs" c="dimmed" mt={6}>Select the site this assessment belongs to.</Text>}
        </Box>}
      </Paper>

      {/* EA list */}
      {eaList.length > 0 && (
        <Paper p={{ base: 'xs', sm: 'md' }} mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Text size="xs" fw={700} c="#374151" mb={8}>Select Assessment</Text>
          {eaLoading ? <Loader size="sm" color="green" /> : (
            <ResponsiveTable verticalSpacing="xs" horizontalSpacing="md">
              <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
                <Table.Tr>
                  <Table.Th style={thS}>Code</Table.Th><Table.Th style={thS}>Discipline</Table.Th>
                  <Table.Th style={thS}>Status</Table.Th><Table.Th style={thS}>Reliability</Table.Th>
                  <Table.Th style={thS}>Date</Table.Th><Table.Th style={thS}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {eaList.map(ea => {
                  const isSel = selectedEa?.id === ea.id;
                  return (
                    <Table.Tr key={ea.id} onClick={() => { setEa(ea); setTab('electrical'); }}
                      style={{
                        cursor: 'pointer', backgroundColor: isSel ? '#f0fdf4' : 'transparent',
                        outline: isSel ? '2px solid #007336' : 'none', outlineOffset: '-2px'
                      }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <Table.Td><Button variant="subtle" color="green" className={styles.assessmentButton} aria-pressed={isSel} onClick={event => { event.stopPropagation(); setEa(ea); setTab('electrical'); }}>{ea.assessment_code}</Button></Table.Td>
                      <Table.Td><Text size="sm">{ea.discipline}</Text></Table.Td>
                      <Table.Td><SBadge v={ea.status} /></Table.Td>
                      <Table.Td><SBadge v={ea.reliability_status} /></Table.Td>
                      <Table.Td><Text size="xs" c="#6b7280">{formatDisplayValue(ea.assessment_date || 'â€”')}</Text></Table.Td>
                      <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                        onClick={event => { event.stopPropagation(); openEditAssessment(ea); }}>Edit</Button></Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </ResponsiveTable>
          )}
        </Paper>
      )}

      {/* Selected EA context strip */}
      {selectedEa && (
        <Paper p="sm" mb="md" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
          <Group gap="xl" wrap="wrap">
            <Text size="xs" c="#374151">Assessment: <Text span fw={700} c="#007336">{selectedEa.assessment_code}</Text></Text>
            <Text size="xs" c="#374151">Discipline: <Text span fw={600}>{selectedEa.discipline}</Text></Text>
            <Text size="xs" c="#374151">Status: <Text span fw={600}>{selectedEa.status || 'â€”'}</Text></Text>
            <Button variant="subtle" color="gray" size="xs" ml="auto" onClick={() => setEa(null)}>Clear</Button>
          </Group>
        </Paper>
      )}

      {/* Tabs â€” only when an EA is selected */}
      {selectedEa && (
        <Tabs value={activeTab} onChange={setTab} color="green">
          <Group className={styles.actions} justify="flex-end" mb="md"><Button color="green" variant="light" leftSection={<IconFileText size={16} />} onClick={() => setTab('report')}>View assessment report</Button></Group>
          <Box className={styles.sectionSelect} mb="md">
            <Select label="Assessment section" value={activeTab} onChange={value => value && setTab(value)} allowDeselect={false}
              data={assessmentSections.map(({ value, label }) => ({ value, label }))} />
            <Text size="xs" c="dimmed" mt={6} aria-live="polite">Section {assessmentSections.findIndex(section => section.value === activeTab) + 1} of {assessmentSections.length}</Text>
          </Box>
          <Box className={styles.sectionStrip}>
          <SIAStepFlow
            activeTab={activeTab}
            onStep={setTab}
            steps={assessmentSections}
          />
          </Box>
          <Tabs.List style={{ display:'none' }}>
            <Tabs.Tab value="electrical">Electrical</Tabs.Tab>
            <Tabs.Tab value="civil">Civil</Tabs.Tab>
            <Tabs.Tab value="structural">Structural</Tabs.Tab>
            <Tabs.Tab value="mechanical">Mechanical</Tabs.Tab>
            <Tabs.Tab value="water">Water Pumping</Tabs.Tab>
            <Tabs.Tab value="scada">SCADA</Tabs.Tab>
            <Tabs.Tab value="hse">HSE / Env</Tabs.Tab>
            <Tabs.Tab value="industrial">Industrial</Tabs.Tab>
            <Tabs.Tab value="findings">Findings</Tabs.Tab>
            <Tabs.Tab value="gaps">Gaps</Tabs.Tab>
            <Tabs.Tab value="reviews">Reviews</Tabs.Tab>
            <Tabs.Tab value="report">Report</Tabs.Tab>
          </Tabs.List>

          {/* ELECTRICAL */}
          <Tabs.Panel value="electrical">
            <TabHeader title="Electrical Assessment" onAdd={() => openModal('elec')} addLabel="Add" />
            <DataTable loading={elecL} cols={['Supply', 'Voltage', 'Phase', 'Freq', 'Connected kW', 'Peak kW', 'Utility Cond.', '']}
              rows={electrical} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.supply_type || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.voltage ?? 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.phase || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.frequency ?? 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.connected_load ?? 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.peak_load ?? 'â€”'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.utility_condition} /></Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                    onClick={() => openEditElectrical(r)}>Edit</Button></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* CIVIL */}
          <Tabs.Panel value="civil">
            <TabHeader title="Civil Assessment" onAdd={() => openModal('civil')} addLabel="Add" />
            <DataTable loading={civL} cols={['Ground', 'Foundation', 'Drainage', 'Road', 'Erosion Risk', 'Flood Risk', '']}
              rows={civil} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.ground_condition || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.foundation_condition || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.drainage_condition || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.road_condition || 'â€”'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.erosion_risk} /></Table.Td>
                  <Table.Td><SBadge v={r.flood_risk} /></Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                    onClick={() => openEditCivil(r)}>Edit</Button></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* STRUCTURAL */}
          <Tabs.Panel value="structural">
            <TabHeader title="Structural Assessment" onAdd={() => openModal('structural')} addLabel="Add" />
            <DataTable loading={strL} cols={['Structure', 'Roof Type', 'Material', 'Struct. Condition', 'Roof Condition', 'Support', '']}
              rows={structural} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.structure_type || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.roof_type || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.material_type || 'â€”'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.structural_condition} /></Table.Td>
                  <Table.Td><SBadge v={r.roof_condition} /></Table.Td>
                  <Table.Td><SBadge v={r.support_condition} /></Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                    onClick={() => openEditStructural(r)}>Edit</Button></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* MECHANICAL */}
          <Tabs.Panel value="mechanical">
            <TabHeader title="Mechanical Assessment" onAdd={() => openModal('mechanical')} addLabel="Add" />
            <DataTable loading={mechL} cols={['Equip. Zone', 'Plant', 'Ventilation', 'Lifting', 'Maintenance', 'Pipework', '']}
              rows={mechanical} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.equipment_zone || 'â€”'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.plant_condition} /></Table.Td>
                  <Table.Td><SBadge v={r.ventilation_condition} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.lifting_access || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.maintenance_access || 'â€”'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.pipework_condition} /></Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                    onClick={() => openEditMechanical(r)}>Edit</Button></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* WATER PUMPING */}
          <Tabs.Panel value="water">
            <TabHeader title="Water Pumping Assessment" onAdd={() => openModal('water')} addLabel="Add" />
            <DataTable loading={watL} cols={['Source', 'Daily Demand', 'Pipe Material', 'Pump Model', 'Pump kW', 'Tank Cap.', 'Monitoring', '']}
              rows={water} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.water_source_type || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.daily_water_demand ?? 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.pipe_material || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.pump_make_model || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.pump_power_kw ?? 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.tank_capacity ?? 'â€”'}</Text></Table.Td>
                  <Table.Td><Badge size="sm" color={r.monitoring_available ? 'green' : 'gray'} variant="light">{r.monitoring_available ? 'Yes' : 'No'}</Badge></Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                    onClick={() => openEditWater(r)}>Edit</Button></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* SCADA */}
          <Tabs.Panel value="scada">
            <TabHeader title="SCADA / Communication Assessment" onAdd={() => openModal('scada')} addLabel="Add" />
            <DataTable loading={scaL} cols={['Control System', 'SCADA', 'Comm. Type', 'Network', 'Telemetry', 'Remote Mon.', 'Connectivity', '']}
              rows={scada} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.control_system_type || 'â€”'}</Text></Table.Td>
                  <Table.Td><Badge size="sm" color={r.scada_available ? 'green' : 'gray'} variant="light">{r.scada_available ? 'Yes' : 'No'}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.communication_type || 'â€”'}</Text></Table.Td>
                  <Table.Td><Badge size="sm" color={r.network_available ? 'green' : 'gray'} variant="light">{r.network_available ? 'Yes' : 'No'}</Badge></Table.Td>
                  <Table.Td><Badge size="sm" color={r.telemetry_available ? 'green' : 'gray'} variant="light">{r.telemetry_available ? 'Yes' : 'No'}</Badge></Table.Td>
                  <Table.Td><Badge size="sm" color={r.remote_monitoring ? 'green' : 'gray'} variant="light">{r.remote_monitoring ? 'Yes' : 'No'}</Badge></Table.Td>
                  <Table.Td><SBadge v={r.connectivity_condition} /></Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                    onClick={() => openEditScada(r)}>Edit</Button></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* HSE */}
          <Tabs.Panel value="hse">
            <TabHeader title="HSE / Environment Assessment" onAdd={() => openModal('hse')} addLabel="Add" />
            <DataTable loading={hseL} cols={['Hazard Level', 'Fire Risk', 'Elec. Safety', 'Roof Safety', 'Restricted', 'Emergency Access', '']}
              rows={hse} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><SBadge v={r.hazard_level} /></Table.Td>
                  <Table.Td><SBadge v={r.fire_risk} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.electrical_safety || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.roof_safety || 'â€”'}</Text></Table.Td>
                  <Table.Td><Badge size="sm" color={r.restricted_area ? 'red' : 'green'} variant="light">{r.restricted_area ? 'Yes' : 'No'}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.emergency_access || 'â€”'}</Text></Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                    onClick={() => openEditHse(r)}>Edit</Button></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* INDUSTRIAL */}
          <Tabs.Panel value="industrial">
            <TabHeader title="Industrial Assessment" onAdd={() => openModal('industrial')} addLabel="Add" />
            <DataTable loading={indL} cols={['Equipment', 'Process', 'Op. Hours', 'Duty Cycle', 'Criticality', 'Throughput', '']}
              rows={industrial} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm">{r.equipment_name || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.process_type || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.operating_hours ?? 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.duty_cycle ?? 'â€”'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.criticality} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.throughput || 'â€”'}</Text></Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                    onClick={() => openEditIndustrial(r)}>Edit</Button></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* FINDINGS */}
          <Tabs.Panel value="findings">
            <TabHeader title="Engineering Findings" onAdd={() => openModal('finding')} addLabel="Add Finding" />
            <DataTable loading={findL} cols={['Code', 'Type', 'Severity', 'Reliability', 'Status', 'Description', '']}
              rows={findings} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.finding_code || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.finding_type || 'â€”'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.severity} /></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" className={styles.description}>{r.description || 'â€”'}</Text></Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                    onClick={() => openEditFinding(r)}>Edit</Button></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* GAPS */}
          <Tabs.Panel value="gaps">
            <TabHeader title="Engineering Gaps" onAdd={() => openModal('gap')} addLabel="Add Gap" />
            <DataTable loading={gapL} cols={['Code', 'Type', 'Priority', 'Status', 'Target Date', 'Description', '']}
              rows={gaps} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.gap_code || 'â€”'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.gap_type || 'â€”'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.priority} /></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{formatDisplayValue(r.target_date || 'â€”')}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" className={styles.description}>{r.description || 'â€”'}</Text></Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                    onClick={() => openEditGap(r)}>Edit</Button></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          {/* REVIEWS */}
          <Tabs.Panel value="reviews">
            <TabHeader title="Engineering Reviews" onAdd={() => openModal('review')} addLabel="Add Review" />
            <DataTable loading={revL} cols={['Reviewer', 'Review Status', 'Verification', 'Reviewed At', '']}
              rows={reviews} render={r => (
                <Table.Tr key={r.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Table.Td><Text size="sm" style={{ fontFamily: 'monospace' }}>{r.reviewer_user_id || 'â€”'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.review_status} /></Table.Td>
                  <Table.Td><SBadge v={r.verification_status} /></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.reviewed_at ? formatDateTime(r.reviewed_at) : 'â€”'}</Text></Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                    onClick={() => openEditReview(r)}>Edit</Button></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>
          {activeTab === 'reviews' && <Group className={styles.actions} justify="flex-end" mt="lg"><Button color="green" rightSection={<IconArrowRight size={16} />} onClick={() => setTab('report')}>Continue to Report</Button></Group>}
          <Tabs.Panel value="report">
            {activeTab === 'report' && <SIAEngineeringAssessmentReport api={API} assessmentId={eid} caseId={caseId} />}
          </Tabs.Panel>
        </Tabs>
      )}

      {/* â•â•â•â• MODALS â•â•â•â• */}

      {/* New Engineering Assessment */}
      <FormModal opened={modal === 'ea'} onClose={closeModal} title="New Engineering Assessment" saving={saving}
        onSubmit={() => save('/sia/engineering-assessments', { ...fv, sia_case_id: caseId, site_id: siteId }, () => loadByCaseId(caseId))}>
        {selectedSite && <Text size="sm" c="dimmed" mb="sm">Site: {siteLabel(selectedSite)}</Text>}
        <Text size="xs" c="dimmed" mb="md" style={{ fontStyle: 'italic' }}>Assessment Code will be auto-generated by the system</Text>
        <FormRow>
            <FI label="Discipline *" field="discipline" fv={fv} setFv={setFv} select={disciplineNames} />
          <FI label="Assessment Date" field="assessment_date" fv={fv} setFv={setFv} />
        </FormRow>
        <FormRow>
          <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} />
          <FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY} />
        </FormRow>
        <FI label="Summary" field="summary" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-ea'} onClose={closeModal} title="Edit Engineering Assessment" saving={saving} onSubmit={updateAssessment}>
        <FormRow>
          <FI label="Discipline *" field="discipline" fv={fv} setFv={setFv} select={disciplineNames} />
          <FI label="Assessment Date" field="assessment_date" fv={fv} setFv={setFv} />
        </FormRow>
        <FormRow>
          <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} />
          <FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY} />
        </FormRow>
        <FI label="Summary" field="summary" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Electrical */}
      <FormModal opened={modal === 'elec'} onClose={closeModal} title="Electrical Assessment" saving={saving}
        onSubmit={() => save('/sia/electrical-assessments', { engineering_assessment_id: eid, ...fv }, rElec)}>
        <FormRow><FI label="Supply Type" field="supply_type" fv={fv} setFv={setFv} /><FI label="Voltage" field="voltage" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Phase" field="phase" fv={fv} setFv={setFv} /><FI label="Frequency" field="frequency" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Connected Load (kW)" field="connected_load" fv={fv} setFv={setFv} number /><FI label="Peak Load (kW)" field="peak_load" fv={fv} setFv={setFv} number /></FormRow>
        <FI label="Utility Condition" field="utility_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Unavailable', 'Not Assessed', 'Not Applicable']} />
        <FI label="Transformer Details" field="transformer_details" fv={fv} setFv={setFv} textarea />
        <FI label="Switchboard Details" field="switchboard_details" fv={fv} setFv={setFv} textarea />
        <FI label="Protection Details" field="protection_details" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-elec'} onClose={closeModal} title="Edit Electrical Assessment" saving={saving} onSubmit={updateElectrical}>
        <FormRow><FI label="Supply Type" field="supply_type" fv={fv} setFv={setFv} /><FI label="Voltage" field="voltage" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Phase" field="phase" fv={fv} setFv={setFv} /><FI label="Frequency" field="frequency" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Connected Load (kW)" field="connected_load" fv={fv} setFv={setFv} number /><FI label="Peak Load (kW)" field="peak_load" fv={fv} setFv={setFv} number /></FormRow>
        <FI label="Utility Condition" field="utility_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Unavailable', 'Not Assessed', 'Not Applicable']} />
        <FI label="Transformer Details" field="transformer_details" fv={fv} setFv={setFv} textarea />
        <FI label="Switchboard Details" field="switchboard_details" fv={fv} setFv={setFv} textarea />
        <FI label="Protection Details" field="protection_details" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Civil */}
      <FormModal opened={modal === 'civil'} onClose={closeModal} title="Civil Assessment" saving={saving}
        onSubmit={() => save('/sia/civil-assessments', { engineering_assessment_id: eid, ...fv }, rCivil)}>
        <FormRow><FI label="Ground Condition" field="ground_condition" fv={fv} setFv={setFv} select={['Stable', 'Soft', 'Rocky', 'Waterlogged', 'Uneven', 'Not Assessed', 'Not Applicable']} /><FI label="Foundation Condition" field="foundation_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Damaged', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FormRow><FI label="Drainage Condition" field="drainage_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Blocked', 'No Drainage', 'Not Assessed', 'Not Applicable']} /><FI label="Road Condition" field="road_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Under Construction', 'Impassable', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FormRow><FI label="Erosion Risk" field="erosion_risk" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} /><FI label="Flood Risk" field="flood_risk" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} /></FormRow>
        <FI label="Trench Requirement" field="trench_requirement" fv={fv} setFv={setFv} textarea />
        <FI label="Route Constraint" field="route_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-civil'} onClose={closeModal} title="Edit Civil Assessment" saving={saving} onSubmit={updateCivil}>
        <FormRow><FI label="Ground Condition" field="ground_condition" fv={fv} setFv={setFv} select={['Stable', 'Soft', 'Rocky', 'Waterlogged', 'Uneven', 'Not Assessed', 'Not Applicable']} /><FI label="Foundation Condition" field="foundation_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Damaged', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FormRow><FI label="Drainage Condition" field="drainage_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Blocked', 'No Drainage', 'Not Assessed', 'Not Applicable']} /><FI label="Road Condition" field="road_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Under Construction', 'Impassable', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FormRow><FI label="Erosion Risk" field="erosion_risk" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} /><FI label="Flood Risk" field="flood_risk" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} /></FormRow>
        <FI label="Trench Requirement" field="trench_requirement" fv={fv} setFv={setFv} textarea />
        <FI label="Route Constraint" field="route_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Structural */}
      <FormModal opened={modal === 'structural'} onClose={closeModal} title="Structural Assessment" saving={saving}
        onSubmit={() => save('/sia/structural-assessments', { engineering_assessment_id: eid, ...fv }, rStruct)}>
        <FormRow><FI label="Structure Type" field="structure_type" fv={fv} setFv={setFv} /><FI label="Roof Type" field="roof_type" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Material Type" field="material_type" fv={fv} setFv={setFv} /><FI label="Structural Condition" field="structural_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Damaged', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FormRow><FI label="Roof Condition" field="roof_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Damaged', 'Not Assessed', 'Not Applicable']} /><FI label="Support Condition" field="support_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Damaged', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FI label="Visible Damage" field="visible_damage" fv={fv} setFv={setFv} textarea />
        <FI label="Loading Constraint" field="loading_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-structural'} onClose={closeModal} title="Edit Structural Assessment" saving={saving} onSubmit={updateStructural}>
        <FormRow><FI label="Structure Type" field="structure_type" fv={fv} setFv={setFv} /><FI label="Roof Type" field="roof_type" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Material Type" field="material_type" fv={fv} setFv={setFv} /><FI label="Structural Condition" field="structural_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Damaged', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FormRow><FI label="Roof Condition" field="roof_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Damaged', 'Not Assessed', 'Not Applicable']} /><FI label="Support Condition" field="support_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Damaged', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FI label="Visible Damage" field="visible_damage" fv={fv} setFv={setFv} textarea />
        <FI label="Loading Constraint" field="loading_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Mechanical */}
      <FormModal opened={modal === 'mechanical'} onClose={closeModal} title="Mechanical Assessment" saving={saving}
        onSubmit={() => save('/sia/mechanical-assessments', { engineering_assessment_id: eid, ...fv }, rMech)}>
        <FormRow><FI label="Equipment Zone" field="equipment_zone" fv={fv} setFv={setFv} select={['Plant Room', 'Production Area', 'Utility Area', 'Rooftop', 'Basement', 'Outdoor Area', 'Other', 'Not Assessed', 'Not Applicable']} /><FI label="Plant Condition" field="plant_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Damaged', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FormRow><FI label="Ventilation Condition" field="ventilation_condition" fv={fv} setFv={setFv} select={['Adequate', 'Limited', 'Inadequate', 'No Ventilation', 'Not Assessed', 'Not Applicable']} /><FI label="Lifting Access" field="lifting_access" fv={fv} setFv={setFv} select={['Unrestricted', 'Restricted', 'Unavailable', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FormRow><FI label="Maintenance Access" field="maintenance_access" fv={fv} setFv={setFv} select={['Unrestricted', 'Restricted', 'Unavailable', 'Not Assessed', 'Not Applicable']} /><FI label="Pipework Condition" field="pipework_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Damaged', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FI label="Route Constraint" field="route_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Operational Constraint" field="operational_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-mechanical'} onClose={closeModal} title="Edit Mechanical Assessment" saving={saving} onSubmit={updateMechanical}>
        <FormRow><FI label="Equipment Zone" field="equipment_zone" fv={fv} setFv={setFv} select={['Plant Room', 'Production Area', 'Utility Area', 'Rooftop', 'Basement', 'Outdoor Area', 'Other', 'Not Assessed', 'Not Applicable']} /><FI label="Plant Condition" field="plant_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Damaged', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FormRow><FI label="Ventilation Condition" field="ventilation_condition" fv={fv} setFv={setFv} select={['Adequate', 'Limited', 'Inadequate', 'No Ventilation', 'Not Assessed', 'Not Applicable']} /><FI label="Lifting Access" field="lifting_access" fv={fv} setFv={setFv} select={['Unrestricted', 'Restricted', 'Unavailable', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FormRow><FI label="Maintenance Access" field="maintenance_access" fv={fv} setFv={setFv} select={['Unrestricted', 'Restricted', 'Unavailable', 'Not Assessed', 'Not Applicable']} /><FI label="Pipework Condition" field="pipework_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Damaged', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FI label="Route Constraint" field="route_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Operational Constraint" field="operational_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Water Pumping */}
      <FormModal opened={modal === 'water'} onClose={closeModal} title="Water Pumping Assessment" saving={saving}
        onSubmit={() => save('/sia/water-pumping-assessments', { engineering_assessment_id: eid, ...fv }, rWater)}>
        <FormRow><FI label="Water Source Type" field="water_source_type" fv={fv} setFv={setFv} /><FI label="Daily Water Demand (mÂ³)" field="daily_water_demand" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Source Water Level (m)" field="source_water_level" fv={fv} setFv={setFv} number /><FI label="Delivery Elevation (m)" field="delivery_elevation" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Route Length (m)" field="route_length" fv={fv} setFv={setFv} number /><FI label="Pipe Diameter (mm)" field="pipe_diameter" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Pipe Material" field="pipe_material" fv={fv} setFv={setFv} /><FI label="Pump Make/Model" field="pump_make_model" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Pump Power (kW)" field="pump_power_kw" fv={fv} setFv={setFv} number /><FI label="Pump Condition" field="pump_condition" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Tank Capacity (L)" field="tank_capacity" fv={fv} setFv={setFv} number /><FI label="Required Pressure (bar)" field="required_pressure" fv={fv} setFv={setFv} number /></FormRow>
        <FI label="Controller Type" field="controller_type" fv={fv} setFv={setFv} />
        <Group mt="sm"><Text size="xs" fw={600} c="#374151">Monitoring Available</Text><Switch aria-label="Monitoring Available" checked={!!fv.monitoring_available} onChange={(e) => { const v = e.currentTarget.checked; setFv(p => ({ ...p, monitoring_available: v })); }} color="green" /></Group>
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-water'} onClose={closeModal} title="Edit Water Pumping Assessment" saving={saving} onSubmit={updateWater}>
        <FormRow><FI label="Water Source Type" field="water_source_type" fv={fv} setFv={setFv} /><FI label="Daily Water Demand (m³)" field="daily_water_demand" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Source Water Level (m)" field="source_water_level" fv={fv} setFv={setFv} number /><FI label="Delivery Elevation (m)" field="delivery_elevation" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Route Length (m)" field="route_length" fv={fv} setFv={setFv} number /><FI label="Pipe Diameter (mm)" field="pipe_diameter" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Pipe Material" field="pipe_material" fv={fv} setFv={setFv} /><FI label="Pump Make/Model" field="pump_make_model" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Pump Power (kW)" field="pump_power_kw" fv={fv} setFv={setFv} number /><FI label="Pump Condition" field="pump_condition" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Tank Capacity (L)" field="tank_capacity" fv={fv} setFv={setFv} number /><FI label="Required Pressure (bar)" field="required_pressure" fv={fv} setFv={setFv} number /></FormRow>
        <FI label="Controller Type" field="controller_type" fv={fv} setFv={setFv} />
        <Group mt="sm"><Text size="xs" fw={600} c="#374151">Monitoring Available</Text><Switch aria-label="Monitoring Available" checked={!!fv.monitoring_available} onChange={(e) => { const v = e.currentTarget.checked; setFv(p => ({ ...p, monitoring_available: v })); }} color="green" /></Group>
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* SCADA */}
      <FormModal opened={modal === 'scada'} onClose={closeModal} title="SCADA / Communication Assessment" saving={saving}
        onSubmit={() => save('/sia/scada-assessments', { engineering_assessment_id: eid, ...fv }, rScada)}>
        <FormRow><FI label="Control System Type" field="control_system_type" fv={fv} setFv={setFv} /><FI label="Communication Type" field="communication_type" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Protocol Details" field="protocol_details" fv={fv} setFv={setFv} /><FI label="Connectivity Condition" field="connectivity_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Intermittent', 'Unavailable', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FI label="Sensor Details" field="sensor_details" fv={fv} setFv={setFv} textarea />
        <Group mt="sm" gap="xl">
          {[['scada_available', 'SCADA Available'], ['network_available', 'Network'], ['telemetry_available', 'Telemetry'], ['remote_monitoring', 'Remote Monitoring']].map(([f, l]) => (
            <Group key={f} gap="xs"><Text size="xs" fw={600} c="#374151">{l}</Text><Switch aria-label={l} checked={!!fv[f]} onChange={(e) => { const v = e.currentTarget.checked; setFv(p => ({ ...p, [f]: v })); }} color="green" /></Group>
          ))}
        </Group>
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-scada'} onClose={closeModal} title="Edit SCADA / Communication Assessment" saving={saving} onSubmit={updateScada}>
        <FormRow><FI label="Control System Type" field="control_system_type" fv={fv} setFv={setFv} /><FI label="Communication Type" field="communication_type" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Protocol Details" field="protocol_details" fv={fv} setFv={setFv} /><FI label="Connectivity Condition" field="connectivity_condition" fv={fv} setFv={setFv} select={['Good', 'Fair', 'Poor', 'Intermittent', 'Unavailable', 'Not Assessed', 'Not Applicable']} /></FormRow>
        <FI label="Sensor Details" field="sensor_details" fv={fv} setFv={setFv} textarea />
        <Group mt="sm" gap="xl">
          {[['scada_available', 'SCADA Available'], ['network_available', 'Network'], ['telemetry_available', 'Telemetry'], ['remote_monitoring', 'Remote Monitoring']].map(([f, l]) => (
            <Group key={f} gap="xs"><Text size="xs" fw={600} c="#374151">{l}</Text><Switch aria-label={l} checked={!!fv[f]} onChange={(e) => { const v = e.currentTarget.checked; setFv(p => ({ ...p, [f]: v })); }} color="green" /></Group>
          ))}
        </Group>
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* HSE */}
      <FormModal opened={modal === 'hse'} onClose={closeModal} title="HSE / Environment Assessment" saving={saving}
        onSubmit={() => save('/sia/hse-assessments', { engineering_assessment_id: eid, ...fv }, rHse)}>
        <FormRow>
          <FI label="Hazard Level" field="hazard_level" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} />
          <FI label="Fire Risk" field="fire_risk" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} />
        </FormRow>
        <FormRow><FI label="Emergency Access" field="emergency_access" fv={fv} setFv={setFv} /><FI label="Electrical Safety" field="electrical_safety" fv={fv} setFv={setFv} /></FormRow>
        <FI label="Roof Safety" field="roof_safety" fv={fv} setFv={setFv} />
        <FI label="Environmental Condition" field="environmental_condition" fv={fv} setFv={setFv} textarea />
        <FI label="Environmental Constraint" field="environmental_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="HSE Constraint" field="hse_constraint" fv={fv} setFv={setFv} textarea />
        <Group mt="sm"><Text size="xs" fw={600} c="#374151">Restricted Area</Text><Switch aria-label="Restricted Area" checked={!!fv.restricted_area} onChange={(e) => { const v = e.currentTarget.checked; setFv(p => ({ ...p, restricted_area: v })); }} color="red" /></Group>
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-hse'} onClose={closeModal} title="Edit HSE / Environment Assessment" saving={saving}
        onSubmit={updateHse}>
        <FormRow>
          <FI label="Hazard Level" field="hazard_level" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} required />
          <FI label="Fire Risk" field="fire_risk" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} required />
        </FormRow>
        <FormRow><FI label="Emergency Access" field="emergency_access" fv={fv} setFv={setFv} /><FI label="Electrical Safety" field="electrical_safety" fv={fv} setFv={setFv} /></FormRow>
        <FI label="Roof Safety" field="roof_safety" fv={fv} setFv={setFv} />
        <FI label="Environmental Condition" field="environmental_condition" fv={fv} setFv={setFv} textarea required />
        <FI label="Environmental Constraint" field="environmental_constraint" fv={fv} setFv={setFv} textarea />
        <FI label="HSE Constraint" field="hse_constraint" fv={fv} setFv={setFv} textarea />
        <Group mt="sm"><Text size="xs" fw={600} c="#374151">Restricted Area</Text><Switch aria-label="Restricted Area" checked={!!fv.restricted_area} onChange={(e) => { const v = e.currentTarget.checked; setFv(p => ({ ...p, restricted_area: v })); }} color="red" /></Group>
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Industrial */}
      <FormModal opened={modal === 'industrial'} onClose={closeModal} title="Industrial Assessment" saving={saving}
        onSubmit={() => save('/sia/industrial-assessments', { engineering_assessment_id: eid, ...fv }, rInd)}>
        <FormRow><FI label="Equipment Name" field="equipment_name" fv={fv} setFv={setFv} /><FI label="Process Type" field="process_type" fv={fv} setFv={setFv} /></FormRow>
        <FormRow><FI label="Operating Hours" field="operating_hours" fv={fv} setFv={setFv} number /><FI label="Duty Cycle (%)" field="duty_cycle" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Start Frequency" field="start_frequency" fv={fv} setFv={setFv} /><FI label="Diversity Factor" field="diversity_factor" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Throughput" field="throughput" fv={fv} setFv={setFv} /><FI label="Criticality" field="criticality" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} /></FormRow>
        <FI label="Operating Parameters" field="operating_parameters" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-industrial'} onClose={closeModal} title="Edit Industrial Assessment" saving={saving}
        onSubmit={updateIndustrial}>
        <FormRow><FI label="Equipment Name" field="equipment_name" fv={fv} setFv={setFv} required /><FI label="Process Type" field="process_type" fv={fv} setFv={setFv} required /></FormRow>
        <FormRow><FI label="Operating Hours" field="operating_hours" fv={fv} setFv={setFv} number required /><FI label="Duty Cycle (%)" field="duty_cycle" fv={fv} setFv={setFv} number required /></FormRow>
        <FormRow><FI label="Start Frequency" field="start_frequency" fv={fv} setFv={setFv} /><FI label="Diversity Factor" field="diversity_factor" fv={fv} setFv={setFv} number /></FormRow>
        <FormRow><FI label="Throughput" field="throughput" fv={fv} setFv={setFv} /><FI label="Criticality" field="criticality" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} required /></FormRow>
        <FI label="Operating Parameters" field="operating_parameters" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Finding */}
      <FormModal opened={modal === 'finding'} onClose={closeModal} title="Engineering Finding" saving={saving}
        onSubmit={() => save('/sia/engineering-findings', { engineering_assessment_id: eid, ...fv }, rFind)}>
        <FormRow><FI label="Finding Type" field="finding_type" fv={fv} setFv={setFv} /></FormRow>
        <FormRow>
          <FI label="Severity" field="severity" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} />
          <FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY} />
        </FormRow>
        <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} />
        <FI label="Description" field="description" fv={fv} setFv={setFv} textarea />
        <FI label="Constraint" field="constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Recommendation" field="recommendation" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-finding'} onClose={closeModal} title="Edit Engineering Finding" saving={saving}
        onSubmit={updateFinding}>
        <FormRow><FI label="Finding Type" field="finding_type" fv={fv} setFv={setFv} required /></FormRow>
        <FormRow>
          <FI label="Severity" field="severity" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} required />
          <FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY} required />
        </FormRow>
        <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} required />
        <FI label="Description" field="description" fv={fv} setFv={setFv} textarea required />
        <FI label="Constraint" field="constraint" fv={fv} setFv={setFv} textarea />
        <FI label="Recommendation" field="recommendation" fv={fv} setFv={setFv} textarea required />
      </FormModal>

      {/* Gap */}
      <FormModal opened={modal === 'gap'} onClose={closeModal} title="Engineering Gap" saving={saving}
        onSubmit={() => save('/sia/engineering-gaps', { engineering_assessment_id: eid, ...fv }, rGap)}>
        <FormRow><FI label="Gap Type" field="gap_type" fv={fv} setFv={setFv} select={['Missing Data', 'Missing Documentation', 'Survey Required', 'Testing Required', 'Design Clarification', 'Equipment Information', 'Compliance', 'Other']} /></FormRow>
        <FormRow>
          <FI label="Priority" field="priority" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} />
          <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} />
        </FormRow>
        <FI label="Target Date (DD/MMM/YYYY)" field="target_date" fv={fv} setFv={setFv} />
        <FI label="Description" field="description" fv={fv} setFv={setFv} textarea />
        <FI label="Impact" field="impact" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-gap'} onClose={closeModal} title="Edit Engineering Gap" saving={saving}
        onSubmit={updateGap}>
        <FormRow><FI label="Gap Type" field="gap_type" fv={fv} setFv={setFv} select={['Missing Data', 'Missing Documentation', 'Survey Required', 'Testing Required', 'Design Clarification', 'Equipment Information', 'Compliance', 'Other']} required /></FormRow>
        <FormRow>
          <FI label="Priority" field="priority" fv={fv} setFv={setFv} select={['Low', 'Medium', 'High', 'Critical']} required />
          <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTS} required />
        </FormRow>
        <FI label="Target Date (DD/MMM/YYYY)" field="target_date" fv={fv} setFv={setFv} required />
        <FI label="Description" field="description" fv={fv} setFv={setFv} textarea required />
        <FI label="Impact" field="impact" fv={fv} setFv={setFv} textarea />
        <FI label="Owner User ID" field="owner_user_id" fv={fv} setFv={setFv} />
      </FormModal>

      {/* Review */}
      <FormModal opened={modal === 'review'} onClose={closeModal} title="Engineering Review" saving={saving}
        onSubmit={() => save('/sia/engineering-reviews', { engineering_assessment_id: eid, reviewer_user_id: localStorage.getItem('user_id') || 'unknown', ...fv }, rRev)}>
        <FormRow>
          <FI label="Review Status" field="review_status" fv={fv} setFv={setFv} select={['Pending', 'In Progress', 'Approved', 'Rejected']} />
          <FI label="Verification Status" field="verification_status" fv={fv} setFv={setFv} select={['Unverified', 'Partially Verified', 'Verified']} />
        </FormRow>
        <FI label="Review Comment" field="review_comment" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-review'} onClose={closeModal} title="Edit Engineering Review" saving={saving}
        onSubmit={updateReview}>
        <FI label="Reviewer" field="reviewer_user_id" fv={fv} setFv={setFv} readonly />
        <FormRow>
          <FI label="Review Status" field="review_status" fv={fv} setFv={setFv} select={['Pending', 'In Progress', 'Approved', 'Rejected']} required />
          <FI label="Verification Status" field="verification_status" fv={fv} setFv={setFv} select={['Unverified', 'Partially Verified', 'Verified']} required />
        </FormRow>
        <FI label="Review Comment" field="review_comment" fv={fv} setFv={setFv} textarea required />
      </FormModal>
    </Box>
  );
}
