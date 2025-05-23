/* Handles all caching of stored search results for multiple sources */
const CACHE_PREFIX = "museum_search_";
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

// Check if Dev mode
const isDevelopment = () => {
  return (
    import.meta.env?.DEV === true ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
  );
};

// Normalizes a search query
const normalizeQuery = (query) => query?.trim().toLowerCase() || "";

// Generates a cache key for a query and source
const getCacheKey = (query, source = "smithsonian") =>
  `${CACHE_PREFIX}${source}_${normalizeQuery(query)}`;

//Safely access localStorage with fallbacks
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

// Manages caching and retrieval of search results
const searchResultsManager = {
  /**
   * Store search results in localStorage
   */
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

    // Try to store in localStorage
    const success = safeLocalStorage.set(cacheKey, JSON.stringify(cacheData));

    // If storage failed due to quota, try clearing old caches and retry
    if (!success) {
      this.clearOldCaches();
      safeLocalStorage.set(cacheKey, JSON.stringify(cacheData));
    }

    if (isDevelopment()) {
      console.log(
        `Cached ${items.length} ${source} items for "${normalizedQuery}"`
      );
    }
  },

  /**
   * Get cached results for a query
   */
  getCachedResults(query, source = "smithsonian") {
    const normalizedQuery = normalizeQuery(query);
    const cacheKey = getCacheKey(normalizedQuery, source);

    const cachedData = safeLocalStorage.get(cacheKey);

    if (!cachedData) {
      return null;
    }

    try {
      const parsedData = JSON.parse(cachedData);

      // Check for expiration
      if (Date.now() - parsedData.timestamp > CACHE_EXPIRY) {
        if (isDevelopment()) {
          console.log(`Cache expired for ${source} "${normalizedQuery}"`);
        }
        safeLocalStorage.remove(cacheKey);
        return null;
      }

      return parsedData;
    } catch (error) {
      console.error("Error parsing cached results:", error);
      safeLocalStorage.remove(cacheKey); // Remove corrupt data
      return null;
    }
  },

  /**
   * Clear cache for a specific query and source
   */
  clearCacheItem(query, source = "smithsonian") {
    const normalizedQuery = normalizeQuery(query);
    const cacheKey = getCacheKey(normalizedQuery, source);
    safeLocalStorage.remove(cacheKey);

    if (isDevelopment()) {
      console.log(`Cleared ${source} cache for "${normalizedQuery}"`);
    }
  },

  /**
   * Clear all caches for a specific source
   */
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

  /**
   * Clear all caches for all sources
   */
  clearAllCaches() {
    const keysToRemove = safeLocalStorage
      .keys()
      .filter((key) => key.startsWith(CACHE_PREFIX));

    keysToRemove.forEach((key) => safeLocalStorage.remove(key));

    if (isDevelopment()) {
      console.log(`Cleared ${keysToRemove.length} cached searches`);
    }
  },

  /**
   * Clear old caches to free up space
   */
  clearOldCaches() {
    const cacheEntries = [];

    // Collect all cache entries with timestamps
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
          // If entry is corrupted, mark it for removal
          cacheEntries.push({
            key,
            timestamp: 0,
            source: "corrupted",
          });
        }
      });

    // Sort by age (oldest first)
    cacheEntries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest 50% of entries
    const entriesToRemove = cacheEntries.slice(
      0,
      Math.floor(cacheEntries.length / 2)
    );

    entriesToRemove.forEach((entry) => safeLocalStorage.remove(entry.key));

    if (isDevelopment()) {
      console.log(`Cleared ${entriesToRemove.length} old cache entries`);
    }
  },

  /**
   * Get cache statistics
   */
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
          const source = data.source || "smithsonian"; // Default to smithsonian for backward compatibility
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
