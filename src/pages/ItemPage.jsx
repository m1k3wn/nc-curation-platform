import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SingleItemCard from "../components/search/SingleItemCard";
import { useSearch } from "../context/SearchContext";

/**
 * Displays detailed information about a single museum item
 */
export default function ItemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentItem, itemLoading, itemError, fetchItemDetails } = useSearch();

  // Check if in development mode
  const isDev =
    import.meta.env?.DEV === true || process.env.NODE_ENV === "development";

  // Fetch item details when ID changes
  useEffect(() => {
    if (id) {
      fetchItemDetails(id);
    }
  }, [id, fetchItemDetails]);

  // Navigate back to previous page
  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={handleBackClick}
        className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
        aria-label="Go back to previous page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Back to results
      </button>

      {/* Development-only debug panel */}
      {/* {isDev && (
        <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
          <h3 className="font-bold">Debug Info:</h3>
          <div>Item ID: {id}</div>
          <div>Has currentItem: {currentItem ? "Yes" : "No"}</div>
          <div>Error: {itemError || "None"}</div>
        </div>
      )} */}

      {/* Error message */}
      {itemError && (
        <div
          className="bg-red-50 text-red-700 p-4 rounded-lg mb-6"
          role="alert"
        >
          <p className="font-medium">Error loading item</p>
          <p>{itemError}</p>
        </div>
      )}

      {/* Loading state */}
      {itemLoading && !currentItem && (
        <div
          className="flex justify-center items-center p-12"
          aria-live="polite"
        >
          <div
            className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"
            role="status"
          >
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}

      {/* Item details card */}
      {currentItem && (
        <SingleItemCard
          item={currentItem}
          isLoading={itemLoading}
          error={itemError}
        />
      )}
    </div>
  );
}
