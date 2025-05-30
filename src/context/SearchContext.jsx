import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import {
  searchItems,
  searchAllSources,
  getItemDetails,
} from "../api/museumService";
import searchResultsManager from "../utils/searchResultsManager";
import { resultsConfig } from "../api/config";

const SearchContext = createContext();

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}

export function SearchProvider({ children }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [isFromCache, setIsFromCache] = useState(false);
  const [progress, setProgress] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(resultsConfig.defaultPageSize);

  const [currentItem, setCurrentItem] = useState(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState(null);

  const itemCancelTokenRef = useRef(null);
  const searchCancelTokenRef = useRef(null);
  const itemDetailsCache = useRef(new Map());
  const backgroundPromiseRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (searchCancelTokenRef.current) {
        searchCancelTokenRef.current.cancel("Component unmounted");
      }
      if (itemCancelTokenRef.current) {
        itemCancelTokenRef.current.cancel("Component unmounted");
      }
    };
  }, []);

  const fetchItemDetails = useCallback(async (source, itemId) => {
    if (!itemId) return;

    if (itemCancelTokenRef.current) {
      itemCancelTokenRef.current.cancel(
        "Operation canceled due to new request."
      );
    }
    itemCancelTokenRef.current = axios.CancelToken.source();

    try {
      setItemLoading(true);
      setItemError(null);
      setCurrentItem(null);

      const cacheKey = `${source}_${itemId}`;

      if (itemDetailsCache.current.has(cacheKey)) {
        setCurrentItem(itemDetailsCache.current.get(cacheKey));
        setItemLoading(false);
        return itemDetailsCache.current.get(cacheKey);
      }

      const detailedItem = await getItemDetails(
        source,
        itemId,
        itemCancelTokenRef.current.token
      );

      itemDetailsCache.current.set(cacheKey, detailedItem);

      setCurrentItem(detailedItem);
      return detailedItem;
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }

      setItemError(
        `Failed to load item details. ${error.message || "Please try again."}`
      );
    } finally {
      setItemLoading(false);
    }
  }, []);

  const handleSearchProgress = useCallback(
    (progressData) => {
      // debugging
      console.log("🔍 Progress Data:", progressData);
      setProgress(progressData);

      if (
        progressData.currentResults &&
        progressData.currentResults.length > 0
      ) {
        setLoading(false);

        setResults((prevResults) => {
          const existingIds = new Set(prevResults.map((item) => item.id));
          const newItems = progressData.currentResults.filter(
            (item) => !existingIds.has(item.id)
          );

          if (newItems.length > 0) {
            return [...prevResults, ...newItems];
          }
          return prevResults;
        });

        setTotalResults(progressData.totalResults || 0);
      }

      if (progressData.message && progressData.message.includes("complete")) {
        if (progressData.currentResults && progressData.query) {
          searchResultsManager.storeResults(
            progressData.query,
            progressData.currentResults,
            progressData.totalResults,
            "unified"
          );
        }
      }
    },
    [query]
  );

  /**
   * Perform unified search across all sources (default search method)
   * @param {string} searchQuery - The search term
   * @param {boolean} reset - Whether to reset pagination and state
   */
  const performUnifiedSearch = useCallback(
    async (searchQuery, reset = true) => {
      if (!searchQuery?.trim()) {
        return;
      }

      const normalizedQuery = searchQuery.trim();

      try {
        if (searchCancelTokenRef.current) {
          searchCancelTokenRef.current.cancel("New search started");
        }
        searchCancelTokenRef.current = axios.CancelToken.source();

        setLoading(true);
        setError(null);
        setProgress(null);

        if (reset) {
          setQuery(normalizedQuery);
          setPage(1);
          setResults([]);
          setIsFromCache(false);
        }

        // Check for unified cache
        const unifiedCache = searchResultsManager.getCachedResults(
          normalizedQuery,
          "unified"
        );

        if (unifiedCache?.items?.length > 0) {
          setResults(unifiedCache.items);
          setTotalResults(unifiedCache.totalResults);
          setIsFromCache(true);
          setLoading(false);
          return;
        }

        setIsFromCache(false);

        const response = await searchAllSources(
          normalizedQuery,
          handleSearchProgress
        );

        if (searchCancelTokenRef.current?.token.reason) {
          return;
        }

        setResults(response.items || []);
        setTotalResults(response.total || 0);

        if (response.smithsonianPromise) {
          backgroundPromiseRef.current = response.smithsonianPromise;

          response.smithsonianPromise
            .then(() => {
              setLoading(false);
              setProgress(null);
            })
            .catch((error) => {
              if (!axios.isCancel(error)) {
                console.error("Background Smithsonian search failed:", error);
              }
              setLoading(false);
              setProgress(null);
            });
        } else {
          setLoading(false);
          setProgress(null);
        }

        if (response.items?.length > 0) {
          const smithsonianItems = response.items.filter(
            (item) => item.source === "smithsonian"
          );
          const europeanaItems = response.items.filter(
            (item) => item.source === "europeana"
          );

          if (smithsonianItems.length > 0) {
            searchResultsManager.storeResults(
              normalizedQuery,
              smithsonianItems,
              smithsonianItems.length,
              "smithsonian"
            );
          }

          if (europeanaItems.length > 0) {
            searchResultsManager.storeResults(
              normalizedQuery,
              europeanaItems,
              europeanaItems.length,
              "europeana"
            );
          }
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }
        setError("Failed to search collections. Please try again.");
        setLoading(false);
        setProgress(null);
      }
    },
    [handleSearchProgress]
  );

  /**
   * Perform search on a specific source (Smithsonian or Europeana) - LEGACY
   * @param {string} searchQuery - The search term
   * @param {string} source - API source ("smithsonian" or "europeana")
   * @param {boolean} reset - Whether to reset pagination and state
   */
  const performSearch = useCallback(
    async (searchQuery, source = "smithsonian", reset = true) => {
      if (!searchQuery?.trim()) {
        return;
      }

      const normalizedQuery = searchQuery.trim();

      try {
        if (searchCancelTokenRef.current) {
          searchCancelTokenRef.current.cancel("New search started");
        }
        searchCancelTokenRef.current = axios.CancelToken.source();

        setLoading(true);
        setError(null);
        setProgress(null);

        if (reset) {
          setQuery(normalizedQuery);
          setPage(1);
          setResults([]);
          setIsFromCache(false);
        }

        const cachedResults = searchResultsManager.getCachedResults(
          normalizedQuery,
          source
        );

        if (cachedResults?.items?.length > 0) {
          setResults(cachedResults.items);
          setTotalResults(cachedResults.totalResults);
          setIsFromCache(true);
          setLoading(false);
          return;
        }

        setIsFromCache(false);

        const response = await searchItems(
          source,
          normalizedQuery,
          handleSearchProgress
        );

        if (searchCancelTokenRef.current?.token.reason) {
          return;
        }

        setResults(response.items || []);
        setTotalResults(response.total || 0);

        if (response.items?.length > 0) {
          searchResultsManager.storeResults(
            normalizedQuery,
            response.items,
            response.total,
            source
          );
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        setError("Failed to search collections. Please try again.");
      } finally {
        if (!searchCancelTokenRef.current?.token.reason) {
          setLoading(false);
          setProgress(null);
        }
      }
    },
    [handleSearchProgress]
  );

  const changePage = useCallback(
    (pageNumber) => {
      if (pageNumber < 1) return;
      setPage(pageNumber);

      const currentUrl = new URL(window.location);
      if (pageNumber === 1) {
        currentUrl.searchParams.delete("page");
      } else {
        currentUrl.searchParams.set("page", pageNumber.toString());
      }

      navigate(currentUrl.pathname + currentUrl.search, { replace: true });
      window.scrollTo(0, 0);
    },
    [navigate]
  );

  const clearSearch = useCallback(() => {
    if (searchCancelTokenRef.current) {
      searchCancelTokenRef.current.cancel("Search cleared");
    }

    if (backgroundPromiseRef.current) {
      backgroundPromiseRef.current = null;
    }

    setQuery("");
    setResults([]);
    setPage(1);
    setError(null);
    setTotalResults(0);
    setIsFromCache(false);
    setProgress(null);
    setLoading(false);
  }, []);

  const refreshSearch = useCallback(() => {
    if (!query || results.length === 0) return;

    searchResultsManager.clearCacheItem(query, "unified");

    const sources = [...new Set(results.map((r) => r.source))];
    sources.forEach((source) =>
      searchResultsManager.clearCacheItem(query, source)
    );

    setIsFromCache(false);

    performUnifiedSearch(query, false);
  }, [query, results, performUnifiedSearch]);

  const clearItemCache = useCallback(() => {
    itemDetailsCache.current.clear();
  }, []);

  const totalPages = Math.ceil(results.length / pageSize);
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageResults = results.slice(startIdx, endIdx);

  const value = {
    query,
    results: pageResults,
    allResults: results,
    loading,
    error,
    totalResults,
    isFromCache,
    progress,

    page,
    pageSize,
    totalPages,
    changePage,
    setPage,
    performSearch,
    performUnifiedSearch,
    clearSearch,
    refreshSearch,

    currentItem,
    itemLoading,
    itemError,
    fetchItemDetails,
    clearItemCache,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
