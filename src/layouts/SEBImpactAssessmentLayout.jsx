import DatePickerInput from '../components/common/DatePickerInput';
import React, { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader, Modal,
  Paper, Select, Stack, Tabs, Table, Text, Textarea,
  TextInput, Title, Switch, Alert, NumberInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconTargetArrow, IconGitBranch, IconAlertTriangle, IconArrowsDownUp,
  IconChecklist, IconUserCheck, IconBell,
} from '@tabler/icons-react';
import SIAStepFlow from '../components/common/SIAStepFlow';
import { autoCode } from '../utils/autoCode';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const thS = { fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' };

// Status and type options
const MATERIALITY = ['EDITORIAL', 'NON_MATERIAL', 'MATERIAL'];
const IMPACT_LEVELS = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const ASSESSMENT_STATUS = ['DRAFT', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'];
const CHANGE_TYPES = ['ADDED', 'REMOVED', 'MODIFIED', 'SUPERSEDED'];
const DISCIPLINES = ['ELECTRICAL', 'CIVIL', 'STRUCTURAL', 'MECHANICAL', 'WATER_PUMPING', 'SCADA', 'HSE', 'CLIMATE_ENVIRONMENT', 'LOGISTICS'];
const DOWNSTREAM_TYPES = ['EWP', 'EWB_INPUT', 'DESIGN_DOCUMENT', 'DESIGN_RELEASE', 'EBOM', 'BOQ', 'PROCUREMENT_REFERENCE'];
const ACTION_TYPES = ['REVIEW_EWP', 'UPDATE_DESIGN', 'RECALCULATE', 'REASSESS_DISCIPLINE', 'REVIEW_BOQ', 'REVIEW_EBOM', 'PROCUREMENT_REVIEW', 'NO_ACTION_REQUIRED'];
const PRIORITIES = ['P0', 'P1', 'P2', 'P3'];
const ACTION_STATUS = ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'];
const REVIEW_DECISIONS = ['IMPACT_CONFIRMED', 'NO_IMPACT', 'REASSESSMENT_REQUIRED', 'MORE_INFORMATION_REQUIRED', 'ACCEPT_FOR_NEW_REVISION'];
const RECIPIENT_TYPES = ['EWB', 'EWP_OWNER', 'PROJECT_ENGINEER', 'DISCIPLINE_ENGINEER', 'GCONNECT', 'PROJECT_TEAM'];
const NOTIFICATION_TYPES = ['EMAIL', 'SYSTEM', 'SMS'];
const NOTIFICATION_STATUS = ['PENDING', 'SENT', 'ACKNOWLEDGED', 'FAILED'];
const DOWNSTREAM_STATUS = ['IDENTIFIED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'ADDRESSED', 'NO_ACTION'];
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
      <Button size="xs" color="green" leftSection={<IconTargetArrow size={13} />} disabled={disabled}
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

function FI({ label, field, fv, setFv, textarea, number, select, readonly, switchCtrl, dateField }) {
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

  if (switchCtrl) {
    return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text><Switch checked={!!val} onChange={e => onChange(e.target.checked)} color="green" /></Box>;
  }
  if (select) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text><Select data={select} value={val} onChange={v => onChange(v || '')} clearable searchable styles={s} /></Box>;
  if (textarea) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text><Textarea value={val} onChange={e => onChange(e.target.value)} autosize minRows={2} styles={s} /></Box>;
  if (number) return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text><NumberInput value={val === '' ? undefined : val} onChange={v => onChange(v)} styles={s} /></Box>;
  if (dateField) return <DatePickerInput label={label} value={val} onChange={onChange} readOnly={readonly} styles={s} />;

  return <Box><Text size="xs" fw={600} c="#374151" mb={4}>{label}</Text><TextInput value={val} onChange={e => onChange(e.target.value)} readOnly={readonly} styles={s} /></Box>;
}

function SBadge({ v }) {
  const m = {
    draft: '#6b7280', in_progress: '#f08c00', under_review: '#1971c2', completed: '#007336', cancelled: '#868e96',
    editorial: '#1971c2', non_material: '#f08c00', material: '#e03131',
    none: '#868e96', low: '#1971c2', medium: '#f08c00', high: '#fd7e14', critical: '#e03131',
    added: '#007336', removed: '#e03131', modified: '#f08c00', superseded: '#868e96',
    open: '#e03131', blocked: '#fd7e14', 
    impact_confirmed: '#e03131', no_impact: '#007336', reassessment_required: '#f08c00',
    more_information_required: '#1971c2', accept_for_new_revision: '#007336',
    pending: '#6b7280', sent: '#1971c2', acknowledged: '#007336', failed: '#e03131',
    identified: '#1971c2', action_required: '#fd7e14', addressed: '#007336', no_action: '#868e96',
  };
  const col = m[(v || '').toLowerCase().replace(/ /g, '_')] || '#6b7280';
  return <Badge size="sm" radius="xl" style={{ backgroundColor: col + '18', color: col, border: 'none', fontWeight: 600 }}>{v || '—'}</Badge>;
}

// ════════════════════════════════════════════════════════
export default function SEBImpactAssessmentLayout() {
  // ── State management ──────────────────────────────────
  const [selectedAssessment, setAssessment] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fv, setFv] = useState({});

  // Get revision change ID from localStorage (set from Revision & Change Control module)
  const revisionChangeId = localStorage.getItem('revision_change_id');

  // ── Data loading ──────────────────────────────────────
  const { data: assessments, loading: assessmentsLoading, reload: reloadAssessments } = useApi(
    revisionChangeId ? `${API_BASE}/impact-assessments?revision_change_id=${revisionChangeId}` : null,
    [revisionChangeId]
  );

  const assessmentId = selectedAssessment?.id;
  const { data: items, loading: itemsLoading, reload: reloadItems } = useApi(
    assessmentId ? `${API_BASE}/impact-items?impact_assessment_id=${assessmentId}` : null,
    [assessmentId]
  );
  const { data: disciplines, loading: disciplinesLoading, reload: reloadDisciplines } = useApi(
    assessmentId ? `${API_BASE}/impact-disciplines?impact_assessment_id=${assessmentId}` : null,
    [assessmentId]
  );
  const { data: downstreams, loading: downstreamsLoading, reload: reloadDownstreams } = useApi(
    assessmentId ? `${API_BASE}/impact-downstreams?impact_assessment_id=${assessmentId}` : null,
    [assessmentId]
  );
  const { data: actions, loading: actionsLoading, reload: reloadActions } = useApi(
    assessmentId ? `${API_BASE}/impact-actions?impact_assessment_id=${assessmentId}` : null,
    [assessmentId]
  );
  const { data: reviews, loading: reviewsLoading, reload: reloadReviews } = useApi(
    assessmentId ? `${API_BASE}/impact-reviews?impact_assessment_id=${assessmentId}` : null,
    [assessmentId]
  );
  const { data: notifications, loading: notificationsLoading, reload: reloadNotifications } = useApi(
    assessmentId ? `${API_BASE}/impact-notifications?impact_assessment_id=${assessmentId}` : null,
    [assessmentId]
  );

  // ── Modal handlers ────────────────────────────────────
  const openModal = (key, defaults = {}) => {
    const codePrefills = {
      assessment: { 
        revision_change_id: revisionChangeId || '',
        source_revision_id: localStorage.getItem('seb_revision_id') || '',
        impact_code: autoCode('IMP'),
        assessment_status: 'DRAFT',
        assessed_by: localStorage.getItem('user_id') || 'system'
      },
      item: { 
        impact_assessment_id: selectedAssessment?.id || ''
      },
      discipline: { 
        impact_assessment_id: selectedAssessment?.id || '',
        is_affected: false,
        readiness_recheck: false,
        reassessment_required: false
      },
      downstream: { 
        impact_assessment_id: selectedAssessment?.id || '',
        action_required: false,
        status: 'IDENTIFIED'
      },
      action: { 
        impact_assessment_id: selectedAssessment?.id || '',
        action_code: autoCode('ACT'),
        action_status: 'OPEN'
      },
      review: { 
        impact_assessment_id: selectedAssessment?.id || ''
      },
      notification: { 
        impact_assessment_id: selectedAssessment?.id || '',
        notification_status: 'PENDING'
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
          <Text size="xs" c="dimmed" fw={500}>Site Engineering Preparation · Impact Assessment</Text>
        </Group>
        <Title order={2} fw={700} c="#111827">SEB Impact Assessment</Title>
        <Text size="sm" c="#6b7280" mt={4}>
          Determine what downstream engineering work is affected when an SEB item changes.
        </Text>
      </Box>

      {/* Warning Alert */}
      <Alert icon={<IconAlertTriangle size={16} />} title="Downstream Impact Control" color="orange" mb="md" variant="light">
        <Text size="xs">
          An EWP using R02 must remain on R02 until changed R03 items are formally reviewed and adopted. 
          The system <strong>never automatically switches</strong> downstream engineering to the newest SEB.
        </Text>
      </Alert>

      {/* Warning or Action bar */}
      {!revisionChangeId ? (
        <Paper p="md" mb="md" style={{ border: '1px solid #fef3c7', borderRadius: 8, backgroundColor: '#fffbeb' }}>
          <Group gap="sm" align="center">
            <IconTargetArrow size={20} color="#f59e0b" />
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={600} c="#92400e">No Revision Change Selected</Text>
              <Text size="xs" c="#78350f" mt={4}>
                Please select a revision change from the Revision & Change Control module first.
              </Text>
            </div>
          </Group>
        </Paper>
      ) : (
        <Paper p="sm" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb' }}>
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Text size="xs" fw={700} c="#374151">Impact Assessment Management</Text>
              <Badge size="xs" variant="light">Change: {revisionChangeId.substring(0, 8)}...</Badge>
            </Group>
            <Button
              size="xs"
              color="green"
              variant="outline"
              onClick={() => openModal('assessment')}
            >
              + New Impact Assessment
            </Button>
          </Group>
        </Paper>
      )}

      {/* Empty state */}
      {revisionChangeId && assessments.length === 0 && !assessmentsLoading && (
        <Paper p="md" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb', textAlign: 'center' }}>
          <Text size="sm" c="#6b7280" mb="sm">No impact assessments created yet.</Text>
          <Text size="xs" c="#9ca3af">Click "+ New Impact Assessment" above to analyze the impact of this change.</Text>
        </Paper>
      )}

      {/* Impact Assessments List */}
      {assessments.length > 0 && (
        <Paper p="md" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Text size="xs" fw={700} c="#374151" mb={8}>Impact Assessments</Text>
          <Table verticalSpacing="xs" horizontalSpacing="md">
            <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
              <Table.Tr>
                <Table.Th style={thS}>Impact Code</Table.Th>
                <Table.Th style={thS}>Materiality</Table.Th>
                <Table.Th style={thS}>Impact Level</Table.Th>
                <Table.Th style={thS}>Status</Table.Th>
                <Table.Th style={thS}>Assessed By</Table.Th>
                <Table.Th style={thS}>Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {assessments.map(assessment => {
                const isSel = selectedAssessment?.id === assessment.id;
                return (
                  <Table.Tr
                    key={assessment.id}
                    onClick={() => { setAssessment(assessment); }}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSel ? '#f0fdf4' : 'transparent',
                      outline: isSel ? '2px solid #007336' : 'none',
                      outlineOffset: '-2px'
                    }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Table.Td><Text size="sm" fw={600} c="#007336">{assessment.impact_code}</Text></Table.Td>
                    <Table.Td><SBadge v={assessment.materiality} /></Table.Td>
                    <Table.Td><SBadge v={assessment.overall_impact_level} /></Table.Td>
                    <Table.Td><SBadge v={assessment.assessment_status} /></Table.Td>
                    <Table.Td><Text size="xs" c="#6b7280" style={{ fontFamily: 'monospace' }}>{assessment.assessed_by.substring(0, 8)}...</Text></Table.Td>
                    <Table.Td><Text size="xs" c="#6b7280">{new Date(assessment.assessed_at).toLocaleDateString()}</Text></Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      {/* Assessment Details */}
      {selectedAssessment && (
        <>
          <Paper p="sm" mb="md" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
            <Group gap="xl" wrap="wrap">
              <Text size="xs" c="#374151">Impact: <Text span fw={700} c="#007336">{selectedAssessment.impact_code}</Text></Text>
              <Text size="xs" c="#374151">Materiality: <Text span fw={600}><SBadge v={selectedAssessment.materiality} /></Text></Text>
              <Text size="xs" c="#374151">Level: <Text span fw={600}><SBadge v={selectedAssessment.overall_impact_level} /></Text></Text>
              <Text size="xs" c="#9ca3af" style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={() => setAssessment(null)}>Clear</Text>
            </Group>
          </Paper>

          <Tabs defaultValue="items" color="green">
            <SIAStepFlow
              activeTab="items"
              onStep={() => {}}
              steps={[
                { value: 'items', label: 'Impact Items', icon: <IconGitBranch size={13} />, enabled: true },
                { value: 'disciplines', label: 'Disciplines', icon: <IconUserCheck size={13} />, enabled: true },
                { value: 'downstreams', label: 'Downstream', icon: <IconArrowsDownUp size={13} />, enabled: true },
                { value: 'actions', label: 'Actions', icon: <IconChecklist size={13} />, enabled: true },
                { value: 'reviews', label: 'Reviews', icon: <IconUserCheck size={13} />, enabled: true },
                { value: 'notifications', label: 'Notifications', icon: <IconBell size={13} />, enabled: true },
              ]}
            />
            <Tabs.List style={{ display: 'none' }}>
              <Tabs.Tab value="items">Items</Tabs.Tab>
              <Tabs.Tab value="disciplines">Disciplines</Tabs.Tab>
              <Tabs.Tab value="downstreams">Downstream</Tabs.Tab>
              <Tabs.Tab value="actions">Actions</Tabs.Tab>
              <Tabs.Tab value="reviews">Reviews</Tabs.Tab>
              <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
            </Tabs.List>

            {/* Impact Items */}
            <Tabs.Panel value="items">
              <TabHeader
                title="Impact Items"
                onAdd={() => openModal('item')}
                addLabel="Add Impact Item"
              />
              <DataTable
                loading={itemsLoading}
                cols={['Change Type', 'Discipline', 'Old Value', 'New Value', 'Impact Level', 'Description']}
                rows={items}
                render={r => (
                  <Table.Tr key={r.id}>
                    <Table.Td><SBadge v={r.change_type} /></Table.Td>
                    <Table.Td><Badge size="sm" color="blue" variant="light">{r.discipline || '—'}</Badge></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280" truncate maw={150}>{r.old_value || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280" truncate maw={150}>{r.new_value || '—'}</Text></Table.Td>
                    <Table.Td><SBadge v={r.impact_level} /></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280" truncate maw={200}>{r.impact_description || '—'}</Text></Table.Td>
                  </Table.Tr>
                )}
              />
            </Tabs.Panel>

            {/* Disciplines */}
            <Tabs.Panel value="disciplines">
              <TabHeader
                title="Affected Disciplines"
                onAdd={() => openModal('discipline')}
                addLabel="Add Discipline"
              />
              <DataTable
                loading={disciplinesLoading}
                cols={['Discipline', 'Affected', 'Impact Level', 'Readiness Recheck', 'Reassessment', 'Reason']}
                rows={disciplines}
                render={r => (
                  <Table.Tr key={r.id}>
                    <Table.Td><Badge size="sm" color="blue" variant="light">{r.discipline}</Badge></Table.Td>
                    <Table.Td><Badge size="sm" color={r.is_affected ? 'red' : 'gray'} variant="light">{r.is_affected ? 'Yes' : 'No'}</Badge></Table.Td>
                    <Table.Td><SBadge v={r.impact_level} /></Table.Td>
                    <Table.Td><Badge size="sm" color={r.readiness_recheck ? 'orange' : 'gray'} variant="light">{r.readiness_recheck ? 'Yes' : 'No'}</Badge></Table.Td>
                    <Table.Td><Badge size="sm" color={r.reassessment_required ? 'red' : 'gray'} variant="light">{r.reassessment_required ? 'Yes' : 'No'}</Badge></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280" truncate maw={250}>{r.reason || '—'}</Text></Table.Td>
                  </Table.Tr>
                )}
              />
            </Tabs.Panel>

            {/* Downstream Impacts */}
            <Tabs.Panel value="downstreams">
              <TabHeader
                title="Downstream Impacts"
                onAdd={() => openModal('downstream')}
                addLabel="Add Downstream"
              />
              <DataTable
                loading={downstreamsLoading}
                cols={['Type', 'Reference', 'Name', 'Current Rev', 'Impact Level', 'Action Req', 'Status']}
                rows={downstreams}
                render={r => (
                  <Table.Tr key={r.id}>
                    <Table.Td><Badge size="sm" color="cyan" variant="light">{r.downstream_type}</Badge></Table.Td>
                    <Table.Td><Text size="sm" fw={600} c="#007336">{r.downstream_reference}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280" truncate maw={150}>{r.downstream_name || '—'}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="#6b7280">{r.current_revision || '—'}</Text></Table.Td>
                    <Table.Td><SBadge v={r.impact_level} /></Table.Td>
                    <Table.Td><Badge size="sm" color={r.action_required ? 'red' : 'gray'} variant="light">{r.action_required ? 'Yes' : 'No'}</Badge></Table.Td>
                    <Table.Td><SBadge v={r.status} /></Table.Td>
                  </Table.Tr>
                )}
              />
            </Tabs.Panel>

            {/* Actions */}
            <Tabs.Panel value="actions">
              <TabHeader
                title="Impact Actions"
                onAdd={() => openModal('action')}
                addLabel="Add Action"
              />
              <DataTable
                loading={actionsLoading}
                cols={['Code', 'Type', 'Description', 'Owner', 'Priority', 'Target Date', 'Status']}
                rows={actions}
                render={r => (
                  <Table.Tr key={r.id}>
                    <Table.Td><Text size="sm" fw={600} c="#007336">{r.action_code || '—'}</Text></Table.Td>
                    <Table.Td><Badge size="sm" color="blue" variant="light">{r.action_type || '—'}</Badge></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280" truncate maw={250}>{r.action_description}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="#6b7280">{r.owner_user_id ? r.owner_user_id.substring(0, 8) + '...' : '—'}</Text></Table.Td>
                    <Table.Td><Badge size="sm" color={r.priority === 'P0' ? 'red' : r.priority === 'P1' ? 'orange' : 'gray'}>{r.priority || '—'}</Badge></Table.Td>
                    <Table.Td><Text size="xs" c="#6b7280">{r.target_date || '—'}</Text></Table.Td>
                    <Table.Td><SBadge v={r.action_status} /></Table.Td>
                  </Table.Tr>
                )}
              />
            </Tabs.Panel>

            {/* Reviews */}
            <Tabs.Panel value="reviews">
              <TabHeader
                title="Discipline Reviews"
                onAdd={() => openModal('review')}
                addLabel="Add Review"
              />
              <DataTable
                loading={reviewsLoading}
                cols={['Reviewer', 'Discipline', 'Decision', 'Comment', 'Date']}
                rows={reviews}
                render={r => (
                  <Table.Tr key={r.id}>
                    <Table.Td><Text size="xs" c="#6b7280" style={{ fontFamily: 'monospace' }}>{r.reviewer_user_id.substring(0, 8)}...</Text></Table.Td>
                    <Table.Td><Badge size="sm" color="blue" variant="light">{r.discipline || '—'}</Badge></Table.Td>
                    <Table.Td><SBadge v={r.review_decision} /></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280" truncate maw={300}>{r.review_comment || '—'}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="#6b7280">{r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : '—'}</Text></Table.Td>
                  </Table.Tr>
                )}
              />
            </Tabs.Panel>

            {/* Notifications */}
            <Tabs.Panel value="notifications">
              <TabHeader
                title="Downstream Notifications"
                onAdd={() => openModal('notification')}
                addLabel="Add Notification"
              />
              <DataTable
                loading={notificationsLoading}
                cols={['Type', 'Recipient Type', 'Reference', 'Notification Type', 'Status', 'Sent', 'Acknowledged']}
                rows={notifications}
                render={r => (
                  <Table.Tr key={r.id}>
                    <Table.Td><Badge size="sm" color="violet" variant="light">{r.recipient_type || '—'}</Badge></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{r.recipient_reference || '—'}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="#6b7280">{r.recipient_user_id ? r.recipient_user_id.substring(0, 8) + '...' : '—'}</Text></Table.Td>
                    <Table.Td><Badge size="sm" color="gray" variant="light">{r.notification_type || '—'}</Badge></Table.Td>
                    <Table.Td><SBadge v={r.notification_status} /></Table.Td>
                    <Table.Td><Text size="xs" c="#6b7280">{r.sent_at ? new Date(r.sent_at).toLocaleDateString() : '—'}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="#6b7280">{r.acknowledged_at ? new Date(r.acknowledged_at).toLocaleDateString() : '—'}</Text></Table.Td>
                  </Table.Tr>
                )}
              />
            </Tabs.Panel>
          </Tabs>
        </>
      )}

      {/* MODALS */}
      
      {/* Assessment Modal */}
      <FormModal
        opened={modal === 'assessment'}
        onClose={closeModal}
        title="New Impact Assessment"
        saving={saving}
        onSubmit={() => save('/impact-assessments', fv, reloadAssessments)}
      >
        <FI label="Impact Code" field="impact_code" fv={fv} setFv={setFv} readonly />
        <FormRow>
          <FI label="Source Revision ID" field="source_revision_id" fv={fv} setFv={setFv} readonly />
          <FI label="Proposed Revision ID" field="proposed_revision_id" fv={fv} setFv={setFv} />
        </FormRow>
        <FormRow>
          <FI label="Materiality" field="materiality" fv={fv} setFv={setFv} select={MATERIALITY} />
          <FI label="Overall Impact Level" field="overall_impact_level" fv={fv} setFv={setFv} select={IMPACT_LEVELS} />
        </FormRow>
        <FI label="Impact Summary" field="impact_summary" fv={fv} setFv={setFv} textarea />
        <FormRow>
          <FI label="Assessment Status" field="assessment_status" fv={fv} setFv={setFv} select={ASSESSMENT_STATUS} />
          <FI label="Assessed By" field="assessed_by" fv={fv} setFv={setFv} select={REVIEWER_USERS} />
        </FormRow>
      </FormModal>

      {/* Item Modal */}
      <FormModal
        opened={modal === 'item'}
        onClose={closeModal}
        title="New Impact Item"
        saving={saving}
        onSubmit={() => save('/impact-items', fv, reloadItems)}
      >
        <FormRow>
          <FI label="Old SEB Item ID" field="old_seb_item_id" fv={fv} setFv={setFv} />
          <FI label="New SEB Item ID" field="new_seb_item_id" fv={fv} setFv={setFv} />
        </FormRow>
        <FormRow>
          <FI label="Change Type" field="change_type" fv={fv} setFv={setFv} select={CHANGE_TYPES} />
          <FI label="Discipline" field="discipline" fv={fv} setFv={setFv} select={DISCIPLINES} />
        </FormRow>
        <FI label="Old Value" field="old_value" fv={fv} setFv={setFv} textarea />
        <FI label="New Value" field="new_value" fv={fv} setFv={setFv} textarea />
        <FormRow>
          <FI label="Impact Level" field="impact_level" fv={fv} setFv={setFv} select={IMPACT_LEVELS} />
        </FormRow>
        <FI label="Impact Description" field="impact_description" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Discipline Modal */}
      <FormModal
        opened={modal === 'discipline'}
        onClose={closeModal}
        title="New Impact Discipline"
        saving={saving}
        onSubmit={() => save('/impact-disciplines', fv, reloadDisciplines)}
      >
        <FormRow>
          <FI label="Discipline" field="discipline" fv={fv} setFv={setFv} select={DISCIPLINES} />
          <FI label="Impact Level" field="impact_level" fv={fv} setFv={setFv} select={IMPACT_LEVELS} />
        </FormRow>
        <FormRow>
          <FI label="Is Affected" field="is_affected" fv={fv} setFv={setFv} switchCtrl />
          <FI label="Readiness Recheck" field="readiness_recheck" fv={fv} setFv={setFv} switchCtrl />
        </FormRow>
        <FI label="Reassessment Required" field="reassessment_required" fv={fv} setFv={setFv} switchCtrl />
        <FI label="Reason" field="reason" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Downstream Modal */}
      <FormModal
        opened={modal === 'downstream'}
        onClose={closeModal}
        title="New Downstream Impact"
        saving={saving}
        onSubmit={() => save('/impact-downstreams', fv, reloadDownstreams)}
      >
        <FormRow>
          <FI label="Downstream Type" field="downstream_type" fv={fv} setFv={setFv} select={DOWNSTREAM_TYPES} />
          <FI label="Impact Level" field="impact_level" fv={fv} setFv={setFv} select={IMPACT_LEVELS} />
        </FormRow>
        <FormRow>
          <FI label="Downstream Reference" field="downstream_reference" fv={fv} setFv={setFv} />
          <FI label="Current Revision" field="current_revision" fv={fv} setFv={setFv} />
        </FormRow>
        <FI label="Downstream Name" field="downstream_name" fv={fv} setFv={setFv} />
        <FI label="Impact Description" field="impact_description" fv={fv} setFv={setFv} textarea />
        <FormRow>
          <FI label="Action Required" field="action_required" fv={fv} setFv={setFv} switchCtrl />
          <FI label="Status" field="status" fv={fv} setFv={setFv} select={DOWNSTREAM_STATUS} />
        </FormRow>
      </FormModal>

      {/* Action Modal */}
      <FormModal
        opened={modal === 'action'}
        onClose={closeModal}
        title="New Impact Action"
        saving={saving}
        onSubmit={() => save('/impact-actions', fv, reloadActions)}
      >
        <FI label="Action Code" field="action_code" fv={fv} setFv={setFv} readonly />
        <FormRow>
          <FI label="Action Type" field="action_type" fv={fv} setFv={setFv} select={ACTION_TYPES} />
          <FI label="Priority" field="priority" fv={fv} setFv={setFv} select={PRIORITIES} />
        </FormRow>
        <FI label="Action Description" field="action_description" fv={fv} setFv={setFv} textarea />
        <FormRow>
          <FI label="Owner User ID" field="owner_user_id" fv={fv} setFv={setFv} select={REVIEWER_USERS} />
          <FI label="Target Date" field="target_date" fv={fv} setFv={setFv} dateField />
        </FormRow>
        <FI label="Action Status" field="action_status" fv={fv} setFv={setFv} select={ACTION_STATUS} />
      </FormModal>

      {/* Review Modal */}
      <FormModal
        opened={modal === 'review'}
        onClose={closeModal}
        title="New Discipline Review"
        saving={saving}
        onSubmit={() => save('/impact-reviews', fv, reloadReviews)}
      >
        <FormRow>
          <FI label="Reviewer User ID" field="reviewer_user_id" fv={fv} setFv={setFv} select={REVIEWER_USERS} />
          <FI label="Discipline" field="discipline" fv={fv} setFv={setFv} select={DISCIPLINES} />
        </FormRow>
        <FI label="Review Decision" field="review_decision" fv={fv} setFv={setFv} select={REVIEW_DECISIONS} />
        <FI label="Review Comment" field="review_comment" fv={fv} setFv={setFv} textarea />
      </FormModal>

      {/* Notification Modal */}
      <FormModal
        opened={modal === 'notification'}
        onClose={closeModal}
        title="New Notification"
        saving={saving}
        onSubmit={() => save('/impact-notifications', fv, reloadNotifications)}
      >
        <FormRow>
          <FI label="Recipient Type" field="recipient_type" fv={fv} setFv={setFv} select={RECIPIENT_TYPES} />
          <FI label="Notification Type" field="notification_type" fv={fv} setFv={setFv} select={NOTIFICATION_TYPES} />
        </FormRow>
        <FormRow>
          <FI label="Recipient Reference" field="recipient_reference" fv={fv} setFv={setFv} />
          <FI label="Recipient User ID" field="recipient_user_id" fv={fv} setFv={setFv} select={REVIEWER_USERS} />
        </FormRow>
        <FI label="Notification Status" field="notification_status" fv={fv} setFv={setFv} select={NOTIFICATION_STATUS} />
      </FormModal>
    </Box>
  );
}
