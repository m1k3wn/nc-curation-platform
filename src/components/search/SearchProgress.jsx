/**
 * Component to display search progress information
 *
 * @param {Object} progress - Progress data object
 * @param {number} progress.current - Current batch being processed
 * @param {number} progress.total - Total number of batches
 * @param {number} progress.itemsFound - Number of items found so far
 * @param {string} progress.message - Status message
 */
export default function SearchProgress({ progress }) {
  // Don't render anything if no progress data is available
  if (!progress) return null;

  const { current, total, itemsFound, message } = progress;

  // Calculate completion percentage
  const percentage = Math.min(Math.floor((current / total) * 100), 100);

  return (
    <div
      className="bg-blue-50 p-4 rounded-lg mb-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex justify-between mb-2">
        <div className="text-blue-800 font-medium">
          {message || "Searching..."}
        </div>
        <div className="text-blue-700">
          {current}/{total} batches
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 bg-blue-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <div className="mt-2 text-sm text-blue-700">
        Found {itemsFound} {itemsFound === 1 ? "item" : "items"} with images so
        far
      </div>
    </div>
  );
}
