import axios from "axios";
import { API_CONFIG } from "../config.js";


const smithsonianAPI = axios.create({
  baseURL: API_CONFIG.SMITHSONIAN_SERVER,
});

/**
 * Fetch details for a specific Smithsonian item by ID
 *
 * @param {string} id - Item ID
 * @param {CancelToken} cancelToken - Optional Axios cancel token
 * @returns {Promise<Object>} - Raw API response
 */
export const getSmithsonianItemDetails = async (id, cancelToken = null) => {
  if (!id) {
    throw new Error("Item ID is required");
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

    return response.data;
  } catch (error) {
    // Handle cancelled requests
    if (axios.isCancel(error)) {
 
      throw error;
    }

    console.error(`Error fetching Smithsonian item ${id}:`, error.message);
    throw error;
  }
};

/**
 * Make a search request to the Smithsonian API
 *
 * @param {string} query - Search query
 * @param {number} start - Starting index for pagination
 * @param {number} rows - Number of results to return
 * @param {Object} additionalParams - Any additional query parameters
 * @returns {Promise<Object>} - Raw API response
 */
export const searchSmithsonianItems = async (
  query,
  start,
  rows,
  additionalParams = {}
) => {
  if (!query) {
    throw new Error("Search query is required");
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

    return response.data;
  } catch (error) {
    console.error(`Error searching Smithsonian items: ${error.message}`);
    throw error;
  }
};