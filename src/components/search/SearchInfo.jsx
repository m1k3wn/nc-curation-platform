import { useEffect, useState } from "react";

export default function SearchInfo({ progress }) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);

  const itemsFound = progress?.itemsFound || 0;
  const totalResults = progress?.totalResults || 0;
  const message = progress?.message || "";

  const hasResults = itemsFound > 0;
  const isComplete = message.includes("complete");
  const isFetchingMore = hasResults && !isComplete;

  useEffect(() => {
    if (hasResults) {
      setIsVisible(true);
    }
  }, [hasResults]);

  // Auto-hide 3 seconds after completion
  useEffect(() => {
    if (isComplete && isVisible) {
      const timer = setTimeout(() => {
        setShouldHide(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isComplete, isVisible]);

  useEffect(() => {
    if (itemsFound === 0) {
      setIsVisible(false);
      setShouldHide(false);
    }
  }, [itemsFound]);

  if (!progress || shouldHide || !isVisible) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
      <div className="flex items-center justify-between">
        {/* Status Message */}
        <div className="flex items-center">
          {/* Subtle spinner for fetching more */}
          {isFetchingMore && (
            <div className="mr-3">
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Completion checkmark */}
          {isComplete && (
            <div className="mr-3 text-green-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}

          <div>
            {/* Main status text */}
            <div className="text-blue-800 font-medium">
              {isComplete ? (
                <>
                  Search complete:{" "}
                  <span className="font-bold">
                    {itemsFound.toLocaleString()}
                  </span>{" "}
                  results found
                </>
              ) : (
                <>
                  Found{" "}
                  <span className="font-bold">
                    {itemsFound.toLocaleString()}
                  </span>{" "}
                  results, fetching more...
                </>
              )}
            </div>

            {/* Subtitle with total available */}
            {totalResults > itemsFound && (
              <div className="text-blue-600 text-sm mt-1">
                From {totalResults.toLocaleString()} total available in
                collections
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
