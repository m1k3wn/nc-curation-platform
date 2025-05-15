// Updated ItemCard.jsx with simplified image handling
import { useState } from "react";

// Format dates on ItemCard
function formatDateDisplay(dateStr) {
  // Safety check for null/undefined
  if (!dateStr) return "";

  // Force to string
  const dateString = String(dateStr);

  // 1. Simple check for decade patterns
  if (dateString.includes("s")) {
    // Extract all strings that look like decades (number followed by 's')
    const decadePattern = /\d+s/g;
    const decades = dateString.match(decadePattern);

    // If we found multiple decades
    if (decades && decades.length > 1) {
      // Just return first-last
      return `${decades[0]}–${decades[decades.length - 1]}`;
    }
  }

  // 2. For any other date, check if it's too long
  if (dateString.length > 12) {
    return dateString.substring(0, 12) + "...";
  }

  // 3. Otherwise return as is
  return dateString;
}

function ItemCard({ item }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Default placeholder if no image
  const defaultImage =
    "https://toppng.com/uploads/preview/red-x-red-x-11563060665ltfumg5kvi.png";

  // Use the thumbnail URL provided by the service, with fallback to default
  const imgSrc = item.thumbnailUrl || defaultImage;

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
            src={imgSrc}
            alt={item.title}
            className={`w-full h-full object-cover ${
              imageLoaded ? "opacity-100" : "opacity-0"
            } transition-opacity duration-300`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              // If image fails to load, set default and mark as loaded
              if (imgSrc !== defaultImage) {
                console.error(`Image failed to load: ${imgSrc}`);
                setImageLoaded(true); // Skip loading animation for default
              }
            }}
          />
        </div>

        {/* Content section */}
        <div className="p-4">
          {/* Title */}
          <h3
            className="font-semibold text-base mb-1 overflow-hidden text-ellipsis line-clamp-3"
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
            <span>
              {item.datePublished ? formatDateDisplay(item.datePublished) : ""}
            </span>
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
