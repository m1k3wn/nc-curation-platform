import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SingleItemCard from "../components/search/SingleItemCard";
import { useSearch } from "../context/SearchContext";

/**
 * Displays detailed information about a single item
 */
export default function ItemPage() {
  const { source, id } = useParams();
  const navigate = useNavigate();

  const { currentItem, itemLoading, itemError, fetchItemDetails } = useSearch();

  useEffect(() => {
    if (id) {
      fetchItemDetails(source, id);
    }
  }, [id, source, fetchItemDetails]);

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto px-4 py-2">
      <button
        onClick={handleBackClick}
        className="btn-action mb-2"
        aria-label="Go back to previous page"
      >
        <div className=" flex justify-center items-center">
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
          Back
        </div>
      </button>

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
