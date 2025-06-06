import recordErrorImage from "../../assets/record-error-image.png";
import searchErrorImage from "../../assets/search-error-image.png";

/**
 * @param {string} message - Error message to display
 * @param {string} title - Optional custom title
 * @param {Function} onRetry - Optional retry callback function
 * @param {string} retryText - Optional custom retry button text
 * @param {string} type - Error type for custom styling/image ('record', 'search', 'network', etc.)
 */
export default function ErrorMessage({
  message,
  title = "Error",
  onRetry,
  retryText = "Try again",
  type,
}) {
  if (!message) return null;

  // Get image and layout based on error type
  const getErrorConfig = (errorType) => {
    switch (errorType) {
      case "record":
        return {
          image: recordErrorImage,
          imageAlt: "Record connection failed",
          imageSize: "w-64 h-64",
          layout: "centered",
        };
      case "search":
        return {
          image: searchErrorImage,
          imageAlt: "Museum search unavailable",
          imageSize: "w-64 h-48",
          layout: "centered",
        };
      default:
        return {
          image: null,
          layout: "standard",
        };
    }
  };

  const config = getErrorConfig(type);

  // Centered layout with image: Full Record or Search errors
  if (config.layout === "centered") {
    return (
      <div className="flex justify-center">
        <div
          className="error-message max-w-md mx-auto"
          role="alert"
          aria-live="assertive"
        >
          {config.image && (
            <div className="flex justify-center mb-4">
              <img
                src={config.image}
                alt={config.imageAlt}
                className={`${config.imageSize} opacity-90 filter brightness-75 sepia-[0.5] saturate-150 hue-rotate-[320deg]`}
              />
            </div>
          )}

          <div className="text-center">
            <div className="mb-6">
              <p className="text-subtitle text-4xl mb-2">{title}</p>
              <p className="error-text">{message}</p>
            </div>

            {onRetry && (
              <button
                onClick={onRetry}
                className="error-retry-btn mx-auto"
                aria-label="Retry the failed operation"
              >
                {retryText}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard layout (for search errors, etc.)
  return (
    <div className="error-message" role="alert" aria-live="assertive">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="error-title">{title}</p>
          <p className="error-text">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="error-retry-btn"
            aria-label="Retry the failed operation"
          >
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
}
