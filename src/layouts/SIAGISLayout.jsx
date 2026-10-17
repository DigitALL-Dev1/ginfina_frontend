import { Children, cloneElement, isValidElement, useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader, Modal,
  Paper, Select, Stack, Tabs, Table, Text, Textarea,
  TextInput, Title, Switch,
} from '@mantine/core';
import DatePickerInput from '../components/common/DatePickerInput';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconWorld, IconMapPin, IconDatabase,
  IconFileText, IconLayersIntersect, IconMap, IconEdit,
} from '@tabler/icons-react';
import SIAStepFlow from '../components/common/SIAStepFlow';
import SIAGISReport from '../components/common/SIAGISReport';
import GISMap from '../components/GISMap';
import styles from './SIADroneGISClimateLayout.module.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const thS = { fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' };

const LAYER_TYPES = ['CADASTRAL', 'INFRASTRUCTURE', 'TOPOGRAPHIC', 'UTILITY', 'ENVIRONMENTAL', 'SURVEY'];
const GEOM_TYPES = ['POINT', 'LINE', 'POLYGON', 'MULTIPOINT', 'MULTILINE', 'MULTIPOLYGON'];
const RELIABILITY_STATUS = ['VERIFIED', 'PROVISIONAL', 'ASSUMED', 'UNVERIFIED'];
const SOURCE_TYPES = [
  'SATELLITE_IMAGERY', 'AERIAL_PHOTOGRAPHY', 'TOPOGRAPHIC_MAP', 'CADASTRAL_DATA',
  'UTILITY_NETWORK', 'GEOLOGICAL_MAP', 'LAND_USE', 'ENVIRONMENTAL_DATA',
  'GOVERNMENT_DATASET', 'COMMERCIAL_DATASET'
];
const REQUIRED_BY_PATH = {
  '/sia/gis-layers': ['layer_name', 'layer_type', 'geometry_type', 'crs', 'source_name', 'source_date', 'resolution_scale', 'reliability_status'],
  '/sia/gis-features': ['feature_name', 'feature_type', 'reliability_status', 'geometry_data'],
  '/sia/external-geo-sources': ['provider_name', 'dataset_name', 'source_type', 'source_reference', 'imported_at', 'reliability_status'],
};
const MANDATORY_FIELDS = new Set(Object.values(REQUIRED_BY_PATH).flat());

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

