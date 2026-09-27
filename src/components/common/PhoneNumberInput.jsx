import { useEffect, useRef, useState } from 'react';
import { Box, Select, Text, TextInput } from '@mantine/core';
import { PHONE_COUNTRIES, combinePhoneNumber, phoneNumberError, splitPhoneNumber } from '../../utils/phoneNumber';
import styles from './PhoneNumberInput.module.css';

export default function PhoneNumberInput({ label = 'Phone number', value = '', onChange, required = false, disabled, readOnly, description }) {
  const initial = splitPhoneNumber(value || '');
  const [country, setCountry] = useState(initial.country);
  const [national, setNational] = useState(initial.national);
  const [touched, setTouched] = useState(false);
  const [inputError, setInputError] = useState('');
  const lastEmitted = useRef(value);
  useEffect(() => {
    if (value === lastEmitted.current) return;
    const next = splitPhoneNumber(value || '');
    setCountry(next.country); setNational(next.national); setTouched(false); setInputError('');
    lastEmitted.current = value;
  }, [value]);
  const update = (nextCountry, nextNational) => {
    setCountry(nextCountry); setNational(nextNational); setInputError('');
    const next = combinePhoneNumber(nextCountry, nextNational);
    lastEmitted.current = next; onChange?.(next);
  };
  const paste = event => {
    event.preventDefault();
    const text = event.clipboardData.getData('text').trim();
    if (!/^\+?[\d\s().-]+$/.test(text)) { setInputError('Use digits only for the phone number.'); return; }
    const digits = text.replace(/\D/g, '');
    if (digits.length > 15) { setInputError('Phone numbers cannot exceed 15 digits.'); return; }
    if (text.startsWith('+')) {
      const next = splitPhoneNumber(`+${digits}`);
      if (!next.country) { setInputError('Select a valid country code.'); return; }
      update(next.country, next.national);
    } else update(country, digits);
  };
  return <Box className={styles.root}>
    <Box className={styles.inputs}>
      <Select label="Country code" aria-label={`${label} country code`} data={PHONE_COUNTRIES} value={country}
        onChange={next => update(next, national)} searchable clearable placeholder="Select code"
        disabled={disabled} readOnly={readOnly} required={required || !!national} comboboxProps={{ width: 300, position: 'bottom-start' }} classNames={{ dropdown: styles.dropdown }} />
      <TextInput label={label} type="tel" inputMode="numeric" autoComplete="tel-national" value={national}
        placeholder="Phone number" required={required} disabled={disabled} readOnly={readOnly} maxLength={15}
        onBlur={() => setTouched(true)} onPaste={paste}
        error={inputError || (touched ? phoneNumberError(value, required) : '')}
        onChange={event => {
          const digits = event.currentTarget.value;
          if (!/^\d*$/.test(digits)) { setInputError('Use digits only for the phone number.'); return; }
          update(country, digits);
        }} />
    </Box>
    {description && <Text size="xs" c="dimmed" mt={4}>{description}</Text>}
  </Box>;
}
