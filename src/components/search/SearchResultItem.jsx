// src/components/search/SearchResultItem.jsx
import { useState } from "react";

function SearchResultItem({ item }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Default placeholder if no image
  const defaultImage =
    "https://via.placeholder.com/300x200/f5f5f5/999999?text=No+Image";

  return (
    <div className="break-inside-avoid mb-4">
      <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        {/* Image Container */}
        <div className="relative bg-gray-100">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={item.imageUrl || defaultImage}
            alt={item.title}
            className={`w-full object-cover ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{ maxHeight: "400px", minHeight: "150px" }}
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {item.description}
          </p>

          {/* Museum & Time Period */}
          <div className="flex justify-between text-xs text-gray-500 mb-3">
            <span className="font-medium">{item.source}</span>
            <span>{item.datePublished}</span>
          </div>

          {/* Action Button */}
          <button className="w-full bg-gray-100 text-gray-800 py-1.5 rounded hover:bg-gray-200 transition-colors text-sm font-medium">
            Add to Collection
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchResultItem;
