import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCollections } from "../../context/CollectionsContext";
import DeleteConfirmation from "../common/DeleteConfirmation";

/**
 * Card component for displaying a collection preview
 *
 * @param {Object} collection - The collection to display
 */
export default function CollectionCard({ collection }) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const navigate = useNavigate();
  const { deleteCollection, setActiveCollection, openEditModal } =
    useCollections();

  /**
   * Format date for display
   */
  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Navigate to collection view
   */
  const handleViewCollection = () => {
    setActiveCollection(collection);
    navigate(`/collections/${collection.id}`);
  };

  /**
   * Handle edit collection (opens modal)
   */
  const handleEditCollection = (e) => {
    e.stopPropagation();
    openEditModal(collection);
  };

  /**
   * Handle delete collection
   */
  const handleDeleteCollection = (e) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
  };

  /**
   * Confirm deletion
   */
  const confirmDelete = (e) => {
    e.stopPropagation();
    deleteCollection(collection.id);
    setIsConfirmingDelete(false);
  };

  /**
   * Cancel deletion
   */
  const cancelDelete = (e) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  // Generate preview images if collection has items
  const previewItems = collection.items.slice(0, 4);
  const hasPreviewItems = previewItems.length > 0;

  return (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleViewCollection}
      role="button"
      tabIndex="0"
      aria-label={`View collection ${collection.name}`}
      onKeyDown={(e) => e.key === "Enter" && handleViewCollection()}
    >
      {/* Preview images section - show up to 4 items */}
      {hasPreviewItems ? (
        <div className="grid grid-cols-2 gap-px bg-gray-200">
          {previewItems.map((item) => (
            <div
              key={item.id}
              className="aspect-square bg-gray-100 overflow-hidden"
            >
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400">No items</span>
        </div>
      )}

      {/* Content section */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{collection.name}</h3>

        {collection.description && (
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {collection.description}
          </p>
        )}

        {/* Collection metadata */}
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <span>{collection.items.length} items</span>
          <span>Created {formatDate(collection.dateCreated)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              onClick={handleEditCollection}
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
            <button
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
              onClick={handleDeleteCollection}
              aria-label="Delete collection"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>

          {/* Keep the View button for visual clarity, but it's now redundant */}
          <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-sm font-medium">
            {collection.items.length}{" "}
            {collection.items.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Delete confirmation */}
        {isConfirmingDelete && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <DeleteConfirmation
              onCancel={cancelDelete}
              onConfirm={confirmDelete}
              itemName="collection"
            />
          </div>
        )}
      </div>
    </div>
  );
}
