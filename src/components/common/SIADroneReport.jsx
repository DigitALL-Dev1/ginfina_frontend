import { Box, Title, Text, Button, Loader, Group } from '@mantine/core';
import { IconFileText, IconDownload } from '@tabler/icons-react';

export default function SIADroneReport({ api, siteId }) {
  // Placeholder component - will be fully implemented later
  
  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <Box>
          <Title order={3} fw={700} c="#111827">Drone Survey Report</Title>
          <Text size="sm" c="#6b7280" mt={4}>
            Generate comprehensive drone mission reports
          </Text>
        </Box>
        <Button 
          color="green" 
          leftSection={<IconDownload size={16} />}
          disabled
          style={{ backgroundColor: '#007336' }}
        >
          Generate PDF
        </Button>
      </Group>

      <Box 
        p="xl" 
        style={{ 
          backgroundColor: '#f9fafb', 
          border: '1px solid #e5e7eb', 
          borderRadius: 8,
          textAlign: 'center',
          minHeight: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        <IconFileText size={60} color="#d1d5db" style={{ marginBottom: 16 }} />
        <Text size="sm" c="#6b7280" fw={600} mb="xs">
          Report Generation Coming Soon
        </Text>
        <Text size="xs" c="dimmed">
          The drone survey report will include mission details, quality checks,
          <br />derived products, and comprehensive flight data analysis.
        </Text>
      </Box>
    </Box>
  );
}
