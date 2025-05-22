import { useState, useEffect, useRef } from "react";

/**
 * Full-screen image zoom modal with zoom controls and pan functionality
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Function to call when closing
 * @param {string} imageUrl - URL of the image to display
 * @param {string} alt - Alt text for the image
 */
export default function ImageZoomModal({
  isOpen,
  onClose,
  imageUrl,
  alt = "Image",
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Reset zoom and pan when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setImageLoaded(false);
      setPan({ x: 0, y: 0 });
      setIsDragging(false);
      panStartRef.current = { x: 0, y: 0 };
    }
  }, [isOpen]);

  // Close modal on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Mouse event handlers for drag functionality
  const handleMouseDown = (e) => {
    if (zoomLevel <= 1) return; // Only allow panning when zoomed in

    e.preventDefault();
    setIsDragging(true);

    // Store the starting positions using refs for immediate access
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
    };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoomLevel <= 1) return;

    e.preventDefault();
    const sensitivity = 1.5;

    // Calculate movement from the original click position
    const deltaX = (e.clientX - dragStartRef.current.x) * sensitivity;
    const deltaY = (e.clientY - dragStartRef.current.y) * sensitivity;

    // Add movement to the original pan position
    const newPan = {
      x: panStartRef.current.x + deltaX,
      y: panStartRef.current.y + deltaY,
    };

    setPan(newPan);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event handlers for mobile drag functionality
  const handleTouchStart = (e) => {
    if (zoomLevel <= 1) return;

    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);

    // Store the starting positions using refs for immediate access
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    panStartRef.current = { ...pan };
  };

  const handleTouchMove = (e) => {
    if (!isDragging || zoomLevel <= 1) return;

    e.preventDefault();
    const touch = e.touches[0];
    const sensitivity = 1.5;

    // Calculate movement from the original touch position
    const deltaX = (touch.clientX - dragStartRef.current.x) * sensitivity;
    const deltaY = (touch.clientY - dragStartRef.current.y) * sensitivity;

    // Add movement to the original pan position
    const newPan = {
      x: panStartRef.current.x + deltaX,
      y: panStartRef.current.y + deltaY,
    };

    setPan(newPan);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => handleMouseMove(e);
      const handleGlobalMouseUp = () => handleMouseUp();

      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  // Zoom functions
  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3)); // Max 3x zoom
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.25, 0.5); // Min 0.5x zoom
    setZoomLevel(newZoom);

    // Reset pan if zooming out to 1x or less
    if (newZoom <= 1) {
      setPan({ x: 0, y: 0 });
      panStartRef.current = { x: 0, y: 0 };
    }
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    panStartRef.current = { x: 0, y: 0 };
  };

  // Determine cursor style
  const getCursorStyle = () => {
    if (zoomLevel <= 1) return "default";
    return isDragging ? "grabbing" : "grab";
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Full-size image view"
    >
      <div
        ref={containerRef}
        className="relative max-w-full max-h-full overflow-hidden"
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 z-10 transition-colors"
          onClick={onClose}
          aria-label="Close full-size image"
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

        {/* Zoom controls */}
        <div className="absolute top-4 left-4 bg-white bg-opacity-80 rounded-lg p-2 z-10">
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                zoomOut();
              }}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Zoom out"
              disabled={zoomLevel <= 0.5}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                />
              </svg>
            </button>

            <span className="text-sm font-medium min-w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                zoomIn();
              }}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Zoom in"
              disabled={zoomLevel >= 3}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                resetZoom();
              }}
              className="p-1 hover:bg-gray-200 rounded text-xs"
              aria-label="Reset zoom"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Loading spinner */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Main image container */}
        <div
          className="flex items-center justify-center w-full h-full overflow-hidden select-none"
          style={{ cursor: getCursorStyle() }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt={alt}
            className={`transition-opacity duration-200 ease-in-out user-select-none ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{
              transform: `scale(${zoomLevel}) translate(${
                pan.x / zoomLevel
              }px, ${pan.y / zoomLevel}px)`,
              maxWidth: zoomLevel === 1 ? "100%" : "none",
              maxHeight: zoomLevel === 1 ? "100vh" : "none",
              cursor: getCursorStyle(),
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
            onLoad={() => setImageLoaded(true)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            draggable={false}
          />
        </div>

        {/* Instructions */}
        {imageLoaded && (
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
            {zoomLevel > 1 ? "Drag to pan • ESC to close" : "ESC to close"}
          </div>
        )}
      </div>
    </div>
  );
}
