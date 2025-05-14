import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import SearchBar from "../components/search/SearchBar";
import SearchResultsGrid from "../components/search/SearchResultsGrid";
import { useSearch } from "../context/SearchContext";

function SearchResultsPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryParam = searchParams.get("q") || "";

  const { query, results, loading, hasMore, performSearch, loadMore } =
    useSearch();

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
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              Search Results for "{queryParam}"
            </h1>
            <p className="text-gray-600">{results.length} results found</p>
          </div>

          {/* Results Grid */}
          {results.length > 0 ? (
            <>
              <SearchResultsGrid results={results} />

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              {loading ? (
                <div className="flex justify-center">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
                </div>
              ) : queryParam ? (
                <>
                  <h2 className="text-xl font-semibold mb-2">
                    No Results Found
                  </h2>
                  <p className="text-gray-600">
                    Try adjusting your search terms or browse our collections.
                  </p>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchResultsPage;
