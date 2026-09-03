/**
 * Storage Helper Utility
 * Provides centralized storage access for application data
 */

/**
 * Get value from storage (localStorage first, then sessionStorage)
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} Value from storage or default value
 */
export const getFromStorage = (key, defaultValue = null) => {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || defaultValue;
  } catch (error) {
    console.warn(`Error reading ${key} from storage:`, error);
    return defaultValue;
  }
};

/**
 * Set value in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export const setInLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting ${key} in localStorage:`, error);
  }
};

/**
 * Set value in sessionStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export const setInSessionStorage = (key, value) => {
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting ${key} in sessionStorage:`, error);
  }
};

/**
 * Remove value from both localStorage and sessionStorage
 * @param {string} key - Storage key
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
  }
};

/**
 * Get EWO ID from storage
 * @param {string} fallback - Fallback value if not found
 * @returns {string} EWO ID
 */
export const getEwoId = (fallback = '') => {
  return getFromStorage('ewo_id', fallback);
};

/**
 * Get EWP ID from storage
 * @param {string} fallback - Fallback value if not found
 * @returns {string} EWP ID
 */
export const getEwpId = (fallback = '') => {
  return getFromStorage('ewp_id', fallback);
};

/**
 * Set EWO ID in storage
 * @param {string} value - EWO ID value
 * @param {boolean} useSession - Use sessionStorage instead of localStorage
 */
export const setEwoId = (value, useSession = false) => {
  if (useSession) {
    setInSessionStorage('ewo_id', value);
  } else {
    setInLocalStorage('ewo_id', value);
  }
};

/**
 * Set EWP ID in storage
 * @param {string} value - EWP ID value
 * @param {boolean} useSession - Use sessionStorage instead of localStorage
 */
export const setEwpId = (value, useSession = false) => {
  if (useSession) {
    setInSessionStorage('ewp_id', value);
  } else {
    setInLocalStorage('ewp_id', value);
  }
};
