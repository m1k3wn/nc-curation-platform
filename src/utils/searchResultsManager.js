/* Handles all caching of stored search results for multiple sources */
const CACHE_PREFIX = "museum_search_";
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

const normalizeQuery = (query) => query?.trim().toLowerCase() || "";

// Generates a cache key
const getCacheKey = (query, source = "smithsonian") =>
  `${CACHE_PREFIX}${source}_${normalizeQuery(query)}`;

//Safely access localStorage 
const safeLocalStorage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("localStorage access failed:", e);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn("localStorage write failed:", e);
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn("localStorage remove failed:", e);
      return false;
    }
  },
  keys: () => {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }
      return keys;
    } catch (e) {
      console.warn("localStorage keys access failed:", e);
      return [];
    }
  },
};

// Manages caching and retrieval of results
const searchResultsManager = {

  storeResults(query, items, totalResults, source = "smithsonian") {
    const normalizedQuery = normalizeQuery(query);
    const cacheKey = getCacheKey(normalizedQuery, source);

    const cacheData = {
      items,
      totalResults,
      timestamp: Date.now(),
      query: normalizedQuery,
      source,
    };

    const success = safeLocalStorage.set(cacheKey, JSON.stringify(cacheData));

    if (!success) {
      this.clearOldCaches();
      safeLocalStorage.set(cacheKey, JSON.stringify(cacheData));
    }


  },


  getCachedResults(query, source = "smithsonian") {
    const normalizedQuery = normalizeQuery(query);
    const cacheKey = getCacheKey(normalizedQuery, source);

    const cachedData = safeLocalStorage.get(cacheKey);

    if (!cachedData) {
      return null;
    }

    try {
      const parsedData = JSON.parse(cachedData);

      if (Date.now() - parsedData.timestamp > CACHE_EXPIRY) {
      
        safeLocalStorage.remove(cacheKey);
        return null;
      }

      return parsedData;
    } catch (error) {
      console.error("Error parsing cached results:", error);
      safeLocalStorage.remove(cacheKey); 
      return null;
    }
  },


  clearCacheItem(query, source = "smithsonian") {
    const normalizedQuery = normalizeQuery(query);
    const cacheKey = getCacheKey(normalizedQuery, source);
    safeLocalStorage.remove(cacheKey);

    if (isDevelopment()) {
      console.log(`Cleared ${source} cache for "${normalizedQuery}"`);
    }
  },


  clearSourceCaches(source) {
    const sourcePrefix = `${CACHE_PREFIX}${source}_`;
    const keysToRemove = safeLocalStorage
      .keys()
      .filter((key) => key.startsWith(sourcePrefix));

    keysToRemove.forEach((key) => safeLocalStorage.remove(key));

    if (isDevelopment()) {
      console.log(`Cleared ${keysToRemove.length} cached ${source} searches`);
    }
  },


  clearAllCaches() {
    const keysToRemove = safeLocalStorage
      .keys()
      .filter((key) => key.startsWith(CACHE_PREFIX));

    keysToRemove.forEach((key) => safeLocalStorage.remove(key));

    if (isDevelopment()) {
      console.log(`Cleared ${keysToRemove.length} cached searches`);
    }
  },


  clearOldCaches() {
    const cacheEntries = [];

    safeLocalStorage
      .keys()
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .forEach((key) => {
        try {
          const data = JSON.parse(safeLocalStorage.get(key));
          cacheEntries.push({
            key,
            timestamp: data.timestamp || 0,
            source: data.source || "unknown",
          });
        } catch (e) {
          cacheEntries.push({
            key,
            timestamp: 0,
            source: "corrupted",
          });
        }
      });

    cacheEntries.sort((a, b) => a.timestamp - b.timestamp);

    const entriesToRemove = cacheEntries.slice(
      0,
      Math.floor(cacheEntries.length / 2)
    );

    entriesToRemove.forEach((entry) => safeLocalStorage.remove(entry.key));

  },

  getCacheStats() {
    const stats = {
      smithsonian: 0,
      europeana: 0,
      total: 0,
      corrupted: 0,
    };

    safeLocalStorage
      .keys()
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .forEach((key) => {
        try {
          const data = JSON.parse(safeLocalStorage.get(key));
          const source = data.source || "smithsonian";
          if (stats.hasOwnProperty(source)) {
            stats[source]++;
          }
          stats.total++;
        } catch (e) {
          stats.corrupted++;
          stats.total++;
        }
      });

    return stats;
  },
};

export default searchResultsManager;
