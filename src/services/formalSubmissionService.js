import { getJson, postJson, patchJson } from './apiClient';

/**
 * Formal Submission API Service
 * Handles all API calls related to formal submissions
 */

/**
 * Fetch all formal submissions
 * @param {Object} params - Query parameters
 * @param {string} params.ewp_reference - EWP reference filter
 * @param {string} params.project - Project filter
 * @returns {Promise<Object>} Response containing formal submissions
 */
export const getFormalSubmissions = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.ewp_reference) {
    queryParams.append('ewp_reference', params.ewp_reference);
  }
  
  if (params.project) {
    queryParams.append('project', params.project);
  }
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/formal-submissions?${queryString}` : '/formal-submissions';
  
  return await getJson(endpoint);
};

/**
 * Fetch a single formal submission by ID
 * @param {string} id - Formal submission ID
 * @returns {Promise<Object>} Response containing formal submission details
 */
export const getFormalSubmissionById = async (id) => {
  return await getJson(`/formal-submissions/${id}`);
};

/**
 * Create a new formal submission
 * @param {Object} data - Formal submission data
 * @param {string} data.ewp_reference - EWP reference (required)
 * @param {string} data.originator - Originator name (required)
 * @param {string} data.project - Project name (required)
 * @param {string} data.target_review_due_date - Target review due date (required)
 * @param {string} data.submitted_by - User ID of the submitter (required)
 * @returns {Promise<Object>} Response containing created formal submission
 */
export const createFormalSubmission = async (data) => {
  return await postJson('/formal-submissions', data);
};

/**
 * Update an existing formal submission
 * @param {string} id - Formal submission ID
 * @param {Object} data - Updated formal submission data
 * @returns {Promise<Object>} Response containing updated formal submission
 */
export const updateFormalSubmission = async (id, data) => {
  return await patchJson(`/formal-submissions/${id}`, data);
};
