import { europeanaConfig } from "../config";
import { createApiErrorResult, checkFetchResponse } from "../../utils/apiErrorHandler.js";

const EUROPEANA_API_BASE = "https://api.europeana.eu";

export const europeanaRepository = {
  /**
   * Health check
   */
  async healthCheck() {
    const url = new URL(`${EUROPEANA_API_BASE}/record/v2/search.json`);

    const params = {
      wskey: import.meta.env.VITE_EUROPEANA_API_KEY,
      query: "*",
      rows: "100",
    };

    if (europeanaConfig.requireThumbnails) {
      params.thumbnail = "true";
    }

    if (europeanaConfig.filterToImages) {
      params.qf = "TYPE:IMAGE";
    }

    url.search = new URLSearchParams(params).toString();

    try {
      const response = await fetch(url, {
        timeout: europeanaConfig.requestTimeout,
      });

      const fetchError = checkFetchResponse(response);
      if (fetchError) {
        return createApiErrorResult(fetchError, 'Europeana', 'health_check');
      }

      const data = await response.json();
      console.log("Health Check Success:", data);
      return { success: true, data };
    } catch (error) {
      console.error("Health check error:", error);
      return createApiErrorResult(error, 'Europeana', 'health_check');
    }
  },

  /**
   * Search Europeana records
   * @param {string} query 
   * @param {Object} options 
   * @returns {Promise<Object>} 
   */
  async search(query, options = {}) {
    const {
      rows = 100,
      sort = europeanaConfig.defaultSort,
      start,
    } = options;

    const url = new URL(`${EUROPEANA_API_BASE}/record/v2/search.json`);

    const params = {
      wskey: import.meta.env.VITE_EUROPEANA_API_KEY,
      query: query || "*",
      rows: rows.toString(),
    };

    if (start && start > 0) {
      params.start = start.toString();
    }

    if (sort && sort !== "relevancy") {
      params.sort = sort;
    }

    if (europeanaConfig.requireThumbnails) {
      params.thumbnail = "true";
    }

    if (europeanaConfig.filterToImages) {
      params.qf = "TYPE:IMAGE";
    }

    url.search = new URLSearchParams(params).toString();

    try {
      const response = await fetch(url, {
        timeout: europeanaConfig.requestTimeout,
      });

      const fetchError = checkFetchResponse(response);
      if (fetchError) {
        return createApiErrorResult(fetchError, 'Europeana', 'search');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Europeana search error:", error);
      return createApiErrorResult(error, 'Europeana', 'search');
    }
  },

  /**
   * Get a single record by ID
   * @param {string} recordId 
   * @param {Object} options 
   * @returns {Promise<Object>} 
   */
  async getRecord(recordId, options = {}) {
    const { profile = europeanaConfig.defaultProfile || "rich" } = options;

    const cleanedId = recordId.startsWith("/")
      ? recordId.substring(1)
      : recordId;

    const url = new URL(`${EUROPEANA_API_BASE}/record/v2/${cleanedId}.json`);

    const params = {
      wskey: import.meta.env.VITE_EUROPEANA_API_KEY,
      profile,
    };

    url.search = new URLSearchParams(params).toString();

    try {
      const response = await fetch(url, {
        timeout: europeanaConfig.requestTimeout,
      });

      const fetchError = checkFetchResponse(response);
      if (fetchError) {

        if (fetchError.status === 404) {
          console.warn(`Europeana record ${recordId} not found`);
          return { success: false, error: { type: 'not_found', message: 'Record not found' } };
        }
        if (fetchError.status >= 500) {
          console.warn(`Europeana record ${recordId} server error: ${fetchError.status}`);
          return { success: false, error: { type: 'api', message: 'Record temporarily unavailable' } };
        }
        return createApiErrorResult(fetchError, 'Europeana', 'item');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.warn(`Europeana record ${recordId} failed:`, error.message);
      return createApiErrorResult(error, 'Europeana', 'item');
    }
  }
};