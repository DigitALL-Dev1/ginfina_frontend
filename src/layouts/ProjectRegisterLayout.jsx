import { formatDate } from '../utils/dateOnly';
import { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, LoadingOverlay, Paper,
  ScrollArea, Table, Text, TextInput, Title,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const STATUS_COLORS = {
  'in progress': { bg: '#e7f5ff', color: '#1971c2' },
  'planning':    { bg: '#fff4e6', color: '#d9480f' },
  'on hold':     { bg: '#fff9db', color: '#f08c00' },
  'completed':   { bg: '#eaf5ef', color: '#007336' },
};

function statusBadge(status) {
  const key = (status || '').toLowerCase();
  const style = STATUS_COLORS[key] || { bg: '#f1f3f5', color: '#495057' };
  return (
    <Badge size="sm" radius="xl"
      style={{ backgroundColor: style.bg, color: style.color, textTransform: 'none',
        fontWeight: 600, fontSize: 11, padding: '2px 10px', border: 'none' }}>
      {status || '—'}
    </Badge>
  );
}

export default function ProjectRegisterLayout() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    fetch(`${API}/projects?refresh=${refresh > 0}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `HTTP ${res.status}`);
        if (!Array.isArray(data)) throw new Error('Invalid project response');
        return data;
      })
      .then((data) => { if (!controller.signal.aborted) setProjects(data); })
      .catch((err) => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  const filtered = projects.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.project_name || '').toLowerCase().includes(q) ||
      (p.project_code || '').toLowerCase().includes(q) ||
      (p.project_status || '').toLowerCase().includes(q) ||
      (p.customer || '').toLowerCase().includes(q)
    );
  });

  return (
    <Box p="lg">
      <Box mb="lg">
        <Title order={2} fw={700} c="#111827">Projects</Title>
        <Text size="sm" c="#6b7280" mt={4}>Saved projects. Sync from Gsolve to retrieve the latest project details.</Text>
      </Box>

      <Group mb="md" justify="space-between">
        <TextInput placeholder="Search by name, code, status or customer"
          leftSection={<IconSearch size={15} />} value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ width: 320 }}
          styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, height: 38 } }} />
        <Text size="xs" c="dimmed">
          {filtered.length} of {projects.length} project{projects.length !== 1 ? 's' : ''}
        </Text>
        <Button color="green" loading={loading} onClick={() => setRefresh(value => value + 1)}>Sync from Gsolve</Button>
      </Group>

      <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 8, position: 'relative', minHeight: 300 }}>
        <LoadingOverlay visible={loading} overlayProps={{ blur: 1 }} />
        {error && <Box p="xl" style={{ textAlign: 'center' }}><Text c="red" size="sm">Failed to load projects: {error}</Text></Box>}
        {!loading && (
          <ScrollArea>
            <Table verticalSpacing="sm" horizontalSpacing="md" style={{ minWidth: 640 }}>
              <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
                <Table.Tr>
                  {['Project Code','Project Name','Gsolve ID','Status','Customer','Type','Priority','Budget','Target End Date','Created'].map((h) => (
                    <Table.Th key={h} style={{ color: '#374151', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((p) => (
                  <Table.Tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 120ms' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <Table.Td><Text size="sm" fw={600} c="#007336">{p.project_code}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={500} c="#111827">{p.project_name}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="#6b7280">{p.gsolve_project_id}</Text></Table.Td>
                    <Table.Td>{statusBadge(p.project_status)}</Table.Td>
                    <Table.Td><Text size="sm">{p.customer || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{p.project_type || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{p.priority || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{p.budget != null ? [p.budget, p.currency_name].filter(Boolean).join(' ') : '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{p.target_end_date || '—'}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="#9ca3af">{p.created_at ? formatDate(p.created_at) : '—'}</Text></Table.Td>
                  </Table.Tr>
                ))}
                {filtered.length === 0 && (
                  <Table.Tr><Table.Td colSpan={10} style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Text size="sm" c="dimmed">{projects.length === 0 ? 'No projects found.' : 'No projects match your search.'}</Text>
                  </Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Paper>
    </Box>
  );
}
