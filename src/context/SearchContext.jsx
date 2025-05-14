// src/context/SearchContext.jsx
import { createContext, useContext, useState } from "react";
import { searchSmithsonian } from "../api/smithsonianService";

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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);

  const performSearch = async (searchQuery, reset = true) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);

      if (reset) {
        setQuery(searchQuery);
        setPage(1);
        setResults([]);
      }

      const searchPage = reset ? 1 : page;
      const response = await searchSmithsonian(searchQuery, searchPage);

      setTotalResults(response.total);

      // If reset, replace results, otherwise append
      setResults((prev) =>
        reset ? response.items : [...prev, ...response.items]
      );

      // Update pagination
      setHasMore(response.items.length > 0 && response.items.length === 10);
      setPage((prev) => (reset ? 1 : prev + 1));
    } catch (err) {
      setError("Failed to search collections. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore && query) {
      performSearch(query, false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setTotalResults(0);
  };

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
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
