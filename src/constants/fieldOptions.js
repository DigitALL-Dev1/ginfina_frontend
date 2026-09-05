/**
 * Predefined options for Type and Role dropdown fields
 * These constants ensure consistent values across the application
 */

// User Roles
export const USER_ROLES = [
  'admin',
  'consultant',
  'user',
  'Engineering Manager',
  'Electrical Reviewer',
  'Lead Engineer',
  'Reviewer',
  'System Administrator',
  'External Consultant',
];

// Assessment Pack Types
export const PACK_TYPES = [
  'Standard',
  'Environmental',
  'Structural',
  'Geotechnical',
  'Electrical',
  'Mechanical',
  'Civil',
  'Solar PV',
];

// Site Types
export const SITE_TYPES = [
  'Residential',
  'Commercial',
  'Industrial',
  'Agricultural',
  'Mixed Use',
  'Institutional',
];

// Building Types
export const BUILDING_TYPES = [
  'Single Family',
  'Multi Family',
  'Office',
  'Retail',
  'Warehouse',
  'Educational',
  'Healthcare',
  'Religious',
];

// Area Types
export const AREA_TYPES = [
  'Interior',
  'Exterior',
  'Rooftop',
  'Ground Level',
  'Basement',
  'Parking',
];

// POI (Point of Interest) Types
export const POI_TYPES = [
  'Electrical Panel',
  'Junction Box',
  'Meter Location',
  'Equipment Room',
  'Access Point',
  'Utility Connection',
];

// Visit Types
export const VISIT_TYPES = [
  'Initial Survey',
  'Follow-up',
  'Technical Assessment',
  'Final Inspection',
  'Progress Review',
];

// Team Roles
export const TEAM_ROLES = [
  'Team Lead',
  'Site Engineer',
  'Electrical Engineer',
  'Structural Engineer',
  'Survey Technician',
  'Safety Officer',
  'Documentation Specialist',
];

// Access Types
export const ACCESS_TYPES = [
  'Public Road',
  'Private Road',
  'Footpath Only',
  'Restricted Access',
  'No Direct Access',
];

// Hazard Types
export const HAZARD_TYPES = [
  'Electrical',
  'Structural',
  'Chemical',
  'Biological',
  'Environmental',
  'Height',
  'Confined Space',
  'Traffic',
];

// Requirement Types
export const REQUIREMENT_TYPES = [
  'Safety',
  'Regulatory',
  'Technical',
  'Environmental',
  'Documentation',
  'Equipment',
];

// Instrument Types
export const INSTRUMENT_TYPES = [
  'Multimeter',
  'Thermal Camera',
  'Distance Meter',
  'GPS Device',
  'Inclinometer',
  'Soil Tester',
];

// Item Types (SEB)
export const ITEM_TYPES = [
  'Design Parameter',
  'Material Specification',
  'Equipment Specification',
  'Installation Requirement',
  'Performance Criteria',
];

// Source Record Types
export const SOURCE_RECORD_TYPES = [
  'Site Survey',
  'Engineering Drawing',
  'Vendor Data',
  'Field Measurement',
  'Client Document',
];

// Record Types (Constraints/Gaps)
export const RECORD_TYPES = [
  'Constraint',
  'Gap',
  'Risk',
  'Assumption',
];

// Change Types
export const CHANGE_TYPES = [
  'Scope Change',
  'Design Change',
  'Material Change',
  'Specification Change',
  'Schedule Change',
];

// Condition Types
export const CONDITION_TYPES = [
  'Technical',
  'Administrative',
  'Safety',
  'Quality',
  'Regulatory',
];

// Evidence Types
export const EVIDENCE_TYPES = [
  'Photograph',
  'Document',
  'Measurement',
  'Video',
  'Audio Recording',
  'Drawing',
  'Report',
];

// Source Types (Evidence)
export const SOURCE_TYPES = [
  'Site Survey',
  'Field Observation',
  'Laboratory Test',
  'Engineering Analysis',
  'Vendor Documentation',
  'Client Provided',
];

// Task Types (AI Observation)
export const TASK_TYPES = [
  'Object Detection',
  'Classification',
  'Measurement',
  'Analysis',
  'Anomaly Detection',
];

// Conflict Types
export const CONFLICT_TYPES = [
  'Data Mismatch',
  'Specification Conflict',
  'Regulatory Conflict',
  'Design Conflict',
  'Schedule Conflict',
];

// Action Types (RFI)
export const ACTION_TYPES = [
  'RFI',
  'TQ',
  'Clarification',
  'Site Visit',
  'Follow-up Required',
];

// Project Types
export const PROJECT_TYPES = [
  'Solar',
  'Hydro',
  'Wind',
  'Substation',
  'Grid',
  'Hybrid',
];

// CRM Source Systems
export const CRM_SYSTEMS = [
  'Salesforce',
  'HubSpot',
  'Dynamics365',
  'Custom CRM',
];

/**
 * Helper function to get options for a specific field type
 * @param {string} fieldName - The name of the field (e.g., 'role', 'type', 'site_type')
 * @returns {Array<string>} - Array of predefined options
 */
export function getFieldOptions(fieldName) {
  const fieldMap = {
    // Role fields
    role: USER_ROLES,
    user_role: USER_ROLES,
    team_role: TEAM_ROLES,

    // Type fields
    type: PACK_TYPES,
    pack_type: PACK_TYPES,
    site_type: SITE_TYPES,
    building_type: BUILDING_TYPES,
    area_type: AREA_TYPES,
    poi_type: POI_TYPES,
    visit_type: VISIT_TYPES,
    access_type: ACCESS_TYPES,
    hazard_type: HAZARD_TYPES,
    requirement_type: REQUIREMENT_TYPES,
    instrument_type: INSTRUMENT_TYPES,
    item_type: ITEM_TYPES,
    source_record_type: SOURCE_RECORD_TYPES,
    record_type: RECORD_TYPES,
    change_type: CHANGE_TYPES,
    condition_type: CONDITION_TYPES,
    evidence_type: EVIDENCE_TYPES,
    source_type: SOURCE_TYPES,
    task_type: TASK_TYPES,
    conflict_type: CONFLICT_TYPES,
    action_type: ACTION_TYPES,
    project_type: PROJECT_TYPES,
    reference_type: PROJECT_TYPES, // CRM reference types use project types
  };

  return fieldMap[fieldName?.toLowerCase()] || [];
}
