import { getJson, postJson, patchJson } from './apiClient';

/**
 * Review Routing API Service
 * Handles all API calls related to review routing
 */

/**
 * Fetch all review routings
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Response containing review routings
 */
export const getReviewRoutings = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key]) {
      queryParams.append(key, params[key]);
    }
  });
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/review-routing?${queryString}` : '/review-routing';
  
  return await getJson(endpoint);
};

/**
 * Fetch a single review routing by ID
 * @param {string} id - Review routing ID
 * @returns {Promise<Object>} Response containing review routing details
 */
export const getReviewRoutingById = async (id) => {
  return await getJson(`/review-routing/${id}`);
};

/**
 * Create a new review routing
 * @param {Object} data - Review routing data
 * @param {string} data.submission_id - Submission ID (required)
 * @param {string} data.submission_purpose - Submission purpose (required)
 * @param {string} data.created_by - User ID of the creator (required)
 * @returns {Promise<Object>} Response containing created review routing
 */
export const createReviewRouting = async (data) => {
  return await postJson('/review-routing', data);
};

/**
 * Update an existing review routing
 * @param {string} id - Review routing ID
 * @param {Object} data - Updated review routing data
 * @returns {Promise<Object>} Response containing updated review routing
 */
export const updateReviewRouting = async (id, data) => {
  return await patchJson(`/review-routing/${id}`, data);
};
