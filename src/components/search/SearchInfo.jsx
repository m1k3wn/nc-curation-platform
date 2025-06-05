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

  // Auto - hide;
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
    <div className="bg-accent-primary p-2 mb-2 rounded-md">
      <div className="flex items-center justify-between">
        {/* Status Message */}
        <div className="flex items-center">
          {/* Small loading spinner */}
          {isFetchingMore && (
            <div className="mr-3">
              <div className="w-4 h-4 border-2 border-inverse border-t-main rounded-full animate-spin"></div>
            </div>
          )}

          <div>
            {/* Main status text */}
            <div className="text-body text-inverse">
              {isComplete ? (
                <>
                  Search complete:{"text-main"}
                  <span className="">{itemsFound.toLocaleString()}</span>{" "}
                  results found
                </>
              ) : (
                <>
                  Found{" "}
                  <span className="text-bold">
                    {itemsFound.toLocaleString()}
                  </span>{" "}
                  items, fetching more (may take a while)...
                </>
              )}
            </div>
            {/* Subtitle with total available */}
            {/* {totalResults > itemsFound && (
              <div className="text-body text-inverse">
                From {totalResults.toLocaleString()} archvie items
              </div>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
}
