// src/pages/SearchResultsPage.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import SearchBar from "../components/search/SearchBar";
import SearchResultsGrid from "../components/search/SearchResultsGrid";
import { useSearch } from "../context/SearchContext";

function SearchResultsPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryParam = searchParams.get("q") || "";

  const {
    query,
    results,
    loading,
    hasMore,
    totalResults,
    performSearch,
    loadMore,
  } = useSearch();

  // Perform search when query param changes
  useEffect(() => {
    if (queryParam && queryParam !== query) {
      performSearch(queryParam);
    }
  }, [queryParam, query, performSearch]);

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Search Box */}
          <div className="mb-8">
            <SearchBar initialValue={queryParam} />
          </div>

          {/* Results Header */}
          {(results.length > 0 || loading) && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">
                Results for "{queryParam}"
              </h1>
              <p className="text-gray-600">
                {loading ? "Searching..." : `${totalResults} results found`}
              </p>
            </div>
          )}

          {/* Results Grid */}
          <SearchResultsGrid results={results} loading={loading} />

          {/* Load More Button - show only if there are more results and not currently loading */}
          {results.length > 0 && hasMore && !loading && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Load More
              </button>
            </div>
          )}

          {/* No Results Message - shown when search is complete but no results */}
          {!loading && queryParam && results.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
              <p className="text-gray-600">
                Try adjusting your search terms or browse our collections.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchResultsPage;
