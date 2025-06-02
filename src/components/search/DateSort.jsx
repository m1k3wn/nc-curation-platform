/**
 * Date sorting component for search results
 * @param {string} sortOrder - Current sort order ('relevance', 'oldest', 'newest')
 * @param {function} onSortChange - Callback when sort order changes
 */
export default function DateSort({ sortOrder, onSortChange }) {
  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "oldest", label: "Oldest First" },
    { value: "newest", label: "Newest First" },
  ];

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 mr-2">Sort by:</span>

        <select
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
