import { List, Paper, SimpleGrid, Text, ThemeIcon } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
export default function OutputsPanel({ outputs = [] }) { return <SimpleGrid cols={{ base:1, md:2 }} spacing="sm">{outputs.map((row)=><Paper key={row[1]} p="md"><List icon={<ThemeIcon color="green" size={22} radius="xl"><IconCheck size={14}/></ThemeIcon>}><List.Item><Text fw={600} size="sm">{row[1]}</Text><Text size="xs" c="dimmed">{row[3]}</Text></List.Item></List></Paper>)}</SimpleGrid>; }
