import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
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
 * @returns {Object} Search context value
 */
export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}

/**
 * Provider component for search functionality
 */
export function SearchProvider({ children }) {
  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [allCachedItems, setAllCachedItems] = useState([]);
  const [searchInProgress, setSearchInProgress] = useState(false);
  const [progress, setProgress] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [pageSize] = useState(25);
  const [hasFullResults, setHasFullResults] = useState(false);
  const [itemsWithImagesCount, setItemsWithImagesCount] = useState(0);
  //  Track batch loading progress and prevent refresh on final return
  const [batchCount, setBatchCount] = useState(0);
  const [totalBatchCount, setTotalBatchCount] = useState(0);

  // Item detail state
  const [currentItem, setCurrentItem] = useState(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState(null);

  // Reference to current request cancelation token
  const cancelTokenRef = useRef(null);

  // Simple cache for item details
  const itemDetailsCache = useRef(new Map());

  /**
   * Fetch details for a specific item
   * @param {string} itemId - ID of the item to fetch
   * @returns {Promise<Object>} - Item details
   */
  const fetchItemDetails = useCallback(
    async (itemId) => {
      if (!itemId) return;

      // Cancel previous request if exists
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel("Operation canceled due to new request.");
      }

      // Create a new cancellation token
      cancelTokenRef.current = axios.CancelToken.source();

      try {
        setItemLoading(true);
        setItemError(null);

        // Clear previous item when fetching a new one
        setCurrentItem(null);

        // Check cache first
        const cacheKey = `smithsonian:${itemId}`;
        if (itemDetailsCache.current.has(cacheKey)) {
          setCurrentItem(itemDetailsCache.current.get(cacheKey));
          setItemLoading(false);
          return itemDetailsCache.current.get(cacheKey);
        }

        // Check if we already have basic item data in our cache
        const cachedItem = allCachedItems.find((item) => item.id === itemId);

        // Set basic item data immediately if available
        if (cachedItem) {
          setCurrentItem(cachedItem);
        }

        // Fetch detailed information
        const detailedItem = await getItemDetails(
          "smithsonian",
          itemId,
          cancelTokenRef.current.token
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
    },
    [allCachedItems]
  );

  /**
   * Handle progress updates from the API
   */

  const handleSearchProgress = useCallback((progressData) => {
    setProgress(progressData);

    // Update the image count from progress if available
    if (progressData?.itemsFound) {
      setItemsWithImagesCount(progressData.itemsFound);
    }

    // Simply append new items to results without any tracking or filtering
    if (progressData?.newItems && progressData.newItems.length > 0) {
      setResults((current) => [...current, ...progressData.newItems]);
    }

    // Track batch progress
    if (progressData?.batchesCompleted !== undefined) {
      setBatchCount(progressData.batchesCompleted);
    } else if (progressData?.current !== undefined) {
      setBatchCount(progressData.current);
    }

    if (progressData?.totalBatches !== undefined) {
      setTotalBatchCount(progressData.totalBatches);
    } else if (progressData?.total !== undefined) {
      setTotalBatchCount(progressData.total);
    }
  }, []);
  /**
   * Handle search completion with all results
   */
  /**
   * Handle search completion with all results
   */
  const handleSearchCompletion = useCallback(
    (allItems, total, searchQuery) => {
      // Store all items for pagination
      setAllCachedItems(allItems);
      setHasFullResults(true);
      setItemsWithImagesCount(allItems.length);

      // Cache the results
      searchResultsManager.storeResults(searchQuery, allItems, total);

      // Update the current page of results
      const currentPageItems = searchResultsManager.getPage(
        allItems,
        page,
        pageSize
      );

      // Replace current results with the complete set for the current page
      // setResults(currentPageItems);
      setHasMore(page * pageSize < allItems.length);

      // Update loading states
      setLoading(false);
      setSearchInProgress(false);

      // Update batch counts to show completion
      if (totalBatchCount > 0) {
        setBatchCount(totalBatchCount);
      }
    },
    [page, pageSize, totalBatchCount]
  );

  /**
   * Perform a search
   * @param {string} searchQuery - Query string to search for
   * @param {boolean} reset - Whether to reset current results
   */
  const performSearch = useCallback(
    async (searchQuery, reset = true) => {
      if (!searchQuery?.trim()) {
        return;
      }

      const normalizedQuery = searchQuery.trim();

      try {
        setLoading(true);
        setError(null);

        if (reset) {
          setQuery(normalizedQuery);
          setPage(1);
          setResults([]);
          setHasFullResults(false);
          setIsFromCache(false);
          setItemsWithImagesCount(0);
          setBatchCount(0);
          setTotalBatchCount(0);
        }

        // Check cache first
        const cachedResults =
          searchResultsManager.getCachedResults(normalizedQuery);

        if (cachedResults?.items?.length > 0) {
          // Use cached results
          setAllCachedItems(cachedResults.items);
          setHasFullResults(true);
          setIsFromCache(true);
          setItemsWithImagesCount(cachedResults.items.length);

          // Get the current page
          const searchPage = reset ? 1 : page;
          const pageItems = searchResultsManager.getPage(
            cachedResults.items,
            searchPage,
            pageSize
          );

          // Update state
          setResults(reset ? pageItems : [...results, ...pageItems]);
          setTotalResults(cachedResults.totalResults);
          setHasMore(searchPage * pageSize < cachedResults.items.length);
          setPage(reset ? 1 : page + 1);
          setLoading(false);
          return;
        }

        // Not in cache, perform search
        setSearchInProgress(true);

        const searchPage = reset ? 1 : page;
        const response = await searchItems(
          "smithsonian",
          normalizedQuery,
          searchPage,
          pageSize,
          handleSearchProgress,
          handleSearchCompletion
        );

        setTotalResults(response.total);

        // Update the UI with first items
        if (response.items?.length > 0) {
          setResults(reset ? response.items : [...results, ...response.items]);
          setHasMore(true);

          // Update the count with what we have initially
          if (reset) {
            setItemsWithImagesCount(response.allItems.length);
          }
        }

        // Store any initial full results
        if (response.allItems?.length > 0) {
          setAllCachedItems(response.allItems);
        }

        // Only update page if items
        if (response.items?.length > 0) {
          setPage(reset ? 1 : page + 1);
        }
      } catch (error) {
        setError("Failed to search collections. Please try again.");
        console.error("Search error:", error.message);
      } finally {
        setLoading(false);
        if (!handleSearchCompletion) {
          // If we're not waiting for completion callback
          setSearchInProgress(false);
          setProgress(null);
        }
      }
    },
    [page, pageSize, results, handleSearchProgress, handleSearchCompletion]
  );

  /**
   * Clear the item details cache
   */
  const clearItemCache = useCallback(() => {
    itemDetailsCache.current.clear();
  }, []);

  /**
   * Load the next page of results
   */
  const loadMore = useCallback(() => {
    if (loading || !hasMore || !query) return;

    // If we have all results cached, just get the next page
    if (hasFullResults && allCachedItems.length > 0) {
      const nextPageItems = searchResultsManager.getPage(
        allCachedItems,
        page,
        pageSize
      );

      setResults([...results, ...nextPageItems]);
      setPage(page + 1);
      setHasMore(page * pageSize < allCachedItems.length);
    } else {
      // Otherwise, perform a new search for the next page
      performSearch(query, false);
    }
  }, [
    loading,
    hasMore,
    query,
    hasFullResults,
    allCachedItems,
    page,
    pageSize,
    results,
    performSearch,
  ]);

  /**
   * Go to a specific page
   * @param {number} pageNumber - Page number to go to
   */
  const changePage = useCallback(
    (pageNumber) => {
      if (pageNumber < 1 || loading) return;

      // If we have all results cached, just get that page
      if (hasFullResults && allCachedItems.length > 0) {
        const pageItems = searchResultsManager.getPage(
          allCachedItems,
          pageNumber,
          pageSize
        );

        setResults(pageItems);
        setPage(pageNumber);
        setHasMore(pageNumber * pageSize < allCachedItems.length);

        // Scroll to top
        window.scrollTo(0, 0);
      } else {
        // Reset and search with the new page
        setPage(pageNumber);
        performSearch(query, true);
      }
    },
    [loading, hasFullResults, allCachedItems, pageSize, query, performSearch]
  );

  /**
   * Clear search and results
   */
  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setAllCachedItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setTotalResults(0);
    setHasFullResults(false);
    setIsFromCache(false);
    setItemsWithImagesCount(0);
  }, []);

  /**
   * Refresh search (clear cache and search again)
   */
  const refreshSearch = useCallback(() => {
    if (!query) return;

    // Clear cached results for this query
    searchResultsManager.clearCacheItem(query);
    setIsFromCache(false);

    // Perform fresh search
    performSearch(query, true);
  }, [query, performSearch]);

  // Calculate total pages
  const totalPages = hasFullResults
    ? Math.ceil(allCachedItems.length / pageSize)
    : Math.ceil(totalResults / pageSize);

  // Context value
  const value = {
    query,
    results,
    loading,
    hasMore,
    error,
    totalResults,
    performSearch,
    loadMore,
    clearSearch,
    page,
    pageSize,
    totalPages,
    changePage,
    refreshSearch,
    searchInProgress,
    progress,
    isFromCache,
    allItems: allCachedItems,
    itemsWithImagesCount,
    currentItem,
    itemLoading,
    itemError,
    fetchItemDetails,
    clearItemCache,
    batchCount,
    totalBatchCount,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
