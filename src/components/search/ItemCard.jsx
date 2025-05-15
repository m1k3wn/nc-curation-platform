// src/components/search/ItemCard.jsx
import { useState } from "react";

function ItemCard({ item }) {
  // Debug logging only in development
  if (process.env.NODE_ENV === "development") {
    console.log("Item data:", item);
    console.log("Thumbnail URL:", item.thumbnailUrl);
    console.log("Full image URL:", item.imageUrl);
  }

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(item.thumbnailUrl); // Use thumbnail URL

  // Default placeholder if no image
  const defaultImage =
    "https://toppng.com/uploads/preview/red-x-red-x-11563060665ltfumg5kvi.png";

  // Handle image error
  const handleImageError = () => {
    // If thumbnail fails, try the full image URL
    if (
      imgSrc === item.thumbnailUrl &&
      item.imageUrl &&
      item.imageUrl !== item.thumbnailUrl
    ) {
      console.error(`Thumbnail failed to load: ${imgSrc}`);
      console.log(`Trying full image URL: ${item.imageUrl}`);
      setImgSrc(item.imageUrl);
      return; // Give the full image URL a chance to load
    }

    // If we've already tried the full image or there isn't one, use default
    if (imgSrc !== defaultImage) {
      console.error(`All image URLs failed to load, using default`);
      setImgSrc(defaultImage);
      setImageLoaded(true); // Skip loading animation for default
    }
  };

  return (
    <div className="break-inside-avoid mb-4">
      <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        {/* Image Container with fixed aspect ratio */}
        <div className="relative bg-gray-100 aspect-[4/3]">
          {/* Loading spinner shown until image loads */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Item image */}
          <img
            src={imgSrc || defaultImage}
            alt={item.title}
            className={`w-full h-full object-cover ${
              imageLoaded ? "opacity-100" : "opacity-0"
            } transition-opacity duration-300`}
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
          />
        </div>

        {/* Content section */}
        <div className="p-4">
          {/* Title */}
          <h3
            className="font-semibold text-lg mb-1 line-clamp-2"
            title={item.title}
          >
            {item.title}
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
            <span>{item.datePublished || ""}</span>
          </div>

          {/* Action Button */}
          <button
            className="w-full bg-gray-100 text-gray-800 py-1.5 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
            onClick={() => console.log("Add to collection clicked", item.id)}
          >
            Add to Collection
          </button>
        </div>
      </div>
    </div>
  );
}

export default ItemCard;
