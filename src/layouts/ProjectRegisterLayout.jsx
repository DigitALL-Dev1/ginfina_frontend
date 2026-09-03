import { useEffect, useState } from 'react';
import {
  Badge, Box, Group, LoadingOverlay, Paper,
  ScrollArea, Table, Text, TextInput, Title,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

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

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/projects', { signal: controller.signal })
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = projects.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.project_name || '').toLowerCase().includes(q) ||
      (p.project_code || '').toLowerCase().includes(q) ||
      (p.project_status || '').toLowerCase().includes(q)
    );
  });

  return (
    <Box p="lg">
      <Box mb="lg">
        <Title order={2} fw={700} c="#111827">Projects</Title>
        <Text size="sm" c="#6b7280" mt={4}>All projects from GINFINA database.</Text>
      </Box>

      <Group mb="md" justify="space-between">
        <TextInput placeholder="Search by name, code or status…"
          leftSection={<IconSearch size={15} />} value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ width: 320 }}
          styles={{ input: { borderColor: '#d1d5db', borderRadius: 6, height: 38 } }} />
        <Text size="xs" c="dimmed">
          {filtered.length} of {projects.length} project{projects.length !== 1 ? 's' : ''}
        </Text>
      </Group>

      <Paper style={{ border: '1px solid #e5e7eb', borderRadius: 8, position: 'relative', minHeight: 300 }}>
        <LoadingOverlay visible={loading} overlayProps={{ blur: 1 }} />
        {error && <Box p="xl" style={{ textAlign: 'center' }}><Text c="red" size="sm">Failed to load projects: {error}</Text></Box>}
        {!loading && !error && (
          <ScrollArea>
            <Table verticalSpacing="sm" horizontalSpacing="md" style={{ minWidth: 640 }}>
              <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
                <Table.Tr>
                  {['Project Code','Project Name','Gsolve ID','Status','User ID','Created'].map((h) => (
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
                    <Table.Td><Text size="xs" c="#9ca3af" style={{ fontFamily: 'monospace' }}>{p.user_id}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="#9ca3af">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</Text></Table.Td>
                  </Table.Tr>
                ))}
                {filtered.length === 0 && (
                  <Table.Tr><Table.Td colSpan={6} style={{ textAlign: 'center', padding: '40px 0' }}>
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
