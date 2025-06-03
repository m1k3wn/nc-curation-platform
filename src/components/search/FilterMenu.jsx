import DateSort from "./DateSort";
import DateFilter from "./DateFilter";

/**
 * Main filtering menu
 * @param {object} filters - Current filter state
 * @param {function} onFiltersChange - Callback when any filter changes
 * @param {object} resultCounts - Counts for filter options
 */
export default function FilterMenu({ filters, onFiltersChange, resultCounts }) {
  const handleSortChange = (sortOrder) => {
    onFiltersChange({ ...filters, sortOrder });
  };

  const handleCenturyChange = (selectedCentury) => {
    onFiltersChange({ ...filters, selectedCentury });
  };

  return (
    <div className="bg-main border rounded-lg p-4 mb-4">
      <div className="flex flex-col gap-1">
        {/* Sort Controls */}
        <div className="flex-shrink-0">
          <DateSort
            sortOrder={filters.sortOrder}
            onSortChange={handleSortChange}
          />
        </div>

        {/* Date Filters */}
        <div className="flex-grow">
          <DateFilter
            selectedCentury={filters.selectedCentury}
            onCenturyChange={handleCenturyChange}
            resultCounts={resultCounts.centuries}
          />
        </div>

        {/* Future filters go here */}
      </div>
    </div>
  );
}
