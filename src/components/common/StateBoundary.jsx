import { Alert, Button, Center, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { IconAlertTriangle, IconLock } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
export default function StateBoundary({ children }) {
 const [params,setParams]=useSearchParams(); const state=params.get('state') || 'ready';
 if(state==='loading') return <Center mih={360}><Stack align="center"><Loader color="green"/><Text c="dimmed">Loading authorised engineering context…</Text></Stack></Center>;
 if(state==='empty') return <Paper p="xl"><Stack align="center"><Title order={3}>No authorised records</Title><Text c="dimmed">There is no data matching the current security scope or filter.</Text><Button onClick={()=>{params.delete('state');setParams(params)}}>Return to ready state</Button></Stack></Paper>;
 if(state==='error') return <Alert color="red" icon={<IconAlertTriangle/>} title="Controlled error">The operation could not be completed. No engineering state was changed.</Alert>;
 if(state==='denied') return <Alert color="orange" icon={<IconLock/>} title="Permission denied">Your role or object scope does not permit this operation.</Alert>;
 return children;
}
