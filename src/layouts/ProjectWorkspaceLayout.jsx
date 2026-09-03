import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Grid, 
  Group, 
  Paper, 
  Select, 
  Text, 
  TextInput, 
  Title, 
  Badge, 
  LoadingOverlay,
  Tabs,
  Stack
} from '@mantine/core';
import { useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

export default function ProjectWorkspaceLayout({ spec }) {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  // Fetch project details and summary from API
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const targetId = projectId || '1';

    // Fetch project detail
    fetch(`http://127.0.0.1:8001/api/projects/${targetId}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json && json.data) {
          setProject(json.data);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch project detail:', err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    // Fetch summary
    fetch(`http://127.0.0.1:8001/api/projects/${targetId}/engineering-summary`, { signal: controller.signal })
      .then((res) => {
        if (res.ok) return res.json();
      })
      .then((json) => {
        if (json && json.data) {
          setSummary(json.data);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch engineering summary:', err);
        }
      });

    return () => {
      controller.abort();
    };
  }, [projectId]);

  const handleCreatePackage = () => {
    notifications.show({
      title: 'Action initiated',
      message: 'Creating new Engineering Work Package (EWP)...',
      color: 'green'
    });
  };

  const handleSaveDraft = () => {
    notifications.show({
      title: 'Draft saved',
      message: 'Project engineering workspace state has been saved locally.',
      color: 'green'
    });
  };

  const authorisationStatus = project?.authorisation_status || 'Authorised';
  const displayProjectName = project?.project_name || 'UNICEF Central Province Solar';

  return (
    <Box style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} overlayProps={{ blur: 1 }} />

      {/* Header */}
      <Box mb="md">
        <Group justify="space-between" align="center">
          <Box>
            <Title order={1} fz={{ base: 22, sm: 26 }} fw={700} c="#111827">
              Project Engineering Workspace
            </Title>
            <Text size="sm" c="#6b7280" mt={4}>
              Present the project engineering control surface with sites, EWP status, upcoming deliverables, review bottlenecks and project engineering evidence.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleCreatePackage}
            className="gx1-desktop-only"
            style={{
              backgroundColor: '#007336',
              height: 38,
              borderRadius: 6
            }}
          >
            Create engineering work package
          </Button>
        </Group>
      </Box>

      {/* Custom Tabs Navigation */}
      <Box mb="lg">
        <Tabs 
          value={activeTab} 
          onChange={(val) => setActiveTab(val || 'Overview')}
          variant="outline"
          styles={{
            root: {
              borderBottom: '1px solid #e5e7eb'
            },
            tab: {
              border: 'none',
              paddingBottom: 12,
              fontWeight: 600,
              fontSize: 14,
              color: '#6b7280',
              '&[data-active]': {
                color: '#007336',
                borderBottom: '2px solid #007336'
              }
            }
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="Overview">Overview</Tabs.Tab>
            <Tabs.Tab value="Evidence">Evidence</Tabs.Tab>
            <Tabs.Tab value="History">History</Tabs.Tab>
            <Tabs.Tab value="Audit">Audit</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </Box>

      {/* Grid Content */}
      <Grid gutter="md">
        {/* Left Column: Record details */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper 
            p="md" 
            style={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb', 
              borderRadius: 8,
              minHeight: 320
            }}
          >
            <Group justify="space-between" align="center" mb="lg">
              <Title order={4} fw={700} fz={15} c="#111827">
                Record details
              </Title>
              <Badge 
                size="sm" 
                radius="xl"
                style={{
                  backgroundColor: authorisationStatus.toLowerCase() === 'authorised' ? '#e6fcf5' : '#fff9db',
                  color: authorisationStatus.toLowerCase() === 'authorised' ? '#0ca678' : '#f08c00',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: 11,
                  padding: '4px 10px'
                }}
              >
                {authorisationStatus}
              </Badge>
            </Group>

            <Grid gutter="md">
              <Grid.Col span={6}>
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Project selector *</Text>
                  <TextInput
                    value={displayProjectName}
                    readOnly
                    styles={{
                      input: {
                        borderColor: '#d1d5db',
                        borderRadius: 6,
                        height: 38,
                        backgroundColor: '#f9fafb'
                      }
                    }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>
                    Select · Security trimmed
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={6}>
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Discipline filter</Text>
                  <TextInput
                    value="All"
                    readOnly
                    styles={{
                      input: {
                        borderColor: '#d1d5db',
                        borderRadius: 6,
                        height: 38,
                        backgroundColor: '#f9fafb'
                      }
                    }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>
                    MultiSelect · Controlled taxonomy
                  </Text>
                </Box>
              </Grid.Col>
            </Grid>

            {/* Action Buttons */}
            <Group mt="xl" gap="sm">
              <Button
                color="green"
                onClick={handleCreatePackage}
                style={{
                  backgroundColor: '#007336',
                  color: '#ffffff',
                  fontWeight: 600,
                  height: 38,
                  borderRadius: 6,
                  paddingLeft: 18,
                  paddingRight: 18
                }}
              >
                Create engineering work package
              </Button>
              <Button
                variant="default"
                onClick={handleSaveDraft}
                style={{
                  borderColor: '#d1d5db',
                  color: '#374151',
                  fontWeight: 600,
                  height: 38,
                  borderRadius: 6,
                  paddingLeft: 18,
                  paddingRight: 18
                }}
              >
                Save draft
              </Button>
            </Group>
          </Paper>
        </Grid.Col>

        {/* Right Column: Controlled outputs and evidence */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper 
            p="md" 
            style={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb', 
              borderRadius: 8,
              minHeight: 320
            }}
          >
            <Title order={4} fw={700} fz={15} c="#111827" mb="md">
              Controlled outputs and evidence
            </Title>

            <Stack gap="sm">
              {[
                { 
                  title: 'Project summary', 
                  description: summary?.project_summary || 'Browse WBS, client references and general context.' 
                },
                { 
                  title: 'Site cards', 
                  description: summary?.site_cards || 'Site layouts, coordinates, and physical parameters.' 
                },
                { 
                  title: 'EWP health', 
                  description: summary?.ewp_health || 'Engineering Work Package tracking and authorization statuses.' 
                },
                { 
                  title: 'Delivery timeline', 
                  description: summary?.delivery_timeline || 'Key milestones, schedule health, and blockers.' 
                }
              ].map((panel, idx) => (
                <Paper 
                  key={idx}
                  p="sm" 
                  style={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Text size="sm" fw={700} c="#111827">
                        {panel.title}
                      </Text>
                      <Text size="xs" c="#6b7280" style={{ maxWidth: '90%' }}>
                        {panel.description}
                      </Text>
                    </Stack>
                    <Badge 
                      size="sm" 
                      radius="xl"
                      style={{
                        backgroundColor: '#e6fcf5',
                        color: '#0ca678',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: 10,
                        padding: '2px 8px'
                      }}
                    >
                      Current
                    </Badge>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
