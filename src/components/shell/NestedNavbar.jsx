import { Box, Divider, Group, NavLink, ScrollArea, Text, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Link, useLocation } from 'react-router-dom';
import { IconHome, IconFolder, IconTool, IconListDetails, IconFileText, IconChecks, IconShoppingCart, IconCircleCheck, IconShield, IconChartBar, IconSettings, IconSparkles, IconMap2, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { navigationGroups } from '../../config/navigation';
import { resolveDemoPath } from '../../utils/routes';
import React from 'react';

const ICONS = [IconHome, IconFolder, IconTool, IconListDetails, IconFileText, IconChecks, IconShoppingCart, IconCircleCheck, IconShield, IconChartBar, IconSettings, IconSparkles];

export default function NestedNavbar({ onNavigate }) {
  const location = useLocation();
  const tablet = useMediaQuery('(min-width: 48em) and (max-width: 74.99em)');
  const [expandedModule, setExpandedModule] = React.useState(null);

  const toggleModule = (moduleLabel) => {
    setExpandedModule(expandedModule === moduleLabel ? null : moduleLabel);
  };

  return (
    <>
      <Box p={tablet ? 'xs' : 'md'}>
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: 1 }}>
          {tablet ? 'GIN' : 'GINFINA'}
        </Text>
        {!tablet && (
          <Text size="xs" c="dimmed" style={{ marginTop: 2 }}>
            Integrated Engineering
          </Text>
        )}
      </Box>
      <Divider />
      <ScrollArea style={{ flex: 1 }} p="xs">
        <Box>
          {navigationGroups.map((group, index) => {
            const Icon = ICONS[index] || IconFolder;

            // Skip empty groups that have neither items nor sections
            const hasItems = group.items && group.items.length > 0;
            const hasSections = group.sections && group.sections.length > 0;
            if (!hasItems && !hasSections) {
              return null;
            }

            // Check if any item in the group is active, handling dynamic routes
            const active = group.items.some((s) => {
              if (s.route.includes(':')) {
                // Check if current path exactly matches a static route in the same group
                const hasExactStaticMatch = group.items.some((si) =>
                  !si.route.includes(':') && location.pathname === resolveDemoPath(si.route)
                );

                // If there's an exact static match, only activate if this is that static route
                if (hasExactStaticMatch) {
                  return false;
                }

                // Convert route pattern to regex for accurate matching
                const routePattern = s.route
                  .split('/')
                  .map(segment => segment.startsWith(':') ? '[^/]+' : segment)
                  .join('/');
                const routeRegex = new RegExp(`^${routePattern}$`);
                return routeRegex.test(location.pathname);
              }
              return location.pathname.startsWith(resolveDemoPath(s.route));
            });

            if (tablet) {
              const first = group.items[0];
              const target = first ? resolveDemoPath(first.route) : '/ginfina/workbench';
              return (
                <Tooltip key={group.label} label={group.label} position="right">
                  <NavLink
                    component={Link}
                    to={target}
                    active={active}
                    label={null}
                    leftSection={<Icon size={20} />}
                    onClick={onNavigate}
                    style={{ justifyContent: 'center' }}
                  />
                </Tooltip>
              );
            }

            // Check if this group has sections (new structure for SIA, SEB, and EWP)
            if (group.sections && group.sections.length > 0) {
              // Determine the display title based on the module
              let displayTitle = group.label;
              if (group.label.includes('Site Intelligence')) {
                displayTitle = 'SITE INTELLIGENCE AND ASSESSMENT';
              } else if (group.label.includes('Site Engineering Baseline')) {
                displayTitle = 'SITE ENGINEERING BASELINE';
              } else if (group.label.includes('Engineering Workbench')) {
                displayTitle = 'ENGINEERING WORKBENCH';
              }

              const isExpanded = expandedModule === group.label;

              return (
                <Box key={group.label} mb="md">
                  {/* Module Title - Clickable */}
                  <Box
                    onClick={() => toggleModule(group.label)}
                    style={{
                      cursor: 'pointer',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: '4px',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 115, 54, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Text
                      size="xs"
                      fw={700}
                      c="#007336"
                      tt="uppercase"
                      style={{
                        letterSpacing: '0.06em',
                        fontSize: '13px',
                        fontWeight: 700
                      }}
                    >
                      {displayTitle}
                    </Text>
                    {isExpanded ? (
                      <IconChevronDown size={16} color="#007336" />
                    ) : (
                      <IconChevronRight size={16} color="#007336" />
                    )}
                  </Box>

                  {/* Sections - Only show when expanded */}
                  {isExpanded && (
                    <>
                      {/* Regular screen items if any */}
                      {group.items.map((screen) => {
                        const screenPath = resolveDemoPath(screen.route);
                        const isActive = location.pathname === screenPath;

                        return (
                          <NavLink
                            key={screen.id}
                            component={Link}
                            to={screenPath}
                            label={screen.shortName ?? screen.name}
                            active={isActive}
                            onClick={onNavigate}
                            leftSection={<Icon size={16} color="var(--mantine-color-dimmed)" />}
                          />
                        );
                      })}

                      {/* Sections with subsections */}
                      {group.sections.map((section, sectionIndex) => (
                        <NavLink
                          key={`${group.label}-${sectionIndex}`}
                          label={
                            <Text size="sm" fw={500} c="#6b7280">
                              {section.label}
                            </Text>
                          }
                          leftSection={<IconMap2 size={20} color="#6b7280" />}
                          defaultOpened={false}
                          styles={{
                            root: {
                              padding: '10px 16px',
                            },
                            label: {
                              fontSize: '15px',
                            }
                          }}
                        >
                          {section.items.map((item, itemIndex) => (
                            <NavLink
                              key={`${group.label}-${sectionIndex}-${itemIndex}`}
                              component={Link}
                              to={item.route || '#'}
                              label={item.label}
                              onClick={onNavigate}
                            />
                          ))}
                        </NavLink>
                      ))}
                    </>
                  )}
                </Box>
              );
            }

            // Original rendering for groups without sections
            return (
              <NavLink
                key={group.label}
                label={
                  <Text
                    size="xs"
                    fw={600}
                    c="dimmed"
                    tt="uppercase"
                    style={{ letterSpacing: '0.06em' }}
                  >
                    {group.label}
                  </Text>
                }
                leftSection={<Icon size={16} color="var(--mantine-color-dimmed)" />}
                defaultOpened={active}
              >
                {group.items.map((screen) => {
                  // Handle dynamic routes like /ginfina/ewp/:ewpId
                  const screenPath = resolveDemoPath(screen.route);

                  // Check if route has dynamic parameters
                  let isActive;
                  if (screen.route.includes(':')) {
                    // For dynamic routes, we need to match more precisely
                    // But exclude static paths that come before dynamic ones
                    // e.g., /ginfina/ewp/new should NOT match /ginfina/ewp/:ewpId

                    // Check if current path exactly matches a static route in the same group
                    const hasExactStaticMatch = group.items.some((s) =>
                      !s.route.includes(':') && location.pathname === resolveDemoPath(s.route)
                    );

                    // If there's an exact static match and this is a dynamic route, don't activate
                    if (hasExactStaticMatch) {
                      isActive = false;
                    } else {
                      // Convert route pattern to regex for accurate matching
                      const routePattern = screen.route
                        .split('/')
                        .map(segment => segment.startsWith(':') ? '[^/]+' : segment)
                        .join('/');
                      const routeRegex = new RegExp(`^${routePattern}$`);
                      isActive = routeRegex.test(location.pathname);
                    }

                    // Debug logging
                    if (screen.name?.includes('EWP') || screen.shortName?.includes('EWP')) {
                      console.log(`${screen.shortName || screen.name} Active Check:`, {
                        route: screen.route,
                        currentPath: location.pathname,
                        isActive
                      });
                    }
                  } else {
                    // For static routes, use exact match
                    isActive = location.pathname === screenPath;
                  }

                  return (
                    <NavLink
                      key={screen.id}
                      component={Link}
                      to={screenPath}
                      label={screen.shortName ?? screen.name}
                      active={isActive}
                      onClick={onNavigate}
                    />
                  );
                })}
              </NavLink>
            );
          })}
        </Box>
      </ScrollArea>
      <Divider />
      <Group p={tablet ? 'xs' : 'md'} justify="space-between">
        <div>
          {!tablet && (
            <>
              <Text size="xs" fw={700}>R1.0 Pilot</Text>
              <Text size="xs" c="dimmed">GX1 · Mantine</Text>
            </>
          )}
        </div>
      </Group>
    </>
  );
}
