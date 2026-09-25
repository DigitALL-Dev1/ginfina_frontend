const display = value => value === null || value === undefined || value === '' ? 'Not provided' : String(value);

export function buildSiaCaseReport(project, siaCase, links, packs) {
  const fields = pairs => pairs.map(([label, value]) => ({ label, value: display(value) }));
  return {
    code: siaCase.case_code || siaCase.id,
    sections: [
      { title: 'Project details', fields: fields([
        ['Project name', project.project_name], ['Project code', project.project_code],
        ['Project ID', project.id], ['Project status', project.project_status], ['Gsolve project ID', project.gsolve_project_id],
      ]) },
      { title: 'SIA case details', fields: fields([
        ['Case code', siaCase.case_code], ['Case ID', siaCase.id], ['Assessment stage', siaCase.assessment_stage],
        ['Created at', siaCase.created_at], ['Owner user ID', siaCase.owner_user_id], ['CRM opportunity', siaCase.opportunity_id],
      ]) },
      { title: 'Assessment purpose', fields: fields([['Purpose', siaCase.assessment_purpose]]) },
    ],
    // Only confirmed links belong in the report, not unchecked or failed selections.
    packs: links.filter(link => link.sia_case_id === siaCase.id).map(link => {
      const pack = packs.find(p => p.id === link.assessment_pack_id);
      return { id: link.id, code: pack?.pack_code || link.assessment_pack_id, name: pack?.pack_name || 'Pack details unavailable',
        type: display(pack?.pack_type), applicable: link.is_applicable ? 'Yes' : 'No' };
    }),
  };
}

// A browser-rendered PDF keeps Unicode names and symbols without remote fonts.
// Each page is drawn separately, so long content is never sliced mid-line.
export async function downloadSiaReport(report, options = {}) {
  const { title = 'Start and Case Control Report', footer = 'SIA case setup summary', filename = 'SIA-Case-Report', reference = 'Case reference', header = 'GINFINA  /  SITE INTELLIGENCE & ASSESSMENT' } = options;
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title: `${title} - ${report.code}`, subject: title, creator: 'GINFINA' });
  const width = 794, height = 1123, margin = 54, bottom = 1042;
  const canvas = document.createElement('canvas');
  canvas.width = width * 2; canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create the report. Please try again.');
  ctx.scale(2, 2);
  let y = 0, page = 0;
  const font = (size, bold = false) => { ctx.font = `${bold ? '600' : '400'} ${size}px Arial, sans-serif`; };
  const startPage = () => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#007336'; font(13, true); ctx.fillText(header, margin, 48);
    ctx.fillStyle = '#111827'; font(26, true); ctx.fillText(title, margin, 89);
    ctx.strokeStyle = '#dce5df'; ctx.beginPath(); ctx.moveTo(margin, 111); ctx.lineTo(width - margin, 111); ctx.stroke();
    y = 143;
  };
  const endPage = () => {
    font(11); ctx.fillStyle = '#64748b'; ctx.fillText(footer, margin, height - 35);
    ctx.fillText(`Page ${++page}`, width - margin - 45, height - 35);
    if (page > 1) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, 210, 297);
  };
  const room = needed => { if (y + needed > bottom) { endPage(); startPage(); } };
  const lines = (text, size, bold = false) => {
    font(size, bold);
    const result = [];
    for (const paragraph of String(text).split(/\r?\n/)) {
      let line = '';
      for (const word of paragraph.split(/(\s+)/)) {
        if (ctx.measureText(line + word).width <= width - 2 * margin) { line += word; continue; }
        if (line.trim()) { result.push(line.trimEnd()); line = ''; }
        for (const char of word.trimStart()) {
          if (ctx.measureText(line + char).width > width - 2 * margin) { result.push(line); line = ''; }
          line += char;
        }
      }
      result.push(line.trimEnd());
    }
    return result;
  };
  const text = (value, size = 14, bold = false, color = '#111827') => {
    for (const line of lines(value, size, bold)) {
      room(size + 9); font(size, bold); ctx.fillStyle = color; ctx.fillText(line, margin, y); y += size + 7;
    }
  };
  const heading = (title, space = 120) => { room(space); y += 13; text(title, 17, true, '#007336'); y += 8; };
  const field = (label, value) => { room(54); text(label, 11, true, '#64748b'); text(value); y += 9; };
  startPage();
  field(reference, report.code);
  for (const section of report.sections) {
    heading(section.title);
    for (const entry of section.fields) field(entry.label, entry.value);
  }
  if (report.packs) {
    heading(`Linked assessment packs (${report.packs.length})`, 155);
    if (!report.packs.length) text('No linked assessment packs.');
  }
  for (const [index, pack] of (report.packs || []).entries()) {
    room(100); text(`${index + 1}. ${pack.code}`, 14, true); text(pack.name);
    text(`Type: ${pack.type}   |   Applicable: ${pack.applicable}`, 12); y += 15;
  }
  endPage();
  const safeCode = String(report.code || 'case').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  pdf.save(`${filename}-${safeCode}.pdf`);
}

export const downloadSiaCaseReport = report => downloadSiaReport(report);
