import { ActionIcon, Group, Paper, ScrollArea, Table, Text, LoadingOverlay } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { mockRows } from '../../data/mockData';
import { getJson } from '../../services/apiClient';
import StatusBadge from './StatusBadge';

export default function RecordTable({ title = 'Controlled records', search = '', statusFilter = 'All', onOpen }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const isProjectRegister = title === 'Project Register';

  useEffect(() => {
    if (isProjectRegister) {
      setLoading(true);
      getJson('/gsolve/project-list')
        .then((res) => {
          if (res && res.data && res.data.project_list) {
            setProjects(res.data.project_list);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch projects:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isProjectRegister]);

  // Handle filtering
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = 
      project.project_name.toLowerCase().includes(search.toLowerCase()) ||
      project.project_code.toLowerCase().includes(search.toLowerCase()) ||
      project.customer.toLowerCase().includes(search.toLowerCase()) ||
      project.manager.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'All' || 
      project.project_status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const filteredMockRows = mockRows.filter((row) => {
    const matchesSearch = 
      row.title.toLowerCase().includes(search.toLowerCase()) ||
      row.owner.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'All' || 
      row.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (isProjectRegister) {
    return (
      <Paper p={0} style={{ overflow: 'hidden', position: 'relative' }}>
        <LoadingOverlay visible={loading} overlayProps={{ blur: 1 }} />
        <Group justify="space-between" p="md">
          <Text fw={700} size="sm">{title}</Text>
          <Text size="xs" c="dimmed">Authoritative GPROPEL Projects (GreenSolve API)</Text>
        </Group>
        <ScrollArea>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" miw={680}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Project Name</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Customer</Table.Th>
                <Table.Th>Manager</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Start Date</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredProjects.map((project) => (
                <Table.Tr key={project.id}>
                  <Table.Td>
                    <Text size="xs" fw={600}>{project.id}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600} size="sm">{project.project_name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">{project.project_code}</Text>
                  </Table.Td>
                  <Table.Td>{project.customer}</Table.Td>
                  <Table.Td>{project.manager}</Table.Td>
                  <Table.Td>
                    <StatusBadge status={project.project_status} />
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">{project.start_date}</Text>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon variant="subtle" color="green" onClick={() => onOpen?.(project)}>
                      <IconChevronRight size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
              {filteredProjects.length === 0 && !loading && (
                <Table.Tr>
                  <Table.Td colSpan={8} style={{ textAlign: 'center' }}>
                    <Text size="sm" c="dimmed" py="md">No projects found matching the current search parameters.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    );
  }

  return (
    <Paper p={0} style={{ overflow: 'hidden' }}>
      <Group justify="space-between" p="md">
        <Text fw={700} size="sm">{title}</Text>
        <Text size="xs" c="dimmed">Mock R1.0 pilot data</Text>
      </Group>
      <ScrollArea>
        <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" miw={680}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Deliverable / Record</Table.Th>
              <Table.Th>Revision</Table.Th>
              <Table.Th>Owner</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Due</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredMockRows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <Text size="xs" fw={600}>{row.id}</Text>
                </Table.Td>
                <Table.Td>{row.title}</Table.Td>
                <Table.Td>{row.revision}</Table.Td>
                <Table.Td>{row.owner}</Table.Td>
                <Table.Td>
                  <StatusBadge status={row.status} />
                </Table.Td>
                <Table.Td>{row.due}</Table.Td>
                <Table.Td>
                  <ActionIcon variant="subtle" color="green" onClick={() => onOpen?.(row)}>
                    <IconChevronRight size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );
}
