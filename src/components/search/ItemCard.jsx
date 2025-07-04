import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AddToCollectionButton from "../collections/AddToCollectionButton";
import missingRecordImage from "../../assets/missing-image.png";

/**
 * @param {Object} item - The item to display
 * @param {React.ReactNode} actionButtons - Optional additional action buttons
 */
export default function ItemCard({ item, actionButtons }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState(null);
  const [finalError, setFinalError] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/item/${item.source}/${encodeURIComponent(item.id)}`);
  };

  const defaultImage = missingRecordImage;

  // Initialize image source when component mounts or item changes
  useEffect(() => {
    const initialSrc =
      item.media?.thumbnail ||
      item.media?.primaryImage ||
      item.media?.fullImage;
    setCurrentImageSrc(initialSrc);
    setImageLoaded(false);
    setFinalError(false);
  }, [item.id]);

  const handleImageError = () => {
    // If thumbnail failed, try primaryImage
    if (
      currentImageSrc === item.media?.thumbnail &&
      item.media?.primaryImage &&
      item.media?.primaryImage !== item.media?.thumbnail
    ) {
      setCurrentImageSrc(item.media.primaryImage);
      setImageLoaded(false);
      return;
    }

    // If primaryImage failed, try fullImage
    if (
      currentImageSrc === item.media?.primaryImage &&
      item.media?.fullImage &&
      item.media?.fullImage !== item.media?.primaryImage
    ) {
      setCurrentImageSrc(item.media.fullImage);
      setImageLoaded(false);
      return;
    }

    // All real images failed - use placeholder (but only if we're not already showing it)
    if (currentImageSrc !== defaultImage) {
      setCurrentImageSrc(defaultImage);
      setFinalError(true);
      setImageLoaded(false); // Let the placeholder image load properly
      return;
    }

    // Even placeholder failed somehow - just show the broken state
    setFinalError(true);
    setImageLoaded(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Don't render if no image sources at all
  if (!currentImageSrc) {
    return null;
  }

  return (
    <div className="break-inside-avoid mb-4">
      <div
        className="group rounded-sm overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer relative"
        onClick={handleCardClick}
        tabIndex="0"
        role="button"
        aria-label={`View details for ${item.title}`}
        onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      >
        {/* Image Container */}
        <div className="relative bg-gray-100 max-h-96 w-full">
          {/* Loading spinner */}
          {!imageLoaded && (
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
            src={currentImageSrc}
            alt={item.title || "Museum item"}
            loading="lazy"
            className={`w-full h-auto max-h-96 object-cover transition-opacity duration-500 ease-in ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-main/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
            {/* Add to Collection Button */}
            <div className="absolute top-3 right-3">
              <AddToCollectionButton item={item} />
            </div>
            {/* delete button if in collection */}
            {actionButtons && (
              <div className="absolute top-3 left-3">{actionButtons}</div>
            )}
            {/* Title, Source & Date */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-2">
              {/* Title */}
              <h3
                className="text-subtitle text-white text-base mb-1 line-clamp-2"
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
