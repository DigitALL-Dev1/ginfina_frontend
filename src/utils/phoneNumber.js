import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js/max';

const names = new Intl.DisplayNames(['en'], { type: 'region' });
export const PHONE_COUNTRIES = getCountries().map(country => ({
  value: country, label: `+${getCountryCallingCode(country)} ${names.of(country)}`,
})).sort((a, b) => names.of(a.value).localeCompare(names.of(b.value)));

export function splitPhoneNumber(value = '') {
  const phone = parsePhoneNumberFromString(value, { extract: false });
  return phone ? { country: phone.country || null, national: phone.nationalNumber } : { country: null, national: value.replace(/\D/g, '') };
}

export function combinePhoneNumber(country, national) {
  if (!national) return '';
  if (!country) return national;
  const parsed = parsePhoneNumberFromString(national, { defaultCountry: country, extract: false });
  return parsed?.number || `+${getCountryCallingCode(country)}${national}`;
}

export function phoneNumberError(value, required = false) {
  if (!value) return required ? 'Enter a phone number.' : '';
  if (!/^\+[1-9]\d{1,14}$/.test(value)) return 'Select a country code and enter a valid phone number using digits only.';
  const parsed = parsePhoneNumberFromString(value, { extract: false });
  return parsed?.isValid() ? '' : 'Enter a valid phone number for the selected country code.';
}
