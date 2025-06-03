/**
 * Display when a record fails to load or times out
 * @param {string} type - "timeout" | "error" | "not-found"
 * @param {string} error - Optional error message
 * @param {Function} onRetry - Optional retry function
 */
export default function RecordUnavailable({ type = "error", error, onRetry }) {
  const getContent = () => {
    switch (type) {
      case "timeout":
        return {
          icon: "⏱️",
          title: "Item Details Unavailable",
          message:
            "This item's detailed information is temporarily unavailable. The service may be experiencing issues.",
          suggestion: "You can try refreshing the page or check back later.",
        };
      case "not-found":
        return {
          icon: "🔍",
          title: "Item Not Found",
          message: "The requested item could not be found.",
          suggestion: "Please check the URL or try searching for the item.",
        };
      default: // error
        return {
          icon: "⚠️",
          title: "Error Loading Item",
          message: error || "An error occurred while loading this item.",
          suggestion: "Please try again later.",
        };
    }
  };

  const { icon, title, message, suggestion } = getContent();

  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center"
      role="alert"
    >
      <div className="text-center max-w-md px-6">
        <div className="text-6xl mb-6">{icon}</div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h2>

        <p className="text-gray-600 mb-4 leading-relaxed">{message}</p>

        <p className="text-sm text-gray-500 mb-6">{suggestion}</p>

        <div className="space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>

          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
