import { createTheme } from '@mantine/core';

export const gx1Theme = createTheme({
  primaryColor: 'green',
  primaryShade: 7,
  fontFamily: 'Montserrat, Arial, Helvetica, sans-serif',
  headings: { fontFamily: 'Montserrat, Arial, Helvetica, sans-serif', fontWeight: '700' },
  defaultRadius: 'sm',
  colors: {
    green: ['#f4fbf6','#eaf5ef','#d9ede2','#b9dfc6','#8fcea5','#63bc83','#3dae62','#22a648','#12843f','#007336'],
  },
  other: {
    gx1: {
      green: '#22A648', greenDark: '#007336', greenSoft: '#EAF5EF', greenMid: '#D9EDE2',
      charcoal: '#333333', border: '#D9E0DC', bg: '#F7F9F8', ai: '#6D4AFF', warning: '#D97706', error: '#C62828'
    }
  },
  components: {
    Button: { defaultProps: { radius: 'sm' } },
    Paper: { defaultProps: { radius: 'md', withBorder: true } },
    TextInput: { defaultProps: { radius: 'sm' } },
    Select: { defaultProps: { radius: 'sm' } },
    MultiSelect: { defaultProps: { radius: 'sm' } },
    Textarea: { defaultProps: { radius: 'sm' } },
  },
});
