// SingleItemCard.jsx - Fixed version
import { useState } from "react";

export default function SingleItemCard({
  item,
  isLoading,
  error,
  // For debugging and data processing
  rawApiResponse,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugTab, setDebugTab] = useState("formatted");

  if (!item) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p>Loading item details...</p>
      </div>
    );
  }

  // Default placeholder image
  const defaultImage =
    "https://toppng.com/uploads/preview/red-x-red-x-11563060665ltfumg5kvi.png";

  // Only show the loading state when we have no item at all
  if (!item && isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4 mx-auto"></div>
        <p>Loading item details...</p>
      </div>
    );
  }

  // Show error only when we have no item
  if (!item && error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-red-500 mb-4">❌</div>
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-gray-500 mt-2">Please try again later</p>
      </div>
    );
  }

  // If we have an item but also an error, show a warning banner
  const hasWarning = error && item;

  // Use the full image for detailed view - with fallbacks for different structures
  const imgSrc =
    (item.media && item.media.primaryImage) || // New structure
    item.imageUrl || // Original structure
    (item.media && item.media.thumbnail) || // New structure fallback
    item.thumbnailUrl || // Original structure fallback
    defaultImage; // Default fallback

  // Field display helper with safeguards against missing values
  const DisplayField = ({ label, value, className = "" }) => {
    // Additional safety checks
    if (value === undefined || value === null) return null;
    if (Array.isArray(value) && value.length === 0) return null;
    if (value === "") return null;

    // Safe conversion for arrays and other types
    let displayValue;
    try {
      displayValue = Array.isArray(value) ? value.join(", ") : String(value);
    } catch (error) {
      console.error(`Error formatting field ${label}:`, error);
      displayValue = String(value);
    }

    return (
      <div className={`mb-3 ${className}`}>
        <h3 className="text-sm font-semibold text-gray-600">{label}</h3>
        <p className="text-gray-800">{displayValue}</p>
      </div>
    );
  };

  // Returns true if a section has data to display
  const hasData = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Full-size image modal */}
      {showFullImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-5xl max-h-screen">
            <button
              className="absolute top-2 right-2 bg-white rounded-full p-2"
              onClick={() => setShowFullImage(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={imgSrc}
              alt={item.title || "Item image"}
              className="max-w-full max-h-screen object-contain"
            />
          </div>
        </div>
      )}
      <div className="md:flex">
        {/* Image Section */}
        <div className="md:w-3/5 lg:w-1/2">
          <div
            className="relative bg-gray-100 aspect-square cursor-pointer"
            onClick={() => setShowFullImage(true)}
          >
            {/* Loading spinner */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
            )}

            {/* Item image */}
            <img
              src={imgSrc}
              alt={item.title || "Item image"}
              className={`w-full h-full object-contain ${
                imageLoaded ? "opacity-100" : "opacity-0"
              } transition-opacity duration-300`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                if (imgSrc !== defaultImage) {
                  console.error(`Image failed to load: ${imgSrc}`);
                  setImageLoaded(true);
                }
              }}
            />

            {/* Zoom indicator */}
            {imageLoaded && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white p-1 rounded text-xs">
                Click to zoom
              </div>
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className="md:w-2/5 lg:w-1/2 p-6">
          {/* Loading overlay for when detailed data is being fetched */}
          {isLoading && (
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold mb-2">
            {item.title || "Untitled Item"}
          </h1>

          {/* Date created - supports both structures */}
          {(item.dates?.display ||
            item.dateCollected ||
            item.datePublished) && (
            <div className="mb-3">
              {item.dates?.display || item.dateCollected || item.datePublished}
            </div>
          )}

          {/* Creator/Maker Information - supports both structures */}
          {hasData(item.creators) && (
            <div className="mb-4">
              {item.creators.map((creator, index) => (
                <DisplayField
                  key={index}
                  label={creator.role || "Creator"}
                  value={creator.displayText || creator.names?.join(", ")}
                />
              ))}
            </div>
          )}

          {/* Original creator info structure fallback */}
          {!hasData(item.creators) && hasData(item.creatorInfo) && (
            <div className="mb-4">
              {item.creatorInfo.map((creator, index) => (
                <DisplayField
                  key={index}
                  label={creator.label || "Creator"}
                  value={creator.content}
                />
              ))}
            </div>
          )}

          {/* Notes Section - supports both structures */}
          {hasData(item.descriptions) && (
            <div className="col-span-1 md:col-span-2 mb-4">
              <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3">
                Description
              </h2>
              {item.descriptions.map((description, index) => (
                <div key={index} className="mb-4">
                  {description.paragraphs &&
                  description.paragraphs.length > 0 ? (
                    description.paragraphs.map((paragraph, i) => (
                      <p key={i} className="text-gray-800 mb-2">
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-800">{description.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Original notes structure fallback */}
          {!hasData(item.descriptions) && hasData(item.notes) && (
            <div className="col-span-1 md:col-span-2 mb-4">
              <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3">
                Description
              </h2>
              {item.notes.map((note, index) => (
                <div key={index} className="mb-4">
                  {note.content.split("\n\n").map((paragraph, i) => (
                    <p key={i} className="text-gray-800 mb-2">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Main content divided into sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {/* Location Section - supports both structures */}
            {(hasData(item.location?.place) || hasData(item.place)) && (
              <div className="col-span-1 md:col-span-2 mb-4">
                <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3">
                  Location
                </h2>
                <DisplayField
                  label="Place"
                  value={item.location?.place || item.place}
                />
                {hasData(item.location?.coordinates) && (
                  <DisplayField
                    label="Coordinates"
                    value={item.location.coordinates}
                  />
                )}
              </div>
            )}

            {/* Collection Information - supports both structures */}
            <div className="col-span-1 mb-4">
              <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3">
                Collection
              </h2>
              <DisplayField
                label="Source"
                value={item.source?.name || item.source || item.museum}
              />

              <DisplayField
                label="Collectors"
                value={
                  item.collection?.collectors ||
                  (Array.isArray(item.collectors)
                    ? item.collectors.join(", ")
                    : item.collectors)
                }
              />

              <DisplayField
                label="Curator"
                value={
                  item.collection?.curatorName ||
                  (Array.isArray(item.curatorName)
                    ? item.curatorName.join(", ")
                    : item.curatorName)
                }
              />

              <DisplayField
                label="Collection Type"
                value={item.collection?.types || item.collectionTypes}
              />

              <DisplayField
                label="Date Collected"
                value={item.dates?.collected || item.dateCollected}
              />

              <DisplayField
                label="Biogeographical Region"
                value={
                  item.collection?.bioRegion ||
                  (Array.isArray(item.bioRegion)
                    ? item.bioRegion.join(", ")
                    : item.bioRegion)
                }
              />
            </div>

            {/* Identifiers - supports both structures */}
            <div className="col-span-1 md:col-span-2 mb-4">
              <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3">
                Identifiers
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {hasData(item.identifiers) &&
                  item.identifiers.map((identifier, index) => (
                    <DisplayField
                      key={index}
                      label={identifier.label || "Identifier"}
                      value={identifier.content}
                      className="col-span-1"
                    />
                  ))}
                <DisplayField
                  label="Record ID"
                  value={item.recordId || item.id}
                  className="col-span-1"
                />
              </div>
            </div>
          </div>

          {/* External Link - supports both structures */}
          {(item.source?.url || item.url) && (
            <div className="mt-6">
              <a
                href={item.source?.url || item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                View on {item.source?.name || item.source || "Smithsonian"}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Simplified debugging section */}
      {(process.env.NODE_ENV === "development" ||
        import.meta.env?.DEV === true) && (
        <div className="mt-8 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded font-medium"
          >
            {showDebug ? "Hide" : "Show"} Debug Data
          </button>

          {showDebug && (
            <div className="mt-4">
              {/* Simple tabs with no fancy styling */}
              <div className="mb-2 flex gap-2">
                <button
                  onClick={() => setDebugTab("formatted")}
                  className={`px-3 py-1 ${
                    debugTab === "formatted"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  } rounded`}
                >
                  Formatted Data
                </button>
                <button
                  onClick={() => setDebugTab("raw")}
                  className={`px-3 py-1 ${
                    debugTab === "raw"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  } rounded`}
                >
                  Raw API Data
                </button>
              </div>

              {/* Debug content */}
              <div className="border border-gray-300 rounded">
                {debugTab === "formatted" && (
                  <pre className="bg-gray-100 p-3 text-xs overflow-auto max-h-96">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                )}

                {debugTab === "raw" && (
                  <pre className="bg-gray-100 p-3 text-xs overflow-auto max-h-96">
                    {(() => {
                      if (rawApiResponse) {
                        return JSON.stringify(rawApiResponse, null, 2);
                      } else if (item?.rawData) {
                        return JSON.stringify(item.rawData, null, 2);
                      } else if (item?._rawApiResponse) {
                        return JSON.stringify(item._rawApiResponse, null, 2);
                      } else if (error) {
                        return `Error: ${error}\n\nFallback: Using formatted item data for debug\n\n${JSON.stringify(
                          item,
                          null,
                          2
                        )}`;
                      } else {
                        return "Loading raw API data...";
                      }
                    })()}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
