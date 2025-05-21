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
 * Loading indicator component
 */
const LoadingIndicator = () => (
  <div className="text-center py-16" role="status" aria-live="polite">
    <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4">
      <span className="sr-only">Loading...</span>
    </div>
    <p className="text-gray-500">Searching...</p>
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
    allItems,
    loading,
    error,
    searchInProgress,
    progress,
    isFromCache,
    page,
    totalPages,
    changePage,
    refreshSearch,
    batchCount,
    totalBatchCount,
  } = useSearch();

  if (error) {
    return <ErrorMessage message={error} />;
  }

  // If there are initial results, but more are loading in the background
  if (searchInProgress && results.length > 0) {
    return (
      <div>
        <SearchProgress
          progress={progress}
          batchCount={batchCount} // Add these
          totalBatchCount={totalBatchCount}
        />

        {/* Results Grid */}
        <div
          className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-0"
          aria-live="polite"
        >
          {results.map((item, itemIndex) => (
            <div key={`${item.id}-${itemIndex}`} role="listitem">
              <ItemCard item={item} />
            </div>
          ))}
        </div>

        <div
          className="mt-4 bg-yellow-50 p-3 rounded text-yellow-700"
          aria-live="polite"
        >
          Loading more results in the background...{batchCount} of{" "}
          {totalBatchCount}
        </div>
      </div>
    );
  }

  // If there are no results with images, show a message
  if (!loading && (!results || results.length === 0)) {
    return <EmptyResults />;
  }

  // If loading initial results, show a loading placeholder
  if (loading && !searchInProgress) {
    return <LoadingIndicator />;
  }

  // Main view - search results grid with pagination
  return (
    <div>
      {/* Cache indicator and refresh button */}
      {isFromCache && (
        <CacheIndicator
          itemCount={allItems?.length || 0}
          onRefresh={refreshSearch}
        />
      )}

      {/* Progress indicator */}
      {searchInProgress && (
        <SearchProgress
          progress={progress}
          batchCount={batchCount}
          totalBatchCount={totalBatchCount}
        />
      )}

      {/* Results count */}
      <div className="mb-4 text-gray-600">
        Showing {results.length} {results.length === 1 ? "item" : "items"}
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
      {results.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={changePage}
        />
      )}
    </div>
  );
}
