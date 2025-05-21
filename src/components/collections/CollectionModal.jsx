import { useEffect, useState } from "react";
import { useCollections } from "../../context/CollectionsContext";

/**
 * Modal for creating/editing collections
 *
 * @param {Object} collection - The collection to edit (null for create)
 * @param {Function} onClose - Function to call when closing the modal
 * @param {boolean} isOpen - Whether the modal is open
 */
export default function CollectionModal({
  collection = null,
  onClose,
  isOpen,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { createCollection, updateCollection } = useCollections();

  // Reset form when collection changes
  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [collection, isOpen]);

  const isEditing = !!collection;

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    if (isEditing) {
      updateCollection(collection.id, {
        name: name.trim(),
        description: description.trim(),
      });
    } else {
      createCollection(name, description);
    }

    onClose();
  };

  /**
   * Close modal on escape key press
   */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">
            {isEditing ? "Edit Collection" : "Create New Collection"}
          </h2>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
            aria-label="Close"
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
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={!name.trim()}
            >
              {isEditing ? "Save Changes" : "Create Collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
