import { getJson, postJson, patchJson } from './apiClient';

/**
 * EWP (Engineering Work Package) API Service
 * Handles all API calls related to EWP records
 */

/**
 * Fetch all EWP records with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.project_id - Project ID filter
 * @param {string} params.status - Status filter (e.g., "ready", "draft")
 * @returns {Promise<Object>} Response containing EWP records
 */
export const getEwpRecords = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.project_id) {
    queryParams.append('project_id', params.project_id);
  }
  
  if (params.status) {
    queryParams.append('status', params.status);
  }
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/ewps?${queryString}` : '/ewps';
  
  return await getJson(endpoint);
};

/**
 * Fetch a single EWP record by ID
 * @param {string} id - EWP record ID
 * @returns {Promise<Object>} Response containing EWP record details
 */
export const getEwpRecordById = async (id) => {
  return await getJson(`/ewp/${id}`);
};

/**
 * Create a new EWP record
 * @param {Object} data - EWP data
 * @returns {Promise<Object>} Response containing created EWP record
 */
export const createEwpRecord = async (data) => {
  return await postJson('/ewp', data);
};

/**
 * Update an existing EWP record
 * @param {string} id - EWP record ID
 * @param {Object} data - Updated EWP data
 * @returns {Promise<Object>} Response containing updated EWP record
 */
export const updateEwpRecord = async (id, data) => {
  return await patchJson(`/ewp/${id}`, data);
};
