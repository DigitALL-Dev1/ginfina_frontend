import React, { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader, Modal,
  Paper, Select, Stack, Tabs, Table, Text, Textarea,
  TextInput, Title, NumberInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconGitCompare, IconListDetails, IconSourceCode, IconScale,
  IconReplace, IconEye,
} from '@tabler/icons-react';
import SIAStepFlow from '../components/common/SIAStepFlow';
import { autoCode } from '../utils/autoCode';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const thS = { fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' };

// Status options
const CHANGE_TYPES = ['NEW_EVIDENCE', 'CORRECTION', 'SITE_CHANGE', 'DESIGN_INPUT_CHANGE', 'REASSESSMENT', 'ADMINISTRATIVE'];
const MATERIALITY = ['EDITORIAL', 'NON_MATERIAL', 'MATERIAL'];
const CHANGE_STATUS = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'IMPLEMENTED', 'REJECTED', 'CANCELLED'];
const CHANGE_ACTIONS = ['ADD', 'MODIFY', 'SUPERSEDE', 'REMOVE_FROM_CURRENT', 'NO_CHANGE'];
const SOURCE_TYPES = ['NEW_FIELD_EVIDENCE', 'CLIENT_DOCUMENT', 'ENGINEERING_REVIEW', 'DRONE_GIS', 'SPECIALIST_REPORT', 'SITE_REASSESSMENT'];
const SUPERSESSION_STATUS = ['ACTIVE', 'SUPERSEDED', 'ARCHIVED'];
const REVIEW_STATUS = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
const REVIEW_DECISIONS = ['ACCEPT_CHANGE', 'REJECT_CHANGE', 'CHANGE_REQUIRED', 'REASSESSMENT_REQUIRED'];
const DISCIPLINES = ['ELECTRICAL', 'CIVIL', 'STRUCTURAL', 'MECHANICAL', 'WATER_PUMPING', 'SCADA', 'HSE', 'CLIMATE_ENVIRONMENT', 'LOGISTICS'];
const REVIEWER_USERS = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'user-9', 'user-10'];

// ── Utility hooks ────────────────────────────────────────
function useApi(url, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const urlRef = React.useRef(url);
  urlRef.current = url;
  const reload = React.useCallback(() => {
    if (!urlRef.current) return;
    setLoading(true);
    fetch(urlRef.current)
      .then(r => r.json())
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line
  useEffect(() => { reload(); }, deps); // eslint-disable-line
  return { data, loading, reload };
}

async function postApi(path, body) {
  const cleaned = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, v === '' ? null : v]));
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleaned),
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Reusable components ──────────────────────────────────
function EmptyRow({ cols }) {
  return <Table.Tr><Table.Td colSpan={cols} style={{ textAlign: 'center', padding: '30px 0' }}><Text size="sm" c="dimmed">No records found.</Text></Table.Td></Table.Tr>;
}

function DataTable({ loading, cols, rows, render }) {
  return (
    <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 8, position: 'relative', minHeight: 120 }}>
      {loading && <Group justify="center" py="xl"><Loader color="green" size="sm" /></Group>}
      {!loading && <Table verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
          <Table.Tr>{cols.map(c => <Table.Th key={c} style={thS}>{c}</Table.Th>)}</Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows.length === 0 ? <EmptyRow cols={cols.length} /> : rows.map(render)}</Table.Tbody>
      </Table>}
    </Paper>
  );
}

