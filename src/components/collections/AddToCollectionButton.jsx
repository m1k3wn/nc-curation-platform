import { useState, useRef, useEffect } from "react";
import { useCollections } from "../../context/CollectionsContext";

/**
 * Button component for adding items to collections
 *
 * @param {Object} item - The item to add to a collection
 */
export default function AddToCollectionButton({ item }) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

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
  const handleCollectionAction = (e, collectionId) => {
    e.stopPropagation();

    if (itemExistsInCollection(collectionId, item.id)) {
      removeItemFromCollection(collectionId, item.id);
    } else {
      addItemToCollection(collectionId, item);
    }
  };

  /**
   * Handle create collection click
   * Opens the modal and closes the dropdown
   */
  const handleCreateCollectionClick = (e) => {
    e.stopPropagation();
    setShowMenu(false); // Close the dropdown menu
    openCreateModal(); // Open the create collection modal
  };

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
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

      {/* Collection menu dropdown - render in portal to avoid containment issues */}
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
                <button
                  key={collection.id}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                  onClick={(e) => handleCollectionAction(e, collection.id)}
                >
                  <span className="truncate">{collection.name}</span>
                  {itemExistsInCollection(collection.id, item.id) && (
                    <span className="text-green-600 text-xs">✓</span>
                  )}
                </button>
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
