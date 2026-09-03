import fs from 'node:fs';
const specs=JSON.parse(fs.readFileSync(new URL('../src/config/screenSpecs.json',import.meta.url)));
const branches=JSON.parse(fs.readFileSync(new URL('../src/config/branches.json',import.meta.url)));
const nav=JSON.parse(fs.readFileSync(new URL('../src/config/navigation.json',import.meta.url)));
const errors=[];
if(specs.length!==39) errors.push(`Expected 39 screens, found ${specs.length}`);
const ids=new Set(specs.map((s)=>s.id));
if(ids.size!==39) errors.push('Duplicate screen IDs detected');
for(let i=1;i<=39;i++){ const id=`GIN-UI-${String(i).padStart(3,'0')}`; if(!ids.has(id)) errors.push(`Missing ${id}`); }
const navIds=new Set(Object.values(nav).flat());
for(const id of ids){ if(id!=='GIN-UI-001'&&!navIds.has(id)) errors.push(`Navigation missing ${id}`); }
for(const s of specs){ const bs=branches.filter((b)=>b.screenId===s.id); if(!bs.some((b)=>b.kind==='primary')) errors.push(`Primary action branch missing ${s.id}`); }
const keys=new Set(); for(const b of branches){ const k=`${b.screenId}:${b.key}`; if(keys.has(k)) errors.push(`Duplicate branch ${k}`); keys.add(k); }
if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log(`Coverage OK: ${specs.length} screens, ${branches.length} action branches, ${navIds.size} nav-routed screens.`);
