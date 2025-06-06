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
  const [warnings, setWarnings] = useState([]);
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

      const result = await getItemDetails(
        source,
        itemId,
        itemCancelTokenRef.current.token
      );

      if (!result.success) {
        setItemError(result.error.message || "Failed to load item details");
        return null;
      }

      itemDetailsCache.current.set(cacheKey, result.data);
      setCurrentItem(result.data);
      return result.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }

      setItemError("Failed to load item details. Please try again.");
    } finally {
      setItemLoading(false);
    }
  }, []);

  // debugs
  const handleSearchProgress = useCallback(
    (progressData) => {
      console.log("🔍 Progress update:", {
        message: progressData.message,
        itemsFound: progressData.itemsFound,
        totalResults: progressData.totalResults,
        currentResultsLength: progressData.currentResults?.length || 0,
        hasCurrentResults: !!progressData.currentResults,
      });

      setProgress(progressData);

      if (progressData.errors && progressData.errors.length > 0) {
        const warningMessages = progressData.errors.map(
          (err) => `${err.error.message}`
        );
        setWarnings(warningMessages);
      }

      if (
        progressData.currentResults &&
        progressData.currentResults.length > 0
      ) {
        console.log(
          "📊 Setting results from progress:",
          progressData.currentResults.length
        );
        setLoading(false);

        setResults((prevResults) => {
          console.log(
            "📊 Previous results:",
            prevResults.length,
            "New results:",
            progressData.currentResults.length
          );
          const existingIds = new Set(prevResults.map((item) => item.id));
          const newItems = progressData.currentResults.filter(
            (item) => !existingIds.has(item.id)
          );

          if (newItems.length > 0) {
            console.log("📊 Adding new items:", newItems.length);
            return [...prevResults, ...newItems];
          }
          console.log("📊 No new items to add");
          return prevResults;
        });

        setTotalResults(progressData.totalResults || 0);
      }
    },
    [query]
  );

  /**
   * Perform unified search across all sources (default method)
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
        setWarnings([]);
        setProgress(null);

        if (reset) {
          setQuery(normalizedQuery);
          setPage(1);
          setResults([]);
          setIsFromCache(false);
        }

        // Check cache
        const smithsonianCache = searchResultsManager.getCachedResults(
          normalizedQuery,
          "smithsonian"
        );
        const europeanaCache = searchResultsManager.getCachedResults(
          normalizedQuery,
          "europeana"
        );

        if (smithsonianCache && europeanaCache) {
          const mergedResults = [
            ...europeanaCache.items,
            ...smithsonianCache.items,
          ];
          const totalResults =
            (smithsonianCache.totalResults || 0) +
            (europeanaCache.totalResults || 0);

          setResults(mergedResults);
          setTotalResults(totalResults);
          setIsFromCache(true);
          setLoading(false);
          return;
        }

        setIsFromCache(false);

        const result = await searchAllSources(
          normalizedQuery,
          handleSearchProgress
        );

        if (searchCancelTokenRef.current?.token.reason) {
          return;
        }

        if (!result.success) {
          setError(result.error.message);
          setResults([]);
          setTotalResults(0);
          setWarnings([]);
          setLoading(false);
          setProgress(null);
          return;
        }

        setResults(result.data.items || []);
        setTotalResults(result.data.total || 0);

        if (result.data.errors && result.data.errors.length > 0) {
          const warningMessages = result.data.errors.map(
            (err) => err.error.message
          );
          setWarnings(warningMessages);
        } else {
          setWarnings([]);
        }

        if (result.smithsonianPromise) {
          backgroundPromiseRef.current = result.smithsonianPromise;

          result.smithsonianPromise
            .then(() => {
              setLoading(false);
              setProgress(null);
            })
            .catch((error) => {
              if (!axios.isCancel(error)) {
                console.error("Background Smithsonian search failed:", error);
                if (results.length === 0) {
                  setWarnings((prev) => [
                    ...prev,
                    "Smithsonian search incomplete",
                  ]);
                }
              }
              setLoading(false);
              setProgress(null);
            });
        } else {
          setLoading(false);
          setProgress(null);
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }
        console.error("Search failed:", error);
        setError("Search temporarily unavailable. Please try again.");
        setLoading(false);
        setProgress(null);
      }
    },
    [handleSearchProgress, results.length]
  );

  /**
   * Perform search on a specific source (Smithsonian or Europeana) - LEGACY
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
        setWarnings([]);
        setProgress(null);

        if (reset) {
          setQuery(normalizedQuery);
          setPage(1);
          setResults([]);
          setIsFromCache(false);
        }

        // Check cache
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

        const result = await searchItems(
          source,
          normalizedQuery,
          handleSearchProgress
        );

        if (searchCancelTokenRef.current?.token.reason) {
          return;
        }

        if (!result.success) {
          setError(result.error.message || "Search failed");
          setResults([]);
          setTotalResults(0);
        } else {
          setResults(result.data.items || []);
          setTotalResults(result.data.total || 0);

          if (result.data.items?.length > 0) {
            searchResultsManager.storeResults(
              normalizedQuery,
              result.data.items,
              result.data.total,
              source
            );
          }
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }
        console.error("Search failed:", error);
        setError("Search temporarily unavailable. Please try again.");
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

      if (window.location.pathname === "/search") {
        const currentUrl = new URL(window.location);
        if (pageNumber === 1) {
          currentUrl.searchParams.delete("page");
        } else {
          currentUrl.searchParams.set("page", pageNumber.toString());
        }

        navigate(currentUrl.pathname + currentUrl.search, { replace: true });
      }

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
    setWarnings([]);
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
    setWarnings([]);

    performUnifiedSearch(query, false);
  }, [query, results, performUnifiedSearch]);

  const clearItemCache = useCallback(() => {
    itemDetailsCache.current.clear();
  }, []);

  const dismissWarnings = useCallback(() => {
    setWarnings([]);
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
    warnings,
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
    dismissWarnings,

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
