// Just keep it simple - only Europeana needs the API key in frontend config
export const API_CONFIG = {
  EUROPEANA: {
    BASE_URL: "https://api.europeana.eu/record/v2",
    API_KEY: import.meta.env.VITE_EUROPEANA_API_KEY || "",
  },
};

export const resultsConfig = {
  defaultPageSize: 44, 
}

// Smithsonian config (used by frontend for batching logic)
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