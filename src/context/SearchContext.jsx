import { createContext, useContext, useState, useCallback } from "react";
import { searchSmithsonian, getItemDetails } from "../api/smithsonianService";
import searchResultsManager from "../utils/searchResultsManager";

const SearchContext = createContext();

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}

export function SearchProvider({ children }) {
  // State variables
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
  const [pageSize] = useState(25); // default to 25 results per page (will change)
  const [hasFullResults, setHasFullResults] = useState(false);
  const [itemsWithImagesCount, setItemsWithImagesCount] = useState(0);
  //  Single item state
  const [currentItem, setCurrentItem] = useState(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState(null);

  /* Fetch details for a specific item */
  const fetchItemDetails = useCallback(
    async (itemId) => {
      if (!itemId) return;

      try {
        setItemLoading(true);
        setItemError(null);

        // Check if we already have basic item data in our cache
        const cachedItem = allCachedItems.find((item) => item.id === itemId);

        // Set basic item data immediately if available
        if (cachedItem) {
          setCurrentItem(cachedItem);
        }

        // Fetch detailed information regardless
        const detailedItem = await getItemDetails(itemId);

        // Update with full details
        setCurrentItem(detailedItem);
        return detailedItem;
      } catch (error) {
        console.error("Error fetching item details:", error);
        setItemError("Failed to load item details. Please try again.");
        // Don't clear currentItem if we previously set it from cache
      } finally {
        setItemLoading(false);
      }
    },
    [allCachedItems]
  );

  /* Search through multiple items */

  // Handle progress updates from the API
  const handleSearchProgress = useCallback((progressData) => {
    setProgress(progressData);

    // Update the image count from progress if available
    if (progressData && progressData.itemsFound) {
      setItemsWithImagesCount(progressData.itemsFound);
    }
  }, []);

  /**
   * Handle search completion with all results
   */
  const handleSearchCompletion = useCallback(
    (allItems, total, searchQuery) => {
      // Store all items for pagination
      setAllCachedItems(allItems);
      setHasFullResults(true);

      // Set the count of items with images
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
      setResults(currentPageItems);
      setHasMore(page * pageSize < allItems.length);

      // Update loading states
      setLoading(false);
      setSearchInProgress(false);
    },
    [page, pageSize]
  );

  /**
   * Perform a search
   */
  const performSearch = useCallback(
    async (searchQuery, reset = true) => {
      if (!searchQuery || !searchQuery.trim()) {
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
          setItemsWithImagesCount(0); // Reset the count when starting a new search
        }

        // Check cache first
        const cachedResults =
          searchResultsManager.getCachedResults(normalizedQuery);

        if (
          cachedResults &&
          cachedResults.items &&
          cachedResults.items.length > 0
        ) {
          // Store all items for pagination
          setAllCachedItems(cachedResults.items);
          setHasFullResults(true);
          setIsFromCache(true);

          // Set the count of items with images from cache
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
        const response = await searchSmithsonian(
          normalizedQuery,
          searchPage,
          pageSize,
          handleSearchProgress,
          handleSearchCompletion
        );

        setTotalResults(response.total);

        // Update the UI with first items
        if (response.items && response.items.length > 0) {
          setResults(reset ? response.items : [...results, ...response.items]);
          setHasMore(true);

          // Update the count with what we have initially
          if (reset) {
            setItemsWithImagesCount(response.allItems.length);
          }
        }

        // Store any initial full results
        if (response.allItems && response.allItems.length > 0) {
          setAllCachedItems(response.allItems);
        }

        // Only update page if items
        if (response.items && response.items.length > 0) {
          setPage(reset ? 1 : page + 1);
        }
      } catch (error) {
        setError("Failed to search collections. Please try again.");
        console.error(error);
        setLoading(false);
        setSearchInProgress(false);
        setProgress(null);
      }
    },
    [page, pageSize, results, handleSearchProgress, handleSearchCompletion]
  );

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
   * Go to a specific page (for pagination)
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
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
