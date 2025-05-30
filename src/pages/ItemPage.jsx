import { useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import SingleItemCard from "../components/search/SingleItemCard";
import { useSearch } from "../context/SearchContext";

/**
 * Displays detailed information about a single item
 */
export default function ItemPage() {
//  Source from URL parameters
  const { source, id } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
const recordId = searchParams.get('recordId') || id; // Fallback to id if no recordId

  const navigate = useNavigate();

  const { currentItem, itemLoading, itemError, fetchItemDetails } = useSearch();

  const isDev =
    import.meta.env?.DEV === true || process.env.NODE_ENV === "development";

  useEffect(() => {
    if (id) {
      fetchItemDetails(source, recordId);
    }
  }, [id, fetchItemDetails]);

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
        Back
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
