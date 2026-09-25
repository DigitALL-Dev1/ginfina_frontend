import { Box, Divider, NavLink, ScrollArea, Text } from '@mantine/core';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { IconFolder, IconMap2 } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { navigationGroups } from '../../config/navigation';
import { resolveDemoPath } from '../../utils/routes';

const groupItems = group => [...group.items, ...(group.sections || []).flatMap(section => section.items)];
const groupTitle = label => label.includes('Site Intelligence') ? 'Site Intelligence and Assessment'
  : label.includes('Site Engineering Baseline') ? 'Site Engineering Baseline'
  : label.includes('Engineering Workbench') ? 'Engineering Workbench' : label;

export default function NestedNavbar({ onNavigate }) {
  const { pathname } = useLocation();
  const activeGroup = navigationGroups.find(group => groupItems(group).some(item => matchPath(item.route, pathname)))?.label;
  const [expandedModule, setExpandedModule] = useState(activeGroup || null);
  useEffect(() => { setExpandedModule(activeGroup || null); }, [activeGroup]);
  const renderLink = item => (
    <NavLink key={item.route} component={Link} to={resolveDemoPath(item.route)}
      label={item.label || item.shortName || item.name}
      active={Boolean(matchPath(item.route, pathname))}
      aria-current={matchPath(item.route, pathname) ? 'page' : undefined}
      onClick={onNavigate} leftSection={<IconMap2 size={18} />} />
  );

  return <>
    <Box p="md"><Text size="xs" fw={700} c="dimmed" tt="uppercase">GINFINA</Text>
      <Text size="xs" c="dimmed">Integrated Engineering</Text></Box>
    <Divider />
    <ScrollArea className="gx1-navigation-scroll" p="xs" type="auto">
      <Box component="nav" aria-label="Engineering modules" className="gx1-navigation">
        {navigationGroups.filter(group => groupItems(group).length).map(group => (
          <NavLink component="button" type="button" key={group.label} label={groupTitle(group.label)} leftSection={<IconFolder size={19} />}
            aria-expanded={expandedModule === group.label}
            opened={expandedModule === group.label} onChange={opened => setExpandedModule(opened ? group.label : null)}
            active={activeGroup === group.label} childrenOffset={12} mb="xs">
            {group.items.map(renderLink)}
            {(group.sections || []).map(section => section.items.length === 1
              ? renderLink(section.items[0])
              : <NavLink component="button" type="button" key={section.label} label={section.label}
                  defaultOpened={section.items.some(item => matchPath(item.route, pathname))}>
                  {section.items.map(renderLink)}
                </NavLink>)}
          </NavLink>
        ))}
      </Box>
    </ScrollArea>
    <Divider /><Box p="md"><Text size="xs" fw={700}>R1.0 Pilot</Text><Text size="xs" c="dimmed">GX1 / Mantine</Text></Box>
  </>;
}
