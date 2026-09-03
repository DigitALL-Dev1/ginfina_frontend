import { Badge } from '@mantine/core';
export default function StatusBadge({ status }) {
  const value = String(status || 'Unknown');
  const lower = value.toLowerCase();
  const color = lower.includes('approved') || lower.includes('ready') || lower.includes('ifc') || lower.includes('closed') ? 'green'
    : lower.includes('blocked') || lower.includes('p0') || lower.includes('reject') ? 'red'
    : lower.includes('review') || lower.includes('draft') ? 'orange' : 'blue';
  return <Badge color={color} variant="light" size="sm">{value}</Badge>;
}
