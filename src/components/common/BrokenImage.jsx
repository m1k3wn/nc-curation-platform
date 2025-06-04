import { useState } from "react";

/**
 * @param {string} thumbnailUrl - Thumbnail URL to show as fallback preview
 * @param {string} sourceUrl - URL to link to original source
 * @param {string} imageUrl - URL to link to source's Primary or Full image URL
 * @param {string} sourceName - Name of the source (museum/institution)
 * @param {string} className - CSS classes to apply to the container
 */
export default function BrokenImage({
  thumbnailUrl,
  sourceUrl,
  imageUrl,
  sourceName = "source",
  className = "",
}) {
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-center p-6 ${className}`}
    >
      {/* Try to show thumbnail if available */}
      {thumbnailUrl && !thumbnailError ? (
        <div className="mb-6 max-w-40 max-h-40">
          <img
            src={thumbnailUrl}
            alt="Thumbnail preview"
            className={`max-w-full max-h-full object-contain rounded ${
              thumbnailLoaded ? "opacity-100" : "opacity-50"
            }`}
            onLoad={() => setThumbnailLoaded(true)}
            onError={() => setThumbnailError(true)}
          />
        </div>
      ) : (
        <div className="text-6xl mb-4">📷</div>
      )}

      <p className="text-gray-600 mb-3 text-base font-medium">
        Oops! Couldn't fetch that image...
      </p>
      <p className="text-gray-500 text-sm mb-4">
        Archives can be funny; try checking the source
      </p>

      <div className="flex flex-col gap-2">
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block btn-action"
            onClick={(e) => e.stopPropagation()}
          >
            Try Original Source: {sourceName}
          </a>
        )}

        {imageUrl && (
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block btn-action"
            onClick={(e) => e.stopPropagation()}
          >
            Try Original Image Link
          </a>
        )}
      </div>
    </div>
  );
}
