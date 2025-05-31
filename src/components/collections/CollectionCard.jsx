import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCollections } from "../../context/CollectionsContext";
import DeleteConfirmation from "../common/DeleteConfirmation";

/**
 * @param {Object} collection - The collection to display
 */
export default function CollectionCard({ collection }) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const navigate = useNavigate();
  const { deleteCollection, setActiveCollection, openEditModal } =
    useCollections();

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewCollection = () => {
    setActiveCollection(collection);
    navigate(`/collections/${collection.id}`);
  };

  const handleEditCollection = (e) => {
    e.stopPropagation();
    openEditModal(collection);
  };

  const handleDeleteCollection = (e) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
  };

  const confirmDelete = (e) => {
    e.stopPropagation();
    deleteCollection(collection.id);
    setIsConfirmingDelete(false);
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  const previewItems = collection.items.slice(0, 4);
  const hasPreviewItems = previewItems.length > 0;

  return (
    <div
      className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer relative"
      onClick={handleViewCollection}
      role="button"
      tabIndex="0"
      aria-label={`View collection ${collection.name}`}
      onKeyDown={(e) => e.key === "Enter" && handleViewCollection()}
    >
      {/* Image area with hover overlay */}
      <div className="relative h-72">
        {/* Preview images section - show up to 4 items */}
        {hasPreviewItems ? (
          <div
            className={`h-full gap-px bg-gray-200 ${
              previewItems.length === 1
                ? "flex"
                : previewItems.length === 2
                ? "grid grid-cols-2"
                : previewItems.length === 3
                ? "grid grid-cols-2 grid-rows-2"
                : "grid grid-cols-2 grid-rows-2"
            }`}
          >
            {previewItems.map((item, index) => (
              <div
                key={item.id}
                className={`bg-gray-100 overflow-hidden ${
                  previewItems.length === 1
                    ? "w-full h-full"
                    : previewItems.length === 3 && index === 0
                    ? "col-span-2"
                    : ""
                }`}
              >
                {item.media?.thumbnail ? (
                  <img
                    src={item.media?.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400 text-xs">No image</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">No items</span>
          </div>
        )}

        {/* Hover overlay - only over the image area */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
            <div className="space-y-2">
              {collection.description && (
                <p className="text-white text-sm line-clamp-2">
                  {collection.description}
                </p>
              )}
              <div className="flex justify-between text-xs text-gray-200">
                <span>
                  {collection.items.length}{" "}
                  {collection.items.length === 1 ? "item" : "items"}
                </span>
                <span>Created {formatDate(collection.dateCreated)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title bar - separate from hover overlay */}
      <div className="bg-black px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white text-base truncate pr-2">
            {collection.name}
          </h3>

          {/* Action buttons */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              className="p-1.5 text-gray-300 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
              onClick={handleEditCollection}
              aria-label="Edit collection"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
            <button
              className="p-1.5 text-gray-300 hover:text-red-400 rounded-full hover:bg-gray-800 transition-colors"
              onClick={handleDeleteCollection}
              aria-label="Delete collection"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {isConfirmingDelete && (
        <div
          className="absolute inset-0 bg-black/80 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <DeleteConfirmation
              onCancel={cancelDelete}
              onConfirm={confirmDelete}
              itemName="collection"
            />
          </div>
        </div>
      )}
    </div>
  );
}
