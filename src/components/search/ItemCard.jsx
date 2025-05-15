// src/components/search/ItemCard.jsx
import { useState } from "react";

function ItemCard({ item }) {
  // Add debugging logs at the beginning of the component
  console.log("Item data:", item);
  console.log("Image URL:", item.imageUrl);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(item.imageUrl); // Track image source in state

  // Default placeholder if no image
  const defaultImage =
    "https://toppng.com/uploads/preview/red-x-red-x-11563060665ltfumg5kvi.png";

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
            onError={() => {
              // If image fails to load, try a secondary URL format
              if (imgSrc !== defaultImage) {
                console.error(`Failed to load image: ${imgSrc}`);

                // Try alternative URL format based on item properties
                if (item.id && item.museum) {
                  // Extract record ID from the item ID if possible
                  const idParts = item.id.split("_");
                  if (idParts.length > 1) {
                    const recordId = idParts[1];
                    const altUrl = `https://ids.si.edu/ids/deliveryService?id=${item.museum}-${recordId}`;
                    console.log(`Trying alternative URL: ${altUrl}`);
                    setImgSrc(altUrl);
                    return; // Give the alternative URL a chance to load
                  }
                }

                // If we've tried alternatives or can't construct one, use default
                setImgSrc(defaultImage);
                setImageLoaded(true);
              }
            }}
          />
        </div>

        {/* Content */}
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
