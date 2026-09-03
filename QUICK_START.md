# Quick Start Guide - Readiness API Integration

## For Developers: Getting Started in 5 Minutes

### Step 1: Start the Backend API
```bash
# Ensure the API server is running at:
http://127.0.0.1:8001/api/readiness
```

### Step 2: Start the React Application
```bash
npm install  # if first time
npm run dev
```

### Step 3: Set Storage Values (Browser Console)
Open browser console (F12) and run:
```javascript
localStorage.setItem('ewo_id', 'EWO-TEST-001');
localStorage.setItem('ewp_id', 'EWP-TEST-001');
```

### Step 4: Navigate to the Page
Go to the Input Readiness module in the application.

### Step 5: Test the Integration
- Page should load data from API automatically
- Fill in "Override reason" and "Override expiry"
- Click "Save draft" to test PATCH request
- Click "Authorise design start" to test status update

---

## Quick Code Reference

### Using the API Service
```javascript
import { 
  getReadinessRecords, 
  updateReadinessRecord 
} from '../services/readinessService';

// Fetch records
const records = await getReadinessRecords();

// Update a record
await updateReadinessRecord('readiness-id-123', {
  ewo_id: 'EWO-001',
  ewp_id: 'EWP-001',
  override_reason: 'Test reason',
  status: 'Draft'
});
```

### Using the Storage Helper
```javascript
import { 
  getEwoId, 
  getEwpId, 
  setEwoId, 
  setEwpId 
} from '../utils/storageHelper';

// Get values
const ewoId = getEwoId(); // Returns from storage or ''
const ewpId = getEwpId('default-value'); // With fallback

// Set values
setEwoId('EWO-123'); // Sets in localStorage
setEwpId('EWP-456', true); // Sets in sessionStorage
```

---

## API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/readiness` | Get all records |
| GET | `/api/readiness/{id}` | Get single record |
| POST | `/api/readiness` | Create new record |
| PATCH | `/api/readiness/{id}` | Update record |

---

## Storage Keys Reference

| Key | Purpose | Example Value |
|-----|---------|---------------|
| `ewo_id` | Engineering Work Order ID | `"EWO-12345"` |
| `ewp_id` | Engineering Work Package ID | `"EWP-67890"` |

---

## Common Issues & Solutions

### Issue: "Failed to fetch readiness records"
**Solution**: Check if API server is running and accessible

### Issue: EWO/EWP IDs are null in API requests
**Solution**: Set values in storage first (see Step 3 above)

### Issue: "No readiness record found"
**Solution**: Create a record via POST endpoint first, or check API response

### Issue: Changes not saving
**Solution**: Check browser console for errors, verify API endpoint is correct

---

## File Structure

```
src/
├── services/
│   ├── apiClient.js          (existing - base API client)
│   └── readinessService.js   (NEW - readiness API functions)
├── utils/
│   ├── storageHelper.js      (NEW - storage utilities)
│   └── routes.js             (existing)
└── layouts/
    └── InputReadinessLayout.jsx (MODIFIED - integrated with API)
```

---

## Environment Variables

Ensure these are set in your `.env` file:

```env
VITE_API_BASE_URL=http://127.0.0.1:8001/api
VITE_DEMO_MODE=false
```

---

## Testing Checklist

- [ ] Backend API is running
- [ ] Frontend application starts without errors
- [ ] Storage values are set
- [ ] Page loads and displays data
- [ ] Save draft button works
- [ ] Authorize button works
- [ ] Status badge updates correctly
- [ ] Error messages display properly
- [ ] Loading states show correctly

---

## For Production Deployment

1. **Update Environment Variables**:
   ```env
   VITE_API_BASE_URL=https://your-production-api.com/api
   ```

2. **Set Storage Values in Your App**:
   - Add storage calls when user selects work order
   - Integrate with your authentication flow
   - Consider URL parameters for deep linking

3. **Error Monitoring**:
   - Add error tracking service integration
   - Monitor API failure rates
   - Set up alerts for critical errors

---

## Support & Documentation

- **Full Documentation**: See `READINESS_API_INTEGRATION.md`
- **Storage Examples**: See `STORAGE_SETUP_EXAMPLE.md`
- **Changes Summary**: See `CHANGES_SUMMARY.md`

---

## Need Help?

1. Check browser console for errors
2. Verify network requests in DevTools
3. Confirm storage values are set
4. Review API response structure
5. Check that backend is accessible
