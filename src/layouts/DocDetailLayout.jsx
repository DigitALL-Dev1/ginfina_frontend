import { useState, useEffect } from 'react';
import {
  Box, Button, Grid, Group, Paper, Select,
  Text, TextInput, Title, Badge, Tabs, Divider, Loader, Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useSearchParams } from 'react-router-dom';
import { getDocRevisionById } from '../services/docRevisionService';
import { IconAlertCircle } from '@tabler/icons-react';

/* ─── Read-only field ────────────────────────────────────────────── */
function ReadField({ label, value, hint, required }) {
  return (
    <Box>
      <Text size="xs" fw={600} c="#374151" mb={4}>
        {label}{required && <Text span c="red"> *</Text>}
      </Text>
      <TextInput value={value} readOnly
        styles={{ input: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#374151', borderRadius: 6, height: 38, cursor: 'default' } }} />
      {hint && <Text size="11px" c="#9ca3af" mt={4}>{hint}</Text>}
    </Box>
  );
}

/* ─── Document preview panel ─────────────────────────────────────── */
function DocPreview() {
  return (
    <Box style={{ backgroundColor: '#f3f4f6', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16, minHeight: 360, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Simulated document sheet */}
      <Box style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: 6, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: 12, gap: 8 }}>
        {/* Title block lines */}
        <Box style={{ height: 10, width: '55%', backgroundColor: '#e5e7eb', borderRadius: 3 }} />
        <Box style={{ height: 8,  width: '35%', backgroundColor: '#f3f4f6', borderRadius: 3 }} />

        {/* Drawing area with cross-hair */}
        <Box style={{ flex: 1, border: '2px dashed #d1d5db', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0', position: 'relative', minHeight: 180 }}>
          {/* Crosshair */}
          <Box style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, backgroundColor: '#22a648', transform: 'translateY(-50%)' }} />
          <Box style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, backgroundColor: '#22a648', transform: 'translateX(-50%)' }} />
        </Box>

        {/* Footer lines */}
        <Box style={{ height: 8,  width: '70%', backgroundColor: '#e5e7eb', borderRadius: 3 }} />
        <Box style={{ height: 6,  width: '45%', backgroundColor: '#f3f4f6', borderRadius: 3 }} />
      </Box>

      {/* Zoom indicator */}
      <Box style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <Text size="xs" fw={600} c="#6b7280">100%</Text>
      </Box>
    </Box>
  );
}

