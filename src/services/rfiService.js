import { getJson, postJson, patchJson } from './apiClient';

/**
 * RFI (Request for Information) API Service
 * Handles all API calls related to RFI and technical queries
 */

/**
 * Fetch all RFI records
 * @returns {Promise<Object>} Response containing RFI records
 */
export const getRfiRecords = async () => {
  return await getJson('/rfi');
};

/**
 * Fetch a single RFI record by ID
 * @param {string} id - RFI record ID
 * @returns {Promise<Object>} Response containing RFI record details
 */
export const getRfiRecordById = async (id) => {
  return await getJson(`/rfi/${id}`);
};

/**
 * Create a new RFI/Technical Query
 * @param {Object} data - RFI data
 * @param {string} data.query_type - Type of query (e.g., "Technical", "RFI", "Clarification")
 * @param {string} data.subject - Subject/title of the query
 * @param {string} data.technical_question - Detailed technical question
 * @param {string} data.required_by - Required by date (YYYY-MM-DD)
 * @param {string} data.evidence_link - Link to evidence/documentation (optional)
 * @param {string} data.submitted_by - User ID of the submitter
 * @param {string} data.ewo_id - EWO ID
 * @param {string} data.ewp_id - EWP ID
 * @returns {Promise<Object>} Response containing created RFI record
 */
export const createRfiRecord = async (data) => {
  return await postJson('/rfi', data);
};

/**
 * Update an existing RFI record
 * @param {string} id - RFI record ID
 * @param {Object} data - Updated RFI data
 * @returns {Promise<Object>} Response containing updated RFI record
 */
export const updateRfiRecord = async (id, data) => {
  return await patchJson(`/rfi/${id}`, data);
};

/**
 * Submit an RFI (change status from draft to submitted)
 * @param {string} id - RFI record ID
 * @returns {Promise<Object>} Response containing submission result
 */
export const submitRfi = async (id) => {
  return await postJson(`/rfi/${id}/submit`, {});
};
