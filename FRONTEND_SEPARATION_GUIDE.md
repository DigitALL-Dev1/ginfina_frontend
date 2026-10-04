# Frontend Module Separation Guide - Drone, GIS, and Climate

## Overview

The combined `SIADroneGISClimateLayout.jsx` file has been separated into three independent frontend modules for better organization and maintainability.

## Created Files

### 1. ✅ SIADroneLayout.jsx (COMPLETED)
**Location:** `frontend/src/layouts/SIADroneLayout.jsx`

**Sections:**
- Drone Missions (top-level with sia_case_id + site_id)
- Operators
- Platforms
- Capture Plans
- Ground Control Points (GCPs)
- Field Conditions
- Raw Data
- Quality Checks
- Derived Products
- Report

**Key Features:**
- Properly provides `sia_case_id` and `site_id` when creating missions
- Child resources inherit scope from selected mission
- Responsive table design with mobile support
- Auto-code generation for mission codes and GCP codes
- Comprehensive form validation
- Badge components for status visualization

### 2. ⏳ SIAGISLayout.jsx (TO BE CREATED)
**Location:** `frontend/src/layouts/SIAGISLayout.jsx`

**Sections:**
- GIS Layers (top-level with sia_case_id + site_id)
- GIS Features (child of layers)
- External Geo Sources (top-level with sia_case_id + site_id)
- Report

**Key Structure:**
```jsx
export default function SIAGISLayout() {
  const [caseId] = useState(() => localStorage.getItem('sia_case_id') || '');
  const [loadedSiteId, setLoaded] = useState('');
  const [gisLayer, setGisLayer] = useState(null); // Selected layer
  
  // Top-level data (requires case + site)
  const { data: gisLayers } = useApi(`${API}/sia/sites/${loadedSiteId}/gis-layers`);
  const { data: geoSources } = useApi(`${API}/sia/sites/${loadedSiteId}/external-geo-sources`);
  
  // Child data (inherits from layer)
  const { data: gisFeatures } = useApi(`${API}/sia/gis-layers/${gisLayer?.id}/features`);
  
  // When creating GIS Layer
  const createLayer = () => {
    save('/sia/gis-layers', {
      sia_case_id: caseId,      // ✅ REQUIRED
      site_id: loadedSiteId,     // ✅ REQUIRED
      layer_name: fv.layer_name,
      // ... other fields
    }, reloadLayers);
  };
  
  // When creating GIS Feature (scope inherited)
  const createFeature = () => {
    save('/sia/gis-features', {
      gis_layer_id: gisLayer.id,  // Parent reference
      feature_code: fv.feature_code,
      // ... other fields (NO sia_case_id or site_id needed)
    }, reloadFeatures);
  };
}
```

### 3. ⏳ SIAClimateLayout.jsx (TO BE CREATED)
**Location:** `frontend/src/layouts/SIAClimateLayout.jsx`

**Sections:**
- Climate Resources (top-level with sia_case_id + site_id)
- Climate Summary (aggregated view)
- Report

**Key Features:**
- Support for 20+ climate resource types
- Bulk import functionality
- Filtering by resource type and reliability status
- Summary aggregation view
- Temporal granularity selection

**Key Structure:**
```jsx
export default function SIAClimateLayout() {
  const [caseId] = useState(() => localStorage.getItem('sia_case_id') || '');
  const [loadedSiteId, setLoaded] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  
  // Fetch with optional filtering
  const buildUrl = () => {
    let url = `${API}/sia/sites/${loadedSiteId}/climate-resources`;
    const params = new URLSearchParams();
    if (resourceTypeFilter) params.append('resource_type', resourceTypeFilter);
    if (params.toString()) url += `?${params}`;
    return url;
  };
  
  const { data: climate } = useApi(buildUrl());
  const { data: summary } = useApi(`${API}/sia/sites/${loadedSiteId}/climate-summary`);
  const { data: resourceTypes } = useApi(`${API}/sia/climate-resource-types`);
  
  // When creating Climate Resource
  const createResource = () => {
    save('/sia/climate-resources', {
      sia_case_id: caseId,        // ✅ REQUIRED
      site_id: loadedSiteId,       // ✅ REQUIRED
      resource_type: fv.resource_type,
      parameter_name: fv.parameter_name,
      parameter_value: fv.parameter_value,
      unit: fv.unit,
      reliability_status: fv.reliability_status,
      // ... other fields
    }, reloadClimate);
  };
  
  // Bulk import
  const bulkImport = (resources) => {
    postApi('/sia/climate-resources/bulk', {
      sia_case_id: caseId,
      site_id: loadedSiteId,
      resources: resources  // Array of resource objects
    });
  };
}
```

---

## Required Report Components

### 1. ⏳ SIADroneReport.jsx
**Location:** `frontend/src/components/common/SIADroneReport.jsx`

Based on existing `SIADroneGISClimateReport.jsx`, extract only drone-related sections.

### 2. ⏳ SIAGISReport.jsx  
**Location:** `frontend/src/components/common/SIAGISReport.jsx`

