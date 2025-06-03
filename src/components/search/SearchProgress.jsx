import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import loadSpinnerGreen from "../../assets/load-spinner-green.lottie";

export default function SearchProgress({ progress }) {
  if (!progress) return null;

  const message = progress?.message || "Digging into the archives...";

  return (
    <div
      className="bg-inverse p-6 rounded-lg mb-6 text-center"
      role="status"
      aria-live="polite"
    >
      {/* Spinner */}
      <div className="flex justify-center mb-4">
        <DotLottieReact
          src={loadSpinnerGreen}
          loop
          autoplay
          className="w-44 h-44"
        />
      </div>

      {/* Simple message */}
      <div className="text-subtitle font-medium text-xl">{message}</div>
    </div>
  );
}
