import ItemCard from "./ItemCard";
import SearchProgress from "./SearchProgress";
import Pagination from "./Pagination";
import { useSearch } from "../../context/SearchContext";

/**
 * Error message component
 */
const ErrorMessage = ({ message }) => (
  <div
    className="bg-red-50 text-red-700 p-4 rounded-lg mb-6"
    role="alert"
    aria-live="assertive"
  >
    {message}
  </div>
);

/**
 * Empty results message component
 */
const EmptyResults = () => (
  <div className="text-center py-16" role="status" aria-live="polite">
    <p className="text-gray-500 text-lg">No results with images found</p>
    <p className="text-gray-400">
      Try adjusting your search terms or browse another category
    </p>
  </div>
);

/**
 * Cache indicator component
 */
const CacheIndicator = ({ itemCount, onRefresh }) => (
  <div className="flex justify-between items-center mb-4 p-2 bg-blue-50 rounded">
    <span className="text-blue-800">
      Showing cached results ({itemCount} {itemCount === 1 ? "item" : "items"})
    </span>
    <button
      onClick={onRefresh}
      className="px-4 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-sm"
      aria-label="Refresh search results"
    >
      Refresh
    </button>
  </div>
);

/**
 * Component to display search results in a grid layout
 */
export default function SearchResultsGrid() {
  const {
    results,
    allResults,
    loading,
    error,
    progress,
    isFromCache,
    page,
    totalPages,
    changePage,
    refreshSearch,
  } = useSearch();

  // Error state
  if (error) {
    return <ErrorMessage message={error} />;
  }

  // Loading state - show progress
  if (loading) {
    return <SearchProgress progress={progress} />;
  }

  // Empty results state
  if (!results || results.length === 0) {
    return <EmptyResults />;
  }

  // Results state - show grid with pagination
  return (
    <div>
      {/* Cache indicator and refresh button */}
      {isFromCache && (
        <CacheIndicator
          itemCount={allResults?.length || 0}
          onRefresh={refreshSearch}
        />
      )}

      {/* Results count */}
      <div className="mb-4 text-gray-600">
        Showing {results.length} {results.length === 1 ? "item" : "items"}
        {allResults?.length > results.length && (
          <span className="text-gray-500 ml-1">
            (page {page} of {totalPages})
          </span>
        )}
      </div>

      {/* Results Grid */}
      <div
        className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-0"
        role="list"
        aria-label="Search results"
      >
        {results.map((item) => (
          <div key={item.id} role="listitem">
            <ItemCard item={item} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={changePage}
        />
      )}
    </div>
  );
}