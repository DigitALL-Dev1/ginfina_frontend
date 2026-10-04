import { useEffect, useRef, useState } from 'react';
import { Box, Paper, Group, Select, Stack, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconZoomIn, IconZoomOut, IconCurrentLocation, IconStack2, IconMaximize } from '@tabler/icons-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { sitePosition, featureGeoJson, BASEMAPS } from '../utils/gisMap';

// Country overview includes the mainland and eastern islands of Papua New Guinea.
const DEFAULT_CENTER = { lat: -6.3, lng: 147 };
const DEFAULT_ZOOM = 6;
const EMPTY = [];
const API = import.meta.env.VITE_API_BASE_URL || '/api';

function popupContent(title, lines) {
  const element = document.createElement('div');
  const heading = document.createElement('strong');
  heading.textContent = title;
  element.append(heading);
  lines.forEach(line => {
    const row = document.createElement('div');
    row.textContent = line;
    element.append(row);
  });
  return element;
}

export default function GISMap({ site, layers = EMPTY, features = EMPTY, onFeatureClick }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const featureBounds = useRef(null);
  const poiBounds = useRef(null);
  const clickHandler = useRef(onFeatureClick);
  clickHandler.current = onFeatureClick;
  const [basemap, setBasemap] = useState('satellite');
  const [mapReady, setMapReady] = useState(false);
  const [zoomNotice, setZoomNotice] = useState('');
  const [poiNotice, setPoiNotice] = useState('');

  useEffect(() => {
    const instance = L.map(mapContainer.current, {
      center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, zoomControl: false, minZoom: 2, maxZoom: 20,
    });
    map.current = instance;
    L.control.scale({ position: 'bottomleft' }).addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize({ pan: false }));
    observer.observe(mapContainer.current);
    setMapReady(true);
    return () => { observer.disconnect(); instance.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!mapReady || !map.current) return;
    const instance = map.current;
    const config = BASEMAPS[basemap];
    const tiles = L.tileLayer(config.url, {
      attribution: config.attribution, maxNativeZoom: config.maxNativeZoom,
      minZoom: 2, maxZoom: 20,
    });
    const updateNotice = () => setZoomNotice(
      instance.getZoom() > config.maxNativeZoom
        ? 'Showing enlarged imagery; additional detail is not available at this zoom.' : ''
    );
    const tileError = () => setZoomNotice('Some map tiles could not load. Try OpenStreetMap or zoom out.');
    tiles.on('tileerror', tileError);
    tiles.addTo(instance);
    instance.on('zoomend', updateNotice);
    updateNotice();
    return () => {
      instance.off('zoomend', updateNotice);
      tiles.off('tileerror', tileError);
      tiles.remove();
    };
  }, [basemap, mapReady]);

  useEffect(() => {
    if (!mapReady || !map.current) return;
    const instance = map.current;
    const controller = new AbortController();
    const group = L.featureGroup().addTo(instance);
    poiBounds.current = null;
    instance.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    setPoiNotice(site?.id ? 'Loading site points of interest...' : '');
    if (site?.id) {
      fetch(`${API}/sia/sites/${encodeURIComponent(site.id)}/pois`, { signal: controller.signal })
        .then(async response => {
          if (!response.ok) throw new Error('Unable to load site points of interest.');
          const rows = await response.json();
          if (!Array.isArray(rows)) throw new Error('Invalid points of interest response.');
          return rows;
        })
        .then(rows => {
          if (controller.signal.aborted) return;
          rows.forEach(poi => {
            if (poi.site_id !== site.id) return;
            const position = sitePosition(poi);
            if (!position) return;
            L.circleMarker(position, {
              radius: 8, fillColor: '#007336', fillOpacity: 1, color: '#ffffff', weight: 2,
            }).bindPopup(popupContent(poi.poi_name || poi.poi_code || 'Point of interest', [
              `Code: ${poi.poi_code || '-'}`, `Type: ${poi.poi_type || '-'}`,
              `Lat: ${position.lat.toFixed(6)}`, `Lon: ${position.lng.toFixed(6)}`,
            ])).addTo(group);
          });
          const bounds = group.getBounds();
          if (bounds.isValid()) {
            poiBounds.current = bounds;
            instance.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            setPoiNotice('');
          } else setPoiNotice('No valid POI coordinates for this site. Showing Papua New Guinea.');
        })
        .catch(() => {
          if (!controller.signal.aborted) setPoiNotice('Unable to load site points of interest. Reselect the site to retry.');
        });
    }
    return () => {
      controller.abort();
      group.clearLayers();
      group.remove();
      poiBounds.current = null;
    };
  }, [mapReady, site?.id]);

  useEffect(() => {
    if (!mapReady || !map.current) return;
    const instance = map.current;
    const group = L.featureGroup().addTo(instance);
    features.forEach(record => {
      if (!record.geometry_data) return;
      try {
        L.geoJSON(featureGeoJson(record.geometry_data), {
          style: { color: '#007336', weight: 2, fillOpacity: 0.3 },
          pointToLayer: (_feature, latlng) => L.circleMarker(latlng, {
            radius: 6, fillColor: '#007336', color: '#ffffff', weight: 2, fillOpacity: 0.8,
          }),
          onEachFeature: (_feature, layer) => {
            layer.bindPopup(popupContent(record.feature_name || 'Feature', [
              `Code: ${record.feature_code || '-'}`, `Type: ${record.feature_type || '-'}`,
            ]));
            layer.on('click', () => clickHandler.current?.(record));
          },
        }).addTo(group);
      } catch { console.warn('Skipped invalid GIS geometry for feature', record.id); }
    });
    const bounds = group.getBounds();
    featureBounds.current = bounds.isValid() ? bounds : null;
    return () => { group.clearLayers(); group.remove(); featureBounds.current = null; };
  }, [features, mapReady]);

  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();
  const handleResetView = () => {
    const instance = map.current;
    if (!instance) return;
    if (poiBounds.current) instance.fitBounds(poiBounds.current, { padding: [50, 50], maxZoom: 15 });
    else if (featureBounds.current) instance.fitBounds(featureBounds.current, { padding: [50, 50], maxZoom: 16 });
    else instance.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  };
  const handleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await mapContainer.current?.parentElement?.requestFullscreen();
    } catch { setZoomNotice('Fullscreen is not available in this browser.'); }
  };

  return (
    <Box style={{ position: 'relative' }}>
      {/* Map Container */}
      <Paper 
        ref={mapContainer} 
        style={{ 
          height: '600px', 
          borderRadius: 8, 
          border: '1px solid #e5e7eb',
          position: 'relative',
          zIndex: 1
        }} 
      />

      {(!mapReady) && (
        <Paper role="status" p="lg" style={{ position: 'absolute', inset: 0, zIndex: 1100, display: 'grid', placeItems: 'center' }}>
          <Text c="dimmed">Loading map...</Text>
        </Paper>
      )}
      {(poiNotice || zoomNotice) && (
        <Paper p="xs" role="status" style={{ position: 'absolute', bottom: 65, left: 10, zIndex: 1000 }}>
          <Text size="xs">{poiNotice || zoomNotice}</Text>
        </Paper>
      )}
      {/* Map Controls */}
      <Paper 
        p="xs" 
        style={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #e5e7eb',
        }}
      >
        <Stack gap="xs">
          <Tooltip label="Zoom In" position="left">
            <ActionIcon variant="subtle" color="gray" disabled={!mapReady} onClick={handleZoomIn}>
              <IconZoomIn size={18} />
            </ActionIcon>
          </Tooltip>
          
          <Tooltip label="Zoom Out" position="left">
            <ActionIcon variant="subtle" color="gray" disabled={!mapReady} onClick={handleZoomOut}>
              <IconZoomOut size={18} />
            </ActionIcon>
          </Tooltip>
          
          <Tooltip label="Reset View" position="left">
            <ActionIcon variant="subtle" color="gray" disabled={!mapReady} onClick={handleResetView}>
              <IconCurrentLocation size={18} />
            </ActionIcon>
          </Tooltip>
          
          <Tooltip label="Fullscreen" position="left">
            <ActionIcon variant="subtle" color="gray" disabled={!mapReady} onClick={handleFullscreen}>
              <IconMaximize size={18} />
            </ActionIcon>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Basemap Selector */}
      <Paper 
        p="sm" 
        style={{ 
          position: 'absolute', 
          top: 10, 
          left: 10, 
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #e5e7eb',
          minWidth: 200,
        }}
      >
        <Stack gap="xs">
          <Group gap="xs">
            <IconStack2 size={16} color="#007336" />
            <Text size="xs" fw={600} c="#374151">Map Style</Text>
          </Group>
          <Select
            size="xs"
            disabled={!mapReady}
            value={basemap}
            onChange={value => value && setBasemap(value)}
            data={[
              { value: 'osm', label: 'OpenStreetMap' },
              { value: 'satellite', label: 'Satellite' },

            ]}
            styles={{
              input: { 
                borderColor: '#d1d5db', 
                fontSize: '12px',
                minHeight: 32,
              }
            }}
          />
        </Stack>
      </Paper>

      {/* Map Info */}
      <Paper 
        p="xs" 
        style={{ 
          position: 'absolute', 
          bottom: 32, 
          right: 10, 
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #e5e7eb',
        }}
      >
        <Group gap="md">
          <Text size="xs" c="#6b7280">
            <Text span fw={600} c="#374151">Layers:</Text> {layers.length}
          </Text>
          <Text size="xs" c="#6b7280">
            <Text span fw={600} c="#374151">Features:</Text> {features.length}
          </Text>
          {site && (
            <Text size="xs" c="#6b7280">
              <Text span fw={600} c="#374151">Site:</Text> {site.site_code || site.site_name}
            </Text>
          )}
        </Group>
      </Paper>
    </Box>
  );
}
