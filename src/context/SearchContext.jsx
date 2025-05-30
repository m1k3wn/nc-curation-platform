import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  // useNavigate,
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
  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [isFromCache, setIsFromCache] = useState(false);
  const [progress, setProgress] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(resultsConfig.defaultPageSize);

  // Item detail state
  const [currentItem, setCurrentItem] = useState(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState(null);

  const itemCancelTokenRef = useRef(null);
  const searchCancelTokenRef = useRef(null);
  const itemDetailsCache = useRef(new Map());

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

  const handleSearchProgress = useCallback((progressData) => {
    setProgress(progressData);
  }, []);

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

        // Check cache for both sources
        const smithsonianCache = searchResultsManager.getCachedResults(
          normalizedQuery,
          "smithsonian"
        );
        const europeanaCache = searchResultsManager.getCachedResults(
          normalizedQuery,
          "europeana"
        );

        // If both are cached, combine and return
        if (
          smithsonianCache?.items?.length > 0 &&
          europeanaCache?.items?.length > 0
        ) {
          const combinedItems = [
            ...europeanaCache.items,
            ...smithsonianCache.items,
          ];
          const combinedTotal =
            smithsonianCache.totalResults + europeanaCache.totalResults;

          setResults(combinedItems);
          setTotalResults(combinedTotal);
          setIsFromCache(true);
          setLoading(false);
          return;
        }

        // If only one is cached, we'll still do unified search for consistency
        // (could be optimized later to use cache + fetch other source)
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

        // Cache results by source for future single-source searches
        if (response.items?.length > 0) {
          // Separate and cache by source
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
              smithsonianItems.length, // We don't have individual totals, so use item count
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
        console.error("Unified search error:", error.message);
      } finally {
        if (!searchCancelTokenRef.current?.token.reason) {
          setLoading(false);
          setProgress(null);
        }
      }
    },
    [handleSearchProgress]
  );

  /**
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
        console.error("Search error:", error.message);
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

      // Use navigate instead of pushState to properly update React Router
      const currentUrl = new URL(window.location);
      if (pageNumber === 1) {
        currentUrl.searchParams.delete("page");
      } else {
        currentUrl.searchParams.set("page", pageNumber.toString());
      }

      // This will trigger useLocation to update in SearchResultsPage
      navigate(currentUrl.pathname + currentUrl.search, { replace: true });

      window.scrollTo(0, 0);
    },
    [navigate]
  );

  const clearSearch = useCallback(() => {
    if (searchCancelTokenRef.current) {
      searchCancelTokenRef.current.cancel("Search cleared");
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

  // Pagination
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
