export function sitePosition(site) {
  if (site?.latitude == null || site?.longitude == null ||
      String(site.latitude).trim() === '' || String(site.longitude).trim() === '') return null;
  const lat = Number(site.latitude);
  const lng = Number(site.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? { lat, lng } : null;
}

export function featureGeoJson(value) {
  const json = typeof value === 'string' ? JSON.parse(value) : value;
  if (!json || typeof json !== 'object') throw new Error('Missing geometry');
  return json.type === 'Feature' || json.type === 'FeatureCollection'
    ? json : { type: 'Feature', properties: {}, geometry: json };
}

// Conservative satellite tile ceiling: enlarge level 16 instead of requesting
// high-zoom tiles that can contain Esri's "Map data not yet available" image.
export const BASEMAPS = {
  osm: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxNativeZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxNativeZoom: 16,
  },
};
