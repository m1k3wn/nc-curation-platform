import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCollections } from "../../context/CollectionsContext";

/**
 * Button component for adding items to collections
 *
 * @param {Object} item - The item to add to a collection
 */
export default function AddToCollectionButton({ item }) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [feedback, setFeedback] = useState({
    show: false,
    message: "",
    collectionId: null,
  });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  const {
    collections,
    addItemToCollection,
    removeItemFromCollection,
    itemExistsInCollection,
    openCreateModal,
  } = useCollections();

  // Update menu position when toggling
  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [showMenu]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Clear feedback message after timeout
  useEffect(() => {
    if (feedback.show) {
      const timer = setTimeout(() => {
        setFeedback({ show: false, message: "", collectionId: null });
      }, 3000); // Hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  /**
   * Toggle collection menu
   */
  const handleToggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  /**
   * Handle adding/removing item from collection
   */
  const handleCollectionAction = (e, collectionId, collectionName) => {
    e.stopPropagation();

    if (itemExistsInCollection(collectionId, item.id)) {
      removeItemFromCollection(collectionId, item.id);
      setFeedback({
        show: true,
        message: `Removed from "${collectionName}"`,
        collectionId: null,
      });
    } else {
      addItemToCollection(collectionId, item);
      setFeedback({
        show: true,
        message: `Added to "${collectionName}"`,
        collectionId: collectionId,
      });
    }

    setShowMenu(false); // Close the dropdown after action
  };

  /**
   * Navigate to the collection
   */
  const handleViewCollection = (e, collectionId) => {
    e.stopPropagation();
    navigate(`/collections/${collectionId}`);
  };

  /**
   * Handle create collection click
   * Opens the modal and closes the dropdown
   */
  const handleCreateCollectionClick = (e) => {
    e.stopPropagation();
    setShowMenu(false); // Close the dropdown menu
    openCreateModal(item); // Open the create collection modal with item to add
  };

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      {/* Feedback message */}
      {feedback.show && (
        <div className="absolute -top-10 right-0 bg-gray-800 text-white px-3 py-1 rounded text-sm shadow-lg whitespace-nowrap z-50">
          {feedback.message}
          {feedback.collectionId && (
            <button
              className="ml-2 text-blue-300 hover:text-blue-200 underline"
              onClick={(e) => handleViewCollection(e, feedback.collectionId)}
            >
              View
            </button>
          )}
        </div>
      )}

      <button
        ref={buttonRef}
        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
        onClick={handleToggleMenu}
        aria-label="Add to collection"
        title="Add to collection"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Collection menu dropdown - render with fixed positioning */}
      {showMenu && (
        <div
          ref={menuRef}
          className="fixed bg-white rounded-md shadow-lg z-50 border border-gray-200 w-48"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          <div className="px-3 py-2 text-xs text-gray-500 border-b">
            Add to collection:
          </div>

          {/* List of collections */}
          <div className="max-h-48 overflow-y-auto">
            {collections.length > 0 ? (
              collections.map((collection) => (
                <div
                  key={collection.id}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                >
                  {itemExistsInCollection(collection.id, item.id) ? (
                    <>
                      <span className="truncate text-gray-600">
                        {collection.name}
                      </span>
                      <div className="flex items-center">
                        <span className="text-green-600 text-xs mr-2">✓</span>
                        <button
                          className="text-blue-600 text-xs hover:underline"
                          onClick={(e) =>
                            handleViewCollection(e, collection.id)
                          }
                        >
                          View
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      className="w-full text-left"
                      onClick={(e) =>
                        handleCollectionAction(
                          e,
                          collection.id,
                          collection.name
                        )
                      }
                    >
                      <span className="truncate">{collection.name}</span>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-gray-500">
                No collections yet
              </div>
            )}
          </div>

          {/* Create new collection button */}
          <div className="border-t">
            <button
              className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center"
              onClick={handleCreateCollectionClick}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create new collection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
