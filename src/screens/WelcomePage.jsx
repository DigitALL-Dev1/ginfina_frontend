import { Box, Title, Text, Container, Stack, Paper, SimpleGrid, Card, Badge } from '@mantine/core';

export default function WelcomePage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Welcome Header */}
        <Box>
          <Title
            order={1}
            style={{
              fontSize: '56px',
              fontWeight: 700,
              color: '#007336',
              letterSpacing: '-0.02em',
              marginBottom: '16px',
            }}
          >
            Welcome to GINFINA
          </Title>
          <Text size="xl" c="#6b7280" maw={800}>
            GREEN Integrated Engineering, Infrastructure and Automation System
          </Text>
        </Box>

        {/* Module Overview Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" mt="xl">
          <Card
            shadow="sm"
            padding="xl"
            radius="md"
            style={{
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease',
            }}
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
              <Badge color="green" variant="light" size="lg">
                SIA
              </Badge>
              <Title order={3} size="h4" c="#111827">
                Site Intelligence and Assessment
              </Title>
              <Text size="sm" c="#6b7280">
                Comprehensive site intelligence platform for assessment, analysis, and strategic decision-making.
              </Text>
            </Stack>
          </Card>

          <Card
            shadow="sm"
            padding="xl"
            radius="md"
            style={{
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease',
            }}
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
              <Badge color="green" variant="light" size="lg">
                SEB
              </Badge>
              <Title order={3} size="h4" c="#111827">
                Site Engineering Baseline
              </Title>
              <Text size="sm" c="#6b7280">
                Establish and manage engineering baselines for site-specific project requirements.
              </Text>
            </Stack>
          </Card>

          <Card
            shadow="sm"
            padding="xl"
            radius="md"
            style={{
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease',
            }}
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
              <Badge color="green" variant="light" size="lg">
                EWP
              </Badge>
              <Title order={3} size="h4" c="#111827">
                Engineering Workbench Project
              </Title>
              <Text size="sm" c="#6b7280">
                Complete engineering project management with integrated workflows and deliverables.
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Information Panel */}
        <Paper
          p="xl"
          mt="xl"
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
          }}
        >
          <Stack gap="md">
            <Title order={4} c="#065f46">
              Getting Started
            </Title>
            <Text size="sm" c="#047857">
              Use the sidebar navigation to access different modules. Each module provides specialized tools 
              and features for comprehensive engineering project management, from initial site assessment 
              through to final delivery and procurement.
            </Text>
          </Stack>
        </Paper>

        {/* System Info */}
        <Box mt="xl">
          <Text size="xs" c="dimmed" ta="center">
            GINFINA R1.0 Pilot • GX1 Design System • Powered by GREEN
          </Text>
        </Box>
      </Stack>
    </Container>
  );
}
