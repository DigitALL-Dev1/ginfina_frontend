import { Badge, Button, Group, Menu, Stack, Text, Title } from '@mantine/core';
import { IconChevronDown, IconInfoCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import branches from '../../config/branches.json';
export default function PageHeader({ spec, onMeta }) {
  const navigate = useNavigate();
  const screenBranches = branches.filter((b) => b.screenId === spec.id);
  const primary = screenBranches.find((b) => b.kind === 'primary');
  const secondary = screenBranches.filter((b) => b.kind === 'secondary');
  return <Group justify="space-between" align="flex-start" mb="md" gap="md">
    <Stack gap={4} style={{ minWidth:0 }}>
      <Text className="gx1-kicker">{spec.id} · {spec.module}</Text>
      <Title order={1} fz={{ base:20, sm:24 }} c="#182b23">{spec.name}</Title>
      <Text size="sm" c="dimmed" maw={820}>{spec.contract?.find((r) => r[1] === 'Screen purpose')?.[2]}</Text>
      <Group gap="xs"><Badge color="green" variant="light">{spec.density} task density</Badge><Badge color="blue" variant="light">{spec.layout}</Badge><Badge variant="outline">{spec.brd}</Badge></Group>
    </Stack>
    <Group gap="xs" className="gx1-desktop-only">
      <Button variant="subtle" color="gray" leftSection={<IconInfoCircle size={16}/>} onClick={onMeta}>Screen spec</Button>
      {secondary.length > 0 && <Menu position="bottom-end" shadow="md"><Menu.Target><Button variant="default" rightSection={<IconChevronDown size={14}/>}>More</Button></Menu.Target><Menu.Dropdown>{secondary.map((b) => <Menu.Item key={b.key} onClick={() => navigate(b.route)}>{b.title}</Menu.Item>)}</Menu.Dropdown></Menu>}
      {primary && <Button color="green" onClick={() => navigate(primary.route)}>{primary.title}</Button>}
    </Group>
  </Group>;
}
