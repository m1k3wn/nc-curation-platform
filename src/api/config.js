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
  batchSize: 150,
  maxBatches: 25,
  defaultPageSize: 25, // results per page
  requestTimeout: 30000,
  // if limiting parallel requests
  // concurrentRequests: 5,
};
