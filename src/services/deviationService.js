import { postJson } from './apiClient';

/**
 * Deviation API Service
 * Handles all API calls related to engineering deviations
 */

/**
 * Create a new engineering deviation
 * @param {Object} data - Deviation data
 * @param {string} data.original_requirement - Original requirement (required)
 * @param {string} data.proposed_substitute - Proposed substitute (required)
 * @param {string} data.deviation_summary - Deviation summary (required)
 * @param {string} data.evidence - Evidence (required)
 * @param {string} data.technical_specification_status - Technical specification status (required)
 * @param {string} data.approved_ebom_boq_status - Approved EBOM/BOQ status (required)
 * @param {string} data.gsolve_integration_status - GSOLVE integration status (required)
 * @param {string} data.procurement_package_id - Procurement package ID (required)
 * @param {string} data.ewp_id - EWP ID (required)
 * @param {string} data.submitted_by - User ID of the submitter (required)
 * @returns {Promise<Object>} Response containing created deviation
 */
export const createDeviation = async (data) => {
  return await postJson('/deviations', data);
};
