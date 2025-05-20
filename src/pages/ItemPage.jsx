// ItemPage.jsx - Properly fixed version
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SingleItemCard from "../components/search/SingleItemCard";
import { useSearch } from "../context/SearchContext";

export default function ItemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentItem, itemLoading, itemError, fetchItemDetails } = useSearch();
  const [rawApiResponse, setRawApiResponse] = useState(null);

  // Normal item fetch through the context - only when ID changes
  useEffect(() => {
    if (id) {
      console.log(`Fetching item details for ID: ${id}`);
      fetchItemDetails(id);

      // Reset raw API response when ID changes
      setRawApiResponse(null);
    }
  }, [id, fetchItemDetails]);

  // Set raw API response only when currentItem changes and we have a new item
  useEffect(() => {
    if (currentItem && id) {
      console.log("Processing raw API response from currentItem");

      // Check all possible properties where raw data might be stored
      if (currentItem.rawData) {
        console.log("Found rawData property");
        setRawApiResponse(currentItem.rawData);
      } else if (currentItem._rawApiResponse) {
        console.log("Found _rawApiResponse property");
        setRawApiResponse(currentItem._rawApiResponse);
      } else {
        // If no raw data found, use the currentItem itself for debugging
        console.log("No raw data found, using currentItem for debug");
        setRawApiResponse(currentItem);
      }
    }
  }, [currentItem, id]);

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={handleBackClick}
        className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
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

      {/* Debug panel in development mode */}
      {(import.meta.env?.DEV === true ||
        process.env.NODE_ENV === "development") && (
        <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
          <h3 className="font-bold">Debug Info:</h3>
          <div>Item ID: {id}</div>
          <div>Has currentItem: {currentItem ? "Yes" : "No"}</div>
          <div>Has rawApiResponse: {rawApiResponse ? "Yes" : "No"}</div>
          <div>Error: {itemError || "None"}</div>
        </div>
      )}

      {/* Error message */}
      {itemError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {itemError}
        </div>
      )}

      {/* Loading state */}
      {itemLoading && !currentItem && (
        <div className="flex justify-center items-center p-12">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Item details */}
      {currentItem && (
        <SingleItemCard
          item={currentItem}
          isLoading={itemLoading}
          error={itemError}
          rawApiResponse={rawApiResponse}
        />
      )}
    </div>
  );
}
