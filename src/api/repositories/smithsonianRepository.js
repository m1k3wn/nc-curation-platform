// Modified getSmithsonianItemDetails with request cancellation
import axios from "axios";

/* 
Environment-aware base URL
  In production: relative URLs (same server)
  In development: local Express server
*/
const API_URL = import.meta.env.PROD ? "" : "http://localhost:3000";

const smithsonianAPI = axios.create({
  baseURL: API_URL,
});

// Check if in development mode (for logging)
const isDevelopment = () => {
  return (
    import.meta.env?.DEV === true ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
  );
};

/**
 * Fetch details for a specific item by ID
 *
 * @param {string} id - Item ID
 * @param {CancelToken} cancelToken - Optional Axios cancel token
 * @returns {Promise<Object>} - Raw API response
 */
export const getSmithsonianItemDetails = async (id, cancelToken = null) => {
  try {
    // For special characters in IDs
    const encodedId = encodeURIComponent(id);

    // Log to debug
    console.log(`DEBUG TRYING TO FETCH ITEM: ${id}`);

    // Add this debug line
    console.log(`DEBUG: FETCHING ITEM WITH ID: ${id}`);

    // THIS IS THE KEY: Log what's actually being sent to the server
    console.log(
      `Full repository request URL: ${smithsonianAPI.defaults.baseURL}/api/smithsonian/content/${encodedId}`
    );

    // Add the cancel token to the request if provided
    const requestConfig = {};
    if (cancelToken) {
      requestConfig.cancelToken = cancelToken;
    }

    // Add a debounce delay to help with rate limiting
    // This introduces a small artificial delay to spread out requests
    if (isDevelopment()) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    const response = await smithsonianAPI.get(
      `/api/smithsonian/content/${encodedId}`,
      requestConfig
    );

    // If successful, log what worked
    console.log(`SUCCESS! Got data for item: ${id}`);

    return response.data;
  } catch (error) {
    // Check if this is a cancelled request
    if (axios.isCancel(error)) {
      console.log(`Request for item ${id} was cancelled`);
      throw error;
    }

    console.error(
      `Smithsonian Repository: Error fetching item details for ${id}`,
      error
    );
    throw error;
  }
};

// Other existing methods remain unchanged

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
  start = 0,
  rows = 10,
  additionalParams = {}
) => {
  try {
    if (isDevelopment()) {
      console.log(
        `Repository: Searching for "${query}", start=${start}, rows=${rows}`
      );
    }

    const response = await smithsonianAPI.get("/api/smithsonian/search", {
      params: {
        q: query,
        start,
        rows,
        online_media_type: "Images",
        ...additionalParams,
      },
    });

    if (isDevelopment()) {
      console.log(
        `Repository: Received ${
          response.data?.response?.rowCount || 0
        } total results`
      );
    }

    return response.data;
  } catch (error) {
    console.error("Smithsonian Repository: Error searching items", error);
    throw error;
  }
};
