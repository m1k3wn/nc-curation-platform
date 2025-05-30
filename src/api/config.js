export const API_CONFIG = {
  SMITHSONIAN_SERVER: "https://nc-curation-platform.onrender.com",  // Proxy server for Smithsonian API
  EUROPEANA: {
    BASE_URL: "https://api.europeana.eu/record/v2",
    API_KEY: import.meta.env.VITE_EUROPEANA_API_KEY || "",
  },
};
export const resultsConfig = {
  defaultPageSize: 44, 
}

// Smithsonian config 
export const smithsonianConfig = {
  batchSize: 1000,
  maxBatches: 50,
  requestTimeout: 30000,
  maxParallelRequests: 50,
};

// Europeana config
export const europeanaConfig = {
  batchSize: 1000, 
  maxBatches: 100, 
  defaultPageSize: 24, 
  requestTimeout: 15000, 
  maxParallelRequests: 10, 
  defaultSearchRows: 100,
  maxSearchRows: 1000,

  defaultSort: "relevancy",
  defaultProfile: "standard", 
  requireThumbnails: true, 
  filterToImages: true, 
};