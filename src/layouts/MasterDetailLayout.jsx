import { Badge, Grid, Paper, Stack, Text } from '@mantine/core';
import RecordTable from '../components/common/RecordTable';
import DocumentViewer from '../components/common/DocumentViewer';
import { comments } from '../data/mockData';
import StatusBadge from '../components/common/StatusBadge';
export default function MasterDetailLayout({ spec }) { return <Grid gutter="md"><Grid.Col span={{base:12,lg:3}}><RecordTable title="Review set"/></Grid.Col><Grid.Col span={{base:12,lg:6}}><DocumentViewer/><Paper p="md" mt="md"><Text size="xs" c="dimmed">Immutable source context</Text><Text size="sm" fw={600}>SUB-UNICEF-024 · manifest hash 31a9…77bd</Text></Paper></Grid.Col><Grid.Col span={{base:12,lg:3}}><Paper p="md"><Text fw={700} size="sm" mb="md">Review comments</Text><Stack>{comments.map((c)=><Paper key={c.id} p="sm"><Stack gap={5}><Text size="xs" fw={700}>{c.author}</Text><Text size="sm">{c.body}</Text><Badge variant="outline" size="xs">{c.id}</Badge><StatusBadge status={c.status}/></Stack></Paper>)}</Stack></Paper></Grid.Col></Grid>; }
