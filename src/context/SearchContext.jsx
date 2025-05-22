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
 * Provider component for search functionality - SIMPLIFIED
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

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  // Item detail state
  const [currentItem, setCurrentItem] = useState(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState(null);

  // Cancel tokens for requests
  const itemCancelTokenRef = useRef(null);
  const searchCancelTokenRef = useRef(null); // Add search cancellation
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
   * Fetch details for a specific item
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

      // Check cache first
      const cacheKey = `smithsonian:${itemId}`;
      if (itemDetailsCache.current.has(cacheKey)) {
        setCurrentItem(itemDetailsCache.current.get(cacheKey));
        setItemLoading(false);
        return itemDetailsCache.current.get(cacheKey);
      }

      // Fetch detailed information
      const detailedItem = await getItemDetails(
        "smithsonian",
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
   * Perform a search - loads ALL results at once
   */
  const performSearch = useCallback(
    async (searchQuery, reset = true) => {
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
          setPage(1);
          setResults([]);
          setIsFromCache(false);
        }

        // Check cache first
        const cachedResults =
          searchResultsManager.getCachedResults(normalizedQuery);

        if (cachedResults?.items?.length > 0) {
          // Use cached results
          setResults(cachedResults.items);
          setTotalResults(cachedResults.totalResults);
          setIsFromCache(true);
          setLoading(false);
          return;
        }

        // Not in cache, perform search
        setIsFromCache(false);

        const response = await searchItems(
          "smithsonian",
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

        // Cache the complete results
        if (response.items?.length > 0) {
          searchResultsManager.storeResults(
            normalizedQuery,
            response.items,
            response.total
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
    setPage(1);
    setError(null);
    setTotalResults(0);
    setIsFromCache(false);
    setProgress(null);
    setLoading(false); // Explicitly clear loading state
  }, []);

  /**
   * Refresh search (clear cache and search again)
   */
  const refreshSearch = useCallback(() => {
    if (!query) return;

    searchResultsManager.clearCacheItem(query);
    setIsFromCache(false);
    performSearch(query, true);
  }, [query, performSearch]);

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

    // Pagination
    page,
    pageSize,
    totalPages,
    changePage,

    // Actions
    performSearch,
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
