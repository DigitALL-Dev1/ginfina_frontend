import fs from 'node:fs';
import { validateRegistry, dedicatedScreenIds } from './registry-validation.mjs';
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const specs = JSON.parse(read('../src/config/screenSpecs.json'));
const branches = JSON.parse(read('../src/config/branches.json'));
const nav = JSON.parse(read('../src/config/navigation.json'));
const dedicated = dedicatedScreenIds(read('../src/screens/GinfinaScreen.jsx'));
const errors = validateRegistry(specs, branches, nav, dedicated);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Coverage OK: ${specs.length} screens, ${branches.length} action branches.`);
