import { Checkbox, FileInput, MultiSelect, PasswordInput, PinInput, Radio, SegmentedControl, Select, Stack, Text, TextInput, Textarea } from '@mantine/core';
const OPTIONS = ['Electrical','Structural','Civil','Mechanical','Boregaina','Kemabolo','GREEN Engineering','Consultant','Ready','In Review'];
export default function FieldControl({ row, value, onChange }) {
  const [, label, type, required, example, validation] = row;
  const common = { label, description: validation, required: required === 'Yes', value: value ?? String(example ?? ''), onChange: (event) => onChange?.(event?.currentTarget ? event.currentTarget.value : event) };
  const t = String(type).toLowerCase();
  if (t.includes('password')) return <PasswordInput {...common}/>;
  if (t.includes('pin')) return <PinInput length={6} value={String(value ?? example ?? '')} onChange={onChange}/>;
  if (t.includes('textarea')) return <Textarea {...common} autosize minRows={3}/>;
  if (t.includes('multiselect') || t.includes('people multiselect')) return <MultiSelect label={label} description={validation} required={required==='Yes'} data={OPTIONS} value={Array.isArray(value)?value:[]} onChange={onChange} searchable clearable/>;
  if (t.includes('select') || t.includes('cascader') || t.includes('people select')) return <Select label={label} description={validation} required={required==='Yes'} data={OPTIONS} value={value || OPTIONS[0]} onChange={onChange} searchable clearable/>;
  if (t.includes('segmented')) return <Stack gap={5}><Text size="sm" fw={500}>{label}</Text><SegmentedControl value={value || 'Current'} onChange={onChange} data={['Current','All','Exceptions']}/><Text size="xs" c="dimmed">{validation}</Text></Stack>;
  if (t.includes('radio')) return <Radio.Group label={label} description={validation} value={value || 'Approve'} onChange={onChange}><Stack gap="xs" mt="xs"><Radio value="Approve" label="Approve"/><Radio value="Revise" label="Revise"/><Radio value="Reject" label="Reject"/></Stack></Radio.Group>;
  if (t.includes('checkbox') || t.includes('checklist')) return <Checkbox label={label} description={validation} checked={Boolean(value)} onChange={(e)=>onChange?.(e.currentTarget.checked)}/>;
  if (t.includes('file') || t.includes('dropzone')) return <FileInput label={label} description={validation} placeholder={String(example || 'Choose controlled file')}/>;
  if (t.includes('date')) return <TextInput {...common} type="date" value={/^\d{4}-/.test(String(value ?? example ?? '')) ? String(value ?? example) : '2026-08-16'}/>;
  if (t.includes('read-only')) return <TextInput label={label} description={validation} value={String(example ?? 'System derived')} readOnly variant="filled"/>;
  if (t.includes('tabs')) return <SegmentedControl fullWidth value={value || 'Overview'} onChange={onChange} data={['Overview','Evidence','History']}/>;
  return <TextInput {...common}/>;
}
