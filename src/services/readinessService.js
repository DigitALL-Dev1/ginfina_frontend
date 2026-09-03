import { getJson, postJson, patchJson } from './apiClient';

/**
 * Readiness API Service
 * Handles all API calls related to readiness records
 */

/**
 * Fetch all readiness records
 * @returns {Promise<Object>} Response containing readiness records
 */
export const getReadinessRecords = async () => {
  return await getJson('/readiness');
};

/**
 * Fetch a single readiness record by ID
 * @param {string} id - Readiness record ID
 * @returns {Promise<Object>} Response containing readiness record details
 */
export const getReadinessRecordById = async (id) => {
  return await getJson(`/readiness/${id}`);
};

/**
 * Create a new readiness record
 * @param {Object} data - Readiness record data
 * @param {string} data.ewo_id - EWO ID
 * @param {string} data.ewp_id - EWP ID
 * @param {string} data.readiness_profile - Readiness profile name
 * @param {Array} data.critical_input_checklist - Array of checklist items
 * @param {string} data.override_reason - Override reason (optional)
 * @param {string} data.override_expiry - Override expiry date (optional)
 * @returns {Promise<Object>} Response containing created readiness record
 */
export const createReadinessRecord = async (data) => {
  return await postJson('/readiness', data);
};

/**
 * Update an existing readiness record
 * @param {string} id - Readiness record ID
 * @param {Object} data - Updated readiness record data
 * @returns {Promise<Object>} Response containing updated readiness record
 */
export const updateReadinessRecord = async (id, data) => {
  return await patchJson(`/readiness/${id}`, data);
};

/**
 * Authorize design start for a readiness record
 * @param {string} id - Readiness record ID
 * @returns {Promise<Object>} Response containing authorization result
 */
export const authorizeDesignStart = async (id) => {
  return await postJson(`/readiness/${id}/authorize`, {});
};