Extract GIS layers and features sections from combined report.

### 3. ⏳ SIAClimateReport.jsx
**Location:** `frontend/src/components/common/SIAClimateReport.jsx`

Extract climate resources section from combined report.

---

## Navigation Updates Required

### Update `frontend/src/config/navigation.json`

**Before:**
```json
{
  "label": "Drone, GIS & Climate",
  "route": "/sia/drone-gis-climate",
  "component": "SIADroneGISClimateLayout"
}
```

**After:**
```json
{
  "label": "Drone Surveys",
  "route": "/sia/drone",
  "component": "SIADroneLayout"
},
{
  "label": "GIS Mapping",
  "route": "/sia/gis",
  "component": "SIAGISLayout"
},
{
  "label": "Climate Data",
  "route": "/sia/climate",
  "component": "SIAClimateLayout"
}
```

### Update `frontend/src/config/navigation.js`

Add the three separate components to the component map:
```javascript
import SIADroneLayout from '../layouts/SIADroneLayout';
import SIAGISLayout from '../layouts/SIAGISLayout';
import SIAClimateLayout from '../layouts/SIAClimateLayout';

const componentMap = {
  // ... existing components
  SIADroneLayout,
  SIAGISLayout,
  SIAClimateLayout,
};
```

---

## Report Utility Functions

### Create: `frontend/src/utils/siaDroneReport.js`
```javascript
export function generateDroneReport(siteData, missions, operators, platforms, /* ... */) {
  // Extract from siaDroneGISClimateReport.js
  // Focus only on drone-related sections
}
```

### Create: `frontend/src/utils/siaGISReport.js`
```javascript
export function generateGISReport(siteData, layers, features, geoSources) {
  // Extract from siaDroneGISClimateReport.js
  // Focus only on GIS-related sections
}
```

### Create: `frontend/src/utils/siaClimateReport.js`
```javascript
export function generateClimateReport(siteData, climateResources, summary) {
  // Extract from siaDroneGISClimateReport.js
  // Focus only on climate-related sections
}
```

---

## CSS Module

The existing `SIADroneGISClimateLayout.module.css` can be:
1. **Option A:** Shared by all three modules (rename to `SIASharedStyles.module.css`)
2. **Option B:** Copied to three separate CSS files for independent styling

**Recommended: Option A (Shared)**
- Rename: `SIASharedStyles.module.css`
- Import in all three layouts:
  ```javascript
  import styles from './SIASharedStyles.module.css';
  ```

---

## Critical Implementation Details

### 1. Scope Validation

**Always provide case and site for top-level resources:**

```jsx
// ✅ CORRECT - Drone Mission (top-level)
const createMission = () => {
  if (!caseId || !loadedSiteId) {
    notifications.show({
      title: 'Required fields',
      message: 'Case and site must be selected',
      color: 'red'
    });
    return;
  }
  
  save('/sia/drone-missions', {
    sia_case_id: caseId,
    site_id: loadedSiteId,
    mission_code: fv.mission_code,
    // ... other fields
  }, reloadMissions);
};

// ✅ CORRECT - Drone Operator (child - scope inherited)
const createOperator = () => {
  if (!mission?.id) {
    notifications.show({
      title: 'Mission required',
      message: 'Select a mission first',
      color: 'red'
    });
    return;
  }
  
  save('/sia/drone-operators', {
    drone_mission_id: mission.id,  // Parent reference
    user_id: localStorage.getItem('user_id'),
    // ... other fields (NO sia_case_id or site_id)
  }, reloadOperators);
};
```

### 2. Site Selection Pattern

All three modules should use the same site selection pattern:

```jsx
// Site loading effect
useEffect(() => {
  const controller = new AbortController();
  if (!caseId) return;
  
  fetch(`${API}/sia/cases/${caseId}/sites`, { signal: controller.signal })
    .then(r => r.json())
    .then(sites => {
      setSites(sites);
      const remembered = localStorage.getItem('sia_site_id');
      const selected = sites.find(s => s.id === remembered) || sites[0];
      selectSite(selected?.id || '');
    })
    .catch(console.error);
    
  return () => controller.abort();
}, [caseId]);

// Site selection handler
const selectSite = (id) => {
  if (id) localStorage.setItem('sia_site_id', id);
  else localStorage.removeItem('sia_site_id');
  setLoaded(id);
  // Reset any selected child records
  setMission(null);
  setGisLayer(null);
};
```

### 3. Form Modal Pattern

Consistent form modal structure across all modules:

