# RFI API Integration Documentation

## Overview
This document describes the integration of the RFI (Request for Information) API into the Engineering RFI and Technical Query page.

## API Endpoint
- **Base URL**: `http://127.0.0.1:8001/api`
- **Endpoint**: `/rfi`
- **Method**: POST

## Implementation Details

### Files Created/Modified

#### 1. `src/services/rfiService.js` (NEW)
A dedicated service file for all RFI-related API calls.

**Functions:**
- `getRfiRecords()` - Fetch all RFI records
- `getRfiRecordById(id)` - Fetch a single RFI by ID
- `createRfiRecord(data)` - Create a new RFI/Technical Query
- `updateRfiRecord(id, data)` - Update an existing RFI
- `submitRfi(id)` - Submit an RFI (change status)

#### 2. `src/utils/storage.js` (NEW)
Utility for managing EWO ID, EWP ID, and User ID in localStorage.

**Functions:**
- `getEwoId()` - Get EWO ID from localStorage (default: 'ewo-sample-001')
- `setEwoId(ewoId)` - Set EWO ID in localStorage
- `getEwpId()` - Get EWP ID from localStorage (default: 'ewp-sample-003')
- `setEwpId(ewpId)` - Set EWP ID in localStorage
- `getUserId()` - Get User ID from localStorage (default: 'user-4')
- `setUserId(userId)` - Set User ID in localStorage
- `getAllIds()` - Get all stored IDs
- `clearStorage()` - Clear all stored data

#### 3. `src/layouts/RfiQueryLayout.jsx` (MODIFIED)
Updated to integrate with the RFI API.

**Key Changes:**
- Added API integration for creating RFI records
- Form validation before submission
- Loading states during API calls
- Error handling with user notifications
- Display of context information (EWO ID, EWP ID, User ID)
- Empty form fields on initial load
- Disabled submit button when required fields are empty
- Status badge display after successful submission

**New Features:**
- Real-time form validation
- Submit technical query functionality with API integration
- Save draft functionality
- Loading indicators during submission
- Success/error notifications
- Context information display showing EWO ID, EWP ID, and User ID

#### 4. `src/layouts/InputReadinessLayout.jsx` (MODIFIED)
Updated to use storage utility for EWO ID and EWP ID.

**Key Changes:**
- Removed EWO ID and EWP ID fields from the UI form
- Automatically fetch EWO ID and EWP ID from localStorage
- Pass storage values to API on save/authorize actions

## API Request Structure

### POST /api/rfi

**Request Body:**
```json
{
  "query_type": "Technical",
  "subject": "BESS inverter protection settings",
  "technical_question": "What are the required protection relay settings for the BESS inverter interconnection per PNG grid code?",
  "required_by": "2026-09-10",
  "evidence_link": "https://drive.google.com/file/bess-spec-sheet",
  "submitted_by": "user-4",
  "ewo_id": "ewo-sample-001",
  "ewp_id": "ewp-sample-003"
}
```

**Field Descriptions:**
- `query_type` (required): Type of query - "Technical", "RFI", or "Clarification"
- `subject` (required): Concise subject/title of the query
- `technical_question` (required): Detailed technical question
- `required_by` (required): Date by which response is required (YYYY-MM-DD format)
- `evidence_link` (optional): URL or reference to supporting evidence/documentation
- `submitted_by` (required): User ID of the submitter (from localStorage)
- `ewo_id` (required): Engineering Work Order ID (from localStorage)
- `ewp_id` (required): Engineering Work Package ID (from localStorage)

**Expected Response:**
```json
{
  "data": {
    "id": "rfi-xxxxx",
    "query_type": "Technical",
    "subject": "BESS inverter protection settings",
    "technical_question": "What are the required protection relay settings...",
    "required_by": "2026-09-10",
    "evidence_link": "https://drive.google.com/file/bess-spec-sheet",
    "submitted_by": "user-4",
    "ewo_id": "ewo-sample-001",
    "ewp_id": "ewp-sample-003",
    "status": "Submitted",
    "created_at": "2026-08-24T15:31:52.991827",
    "updated_at": "2026-08-24T15:31:52.991827"
  },
  "status_code": 201,
  "message": "RFI created successfully"
}
```

## Storage Management

### LocalStorage Keys
- `ginfina_ewo_id` - Stores the Engineering Work Order ID
- `ginfina_ewp_id` - Stores the Engineering Work Package ID
- `ginfina_user_id` - Stores the current user ID

### Default Values
If no values are found in localStorage, the following defaults are used:
- EWO ID: `ewo-sample-001`
- EWP ID: `ewp-sample-003`
- User ID: `user-4`

