import { getJson, postJson, patchJson } from './apiClient';

/**
 * Review Comment API Service
 * Handles all API calls related to review comments
 */

/**
 * Fetch all review comments
 * @param {Object} params - Query parameters
 * @param {string} params.review_routing_id - Review routing ID filter
 * @returns {Promise<Object>} Response containing review comments
 */
export const getReviewComments = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.review_routing_id) {
    queryParams.append('review_routing_id', params.review_routing_id);
  }
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/review-comments?${queryString}` : '/review-comments';
  
  return await getJson(endpoint);
};

/**
 * Fetch a single review comment by ID
 * @param {string} id - Review comment ID
 * @returns {Promise<Object>} Response containing review comment details
 */
export const getReviewCommentById = async (id) => {
  return await getJson(`/review-comments/${id}`);
};

/**
 * Create a new review comment
 * @param {Object} data - Review comment data
 * @param {string} data.review_routing_id - Review routing ID (optional)
 * @param {string} data.original_comment - Original comment text (required)
 * @param {string} data.consultant_response - Consultant response (optional)
 * @param {string} data.corrective_revision - Corrective revision (optional)
 * @param {string} data.verifier_decision - Verifier decision (optional)
 * @param {string} data.verifier_note - Verifier note (optional)
 * @param {string} data.submitted_by - User ID of the submitter (required)
 * @returns {Promise<Object>} Response containing created review comment
 */
export const createReviewComment = async (data) => {
  return await postJson('/review-comments', data);
};

/**
 * Update an existing review comment
 * @param {string} id - Review comment ID
 * @param {Object} data - Updated review comment data
 * @returns {Promise<Object>} Response containing updated review comment
 */
export const updateReviewComment = async (id, data) => {
  return await patchJson(`/review-comments/${id}`, data);
};
