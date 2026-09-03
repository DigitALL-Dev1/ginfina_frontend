import { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Group,
  Paper,
  Text,
  Title,
  Stack,
  Card,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

export default function SiteIntelligenceLayout() {
  const [activeModule, setActiveModule] = useState(null);

  const modules = [
    {
      id: 'site-assessment',
      title: 'Site Assessment',
      description: 'Comprehensive site evaluation and analysis',
      status: 'Active',
      color: '#007336',
    },
    {
      id: 'intelligence-reports',
      title: 'Intelligence Reports',
      description: 'Data-driven insights and reporting',
      status: 'Active',
      color: '#007336',
    },
    {
      id: 'risk-analysis',
      title: 'Risk Analysis',
      description: 'Identify and evaluate potential risks',
      status: 'Pending',
      color: '#d97706',
    },
  ];

  const handleModuleClick = (moduleId) => {
    setActiveModule(moduleId);
    notifications.show({
      title: 'Module Selected',
      message: `Opening ${modules.find(m => m.id === moduleId)?.title}...`,
      color: 'green',
    });
  };

  return (
    <Box>
      {/* Page Header */}
      <Box mb="xl">
        <Title
          order={1}
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#007336',
            letterSpacing: '-0.02em',
            marginBottom: '16px',
          }}
        >
          SITE INTELLIGENCE AND ASSESSMENT
        </Title>
        <Text size="lg" c="#6b7280" maw={800}>
          Advanced site intelligence platform for comprehensive assessment, analysis, and strategic decision-making.
        </Text>
      </Box>

      {/* Module Cards Grid */}
      <Grid gutter="lg">
        {modules.map((module) => (
          <Grid.Col key={module.id} span={{ base: 12, sm: 6, md: 4 }}>
            <Card
              shadow="sm"
              padding="xl"
              radius="md"
              style={{
                border: activeModule === module.id ? `2px solid ${module.color}` : '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                height: '100%',
              }}
              onClick={() => handleModuleClick(module.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <Title order={3} size="h4" c="#111827">
                    {module.title}
                  </Title>
                  <Badge
                    color={module.status === 'Active' ? 'green' : 'orange'}
                    variant="light"
                  >
                    {module.status}
                  </Badge>
                </Group>
                <Text size="sm" c="#6b7280">
                  {module.description}
                </Text>
                <Button
                  fullWidth
                  variant="light"
                  color="green"
                  mt="auto"
                  style={{ fontWeight: 600 }}
                >
                  Open Module
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {/* Information Section */}
      <Paper
        p="xl"
        mt="xl"
        style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 8,
        }}
      >
        <Group gap="xl">
          <Box style={{ flex: 1 }}>
            <Title order={4} c="#065f46" mb="sm">
              Getting Started
            </Title>
            <Text size="sm" c="#047857">
              Select a module above to begin your site intelligence and assessment workflow.
              Each module provides specialized tools and features for comprehensive site analysis.
            </Text>
          </Box>
          <Button
            size="lg"
            style={{
              backgroundColor: '#007336',
              fontWeight: 600,
            }}
          >
            View Documentation
          </Button>
        </Group>
      </Paper>
    </Box>
  );
}
