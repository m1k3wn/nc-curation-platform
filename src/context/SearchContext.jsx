import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import axios from "axios";
import { searchItems, getItemDetails } from "../api/museumService";
import searchResultsManager from "../utils/searchResultsManager";

/**
 * Context for managing search state and operations across the application
 */
const SearchContext = createContext();

/**
 * Hook to access the search context
 */
export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}

/**
 * Provider component for search functionality - SIMPLIFIED with multi-source support
 */
export function SearchProvider({ children }) {
  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [isFromCache, setIsFromCache] = useState(false);
  const [progress, setProgress] = useState(null);
  const [currentSource, setCurrentSource] = useState("smithsonian"); // Track current source

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  // Item detail state
  const [currentItem, setCurrentItem] = useState(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState(null);

  // Cancel tokens for requests
  const itemCancelTokenRef = useRef(null);
  const searchCancelTokenRef = useRef(null);
  const itemDetailsCache = useRef(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing searches when component unmounts
      if (searchCancelTokenRef.current) {
        searchCancelTokenRef.current.cancel("Component unmounted");
      }
      if (itemCancelTokenRef.current) {
        itemCancelTokenRef.current.cancel("Component unmounted");
      }
    };
  }, []);

  /**
   * Fetch details for a specific item (source auto-detected by museumService)
   */
  const fetchItemDetails = useCallback(async (itemId) => {
    if (!itemId) return;

    // Cancel previous request if exists
    if (itemCancelTokenRef.current) {
      itemCancelTokenRef.current.cancel(
        "Operation canceled due to new request."
      );
    }

    // Create a new cancellation token
    itemCancelTokenRef.current = axios.CancelToken.source();

    try {
      setItemLoading(true);
      setItemError(null);
      setCurrentItem(null);

      // Use simple cache key (museumService will determine source)
      const cacheKey = itemId;
      if (itemDetailsCache.current.has(cacheKey)) {
        setCurrentItem(itemDetailsCache.current.get(cacheKey));
        setItemLoading(false);
        return itemDetailsCache.current.get(cacheKey);
      }

      // Let museumService determine source and fetch details
      const detailedItem = await getItemDetails(
        itemId,
        itemCancelTokenRef.current.token
      );

      // Cache the result
      itemDetailsCache.current.set(cacheKey, detailedItem);

      // Update with full details
      setCurrentItem(detailedItem);
      return detailedItem;
    } catch (error) {
      // Ignore canceled requests
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

  /**
   * Progress callback for search updates
   */
  const handleSearchProgress = useCallback((progressData) => {
    setProgress(progressData);
  }, []);

  /**
   * Perform a search - loads ALL results at once with configurable source
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
        // Cancel previous search if exists
        if (searchCancelTokenRef.current) {
          searchCancelTokenRef.current.cancel("New search started");
        }

        // Create new cancel token for this search
        searchCancelTokenRef.current = axios.CancelToken.source();

        setLoading(true);
        setError(null);
        setProgress(null);

        if (reset) {
          setQuery(normalizedQuery);
          setCurrentSource(source); // Track the source being used
          setPage(1);
          setResults([]);
          setIsFromCache(false);
        }

        // Check cache first (now source-aware)
        const cachedResults = searchResultsManager.getCachedResults(
          normalizedQuery,
          source
        );

        if (cachedResults?.items?.length > 0) {
          // Use cached results
          setResults(cachedResults.items);
          setTotalResults(cachedResults.totalResults);
          setIsFromCache(true);
          setLoading(false);
          return;
        }

        // Not in cache, perform search with specified source
        setIsFromCache(false);

        const response = await searchItems(
          source, // Use the source parameter instead of hardcoded "smithsonian"
          normalizedQuery,
          handleSearchProgress
        );

        // Check if request was cancelled during the search
        if (searchCancelTokenRef.current?.token.reason) {
          return; // Don't update state if cancelled
        }

        // Set complete results
        setResults(response.items || []);
        setTotalResults(response.total || 0);

        // Cache the complete results with source
        if (response.items?.length > 0) {
          searchResultsManager.storeResults(
            normalizedQuery,
            response.items,
            response.total,
            source // Include source in cache storage
          );
        }
      } catch (error) {
        // Ignore canceled requests
        if (axios.isCancel(error)) {
          return;
        }

        setError("Failed to search collections. Please try again.");
        console.error("Search error:", error.message);
      } finally {
        // Only clear loading if this request wasn't cancelled
        if (!searchCancelTokenRef.current?.token.reason) {
          setLoading(false);
          setProgress(null);
        }
      }
    },
    [handleSearchProgress]
  );

  /**
   * Go to a specific page (for pagination display)
   */
  const changePage = useCallback((pageNumber) => {
    if (pageNumber < 1) return;
    setPage(pageNumber);
    window.scrollTo(0, 0);
  }, []);

  /**
   * Clear search and results
   */
  const clearSearch = useCallback(() => {
    // Cancel any ongoing search
    if (searchCancelTokenRef.current) {
      searchCancelTokenRef.current.cancel("Search cleared");
    }

    setQuery("");
    setResults([]);
    setCurrentSource("smithsonian"); // Reset to default source
    setPage(1);
    setError(null);
    setTotalResults(0);
    setIsFromCache(false);
    setProgress(null);
    setLoading(false);
  }, []);

  /**
   * Refresh search (clear cache and search again)
   */
  const refreshSearch = useCallback(() => {
    if (!query) return;

    searchResultsManager.clearCacheItem(query, currentSource); // Clear cache for current source
    setIsFromCache(false);
    performSearch(query, currentSource, true); // Use current source
  }, [query, currentSource, performSearch]);

  /**
   * Clear the item details cache
   */
  const clearItemCache = useCallback(() => {
    itemDetailsCache.current.clear();
  }, []);

  // Calculate pagination for display
  const totalPages = Math.ceil(results.length / pageSize);
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageResults = results.slice(startIdx, endIdx);

  // Context value
  const value = {
    // Search state
    query,
    results: pageResults,
    allResults: results,
    loading,
    error,
    totalResults,
    isFromCache,
    progress,
    currentSource, // Expose current source to components

    // Pagination
    page,
    pageSize,
    totalPages,
    changePage,

    // Actions
    performSearch, // Now accepts source parameter
    clearSearch,
    refreshSearch,

    // Item details
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
