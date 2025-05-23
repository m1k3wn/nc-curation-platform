// API Config
export const API_CONFIG = {
  SMITHSONIAN: {
    BASE_URL: "https://api.si.edu/openaccess/api/v1.0",
    API_KEY: import.meta.env.VITE_SMITHSONIAN_API_KEY || "",
  },
  EUROPEANA: {
    BASE_URL: "https://api.europeana.eu/record/v2",
    API_KEY: import.meta.env.VITE_EUROPEANA_API_KEY || "",
  },
};

// Smithsonian batch, page etc sizes
export const smithsonianConfig = {
  batchSize: 300,
  maxBatches: 50,
  defaultPageSize: 24, // results per page
  requestTimeout: 30000,
  maxParallelRequests: 50,
};

// Europeana batch, page etc sizes
export const europeanaConfig = {
  batchSize: 100, // Europeana max is 100 per request
  maxBatches: 20, // Since results are faster, don't need as many
  defaultPageSize: 24, // results per page (match Smithsonian)
  requestTimeout: 15000, // Shorter timeout since API is faster
  maxParallelRequests: 10, // Conservative since we have CORS (no proxy)
  defaultSearchRows: 50, // Default number of items to fetch
  maxSearchRows: 1000, // Max items for comprehensive search

  // Default API parameters
  defaultSort: "relevancy",
  defaultProfile: "standard", // ?
  requireThumbnails: true, // Always request thumbnail: 'true'
  filterToImages: true, // Always add qf: 'TYPE:IMAGE' // Only returns items with type Image
};
