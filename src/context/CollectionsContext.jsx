import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import CollectionModal from "../components/collections/CollectionModal";

/**
 * Context for managing user collections across the application
 */
const CollectionsContext = createContext();

/**
 * Hook to access the collections context
 * @returns {Object} Collections context value
 */
export function useCollections() {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error("useCollections must be used within a CollectionsProvider");
  }
  return context;
}

/**
 * Provider component for collections functionality
 */
export function CollectionsProvider({ children }) {
  // Collections state
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  //  Modal popup state manager
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);

  // Load collections from localStorage on initial mount
  useEffect(() => {
    try {
      const savedCollections = localStorage.getItem("collections");
      if (savedCollections) {
        const parsedCollections = JSON.parse(savedCollections);
        setCollections(parsedCollections);

        // Set active collection to the first one if available
        if (parsedCollections.length > 0) {
          const savedActiveId = localStorage.getItem("activeCollection");
          if (savedActiveId) {
            const activeCol = parsedCollections.find(
              (c) => c.id === savedActiveId
            );
            setActiveCollection(activeCol || parsedCollections[0]);
          } else {
            setActiveCollection(parsedCollections[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error loading collections:", err);
      setError("Failed to load your collections. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Save collections to localStorage whenever they change
  useEffect(() => {
    if (collections.length > 0) {
      localStorage.setItem("collections", JSON.stringify(collections));
    }

    if (activeCollection) {
      localStorage.setItem("activeCollection", activeCollection.id);
    }
  }, [collections, activeCollection]);

  // Modal methods
  const openCreateModal = useCallback(() => {
    setEditingCollection(null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((collection) => {
    setEditingCollection(collection);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    // Clear editing collection after animation completes
    setTimeout(() => {
      setEditingCollection(null);
    }, 300);
  }, []);

  /**
   * Collections Methods
   * @param {string} name - Name of the collection
   * @param {string} description - Description of the collection (optional)
   */
  const createCollection = useCallback((name, description = "") => {
    if (!name.trim()) {
      setError("Collection name cannot be empty");
      return null;
    }

    const newCollection = {
      id: `collection-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      items: [],
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
    };

    setCollections((prev) => [...prev, newCollection]);
    setActiveCollection(newCollection);
    return newCollection;
  }, []);

  /**
   * Update an existing collection
   * @param {string} collectionId - ID of collection to update
   * @param {Object} updates - Properties to update
   */
  const updateCollection = useCallback(
    (collectionId, updates) => {
      setCollections((prev) => {
        const index = prev.findIndex((c) => c.id === collectionId);
        if (index === -1) return prev;

        const updatedCollection = {
          ...prev[index],
          ...updates,
          dateModified: new Date().toISOString(),
        };

        const newCollections = [...prev];
        newCollections[index] = updatedCollection;

        // Update active collection if it's the one being modified
        if (activeCollection?.id === collectionId) {
          setActiveCollection(updatedCollection);
        }

        return newCollections;
      });
    },
    [activeCollection]
  );

  /**
   * Delete a collection
   * @param {string} collectionId - ID of collection to delete
   */
  const deleteCollection = useCallback(
    (collectionId) => {
      setCollections((prev) => {
        const filtered = prev.filter((c) => c.id !== collectionId);

        // If we deleted the active collection, set a new active collection
        if (activeCollection?.id === collectionId) {
          setActiveCollection(filtered.length > 0 ? filtered[0] : null);
        }

        return filtered;
      });
    },
    [activeCollection]
  );

  /**
   * Add an item to a collection
   * @param {string} collectionId - ID of collection to add item to
   * @param {Object} item - Item to add to collection
   */
  const addItemToCollection = useCallback(
    (collectionId, item) => {
      if (!item || !item.id) {
        console.error("Invalid item:", item);
        return;
      }

      setCollections((prev) => {
        const index = prev.findIndex((c) => c.id === collectionId);
        if (index === -1) return prev;

        // Check if item already exists in collection
        const itemExists = prev[index].items.some(
          (existingItem) => existingItem.id === item.id
        );
        if (itemExists) return prev;

        // Add item to collection
        const updatedCollection = {
          ...prev[index],
          items: [
            ...prev[index].items,
            {
              ...item,
              dateAdded: new Date().toISOString(),
            },
          ],
          dateModified: new Date().toISOString(),
        };

        const newCollections = [...prev];
        newCollections[index] = updatedCollection;

        // Update active collection if it's the one being modified
        if (activeCollection?.id === collectionId) {
          setActiveCollection(updatedCollection);
        }

        return newCollections;
      });
    },
    [activeCollection]
  );

  /**
   * Remove an item from a collection
   * @param {string} collectionId - ID of collection to remove item from
   * @param {string} itemId - ID of item to remove
   */
  const removeItemFromCollection = useCallback(
    (collectionId, itemId) => {
      setCollections((prev) => {
        const index = prev.findIndex((c) => c.id === collectionId);
        if (index === -1) return prev;

        // Filter out the item
        const updatedCollection = {
          ...prev[index],
          items: prev[index].items.filter((item) => item.id !== itemId),
          dateModified: new Date().toISOString(),
        };

        const newCollections = [...prev];
        newCollections[index] = updatedCollection;

        // Update active collection if it's the one being modified
        if (activeCollection?.id === collectionId) {
          setActiveCollection(updatedCollection);
        }

        return newCollections;
      });
    },
    [activeCollection]
  );

  /**
   * Check if an item exists in a collection
   * @param {string} collectionId - ID of collection to check
   * @param {string} itemId - ID of item to check for
   * @returns {boolean} - Whether item exists in collection
   */
  const itemExistsInCollection = useCallback(
    (collectionId, itemId) => {
      const collection = collections.find((c) => c.id === collectionId);
      if (!collection) return false;

      return collection.items.some((item) => item.id === itemId);
    },
    [collections]
  );

  /**
   * Check if an item exists in any collection
   * @param {string} itemId - ID of item to check for
   * @returns {boolean} - Whether item exists in any collection
   */
  const itemExistsInAnyCollection = useCallback(
    (itemId) => {
      return collections.some((collection) =>
        collection.items.some((item) => item.id === itemId)
      );
    },
    [collections]
  );

  /**
   * Get all collections containing an item
   * @param {string} itemId - ID of item to check for
   * @returns {Array} - Collections containing the item
   */
  const getCollectionsWithItem = useCallback(
    (itemId) => {
      return collections.filter((collection) =>
        collection.items.some((item) => item.id === itemId)
      );
    },
    [collections]
  );

  // Context value
  const value = {
    collections,
    activeCollection,
    setActiveCollection,
    loading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    addItemToCollection,
    removeItemFromCollection,
    itemExistsInCollection,
    itemExistsInAnyCollection,
    getCollectionsWithItem,
    isModalOpen,
    editingCollection,
    openCreateModal,
    openEditModal,
    closeModal,
  };

  return (
    <CollectionsContext.Provider value={value}>
      {children}
      <CollectionModal
        collection={editingCollection}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </CollectionsContext.Provider>
  );
}
