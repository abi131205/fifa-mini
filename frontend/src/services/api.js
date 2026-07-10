/**
 * @fileoverview Frontend service layer for all backend HTTP requests.
 * Satisfies the requirement to separate concerns (no inline API calls in components).
 */

const API_BASE = '/api';

/**
 * Custom error class for API response failures.
 */
class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Generic request wrapper supporting JSON bodies and basic error handling.
 * @param {string} endpoint Subpath of the API.
 * @param {Object} [options={}] Request configurations.
 * @returns {Promise<any>} Response JSON.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new ApiError(data.message || `Request failed with status ${response.status}`, response.status);
  }

  return data;
}

export const api = {
  /**
   * Fetches the current crowd status of all gates and the active simulation phase.
   * @returns {Promise<{success: boolean, phase: string, gates: Array<{id: string, name: string, density: number}>}>}
   */
  async getStatus() {
    return request('/crowd/status');
  },

  /**
   * Fetches limited/paginated historical logs for crowd density.
   * @param {string} [gateId] Optional gate ID filter.
   * @param {number} [limit=50] Limit number of items returned.
   * @returns {Promise<{success: boolean, page: number, limit: number, count: number, data: Array<Object>}>}
   */
  async getHistory(gateId = '', limit = 50) {
    const query = new URLSearchParams();
    if (gateId) query.set('gateId', gateId);
    query.set('limit', limit.toString());
    return request(`/crowd/history?${query.toString()}`);
  },

  /**
   * Switches the crowd density simulation phase scenario.
   * @param {string} phase Phase name (e.g. PRE_MATCH_RUSH, HALFTIME_CONCOURSE).
   * @returns {Promise<{success: boolean, message: string, phase: string, gates: Array<Object>}>}
   */
  async changePhase(phase) {
    return request('/crowd/phase', {
      method: 'POST',
      body: JSON.stringify({ phase })
    });
  },

  /**
   * Fetches latest active warning and rerouting alerts.
   * @returns {Promise<{success: boolean, count: number, alerts: Array<Object>}>}
   */
  async getAlerts() {
    return request('/alerts');
  },

  /**
   * Sends a chat assistant prompt from stadium staff.
   * @param {string} message Volunteer's message.
   * @returns {Promise<{success: boolean, response: string, sanitizedMessage: string}>}
   */
  async sendChatMessage(message) {
    return request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }
};
