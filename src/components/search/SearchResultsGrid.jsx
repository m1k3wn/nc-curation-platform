import ItemCard from "./ItemCard";
import Pagination from "./Pagination";
import { useSearch } from "../../context/SearchContext";

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

export default function SearchResultsGrid() {
  const {
    results,
    allResults,
    isFromCache,
    page,
    totalPages,
    changePage,
    refreshSearch,
  } = useSearch();

  return (
    <div>
      {/* Cache indicator and refresh button */}
      {isFromCache && (
        <CacheIndicator
          itemCount={allResults?.length || 0}
          onRefresh={refreshSearch}
        />
      )}

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
