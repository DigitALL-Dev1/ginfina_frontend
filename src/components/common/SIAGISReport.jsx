import { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader, Paper, Stack,
  Table, Text, Title,
} from '@mantine/core';
import {
  IconWorld, IconMapPin, IconDatabase, IconDownload,
  IconFileTypePdf, IconLayersIntersect,
} from '@tabler/icons-react';

const thS = {
  fontSize: 11,
  fontWeight: 700,
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

function SBadge({ v }) {
  const m = {
    verified: '#007336', active: '#007336',
    provisional: '#1971c2',
    assumed: '#f08c00', unverified: '#e03131'
  };
  const col = m[(v || '').toLowerCase()] || '#6b7280';
  return <Badge size="sm" radius="xl" style={{ backgroundColor: col + '18', color: col, border: 'none', fontWeight: 600 }}>{v || '—'}</Badge>;
}

function BoolBadge({ v, yes = 'Yes', no = 'No' }) {
  return <Badge size="sm" color={v ? 'green' : 'gray'} variant="light">{v ? yes : no}</Badge>;
}

export default function SIAGISReport({ api, siteId }) {
  const [loading, setLoading] = useState(true);
  const [layers, setLayers] = useState([]);
  const [features, setFeatures] = useState([]);
  const [geoSources, setGeoSources] = useState([]);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);

    Promise.all([
      fetch(`${api}/sia/sites/${siteId}/gis-layers`).then(r => r.json()),
      fetch(`${api}/sia/sites/${siteId}/external-geo-sources`).then(r => r.json()),
    ])
      .then(([layersData, sourcesData]) => {
        const layerList = Array.isArray(layersData) ? layersData : [];
        setLayers(layerList);
        setGeoSources(Array.isArray(sourcesData) ? sourcesData : []);
        
        // Fetch features for all layers
        const featurePromises = layerList.map(layer =>
          fetch(`${api}/sia/gis-layers/${layer.id}/features`).then(r => r.json())
        );
        
        return Promise.all(featurePromises);
      })
      .then((allFeatures) => {
        const flatFeatures = allFeatures.flat().filter(f => f && typeof f === 'object');
        setFeatures(flatFeatures);
      })
      .catch(() => {
        setLayers([]);
        setFeatures([]);
        setGeoSources([]);
      })
      .finally(() => setLoading(false));
  }, [api, siteId]);

  if (loading) {
    return (
      <Paper p="xl" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <Group justify="center">
          <Loader color="green" size="md" />
          <Text size="sm" c="dimmed">Loading GIS data...</Text>
        </Group>
      </Paper>
    );
  }

  const activeLayers = layers.filter(l => l.is_active !== false);
  const totalFeatures = features.length;
  const verifiedFeatures = features.filter(f => f.reliability_status === 'VERIFIED').length;
  const layersByType = layers.reduce((acc, layer) => {
    const type = layer.layer_type || 'OTHER';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return (
    <Box>
      {/* Header */}
      <Paper p="lg" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb' }}>
        <Group justify="space-between" wrap="wrap">
          <Box>
            <Group gap="xs" mb={4}>
              <IconWorld size={24} color="#007336" />
              <Title order={3} fw={700} c="#111827">GIS Mapping Report</Title>
            </Group>
            <Text size="sm" c="#6b7280">
              Site: <Text span fw={600} c="#007336" style={{ fontFamily: 'monospace' }}>{siteId}</Text>
            </Text>
          </Box>
          <Group gap="sm">
            <Button variant="light" color="green" leftSection={<IconDownload size={16} />} size="sm">
              Export CSV
            </Button>
            <Button variant="filled" color="green" leftSection={<IconFileTypePdf size={16} />} size="sm"
              style={{ backgroundColor: '#007336' }}>
              Generate PDF
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Summary Stats */}
      <Paper p="lg" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <Text size="sm" fw={700} c="#374151" mb="md">Summary</Text>
        <Group gap="xl" wrap="wrap">
          <Box>
            <Text size="xl" fw={700} c="#007336">{layers.length}</Text>
            <Text size="xs" c="#6b7280">Total Layers</Text>
          </Box>
          <Box>
            <Text size="xl" fw={700} c="#007336">{activeLayers.length}</Text>
            <Text size="xs" c="#6b7280">Active Layers</Text>
          </Box>
          <Box>
            <Text size="xl" fw={700} c="#007336">{totalFeatures}</Text>
            <Text size="xs" c="#6b7280">Total Features</Text>
          </Box>
          <Box>
            <Text size="xl" fw={700} c="#007336">{verifiedFeatures}</Text>
            <Text size="xs" c="#6b7280">Verified Features</Text>
          </Box>
          <Box>
            <Text size="xl" fw={700} c="#007336">{geoSources.length}</Text>
            <Text size="xs" c="#6b7280">Geo Sources</Text>
          </Box>
        </Group>
      </Paper>

      {/* Layers by Type */}
      {Object.keys(layersByType).length > 0 && (
        <Paper p="lg" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Text size="sm" fw={700} c="#374151" mb="md">Layers by Type</Text>
          <Group gap="md" wrap="wrap">
            {Object.entries(layersByType).map(([type, count]) => (
              <Paper key={type} p="sm" style={{ border: '1px solid #e5e7eb', borderRadius: 6, minWidth: 120 }}>
                <Text size="xs" c="#6b7280" mb={4}>{type}</Text>
                <Text size="lg" fw={700} c="#007336">{count}</Text>
              </Paper>
            ))}
          </Group>
        </Paper>
      )}

      {/* GIS Layers */}
      {layers.length > 0 && (
        <Paper p="lg" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Group gap="xs" mb="md">
            <IconLayersIntersect size={20} color="#007336" />
            <Text size="sm" fw={700} c="#374151">GIS Layers</Text>
            <Badge size="sm" color="green" variant="light">{layers.length}</Badge>
          </Group>
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
              <Table.Tr>
                <Table.Th style={thS}>Layer Name</Table.Th>
                <Table.Th style={thS}>Type</Table.Th>
                <Table.Th style={thS}>Geometry</Table.Th>
                <Table.Th style={thS}>CRS</Table.Th>
                <Table.Th style={thS}>Source</Table.Th>
                <Table.Th style={thS}>Reliability</Table.Th>
                <Table.Th style={thS}>Active</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {layers.map(layer => (
                <Table.Tr key={layer.id}>
                  <Table.Td><Text size="sm" fw={600}>{layer.layer_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{layer.layer_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{layer.geometry_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{layer.crs || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{layer.source_name || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={layer.reliability_status} /></Table.Td>
                  <Table.Td><BoolBadge v={layer.is_active !== false} /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      {/* Features */}
      {features.length > 0 && (
        <Paper p="lg" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Group gap="xs" mb="md">
            <IconMapPin size={20} color="#007336" />
            <Text size="sm" fw={700} c="#374151">GIS Features</Text>
            <Badge size="sm" color="green" variant="light">{features.length}</Badge>
          </Group>
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
              <Table.Tr>
                <Table.Th style={thS}>Feature Code</Table.Th>
                <Table.Th style={thS}>Feature Name</Table.Th>
                <Table.Th style={thS}>Type</Table.Th>
                <Table.Th style={thS}>Reliability</Table.Th>
                <Table.Th style={thS}>POI ID</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {features.slice(0, 50).map(feature => (
                <Table.Tr key={feature.id}>
                  <Table.Td><Text size="sm" fw={600} c="#007336">{feature.feature_code || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{feature.feature_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{feature.feature_type || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={feature.reliability_status} /></Table.Td>
                  <Table.Td><Text size="xs" c="#9ca3af" style={{ fontFamily: 'monospace' }}>{feature.poi_id || '—'}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          {features.length > 50 && (
            <Text size="xs" c="dimmed" mt="sm">
              Showing first 50 of {features.length} features
            </Text>
          )}
        </Paper>
      )}

      {/* External Geo Sources */}
      {geoSources.length > 0 && (
        <Paper p="lg" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Group gap="xs" mb="md">
            <IconDatabase size={20} color="#007336" />
            <Text size="sm" fw={700} c="#374151">External Geo Sources</Text>
            <Badge size="sm" color="green" variant="light">{geoSources.length}</Badge>
          </Group>
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
              <Table.Tr>
                <Table.Th style={thS}>Provider</Table.Th>
                <Table.Th style={thS}>Dataset</Table.Th>
                <Table.Th style={thS}>Type</Table.Th>
                <Table.Th style={thS}>Reference</Table.Th>
                <Table.Th style={thS}>Reliability</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {geoSources.map(source => (
                <Table.Tr key={source.id}>
                  <Table.Td><Text size="sm" fw={600}>{source.provider_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{source.dataset_name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{source.source_type || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="#6b7280">{source.source_reference || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={source.reliability_status} /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      {/* No Data Message */}
      {layers.length === 0 && features.length === 0 && geoSources.length === 0 && (
        <Paper p="xl" style={{ border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
          <IconWorld size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
          <Text size="sm" c="dimmed" mb={4}>No GIS data available for this site.</Text>
          <Text size="xs" c="dimmed">Add GIS layers and features to generate the report.</Text>
        </Paper>
      )}
    </Box>
  );
}
