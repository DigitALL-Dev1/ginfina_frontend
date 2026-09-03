import { postJson } from './apiClient';

/**
 * IFC Release API Service
 * Handles all API calls related to IFC releases
 */

/**
 * Create a new IFC release record
 * @param {Object} data - IFC release data
 * @param {string} data.release_type - Release type (e.g., "Full Package IFC") (required)
 * @param {string} data.approved_baseline - Approved baseline identifier (required)
 * @param {string} data.included_revisions - Included revisions list (required)
 * @param {string} data.release_note - Release note (required)
 * @param {string} data.ewp_id - EWP ID (required)
 * @param {string} data.submission_id - Submission ID (required)
 * @param {string} data.released_by - User ID of the releaser (required)
 * @returns {Promise<Object>} Response containing created IFC release
 */
export const createIfcRelease = async (data) => {
  return await postJson('/ifc-releases', data);
};
