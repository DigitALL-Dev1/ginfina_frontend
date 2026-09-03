/**
 * Storage utility for managing application data in localStorage
 */

const STORAGE_KEYS = {
  EWO_ID: 'ginfina_ewo_id',
  EWP_ID: 'ginfina_ewp_id',
  USER_ID: 'ginfina_user_id',
  PROJECT_ID: 'ginfina_project_id',
};

/**
 * Get EWO ID from localStorage
 * @returns {string|null} EWO ID or null if not found
 */
export const getEwoId = () => {
  return localStorage.getItem(STORAGE_KEYS.EWO_ID) || 'ewo-sample-001';
};

/**
 * Set EWO ID in localStorage
 * @param {string} ewoId - EWO ID to store
 */
export const setEwoId = (ewoId) => {
  localStorage.setItem(STORAGE_KEYS.EWO_ID, ewoId);
};

/**
 * Get EWP ID from localStorage
 * @returns {string|null} EWP ID or null if not found
 */
export const getEwpId = () => {
  return localStorage.getItem(STORAGE_KEYS.EWP_ID) || 'ewp-sample-003';
};

/**
 * Set EWP ID in localStorage
 * @param {string} ewpId - EWP ID to store
 */
export const setEwpId = (ewpId) => {
  localStorage.setItem(STORAGE_KEYS.EWP_ID, ewpId);
};

/**
 * Get User ID from localStorage
 * @returns {string|null} User ID or null if not found
 */
export const getUserId = () => {
  return localStorage.getItem(STORAGE_KEYS.USER_ID) || 'user-4';
};

/**
 * Set User ID in localStorage
 * @param {string} userId - User ID to store
 */
export const setUserId = (userId) => {
  localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
};

/**
 * Get Project ID from localStorage
 * @returns {string|null} Project ID or null if not found
 */
export const getProjectId = () => {
  return localStorage.getItem(STORAGE_KEYS.PROJECT_ID) || '1';
};

/**
 * Set Project ID in localStorage
 * @param {string} projectId - Project ID to store
 */
export const setProjectId = (projectId) => {
  localStorage.setItem(STORAGE_KEYS.PROJECT_ID, projectId);
};

/**
 * Clear all stored data
 */
export const clearStorage = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

/**
 * Get all stored IDs
 * @returns {Object} Object containing all stored IDs
 */
export const getAllIds = () => {
  return {
    ewo_id: getEwoId(),
    ewp_id: getEwpId(),
    user_id: getUserId(),
    project_id: getProjectId(),
  };
};
