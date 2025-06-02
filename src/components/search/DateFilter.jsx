import { getCenturyLabel } from "../../utils/dateUtils";

/**
 * Date filtering for search results
 * @param {string} selectedCentury - Currently selected century filter
 * @param {function} onCenturyChange - Callback when century selection changes
 * @param {object} resultCounts - Count of results for each century
 */
export default function DateFilter({
  selectedCentury,
  onCenturyChange,
  resultCounts,
}) {
  const centuries = [
    "all",
    "ancient",
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
    "11th",
    "12th",
    "13th",
    "14th",
    "15th",
    "16th",
    "17th",
    "18th",
    "19th",
    "20th",
    "21st",
    "unknown",
  ];

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700 mr-2">
          Filter by period:
        </span>

        {centuries.map((century) => {
          const count = resultCounts[century] || 0;
          const isActive = selectedCentury === century;

          if (count === 0 && century !== "all") return null;

          return (
            <button
              key={century}
              onClick={() => onCenturyChange(century)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {getCenturyLabel(century)} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
