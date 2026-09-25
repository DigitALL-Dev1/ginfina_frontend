import { ActionIcon, AppShell, Burger, Drawer, Group, Image, Select, Text } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconLayoutGrid } from '@tabler/icons-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import NestedNavbar from './NestedNavbar';
export default function GinfinaAppShell() {
 const [opened,{toggle,close}]=useDisclosure(false); const compact=useMediaQuery('(max-width: 74.99em)'); const location=useLocation();
 return <AppShell header={{height:60}} navbar={{width:260, breakpoint:'lg', collapsed:{mobile:true}}} padding={0} transitionDuration={180}>
  <AppShell.Header><Group h="100%" px={{base:'xs',sm:'md'}} justify="space-between" wrap="nowrap"><Group className="gx1-shell-brand" wrap="nowrap"><Burger opened={opened} onClick={toggle} hiddenFrom="lg" size="sm" aria-label="Open navigation" aria-expanded={opened}/><ActionIcon component={Link} to="/ginfina/ui-catalog" aria-label="UI catalog" variant="light" color="green" visibleFrom="lg"><IconLayoutGrid size={18}/></ActionIcon><div><Text fw={700} size="sm">GINFINA Engineering Workbench</Text><Text size="xs" c="dimmed" visibleFrom="lg">GREEN Intelligent Engineering, Infrastructure and Automation System</Text></div></Group><Group wrap="nowrap"><Select className="gx1-desktop-only" aria-label="Current role" size="xs" w={150} value="Engineer" data={['Engineer','Reviewer','Consultant','Manager','Administrator']} onChange={()=>{}}/><Text size="xs" c="dimmed" className="gx1-desktop-only">UNICEF Pilot</Text><Image className="gx1-shell-logo" src="/green-logo.png" alt="GREEN Future Envisioned" h={34} w="auto" fit="contain"/></Group></Group></AppShell.Header>
  <AppShell.Navbar visibleFrom="lg"><NestedNavbar onNavigate={close}/></AppShell.Navbar>
  <Drawer opened={opened && compact} onClose={close} title="Navigation" zIndex={400} size="min(360px, 100vw)" classNames={{body:'gx1-navigation-drawer-body'}} closeButtonProps={{'aria-label':'Close navigation'}}><NestedNavbar onNavigate={close}/></Drawer>
  <AppShell.Main className="gx1-main" key={location.pathname}><Outlet/></AppShell.Main>
 </AppShell>;
}
