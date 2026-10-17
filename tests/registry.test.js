import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import screenSpecs from '../src/config/screenSpecs.json';
import branches from '../src/config/branches.json';
import navigation from '../src/config/navigation.json';
import { validateRegistry, dedicatedScreenIds } from '../scripts/registry-validation.mjs';
const source = fs.readFileSync(new URL('../src/screens/GinfinaScreen.jsx', import.meta.url), 'utf8');
const dedicated = dedicatedScreenIds(source);
const validate = (specs = screenSpecs, nav = navigation, actions = branches) => validateRegistry(specs, actions, nav, dedicated);

describe('GINFINA controlled UI registry', () => {
  it('validates original and dedicated module screens against nested navigation', () => expect(validate()).toEqual([]));
  it('rejects duplicate screen IDs and routes', () => {
    expect(validate([...screenSpecs, screenSpecs[0]])).toContain(`Duplicate screen ID ${screenSpecs[0].id}`);
    expect(validate([...screenSpecs, screenSpecs[0]])).toContain(`Duplicate screen route ${screenSpecs[0].route}`);
  });
  it('rejects broken nested navigation routes', () => {
    expect(validate(screenSpecs, { group: { sections: [{ items: [{ route: '/ginfina/missing' }] }] } })).toContain('Unknown navigation route /ginfina/missing');
  });
  it('still requires primary branches for generic screens', () => {
    expect(validate(screenSpecs, navigation, branches.filter(b => b.screenId !== 'GIN-UI-001'))).toContain('Primary action branch missing GIN-UI-001');
  });
});
