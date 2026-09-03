export const mockStatuses = ['Ready','In Review','Blocked','Approved','Draft','IFC'];
export const mockRows = Array.from({ length: 8 }, (_, index) => ({
  id: `REC-${String(index + 1).padStart(3,'0')}`,
  title: ['Electrical SLD','Cable Schedule','PV Layout','Earthing Layout','Structural GA','Civil Layout','EBOM','Protection Settings'][index],
  revision: `R${Math.max(0, 3 - Math.floor(index / 2))}`,
  owner: ['GREEN Engineering','Consultant','Engineering Manager','Procurement'][index % 4],
  status: mockStatuses[index % mockStatuses.length],
  due: `2026-08-${String(18 + index).padStart(2,'0')}`,
}));
export const metrics = [
  { label:'Open Engineering Packages', value:'24', note:'6 require attention' },
  { label:'Reviews Due', value:'11', note:'3 overdue' },
  { label:'IFC Ready', value:'6', note:'2 blocked by comments' },
  { label:'Procurement Releases', value:'5', note:'1 substitution pending' },
];
export const comments = [
  { id:'CMT-014', author:'Electrical Reviewer', status:'Open', body:'Verify DC isolator rating against inverter maximum input current.' },
  { id:'CMT-011', author:'Structural Reviewer', status:'Closed', body:'Mounting rail spacing aligned to approved structural calculation.' },
  { id:'CMT-017', author:'Engineering Manager', status:'P0', body:'Grid protection interface requires named approval before IFC.' },
];
export const timeline = [
  ['16 Aug 08:12','Revision R2 registered','Consultant uploaded native + PDF rendition'],
  ['16 Aug 09:04','Formal submission frozen','Manifest SUB-UNICEF-024 created'],
  ['16 Aug 10:20','Review started','Electrical and structural reviewers assigned'],
  ['16 Aug 12:35','P0 comment raised','Grid protection approval required'],
];
