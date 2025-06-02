import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import SearchBar from "../components/search/SearchBar";
import SearchResultsGrid from "../components/search/SearchResultsGrid";
import SearchProgress from "../components/search/SearchProgress";
import SearchInfo from "../components/search/SearchInfo";
import { useSearch } from "../context/SearchContext";

const ErrorMessage = ({ message }) => (
  <div
    className="bg-red-50 text-red-700 p-4 rounded-lg mb-6"
    role="alert"
    aria-live="assertive"
  >
    {message}
  </div>
);

const EmptyResults = () => (
  <div className="text-center py-16" role="status" aria-live="polite">
    <p className="text-gray-500 text-lg">No results with images found</p>
    <p className="text-gray-400">
      Try adjusting your search terms or browse another category
    </p>
  </div>
);

export default function SearchResultsPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryParam = searchParams.get("q") || "";

  const lastSearchedQuery = useRef("");

  const {
    query,
    performUnifiedSearch,
    results,
    allResults,
    totalResults,
    loading,
    error,
    progress,
    clearSearch,
    setPage,
    page,
  } = useSearch();

  // Handle search query changes
  useEffect(() => {
    if (queryParam && queryParam !== lastSearchedQuery.current) {
      lastSearchedQuery.current = queryParam;
      performUnifiedSearch(queryParam);
    }
  }, [queryParam, performUnifiedSearch]);

  // Sync URL pagination with context state (runs once on mount)
  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      if (pageNumber > 0) {
        setPage(pageNumber);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loading) {
        clearSearch();
      }
    };
  }, []);

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

          {/* Header */}
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

          {/* Error State */}
          {error && <ErrorMessage message={error} />}

          {/* Initial Loading State - spinner */}
          {loading && (!results || results.length === 0) && (
            <SearchProgress progress={progress} />
          )}

          {/* Progressive status bar */}
          {!error && <SearchInfo progress={progress} />}

          {/* Empty State */}
          {!loading && !error && (!results || results.length === 0) && (
            <EmptyResults />
          )}

          {/* Results Grid */}
          {!loading && !error && results && results.length > 0 && (
            <SearchResultsGrid />
          )}
        </div>
      </div>
    </div>
  );
}