```jsx
<FormModal 
  opened={modal === 'resource'} 
  onClose={closeModal} 
  title="Add Resource" 
  saving={saving}
  onSubmit={() => save('/api/endpoint', formValues, reloadFunction)}>
  
  {/* Validation warnings */}
  {!loadedSiteId && (
    <Text size="xs" c="red" mb="xs">
      ⚠ Site required. Select a site first.
    </Text>
  )}
  
  {/* Form fields */}
  <FR>
    <FI label="Field 1" field="field1" fv={fv} setFv={setFv} />
    <FI label="Field 2" field="field2" fv={fv} setFv={setFv} />
  </FR>
  
  {/* Textarea fields */}
  <FI label="Notes" field="notes" fv={fv} setFv={setFv} textarea />
  
  {/* Number fields */}
  <FI label="Value" field="value" fv={fv} setFv={setFv} number />
  
  {/* Select dropdowns */}
  <FI label="Status" field="status" fv={fv} setFv={setFv} select={STATUS_OPTIONS} />
  
  {/* Boolean switches */}
  <Group mt="sm" gap="xs">
    <Text size="xs" fw={600} c="#374151">Active</Text>
    <Switch 
      checked={!!fv.is_active}
      onChange={e => setFv(p => ({ ...p, is_active: e.currentTarget.checked }))}
      color="green"
    />
  </Group>
</FormModal>
```

---

## Testing Checklist

### For Each Module (Drone, GIS, Climate)

- [ ] **Site Selection**
  - [ ] Sites load from case
  - [ ] Site selection persists in localStorage
  - [ ] Site selector shows site code and name
  - [ ] Error message shows if no sites available

- [ ] **Create Top-Level Resource**
  - [ ] Form includes sia_case_id and site_id
  - [ ] Validation prevents save without case/site
  - [ ] Success notification shows after save
  - [ ] Table refreshes after save
  - [ ] Modal closes after successful save

- [ ] **Create Child Resource**
  - [ ] Parent must be selected first
  - [ ] Form does NOT include sia_case_id or site_id
  - [ ] Parent ID is included (e.g., drone_mission_id)
  - [ ] Save works correctly with inherited scope

- [ ] **Navigation**
  - [ ] Tab navigation works
  - [ ] Step flow indicator updates
  - [ ] Child tabs disabled when parent not selected
  - [ ] Report tab accessible at any time

- [ ] **Responsive Design**
  - [ ] Tables work on mobile (320px)
  - [ ] Tables work on tablet (768px)
  - [ ] Tables work on desktop (1440px)
  - [ ] Forms are usable on all screen sizes

- [ ] **Data Display**
  - [ ] Empty state shows when no records
  - [ ] Loading spinner shows while fetching
  - [ ] Date fields format correctly
  - [ ] Status badges display with correct colors
  - [ ] Boolean values show as Yes/No badges

---

## Implementation Priority

### Phase 1: Core Layouts (Week 1)
1. ✅ Create `SIADroneLayout.jsx` (DONE)
2. ⏳ Create `SIAGISLayout.jsx`
3. ⏳ Create `SIAClimateLayout.jsx`
4. ⏳ Test all three with backend APIs

### Phase 2: Report Components (Week 2)
1. ⏳ Create `SIADroneReport.jsx`
2. ⏳ Create `SIAGISReport.jsx`
3. ⏳ Create `SIAClimateReport.jsx`
4. ⏳ Create report utility functions
5. ⏳ Test PDF generation

### Phase 3: Integration (Week 3)
1. ⏳ Update navigation config
2. ⏳ Update routes
3. ⏳ Test navigation between modules
4. ⏳ Update documentation
5. ⏳ User acceptance testing

### Phase 4: Cleanup (Week 4)
1. ⏳ Remove or deprecate `SIADroneGISClimateLayout.jsx`
2. ⏳ Update any links or references
3. ⏳ Final testing
4. ⏳ Deploy to production

---

## Benefits of Separation

1. **Better Organization** - Each module has clear, focused responsibility
2. **Easier Maintenance** - Changes to drone don't affect GIS or climate
3. **Faster Loading** - Smaller components load faster
4. **Better Navigation** - Users can jump directly to their work area
5. **Clearer Code** - No more 750+ line mega-components
6. **Parallel Development** - Team members can work on different modules simultaneously
7. **Better Testing** - Can test each module in isolation

---

## Migration Notes

### For Users
- **No data loss** - All existing data remains intact
- **New navigation** - Three separate menu items instead of one
- **Same functionality** - All features remain, just reorganized
- **Better UX** - Faster navigation to specific work areas

### For Developers
- **No breaking changes** - API endpoints unchanged
- **Reusable components** - Shared styles and utilities
- **Clear patterns** - Each module follows same structure
- **Easy to extend** - Add new features to specific modules

---

## Next Steps

1. **Create remaining layouts:**
   - `SIAGISLayout.jsx`
   - `SIAClimateLayout.jsx`

2. **Create report components:**
   - `SIADroneReport.jsx`
   - `SIAGISReport.jsx`
   - `SIAClimateReport.jsx`

3. **Update navigation configuration**

4. **Test thoroughly with backend APIs**

5. **Update user documentation**

---

## Support & Questions

For implementation assistance:
- Review `SIADroneLayout.jsx` as reference implementation
- Check `FRONTEND_INTEGRATION_GUIDE.md` in backend folder
- Refer to existing report components for PDF patterns
- Test with `curl` commands from backend guide

**Status: SIADroneLayout.jsx completed and ready for review! ✅**