### Setting Values
You can set these values programmatically:
```javascript
import { setEwoId, setEwpId, setUserId } from '../utils/storage';

setEwoId('ewo-12345');
setEwpId('ewp-67890');
setUserId('user-john-doe');
```

## Usage Flow

### 1. User Opens RFI Page
- Form loads with empty fields
- Context information (EWO ID, EWP ID, User ID) is displayed from localStorage
- Submit button is disabled until all required fields are filled

### 2. User Fills Out Form
- Query type selection (default: "Technical")
- Subject input (required)
- Technical question textarea (required)
- Required by date (required)
- Evidence link (optional)

### 3. Form Validation
Client-side validation occurs before submission:
- Subject must not be empty
- Technical question must not be empty
- Required by date must not be empty
- User receives error notification if validation fails

### 4. Submission
When user clicks "Submit technical query":
- Form data is validated
- EWO ID, EWP ID, and User ID are retrieved from storage
- API request is made with all required data
- Loading state is shown during submission
- Success notification is displayed on successful submission
- Form can optionally be reset after submission

### 5. Save Draft
When user clicks "Save draft":
- Partial form data can be saved
- Default values are used for missing required fields
- Status is set to "Draft"
- Draft can be retrieved and completed later

## Error Handling

The integration includes comprehensive error handling:

1. **Validation Errors**: 
   - Client-side validation before API call
   - User-friendly error messages
   - Field-specific validation feedback

2. **Network Errors**:
   - Caught and displayed via Mantine notifications
   - Error details shown to user

3. **API Errors**:
   - HTTP error responses are handled
   - Error messages extracted from response
   - User notified with specific error details

4. **Loading States**:
   - Buttons show loading spinner during API calls
   - Prevents duplicate submissions
   - Form is disabled during submission

## UI/UX Enhancements

1. **Form Validation**:
   - Required field indicators (red asterisks)
   - Real-time validation feedback
   - Disabled submit button when validation fails

2. **Loading Indicators**:
   - Button loading states during submission
   - Clear visual feedback for ongoing operations

3. **Notifications**:
   - Success notifications for successful submissions
   - Error notifications with detailed messages
   - Info notifications for guidance

4. **Context Display**:
   - Right sidebar shows EWO ID, EWP ID, and User ID
   - Transparent display of automatically-included data
   - Users can verify context information before submission

5. **Status Badge**:
   - Dynamically displayed after successful submission
   - Visual confirmation of submission status

## Testing

To test the RFI API integration:

1. Ensure the backend API is running at `http://127.0.0.1:8001/api`
2. Start the React application: `npm run dev`
3. Navigate to the Engineering RFI and Technical Query page
4. Fill out the form with test data:
   - Query type: "Technical"
   - Subject: "Test RFI Subject"
   - Technical question: "This is a test technical question"
   - Required by: "2026-12-31"
   - Evidence: "https://example.com/test-evidence"
5. Click "Submit technical query"
6. Verify success notification appears
7. Check browser console for API request/response details
8. Verify data was sent to the backend correctly

### Test Scenarios

#### Happy Path
- All required fields filled
- Valid date format
- Successful API response
- Success notification displayed

#### Validation Errors
- Empty subject → Validation error
- Empty question → Validation error
- Empty required date → Validation error

#### Network Errors
- Backend not running → Network error notification
- Invalid API endpoint → Error notification

#### Save Draft
- Partial form data → Draft saved successfully
- Empty form → Draft saved with defaults

## Environment Configuration

The API base URL is configured in `.env`:
```
VITE_API_BASE_URL=http://127.0.0.1:8001/api
VITE_DEMO_MODE=false
```

When `VITE_DEMO_MODE=true`, mock responses are returned instead of real API calls.

## Future Enhancements

Potential improvements for future iterations:

1. **Date Picker Component**: Replace TextInput with proper DatePickerInput
2. **File Upload**: Add file upload capability for evidence
3. **Rich Text Editor**: Enhanced text area for technical questions
4. **Auto-save**: Periodic auto-save of draft data
5. **Response Tracking**: Display RFI responses and status updates
6. **History View**: Show previous RFIs and their statuses
7. **Search and Filter**: Find existing RFIs by various criteria
8. **Attachments**: Support multiple evidence attachments
9. **Notifications**: Email/push notifications for RFI updates
10. **Analytics**: Track RFI resolution times and trends

## Integration Summary

### Input Readiness Module
- ✅ EWO ID and EWP ID removed from UI
- ✅ Values fetched from localStorage
- ✅ Values passed to API on save/authorize

### RFI Module
- ✅ Full API integration with POST /api/rfi
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- ✅ Success notifications
- ✅ Storage utility integration
- ✅ Context information display

Both modules now seamlessly integrate with their respective backend APIs while maintaining clean UI and robust error handling.
