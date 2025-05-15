// src/components/search/SearchProgress.jsx
export default function SearchProgress({ progress }) {
  if (!progress) return null;

  const { current, total, itemsFound, message } = progress;
  const percentage = Math.floor((current / total) * 100);

  return (
    <div className="bg-blue-50 p-4 rounded-lg mb-6">
      <div className="flex justify-between mb-2">
        <div className="text-blue-800 font-medium">
          {message || "Searching..."}
        </div>
        <div className="text-blue-700">
          {current}/{total} batches
        </div>
      </div>

      <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <div className="mt-2 text-sm text-blue-700">
        Found {itemsFound} items with images so far
      </div>
    </div>
  );
}
