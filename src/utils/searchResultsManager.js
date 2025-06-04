// ================ CONFIG ================
// Handles caching, clearance and retrieval of formatted search results
const CACHE_PREFIX = "museum_search_";
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_ENTRIES = 8;
const CACHE_RETENTION_RATIO = 0.5; // % of cache entries retained when clearing
// ========================================


const normalizeQuery = (query) => query?.trim().toLowerCase() || "";

const getCacheKey = (query, source = "smithsonian") =>
  `${CACHE_PREFIX}${source}_${normalizeQuery(query)}`;

const safeLocalStorage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
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
      return [];
    }
  },
};

const searchResultsManager = {
  getCacheCount() {
    return safeLocalStorage
      .keys()
      .filter(key => key.startsWith(CACHE_PREFIX))
      .length;
  },

  storeResults(query, items, totalResults, source = "smithsonian") {
    const normalizedQuery = normalizeQuery(query);
    const cacheKey = getCacheKey(normalizedQuery, source);

    // Check cache limit 
    if (this.getCacheCount() >= MAX_CACHE_ENTRIES) {
      this.clearOldCaches();
    }

    const cacheData = {
      items,
      totalResults,
      timestamp: Date.now(),
      query: normalizedQuery,
      source,
    };

    let success = safeLocalStorage.set(cacheKey, JSON.stringify(cacheData));
    if (!success) {
      this.clearAllCaches();
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
      safeLocalStorage.remove(cacheKey); 
      return null;
    }
  },

  clearCacheItem(query, source = "smithsonian") {
    const normalizedQuery = normalizeQuery(query);
    const cacheKey = getCacheKey(normalizedQuery, source);
    safeLocalStorage.remove(cacheKey);
  },

  clearAllCaches() {
    const keysToRemove = safeLocalStorage
      .keys()
      .filter((key) => key.startsWith(CACHE_PREFIX));

    keysToRemove.forEach((key) => safeLocalStorage.remove(key));
  },

  clearOldCaches() {
    this.clearExpiredCaches();
    const currentCount = this.getCacheCount();
    const targetCount = Math.floor(MAX_CACHE_ENTRIES * CACHE_RETENTION_RATIO);
    const entriesToRemove = currentCount - targetCount;
    
    if (entriesToRemove <= 0) return;
    
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

    const entriesToRemoveArray = cacheEntries.slice(0, entriesToRemove);
    entriesToRemoveArray.forEach((entry) => safeLocalStorage.remove(entry.key));
  },

  clearExpiredCaches() {
    const expiredKeys = [];
    
    safeLocalStorage
      .keys()
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => {
        try {
          const data = JSON.parse(safeLocalStorage.get(key));
          if (Date.now() - data.timestamp > CACHE_EXPIRY) {
            expiredKeys.push(key);
          }
        } catch (e) {
          expiredKeys.push(key);
        }
      });

    expiredKeys.forEach(key => safeLocalStorage.remove(key));
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