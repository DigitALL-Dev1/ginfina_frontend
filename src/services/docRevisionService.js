import { getJson, postJson, patchJson } from './apiClient';

/**
 * Document Revision API Service
 * Handles all API calls related to document revisions
 */

/**
 * Fetch all document revisions
 * @param {Object} params - Query parameters
 * @param {string} params.ewp_reference - EWP reference filter
 * @param {string} params.discipline - Discipline filter
 * @returns {Promise<Object>} Response containing document revisions
 */
export const getDocRevisions = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.ewp_reference) {
    queryParams.append('ewp_reference', params.ewp_reference);
  }
  
  if (params.discipline) {
    queryParams.append('discipline', params.discipline);
  }
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/doc-revisions?${queryString}` : '/doc-revisions';
  
  return await getJson(endpoint);
};

/**
 * Fetch a single document revision by ID
 * @param {string} id - Document revision ID
 * @returns {Promise<Object>} Response containing document revision details
 */
export const getDocRevisionById = async (id) => {
  return await getJson(`/doc-revisions/${id}`);
};

/**
 * Create a new document revision
 * @param {Object} data - Document revision data
 * @param {string} data.ewp_reference - EWP reference (required)
 * @param {string} data.document_code - Document code (required)
 * @param {string} data.document_title - Document title (required)
 * @param {string} data.discipline - Discipline (required)
 * @param {string} data.submitted_by - User ID of the submitter (required)
 * @returns {Promise<Object>} Response containing created document revision
 */
export const createDocRevision = async (data) => {
  return await postJson('/doc-revisions', data);
};

/**
 * Update an existing document revision
 * @param {string} id - Document revision ID
 * @param {Object} data - Updated document revision data
 * @returns {Promise<Object>} Response containing updated document revision
 */
export const updateDocRevision = async (id, data) => {
  return await patchJson(`/doc-revisions/${id}`, data);
};

/**
 * Update controlled details for a document revision (multipart/form-data)
 * @param {string} id - Document revision ID
 * @param {Object} data - Controlled details data
 * @param {string} data.deliverable - Deliverable name
 * @param {File|string} data.deliverable_file - Deliverable file (optional)
 * @param {string} data.revision_code - Revision code
 * @param {string} data.revision_purpose - Revision purpose
 * @param {string} data.revision_notes - Revision notes
 * @param {File|string} data.native_file - Native file
 * @param {File|string} data.pdf_rendition - PDF rendition file
 * @returns {Promise<Object>} Response containing updated document revision
 */
export const updateControlledDetails = async (id, data) => {
  // Check if in demo mode
  if (import.meta.env.VITE_DEMO_MODE !== 'false') {
    await new Promise((resolve) => setTimeout(resolve, 120));
    return { 
      ok: true, 
      demo: true, 
      path: `/doc-revisions/${id}/controlled-details`, 
      method: 'PATCH',
      data 
    };
  }

  // Create FormData for multipart/form-data
  const formData = new FormData();
  
  if (data.deliverable) formData.append('deliverable', data.deliverable);
  if (data.deliverable_file) formData.append('deliverable_file', data.deliverable_file);
  if (data.revision_code) formData.append('revision_code', data.revision_code);
  if (data.revision_purpose) formData.append('revision_purpose', data.revision_purpose);
  if (data.revision_notes) formData.append('revision_notes', data.revision_notes);
  if (data.native_file) formData.append('native_file', data.native_file);
  if (data.pdf_rendition) formData.append('pdf_rendition', data.pdf_rendition);

  const token = localStorage.getItem('access_token');
  const response = await fetch(`/api/doc-revisions/${id}/controlled-details`, {
    method: 'PATCH',
    body: formData,
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`);
  if (response.status === 204) return null;
  return response.json();
};
