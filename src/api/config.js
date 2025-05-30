export const API_CONFIG = {
  SMITHSONIAN_SERVER: "https://nc-curation-platform.onrender.com",  // Proxy server for Smithsonian API
  EUROPEANA: {
    BASE_URL: "https://api.europeana.eu/record/v2",
    API_KEY: import.meta.env.VITE_EUROPEANA_API_KEY || "",
  },
};

export const supportedSources = ["smithsonian", "europeana"] 

export const resultsConfig = {
  defaultPageSize: 44, 
}

// Smithsonian config 
export const smithsonianConfig = {
  batchSize: 500,
  maxBatches: 10,
  requestTimeout: 30000,
  maxParallelRequests: 10,
};

// Europeana config
export const europeanaConfig = {
  batchSize: 100,              // Items per API call (API seems to limit to 100)
  maxResults: 1000,            // Maximum total results to fetch (basic limit is 1000) 500 is sweet spot
  requestTimeout: 15000, 


  defaultSort: "relevancy",
  defaultProfile: "standard", 
  requireThumbnails: true, 
  filterToImages: true, 
};