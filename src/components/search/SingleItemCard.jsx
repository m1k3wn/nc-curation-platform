import { useState, useEffect } from "react";
import AddToCollectionButton from "../collections/AddToCollectionButton";
import ImageZoomModal from "../common/ImageZoomModal";
import BrokenImage from "../common/BrokenImage";
import RecordUnavailable from "../common/RecordUnavailable";

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
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  // debug
  const [showDebug, setShowDebug] = useState(false);

  const isDev =
    import.meta.env?.DEV === true || process.env.NODE_ENV === "development";

  const defaultImage =
    "https://toppng.com/uploads/preview/red-x-red-x-11563060665ltfumg5kvi.png";

  // loading timeout
  useEffect(() => {
    if (isLoading && !item) {
      const timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 7000); // 7 second timeout

      return () => clearTimeout(timeoutId);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading, item]);

  // Loading state (only show while actively loading)
  if (!item && isLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading item details...</p>
        </div>
      </div>
    );
  }

  // Error states - use RecordUnavailable component
  if (!item && loadingTimeout) {
    return <RecordUnavailable type="timeout" />;
  }

  if (!item && error) {
    return <RecordUnavailable type="error" error={error} />;
  }

  if (!item) {
    return <RecordUnavailable type="not-found" />;
  }

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
      <div className={`mb-6 ${className}`}>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
          {label}
        </h3>
        <p className="text-gray-900 leading-relaxed">{displayValue}</p>
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
    <div className="min-h-screen bg-white">
      <ImageZoomModal
        isOpen={showFullImage}
        onClose={() => setShowFullImage(false)}
        imageUrl={zoomImage}
        alt={item.title || "Item image"}
      />

      <div className="max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16">
          {/* Image Section */}
          <div className="lg:sticky lg:top-8 lg:h-fit mb-4">
            <div
              className="relative bg-gray-50 aspect-square cursor-pointer group"
              onClick={() => setShowFullImage(true)}
              role="button"
              aria-label="Click to see fullsize image"
            >
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                </div>
              )}

              <img
                src={displayImage}
                alt={item.title || "Item image"}
                className={`w-full h-full object-contain ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                } transition-all duration-300 group-hover:scale-105`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(true);
                }}
              />

              {(imageError || imageTimeout) && (
                <BrokenImage
                  thumbnailUrl={item.media?.thumbnail}
                  sourceUrl={item.url}
                  sourceName={item.museum || "source"}
                />
              )}

              {imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="text-sm font-medium text-gray-900">
                      View Fullsize
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:py-0 px-2 lg:px-0">
            {isLoading && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              </div>
            )}

            {/* Header */}
            <div className="mb-12">
              <div className="flex justify-between items-start gap-6 mb-8">
                <h1 className="text-subtitle text-4xl">
                  {item.title || "Mystery Item"}
                </h1>
                <div className="flex-shrink-0">
                  <AddToCollectionButton item={item} />
                </div>
              </div>

              <div className="space-y-2">
                {hasData(item.museum) && (
                  <p className="text-gray-600 font-medium">{item.museum}</p>
                )}
                {item.dateCreated && (
                  <p className="text-gray-600 font-medium">
                    {item.dateCreated}
                  </p>
                )}
                {hasData(item.creators) && (
                  <div className="space-y-1">
                    {item.creators.map((creator, index) => (
                      <p key={index} className="text-gray-600 font-medium">
                        {creator.role}: {creator.displayText}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Descriptions */}
            {hasData(item.descriptions) && (
              <section className="mb-10">
                <h2 className="text-subtitle font-light text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Description
                </h2>
                {item.descriptions.map((description, index) => (
                  <div key={index} className="mb-6">
                    {description.paragraphs &&
                    description.paragraphs.length > 0 ? (
                      description.paragraphs.map((paragraph, i) => (
                        <p
                          key={i}
                          className="text-gray-900 leading-relaxed mb-4"
                        >
                          {paragraph}
                        </p>
                      ))
                    ) : (
                      <p className="text-gray-900 leading-relaxed">
                        {description.content}
                      </p>
                    )}
                  </div>
                ))}
              </section>
            )}

            {/* debug - not filtering correctly  */}
            {/* Notes */}
            {/* {hasData(item.notes) && (
              <section className="mb-12">
                {item.notes.map((note, index) => (
                  <div key={index} className="mb-6">
                    {note.conceptLabel && (
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                        {note.conceptLabel}
                      </h4>
                    )}
                    <p className="text-gray-900 leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </section>
            )} */}

            {/* Location */}
            {hasData(item.location?.place) && (
              <section className="mb-12">
                {/* <h2 className="text-xl font-light text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  Location
                </h2> */}
                <DisplayField label="Place" value={item.location.place} />
                {hasData(item.location?.geoLocation) && (
                  <DisplayField
                    label="Geographic Location"
                    value={item.location.geoLocation}
                  />
                )}
              </section>
            )}

            {/* Collection Information */}
            {item.collection && (
              <section className="mb-12">
                {/* <h2 className="text-xl font-light text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  Collection Details
                </h2> */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
              </section>
            )}

            {/* Identifiers */}
            <section className="mb-12">
              <div className="space-y-2">
                {hasData(item.identifiers) &&
                  item.identifiers.map((identifier, index) => (
                    <div key={index} className="bg-black px-3 py-2">
                      <div className="text-xs text-white">
                        <span className="text-gray-400">
                          {identifier.label || "Identifier"}:
                        </span>
                        <span className="ml-2">{identifier.content}</span>
                      </div>
                    </div>
                  ))}
                <div className="bg-black px-3 py-2">
                  <div className="text-xs text-white">
                    <span className="text-gray-400">Record ID:</span>
                    <span className="ml-2">{item.id}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* External Link */}
            {item.url && (
              <div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center btn-action"
                >
                  View on {item.museum || "Original Site"}
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Development Debug Section */}
      {isDev && (
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-gray-200">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-4 py-2 bg-gray-900 text-white font-medium rounded-none hover:bg-gray-800 transition-colors"
          >
            {showDebug ? "Hide" : "Show"} Debug Data
          </button>

          {showDebug && (
            <div className="mt-6">
              <pre className="bg-gray-50 p-6 text-xs overflow-auto max-h-96 border border-gray-200">
                {JSON.stringify(item, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
