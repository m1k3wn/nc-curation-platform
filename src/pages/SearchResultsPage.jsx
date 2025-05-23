import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import SearchBar from "../components/search/SearchBar";
import SearchResultsGrid from "../components/search/SearchResultsGrid";
import { useSearch } from "../context/SearchContext";

/**
 * Page component for displaying search results
 */
export default function SearchResultsPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryParam = searchParams.get("q") || "";

  const {
    query,
    performSearch,
    allResults,
    totalResults,
    loading,
    error,
    clearSearch,
  } = useSearch();

  // Perform search when query param changes
  useEffect(() => {
    if (queryParam && queryParam !== query) {
      performSearch(queryParam);
    }
  }, [queryParam, query, performSearch]);

  // Cleanup when navigating away from search results page
  useEffect(() => {
    return () => {
      // Only clear if there's an ongoing search when user navigates away
      if (loading) {
        clearSearch();
      }
    };
  }, [loading, clearSearch]);

  /**
   * Get appropriate results message
   */
  const getResultsMessage = () => {
    if (loading) {
      return "Searching...";
    }

    if (totalResults === 0) {
      return "No results found";
    }

    const itemsWithImages = allResults?.length || 0;

    if (itemsWithImages === 0) {
      return "No items with images found";
    }

    return `Found ${itemsWithImages.toLocaleString()} ${
      itemsWithImages === 1 ? "item" : "items"
    } with images (from ${totalResults.toLocaleString()} total results)`;
  };

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Search Box */}
          <div className="mb-8">
            <SearchBar initialValue={queryParam} />
          </div>

          {/* Results Header */}
          {queryParam && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">
                Results for "{queryParam}"
              </h1>
              <p className="text-gray-600" aria-live="polite">
                {getResultsMessage()}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className="bg-red-50 text-red-700 p-4 rounded-lg mb-6"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Results Grid with built-in loading state */}
          <SearchResultsGrid />
        </div>
      </div>
    </div>
  );
}
