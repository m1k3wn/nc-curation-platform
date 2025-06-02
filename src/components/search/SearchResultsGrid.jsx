import { useState, useEffect } from "react";
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

/**
 * @param {Array} results - Pre-filtered and sorted results to display - any sorting/filtering orchestrated in the parent component
 */
export default function SearchResultsGrid({ results = [] }) {
  const { isFromCache, page, changePage, refreshSearch, pageSize, allResults } =
    useSearch();

  const totalFilteredPages = Math.ceil(results.length / pageSize);
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedResults = results.slice(startIdx, endIdx);

  const validPage = page > totalFilteredPages ? 1 : page;

  useEffect(() => {
    if (page > totalFilteredPages && totalFilteredPages > 0) {
      changePage(1);
    }
  }, [page, totalFilteredPages, changePage]);

  return (
    <div>
      {/* Cache indicator */}
      {isFromCache && (
        <CacheIndicator
          itemCount={allResults?.length || 0}
          onRefresh={refreshSearch}
        />
      )}

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {paginatedResults.length} of {results.length} results
        {results.length !== allResults?.length && (
          <span className="text-gray-500">
            {" "}
            (filtered from {allResults?.length} total)
          </span>
        )}
      </div>

      {/* Results Grid */}
      <div
        className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-0"
        role="list"
        aria-label="Search results"
      >
        {paginatedResults.map((item) => (
          <div key={item.id} role="listitem">
            <ItemCard item={item} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalFilteredPages > 1 && (
        <Pagination
          currentPage={validPage}
          totalPages={totalFilteredPages}
          onPageChange={changePage}
        />
      )}
    </div>
  );
}
