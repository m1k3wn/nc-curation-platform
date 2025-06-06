import searchErrorImage from "../../assets/search-error-image.png";

/**
 * Reusable warning message component for partial failures or non-critical issues
 * @param {Array|string} warnings - Array of warning messages or single warning string
 * @param {Function} onDismiss - Optional callback when user dismisses the warning
 * @param {string} title - Optional custom title
 * @param {boolean} hasResults - Whether results are currently visible (affects title)
 */
export default function WarningMessage({
  warnings,
  onDismiss,
  title,
  hasResults = false,
}) {
  if (!warnings) return null;

  const warningList = Array.isArray(warnings) ? warnings : [warnings];

  if (warningList.length === 0) return null;

  const defaultTitle = hasResults
    ? "Partial results shown"
    : "Searching with limited sources";
  const displayTitle = title || defaultTitle;

  return (
    <div className="warning-message" role="alert" aria-live="polite">
      <div className="flex items-start">
        {/* Mini museum icon */}
        <div className="flex-shrink-0 mr-2 mt-0.2">
          <img
            src={searchErrorImage}
            alt="Partial search issue"
            className="w-16 h-12 warning-icon"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="error-title">{displayTitle}</p>
              {warningList.length === 1 ? (
                <p className="error-text">{warningList[0]}</p>
              ) : (
                <ul className="error-text list-disc list-inside">
                  {warningList.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              )}
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="warning-dismiss-btn ml-4"
                aria-label="Dismiss warnings"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
