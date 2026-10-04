import { describe, expect, it } from 'vitest';
import { featureGeoJson, sitePosition } from './gisMap';

describe('GIS map data conversion', () => {
  it('accepts numeric strings and coordinates on the equator and prime meridian', () => {
    expect(sitePosition({ latitude: '0', longitude: '0' })).toEqual({ lat: 0, lng: 0 });
    expect(sitePosition({ latitude: '-6.3', longitude: '143.9' })).toEqual({ lat: -6.3, lng: 143.9 });
  });
  it('rejects missing, blank, nonnumeric and out-of-range coordinates', () => {
    for (const latitude of [null, undefined, '', ' ', 'bad', 91, -91, Infinity]) {
      expect(sitePosition({ latitude, longitude: 143 })).toBeNull();
    }
    expect(sitePosition({ latitude: 0, longitude: 181 })).toBeNull();
  });
  it('wraps raw geometries and preserves GeoJSON features and collections', () => {
    const geometry = { type: 'Point', coordinates: [143, -6] };
    const feature = { type: 'Feature', properties: { name: 'Site' }, geometry };
    expect(featureGeoJson(JSON.stringify(geometry))).toEqual({ ...feature, properties: {} });
    expect(featureGeoJson(feature)).toBe(feature);
    const collection = { type: 'FeatureCollection', features: [feature] };
    expect(featureGeoJson(collection)).toBe(collection);
    expect(() => featureGeoJson('{bad')).toThrow();
  });
});
