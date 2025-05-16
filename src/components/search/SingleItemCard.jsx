// SingleItemCard.jsx
import { useState } from "react";

export default function SingleItemCard({ item, isLoading }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  //  For debugging only
  const [showDebug, setShowDebug] = useState(false);

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

  // Use the full image for detailed view
  const imgSrc = item.imageUrl || item.thumbnailUrl || defaultImage;

  // Field display helper
  const DisplayField = ({ label, value, className = "" }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;

    const displayValue = Array.isArray(value) ? value.join(", ") : value;

    return (
      <div className={`mb-3 ${className}`}>
        <h3 className="text-sm font-semibold text-gray-600">{label}</h3>
        <p className="text-gray-800">{displayValue}</p>
      </div>
    );
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
              alt={item.title}
              className="max-w-full max-h-screen object-contain"
            />
          </div>
        </div>
      )}

      <div className="md:flex">
        {/* Image Section */}
        <div className="md:w-2/5 lg:w-1/3">
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
              alt={item.title}
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
        <div className="md:w-3/5 lg:w-2/3 p-6">
          {/* Loading overlay for when detailed data is being fetched */}
          {isLoading && (
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Title and Scientific Name */}
          <h1 className="text-2xl font-bold mb-2">{item.title}</h1>

          {item.scientificNames && item.scientificNames.length > 0 && (
            <div className="text-gray-600 italic mb-4">
              {item.scientificNames.map((name, index) => (
                <div key={index}>{name}</div>
              ))}
            </div>
          )}

          {/* Source & Collection Information */}
          <div className="flex flex-wrap justify-between text-sm text-gray-600 mb-6">
            <span>{item.source || item.museum}</span>
            <span>{item.dateCollected || item.datePublished}</span>
          </div>

          {/* Notes Section */}
          {item.notes && item.notes.length > 0 && (
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
            {/* Location Section */}
            <div className="col-span-1 md:col-span-2 mb-4">
              <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3">
                Location
              </h2>
              <DisplayField label="Place" value={item.place} />
            </div>

            {/* Collection Information */}
            <div className="col-span-1 mb-4">
              <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3">
                Collection
              </h2>
              <DisplayField label="Source" value={item.source || item.museum} />
              <DisplayField label="Collectors" value={item.collectors} />
              <DisplayField label="Curator" value={item.curatorName} />
              <DisplayField
                label="Collection Type"
                value={item.collectionTypes}
              />
              <DisplayField label="Date Collected" value={item.dateCollected} />
              <DisplayField
                label="Biogeographical Region"
                value={item.bioRegion}
              />
            </div>

            {/* Taxonomic Information */}
            {/* <div className="col-span-1 mb-4">
              <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3">
                Taxonomy
              </h2>
              {item.taxonomy && (
                <>
                  <DisplayField label="Kingdom" value={item.taxonomy.kingdom} />
                  <DisplayField label="Phylum" value={item.taxonomy.phylum} />
                  <DisplayField label="Order" value={item.taxonomy.order} />
                  <DisplayField label="Family" value={item.taxonomy.family} />
                </>
              )}
              <DisplayField label="Taxonomy Path" value={item.taxonomyPath} />
            </div> */}

            {/* Identifiers */}
            <div className="col-span-1 md:col-span-2 mb-4">
              <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3">
                Identifiers
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {item.identifiers &&
                  item.identifiers.map((identifier, index) => (
                    <DisplayField
                      key={index}
                      label={identifier.label}
                      value={identifier.content}
                      className="col-span-1"
                    />
                  ))}
                <DisplayField
                  label="Record ID"
                  value={item.recordId}
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
                View on Smithsonian
              </a>
            </div>
          )}
        </div>
      </div>
      {/*  debugging - button to show full response object below entry */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            {showDebug ? "Hide" : "Show"} Debug Data
          </button>

          {showDebug && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Raw Response Data:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(item.rawData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
