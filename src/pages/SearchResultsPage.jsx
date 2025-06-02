import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  parseYearForFiltering,
  categoriseYear,
  calculateCenturyCounts,
} from "../utils/dateUtils";
import FilterMenu from "../components/search/FilterMenu";
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

const sortByDate = (items, sortOrder) => {
  if (sortOrder === "relevance") return items;

  return [...items].sort((a, b) => {
    const yearA = parseYearForFiltering(a.dateCreated);
    const yearB = parseYearForFiltering(b.dateCreated);

    if (!yearA && !yearB) return 0;
    if (!yearA) return 1;
    if (!yearB) return -1;

    return sortOrder === "newest" ? yearB - yearA : yearA - yearB;
  });
};

const filterByDate = (items, selectedCentury) => {
  if (selectedCentury === "all") return items;

  return items.filter((item) => {
    const year = parseYearForFiltering(item.dateCreated);
    const category = categoriseYear(year);
    return category === selectedCentury;
  });
};

export default function SearchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
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

  const [filters, setFilters] = useState({
    sortOrder: searchParams.get("sort") || "relevance",
    selectedCentury: searchParams.get("century") || "all",
  });

  // Update URL when filters change
  useEffect(() => {
    if (window.location.pathname === "/search") {
      const newParams = new URLSearchParams(location.search);

      if (filters.sortOrder === "relevance") {
        newParams.delete("sort");
      } else {
        newParams.set("sort", filters.sortOrder);
      }

      if (filters.selectedCentury === "all") {
        newParams.delete("century");
      } else {
        newParams.set("century", filters.selectedCentury);
      }

      const newUrl = `/search?${newParams}`;
      if (newUrl !== location.pathname + location.search) {
        navigate(newUrl, { replace: true });
      }
    }
  }, [filters, navigate, location]);

  const handleFiltersChange = (newFilters) => {
    // If filters changed, reset to page 1
    if (
      newFilters.sortOrder !== filters.sortOrder ||
      newFilters.selectedCentury !== filters.selectedCentury
    ) {
      setPage(1);
    }
    setFilters(newFilters);
  };

  useEffect(() => {
    if (queryParam && queryParam !== lastSearchedQuery.current) {
      lastSearchedQuery.current = queryParam;
      performUnifiedSearch(queryParam);
    }
  }, [queryParam, performUnifiedSearch]);

  // Sync URL pagination with context state
  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      if (pageNumber > 0) {
        setPage(pageNumber);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (loading) {
        clearSearch();
      }
    };
  }, []);

  // Process results with filters
  const { processedResults, resultCounts } = useMemo(() => {
    if (!allResults || allResults.length === 0) {
      return {
        processedResults: [],
        resultCounts: { centuries: { all: 0 } },
      };
    }

    // 1. Sort all results first
    const sortedResults = sortByDate(allResults, filters.sortOrder);

    // 2. Filter the sorted results
    const filteredResults = filterByDate(
      sortedResults,
      filters.selectedCentury
    );

    // 3. Calculate counts for filter buttons
    const counts = calculateCenturyCounts(allResults);

    return {
      processedResults: filteredResults,
      resultCounts: counts,
    };
  }, [allResults, filters]);

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

          {/* Initial Loading State */}
          {loading && (!results || results.length === 0) && (
            <SearchProgress progress={progress} />
          )}

          {/* Progressive status bar */}
          {!error && <SearchInfo progress={progress} />}

          {/* Empty State */}
          {!loading && !error && (!results || results.length === 0) && (
            <EmptyResults />
          )}

          {/* Filter Menu & Results */}
          {!loading && !error && results && results.length > 0 && (
            <>
              <FilterMenu
                filters={filters}
                onFiltersChange={handleFiltersChange}
                resultCounts={resultCounts}
              />
              <SearchResultsGrid results={processedResults} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
