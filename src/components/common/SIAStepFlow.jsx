import { Box, Group, Text } from '@mantine/core';

/**
 * SIAStepFlow — renders a visual step-pipeline navigator for SIA module tabs.
 *
 * Props:
 *  steps:     [{ value, label, icon, enabled }]
 *  activeTab: current tab value string
 *  onStep:    (value) => void  — called when a step is clicked
 */
export default function SIAStepFlow({ steps, activeTab, onStep }) {
  const activeIdx = steps.findIndex(s => s.value === activeTab);

  return (
    <Box mb="lg" style={{ overflowX: 'auto' }}>
      <Group gap={0} wrap="nowrap" style={{ minWidth: 'max-content' }}>
        {steps.map((step, idx) => {
          const isActive  = activeTab === step.value;
          const isDone    = idx < activeIdx;
          const bgColor   = isActive ? '#007336' : isDone ? '#bbf7d0' : step.enabled ? '#f3f4f6' : '#f9fafb';
          const textColor = isActive ? '#fff'    : isDone ? '#007336' : step.enabled ? '#374151' : '#9ca3af';
          const border    = isActive ? '#007336' : isDone ? '#86efac' : '#e5e7eb';

          return (
            <Group key={step.value} gap={0} wrap="nowrap" align="center">
              {/* Step pill */}
              <Box
                onClick={() => step.enabled && onStep(step.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 24,
                  backgroundColor: bgColor, border: `1.5px solid ${border}`,
                  cursor: step.enabled ? 'pointer' : 'not-allowed',
                  opacity: step.enabled ? 1 : 0.4,
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                <Box style={{ color: textColor, display: 'flex', alignItems: 'center' }}>
                  {step.icon}
                </Box>
                <Text size="xs" fw={isActive ? 700 : 500} style={{ color: textColor }}>
                  {step.label}
                </Text>
              </Box>
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <Box style={{
                  width: 18, height: 2, flexShrink: 0,
                  backgroundColor: isDone ? '#86efac' : '#e5e7eb',
                }} />
              )}
            </Group>
          );
        })}
      </Group>
    </Box>
  );
}
