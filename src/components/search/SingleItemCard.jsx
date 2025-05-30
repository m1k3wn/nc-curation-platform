import { useState, useEffect } from "react";
import AddToCollectionButton from "../collections/AddToCollectionButton";
import ImageZoomModal from "../common/ImageZoomModal";
import BrokenImage from "../common/BrokenImage";

/**
 * @param {Object} item - The item data (unified format)
 * @param {boolean} isLoading - Whether additional item details are being loaded
 * @param {string} error - Error message
 */
export default function SingleItemCard({ item, isLoading, error }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageTimeout, setImageTimeout] = useState(false);

  const [showDebug, setShowDebug] = useState(false);

  const isDev =
    import.meta.env?.DEV === true || process.env.NODE_ENV === "development";

  // Placeholder image
  const defaultImage =
    "https://toppng.com/uploads/preview/red-x-red-x-11563060665ltfumg5kvi.png";

  if (!item) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p>Loading item details...</p>
      </div>
    );
  }

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

  // Image selection
  const displayImage =
    item.media?.primaryImage || item.media?.fullImage || defaultImage;
  const zoomImage =
    item.media?.fullImage || item.media?.primaryImage || defaultImage;

  const DisplayField = ({ label, value, className = "" }) => {
    if (value === undefined || value === null) return null;
    if (Array.isArray(value) && value.length === 0) return null;
    if (value === "") return null;

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

  const hasData = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  };

  // timeout handler
  useEffect(() => {
    if (!imageLoaded && !imageError) {
      const timeoutId = setTimeout(() => {
        setImageTimeout(true);
        setImageError(true);
      }, 6000);

      return () => clearTimeout(timeoutId);
    }
  }, [imageLoaded, imageError]);

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
            {!imageLoaded && !imageError && (
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
                setImageError(true);
                setImageLoaded(true);
              }}
            />

            {/* Show BrokenImage component when image fails or times out */}
            {(imageError || imageTimeout) && (
              <BrokenImage
                thumbnailUrl={item.media?.thumbnail}
                sourceUrl={item.url}
                sourceName={item.museum || "source"}
              />
            )}

            {/* Zoom indicator */}
            {imageLoaded && !imageError && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white p-1 rounded text-xs">
                View Fullsize Image
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

          {/* Date created (unified format) */}
          {item.dateCreated && (
            <div className="mb-3 text-gray-600">
              <span className="font-medium">Created: </span>
              {item.dateCreated}
            </div>
          )}

          {/* Creator Information (unified format) */}
          {hasData(item.creators) && (
            <div className="mb-4">
              {item.creators.map((creator, index) => (
                <DisplayField
                  key={index}
                  label={creator.role || "Creator"}
                  value={creator.displayText}
                />
              ))}
            </div>
          )}

          {/* Descriptions (unified format) */}
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

          {/* Notes (for Europeana concept notes) */}
          {hasData(item.notes) && (
            <div className="col-span-1 md:col-span-2 mb-4">
              <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3">
                Additional Notes
              </h2>
              {item.notes.map((note, index) => (
                <div key={index} className="mb-3">
                  {note.conceptLabel && (
                    <h4 className="text-sm font-medium text-gray-600 mb-1">
                      {note.conceptLabel}
                    </h4>
                  )}
                  <p className="text-gray-800">{note.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Main content sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {/* Location Section (unified format) */}
            {hasData(item.location?.place) && (
              <div className="col-span-1 md:col-span-2 mb-4">
                <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3">
                  Location
                </h2>
                <DisplayField label="Place" value={item.location.place} />
                {hasData(item.location?.geoLocation) && (
                  <DisplayField
                    label="Geographic Location"
                    value={item.location.geoLocation}
                  />
                )}
              </div>
            )}

            {/* Collection Information */}
            <div className="col-span-1 mb-4">
              <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3">
                Collection
              </h2>
              <DisplayField label="Source" value={item.museum} />

              {/* Smithsonian-specific collection info */}
              {item.collection && (
                <>
                  <DisplayField
                    label="Collection Name"
                    value={item.collection.name}
                  />
                  <DisplayField
                    label="Collectors"
                    value={item.collection.collectors}
                  />
                  <DisplayField
                    label="Curator"
                    value={item.collection.curatorName}
                  />
                  <DisplayField
                    label="Collection Types"
                    value={item.collection.types}
                  />
                  <DisplayField
                    label="Biogeographical Region"
                    value={item.collection.bioRegion}
                  />
                </>
              )}
            </div>

            {/* Identifiers (unified format) */}
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
                  value={item.id}
                  className="col-span-1"
                />
              </div>
            </div>
          </div>

          {/* External Link */}
          {item.url && (
            <div className="mt-6">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                View on {item.museum || "Original Site"}
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
                <div className="border border-gray-300 rounded">
                  <pre className="bg-gray-100 p-3 text-xs overflow-auto max-h-96">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
