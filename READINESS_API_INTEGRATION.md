# Readiness API Integration Documentation

## Overview
This document describes the integration of the Readiness API into the Input Readiness Module Overview page.

## API Endpoint
- **Base URL**: `http://127.0.0.1:8001/api`
- **Endpoint**: `/readiness`
- **Method**: GET, POST, PATCH

## Implementation Details

### Files Created/Modified

#### 1. `src/services/readinessService.js` (NEW)
A dedicated service file for all readiness-related API calls:

**Functions:**
- `getReadinessRecords()` - Fetch all readiness records
- `getReadinessRecordById(id)` - Fetch a single record by ID
- `createReadinessRecord(data)` - Create a new readiness record
- `updateReadinessRecord(id, data)` - Update an existing record
- `authorizeDesignStart(id)` - Authorize design start for a record

#### 2. `src/utils/storageHelper.js` (NEW)
A utility helper for managing localStorage and sessionStorage operations:

**Functions:**
- `getFromStorage(key, defaultValue)` - Get value from storage (localStorage first, then sessionStorage)
- `setInLocalStorage(key, value)` - Set value in localStorage
- `setInSessionStorage(key, value)` - Set value in sessionStorage
- `removeFromStorage(key)` - Remove value from both storages
- `getEwoId(fallback)` - Get EWO ID from storage
- `getEwpId(fallback)` - Get EWP ID from storage
- `setEwoId(value, useSession)` - Set EWO ID in storage
- `setEwpId(value, useSession)` - Set EWP ID in storage

#### 3. `src/layouts/InputReadinessLayout.jsx` (MODIFIED)
Updated to integrate with the readiness API:

**Key Changes:**
- Added `useEffect` hook to fetch data on component mount
- Integrated API calls for fetching, updating, and authorizing readiness records
- Added loading states and error handling
- Dynamic status badge based on API response
- **Removed EWO ID and EWP ID fields from UI form**
- **EWO ID and EWP ID are now retrieved from browser storage (localStorage/sessionStorage)**
- Real-time data display from API including:
  - Readiness profile
  - Checklist summary
  - Override reason and expiry
  - Created/updated timestamps
  - Submitted by user

**New Features:**
- Loading spinner while fetching data
- Error alerts for failed API calls
- Save draft functionality with API integration
- Authorize design start with API integration
- Auto-refresh after updates
- Disabled state for buttons when no data is available
- Storage-based EWO/EWP ID retrieval

## API Response Structure

### Success Response (201)
```json
{
  "data": {
    "id": "readiness-ec2c07af-6f1c-4315-8e47-ba6df07b7051",
    "ewo_id": "string",
    "ewp_id": "string",
    "readiness_profile": "string",
    "critical_input_checklist": [
      {
        "id": "string",
        "label": "string",
        "confirmed": false,
        "system_generated": true
      }
    ],
    "checklist_confirmed_count": 0,
    "checklist_total_count": 0,
    "checklist_summary": "0 of 0 confirmed",
    "override_reason": "string",
    "override_expiry": "string",
    "status": "Draft",
    "submitted_by": "user-4",
    "created_at": "2026-08-24T15:31:52.991827",
    "updated_at": "2026-08-24T15:31:52.991827"
  },
  "status_code": 201,
  "message": "Readiness record created successfully"
}
```

## Usage

### Setting EWO ID and EWP ID in Storage

Before using the readiness module, you need to set the EWO ID and EWP ID in storage:

```javascript
// In your application (e.g., when user selects a work order)
import { setEwoId, setEwpId } from './utils/storageHelper';

// Set in localStorage (persists across sessions)
setEwoId('EWO-12345');
setEwpId('EWP-67890');

// Or set in sessionStorage (persists only during current session)
setEwoId('EWO-12345', true);
setEwpId('EWP-67890', true);
```

### Fetching Readiness Data
The component automatically fetches readiness records when it mounts:
```javascript
useEffect(() => {
  fetchReadinessData();
}, []);
```

### Updating a Record (Save Draft)
The EWO ID and EWP ID are retrieved from storage and included in the update:
```javascript
const handleSaveDraft = async () => {
  // Get from storage with fallback to existing data
  const ewoId = getEwoId(readinessData.ewo_id);
  const ewpId = getEwpId(readinessData.ewp_id);
  
  const updatedData = {
    ewo_id: ewoId,
    ewp_id: ewpId,
    override_reason: overrideReason,
    override_expiry: overrideExpiry,
    status: 'Draft',
  };
  await updateReadinessRecord(readinessData.id, updatedData);
};
```

### Authorizing Design Start
```javascript
const handleAuthorize = async () => {
  // Get from storage with fallback to existing data
  const ewoId = getEwoId(readinessData.ewo_id);
  const ewpId = getEwpId(readinessData.ewp_id);
  
  const updatedData = {
    ewo_id: ewoId,
    ewp_id: ewpId,
    override_reason: overrideReason,
    override_expiry: overrideExpiry,
    status: 'Authorised',
  };
  await updateReadinessRecord(readinessData.id, updatedData);
};
```

## Storage Strategy

The application uses a hierarchical storage lookup strategy:

1. **First**: Check `localStorage` for the value
2. **Second**: Check `sessionStorage` for the value
3. **Fallback**: Use the value from the API response (if available)

This ensures that:
- User context (EWO/EWP IDs) persists across page refreshes
- Values can be session-specific or persistent based on needs
- The system gracefully handles missing storage values

## Error Handling

The integration includes comprehensive error handling:
1. **Network Errors**: Caught and displayed via notifications
2. **Loading States**: Loading spinner shown while fetching data
3. **No Data**: Alert message displayed when no records exist
4. **Failed Updates**: Error notifications with detailed messages

## Environment Configuration

The API base URL is configured in `.env`:
```
VITE_API_BASE_URL=http://127.0.0.1:8001/api
```

## Demo Mode

The application supports a demo mode (configured via `VITE_DEMO_MODE` in `.env`):
- When `VITE_DEMO_MODE=true`: Mock responses are returned
- When `VITE_DEMO_MODE=false`: Real API calls are made

## UI/UX Enhancements

1. **Dynamic Status Badge**: 
   - Green for "Authorised" status
   - Yellow/Amber for "Draft" status

2. **Validation**:
   - "Authorise design start" button is disabled if override reason or expiry is empty

3. **Real-time Updates**:
   - Data refreshes automatically after save/authorize actions

4. **Timestamps Display**:
   - Created at
   - Last updated at
   - Submitted by user

## Testing

To test the integration:

1. Ensure the backend API is running at `http://127.0.0.1:8001/api`
2. Start the React application: `npm run dev`
3. Navigate to the Input Readiness module
4. The page will automatically fetch and display data from the API
5. Test the "Save draft" and "Authorise design start" buttons

## Future Enhancements

Potential improvements for future iterations:
- Implement checklist item editing functionality
- Add pagination for multiple records
- Add search and filter capabilities
- Implement real-time updates via WebSocket
- Add export functionality for readiness reports
- Implement batch operations for multiple records