function TabHeader({ title, onAdd, addLabel, disabled = false }) {
  return (
    <Group justify="space-between" mb="sm">
      <Text fw={600} size="sm" c="#374151">{title}</Text>
      <Button size="xs" color="green" leftSection={<IconListDetails size={13} />} disabled={disabled}
        onClick={onAdd} style={{ backgroundColor: disabled ? undefined : '#007336' }}>{addLabel}</Button>
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
          <Button color="green" loading={saving} onClick={onSubmit} style={{ backgroundColor: '#007336' }}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function FormRow({ children }) { return <Group grow align="flex-start" gap="sm">{children}</Group>; }

function FI({ label, field, fv, setFv, textarea, number, select, readonly, dateField }) {
  const val = fv[field] ?? '';
  const onChange = v => setFv(p => ({ ...p, [field]: v }));

  const s = { 
    input: { 
      borderColor: readonly ? '#bbf7d0' : '#d1d5db', 
      borderRadius: 6, 
      height: textarea ? undefined : 36, 
      backgroundColor: readonly ? '#f0fdf4' : undefined,
      fontSize: 14,
    },
  };

  if (select) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text><Select data={select} value={val} onChange={v => onChange(v || '')} clearable searchable styles={s} /></Box>;
  if (textarea) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text><Textarea value={val} onChange={e => onChange(e.target.value)} autosize minRows={2} styles={s} /></Box>;
  if (number) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text><NumberInput value={val === '' ? undefined : val} onChange={v => onChange(v)} styles={s} /></Box>;
  if (dateField) {
    return (
      <Box>
        <Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text>
        <input
          type="date"
          value={val || ''}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            height: '36px',
            padding: '0 12px',
            fontSize: '14px',
            fontFamily: 'inherit',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: readonly ? '#f0fdf4' : '#fff',
            color: '#374151',
            cursor: readonly ? 'not-allowed' : 'pointer',
            outline: 'none',
          }}
          onFocus={(e) => { if (!readonly) e.target.style.borderColor = '#007336'; }}
          onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
          readOnly={readonly}
        />
      </Box>
    );
  }

  return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text><TextInput value={val} onChange={e => onChange(e.target.value)} readOnly={readonly} styles={s} /></Box>;
}

function SBadge({ v }) {
  const m = {
    draft: '#6b7280', in_review: '#1971c2', approved: '#007336', implemented: '#007336', rejected: '#e03131', cancelled: '#868e96',
    editorial: '#007336', non_material: '#f08c00', material: '#e03131',
    pending: '#6b7280', in_progress: '#f08c00', completed: '#007336',
    active: '#007336', superseded: '#f08c00', archived: '#868e96',
  };
  const col = m[(v || '').toLowerCase().replace(/ /g, '_')] || '#6b7280';
  return <Badge size="sm" radius="xl" style={{ backgroundColor: col + '18', color: col, border: 'none', fontWeight: 600 }}>{v || '—'}</Badge>;
}

