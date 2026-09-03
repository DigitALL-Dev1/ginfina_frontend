import { postJson } from './apiClient';

/**
 * Procurement Package API Service
 * Handles all API calls related to procurement packages
 */

/**
 * Create a new procurement package
 * @param {Object} data - Procurement package data
 * @param {string} data.engineering_release - Engineering release identifier (required)
 * @param {string} data.ebom_baseline - EBOM baseline identifier (required)
 * @param {string} data.boq_baseline - BOQ baseline identifier (required)
 * @param {string} data.technical_attachments - Technical attachments (required)
 * @param {string} data.technical_specification_status - Technical specification status (required)
 * @param {string} data.approved_ebom_boq_status - Approved EBOM/BOQ status (required)
 * @param {string} data.gsolve_integration_status - GSOLVE integration status (required)
 * @param {string} data.project_id - Project ID (required)
 * @param {string} data.ewp_id - EWP ID (required)
 * @param {string} data.submitted_by - User ID of the submitter (required)
 * @returns {Promise<Object>} Response containing created procurement package
 */
export const createProcurementPackage = async (data) => {
  return await postJson('/procurement-package', data);
};
