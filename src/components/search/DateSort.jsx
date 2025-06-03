import CustomDropdown from "../common/CustomDropdown";
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
        <span className="text-subtitle text-xl text-inverse mr-2">
          Sort by:
        </span>

        <CustomDropdown
          options={sortOptions}
          value={sortOrder}
          onChange={onSortChange}
        />
      </div>
    </div>
  );
}
