import { europeanaConfig } from "../config";

const EUROPEANA_API_BASE = "https://api.europeana.eu";

export const europeanaRepository = {
  /**
   * Health check - simple request to verify API connection
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
      console.log("Health Check Response Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Health Check Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Health Check Success:", data);
      return data;
    } catch (error) {
      console.error("Health check error:", error);
      throw error;
    }
  },

  /**
   * Search Europeana records - now fully configurable
   * @param {string} query - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - API response
   */
  async search(query, options = {}) {
    const {
      rows = 100, // fallback
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

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Search Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }

      const data = await response.json();
 
      return data;
    } catch (error) {
      console.error("Europeana search error:", error);
      throw error;
    }
  },

  /**
   * Get a single record by ID
   * @param {string} recordId - Record ID (e.g., "90402/RP_P_1984_87")
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - API response
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

    // Handle 504 Gateway Timeout and other server errors gracefully
    if (!response.ok) {
      console.warn(`Europeana record ${recordId} failed with status ${response.status} (${response.statusText})`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`Europeana record ${recordId} failed:`, error.message);
    return null;
  }
}
}
//   async getRecord(recordId, options = {}) {
//     const { profile = europeanaConfig.defaultProfile || "rich" } = options;

//     const cleanedId = recordId.startsWith("/")
//       ? recordId.substring(1)
//       : recordId;

//     const url = new URL(`${EUROPEANA_API_BASE}/record/v2/${cleanedId}.json`);

//     const params = {
//       wskey: import.meta.env.VITE_EUROPEANA_API_KEY,
//       profile,
//     };

//     url.search = new URLSearchParams(params).toString();

//     try {
//       const response = await fetch(url, {
//         timeout: europeanaConfig.requestTimeout,
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.log("Record Error Response:", errorText);
//         throw new Error(
//           `HTTP error! status: ${response.status}, body: ${errorText}`
//         );
//       }

//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error("Europeana record error:", error);
//       throw error;
//     }
//   },
// };
