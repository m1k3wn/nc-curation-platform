// src/api/config.js
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
