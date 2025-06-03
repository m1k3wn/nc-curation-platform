import { useState, useEffect } from "react";
import ItemCard from "./ItemCard";
import Pagination from "./Pagination";
import { useSearch } from "../../context/SearchContext";
import MasonryGrid from "../layout/MasonryGrid";

const CacheIndicator = ({ itemCount, onRefresh }) => (
  <div className="flex justify-between items-center mb-3 py-1 px-2 bg-accent-primary rounded">
    <span className="text-body text-inverse">
      Showing cached results ({itemCount} {itemCount === 1 ? "item" : "items"})
    </span>
    <button
      onClick={onRefresh}
      className="btn-base text-sm text-inverse py-1 px-3 bg-main hover:bg-inverse hover:text-main"
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
      <MasonryGrid
        items={paginatedResults}
        renderItem={(item) => <ItemCard item={item} />}
        minItemWidth={250}
      />

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
