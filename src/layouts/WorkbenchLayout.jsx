import { Button, Group, Paper, Select, TextInput } from '@mantine/core';
import { IconFilter, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import RecordTable from '../components/common/RecordTable';
import OutputsPanel from '../components/common/OutputsPanel';

export default function WorkbenchLayout({ spec }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');

  const isProjectRegister = spec.name === 'Project Register';
  const statusData = isProjectRegister 
    ? ['All', 'In Progress', 'Completed']
    : ['All', 'Ready', 'In Review', 'Blocked', 'Approved'];

  return (
    <>
      <Paper p="md" mb="md">
        <Group align="end" wrap="wrap">
          <TextInput 
            label="Search" 
            placeholder={`Search ${spec.name.toLowerCase()}...`} 
            leftSection={<IconSearch size={16}/>} 
            style={{flex: 1, minWidth: 220}}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select 
            label="Status" 
            data={statusData} 
            value={status}
            onChange={(val) => setStatus(val || 'All')}
            w={170}
          />
          <Select 
            label="Project" 
            data={['All active projects', 'UNICEF 2026']} 
            defaultValue="All active projects" 
            w={190}
          />
          <Button variant="default" leftSection={<IconFilter size={16}/>}>Filters</Button>
        </Group>
      </Paper>
      <RecordTable title={spec.name} search={search} statusFilter={status} />
      <Paper p="md" mt="md">
        <OutputsPanel outputs={spec.outputs}/>
      </Paper>
    </>
  );
}
