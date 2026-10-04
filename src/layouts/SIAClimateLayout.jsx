import { Children, cloneElement, isValidElement, useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader, Modal,
  Paper, Select, Stack, Tabs, Table, Text, Textarea,
  TextInput, Title, NumberInput,
} from '@mantine/core';
import DatePickerInput from '../components/common/DatePickerInput';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconCloudRain, IconTemperature, IconWind,
  IconDroplet, IconSun, IconFileText,
} from '@tabler/icons-react';
import SIAStepFlow from '../components/common/SIAStepFlow';
import SIAClimateReport from '../components/common/SIAClimateReport';
import styles from './SIADroneGISClimateLayout.module.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const thS = { fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' };

// ── hooks & helpers ─────────────────────────────────────
function useApi(url, deps = []) {
  const [result, setResult] = useState({ url: null, data: [] });
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const reload = () => setRefresh(value => value + 1);
  useEffect(() => {
    const controller = new AbortController();
    setResult({ url, data: [] });
    setLoading(Boolean(url));
    if (!url) return;
    fetch(url, { signal: controller.signal }).then(r => r.json()).then(d => {
      if (!controller.signal.aborted) setResult({ url, data: Array.isArray(d) ? d : [] });
    }).catch(() => { }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [url, refresh]);
  return { data: result.url === url ? result.data : [], loading, reload };
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

function EmptyRow({ cols }) {
  return <Table.Tr><Table.Td colSpan={cols} style={{ textAlign: 'center', padding: '28px 0' }}>
    <Text size="sm" c="dimmed">No records found.</Text></Table.Td></Table.Tr>;
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
    <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 8, position: 'relative', minHeight: 110 }}>
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
  return <Group className={styles.actions} justify="space-between" mb="sm">
    <Text fw={600} size="sm" c="#374151">{title}</Text>
    <Button size="xs" color="green" leftSection={<IconPlus size={13} />} disabled={disabled}
      onClick={onAdd} style={{ backgroundColor: disabled ? undefined : '#007336' }}>{addLabel}</Button>
  </Group>;
}

function FormModal({ opened, onClose, title, saving, onSubmit, children }) {
  return <Modal classNames={{ content: styles.modal }} opened={opened} onClose={onClose} title={<Text fw={700} size="sm">{title}</Text>} size="lg">
    <Stack gap="sm">{children}
      <Group className={styles.actions} justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button color="green" loading={saving} onClick={onSubmit} style={{ backgroundColor: '#007336' }}>Save</Button>
      </Group>
    </Stack>
  </Modal>;
}

function FR({ children }) { return <Box className={styles.formRow}>{children}</Box>; }

function FI({ label, field, fv, setFv, textarea, select, readonly, number }) {
  const val = fv[field] ?? '';
  const upd = v => setFv(p => ({ ...p, [field]: v }));
  const fieldLower = field.toLowerCase();
  const isDateField = fieldLower.includes('date') || fieldLower.includes('_at') || fieldLower.includes('_from') || fieldLower.includes('_to');
  const s = { input: { borderColor: readonly ? '#bbf7d0' : '#d1d5db', borderRadius: 6, minHeight: 44, backgroundColor: readonly ? '#f0fdf4' : undefined } };
  
  if (select) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <Select aria-label={label} data={select} value={val} onChange={v => upd(v || '')} clearable styles={s} /></Box>;
  if (textarea) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <Textarea aria-label={label} value={val} onChange={e => upd(e.target.value)} autosize minRows={2} styles={s} /></Box>;
  if (number) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <NumberInput aria-label={label} value={val === '' ? undefined : Number(val)} onChange={v => upd(v === undefined ? '' : v)} styles={s} /></Box>;
  if (isDateField) return <DatePickerInput label={label} value={val} onChange={upd} styles={s} />;
  
  return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
    <TextInput aria-label={label} value={val} onChange={e => upd(e.target.value)} readOnly={readonly} styles={s} /></Box>;
}

function SBadge({ v }) {
  const m = {
    measured: '#007336', verified: '#007336',
    provisional: '#1971c2',
    interpolated: '#f08c00', modeled: '#f08c00',
    assumed: '#e67700', unverified: '#e03131'
  };
  const col = m[(v || '').toLowerCase()] || '#6b7280';
  return <Badge size="sm" radius="xl" style={{ backgroundColor: col + '18', color: col, border: 'none', fontWeight: 600 }}>{v || '—'}</Badge>;
}

function ResourceIcon({ type }) {
  const t = (type || '').toUpperCase();
  if (t.includes('SOLAR') || t.includes('GHI') || t.includes('DNI') || t.includes('DHI')) return <IconSun size={16} color="#f59e0b" />;
  if (t.includes('TEMP')) return <IconTemperature size={16} color="#ef4444" />;
  if (t.includes('WIND')) return <IconWind size={16} color="#3b82f6" />;
  if (t.includes('RAIN') || t.includes('PRECIP') || t.includes('HUMID')) return <IconDroplet size={16} color="#06b6d4" />;
  return <IconCloudRain size={16} color="#6b7280" />;
}

// ════════════════════════════════════════════════════════
export default function SIAClimateLayout() {
  const [caseId] = useState(() => localStorage.getItem('sia_case_id') || '');
  const [loadedSiteId, setLoaded] = useState('');
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(Boolean(caseId));
  const [sitesError, setSitesError] = useState('');
  const [sitesReload, setSitesReload] = useState(0);
  const [activeTab, setTab] = useState('resources');
  const [resourceTypes, setResourceTypes] = useState([]);
  const [reliabilityLevels, setReliabilityLevels] = useState([]);

  // Load climate constants
  useEffect(() => {
    Promise.all([
      fetch(`${API}/sia/climate-resource-types`).then(r => r.json()),
      fetch(`${API}/sia/climate-reliability-levels`).then(r => r.json()),
    ]).then(([types, levels]) => {
      setResourceTypes(Array.isArray(types) ? types : []);
      setReliabilityLevels(Array.isArray(levels) ? levels : []);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setSitesLoading(Boolean(caseId));
    setSitesError('');
    if (!caseId) return;
    fetch(`${API}/sia/cases/${encodeURIComponent(caseId)}/sites`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Unable to load sites. Please try Reload.');
        const rows = await response.json();
        if (!Array.isArray(rows)) throw new Error('Unable to load sites. Please try Reload.');
        return rows.filter(site => typeof site.id === 'string' && site.id.trim() && site.sia_case_id === caseId);
      })
      .then(rows => {
        if (controller.signal.aborted) return;
        setSites(rows);
        const remembered = localStorage.getItem('sia_site_id');
        const selected = rows.find(site => site.id === remembered) || (rows.length === 1 ? rows[0] : null);
        selectSite(selected?.id || '');
      })
      .catch(error => { if (!controller.signal.aborted) setSitesError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setSitesLoading(false); });
    return () => controller.abort();
  }, [caseId, sitesReload]);

  const sections = [
    { value:'resources',   label:'Climate Resources', icon:<IconCloudRain size={13}/>,  enabled:true },
    { value:'report',      label:'Report',            icon:<IconFileText size={13}/>,    enabled:true },
  ];

  const { data: climateResources, loading: resL, reload: rRes } = useApi(loadedSiteId ? `${API}/sia/sites/${loadedSiteId}/climate-resources` : null, [loadedSiteId]);

  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fv, setFv] = useState({});

  const openModal = (key, defaults = {}) => {
    const enriched = {
      sia_case_id: caseId,
      site_id: loadedSiteId,
      reliability_status: 'PROVISIONAL',
      ...defaults,
    };
    setFv(enriched);
    setModal(key);
  };

  const closeModal = () => { setModal(null); setFv({}); };

  const save = async (path, body, reload) => {
    if (!loadedSiteId || !sites.some(site => site.id === loadedSiteId)) {
      notifications.show({ title: 'Site required', message: 'Select a site before saving.', color: 'red' });
      return;
    }
    if (!caseId) {
      notifications.show({ title: 'Case required', message: 'Select an SIA case before saving.', color: 'red' });
      return;
    }
    setSaving(true);
    try {
      await postApi(path, body);
      notifications.show({ title: 'Saved', message: 'Climate resource created.', color: 'green' });
      reload(); closeModal();
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const selectSite = (id) => {
    if (localStorage.getItem('sia_site_id') !== id) localStorage.removeItem('sia_survey_visit_id');
    if (id) localStorage.setItem('sia_site_id', id);
    else localStorage.removeItem('sia_site_id');
    setLoaded(id);
    closeModal();
    setTab('resources');
  };

  const handleLoad = () => {
    setSitesReload(value => value + 1);
    rRes();
  };

  return (
    <Box className={styles.root} p={{ base: 'sm', sm: 'lg' }}>
      <Box mb="lg">
        <Group gap="sm" mb={4}>
          <Badge color="green" variant="light" size="lg" radius="sm">SIA</Badge>
          <Text size="xs" c="dimmed" fw={500}>Module 1 · Section 4C</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">Climate Data</Title>
        <Text size="sm" c="#6b7280" mt={4}>
          Manage solar resource, temperature, precipitation, wind, and environmental climate data.
        </Text>
      </Box>

      <Paper p="sm" mb="md" style={{ border:'1px solid #e5e7eb', borderRadius:8, backgroundColor:'#f9fafb' }}>
        <Group className={styles.actions} justify="space-between" align="center">
          <Group gap="xs">
            <Text size="xs" fw={700} c="#374151">Active Site:</Text>
            {loadedSiteId
              ? <Text size="xs" fw={600} c="#007336" style={{ fontFamily:'monospace' }}>{loadedSiteId}</Text>
              : <Text size="xs" c="red">No active site — add a site in Sites and Survey first.</Text>}
          </Group>
          <Group className={styles.actions} gap="sm">
            <Button size="xs" variant="subtle" color="green" onClick={handleLoad} disabled={!caseId || sitesLoading}>Reload</Button>
            <Button size="xs" color="green" variant="outline" disabled={!loadedSiteId}
              onClick={() => openModal('resource')}>+ New Resource</Button>
          </Group>
        </Group>
        <Select label="Select site" placeholder={sitesLoading ? 'Loading sites...' : 'Select a site to continue'}
          mt="sm" searchable allowDeselect={false} value={loadedSiteId || null}
          data={sites.map(site => ({ value: site.id, label: [site.site_code, site.site_name].filter(Boolean).join(' / ') || site.id }))}
          disabled={sitesLoading || saving || !sites.length} error={sitesError || undefined}
          onChange={value => selectSite(value || '')} />
        {!caseId && <Text size="xs" c="dimmed" mt={6}>Select an SIA case in Start and Case Control first.</Text>}
        {caseId && !sitesLoading && !sitesError && !sites.length && <Text size="xs" c="dimmed" mt={6}>Create a site in Sites and Survey for this case to continue.</Text>}
      </Paper>

      {loadedSiteId && (
        <Tabs value={activeTab} onChange={setTab} color="green">
          <Group className={styles.actions} justify="flex-end" mb="md">
            <Button color="green" variant="light" leftSection={<IconFileText size={16} />} onClick={() => setTab('report')}>View report</Button>
          </Group>
          <Box className={styles.sectionSelect} mb="md">
            <Select label="Climate data section" value={activeTab} onChange={value => value && setTab(value)} allowDeselect={false}
              data={sections.map(({ value, label, enabled }) => ({ value, label, disabled: !enabled }))} />
            <Text size="xs" c="dimmed" mt={6} aria-live="polite">Section {sections.findIndex(section => section.value === activeTab) + 1} of {sections.length}</Text>
          </Box>
          <Box className={styles.sectionStrip}>
          <SIAStepFlow
            activeTab={activeTab}
            onStep={setTab}
            steps={sections}
          />
          </Box>
          <Tabs.List style={{ display:'none' }}>
            {sections.map(s => <Tabs.Tab key={s.value} value={s.value}>{s.label}</Tabs.Tab>)}
          </Tabs.List>

          <Tabs.Panel value="resources">
            <TabHeader title="Climate Resources" onAdd={() => openModal('resource')} addLabel="Add Resource" />
            <DataTable loading={resL} cols={['Type', 'Parameter', 'Value', 'Unit', 'Period', 'Source', 'Reliability']}
              rows={climateResources} render={r => (
                <Table.Tr key={r.id}>
                  <Table.Td>
                    <Group gap="xs">
                      <ResourceIcon type={r.resource_type} />
                      <Text size="sm" fw={600}>{r.resource_type || '—'}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text size="sm">{r.parameter_name || '—'}</Text></Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600} c="#007336">
                      {r.parameter_value !== null && r.parameter_value !== undefined ? r.parameter_value : (r.parameter_text || '—')}
                    </Text>
                  </Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.unit || '—'}</Text></Table.Td>
                  <Table.Td>
                    <Text size="xs" c="#6b7280">
                      {r.period_from && r.period_to ? `${r.period_from} to ${r.period_to}` : (r.period_from || r.period_to || '—')}
                    </Text>
                  </Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" className={styles.description}>{r.source_name || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          <Tabs.Panel value="report">
            {activeTab === 'report' && <SIAClimateReport api={API} siteId={loadedSiteId} />}
          </Tabs.Panel>
        </Tabs>
      )}

      {/* MODAL */}
      <FormModal opened={modal === 'resource'} onClose={closeModal} title="Add Climate Resource" saving={saving}
        onSubmit={() => save('/sia/climate-resources', fv, rRes)}>
        <FR>
          <FI label="Resource Type *" field="resource_type" fv={fv} setFv={setFv} select={resourceTypes} />
          <FI label="Parameter Name *" field="parameter_name" fv={fv} setFv={setFv} />
        </FR>
        <FR>
          <FI label="Numeric Value" field="parameter_value" fv={fv} setFv={setFv} number />
          <FI label="Text Value" field="parameter_text" fv={fv} setFv={setFv} />
        </FR>
        <FR>
          <FI label="Unit" field="unit" fv={fv} setFv={setFv} />
          <FI label="Temporal Granularity" field="temporal_granularity" fv={fv} setFv={setFv} select={['ANNUAL', 'MONTHLY', 'DAILY', 'HOURLY']} />
        </FR>
        <FR>
          <FI label="Period From" field="period_from" fv={fv} setFv={setFv} />
          <FI label="Period To" field="period_to" fv={fv} setFv={setFv} />
        </FR>
        <FR>
          <FI label="Measurement Height (m)" field="measurement_height" fv={fv} setFv={setFv} number />
          <FI label="Distance from Site (km)" field="distance_from_site" fv={fv} setFv={setFv} number />
        </FR>
        <FR>
          <FI label="Source Name" field="source_name" fv={fv} setFv={setFv} />
          <FI label="Spatial Reference" field="spatial_reference" fv={fv} setFv={setFv} />
        </FR>
        <FR>
          <FI label="Source Reference" field="source_reference" fv={fv} setFv={setFv} />
          <FI label="Reliability Status *" field="reliability_status" fv={fv} setFv={setFv} select={reliabilityLevels} />
        </FR>
        <FR>
          <FI label="Confidence Level" field="confidence_level" fv={fv} setFv={setFv} select={['HIGH', 'MEDIUM', 'LOW']} />
          <FI label="Measurement Method" field="measurement_method" fv={fv} setFv={setFv} />
        </FR>
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>
    </Box>
  );
}