async function patchApi(path, body) {
  const cleaned = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, v === '' ? null : v]));
  const res = await fetch(`${API}${path}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
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

function FI({ label, field, fv, setFv, textarea, select, readonly }) {
  const val = fv[field] ?? '';
  const upd = v => setFv(p => ({ ...p, [field]: v }));
  const displayLabel = MANDATORY_FIELDS.has(field) ? `${label} *` : label;
  const fieldLower = field.toLowerCase();
  const isDateField = fieldLower.includes('date') || fieldLower.includes('_at');
  const s = { input: { borderColor: readonly ? '#bbf7d0' : '#d1d5db', borderRadius: 6, minHeight: 44, backgroundColor: readonly ? '#f0fdf4' : undefined } };
  
  if (select) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{displayLabel}</Text>
    <Select aria-label={label} data={select} value={val} onChange={v => upd(v || '')} clearable styles={s} /></Box>;
  if (textarea) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{displayLabel}</Text>
    <Textarea aria-label={label} value={val} onChange={e => upd(e.target.value)} autosize minRows={2} styles={s} /></Box>;
  if (isDateField) return <DatePickerInput label={displayLabel} value={val} onChange={upd} styles={s} />;
  
  return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{displayLabel}</Text>
    <TextInput aria-label={label} value={val} onChange={e => upd(e.target.value)} readOnly={readonly} styles={s} /></Box>;
}

function SBadge({ v }) {
  const m = {
    verified: '#007336', active: '#007336',
    provisional: '#1971c2',
    assumed: '#f08c00', unverified: '#e03131'
  };
  const col = m[(v || '').toLowerCase()] || '#6b7280';
  return <Badge size="sm" radius="xl" style={{ backgroundColor: col + '18', color: col, border: 'none', fontWeight: 600 }}>{v || '—'}</Badge>;
}

function BoolBadge({ v, yes = 'Yes', no = 'No' }) {
  return <Badge size="sm" color={v ? 'green' : 'gray'} variant="light">{v ? yes : no}</Badge>;
}

// ════════════════════════════════════════════════════════
export default function SIAGISLayout() {
  const [caseId] = useState(() => localStorage.getItem('sia_case_id') || '');
  const [loadedSiteId, setLoaded] = useState('');
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(Boolean(caseId));
  const [sitesError, setSitesError] = useState('');
  const [sitesReload, setSitesReload] = useState(0);
  const [activeTab, setTab] = useState('map');
  const [gisLayer, setGisLayer] = useState(null);

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
    { value:'map',         label:'3D Map',           icon:<IconMap size={13}/>,             enabled:true },
    { value:'layers',      label:'GIS Layers',       icon:<IconLayersIntersect size={13}/>, enabled:true },
    { value:'features',    label:'Features',         icon:<IconMapPin size={13}/>,         enabled:!!gisLayer },
    { value:'geosources',  label:'Geo Sources',      icon:<IconDatabase size={13}/>,       enabled:true },
    { value:'report',      label:'Report',           icon:<IconFileText size={13}/>,       enabled:true },
  ];

  const lid = gisLayer?.id;

  const { data: gisLayers, loading: layL, reload: rLayer } = useApi(loadedSiteId ? `${API}/sia/sites/${loadedSiteId}/gis-layers` : null, [loadedSiteId]);
  const { data: gisFeatures, loading: featL, reload: rFeat } = useApi(lid ? `${API}/sia/gis-layers/${lid}/features` : null, [lid]);
  const { data: geoSources, loading: geoL, reload: rGeo } = useApi(loadedSiteId ? `${API}/sia/sites/${loadedSiteId}/external-geo-sources` : null, [loadedSiteId]);

  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fv, setFv] = useState({});

  const openModal = (key, defaults = {}) => {
    const codePrefills = {
    };
    const enriched = {
      sia_case_id: caseId,
      site_id: loadedSiteId,
      ...(codePrefills[key] || {}),
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
    if (!caseId) {
      notifications.show({ title: 'Case required', message: 'Select an SIA case before saving.', color: 'red' });
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

  const openEditLayer = record => {
    setFv({
      id: record.id, layer_name: record.layer_name || '', layer_type: record.layer_type || '',
      geometry_type: record.geometry_type || '', crs: record.crs || '', source_name: record.source_name || '',
      source_date: record.source_date || '', resolution_scale: record.resolution_scale || '',
      reliability_status: record.reliability_status || '', licence_info: record.licence_info || '',
      is_active: record.is_active !== false, remarks: record.remarks || '',
    });
    setModal('edit-layer');
  };

  const updateLayer = async () => {
    const missing = REQUIRED_BY_PATH['/sia/gis-layers'].filter(field => {
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
      const updated = await patchApi(`/sia/gis-layers/${encodeURIComponent(fv.id)}`, body);
      notifications.show({ title: 'GIS Layer updated', message: 'The GIS layer was saved successfully.', color: 'green' });
      rLayer();
      if (gisLayer?.id === fv.id) setGisLayer(updated);
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update GIS Layer', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditFeature = record => {
    setFv({
      id: record.id,
      feature_name: record.feature_name || '', feature_type: record.feature_type || '',
      geometry_data: record.geometry_data || '', description: record.description || '',
      reliability_status: record.reliability_status || '', remarks: record.remarks || '',
    });
    setModal('edit-feature');
  };

  const updateFeature = async () => {
    const missing = REQUIRED_BY_PATH['/sia/gis-features'].filter(field => {
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
      await patchApi(`/sia/gis-features/${encodeURIComponent(fv.id)}`, body);
      notifications.show({ title: 'GIS Feature updated', message: 'The feature was saved successfully.', color: 'green' });
      rFeat();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update GIS Feature', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const openEditGeoSource = record => {
    setFv({
      id: record.id, provider_name: record.provider_name || '', dataset_name: record.dataset_name || '',
      source_type: record.source_type || '', source_reference: record.source_reference || '',
      imported_at: record.imported_at || '', publication_date: record.publication_date || '',
      coverage_area: record.coverage_area || '', spatial_resolution: record.spatial_resolution || '',
      temporal_resolution: record.temporal_resolution || '', licence_info: record.licence_info || '',
      access_conditions: record.access_conditions || '', cost_info: record.cost_info || '',
      limitation_notes: record.limitation_notes || '', reliability_status: record.reliability_status || '',
      contact_info: record.contact_info || '',
    });
    setModal('edit-geosource');
  };

  const updateGeoSource = async () => {
    const missing = REQUIRED_BY_PATH['/sia/external-geo-sources'].filter(field => {
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
      await patchApi(`/sia/external-geo-sources/${encodeURIComponent(fv.id)}`, body);
      notifications.show({ title: 'External Geo Source updated', message: 'The external geo source was saved successfully.', color: 'green' });
      rGeo();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Unable to update External Geo Source', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const selectSite = (id) => {
    if (localStorage.getItem('sia_site_id') !== id) localStorage.removeItem('sia_survey_visit_id');
    if (id) localStorage.setItem('sia_site_id', id);
    else localStorage.removeItem('sia_site_id');
    setLoaded(id);
    setGisLayer(null);
    closeModal();
    setTab('map');
  };

  const handleLoad = () => {
    setSitesReload(value => value + 1);
    rLayer(); rGeo();
  };

  return (
    <Box className={styles.root} p={{ base: 'sm', sm: 'lg' }}>
      <Box mb="lg">
        <Group gap="sm" mb={4}>
          <Badge color="green" variant="light" size="lg" radius="sm">SIA</Badge>
          <Text size="xs" c="dimmed" fw={500}>Module 1 · Section 4B</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">GIS Mapping</Title>
        <Text size="sm" c="#6b7280" mt={4}>
          Manage GIS layers, features, and external geographic data sources.
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
              onClick={() => openModal('layer')}>+ New Layer</Button>
          </Group>
        </Group>
        <Select label="Select site" placeholder={sitesLoading ? 'Loading sites...' : 'Select a site to continue'}
          mt="sm" searchable allowDeselect={false} value={loadedSiteId || null}
          data={sites.map(site => ({ value: site.id, label: [site.site_code, site.site_name].filter(Boolean).join(' / ') }))}
          disabled={sitesLoading || saving || !sites.length} error={sitesError || undefined}
          onChange={value => selectSite(value || '')} />
        {!caseId && <Text size="xs" c="dimmed" mt={6}>Select an SIA case in Start and Case Control first.</Text>}
        {caseId && !sitesLoading && !sitesError && !sites.length && <Text size="xs" c="dimmed" mt={6}>Create a site in Sites and Survey for this case to continue.</Text>}
      </Paper>

      {gisLayer && (
        <Paper p="sm" mb="md" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
          <Group gap="xl" wrap="wrap">
            <Text size="xs" c="#374151">Layer: <Text span fw={700} c="#007336">{gisLayer.layer_name || 'Selected layer'}</Text></Text>
            <Button variant="subtle" color="gray" size="xs" ml="auto"
              onClick={() => { setGisLayer(null); setTab('map'); }}>Clear</Button>
          </Group>
        </Paper>
      )}

      {loadedSiteId && (
        <Tabs value={activeTab} onChange={setTab} color="green">
          <Group className={styles.actions} justify="flex-end" mb="md">
            <Button color="green" variant="light" leftSection={<IconFileText size={16} />} onClick={() => setTab('report')}>View report</Button>
          </Group>
          <Box className={styles.sectionSelect} mb="md">
            <Select label="GIS mapping section" value={activeTab} onChange={value => value && setTab(value)} allowDeselect={false}
              data={sections.map(({ value, label, enabled }) => ({ value, label, disabled: !enabled }))} />
            <Text size="xs" c="dimmed" mt={6} aria-live="polite">Section {sections.findIndex(section => section.value === activeTab) + 1} of {sections.length}</Text>
            {!gisLayer && <Text size="xs" c="dimmed" mt={4}>Select a GIS layer to open its features.</Text>}
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

          <Tabs.Panel value="map">
            <GISMap 
              site={sites.find(s => s.id === loadedSiteId)}
              layers={gisLayers}
              features={gisFeatures}
              onFeatureClick={(feature) => {
                // Find the layer for this feature
                const layer = gisLayers.find(l => l.id === feature.gis_layer_id);
                if (layer) {
                  setGisLayer(layer);
                  setTab('features');
                }
              }}
            />
          </Tabs.Panel>

          <Tabs.Panel value="layers">
            <TabHeader title="GIS Layers" onAdd={() => openModal('layer')} addLabel="Add Layer" />
            <DataTable loading={layL} cols={['Layer Name', 'Type', 'Geometry', 'CRS', 'Source', 'Reliability', 'Active', '']}
              rows={gisLayers} render={r => (
                <Table.Tr key={r.id} onClick={() => { setGisLayer(r); setTab('features'); }}
                  style={{ cursor: 'pointer', backgroundColor: gisLayer?.id === r.id ? '#f0fdf4' : 'transparent' }}
                  onMouseEnter={e => { if (gisLayer?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={e => { if (gisLayer?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <Table.Td><Button variant="subtle" color="green" className={styles.recordButton} aria-pressed={gisLayer?.id === r.id}>{r.layer_name || 'Reference'}</Button></Table.Td>
                  <Table.Td><Text size="sm">{r.layer_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.geometry_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.crs || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.source_name || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                  <Table.Td><BoolBadge v={r.is_active} /></Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                    onClick={event => { event.stopPropagation(); openEditLayer(r); }}>Edit</Button></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          <Tabs.Panel value="features">
            <TabHeader title={`Features — ${gisLayer?.layer_name || ''}`} onAdd={() => openModal('feature')} addLabel="Add Feature" />
            <DataTable loading={featL} cols={['Code', 'Name', 'Type', 'Reliability', 'POI ID', '']}
              rows={gisFeatures} render={r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{r.feature_code || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.feature_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.feature_type || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                  <Table.Td><Text size="xs" c="#9ca3af" style={{ fontFamily: 'monospace' }}>{r.poi_id || '—'}</Text></Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                    onClick={() => openEditFeature(r)}>Edit</Button></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          <Tabs.Panel value="geosources">
            <TabHeader title="External Geo Sources" onAdd={() => openModal('geosource')} addLabel="Add Source" />
            <DataTable loading={geoL} cols={['Provider', 'Dataset', 'Type', 'Source Ref', 'Reliability', '']}
              rows={geoSources} render={r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Text size="sm" fw={600}>{r.provider_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.dataset_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.source_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" className={styles.description}>{r.source_reference || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="green" leftSection={<IconEdit size={13} />}
                    onClick={() => openEditGeoSource(r)}>Edit</Button></Table.Td>
                </Table.Tr>
              )} />
          </Tabs.Panel>

          <Tabs.Panel value="report">
            {activeTab === 'report' && <SIAGISReport api={API} siteId={loadedSiteId} />}
          </Tabs.Panel>
        </Tabs>
      )}

      {/* MODALS */}
      <FormModal opened={modal === 'layer'} onClose={closeModal} title="New GIS Layer" saving={saving}
        onSubmit={() => save('/sia/gis-layers', fv, rLayer)}>
        <FR><FI label="Layer Name *" field="layer_name" fv={fv} setFv={setFv} /><FI label="Layer Type" field="layer_type" fv={fv} setFv={setFv} select={LAYER_TYPES} /></FR>
        <FR><FI label="Geometry Type" field="geometry_type" fv={fv} setFv={setFv} select={GEOM_TYPES} /><FI label="CRS" field="crs" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Source Name" field="source_name" fv={fv} setFv={setFv} /><FI label="Source Date" field="source_date" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Resolution/Scale" field="resolution_scale" fv={fv} setFv={setFv} /><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY_STATUS} /></FR>
        <FI label="Licence Info" field="licence_info" fv={fv} setFv={setFv} />
        <Group mt="sm" gap="xs"><Text size="xs" fw={600} c="#374151">Active</Text>
          <Switch aria-label="Active" checked={fv.is_active !== false} onChange={e => setFv(p => ({ ...p, is_active: e.currentTarget.checked }))} color="green" />
        </Group>
      </FormModal>

      <FormModal opened={modal === 'edit-layer'} onClose={closeModal} title="Edit GIS Layer" saving={saving}
        onSubmit={updateLayer}>
        <FR><FI label="Layer Name" field="layer_name" fv={fv} setFv={setFv} /><FI label="Layer Type" field="layer_type" fv={fv} setFv={setFv} select={LAYER_TYPES} /></FR>
        <FR><FI label="Geometry Type" field="geometry_type" fv={fv} setFv={setFv} select={GEOM_TYPES} /><FI label="CRS" field="crs" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Source Name" field="source_name" fv={fv} setFv={setFv} /><FI label="Source Date" field="source_date" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Resolution/Scale" field="resolution_scale" fv={fv} setFv={setFv} /><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY_STATUS} /></FR>
        <FI label="Licence Info" field="licence_info" fv={fv} setFv={setFv} />
        <Group mt="sm" gap="xs"><Text size="xs" fw={600} c="#374151">Active</Text>
          <Switch aria-label="Active" checked={fv.is_active !== false} onChange={e => setFv(p => ({ ...p, is_active: e.currentTarget.checked }))} color="green" />
        </Group>
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'feature'} onClose={closeModal} title="Add GIS Feature" saving={saving}
        onSubmit={() => save('/sia/gis-features', { gis_layer_id: lid, ...fv }, rFeat)}>
        <FI label="Feature Name" field="feature_name" fv={fv} setFv={setFv} />
        <FR><FI label="Feature Type" field="feature_type" fv={fv} setFv={setFv} /><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY_STATUS} /></FR>
        
        <FI label="Geometry Data (GeoJSON/WKT)" field="geometry_data" fv={fv} setFv={setFv} textarea />
        <FI label="Description" field="description" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-feature'} onClose={closeModal} title="Edit GIS Feature" saving={saving}
        onSubmit={updateFeature}>
        <FI label="Feature Name" field="feature_name" fv={fv} setFv={setFv} />
        <FR><FI label="Feature Type" field="feature_type" fv={fv} setFv={setFv} /><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY_STATUS} /></FR>
        
        <FI label="Geometry Data (GeoJSON/WKT)" field="geometry_data" fv={fv} setFv={setFv} textarea />
        <FI label="Description" field="description" fv={fv} setFv={setFv} textarea />
        <FI label="Remarks" field="remarks" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'geosource'} onClose={closeModal} title="Add External Geo Source" saving={saving}
        onSubmit={() => save('/sia/external-geo-sources', fv, rGeo)}>
        <FR><FI label="Provider Name *" field="provider_name" fv={fv} setFv={setFv} /><FI label="Dataset Name *" field="dataset_name" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Source Type" field="source_type" fv={fv} setFv={setFv} select={SOURCE_TYPES} /><FI label="Source Reference" field="source_reference" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Imported At" field="imported_at" fv={fv} setFv={setFv} /><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY_STATUS} /></FR>
        <FI label="Licence Info" field="licence_info" fv={fv} setFv={setFv} />
        <FI label="Limitation Notes" field="limitation_notes" fv={fv} setFv={setFv} textarea />
      </FormModal>

      <FormModal opened={modal === 'edit-geosource'} onClose={closeModal} title="Edit External Geo Source" saving={saving}
        onSubmit={updateGeoSource}>
        <FR><FI label="Provider Name" field="provider_name" fv={fv} setFv={setFv} /><FI label="Dataset Name" field="dataset_name" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Source Type" field="source_type" fv={fv} setFv={setFv} select={SOURCE_TYPES} /><FI label="Source Reference" field="source_reference" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Imported At" field="imported_at" fv={fv} setFv={setFv} /><FI label="Reliability Status" field="reliability_status" fv={fv} setFv={setFv} select={RELIABILITY_STATUS} /></FR>
        <FR><FI label="Publication Date" field="publication_date" fv={fv} setFv={setFv} /><FI label="Spatial Resolution" field="spatial_resolution" fv={fv} setFv={setFv} /></FR>
        <FR><FI label="Coverage Area" field="coverage_area" fv={fv} setFv={setFv} /><FI label="Temporal Resolution" field="temporal_resolution" fv={fv} setFv={setFv} /></FR>
        <FI label="Licence Info" field="licence_info" fv={fv} setFv={setFv} />
        <FI label="Access Conditions" field="access_conditions" fv={fv} setFv={setFv} textarea />
        <FI label="Cost Info" field="cost_info" fv={fv} setFv={setFv} />
        <FI label="Limitation Notes" field="limitation_notes" fv={fv} setFv={setFv} textarea />
        <FI label="Contact Info" field="contact_info" fv={fv} setFv={setFv} />
      </FormModal>
    </Box>
  );
}




