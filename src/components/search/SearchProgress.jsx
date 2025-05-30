import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import loadSpinnerGreen from "../../assets/load-spinner-green.lottie";

export default function SearchProgress({ progress }) {
  if (!progress) return null;

  const message = progress?.message || "Searching...";

  return (
    <div
      className="bg-blue-50 p-6 rounded-lg mb-6 text-center"
      role="status"
      aria-live="polite"
    >
      {/* Spinner */}
      <div className="flex justify-center mb-4">
        <DotLottieReact
          src={loadSpinnerGreen}
          loop
          autoplay
          className="w-32 h-32"
        />
      </div>

      {/* Simple message */}
      <div className="text-blue-800 font-medium text-lg">{message}</div>
    </div>
  );
}
