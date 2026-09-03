import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Grid, 
  Group, 
  Paper, 
  Text, 
  TextInput, 
  Textarea,
  Title, 
  Badge, 
  LoadingOverlay,
  Tabs,
  Stack,
  ThemeIcon,
  Select,
  FileInput
} from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import { IconMapPin } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

export default function SiteContextLayout({ spec }) {
  const { projectId, siteId } = useParams();
  const navigate = useNavigate();
  const [siteData, setSiteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [projectsList, setProjectsList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch projects list
  useEffect(() => {
    fetch('http://127.0.0.1:8001/api/projects')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json && json.data && Array.isArray(json.data.project_list)) {
          setProjectsList(json.data.project_list);
        }
      })
      .catch((err) => console.error('Failed to fetch projects:', err));
  }, []);

  const projectSelectData = projectsList.map((p) => ({
    value: String(p.id),
    label: p.project_name
  }));

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const targetSiteId = siteId || '1';

    fetch(`http://127.0.0.1:8001/api/projects/sites/${targetSiteId}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json && json.data) {
          setSiteData(json.data);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch site context:', err);
          // Fallback standard data if API fails or restarts
          setSiteData({
            site_name: 'Boregaina Village',
            latitude_longitude: '-9.x, 147.x',
            grid_utility_context: 'Mini-grid / isolated',
            local_load_summary: 'Health centre + school + 25 households',
            site_evidence: 'survey.pdf; photos.zip',
            location_details: 'Boregaina Village · Rigo District · Central Province',
            authorisation_status: 'Authorised'
          });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [projectId, siteId]);

  const [mapCoords, setMapCoords] = useState('-9.7523, 147.7471');

  useEffect(() => {
    if (!siteData?.latitude_longitude) return;
    const clean = siteData.latitude_longitude.replace(/x/g, '0');
    const parts = clean.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        const handler = setTimeout(() => {
          setMapCoords(`${lat}, ${lng}`);
        }, 600);
        return () => clearTimeout(handler);
      }
    }
  }, [siteData?.latitude_longitude]);

  const handleConfirmContext = () => {
    const targetProjId = projectId || '1';

    if (!selectedFile && (!siteData?.site_evidence || siteData.site_evidence === 'N/A')) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please upload a Site Evidence file before confirming.',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    
    const coordsParts = (siteData?.latitude_longitude || '-9.4, 147.3').split(',');
    const latitude = parseFloat(coordsParts[0]) || 0.0;
    const longitude = parseFloat(coordsParts[1]) || 0.0;

    const formData = new FormData();
    formData.append('project_id', targetProjId);
    formData.append('site_name', siteData?.site_name || 'Boregaina Village');
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    
    if (siteData?.grid_utility_context) {
      formData.append('grid_utility_context', siteData.grid_utility_context);
    }
    if (siteData?.local_load_summary) {
      formData.append('local_load_summary', siteData.local_load_summary);
    }
    if (selectedFile) {
      formData.append('site_evidence', selectedFile);
    }

    fetch('http://127.0.0.1:8001/api/projects/sites', {
      method: 'POST',
      body: formData
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json && json.data) {
          notifications.show({
            title: 'Site Context Confirmed',
            message: `Site ${json.data.site_name} created/updated with ID: ${json.data.id}`,
            color: 'green'
          });
          setSiteData(json.data);
          setSelectedFile(null);
          navigate(`/ginfina/projects/${targetProjId}/sites/${json.data.id}`);
        }
      })
      .catch((err) => {
        console.error('Failed to confirm site context:', err);
        notifications.show({
          title: 'Error',
          message: 'Failed to confirm site context on server.',
          color: 'red'
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSaveDraft = () => {
    const targetProjId = projectId || '1';

    if (!selectedFile && (!siteData?.site_evidence || siteData.site_evidence === 'N/A')) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please upload a Site Evidence file before saving a draft.',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    
    const coordsParts = (siteData?.latitude_longitude || '-9.4, 147.3').split(',');
    const latitude = parseFloat(coordsParts[0]) || 0.0;
    const longitude = parseFloat(coordsParts[1]) || 0.0;

    const formData = new FormData();
    formData.append('project_id', targetProjId);
    formData.append('site_name', siteData?.site_name || 'Boregaina Village');
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    
    if (siteData?.grid_utility_context) {
      formData.append('grid_utility_context', siteData.grid_utility_context);
    }
    if (siteData?.local_load_summary) {
      formData.append('local_load_summary', siteData.local_load_summary);
    }
    if (selectedFile) {
      formData.append('site_evidence', selectedFile);
    }

    fetch('http://127.0.0.1:8001/api/projects/sites', {
      method: 'POST',
      body: formData
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json && json.data) {
          notifications.show({
            title: 'Draft Saved',
            message: `Site draft ${json.data.site_name} saved successfully with ID: ${json.data.id}`,
            color: 'green'
          });
          setSiteData(json.data);
          setSelectedFile(null);
          navigate(`/ginfina/projects/${targetProjId}/sites/${json.data.id}`);
        }
      })
      .catch((err) => {
        console.error('Failed to save draft:', err);
        notifications.show({
          title: 'Error',
          message: 'Failed to save site draft on server.',
          color: 'red'
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const authorisationStatus = siteData?.authorisation_status || 'Authorised';
  const displayLocationDetails = siteData?.location_details || 'Boregaina Village · Rigo District · Central Province';

  return (
    <Box style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} overlayProps={{ blur: 1 }} />

      {/* Header */}
      <Box mb="md">
        <Group justify="space-between" align="center">
          <Box>
            <Title order={1} fz={{ base: 22, sm: 26 }} fw={700} c="#111827">
              Site Engineering Context and Location
            </Title>
            <Text size="sm" c="#6b7280" mt={4}>
              Provide location, coordinates, access, utilities, load context, hazards and site evidence used as engineering inputs for one project site.
            </Text>
          </Box>
          <Button
            color="green"
            onClick={handleConfirmContext}
            className="gx1-desktop-only"
            style={{
              backgroundColor: '#007336',
              height: 38,
              borderRadius: 6
            }}
          >
            Confirm site engineering context
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
        <Grid.Col span={{ base: 12, md: 7.2, lg: 7.5 }}>
          <Paper 
            p="md" 
            style={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb', 
              borderRadius: 8,
              minHeight: 380
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
              <Grid.Col span={12}>
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Project selector *</Text>
                  <Select
                    placeholder="Select project..."
                    data={projectSelectData}
                    value={projectId || '1'}
                    onChange={(val) => {
                      if (val) {
                        navigate(`/ginfina/projects/${val}/sites/${siteId || '1'}`);
                      }
                    }}
                    styles={{
                      input: {
                        borderColor: '#d1d5db',
                        borderRadius: 6,
                        height: 38
                      }
                    }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>
                    Select · Security trimmed project selection
                  </Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={6}>
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Site name *</Text>
                  <TextInput
                    value={siteData?.site_name || 'Boregaina Village'}
                    onChange={(e) => setSiteData({ ...siteData, site_name: e.target.value })}
                    styles={{
                      input: {
                        borderColor: '#d1d5db',
                        borderRadius: 6,
                        height: 38
                      }
                    }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>
                    TextInput · Linked to project/site ID
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={6}>
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Latitude / longitude *</Text>
                  <TextInput
                    value={siteData?.latitude_longitude || '-9.4, 147.3'}
                    onChange={(e) => setSiteData({ ...siteData, latitude_longitude: e.target.value })}
                    styles={{
                      input: {
                        borderColor: '#d1d5db',
                        borderRadius: 6,
                        height: 38
                      }
                    }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>
                    TextInput · GPROPEL/site evidence
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={6} mt="xs">
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Grid / utility context *</Text>
                  <TextInput
                    value={siteData?.grid_utility_context || 'Mini-grid / isolated'}
                    onChange={(e) => setSiteData({ ...siteData, grid_utility_context: e.target.value })}
                    styles={{
                      input: {
                        borderColor: '#d1d5db',
                        borderRadius: 6,
                        height: 38
                      }
                    }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>
                    Select · Controlled architecture context
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={6} mt="xs">
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Local load summary *</Text>
                  <Textarea
                    value={siteData?.local_load_summary || 'Health centre + school + 25 households'}
                    onChange={(e) => setSiteData({ ...siteData, local_load_summary: e.target.value })}
                    rows={3}
                    styles={{
                      input: {
                        borderColor: '#d1d5db',
                        borderRadius: 6
                      }
                    }}
                  />
                  <Text size="11px" c="#9ca3af" mt={4}>
                    Textarea · Source referenced
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={6} mt="xs">
                <Box>
                  <Text size="xs" fw={600} c="#374151" mb={4}>Site evidence *</Text>
                  <Group align="center" gap="xs">
                    <Button
                      variant="default"
                      component="label"
                      style={{
                        borderColor: '#d1d5db',
                        color: '#374151',
                        borderRadius: 6,
                        height: 38,
                        fontWeight: 600
                      }}
                    >
                      Choose File
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedFile(e.target.files[0]);
                          }
                        }}
                      />
                    </Button>
                    <Text size="xs" c="#4b5563" style={{ wordBreak: 'break-all' }}>
                      {selectedFile ? selectedFile.name : (siteData?.site_evidence && siteData.site_evidence !== 'N/A' ? siteData.site_evidence.split('/').pop() : 'No file chosen')}
                    </Text>
                  </Group>
                  <Text size="11px" c="#9ca3af" mt={4}>
                    File Upload · Evidence reference required (uploads to server)
                  </Text>
                </Box>
              </Grid.Col>
            </Grid>

            {/* Action Buttons */}
            <Group mt="xl" gap="sm">
              <Button
                color="green"
                onClick={handleConfirmContext}
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
                Confirm site engineering context
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

        {/* Right Column: Site location and engineering context */}
        <Grid.Col span={{ base: 12, md: 4.8, lg: 4.5 }}>
          <Paper 
            p="md" 
            style={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb', 
              borderRadius: 8,
              minHeight: 380,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Title order={4} fw={700} fz={15} c="#111827" mb="md">
              Site location and engineering context
            </Title>

            {/* Real Google Map Embed - Satellite View */}
            <Box 
              style={{ 
                height: 320,
                backgroundColor: '#f4fbf6', 
                border: '1px solid #e5e7eb', 
                borderRadius: 8,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <iframe 
                title="Google Map Location"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapCoords)}&t=k&z=14&output=embed`}
                allowFullScreen
                loading="lazy"
              />
            </Box>

            {/* Location Description */}
            <Text size="xs" c="#6b7280" mt="md" fw={500}>
              {displayLocationDetails}
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
