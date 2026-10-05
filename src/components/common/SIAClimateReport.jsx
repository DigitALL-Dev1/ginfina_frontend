import { notifications } from '@mantine/notifications';
import { downloadSiaReport } from '../../utils/siaCaseReport';
import { climateCsv, climatePdfReport } from '../../utils/climateReportExport';
import { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, Loader, Paper, Stack,
  Table, Text, Title,
} from '@mantine/core';
import {
  IconCloudRain, IconTemperature, IconWind, IconDroplet,
  IconSun, IconDownload, IconFileTypePdf,
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
    measured: '#007336', verified: '#007336',
    provisional: '#1971c2',
    interpolated: '#f08c00', modeled: '#f08c00',
    assumed: '#e67700', unverified: '#e03131'
  };
  const col = m[(v || '').toLowerCase()] || '#6b7280';
  return <Badge size="sm" radius="xl" style={{ backgroundColor: col + '18', color: col, border: 'none', fontWeight: 600 }}>{v || '—'}</Badge>;
}

function ResourceIcon({ type }) {
  const t = (type || '').toUpperCase();
  if (t.includes('SOLAR') || t.includes('GHI') || t.includes('DNI') || t.includes('DHI')) return <IconSun size={20} color="#f59e0b" />;
  if (t.includes('TEMP')) return <IconTemperature size={20} color="#ef4444" />;
  if (t.includes('WIND')) return <IconWind size={20} color="#3b82f6" />;
  if (t.includes('RAIN') || t.includes('PRECIP') || t.includes('HUMID')) return <IconDroplet size={20} color="#06b6d4" />;
  return <IconCloudRain size={20} color="#6b7280" />;
}

