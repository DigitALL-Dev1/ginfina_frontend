import { Paper, Stack, Text, Timeline } from '@mantine/core';
import { timeline } from '../../data/mockData';
export default function EvidenceTimeline() { return <Paper p="md"><Text fw={700} size="sm" mb="md">Evidence timeline</Text><Timeline active={3} bulletSize={20} lineWidth={2}>{timeline.map(([time,title,desc])=><Timeline.Item key={time+title} title={title}><Text size="xs" c="dimmed">{desc}</Text><Text size="xs" c="teal" mt={4}>{time}</Text></Timeline.Item>)}</Timeline></Paper>; }
