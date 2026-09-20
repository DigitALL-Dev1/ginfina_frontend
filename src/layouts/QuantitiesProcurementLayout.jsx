import { useEffect, useState } from 'react';
import {
  Alert, Badge, Box, Button, Divider, Grid, Group, Loader, Modal, NumberInput,
  Paper, ScrollArea, Select, SimpleGrid, Stack, Table, Text, Textarea, TextInput,
  ThemeIcon, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconFileDescription, IconPlus, IconRefresh, IconShoppingCart } from '@tabler/icons-react';

const API = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const ROOT = '/ewp/quantities-procurement';
const surface = { borderColor: '#dfe7e2', boxShadow: '0 8px 26px rgba(21,55,39,.045)' };
const TRACKING = { REFERENCED: ['SENT', 'CANCELLED'], SENT: ['ACKNOWLEDGED', 'CANCELLED'], ACKNOWLEDGED: ['IN_PROGRESS', 'CANCELLED'], IN_PROGRESS: ['COMPLETED', 'CANCELLED'] };
const blankItem = { item: '', description: '', specification: '', quantity: 1, unit: 'EA', source_revision_id: null, source_reference: '', derivation: '' };
const labels = { validate: 'Validate quantities', reopen: 'Reopen quantity take-off', generate: 'Create BOQ / EBOM', review: 'Review quantity set', approve: 'Approve quantity set', 'procurement-ready': 'Mark procurement ready', handoff: 'Record procurement reference', tracking: 'Update procurement status' };

async function request(path, options = {}) {
  const response = await fetch(`${API}${ROOT}${path}`, { ...options, headers: options.body ? { 'Content-Type': 'application/json' } : {} });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(data.detail) ? data.detail.map(row => row.msg).join('; ') : data.detail || `Request failed (${response.status})`);
  return data;
}

function Status({ value }) {
  const color = ['APPROVED', 'PROCUREMENT_READY', 'RELEASED', 'COMPLETED', 'ACCEPT'].includes(value) ? 'green'
    : ['DRAFT', 'REFERENCED'].includes(value) ? 'gray' : ['REJECT', 'CHANGE_REQUIRED', 'CANCELLED'].includes(value) ? 'orange' : 'blue';
  return <Badge color={color} variant="light" radius="sm">{(value || 'NOT RECORDED').replaceAll('_', ' ')}</Badge>;
}

function Field({ label, value }) {
  return <Box><Text size="xs" c="dimmed">{label}</Text><Text size="sm" fw={600} style={{ overflowWrap: 'anywhere' }}>{value || 'Not recorded'}</Text></Box>;
}

function QuantityTable({ rows, editable = false, onEdit, onRemove, onSource, saving }) {
  return <ScrollArea><Table miw={820} verticalSpacing="sm" highlightOnHover><Table.Thead><Table.Tr>
    <Table.Th>Item / specification</Table.Th><Table.Th>Quantity</Table.Th><Table.Th>Unit</Table.Th><Table.Th>Released source</Table.Th><Table.Th>Drawing reference</Table.Th>{editable && <Table.Th>Actions</Table.Th>}
  </Table.Tr></Table.Thead><Table.Tbody>{rows.map(row => <Table.Tr key={row.id}>
    <Table.Td><Text size="sm" fw={650}>{row.item}</Text><Text size="xs" c="dimmed">{row.specification}</Text>{row.description && <Text size="xs">{row.description}</Text>}</Table.Td>
    <Table.Td>{row.quantity.toLocaleString()}</Table.Td><Table.Td>{row.unit}</Table.Td>
    <Table.Td><Button variant="subtle" size="compact-xs" onClick={() => onSource(row.source)}>{row.source.document_code} / {row.source.revision_no}</Button></Table.Td>
    <Table.Td><Text size="sm">{row.source_reference}</Text><Text size="xs" c="dimmed">{row.derivation}</Text></Table.Td>
    {editable && <Table.Td><Group gap="xs" wrap="nowrap"><Button size="compact-xs" variant="light" disabled={saving} onClick={() => onEdit(row)}>Edit</Button><Button size="compact-xs" color="red" variant="subtle" disabled={saving} onClick={() => onRemove(row)}>Remove</Button></Group></Table.Td>}
  </Table.Tr>)}</Table.Tbody></Table></ScrollArea>;
}

