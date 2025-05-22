import { useState } from "react";
import AddToCollectionButton from "../collections/AddToCollectionButton";
import ImageZoomModal from "../common/ImageZoomModal";

/**
 * Displays detailed information about a museum item
 *
 * @param {Object} item - The item data to display
 * @param {boolean} isLoading - Whether additional item details are being loaded
 * @param {string} error - Error message, if any
 */
export default function SingleItemCard({ item, isLoading, error }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugTab, setDebugTab] = useState("formatted");

  // Check if in development mode
  const isDev =
    import.meta.env?.DEV === true || process.env.NODE_ENV === "development";

  // Default placeholder image for missing or failed images
  const defaultImage =
    "https://toppng.com/uploads/preview/red-x-red-x-11563060665ltfumg5kvi.png";

  // If no item is provided, show a loading state
  if (!item) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p>Loading item details...</p>
      </div>
    );
  }

  // If we have an error but no item, show error state
  if (!item && error) {
    return (
      <div
        className="bg-white rounded-lg shadow-md p-8 text-center"
        role="alert"
      >
        <div className="text-red-500 mb-4">❌</div>
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-gray-500 mt-2">Please try again later</p>
      </div>
    );
  }

  // Image selection logic - prefer screen image for main display, full-res for zoom
  const screenImage =
    item.media?.primaryImage || // New structure (already prioritises screen)
    item.screenImageUrl || // Fallback to direct property
    item.imageUrl; // Final fallback to full image

  const fullResImage =
    item.media?.fullImage || // New structure
    item.imageUrl || // Fallback
    screenImage; // Use screen image if no full-res available

  const displayImage = screenImage || defaultImage;
  const zoomImage = fullResImage || screenImage || defaultImage;

  /**
   * Display a field with its label if the value exists
   */
  const DisplayField = ({ label, value, className = "" }) => {
    // Skip empty values
    if (value === undefined || value === null) return null;
    if (Array.isArray(value) && value.length === 0) return null;
    if (value === "") return null;

    // Format the display value
    let displayValue;
    try {
      displayValue = Array.isArray(value) ? value.join(", ") : String(value);
    } catch {
      displayValue = String(value);
    }

    return (
      <div className={`mb-3 ${className}`}>
        <h3 className="text-sm font-semibold text-gray-600">{label}</h3>
        <p className="text-gray-800">{displayValue}</p>
      </div>
    );
  };

  /**
   * Check if a value has data worth displaying
   */
  const hasData = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image Zoom Modal */}
      <ImageZoomModal
        isOpen={showFullImage}
        onClose={() => setShowFullImage(false)}
        imageUrl={zoomImage}
        alt={item.title || "Item image"}
      />

      <div className="md:flex">
        {/* Image Section */}
        <div className="md:w-3/5 lg:w-1/2">
          <div
            className="relative bg-gray-100 aspect-square cursor-pointer"
            onClick={() => setShowFullImage(true)}
            role="button"
            aria-label="Click to see fullsize image"
          >
            {/* Loading spinner */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
            )}

            {/* Item image */}
            <img
              src={displayImage}
              alt={item.title || "Item image"}
              className={`w-full h-full object-contain ${
                imageLoaded ? "opacity-100" : "opacity-0"
              } transition-opacity duration-300`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                if (displayImage !== defaultImage) {
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
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Title and "Add to Collection" button */}
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl font-bold">
              {item.title || "Untitled Item"}
            </h1>
            <AddToCollectionButton item={item} />
          </div>

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
                value={item.museum || "Smithsonian Institution"}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                View on {item.museum || "Smithsonian"}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Development-only debugging section */}
      {isDev && (
        <div className="mt-8 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium"
          >
            {showDebug ? "Hide" : "Show"} Debug Data
          </button>

          {showDebug && (
            <div className="mt-4">
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
              </div>

              <div className="border border-gray-300 rounded">
                <pre className="bg-gray-100 p-3 text-xs overflow-auto max-h-96">
                  {JSON.stringify(item, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
