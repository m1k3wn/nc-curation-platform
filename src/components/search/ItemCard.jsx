import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddToCollectionButton from "../collections/AddToCollectionButton";

/**
 * Card component for displaying a museum item in search results
 *
 * @param {Object} item - The item data to display
 */
export default function ItemCard({ item }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  /**
   * Navigate to item details page
   */
  const handleCardClick = () => {
    navigate(`/item/${item.id}`);
  };

  /**
   * Format dates for display in the card
   * @param {string} dateStr - Raw date string
   * @returns {string} - Formatted date
   */
  function formatDateDisplay(dateStr) {
    if (!dateStr) return "";
    const dateString = String(dateStr);

    // Extract date ranges for decades
    if (dateString.includes("s")) {
      const decadePattern = /\d+s/g;
      const decades = dateString.match(decadePattern);

      // If multiple decades, show range
      if (decades && decades.length > 1) {
        return `${decades[0]}–${decades[decades.length - 1]}`;
      }
    }

    // Truncate long dates
    if (dateString.length > 12) {
      return dateString.substring(0, 12) + "...";
    }
    return dateString;
  }

  // Default placeholder image
  const defaultImage =
    "https://toppng.com/uploads/preview/red-x-red-x-11563060665ltfumg5kvi.png";

  // Use the thumbnail URL provided by the service, or fallback to default
  const imgSrc = item.thumbnailUrl || defaultImage;

  return (
    <div className="break-inside-avoid mb-4">
      <div
        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
        tabIndex="0"
        role="button"
        aria-label={`View details for ${item.title}`}
        onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      >
        {/* Image Container with fixed aspect ratio */}
        <div className="relative bg-gray-100 aspect-[4/3]">
          {/* Loading spinner shown until image loads */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"
                role="status"
              >
                <span className="sr-only">Loading image...</span>
              </div>
            </div>
          )}

          {/* Item image with lazy loading */}
          <img
            src={imgSrc}
            alt={item.title || "Museum item"}
            loading="lazy" // Add native lazy loading
            className={`w-full h-full object-cover transition-opacity duration-500 ease-in ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`} // Update the transition duration and add ease-in
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true); // Set error state when image fails to load
              // If image fails to load, skip loading animation
              if (imgSrc !== defaultImage) {
                setImageLoaded(true);
              }
            }}
          />
          {/*  Displays error if image fails to load */}
          {imageError && imgSrc !== defaultImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm text-gray-500">Image unavailable</span>
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="p-4">
          {/* Title */}
          <h3
            className="font-semibold text-base mb-1 overflow-hidden text-ellipsis line-clamp-3"
            title={item.title}
          >
            {item.title || "Untitled Item"}
          </h3>

          {/* Description */}
          {item.description && (
            <p
              className="text-gray-600 text-sm mb-2 line-clamp-2"
              title={item.description}
            >
              {item.description}
            </p>
          )}

          {/* Source & Date */}
          <div className="flex justify-between text-xs text-gray-500 mb-3">
            <span>{item.source || "Smithsonian"}</span>
            <span>
              {item.datePublished ? formatDateDisplay(item.datePublished) : ""}
            </span>
          </div>

          {/* Action Button */}
          <AddToCollectionButton item={item} />
        </div>
      </div>
    </div>
  );
}
