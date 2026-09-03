import { describe, expect, it } from 'vitest';
import screenSpecs from '../src/config/screenSpecs.json';
import branches from '../src/config/branches.json';
describe('GINFINA controlled UI registry',()=>{
 it('contains exactly 39 controlled screens',()=>expect(screenSpecs).toHaveLength(39));
 it('contains every GIN-UI-001 through GIN-UI-039',()=>{ const ids=new Set(screenSpecs.map((s)=>s.id)); for(let i=1;i<=39;i++) expect(ids.has(`GIN-UI-${String(i).padStart(3,'0')}`)).toBe(true); });
 it('gives every screen a primary action branch',()=>{ for(const screen of screenSpecs) expect(branches.some((b)=>b.screenId===screen.id&&b.kind==='primary')).toBe(true); });
});
