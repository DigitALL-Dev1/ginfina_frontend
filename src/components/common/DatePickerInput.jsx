import { DateInput } from '@mantine/dates';
import { Box, Text } from '@mantine/core';

/**
 * DatePickerInput Component
 * Standardized date picker with DD-MMM-YYYY format
 * 
 * @param {string} label - Field label
 * @param {Date|string} value - Date value (Date object or ISO string)
 * @param {Function} onChange - Change handler, receives Date object
 * @param {boolean} required - Whether field is required
 * @param {boolean} clearable - Whether field can be cleared
 * @param {Date} minDate - Minimum selectable date
 * @param {Date} maxDate - Maximum selectable date
 * @param {boolean} disabled - Whether field is disabled
 * @param {string} placeholder - Custom placeholder text
 */
export default function DatePickerInput({ 
  label, 
  value, 
  onChange, 
  required = false,
  clearable = true,
  minDate,
  maxDate,
  disabled = false,
  placeholder = 'Select date'
}) {
  
  // Convert string to Date if needed
  const dateValue = value ? (typeof value === 'string' ? new Date(value) : value) : null;
  
  // Format date as DD-MMM-YYYY
  const formatDate = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  // Parse DD-MMM-YYYY format back to Date
  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    // Handle DD-MMM-YYYY format
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const year = parseInt(parts[2]);
      
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const month = monthMap[monthStr];
      if (month !== undefined) {
        return new Date(year, month, day);
      }
    }
    
    // Fallback to default parsing
    return new Date(dateString);
  };

  return (
    <Box>
      {label && (
        <Text size="xs" fw={600} c="#374151" mb={4}>
          {label}
          {required && <Text span c="red"> *</Text>}
        </Text>
      )}
      <DateInput
        value={dateValue}
        onChange={onChange}
        valueFormat="DD-MMM-YYYY"
        placeholder={placeholder}
        clearable={clearable}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        styles={{
          input: {
            borderColor: '#d1d5db',
            borderRadius: 6,
            height: 38,
            backgroundColor: disabled ? '#f9fafb' : '#ffffff',
          },
        }}
      />
    </Box>
  );
}

/**
 * Utility function to format date as DD-MMM-YYYY string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateDisplay(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Utility function to parse DD-MMM-YYYY string to Date
 * @param {string} dateString - Date string in DD-MMM-YYYY format
 * @returns {Date|null} Parsed date or null
 */
export function parseDateString(dateString) {
  if (!dateString) return null;
  
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const monthStr = parts[1];
    const year = parseInt(parts[2]);
    
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const month = monthMap[monthStr];
    if (month !== undefined && day >= 1 && day <= 31) {
      return new Date(year, month, day);
    }
  }
  
  // Fallback: try to parse as ISO string
  const fallbackDate = new Date(dateString);
  return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
}
