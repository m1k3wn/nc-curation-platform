import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddToCollectionButton from "../collections/AddToCollectionButton";

/**
 * @param {Object} item - The item to display
 * @param {React.ReactNode} actionButtons - Optional additional action buttons
 */
export default function ItemCard({ item, actionButtons }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/item/${item.source}/${encodeURIComponent(item.id)}`);
  };

  const defaultImage =
    "https://toppng.com/uploads/preview/red-x-red-x-11563060665ltfumg5kvi.png";

  const imgSrc =
    item.media?.thumbnail || item.media?.primaryImage || defaultImage;

  return (
    <div className="break-inside-avoid mb-4">
      <div
        className="group border border-gray-200 rounded-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer relative"
        onClick={handleCardClick}
        tabIndex="0"
        role="button"
        aria-label={`View details for ${item.title}`}
        onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      >
        {/* Image Container */}
        <div className="relative bg-gray-100 max-h-96 w-full">
          {/* Loading spinner */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center min-h-32">
              <div
                className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"
                role="status"
              >
                <span className="sr-only">Loading image...</span>
              </div>
            </div>
          )}

          {/* Item image */}
          <img
            src={imgSrc}
            alt={item.title || "Museum item"}
            loading="lazy"
            className={`w-full h-auto max-h-96 object-cover transition-opacity duration-500 ease-in ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              if (imgSrc !== defaultImage) {
                setImageLoaded(true);
              }
            }}
          />

          {/* Display error */}
          {imageError && imgSrc !== defaultImage && (
            <div className="absolute inset-0 flex items-center justify-center min-h-32">
              <span className="text-sm text-gray-500">Image unavailable</span>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
            {/* Add to Collection Button */}
            <div className="absolute top-3 right-3">
              <AddToCollectionButton item={item} />
            </div>
            {/* delete button if in collection */}
            {actionButtons && (
              <div className="absolute top-3 left-3">{actionButtons}</div>
            )}
            {/* Title, Source & Date */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
              {/* Title */}
              <h3
                className="font-semibold text-white text-base mb-2 line-clamp-2"
                title={item.title}
              >
                {item.title || "Untitled Item"}
              </h3>

              {/* Source & Date */}
              <div className="flex justify-between text-xs text-gray-200">
                <span className="truncate mr-2">
                  {item.museum || item.source?.institution}
                </span>
                {item.dateCreated && (
                  <span className="whitespace-nowrap">{item.dateCreated}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
