import { Alert, Grid, Paper, Text } from '@mantine/core';
import ScreenForm from '../components/common/ScreenForm';
import OutputsPanel from '../components/common/OutputsPanel';
export default function PortalLayout({ spec }) { return <Grid justify="center"><Grid.Col span={{base:12,md:9,lg:7}}><Alert color="green" mb="md">External consultant view: only the assigned object scope and authorised evidence are visible.</Alert><Paper p="lg"><ScreenForm fields={spec.fields}/></Paper><Paper p="md" mt="md"><Text fw={700} size="sm" mb="md">Controlled result</Text><OutputsPanel outputs={spec.outputs}/></Paper></Grid.Col></Grid>; }