// ════════════════════════════════════════════════════════
export default function SEBRevisionChangeLayout() {
  // ── State management ──────────────────────────────────
  const [selectedChange, setChange] = useState(null);
  const [activeTab, setTab] = useState('changes');
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fv, setFv] = useState({});
  const [sebId, setSebId] = useState(localStorage.getItem('seb_id'));

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newSebId = localStorage.getItem('seb_id');
      console.log('localStorage changed, new seb_id:', newSebId);
      setSebId(newSebId);
    };

    // Check localStorage on mount
    const initialSebId = localStorage.getItem('seb_id');
    console.log('Initial seb_id from localStorage:', initialSebId);
    setSebId(initialSebId);

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // ── Data loading ──────────────────────────────────────
  const { data: changes, loading: changesLoading, reload: reloadChanges } = useApi(
    sebId ? `${API_BASE}/seb/revision-changes?seb_id=${sebId}` : null,
    [sebId]
  );

  const changeId = selectedChange?.id;
  const { data: changeItems, loading: itemsLoading, reload: reloadItems } = useApi(
    changeId ? `${API_BASE}/seb/change-items?revision_change_id=${changeId}` : null,
    [changeId]
  );
  const { data: changeSources, loading: sourcesLoading, reload: reloadSources } = useApi(
    changeId ? `${API_BASE}/seb/change-sources?revision_change_id=${changeId}` : null,
    [changeId]
  );
  const { data: comparisons, loading: comparisonsLoading, reload: reloadComparisons } = useApi(
    changeId ? `${API_BASE}/seb/revision-comparisons?revision_change_id=${changeId}` : null,
    [changeId]
  );
  const { data: supersessions, loading: supersessionsLoading, reload: reloadSupersessions } = useApi(
    sebId ? `${API_BASE}/seb/revision-supersessions` : null,
    [sebId]
  );
  const { data: reviews, loading: reviewsLoading, reload: reloadReviews } = useApi(
    changeId ? `${API_BASE}/seb/change-reviews?revision_change_id=${changeId}` : null,
    [changeId]
  );

  // ── Modal handlers ────────────────────────────────────
  const openModal = (key, defaults = {}) => {
    const codePrefills = {
      change: { 
        seb_id: sebId || '',
        current_revision_id: localStorage.getItem('seb_revision_id') || '',
        change_code: autoCode('CHG'),
        materiality: 'NON_MATERIAL',
        change_status: 'DRAFT',
        raised_by: localStorage.getItem('user_id') || 'system'
      },
      item: { 
        revision_change_id: selectedChange?.id || '',
        change_action: 'MODIFY'
      },
      source: { 
        revision_change_id: selectedChange?.id || ''
      },
      comparison: { 
        revision_change_id: selectedChange?.id || '',
        old_revision_id: selectedChange?.current_revision_id || '',
        changed_item_count: 0,
        added_item_count: 0,
        modified_item_count: 0,
        superseded_item_count: 0
      },
      supersession: { 
        status: 'ACTIVE',
        superseded_by: localStorage.getItem('user_id') || 'system'
      },
      review: { 
        revision_change_id: selectedChange?.id || '',
        reviewer_user_id: localStorage.getItem('user_id') || 'system',
        review_status: 'PENDING'
      },
    };
    setFv({ ...(codePrefills[key] || {}), ...defaults });
    setModal(key);
  };

  const closeModal = () => { setModal(null); setFv({}); };

  const save = async (path, body, reload) => {
    setSaving(true);
    try {
      await postApi(path, body);
      notifications.show({ title: 'Saved', message: 'Record created successfully.', color: 'green' });
      reload();
      closeModal();
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p="lg">
      {/* Header */}
      <Box mb="lg">
        <Group gap="sm" mb={4}>
          <Badge color="teal" variant="light" size="lg" radius="sm">SEP</Badge>
          <Text size="xs" c="dimmed" fw={500}>Site Engineering Preparation · Revision & Change Control</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">SEB Revision & Change Control</Title>
        <Text size="sm" c="#6b7280" mt={4}>
          Manage changes after SEB release. Released SEBs are immutable - new material creates new revisions.
        </Text>
      </Box>

      {/* Warning or Action bar */}
      {!sebId ? (
        <Paper p="md" mb="md" style={{ border: '1px solid #fef3c7', borderRadius: 8, backgroundColor: '#fffbeb' }}>
          <Group gap="sm" align="center">
            <IconGitCompare size={20} color="#f59e0b" />
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={600} c="#92400e">No SEB Selected</Text>
              <Text size="xs" c="#78350f" mt={4}>
                Please select a SEB from the SEB Preparation module first. The SEB ID will be stored in your session.
              </Text>
            </div>
          </Group>
        </Paper>
      ) : (
        <Paper p="sm" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb' }}>
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Text size="xs" fw={700} c="#374151">Revision Changes</Text>
              <Badge size="xs" variant="light">SEB: {sebId.substring(0, 8)}...</Badge>
            </Group>
            <Button
              size="xs"
              color="green"
              variant="outline"
              onClick={() => openModal('change')}
            >
              + New Change Request
            </Button>
          </Group>
        </Paper>
      )}

      {/* Empty state message */}
      {sebId && changes.length === 0 && !changesLoading && (
        <Paper p="md" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb', textAlign: 'center' }}>
          <Text size="sm" c="#6b7280" mb="sm">No change requests created yet.</Text>
          <Text size="xs" c="#9ca3af">Click "+ New Change Request" above to create your first revision change.</Text>
        </Paper>
      )}

      {/* Changes list */}
      {changes.length > 0 && (
        <Paper p="md" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Text size="xs" fw={700} c="#374151" mb={8}>Select Change Request</Text>
          {changesLoading ? <Loader size="sm" color="green" /> : (
            <Table verticalSpacing="xs" horizontalSpacing="md">
              <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
                <Table.Tr>
                  <Table.Th style={thS}>Change Code</Table.Th>
                  <Table.Th style={thS}>Type</Table.Th>
                  <Table.Th style={thS}>Materiality</Table.Th>
                  <Table.Th style={thS}>Status</Table.Th>
                  <Table.Th style={thS}>Reason</Table.Th>
                  <Table.Th style={thS}>Raised</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {changes.map(change => {
                  const isSel = selectedChange?.id === change.id;
                  return (
                    <Table.Tr
                      key={change.id}
                      onClick={() => { 
                        setChange(change); 
                        setTab('items');
                        localStorage.setItem('revision_change_id', change.id);
                      }}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSel ? '#f0fdf4' : 'transparent',
                        outline: isSel ? '2px solid #007336' : 'none',
                        outlineOffset: '-2px'
                      }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <Table.Td><Text size="sm" fw={600} c="#007336">{change.change_code}</Text></Table.Td>
                      <Table.Td><Badge size="sm" color="blue" variant="light">{change.change_type || '—'}</Badge></Table.Td>
                      <Table.Td><SBadge v={change.materiality} /></Table.Td>
                      <Table.Td><SBadge v={change.change_status} /></Table.Td>
                      <Table.Td><Text size="sm" c="#6b7280" truncate maw={250}>{change.change_reason}</Text></Table.Td>
                      <Table.Td><Text size="xs" c="#6b7280">{new Date(change.raised_at).toLocaleDateString()}</Text></Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      )}

      {/* Selected change context */}
      {selectedChange && (
        <Paper p="sm" mb="md" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
          <Group gap="xl" wrap="wrap">
            <Text size="xs" c="#374151">Change: <Text span fw={700} c="#007336">{selectedChange.change_code}</Text></Text>
            <Text size="xs" c="#374151">Status: <Text span fw={600}><SBadge v={selectedChange.change_status} /></Text></Text>
            <Text size="xs" c="#374151">Materiality: <Text span fw={600}><SBadge v={selectedChange.materiality} /></Text></Text>
            <Text size="xs" c="#9ca3af" style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={() => setChange(null)}>Clear</Text>
          </Group>
        </Paper>
      )}

      {/* Tabs */}
      {selectedChange && (
        <Tabs value={activeTab} onChange={setTab} color="green">
          <SIAStepFlow
            activeTab={activeTab}
            onStep={setTab}
            steps={[
              { value: 'items', label: 'Change Items', icon: <IconListDetails size={13} />, enabled: true },
              { value: 'sources', label: 'Sources', icon: <IconSourceCode size={13} />, enabled: true },
              { value: 'comparisons', label: 'Comparisons', icon: <IconGitCompare size={13} />, enabled: true },
              { value: 'supersessions', label: 'Supersessions', icon: <IconReplace size={13} />, enabled: true },
              { value: 'reviews', label: 'Reviews', icon: <IconEye size={13} />, enabled: true },
            ]}
          />
          <Tabs.List style={{ display: 'none' }}>
            <Tabs.Tab value="items">Items</Tabs.Tab>
            <Tabs.Tab value="sources">Sources</Tabs.Tab>
            <Tabs.Tab value="comparisons">Comparisons</Tabs.Tab>
            <Tabs.Tab value="supersessions">Supersessions</Tabs.Tab>
            <Tabs.Tab value="reviews">Reviews</Tabs.Tab>
          </Tabs.List>

          {/* CHANGE ITEMS */}
          <Tabs.Panel value="items">
            <TabHeader
              title="Affected SEB Items"
              onAdd={() => openModal('item')}
              addLabel="Add Item"
            />
            <DataTable
              loading={itemsLoading}
              cols={['Action', 'Old Item', 'New Item', 'Discipline', 'Old Value', 'New Value']}
              rows={changeItems}
              render={r => (
                <Table.Tr
                  key={r.id}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Table.Td><Badge size="sm" color="cyan" variant="light">{r.change_action}</Badge></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280" style={{ fontFamily: 'monospace' }}>{r.old_seb_item_id ? r.old_seb_item_id.substring(0, 8) + '...' : '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280" style={{ fontFamily: 'monospace' }}>{r.new_seb_item_id ? r.new_seb_item_id.substring(0, 8) + '...' : '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" fw={600}>{r.discipline || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={150}>{r.old_value || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={150}>{r.new_value || '—'}</Text></Table.Td>
                </Table.Tr>
              )}
            />
          </Tabs.Panel>

          {/* CHANGE SOURCES */}
          <Tabs.Panel value="sources">
            <TabHeader
              title="Change Sources"
              onAdd={() => openModal('source')}
              addLabel="Add Source"
            />
            <DataTable
              loading={sourcesLoading}
              cols={['Source Type', 'Reference', 'Description', 'Received']}
              rows={changeSources}
              render={r => (
                <Table.Tr
                  key={r.id}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Table.Td><Badge size="sm" color="blue" variant="light">{r.source_type}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{r.source_reference || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={300}>{r.source_description || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.received_at ? new Date(r.received_at).toLocaleDateString() : '—'}</Text></Table.Td>
                </Table.Tr>
              )}
            />
          </Tabs.Panel>

          {/* REVISION COMPARISONS */}
          <Tabs.Panel value="comparisons">
            <TabHeader
              title="Revision Comparisons"
              onAdd={() => openModal('comparison')}
              addLabel="Add Comparison"
            />
            <DataTable
              loading={comparisonsLoading}
              cols={['Section', 'Changed', 'Added', 'Modified', 'Superseded', 'Summary']}
              rows={comparisons}
              render={r => (
                <Table.Tr
                  key={r.id}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Table.Td><Text size="sm" fw={600}>{r.section_name || 'Overall'}</Text></Table.Td>
                  <Table.Td><Badge size="sm" color="gray" variant="light">{r.changed_item_count}</Badge></Table.Td>
                  <Table.Td><Badge size="sm" color="green" variant="light">{r.added_item_count}</Badge></Table.Td>
                  <Table.Td><Badge size="sm" color="orange" variant="light">{r.modified_item_count}</Badge></Table.Td>
                  <Table.Td><Badge size="sm" color="red" variant="light">{r.superseded_item_count}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={300}>{r.comparison_summary || '—'}</Text></Table.Td>
                </Table.Tr>
              )}
            />
          </Tabs.Panel>

          {/* SUPERSESSIONS */}
          <Tabs.Panel value="supersessions">
            <TabHeader
              title="Revision Supersessions"
              onAdd={() => openModal('supersession')}
              addLabel="Add Supersession"
            />
            <DataTable
              loading={supersessionsLoading}
              cols={['Old Revision', 'New Revision', 'Status', 'Reason', 'Superseded By', 'Date']}
              rows={supersessions}
              render={r => (
                <Table.Tr
                  key={r.id}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Table.Td><Text size="xs" c="#6b7280" style={{ fontFamily: 'monospace' }}>{r.old_revision_id.substring(0, 8)}...</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#007336" fw={600} style={{ fontFamily: 'monospace' }}>{r.new_revision_id.substring(0, 8)}...</Text></Table.Td>
                  <Table.Td><SBadge v={r.status} /></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={200}>{r.supersession_reason || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280" style={{ fontFamily: 'monospace' }}>{r.superseded_by.substring(0, 8)}...</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{new Date(r.superseded_at).toLocaleDateString()}</Text></Table.Td>
                </Table.Tr>
              )}
            />
          </Tabs.Panel>

          {/* CHANGE REVIEWS */}
          <Tabs.Panel value="reviews">
            <TabHeader
              title="Change Reviews"
              onAdd={() => openModal('review')}
              addLabel="Add Review"
            />
            <DataTable
              loading={reviewsLoading}
              cols={['Reviewer', 'Discipline', 'Status', 'Decision', 'Comment', 'Reviewed']}
              rows={reviews}
              render={r => (
                <Table.Tr
                  key={r.id}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Table.Td><Text size="xs" c="#6b7280" style={{ fontFamily: 'monospace' }}>{r.reviewer_user_id.substring(0, 8)}...</Text></Table.Td>
                  <Table.Td><Text size="sm" fw={600}>{r.discipline}</Text></Table.Td>
                  <Table.Td><SBadge v={r.review_status} /></Table.Td>
                  <Table.Td><Badge size="sm" color="cyan" variant="light">{r.review_decision || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280" truncate maw={250}>{r.review_comment || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : '—'}</Text></Table.Td>
                </Table.Tr>
              )}
            />
          </Tabs.Panel>
        </Tabs>
      )}

      {/* MODALS */}
      {/* Change Request Modal */}
      <FormModal
        opened={modal === 'change'}
        onClose={closeModal}
        title="Create Change Request"
        saving={saving}
        onSubmit={() => save('/seb/revision-changes', fv, reloadChanges)}
      >
        <FI label="SEB ID" field="seb_id" fv={fv} setFv={setFv} readonly />
        <FI label="Current Revision ID" field="current_revision_id" fv={fv} setFv={setFv} readonly />
        <FI label="Change Code" field="change_code" fv={fv} setFv={setFv} readonly />
        <FormRow>
          <FI label="Change Type" field="change_type" fv={fv} setFv={setFv} select={CHANGE_TYPES} />
          <FI label="Materiality" field="materiality" fv={fv} setFv={setFv} select={MATERIALITY} />
        </FormRow>
        <FormRow>
          <FI label="Change Status" field="change_status" fv={fv} setFv={setFv} select={CHANGE_STATUS} />
          <FI label="Raised By" field="raised_by" fv={fv} setFv={setFv} select={REVIEWER_USERS} />
        </FormRow>
        <FI label="Proposed Revision ID (Optional)" field="proposed_revision_id" fv={fv} setFv={setFv} />
        <FI label="Change Reason" field="change_reason" fv={fv} setFv={setFv} textarea />
        <FI label="Change Description" field="change_description" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Change Item Modal */}
      <FormModal
        opened={modal === 'item'}
        onClose={closeModal}
        title="Add Change Item"
        saving={saving}
        onSubmit={() => save('/seb/change-items', fv, reloadItems)}
      >
        <FI label="Revision Change ID" field="revision_change_id" fv={fv} setFv={setFv} readonly />
        <FormRow>
          <FI label="Change Action" field="change_action" fv={fv} setFv={setFv} select={CHANGE_ACTIONS} />
          <FI label="Discipline" field="discipline" fv={fv} setFv={setFv} select={DISCIPLINES} />
        </FormRow>
        <FormRow>
          <FI label="Old SEB Item ID" field="old_seb_item_id" fv={fv} setFv={setFv} />
          <FI label="New SEB Item ID" field="new_seb_item_id" fv={fv} setFv={setFv} />
        </FormRow>
        <FI label="Old Value" field="old_value" fv={fv} setFv={setFv} textarea />
        <FI label="New Value" field="new_value" fv={fv} setFv={setFv} textarea />
        <FI label="Change Reason" field="change_reason" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Change Source Modal */}
      <FormModal
        opened={modal === 'source'}
        onClose={closeModal}
        title="Add Change Source"
        saving={saving}
        onSubmit={() => save('/seb/change-sources', fv, reloadSources)}
      >
        <FI label="Revision Change ID" field="revision_change_id" fv={fv} setFv={setFv} readonly />
        <FormRow>
          <FI label="Source Type" field="source_type" fv={fv} setFv={setFv} select={SOURCE_TYPES} />
          <FI label="Source Reference" field="source_reference" fv={fv} setFv={setFv} />
        </FormRow>
        <FI label="Source Record ID (Optional)" field="source_record_id" fv={fv} setFv={setFv} />
        <FI label="Source Description" field="source_description" fv={fv} setFv={setFv} textarea />
        <FI label="Received At" field="received_at" fv={fv} setFv={setFv} dateField />
      </FormModal>

      {/* Comparison Modal */}
      <FormModal
        opened={modal === 'comparison'}
        onClose={closeModal}
        title="Add Revision Comparison"
        saving={saving}
        onSubmit={() => save('/seb/revision-comparisons', fv, reloadComparisons)}
      >
        <FI label="Revision Change ID" field="revision_change_id" fv={fv} setFv={setFv} readonly />
        <FormRow>
          <FI label="Old Revision ID" field="old_revision_id" fv={fv} setFv={setFv} readonly />
          <FI label="New Revision ID" field="new_revision_id" fv={fv} setFv={setFv} />
        </FormRow>
        <FI label="Section Name (Optional)" field="section_name" fv={fv} setFv={setFv} />
        <FormRow>
          <FI label="Changed Count" field="changed_item_count" fv={fv} setFv={setFv} number />
          <FI label="Added Count" field="added_item_count" fv={fv} setFv={setFv} number />
        </FormRow>
        <FormRow>
          <FI label="Modified Count" field="modified_item_count" fv={fv} setFv={setFv} number />
          <FI label="Superseded Count" field="superseded_item_count" fv={fv} setFv={setFv} number />
        </FormRow>
        <FI label="Comparison Summary" field="comparison_summary" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Supersession Modal */}
      <FormModal
        opened={modal === 'supersession'}
        onClose={closeModal}
        title="Add Revision Supersession"
        saving={saving}
        onSubmit={() => save('/seb/revision-supersessions', fv, reloadSupersessions)}
      >
        <FormRow>
          <FI label="Old Revision ID" field="old_revision_id" fv={fv} setFv={setFv} />
          <FI label="New Revision ID" field="new_revision_id" fv={fv} setFv={setFv} />
        </FormRow>
        <FormRow>
          <FI label="Status" field="status" fv={fv} setFv={setFv} select={SUPERSESSION_STATUS} />
          <FI label="Superseded By" field="superseded_by" fv={fv} setFv={setFv} select={REVIEWER_USERS} />
        </FormRow>
        <FI label="Supersession Reason" field="supersession_reason" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Change Review Modal */}
      <FormModal
        opened={modal === 'review'}
        onClose={closeModal}
        title="Add Change Review"
        saving={saving}
        onSubmit={() => save('/seb/change-reviews', fv, reloadReviews)}
      >
        <FI label="Revision Change ID" field="revision_change_id" fv={fv} setFv={setFv} readonly />
        <FormRow>
          <FI label="Reviewer User ID" field="reviewer_user_id" fv={fv} setFv={setFv} select={REVIEWER_USERS} />
          <FI label="Discipline" field="discipline" fv={fv} setFv={setFv} select={DISCIPLINES} />
        </FormRow>
        <FormRow>
          <FI label="Review Status" field="review_status" fv={fv} setFv={setFv} select={REVIEW_STATUS} />
          <FI label="Review Decision" field="review_decision" fv={fv} setFv={setFv} select={REVIEW_DECISIONS} />
        </FormRow>
        <FI label="Review Comment" field="review_comment" fv={fv} setFv={setFv} textarea />
      </FormModal>
    </Box>
  );
}