export default function SIAClimateReport({ api, siteId }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [resources, setResources] = useState([]);

  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setSummary([]);
    setResources([]);
    if (!siteId) { setLoading(false); return; }
    const get = async path => {
      const response = await fetch(`${api}/sia/sites/${encodeURIComponent(siteId)}/${path}`, { signal: controller.signal });
      if (!response.ok) throw new Error('Unable to load climate report. Please retry.');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Invalid climate report response.');
      return data;
    };
    setLoading(true);

    Promise.all([
      get('climate-summary'),
      get('climate-resources'),
    ])
      .then(([summaryData, resourcesData]) => {
        if (controller.signal.aborted) return;
        setSummary(Array.isArray(summaryData) ? summaryData : []);
        setResources(Array.isArray(resourcesData) ? resourcesData : []);
      })
      .catch(reason => {
        if (controller.signal.aborted) return;
        setError(reason.message);
        setSummary([]);
        setResources([]);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [api, siteId, refresh]);

  const exportCsv = () => {
    try {
      const url = URL.createObjectURL(new Blob([climateCsv(resources)], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Climate-Report-${String(siteId).replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { notifications.show({ title: 'Export failed', message: 'Could not export CSV. Please retry.', color: 'red' }); }
  };
  const exportPdf = async () => {
    setDownloading(true);
    try {
      await downloadSiaReport(climatePdfReport(siteId, summary, resources), {
        title: 'Climate Data Report', filename: 'Climate-Report', reference: 'Site reference', footer: 'Saved climate resource data',
      });
    } catch { notifications.show({ title: 'Export failed', message: 'Could not generate PDF. Please retry.', color: 'red' }); }
    finally { setDownloading(false); }
  };

  if (!siteId) return <Text>Select a site to view its climate report.</Text>;
  if (error) return <Paper p="lg"><Text role="alert" c="red">{error}</Text><Button mt="sm" onClick={() => setRefresh(value => value + 1)}>Retry</Button></Paper>;

  if (loading) {
    return (
      <Paper p="xl" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <Group justify="center">
          <Loader color="green" size="md" />
          <Text size="sm" c="dimmed">Loading climate data...</Text>
        </Group>
      </Paper>
    );
  }

  // Group resources by type
  const byType = resources.reduce((acc, r) => {
    const type = r.resource_type || 'OTHER';
    if (!acc[type]) acc[type] = [];
    acc[type].push(r);
    return acc;
  }, {});

  const solarResources = Object.keys(byType).filter(t => 
    t.includes('SOLAR') || t.includes('GHI') || t.includes('DNI') || t.includes('DHI')
  ).flatMap(k => byType[k]);

  const tempResources = Object.keys(byType).filter(t => t.includes('TEMP')).flatMap(k => byType[k]);
  const windResources = Object.keys(byType).filter(t => t.includes('WIND')).flatMap(k => byType[k]);
  const precipResources = Object.keys(byType).filter(t => 
    t.includes('RAIN') || t.includes('PRECIP')
  ).flatMap(k => byType[k]);
  const humidityResources = Object.keys(byType).filter(t => t.includes('HUMID')).flatMap(k => byType[k]);
  const otherResources = Object.keys(byType).filter(t => 
    !t.includes('SOLAR') && !t.includes('GHI') && !t.includes('DNI') && 
    !t.includes('DHI') && !t.includes('TEMP') && !t.includes('WIND') &&
    !t.includes('RAIN') && !t.includes('PRECIP') && !t.includes('HUMID')
  ).flatMap(k => byType[k]);

  const totalResources = resources.length;
  const measuredCount = resources.filter(r => r.reliability_status === 'MEASURED').length;
  const verifiedCount = resources.filter(r => r.reliability_status === 'VERIFIED').length;

  return (
    <Box>
      {/* Header */}
      <Paper p="lg" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb' }}>
        <Group justify="space-between" wrap="wrap">
          <Box>
            <Group gap="xs" mb={4}>
              <IconCloudRain size={24} color="#007336" />
              <Title order={3} fw={700} c="#111827">Climate Data Report</Title>
            </Group>
            <Text size="sm" c="#6b7280">
              Site: <Text span fw={600} c="#007336" style={{ fontFamily: 'monospace' }}>{siteId}</Text>
            </Text>
          </Box>
          <Group gap="sm">
            <Button onClick={exportCsv} disabled={!resources.length || downloading} variant="light" color="green" leftSection={<IconDownload size={16} />} size="sm">
              Export CSV
            </Button>
            <Button onClick={exportPdf} loading={downloading} disabled={!resources.length} variant="filled" color="green" leftSection={<IconFileTypePdf size={16} />} size="sm"
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
            <Text size="xl" fw={700} c="#007336">{totalResources}</Text>
            <Text size="xs" c="#6b7280">Total Resources</Text>
          </Box>
          <Box>
            <Text size="xl" fw={700} c="#007336">{summary.length}</Text>
            <Text size="xs" c="#6b7280">Resource Types</Text>
          </Box>
          <Box>
            <Text size="xl" fw={700} c="#007336">{measuredCount}</Text>
            <Text size="xs" c="#6b7280">Measured</Text>
          </Box>
          <Box>
            <Text size="xl" fw={700} c="#007336">{verifiedCount}</Text>
            <Text size="xs" c="#6b7280">Verified</Text>
          </Box>
        </Group>
      </Paper>

      {/* Summary by Type */}
      {summary.length > 0 && (
        <Paper p="lg" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Text size="sm" fw={700} c="#374151" mb="md">Resources by Type</Text>
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
              <Table.Tr>
                <Table.Th style={thS}>Resource Type</Table.Th>
                <Table.Th style={thS}>Parameter Count</Table.Th>
                <Table.Th style={thS}>Last Updated</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {summary.map((s, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>
                    <Group gap="xs">
                      <ResourceIcon type={s.resource_type} />
                      <Text size="sm" fw={600}>{s.resource_type}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text size="sm" c="#007336" fw={600}>{s.parameter_count}</Text></Table.Td>
                  <Table.Td>
                    <Text size="sm" c="#6b7280">
                      {s.latest_updated ? new Date(s.latest_updated).toLocaleDateString() : '—'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      {/* Solar Resources */}
      {solarResources.length > 0 && (
        <Paper p="lg" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Group gap="xs" mb="md">
            <IconSun size={20} color="#f59e0b" />
            <Text size="sm" fw={700} c="#374151">Solar Resource Data</Text>
            <Badge size="sm" color="orange" variant="light">{solarResources.length}</Badge>
          </Group>
          <Table verticalSpacing="xs" horizontalSpacing="md" fontSize="xs">
            <Table.Thead style={{ backgroundColor: '#fef3c7' }}>
              <Table.Tr>
                <Table.Th style={thS}>Parameter</Table.Th>
                <Table.Th style={thS}>Value</Table.Th>
                <Table.Th style={thS}>Unit</Table.Th>
                <Table.Th style={thS}>Period</Table.Th>
                <Table.Th style={thS}>Source</Table.Th>
                <Table.Th style={thS}>Reliability</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {solarResources.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Text size="xs" fw={600}>{r.parameter_name}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#007336" fw={600}>
                    {r.parameter_value !== null && r.parameter_value !== undefined ? r.parameter_value : (r.parameter_text || '—')}
                  </Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.unit || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">
                    {r.period_from && r.period_to ? `${r.period_from} to ${r.period_to}` : (r.period_from || r.period_to || '—')}
                  </Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.source_name || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      {/* Temperature Resources */}
      {tempResources.length > 0 && (
        <Paper p="lg" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Group gap="xs" mb="md">
            <IconTemperature size={20} color="#ef4444" />
            <Text size="sm" fw={700} c="#374151">Temperature Data</Text>
            <Badge size="sm" color="red" variant="light">{tempResources.length}</Badge>
          </Group>
          <Table verticalSpacing="xs" horizontalSpacing="md" fontSize="xs">
            <Table.Thead style={{ backgroundColor: '#fee2e2' }}>
              <Table.Tr>
                <Table.Th style={thS}>Parameter</Table.Th>
                <Table.Th style={thS}>Value</Table.Th>
                <Table.Th style={thS}>Unit</Table.Th>
                <Table.Th style={thS}>Period</Table.Th>
                <Table.Th style={thS}>Source</Table.Th>
                <Table.Th style={thS}>Reliability</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tempResources.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Text size="xs" fw={600}>{r.parameter_name}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#007336" fw={600}>
                    {r.parameter_value !== null && r.parameter_value !== undefined ? r.parameter_value : (r.parameter_text || '—')}
                  </Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.unit || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">
                    {r.period_from && r.period_to ? `${r.period_from} to ${r.period_to}` : (r.period_from || r.period_to || '—')}
                  </Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.source_name || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      {/* Wind Resources */}
      {windResources.length > 0 && (
        <Paper p="lg" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Group gap="xs" mb="md">
            <IconWind size={20} color="#3b82f6" />
            <Text size="sm" fw={700} c="#374151">Wind Data</Text>
            <Badge size="sm" color="blue" variant="light">{windResources.length}</Badge>
          </Group>
          <Table verticalSpacing="xs" horizontalSpacing="md" fontSize="xs">
            <Table.Thead style={{ backgroundColor: '#dbeafe' }}>
              <Table.Tr>
                <Table.Th style={thS}>Parameter</Table.Th>
                <Table.Th style={thS}>Value</Table.Th>
                <Table.Th style={thS}>Unit</Table.Th>
                <Table.Th style={thS}>Height (m)</Table.Th>
                <Table.Th style={thS}>Source</Table.Th>
                <Table.Th style={thS}>Reliability</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {windResources.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Text size="xs" fw={600}>{r.parameter_name}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#007336" fw={600}>
                    {r.parameter_value !== null && r.parameter_value !== undefined ? r.parameter_value : (r.parameter_text || '—')}
                  </Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.unit || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.measurement_height || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.source_name || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      {/* Precipitation Resources */}
      {precipResources.length > 0 && (
        <Paper p="lg" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Group gap="xs" mb="md">
            <IconDroplet size={20} color="#06b6d4" />
            <Text size="sm" fw={700} c="#374151">Precipitation Data</Text>
            <Badge size="sm" color="cyan" variant="light">{precipResources.length}</Badge>
          </Group>
          <Table verticalSpacing="xs" horizontalSpacing="md" fontSize="xs">
            <Table.Thead style={{ backgroundColor: '#cffafe' }}>
              <Table.Tr>
                <Table.Th style={thS}>Parameter</Table.Th>
                <Table.Th style={thS}>Value</Table.Th>
                <Table.Th style={thS}>Unit</Table.Th>
                <Table.Th style={thS}>Period</Table.Th>
                <Table.Th style={thS}>Source</Table.Th>
                <Table.Th style={thS}>Reliability</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {precipResources.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Text size="xs" fw={600}>{r.parameter_name}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#007336" fw={600}>
                    {r.parameter_value !== null && r.parameter_value !== undefined ? r.parameter_value : (r.parameter_text || '—')}
                  </Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.unit || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">
                    {r.period_from && r.period_to ? `${r.period_from} to ${r.period_to}` : (r.period_from || r.period_to || '—')}
                  </Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.source_name || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      {/* Humidity Resources */}
      {humidityResources.length > 0 && (
        <Paper p="lg" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Group gap="xs" mb="md">
            <IconDroplet size={20} color="#8b5cf6" />
            <Text size="sm" fw={700} c="#374151">Humidity Data</Text>
            <Badge size="sm" color="violet" variant="light">{humidityResources.length}</Badge>
          </Group>
          <Table verticalSpacing="xs" horizontalSpacing="md" fontSize="xs">
            <Table.Thead style={{ backgroundColor: '#ede9fe' }}>
              <Table.Tr>
                <Table.Th style={thS}>Parameter</Table.Th>
                <Table.Th style={thS}>Value</Table.Th>
                <Table.Th style={thS}>Unit</Table.Th>
                <Table.Th style={thS}>Period</Table.Th>
                <Table.Th style={thS}>Source</Table.Th>
                <Table.Th style={thS}>Reliability</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {humidityResources.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Text size="xs" fw={600}>{r.parameter_name}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#007336" fw={600}>
                    {r.parameter_value !== null && r.parameter_value !== undefined ? r.parameter_value : (r.parameter_text || '—')}
                  </Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.unit || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">
                    {r.period_from && r.period_to ? `${r.period_from} to ${r.period_to}` : (r.period_from || r.period_to || '—')}
                  </Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.source_name || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      {/* Other Resources */}
      {otherResources.length > 0 && (
        <Paper p="lg" mb="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <Group gap="xs" mb="md">
            <IconCloudRain size={20} color="#6b7280" />
            <Text size="sm" fw={700} c="#374151">Other Climate Data</Text>
            <Badge size="sm" color="gray" variant="light">{otherResources.length}</Badge>
          </Group>
          <Table verticalSpacing="xs" horizontalSpacing="md" fontSize="xs">
            <Table.Thead style={{ backgroundColor: '#f3f4f6' }}>
              <Table.Tr>
                <Table.Th style={thS}>Type</Table.Th>
                <Table.Th style={thS}>Parameter</Table.Th>
                <Table.Th style={thS}>Value</Table.Th>
                <Table.Th style={thS}>Unit</Table.Th>
                <Table.Th style={thS}>Source</Table.Th>
                <Table.Th style={thS}>Reliability</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {otherResources.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Text size="xs" fw={600}>{r.resource_type}</Text></Table.Td>
                  <Table.Td><Text size="xs">{r.parameter_name}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#007336" fw={600}>
                    {r.parameter_value !== null && r.parameter_value !== undefined ? r.parameter_value : (r.parameter_text || '—')}
                  </Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.unit || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs" c="#6b7280">{r.source_name || '—'}</Text></Table.Td>
                  <Table.Td><SBadge v={r.reliability_status} /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      {/* No Data Message */}
      {resources.length === 0 && (
        <Paper p="xl" style={{ border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
          <IconCloudRain size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
          <Text size="sm" c="dimmed" mb={4}>No climate data available for this site.</Text>
          <Text size="xs" c="dimmed">Add climate resources to generate the report.</Text>
        </Paper>
      )}
    </Box>
  );
}
