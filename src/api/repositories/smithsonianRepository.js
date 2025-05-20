import axios from "axios";

/**
 * Environment-aware base URL:
 * - In production: relative URLs (same server)
 * - In development: local Express server
 */
const API_URL = import.meta.env.PROD ? "" : "http://localhost:3000";

/**
 * Axios instance for Smithsonian API requests
 */
const smithsonianAPI = axios.create({
  baseURL: API_URL,
});

/**
 * Check if application is running in development mode
 * @returns {boolean} True if in development mode
 */
const isDevelopment = () => {
  return (
    import.meta.env?.DEV === true ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
  );
};

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
    // For special characters in IDs
    const encodedId = encodeURIComponent(id);

    // Prepare request configuration
    const requestConfig = {};
    if (cancelToken) {
      requestConfig.cancelToken = cancelToken;
    }

    // Log in development mode only
    if (isDevelopment()) {
      console.log(`Fetching Smithsonian item: ${id}`);
    }

    // Make the API request
    const response = await smithsonianAPI.get(
      `/api/smithsonian/content/${encodedId}`,
      requestConfig
    );

    return response.data;
  } catch (error) {
    // Handle cancelled requests
    if (axios.isCancel(error)) {
      if (isDevelopment()) {
        console.log(`Request for item ${id} was cancelled`);
      }
      throw error;
    }

    // Handle other errors
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
  start = 0,
  rows = 10,
  additionalParams = {}
) => {
  if (!query) {
    throw new Error("Search query is required");
  }

  try {
    //  Debug fetch log
    // if (isDevelopment()) {
    //   console.log(
    //     `Searching Smithsonian: "${query}", start=${start}, rows=${rows}`
    //   );
    // }

    const response = await smithsonianAPI.get("/api/smithsonian/search", {
      params: {
        q: query,
        start,
        rows,
        online_media_type: "Images",
        ...additionalParams,
      },
    });

    //  Debug fetch log
    // if (isDevelopment()) {
    //   const resultCount = response.data?.response?.rowCount || 0;
    //   console.log(`Smithsonian search returned ${resultCount} total results`);
    // }

    return response.data;
  } catch (error) {
    console.error(`Error searching Smithsonian items: ${error.message}`);
    throw error;
  }
};
