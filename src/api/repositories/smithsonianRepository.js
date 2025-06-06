import axios from "axios";
import { API_CONFIG } from "../config.js";
import { createApiErrorResult } from "../../utils/apiErrorHandler.js";

const smithsonianAPI = axios.create({
  baseURL: API_CONFIG.SMITHSONIAN_SERVER,
});

/**
 * Fetch details for a specific Smithsonian item by ID
 */
export const getSmithsonianItemDetails = async (id, cancelToken = null) => {
  if (!id) {
    return { 
      success: false, 
      error: { type: 'validation', message: 'Item ID is required' } 
    };
  }

  try {
    const encodedId = encodeURIComponent(id);
    const requestConfig = {};
    if (cancelToken) {
      requestConfig.cancelToken = cancelToken;
    }

    const response = await smithsonianAPI.get(
      `/api/smithsonian/content/${encodedId}`,
      requestConfig
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Error fetching Smithsonian item ${id}:`, error.message);
    return createApiErrorResult(error, 'Smithsonian', 'item');
  }
};

/**
 * Make a search request to the Smithsonian API
 */
export const searchSmithsonianItems = async (
  query,
  start,
  rows,
  additionalParams = {}
) => {
  if (!query) {
    return { 
      success: false, 
      error: { type: 'validation', message: 'Search query is required' } 
    };
  }

  const params = {
    q: query,
    start,
    rows,
    online_media_type: "Images",
    ...additionalParams,
  };

  try {
    const response = await smithsonianAPI.get("/api/smithsonian/search", {
      params
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Error searching Smithsonian items:`, error.message);
    return createApiErrorResult(error, 'Smithsonian', 'search');
  }
};