/* ─── Overview tab ───────────────────────────────────────────────── */
function OverviewTab({ docRevisionData, isLoading }) {
  const [revSelector, setRevSelector] = useState('');
  const [view, setView] = useState('Preview');

  // Update revision selector when data changes
  useEffect(() => {
    if (docRevisionData?.revision_code) {
      setRevSelector(docRevisionData.revision_code);
    }
  }, [docRevisionData]);

  if (isLoading) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Loader size="lg" color="green" />
      </Box>
    );
  }

  if (!docRevisionData) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="No data" color="gray">
        No document revision found. Please provide a valid document revision ID.
      </Alert>
    );
  }

  return (
    <Grid gutter="md" align="flex-start">
      {/* Left: Record details */}
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Paper p="lg" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          {/* Panel header */}
          <Group justify="space-between" align="center" mb="md">
            <Title order={4} fw={700} fz={15} c="#111827">Record details</Title>
            <Badge size="sm" radius="sm"
              style={{ backgroundColor: '#e6fcf5', color: '#0ca678', fontWeight: 700, fontSize: 11, padding: '3px 12px', textTransform: 'none' }}>
              Authorised
            </Badge>
          </Group>

          <Grid gutter="md">
            {/* Document code */}
            <Grid.Col span={6}>
              <ReadField
                label="Document code"
                value={docRevisionData.document_code || 'N/A'}
                hint="Read-only · Controlled identity"
                required
              />
            </Grid.Col>

            {/* Current revision */}
            <Grid.Col span={6}>
              <ReadField
                label="Current revision"
                value={docRevisionData.revision_code || 'N/A'}
                hint="Read-only Badge · System derived"
                required
              />
            </Grid.Col>

            {/* Revision selector */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>Revision selector <Text span c="red">*</Text></Text>
                <Select
                  data={[docRevisionData.revision_code || 'R02']}
                  value={revSelector}
                  onChange={(v) => setRevSelector(v || docRevisionData.revision_code)}
                  styles={{ input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6, height: 38 } }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Select · All authorised revisions</Text>
              </Box>
            </Grid.Col>

            {/* View */}
            <Grid.Col span={6}>
              <Box>
                <Text size="xs" fw={600} c="#374151" mb={4}>View <Text span c="red">*</Text></Text>
                <Select
                  data={['Preview', 'Revisions', 'Submissions', 'Audit']}
                  value={view}
                  onChange={(v) => setView(v || 'Preview')}
                  styles={{ input: { backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: 6, height: 38 } }}
                />
                <Text size="11px" c="#9ca3af" mt={4}>Tabs · Preview / Revisions / Submissions / Audit</Text>
              </Box>
            </Grid.Col>

            {/* Additional info */}
            <Grid.Col span={6}>
              <ReadField
                label="Document title"
                value={docRevisionData.document_title || 'N/A'}
                hint="Read-only · From context"
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <ReadField
                label="Discipline"
                value={docRevisionData.discipline || 'N/A'}
                hint="Read-only · From EWP"
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <ReadField
                label="Deliverable"
                value={docRevisionData.deliverable || 'N/A'}
                hint="Read-only · From details"
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <ReadField
                label="Revision purpose"
                value={docRevisionData.revision_purpose || 'N/A'}
                hint="Read-only · From details"
              />
            </Grid.Col>
          </Grid>

          {/* Action buttons */}
          <Group mt="xl" gap="sm">
            <Button
              color="green"
              onClick={() => {
                if (docRevisionData.pdf_rendition_url) {
                  window.open(docRevisionData.pdf_rendition_url, '_blank');
                  notifications.show({
                    title: 'Opening rendition',
                    message: 'Opening current PDF review rendition.',
                    color: 'green',
                  });
                } else {
                  notifications.show({
                    title: 'No rendition',
                    message: 'PDF rendition not available.',
                    color: 'yellow',
                  });
                }
              }}
              disabled={!docRevisionData.has_pdf_rendition}
              style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6 }}>
              Open current review rendition
            </Button>
            <Button
              variant="default"
              onClick={() => notifications.show({ title: 'Draft saved', message: 'Document detail saved as draft.', color: 'blue' })}
              style={{ borderColor: '#d1d5db', color: '#374151', fontWeight: 600, height: 38, borderRadius: 6 }}>
              Save draft
            </Button>
          </Group>
        </Paper>
      </Grid.Col>

      {/* Right: Document preview */}
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Paper p="md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Title order={4} fw={700} fz={15} c="#111827" mb="sm">Current review rendition</Title>
          <Divider color="#f3f4f6" mb="sm" />
          <DocPreview />
          
          {/* File info */}
          <Box mt="md" p="sm" style={{ backgroundColor: '#f9fafb', borderRadius: 6 }}>
            <Text size="xs" fw={600} c="#374151" mb={6}>File Information</Text>
            <Grid gutter="xs">
              <Grid.Col span={6}>
                <Text size="11px" c="#9ca3af">Native File:</Text>
                <Text size="xs" c="#374151">{docRevisionData.has_native_file ? '✓ Available' : '✗ Not available'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="11px" c="#9ca3af">PDF Rendition:</Text>
                <Text size="xs" c="#374151">{docRevisionData.has_pdf_rendition ? '✓ Available' : '✗ Not available'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="11px" c="#9ca3af">Deliverable File:</Text>
                <Text size="xs" c="#374151">{docRevisionData.has_deliverable_file ? '✓ Available' : '✗ Not available'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="11px" c="#9ca3af">Last Updated:</Text>
                <Text size="xs" c="#374151">{docRevisionData.updated_at ? new Date(docRevisionData.updated_at).toLocaleDateString() : 'N/A'}</Text>
              </Grid.Col>
            </Grid>
          </Box>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}

/* ─── Placeholder tab ────────────────────────────────────────────── */
function PlaceholderTab({ label }) {
  return (
    <Paper p="xl" style={{ border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
      <Text c="dimmed" size="sm">{label} content — controlled R1.0 pilot data.</Text>
    </Paper>
  );
}

/* ─── Main layout ────────────────────────────────────────────────── */
export default function DocDetailLayout() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchParams] = useSearchParams();
  const [docRevisionData, setDocRevisionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabStyle = (key) =>
    activeTab === key ? { color: '#007336', borderBottomColor: '#007336', fontWeight: 600 } : {};

  // Fetch document revision data
  useEffect(() => {
    const fetchDocRevisionData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get document revision ID from URL params or use a default for demo
        const docRevId = searchParams.get('id') || 'doc-rev-95b59220-c5a6-489b-a7cd-a713a0fbda94';

        const response = await getDocRevisionById(docRevId);

        // Handle response
        const data = response?.data || response;
        setDocRevisionData(data);
      } catch (err) {
        console.error('Error fetching document revision data:', err);
        setError(err.message);
        notifications.show({
          title: 'Error loading data',
          message: 'Failed to fetch document revision: ' + err.message,
          color: 'red',
        });

        // Set fallback data for demo
        setDocRevisionData({
          id: 'doc-rev-sample',
          document_code: 'UNICEF-BO-EL-SLD-001',
          document_title: 'Single Line Diagram',
          discipline: 'Electrical',
          revision_code: 'R02',
          revision_purpose: 'For Review',
          deliverable: 'Single Line Diagram',
          has_native_file: true,
          has_pdf_rendition: true,
          has_deliverable_file: true,
          updated_at: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocRevisionData();
  }, [searchParams]);

  return (
    <Box>
      {/* Page header */}
      <Box mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} fz={{ base: 20, sm: 24 }} fw={700} c="#111827">
              Document Detail and Revision History
            </Title>
            <Text size="sm" c="#6b7280" mt={4} maw={560}>
              Show the controlled document identity, current revision, all prior revisions, submission
              history, approval status and release inclusion.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={() => {
              if (docRevisionData?.pdf_rendition_url) {
                window.open(docRevisionData.pdf_rendition_url, '_blank');
                notifications.show({
                  title: 'Opening rendition',
                  message: 'Opening current PDF review rendition.',
                  color: 'green',
                });
              } else {
                notifications.show({
                  title: 'No rendition',
                  message: 'PDF rendition not available.',
                  color: 'yellow',
                });
              }
            }}
            disabled={!docRevisionData?.has_pdf_rendition || isLoading}
            style={{ backgroundColor: '#007336', fontWeight: 600, height: 38, borderRadius: 6, paddingLeft: 20, paddingRight: 20, alignSelf: 'flex-start' }}>
            Open current review rendition
          </Button>
        </Group>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mb="md" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab} mb="md">
        <Tabs.List style={{ borderBottom: '1px solid #e5e7eb', gap: 24 }}>
          <Tabs.Tab value="overview"  style={tabStyle('overview')}>Overview</Tabs.Tab>
          <Tabs.Tab value="evidence"  style={tabStyle('evidence')}>Evidence</Tabs.Tab>
          <Tabs.Tab value="history"   style={tabStyle('history')}>History</Tabs.Tab>
          <Tabs.Tab value="audit"     style={tabStyle('audit')}>Audit</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="overview" pt="md">
          <OverviewTab docRevisionData={docRevisionData} isLoading={isLoading} />
        </Tabs.Panel>
        <Tabs.Panel value="evidence" pt="md"><PlaceholderTab label="Evidence" /></Tabs.Panel>
        <Tabs.Panel value="history"  pt="md"><PlaceholderTab label="History" /></Tabs.Panel>
        <Tabs.Panel value="audit"    pt="md"><PlaceholderTab label="Audit" /></Tabs.Panel>
      </Tabs>
    </Box>
  );
}
