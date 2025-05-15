// src/components/search/SearchResultsGrid.jsx
import ItemCard from "./ItemCard";
import SearchProgress from "./SearchProgress";
import Pagination from "./Pagination";
import { useSearch } from "../../context/SearchContext";

// Extract error message to a separate component
const ErrorMessage = ({ message }) => (
  <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{message}</div>
);

// Extract loading indicator to a separate component
const LoadingIndicator = () => (
  <div className="text-center py-16">
    <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4"></div>
    <p className="text-gray-500">Searching...</p>
  </div>
);

// Extract empty results message to a separate component
const EmptyResults = () => (
  <div className="text-center py-16">
    <p className="text-gray-500 text-lg">No results with images found</p>
    <p className="text-gray-400">
      Try adjusting your search terms or browse another category
    </p>
  </div>
);

// Extract cache indicator to a separate component
const CacheIndicator = ({ itemCount, onRefresh }) => (
  <div className="flex justify-between items-center mb-4 p-2 bg-blue-50 rounded">
    <span className="text-blue-800">
      Showing cached results ({itemCount} items)
    </span>
    <button
      onClick={onRefresh}
      className="px-4 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-sm"
    >
      Refresh
    </button>
  </div>
);

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
  } = useSearch();

  // If there's an error, show the error message
  if (error) {
    return <ErrorMessage message={error} />;
  }

  // Add a special case: showing results while search is still in progress
  if (searchInProgress && results.length > 0) {
    return (
      <div>
        <SearchProgress progress={progress} />

        {/* Results Grid */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-0">
          {results.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>

        <div className="mt-4 bg-yellow-50 p-3 rounded text-yellow-700">
          Loading more results in the background...
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

  // Render the grid of ItemCards
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
      {searchInProgress && <SearchProgress progress={progress} />}

      {/* Results Grid */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-0">
        {results.map((item) => (
          <ItemCard key={item.id} item={item} />
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
