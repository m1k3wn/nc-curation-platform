import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import loadSpinnerGreen from "../../assets/load-spinner-green.lottie";

/**
 * Component to display search progress with Lottie animation
 */
export default function SearchProgress({ progress }) {
  // Don't render anything if no progress data is available
  if (!progress) return null;

  const itemsFound = progress?.itemsFound || 0;
  const totalResults = progress?.totalResults || 0;
  const message = progress?.message || "Searching...";

  return (
    <div
      className="bg-blue-50 p-6 rounded-lg mb-6 text-center"
      role="status"
      aria-live="polite"
    >
      {/* Lottie Spinner */}
      <div className="flex justify-center mb-4">
        <DotLottieReact
          src={loadSpinnerGreen}
          loop
          autoplay
          className="w-32 h-32"
        />
      </div>

      {/* Search Status */}
      <div className="text-blue-800 font-medium text-lg mb-2">{message}</div>

      {/* Results Found */}
      <div className="text-blue-700 text-base">
        Found{" "}
        <span className="font-semibold">{itemsFound.toLocaleString()}</span>{" "}
        items with images
        {totalResults > 0 && (
          <span className="text-blue-600 ml-1">
            (from {totalResults.toLocaleString()} total)
          </span>
        )}
      </div>
    </div>
  );
}
