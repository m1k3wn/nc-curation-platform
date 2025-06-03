import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCollections } from "../../context/CollectionsContext";

/**
 * @param {Object} item - The item to add to a collection
 */
export default function AddToCollectionButton({ item }) {
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState({
    show: false,
    message: "",
    collectionId: null,
  });
  const navigate = useNavigate();

  const {
    collections,
    addItemToCollection,
    removeItemFromCollection,
    itemExistsInCollection,
    openCreateModal,
  } = useCollections();

  useEffect(() => {
    if (feedback.show) {
      const timer = setTimeout(() => {
        setFeedback({ show: false, message: "", collectionId: null });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    if (showModal) {
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          setShowModal(false);
        }
      };

      window.addEventListener("keydown", handleEscape);
      return () => {
        window.removeEventListener("keydown", handleEscape);
      };
    }
  }, [showModal]);

  const handleOpenModal = (e) => {
    e.stopPropagation();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

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
    setTimeout(() => {
      setShowModal(false);
    }, 2500);
  };

  const handleViewCollection = (e, collectionId) => {
    e.stopPropagation();
    navigate(`/collections/${collectionId}`);
  };

  const handleCreateCollectionClick = (e) => {
    e.stopPropagation();
    setShowModal(false);
    openCreateModal(item);
  };

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      {/* Add to collection button */}
      <button
        className="p-3 bg-accent-primary hover:bg-accent-secondary rounded-full text-white"
        onClick={handleOpenModal}
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

      {/* Collection selection modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex justify-between items-center p-4 border-inverse bg-main rounded-t-lg">
              <h2 className="text-subtitle text-inverse">Add to Collection</h2>
              <button
                className="btn-action text-xl"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                X
              </button>
            </div>

            {/* Collections list */}
            <div className="max-h-64 overflow-y-auto border-t">
              {collections.length > 0 ? (
                collections.map((collection) => (
                  <div
                    key={collection.id}
                    className={
                      itemExistsInCollection(collection.id, item.id)
                        ? "menu-item-added"
                        : "menu-item"
                    }
                  >
                    {itemExistsInCollection(collection.id, item.id) ? (
                      <>
                        <span className="truncate menu-text">
                          {collection.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-inverse text-sm">✓ Added</span>
                          <button
                            className="menu-action-view"
                            onClick={(e) =>
                              handleViewCollection(e, collection.id)
                            }
                          >
                            View
                          </button>
                          <button
                            className="menu-action-remove"
                            onClick={(e) =>
                              handleCollectionAction(
                                e,
                                collection.id,
                                collection.name
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        className="menu-item-button"
                        onClick={(e) =>
                          handleCollectionAction(
                            e,
                            collection.id,
                            collection.name
                          )
                        }
                      >
                        <span className="truncate menu-text">
                          {collection.name}
                        </span>
                        <span className="menu-add-text">Add →</span>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="menu-empty">No collections yet</div>
              )}
            </div>

            {/* Create new collection button */}
            <div className="border-t p-4">
              <button
                className="btn-action w-full flex items-center justify-center"
                onClick={handleCreateCollectionClick}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
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
                Create New Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
