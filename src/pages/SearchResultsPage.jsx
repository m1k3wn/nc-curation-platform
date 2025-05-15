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

  const { query, performSearch, totalResults, loading, error } = useSearch();

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
          {queryParam && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">
                Results for "{queryParam}"
              </h1>
              {!loading && (
                <p className="text-gray-600">
                  {totalResults > 0
                    ? `${totalResults} results found`
                    : "No results found"}
                </p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
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

export default SearchResultsPage;