export default function QuantitiesProcurementLayout() {
  const [ewps, setEwps] = useState([]);
  const [ewpId, setEwpId] = useState(null);
  const [outputs, setOutputs] = useState([]);
  const [registers, setRegisters] = useState([]);
  const [registerId, setRegisterId] = useState(null);
  const [register, setRegister] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [itemForm, setItemForm] = useState(blankItem);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({});
  const [source, setSource] = useState(null);
  const [viewBoq, setViewBoq] = useState(null);
  const busy = loading || contextLoading || registerLoading || saving;
  const boq = register?.boqs.find(row => row.id === register.current_boq_id);
  const handoff = register?.handoff;
  const quantities = register?.items || [];
  const status = register?.status;
  const currentEwp = ewps.find(row => row.id === ewpId);

  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    request('/ewps', { signal: controller.signal }).then(rows => { if (!controller.signal.aborted) setEwps(rows); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (!ewpId) return;
    const controller = new AbortController(); setContextLoading(true);
    Promise.all([request(`/released-outputs?ewp_id=${encodeURIComponent(ewpId)}`, { signal: controller.signal }), request(`/registers?ewp_id=${encodeURIComponent(ewpId)}`, { signal: controller.signal })])
      .then(([released, records]) => { if (!controller.signal.aborted) { setOutputs(released); setRegisters(records); } })
      .catch(err => { if (!controller.signal.aborted) { setOutputs([]); setRegisters([]); setError(err.message); } })
      .finally(() => { if (!controller.signal.aborted) setContextLoading(false); });
    return () => controller.abort();
  }, [ewpId, refresh]);

  useEffect(() => {
    setRegister(null);
    if (!registerId) return;
    const controller = new AbortController(); setRegisterLoading(true);
    request(`/registers/${encodeURIComponent(registerId)}`, { signal: controller.signal })
      .then(row => { if (!controller.signal.aborted) setRegister(row); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setRegisterLoading(false); });
    return () => controller.abort();
  }, [registerId, refresh]);

  const save = async (path, method, payload, title) => {
    setSaving(true); setError('');
    try {
      const row = await request(path, { method, body: JSON.stringify(payload) });
      setRegister(row); setRegisterId(row.id);
      setRegisters(records => [{ id: row.id, name: row.name, status: row.status }, ...records.filter(record => record.id !== row.id)]);
      setModal(''); notifications.show({ color: 'green', title, message: row.name });
    } catch (err) { setError(err.message); setModal(''); }
    finally { setSaving(false); }
  };
  const registerPath = `/registers/${encodeURIComponent(registerId || '')}`;
  const openAction = action => {
    setForm({ actor: '', comment: '', type: 'BOQ', decision: action === 'review' ? 'ACCEPT' : 'APPROVE', system: '', reference: '', url: '', status: TRACKING[handoff?.status]?.[0] || '' });
    setModal(action);
  };
  const submitAction = () => {
    const payload = { version: register.version, actor: form.actor, comment: form.comment };
    if (modal === 'generate') payload.type = form.type;
    if (['review', 'approve'].includes(modal)) payload.decision = form.decision;
    if (modal === 'handoff') Object.assign(payload, { system: form.system, reference: form.reference, url: form.url || null });
    if (modal === 'tracking') payload.status = form.status;
    save(`${registerPath}/${modal === 'tracking' ? 'handoff' : modal}`, modal === 'tracking' ? 'PATCH' : 'POST', payload, labels[modal]);
  };
  const updateForm = (key, value) => setForm(prior => ({ ...prior, [key]: value }));
  const edit = row => { setEditingItem(row); setItemForm(row ? { ...row, source_revision_id: row.source.revision_id } : { ...blankItem }); setModal('item'); };
  const updateItem = (key, value) => setItemForm(prior => ({ ...prior, [key]: value }));
  const totals = Object.entries(quantities.reduce((result, row) => ({ ...result, [row.unit]: (result[row.unit] || 0) + row.quantity }), {}));
  const actionInvalid = !form.actor?.trim() || (['review', 'approve'].includes(modal) && !['ACCEPT', 'APPROVE'].includes(form.decision) && !form.comment?.trim())
    || (modal === 'handoff' && (!form.system?.trim() || !form.reference?.trim())) || (modal === 'tracking' && (!form.status || !form.comment?.trim()));

  const download = () => {
    const data = { ewp: currentEwp, register_id: register.id, boq, handoff };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${boq.type}-${boq.revision_no}-${register.id}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <Box p={{ base: 'md', md: 'xl' }} maw={1380} mx="auto"><Stack gap="lg">
    <Group justify="space-between" align="flex-start"><Box><Badge color="green" variant="light" mb="xs">Engineering Workbench</Badge><Title order={2}>Quantities & Procurement</Title><Text size="sm" c="dimmed" mt={5}>Build quantities from released engineering outputs and maintain their procurement references.</Text></Box><ThemeIcon color="green" variant="light" size={48} radius="lg"><IconShoppingCart size={25} /></ThemeIcon></Group>
    <SimpleGrid cols={{ base: 1, sm: 3, lg: 5 }}>{[['Released sources', outputs.length > 0], ['Quantity take-off', quantities.length > 0], ['BOQ / EBOM review', !!boq?.review], ['Engineering approval', ['APPROVED', 'PROCUREMENT_READY', 'HANDOFF_REFERENCED'].includes(status)], ['Procurement reference', !!handoff]].map(([label, done], index) => <Paper key={label} withBorder p="md" radius="md" style={surface}><Group wrap="nowrap"><ThemeIcon color={done ? 'green' : 'gray'} variant="light" radius="xl">{done ? <IconCheck size={15} /> : index + 1}</ThemeIcon><Text size="sm" fw={650}>{label}</Text></Group></Paper>)}</SimpleGrid>
    {error && <Alert color="red" icon={<IconAlertTriangle size={18} />} title="Unable to complete request">{error}<Button variant="subtle" color="red" size="xs" disabled={busy} onClick={() => { setError(''); setRefresh(value => value + 1); }}>Refresh saved data</Button></Alert>}
    <Paper withBorder p="lg" radius="lg" style={surface}><Stack>
      <Group justify="space-between"><Text fw={750}>Engineering source and quantity register</Text><Button color="green" variant="subtle" disabled={busy} leftSection={<IconRefresh size={15} />} onClick={() => setRefresh(value => value + 1)}>Refresh</Button></Group>
      <Grid align="flex-end"><Grid.Col span={{ base: 12, md: 5 }}><Select label="EWP" placeholder="Select EWP" data={ewps.map(row => ({ value: row.id, label: `${row.code} · ${row.name}` }))} value={ewpId} searchable clearable disabled={busy} onChange={value => { setEwpId(value); setRegisterId(null); setRegister(null); setOutputs([]); setRegisters([]); setError(''); }} /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 5 }}><Select label="Quantity register" placeholder="Select a take-off" data={registers.map(row => ({ value: row.id, label: `${row.name} · ${row.status.replaceAll('_', ' ')}` }))} value={registerId} searchable disabled={!ewpId || busy} onChange={setRegisterId} /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 2 }}><Button color="green" fullWidth disabled={!outputs.length || busy} leftSection={<IconPlus size={15} />} onClick={() => { setRegisterName(''); setModal('register'); }}>Create QTO</Button></Grid.Col></Grid>
      {(loading || contextLoading || registerLoading) && <Group><Loader size="xs" /><Text size="sm" c="dimmed">Loading engineering records…</Text></Group>}
      {ewpId && !contextLoading && !outputs.length && <Alert color="blue">No released engineering outputs are available. Release a document revision in Approval & Release first.</Alert>}
      {!!outputs.length && <><Divider /><Text fw={700} size="sm">Released engineering outputs</Text><ScrollArea><Table miw={650}><Table.Thead><Table.Tr><Table.Th>Document / deliverable</Table.Th><Table.Th>Revision</Table.Th><Table.Th>SEB basis</Table.Th><Table.Th></Table.Th></Table.Tr></Table.Thead><Table.Tbody>{outputs.map(row => <Table.Tr key={row.revision_id}><Table.Td><Text size="sm" fw={650}>{row.document_code} · {row.document_title}</Text><Text size="xs" c="dimmed">{row.deliverable.code} · {row.deliverable.name}</Text></Table.Td><Table.Td>{row.revision_no} <Status value="RELEASED" /></Table.Td><Table.Td>{row.seb_basis.seb?.code || row.seb_basis.seb_id} / {row.seb_basis.released_revision?.revision_no || row.seb_basis.revision_id}</Table.Td><Table.Td><Button variant="subtle" size="xs" onClick={() => setSource(row)}>View source</Button></Table.Td></Table.Tr>)}</Table.Tbody></Table></ScrollArea></>}
    </Stack></Paper>

    {register && <>
      <Paper withBorder radius="lg" p="lg" style={surface}><Stack>
        <Group justify="space-between"><Box><Title order={3}>{register.name}</Title><Text size="xs" c="dimmed">{quantities.length} quantity items · {currentEwp?.code}</Text></Box><Status value={status} /></Group>
        <Group>{totals.map(([unit, quantity]) => <Badge key={unit} variant="outline" color="gray" tt="none">{quantity.toLocaleString()} {unit}</Badge>)}</Group>
        {status === 'DRAFT' && <Group justify="flex-end"><Button color="green" leftSection={<IconPlus size={15} />} disabled={saving || !outputs.length} onClick={() => edit(null)}>Add quantity item</Button></Group>}
        <QuantityTable rows={quantities} editable={status === 'DRAFT'} saving={saving} onEdit={edit} onRemove={row => { setEditingItem(row); setModal('remove'); }} onSource={setSource} />
        {!quantities.length && <Alert color="blue">Add quantities and reference the drawing sheet, schedule, or calculation used for each item.</Alert>}
        <Group justify="flex-end">
          {status === 'DRAFT' && <Button color="green" disabled={!quantities.length || saving} onClick={() => openAction('validate')}>Validate quantities</Button>}
          {status === 'VALIDATED' && <><Button variant="default" onClick={() => openAction('reopen')}>Reopen for changes</Button><Button color="green" onClick={() => openAction('generate')}>Create BOQ / EBOM</Button></>}
          {status === 'UNDER_REVIEW' && <Button color="green" onClick={() => openAction('review')}>Review quantity set</Button>}
          {status === 'UNDER_APPROVAL' && <Button color="green" onClick={() => openAction('approve')}>Approve quantity set</Button>}
          {status === 'APPROVED' && <Button color="green" onClick={() => openAction('procurement-ready')}>Mark procurement ready</Button>}
        </Group>
        {['APPROVED', 'PROCUREMENT_READY', 'HANDOFF_REFERENCED'].includes(status) && <Text size="xs" c="dimmed">This quantity set is locked. Create a new take-off for engineering changes; its sources remain tied to the selected releases.</Text>}
      </Stack></Paper>

      {!!register.boqs.length && <Paper withBorder radius="lg" p="lg" style={surface}><Stack><Group justify="space-between"><Text fw={750}>BOQ / EBOM register</Text>{['APPROVED', 'PROCUREMENT_READY', 'HANDOFF_REFERENCED'].includes(status) && <Button variant="light" color="green" onClick={download}>Download approved package</Button>}</Group>
        {register.boqs.map(row => <Paper key={row.id} withBorder p="md" radius="md"><Group justify="space-between"><Box><Text size="sm" fw={700}>{row.type} / {row.revision_no}</Text><Text size="xs" c="dimmed">{row.items.length} items · Created by {row.generated_by}</Text></Box><Group><Status value={row.status} /><Button size="xs" variant="subtle" onClick={() => setViewBoq(row)}>View snapshot</Button></Group></Group>{row.review && <Text size="sm" mt="xs">Review: {row.review.decision.replaceAll('_', ' ')} · {row.review.by}{row.review.comment && ` — ${row.review.comment}`}</Text>}{row.approval && <Text size="sm" mt="xs">Approval: {row.approval.decision.replaceAll('_', ' ')} · {row.approval.by}{row.approval.comment && ` — ${row.approval.comment}`}</Text>}</Paper>)}
      </Stack></Paper>}

      {['PROCUREMENT_READY', 'HANDOFF_REFERENCED'].includes(status) && <Paper withBorder radius="lg" p="lg" style={surface}><Stack>
        <Text fw={750}>Procurement linkage</Text><Text size="sm" c="dimmed">Record the reference created in your procurement system and update its reported status.</Text>
        {!handoff ? <Group><Button color="green" onClick={() => openAction('handoff')}>Record procurement reference</Button></Group> : <>
          <SimpleGrid cols={{ base: 1, sm: 3 }}><Field label="Procurement system" value={handoff.system} /><Field label="Reference" value={handoff.reference} /><Box><Text size="xs" c="dimmed">Reported status</Text><Status value={handoff.status} /></Box></SimpleGrid>
          <Alert color={handoff.status === 'COMPLETED' ? 'green' : handoff.status === 'CANCELLED' ? 'orange' : 'blue'} title="EWP completion requirement">
            {handoff.status === 'COMPLETED'
              ? 'Procurement tracking is complete. Refresh Completion & Governance to recheck this handoff.'
              : handoff.status === 'CANCELLED'
                ? 'This handoff was cancelled and does not satisfy the procurement completion check.'
                : `Recording a reference does not complete the handoff. Use Update procurement status to record actual progress with an evidence note. Next: ${(TRACKING[handoff.status]?.[0] || 'status review').replaceAll('_', ' ')}. Completion & Governance requires COMPLETED.`}
          </Alert>
          <Text size="xs" c="dimmed">Recorded by {handoff.recorded_by} · {new Date(handoff.created_at).toLocaleString()}</Text>
          {handoff.tracking_note && <Text size="sm">{handoff.tracking_note}</Text>}
          <Group>{handoff.url && <Button component="a" href={handoff.url} target="_blank" rel="noreferrer" variant="light">Open procurement reference</Button>}{TRACKING[handoff.status] && <Button color="green" onClick={() => openAction('tracking')}>Update procurement status</Button>}</Group>
        </>}
      </Stack></Paper>}

      {!!register.history.length && <Paper withBorder p="lg" radius="lg" style={surface}><Text fw={750} mb="md">Activity history</Text><Stack gap="xs">{[...register.history].reverse().map((row, index) => <Group key={`${row.at}-${index}`} justify="space-between"><Box><Text size="sm">{row.action.replaceAll('_', ' ')} · {row.actor}</Text>{row.comment && <Text size="xs" c="dimmed">{row.comment}</Text>}</Box><Text size="xs" c="dimmed">{new Date(row.at).toLocaleString()}</Text></Group>)}</Stack></Paper>}
    </>}
  </Stack>

  <Modal opened={modal === 'register'} onClose={() => !saving && setModal('')} title="Create quantity take-off" centered><Stack><TextInput label="Register name" required value={registerName} onChange={event => setRegisterName(event.currentTarget.value)} /><Button color="green" loading={saving} disabled={!registerName.trim()} onClick={() => save('/registers', 'POST', { ewp_id: ewpId, name: registerName }, 'Quantity register created')}>Create register</Button></Stack></Modal>

  <Modal opened={modal === 'item'} onClose={() => !saving && setModal('')} title={editingItem ? 'Edit quantity item' : 'Add quantity item'} size="lg" centered><Stack>
    <TextInput label="Item" required value={itemForm.item} onChange={event => updateItem('item', event.currentTarget.value)} />
    <Textarea label="Description" value={itemForm.description} onChange={event => updateItem('description', event.currentTarget.value)} />
    <TextInput label="Specification" value={itemForm.specification} onChange={event => updateItem('specification', event.currentTarget.value)} />
    <SimpleGrid cols={2}><NumberInput label="Quantity" required min={0} value={itemForm.quantity} onChange={value => updateItem('quantity', value)} /><TextInput label="Unit" required value={itemForm.unit} onChange={event => updateItem('unit', event.currentTarget.value)} /></SimpleGrid>
    <Select label="Released document revision" required searchable placeholder="Select source" value={itemForm.source_revision_id} data={outputs.map(row => ({ value: row.revision_id, label: `${row.document_code} / ${row.revision_no} · ${row.document_title}` }))} onChange={value => updateItem('source_revision_id', value)} />
    <TextInput label="Drawing / schedule reference" required placeholder="Sheet 2, cable schedule rows 10–18" value={itemForm.source_reference} onChange={event => updateItem('source_reference', event.currentTarget.value)} />
    <Textarea label="Derivation / calculation notes" placeholder="Record how this quantity was measured or calculated" value={itemForm.derivation} onChange={event => updateItem('derivation', event.currentTarget.value)} />
    <Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setModal('')}>Cancel</Button><Button color="green" loading={saving} disabled={!itemForm.item.trim() || !itemForm.unit.trim() || !itemForm.source_revision_id || !itemForm.source_reference.trim() || !(Number(itemForm.quantity) > 0)} onClick={() => save(`${registerPath}/items${editingItem ? `/${editingItem.id}` : ''}`, editingItem ? 'PUT' : 'POST', { ...itemForm, quantity: Number(itemForm.quantity), version: register.version }, 'Quantity saved')}>Save quantity</Button></Group>
  </Stack></Modal>

  <Modal opened={modal === 'remove'} onClose={() => !saving && setModal('')} title="Remove quantity item" centered><Stack><Text>Remove {editingItem?.item} from this draft take-off?</Text><Button color="red" loading={saving} onClick={() => save(`${registerPath}/items/${editingItem.id}`, 'DELETE', { version: register.version }, 'Quantity removed')}>Remove item</Button></Stack></Modal>

  <Modal opened={Boolean(labels[modal])} onClose={() => !saving && setModal('')} title={labels[modal]} centered size="lg"><Stack>
    <TextInput label={modal === 'approve' ? 'Approver name' : modal === 'review' ? 'Reviewer name' : 'Recorded by'} required value={form.actor || ''} onChange={event => updateForm('actor', event.currentTarget.value)} />
    {modal === 'generate' && <Select label="Quantity set type" data={['BOQ', 'EBOM']} value={form.type} onChange={value => updateForm('type', value)} />}
    {['review', 'approve'].includes(modal) && <Select label="Decision" data={(modal === 'review' ? ['ACCEPT', 'CHANGE_REQUIRED'] : ['APPROVE', 'CHANGE_REQUIRED', 'REJECT']).map(value => ({ value, label: value.replaceAll('_', ' ') }))} value={form.decision} onChange={value => updateForm('decision', value)} />}
    {modal === 'handoff' && <><TextInput label="Procurement system" required value={form.system} onChange={event => updateForm('system', event.currentTarget.value)} /><TextInput label="External reference" required value={form.reference} onChange={event => updateForm('reference', event.currentTarget.value)} /><TextInput label="Reference URL" placeholder="https://…" value={form.url} onChange={event => updateForm('url', event.currentTarget.value)} /></>}
    {modal === 'tracking' && <Select label="Reported status" data={(TRACKING[handoff?.status] || []).map(value => ({ value, label: value.replaceAll('_', ' ') }))} value={form.status} onChange={value => updateForm('status', value)} />}
    <Textarea label={modal === 'tracking' ? 'Tracking note / evidence reference' : 'Comment'} required={modal === 'tracking' || (['review', 'approve'].includes(modal) && !['ACCEPT', 'APPROVE'].includes(form.decision))} value={form.comment || ''} onChange={event => updateForm('comment', event.currentTarget.value)} />
    <Group justify="flex-end"><Button variant="default" disabled={saving} onClick={() => setModal('')}>Cancel</Button><Button color="green" loading={saving} disabled={actionInvalid} onClick={submitAction}>Save {modal === 'tracking' ? 'status' : modal === 'handoff' ? 'reference' : 'decision'}</Button></Group>
  </Stack></Modal>

  <Modal opened={!!viewBoq} onClose={() => setViewBoq(null)} title={`${viewBoq?.type || ''} / ${viewBoq?.revision_no || ''}`} size="xl" centered><Stack>{viewBoq && <><Status value={viewBoq.status} /><Field label="Quantity content hash" value={viewBoq.content_hash} /><QuantityTable rows={viewBoq.items} onSource={setSource} /></>}</Stack></Modal>
  <Modal opened={!!source} onClose={() => setSource(null)} title="Released engineering source" size="lg" centered><Stack>{source && <>
    <Field label="Document / revision" value={`${source.document_code} / ${source.revision_no}`} /><Field label="Deliverable" value={`${source.deliverable.code} · ${source.deliverable.name}`} />
    <Field label="SEB basis" value={`${source.seb_basis.seb?.code || source.seb_basis.seb_id} / ${source.seb_basis.released_revision?.revision_no || source.seb_basis.revision_id}`} />
    <Field label="Frozen SEB snapshot" value={source.seb_basis.freeze_snapshot_id} /><Field label="Engineering release" value={source.release_code} /><Field label="Release hash" value={source.release_hash} /><Field label="Document hash" value={source.file_hash} />
    <Button component="a" href={`${API}/ewp/documents-reviews/documents/${encodeURIComponent(source.document_id)}/revisions/${encodeURIComponent(source.revision_id)}/file`} target="_blank" rel="noreferrer" variant="light" leftSection={<IconFileDescription size={16} />}>Open exact released document</Button>
  </>}</Stack></Modal>
  </Box>;
}
