import { Checkbox, FileInput, MultiSelect, PasswordInput, PinInput, Radio, SegmentedControl, Select, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { getFieldOptions } from '../../constants/fieldOptions';
import DatePickerInput from './DatePickerInput';

const OPTIONS = ['Electrical','Structural','Civil','Mechanical','Boregaina','Kemabolo','GREEN Engineering','Consultant','Ready','In Review'];

export default function FieldControl({ row, value, onChange, fieldName }) {
  const [, label, type, required, example, validation] = row;
  const common = { label, description: validation, required: required === 'Yes', value: value ?? String(example ?? ''), onChange: (event) => onChange?.(event?.currentTarget ? event.currentTarget.value : event) };
  const t = String(type).toLowerCase();
  const labelLower = String(label).toLowerCase();
  
  // Auto-detect Type and Role fields and convert to dropdowns
  const isTypeOrRoleField = labelLower.includes('type') || labelLower.includes('role');
  const predefinedOptions = fieldName ? getFieldOptions(fieldName) : [];
  
  if (t.includes('password')) return <PasswordInput {...common}/>;
  if (t.includes('pin')) return <PinInput length={6} value={String(value ?? example ?? '')} onChange={onChange}/>;
  if (t.includes('textarea')) return <Textarea {...common} autosize minRows={3}/>;
  if (t.includes('multiselect') || t.includes('people multiselect')) return <MultiSelect label={label} description={validation} required={required==='Yes'} data={OPTIONS} value={Array.isArray(value)?value:[]} onChange={onChange} searchable clearable/>;
  if (t.includes('select') || t.includes('cascader') || t.includes('people select') || (isTypeOrRoleField && predefinedOptions.length > 0)) {
    // Use predefined options for Type/Role fields, otherwise use default OPTIONS
    const selectData = predefinedOptions.length > 0 ? predefinedOptions : OPTIONS;
    return <Select label={label} description={validation} required={required==='Yes'} data={selectData} value={value || (predefinedOptions.length > 0 ? predefinedOptions[0] : OPTIONS[0])} onChange={onChange} searchable clearable/>;
  }
  if (t.includes('segmented')) return <Stack gap={5}><Text size="sm" fw={500}>{label}</Text><SegmentedControl value={value || 'Current'} onChange={onChange} data={['Current','All','Exceptions']}/><Text size="xs" c="dimmed">{validation}</Text></Stack>;
  if (t.includes('radio')) return <Radio.Group label={label} description={validation} value={value || 'Approve'} onChange={onChange}><Stack gap="xs" mt="xs"><Radio value="Approve" label="Approve"/><Radio value="Revise" label="Revise"/><Radio value="Reject" label="Reject"/></Stack></Radio.Group>;
  if (t.includes('checkbox') || t.includes('checklist')) return <Checkbox label={label} description={validation} checked={Boolean(value)} onChange={(e)=>onChange?.(e.currentTarget.checked)}/>;
  if (t.includes('file') || t.includes('dropzone')) return <FileInput label={label} description={validation} placeholder={String(example || 'Choose controlled file')}/>;
  
  // Use DatePickerInput for date fields with DD-MMM-YYYY format
  if (t.includes('date')) {
    return <DatePickerInput 
      label={label} 
      value={value || null} 
      onChange={onChange} 
      required={required === 'Yes'}
      placeholder="DD-MMM-YYYY"
    />;
  }
  
  if (t.includes('read-only')) return <TextInput label={label} description={validation} value={String(example ?? 'System derived')} readOnly variant="filled"/>;
  if (t.includes('tabs')) return <SegmentedControl fullWidth value={value || 'Overview'} onChange={onChange} data={['Overview','Evidence','History']}/>;
  
  // Convert Type and Role fields to Select dropdowns even if not explicitly marked as select
  if (isTypeOrRoleField && predefinedOptions.length > 0) {
    return <Select label={label} description={validation} required={required==='Yes'} data={predefinedOptions} value={value || null} onChange={onChange} searchable clearable placeholder={`Select ${label}`}/>;
  }
  
  return <TextInput {...common}/>;
}
