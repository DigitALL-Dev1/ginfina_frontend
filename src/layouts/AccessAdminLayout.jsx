import { useState, useMemo } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select,
  Table, Text, TextInput, Title, Badge, ScrollArea, Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

/* ─── Pilot Authority Matrix Data ────────────────────────────────── */
const PILOT_GRANTS = [
  { role: 'Engineering Manager', authority: 'Engineering Approval', scope: 'All GREEN Projects', status: 'Active' },
  { role: 'Electrical Reviewer', authority: 'Electrical Review',     scope: 'Assigned EWPs',      status: 'Active' },
  { role: 'Consultant - ABC',    authority: 'Design Author',         scope: 'UNI-BOR-STR-001',    status: 'Scoped' },
  { role: 'Procurement Lead',    authority: 'PEP Receiver',          scope: 'Released packages',  status: 'Active' },
];

export default function AccessAdminLayout() {
  const [topSearch, setTopSearch]       = useState('');
  const [topStatus, setTopStatus]       = useState('Active / Open');
  const [savedView, setSavedView]       = useState('My Priority Work');
  const [selectedRole, setSelectedRole] = useState('Engineering Manager');

  /* Left filters */
  const [userConsultant, setUserConsultant] = useState('consultant@company.com');
  const [role, setRole]                     = useState('External Consultant');
  const [orgTenant, setOrgTenant]           = useState('ABC Engineering Ltd');

  const filtered = useMemo(() => {
    const q = topSearch.trim().toLowerCase();
    return PILOT_GRANTS.filter((r) => {
      if (q && !`${r.role} ${r.authority} ${r.scope}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [topSearch]);

  const selected = filtered.find((r) => r.role === selectedRole) || filtered[0];

  const inputSt = { input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', height: 38, borderRadius: 6 } };

  const handleExport = () =>
    notifications.show({ title: 'Export initiated', message: `Exporting access records…`, color: 'green' });

  const handlePublish = () =>
    notifications.show({ title: 'Access Change Published', message: 'User access grants updated and applied server-side.', color: 'green' });

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Access, Role and Scope Administration
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={720}>
              Administer role, organisation, project, EWP and object-scope grants while keeping engineering authority separate from technical system administration.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handlePublish}
            style={{
              backgroundColor: '#007336',
              fontWeight: 600,
              height: 38,
              borderRadius: 6,
              paddingLeft: 20,
              paddingRight: 20,
              alignSelf: 'flex-start',
            }}
          >
            Publish access change
          </Button>
        </Group>
      </Box>

      {/* ── Top Filter Bar ── */}
      <Box mb="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Group align="flex-end" gap="md" style={{ flex: 1, minWidth: 300 }}>
            <Box style={{ flex: 1, minWidth: 160 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Search</Text>
              <TextInput
                placeholder="Search records..."
                value={topSearch}
                onChange={(e) => setTopSearch(e.target.value)}
                styles={inputSt}
              />
            </Box>
            <Box style={{ width: 160 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Status</Text>
              <Select
                data={['Active / Open', 'All', 'Active', 'Scoped', 'Suspended']}
                value={topStatus}
                onChange={(v) => setTopStatus(v || 'Active / Open')}
                styles={inputSt}
              />
            </Box>
            <Box style={{ width: 190 }}>
              <Text size="xs" fw={600} c="#374151" mb={4}>Saved view</Text>
              <Select
                data={['My Priority Work', 'All Users', 'Consultants', 'Administrators']}
                value={savedView}
                onChange={(v) => setSavedView(v || 'My Priority Work')}
                styles={inputSt}
              />
            </Box>
          </Group>
          <Group gap="sm">
            <Button
              variant="default"
              onClick={handleExport}
              style={{ borderColor: '#d1d5db', color: '#374151', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 18, paddingRight: 18 }}
            >
              Export
            </Button>
            <Button
              color="green"
              onClick={handlePublish}
              style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 18, paddingRight: 18 }}
            >
              Publish access change
            </Button>
          </Group>
        </Group>
      </Box>

      {/* ── Two-Column Body ── */}
      <Grid gutter="md">
        {/* Left: Filters and Controlled Inputs */}
        <Grid.Col span={{ base: 12, md: 3.8, lg: 3.5 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Title order={4} fw={700} fz={15} c="#111827" mb="md">Filters and controlled inputs</Title>
              <Stack gap="md">
                {/* User / consultant */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>User / consultant <Text span c="red">*</Text></Text>
                  <TextInput
                    value={userConsultant}
                    onChange={(e) => setUserConsultant(e.target.value)}
                    styles={inputSt}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>People Select · Resolved identity required</Text>
                </Box>

                {/* Role */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Role <Text span c="red">*</Text></Text>
                  <Select
                    data={['External Consultant', 'Lead Engineer', 'Reviewer', 'System Administrator']}
                    value={role}
                    onChange={(v) => setRole(v || 'External Consultant')}
                    styles={inputSt}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>Select · Controlled role catalogue</Text>
                </Box>

                {/* Organisation / tenant */}
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Organisation / tenant <Text span c="red">*</Text></Text>
                  <Select
                    data={['ABC Engineering Ltd', 'UNICEF Energy Group', 'Global Solves Ltd']}
                    value={orgTenant}
                    onChange={(v) => setOrgTenant(v || 'ABC Engineering Ltd')}
                    styles={inputSt}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>Select · Tenant boundary required for external users</Text>
                </Box>
              </Stack>
            </Box>

            {/* Green Callout */}
            <Box mt="xl" p="sm" style={{ backgroundColor: '#f2fbf5', borderLeft: '4px solid #007336', borderRadius: '0 6px 6px 0' }}>
              <Text size="xs" c="#182b23" lh={1.5}>
                Role and object scope are applied server-side. Current project:{' '}
                <Text span fw={600}>UNICEF PNG Solar Systems.</Text>
              </Text>
            </Box>
          </Paper>
        </Grid.Col>

        {/* Right: Table */}
        <Grid.Col span={{ base: 12, md: 8.2, lg: 8.5 }}>
          <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, minHeight: 380, display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" align="center" mb="sm">
              <Title order={4} fw={700} fz={15} c="#111827">Access, Role and Scope Administration</Title>
              <Badge
                size="sm"
                radius="xl"
                style={{ backgroundColor: '#e6fcf5', color: '#0ca678', textTransform: 'none', fontWeight: 600, fontSize: 11, padding: '4px 10px' }}
              >
                Current
              </Badge>
            </Group>

            <ScrollArea style={{ flex: 1 }}>
              <Table verticalSpacing="sm" horizontalSpacing="md" style={{ minWidth: 500, borderCollapse: 'separate', borderSpacing: '0 2px' }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    {['Role', 'Authority', 'Scope', 'Status'].map((h) => (
                      <Table.Th key={h} style={{ color: '#374151', fontSize: 13, fontWeight: 700, paddingBottom: 10 }}>{h}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtered.map((row) => {
                    const isSel = selected?.role === row.role;
                    return (
                      <Table.Tr
                        key={row.role}
                        onClick={() => setSelectedRole(row.role)}
                        style={{ backgroundColor: isSel ? '#ebfbee' : 'transparent', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                      >
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" fw={isSel ? 700 : 500} c={isSel ? '#007336' : '#374151'}>{row.role}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" c="#4b5563">{row.authority}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="xs" fw={700} c="#d97706" style={{ backgroundColor: '#fff3cd', padding: '2px 8px', borderRadius: 4, display: 'inline-block' }}>
                            {row.scope}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 14px' }}>
                          <Text size="sm" fw={600} c="#007336">{row.status}</Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Group justify="space-between" align="center" mt="auto" pt="md" style={{ borderTop: '1px solid #f3f4f6' }}>
              <Text size="11px" c="#9ca3af">Showing controlled R1.0 pilot data</Text>
              <Text size="11px" c="#9ca3af">1-5 of 18</Text>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
