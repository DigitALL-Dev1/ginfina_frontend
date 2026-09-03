import { ActionIcon, AppShell, Burger, Group, Image, Select, Text } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconLayoutGrid } from '@tabler/icons-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import NestedNavbar from './NestedNavbar';
export default function GinfinaAppShell() {
 const [opened,{toggle,close}]=useDisclosure(false); const tablet=useMediaQuery('(min-width: 48em) and (max-width: 74.99em)'); const location=useLocation();
 return <AppShell header={{height:60}} navbar={{width:tablet?72:260, breakpoint:'sm', collapsed:{mobile:!opened}}} padding={0} transitionDuration={180}>
  <AppShell.Header><Group h="100%" px="md" justify="space-between" wrap="nowrap"><Group wrap="nowrap"><Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm"/><ActionIcon component={Link} to="/ginfina/ui-catalog" variant="light" color="green" visibleFrom="sm"><IconLayoutGrid size={18}/></ActionIcon><div><Text fw={700} size="sm">GINFINA Engineering Workbench</Text><Text size="xs" c="dimmed" visibleFrom="sm">GREEN Intelligent Engineering, Infrastructure and Automation System</Text></div></Group><Group wrap="nowrap"><Select className="gx1-desktop-only" size="xs" w={150} value="Engineer" data={['Engineer','Reviewer','Consultant','Manager','Administrator']} onChange={()=>{}}/><Text size="xs" c="dimmed" className="gx1-desktop-only">UNICEF Pilot</Text><Image src="/green-logo.png" alt="GREEN Future Envisioned" h={34} w="auto" fit="contain"/></Group></Group></AppShell.Header>
  <AppShell.Navbar><NestedNavbar onNavigate={close}/></AppShell.Navbar>
  <AppShell.Main className="gx1-main" key={location.pathname}><Outlet/></AppShell.Main>
 </AppShell>;
}
