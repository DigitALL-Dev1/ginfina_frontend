import { postJson } from './apiClient';

/**
 * Technical Sign-off API Service
 * Handles all API calls related to technical sign-off
 */

/**
 * Create a new technical sign-off record
 * @param {Object} data - Technical sign-off data
 * @param {string} data.approval_package - Approval package identifier (required)
 * @param {string} data.review_closure - Review closure status (required)
 * @param {string} data.decision - Approval decision (required)
 * @param {string} data.approval_note - Approval note (required)
 * @param {string} data.submission_id - Formal submission ID (required)
 * @param {string} data.ewp_id - EWP ID (required)
 * @param {string} data.submitted_by - User ID of the submitter (required)
 * @returns {Promise<Object>} Response containing created technical sign-off
 */
export const createTechnicalSignoff = async (data) => {
  return await postJson('/technical-signoff', data);
};
