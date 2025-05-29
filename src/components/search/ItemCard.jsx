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
  // Europeana
  if (item.source === 'europeana') {
    navigate(`/item/${item.source}/${encodeURIComponent(item.id)}`);

  } else {
    // Smithsonian 
    navigate(`/item/${item.source}/${encodeURIComponent(item.id)}`);
  }
};
  // Default placeholder image
  const defaultImage =
    "https://toppng.com/uploads/preview/red-x-red-x-11563060665ltfumg5kvi.png";

    //  smithsonian isnt retrieveing images for itemcard from thumbnail..... 
  const imgSrc = item.media?.thumbnail || item.media?.primaryImage 
  // || defaultImage;
 
  return (
    <div className="break-inside-avoid mb-4">
      <div
        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative"
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

          {/* Item image*/}
          <img
            src={imgSrc}
            alt={item.title || "Museum item"}
            loading="lazy"
            className={`w-full h-full object-cover transition-opacity duration-500 ease-in ${
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

          {/* Display error if image fails to load */}
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

          {/* Description
          {item.description && (
            <p
              className="text-gray-600 text-sm mb-2 line-clamp-2"
              title={item.description}
            >
              {item.description}
            </p>
          )} */}

          {/* Source & Date */}
          <div className="flex justify-between text-xs text-gray-500 mb-3">
            <span>
              {item.museum ||
                item.source?.institution}
            </span>
            <span>{item.dateCreated || ""}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <AddToCollectionButton item={item} />

            {/* Additional action buttons - remove? */}
            {actionButtons && (
              <div className="flex items-center space-x-1">{actionButtons}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
