import { useNavigate } from "react-router-dom";
import { useCollections } from "../../context/CollectionsContext";

/**
 * Component for displaying empty collection state with header
 * @param {Object} collection - The empty collection to display
 */
export default function EmptyCollectionCard({ collection }) {
  const navigate = useNavigate();
  const { openEditModal, openCreateModal } = useCollections();

  const handleBackClick = () => {
    navigate("/collections");
  };

  const handleEditClick = () => {
    openEditModal(collection);
  };

  const handleCreateNewClick = () => {
    openCreateModal(null);
  };

  const handleStartSearching = () => {
    navigate("/");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button, title, and edit */}
      <div className="flex items-center mb-6">
        <button
          className="mr-2 p-2 rounded-full hover:bg-gray-100"
          onClick={handleBackClick}
          aria-label="Back to collections"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h1 className="text-2xl font-bold">{collection.name}</h1>

        <button
          className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          onClick={handleEditClick}
          aria-label="Edit collection"
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
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      </div>

      {/* Empty state content */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          Your collection is empty
        </h2>

        <p className="text-gray-600 mb-8 max-w-md">
          Start building your collection by searching for artefacts and adding
          them in.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button className="btn-action" onClick={handleStartSearching}>
            Start Searching
          </button>
        </div>
      </div>
    </div>
  );
}
