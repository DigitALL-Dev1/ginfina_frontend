import { DateInput } from '@mantine/dates';
import { IconCalendar } from '@tabler/icons-react';
import { normalizeDateOnly } from '../../utils/dateOnly';

/** Shared calendar control. Emits YYYY-MM-DD, or an empty string when cleared. */
export default function DatePickerInput({
  value, onChange, minDate, maxDate, disabled, readOnly,
  clearable = true, styles, popoverProps, clearButtonProps, ...props
}) {
  return (
    <DateInput
      {...props}
      value={normalizeDateOnly(value) || null}
      onChange={date => onChange?.(normalizeDateOnly(date))}
      minDate={normalizeDateOnly(minDate) || undefined}
      maxDate={normalizeDateOnly(maxDate) || undefined}
      disabled={disabled}
      readOnly={readOnly}
      valueFormat="YYYY-MM-DD"
      dateParser={input => normalizeDateOnly(input) || null}
      placeholder="YYYY-MM-DD"
      leftSection={<IconCalendar size={16} />}
      leftSectionPointerEvents="none"
      clearable={clearable && !readOnly && !disabled}
      clearButtonProps={{ 'aria-label': 'Clear date', ...clearButtonProps }}
      popoverProps={{ position: 'bottom-start', shadow: 'md', ...popoverProps, withinPortal: true }}
      styles={(theme, params, context) => {
        const overrides = typeof styles === 'function' ? styles(theme, params, context) : styles || {};
        return {
          ...overrides,
          input: { borderColor: '#d1d5db', borderRadius: 6, ...overrides.input },
          label: { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, ...overrides.label },
        };
      }}
    />
  );
}
