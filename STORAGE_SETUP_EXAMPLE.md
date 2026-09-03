# Storage Setup Example

This document provides examples of how to set EWO ID and EWP ID in browser storage for use with the Input Readiness module.

## Method 1: Using Browser Console (For Testing)

Open the browser's developer console (F12) and run:

```javascript
// Set in localStorage (persists across browser sessions)
localStorage.setItem('ewo_id', 'EWO-12345');
localStorage.setItem('ewp_id', 'EWP-67890');

// OR set in sessionStorage (cleared when browser tab is closed)
sessionStorage.setItem('ewo_id', 'EWO-12345');
sessionStorage.setItem('ewp_id', 'EWP-67890');

// Verify the values were set
console.log('EWO ID:', localStorage.getItem('ewo_id'));
console.log('EWP ID:', localStorage.getItem('ewp_id'));
```

## Method 2: Using the Storage Helper in Your Code

When a user selects or navigates to a work order in your application:

```javascript
import { setEwoId, setEwpId } from '../utils/storageHelper';

// Example: When user selects a work order from a list
const handleWorkOrderSelect = (workOrder) => {
  // Set in localStorage (default behavior)
  setEwoId(workOrder.ewo_id);
  setEwpId(workOrder.ewp_id);
  
  // Navigate to readiness page
  navigate('/input-readiness');
};

// Example: For session-based storage (clears on tab close)
const handleTemporaryWorkOrderSelect = (workOrder) => {
  // Set in sessionStorage
  setEwoId(workOrder.ewo_id, true);
  setEwpId(workOrder.ewp_id, true);
  
  navigate('/input-readiness');
};
```

## Method 3: Integrate with Your Work Order Selection Component

Example integration with a work order list component:

```javascript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { setEwoId, setEwpId } from '../utils/storageHelper';
import { Button, Card, Group, Text } from '@mantine/core';

const WorkOrderList = ({ workOrders }) => {
  const navigate = useNavigate();

  const handleViewReadiness = (workOrder) => {
    // Store IDs for use in readiness module
    setEwoId(workOrder.ewo_id);
    setEwpId(workOrder.ewp_id);
    
    // Navigate to input readiness page
    navigate('/input-readiness');
  };

  return (
    <div>
      {workOrders.map((wo) => (
        <Card key={wo.id} mb="md">
          <Group justify="space-between">
            <div>
              <Text fw={600}>{wo.title}</Text>
              <Text size="sm" c="dimmed">
                EWO: {wo.ewo_id} | EWP: {wo.ewp_id}
              </Text>
            </div>
            <Button onClick={() => handleViewReadiness(wo)}>
              View Readiness
            </Button>
          </Group>
        </Card>
      ))}
    </div>
  );
};

export default WorkOrderList;
```

## Method 4: URL Parameters (Alternative Approach)

If you prefer to pass IDs via URL and store them automatically:

```javascript
// In InputReadinessLayout.jsx, add this useEffect
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const ewoIdParam = params.get('ewo_id');
  const ewpIdParam = params.get('ewp_id');
  
  if (ewoIdParam) setEwoId(ewoIdParam);
  if (ewpIdParam) setEwpId(ewpIdParam);
}, []);

// Then navigate with URL params:
navigate(`/input-readiness?ewo_id=EWO-12345&ewp_id=EWP-67890`);
```

## Checking Current Storage Values

To check what values are currently stored:

```javascript
// Browser console
console.log('localStorage ewo_id:', localStorage.getItem('ewo_id'));
console.log('localStorage ewp_id:', localStorage.getItem('ewp_id'));
console.log('sessionStorage ewo_id:', sessionStorage.getItem('ewo_id'));
console.log('sessionStorage ewp_id:', sessionStorage.getItem('ewp_id'));

// Or in your React component
import { getEwoId, getEwpId } from '../utils/storageHelper';

console.log('Current EWO ID:', getEwoId());
console.log('Current EWP ID:', getEwpId());
```

## Clearing Storage Values

To clear the stored values:

```javascript
// Browser console
localStorage.removeItem('ewo_id');
localStorage.removeItem('ewp_id');
sessionStorage.removeItem('ewo_id');
sessionStorage.removeItem('ewp_id');

// Or using the storage helper
import { removeFromStorage } from '../utils/storageHelper';

removeFromStorage('ewo_id');
removeFromStorage('ewp_id');
```

## Important Notes

1. **localStorage** persists data even after the browser is closed and reopened
2. **sessionStorage** only persists data for the current browser tab/session
3. The readiness module checks localStorage first, then sessionStorage, then falls back to existing API data
4. Always set these values before navigating to the Input Readiness page
5. For production use, integrate the storage calls into your work order selection/navigation logic
