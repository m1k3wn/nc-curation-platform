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
  const [feedback, setFeedback] = useState({
    show: false,
    message: "",
  });

  const { createCollection, updateCollection, pendingItem } = useCollections();

  // Reset form when collection changes
  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || "");
    } else {
      setName("");
      setDescription("");
    }

    // Clear any existing feedback when modal opens/closes
    setFeedback({ show: false, message: "" });
  }, [collection, isOpen]);

  // Clear feedback after timeout
  useEffect(() => {
    if (feedback.show) {
      const timer = setTimeout(() => {
        setFeedback({ show: false, message: "" });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

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

      setFeedback({
        show: true,
        message: "Collection updated successfully",
      });

      // Close modal after short delay to show feedback
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      const newCollection = createCollection(name.trim(), description.trim());

      if (newCollection) {
        // Show appropriate feedback based on whether item was added
        const message = pendingItem
          ? "Item added to new collection"
          : "Collection created successfully";

        setFeedback({
          show: true,
          message: message,
        });

        // Close modal after short delay to show feedback
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    }
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

        {/* Success feedback */}
        {feedback.show && (
          <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <svg
                className="h-4 w-4 text-green-400 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-green-800 text-sm">{feedback.message}</span>
            </div>
          </div>
        )}

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
              disabled={feedback.show}
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
              disabled={feedback.show}
            />
          </div>

          {/* Show item being added (if any) */}
          {!isEditing && pendingItem && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center text-sm text-blue-800">
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  "{pendingItem.title || "Item"}" will be added to this
                  collection
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
              onClick={onClose}
              disabled={feedback.show}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={!name.trim() || feedback.show}
            >
              {feedback.show ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isEditing ? "Saving..." : "Creating..."}
                </div>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Collection"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
