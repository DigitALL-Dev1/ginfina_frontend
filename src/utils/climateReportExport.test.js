import { expect, it } from 'vitest';
import { climateCsv, climatePdfReport } from './climateReportExport';

it('escapes CSV text and formulas while preserving zero and negative measurements', () => {
  const csv = climateCsv([{ parameter_name: 'Rain, "daily"\nvalue', parameter_value: 0, parameter_text: '=1+1' }, { parameter_value: -5 }]);
  expect(csv).toContain('"Rain, ""daily""\nvalue"');
  expect(csv).toContain('"\'=1+1"');
  expect(csv).toContain('"0"');
  expect(csv).toContain('"-5"');
});

it('includes site, summaries and all resource fields in the PDF model', () => {
  const report = climatePdfReport('site-1', [{ resource_type: 'RAIN', count: 1 }], [{ parameter_value: 0, remarks: 'Recorded' }]);
  expect(report.code).toBe('site-1');
  expect(report.sections).toHaveLength(3);
  expect(report.sections[2].fields).toContainEqual({ label: 'parameter value', value: '0' });
  expect(report.sections[2].fields).toContainEqual({ label: 'remarks', value: 'Recorded' });
});
