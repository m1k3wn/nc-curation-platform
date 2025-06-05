import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import CollectionModal from "../components/collections/CollectionModal";

const CollectionsContext = createContext();

export function useCollections() {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error("useCollections must be used within a CollectionsProvider");
  }
  return context;
}

export function CollectionsProvider({ children }) {
  // Collections
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingItem, setPendingItem] = useState(null);

  // Modal popup
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);

  useEffect(() => {
    try {
      const savedCollections = localStorage.getItem("collections");
      if (savedCollections) {
        const parsedCollections = JSON.parse(savedCollections);
        setCollections(parsedCollections);

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

  useEffect(() => {
    try {
      if (collections.length > 0) {
        localStorage.setItem("collections", JSON.stringify(collections));
      }

      if (activeCollection) {
        localStorage.setItem("activeCollection", activeCollection.id);
      }
    } catch (err) {
      console.error("Error saving collections to localStorage:", err);
    }
  }, [collections, activeCollection]);

  // Modal methods
  const openCreateModal = useCallback((item = null) => {
    setPendingItem(item);
    setEditingCollection(null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((collection) => {
    setPendingItem(null);
    setEditingCollection(collection);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => {
      setEditingCollection(null);
      setPendingItem(null);
    }, 300);
  }, []);

  const createCollection = useCallback(
    (name, description = "") => {
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

      if (pendingItem && pendingItem.id) {
        const cleanItem = {
          id: pendingItem.id,
          title: pendingItem.title,
          description: pendingItem.description,
          media: {
            thumbnail: pendingItem.media?.thumbnail,
            primaryImage: pendingItem.media?.primaryImage,
            fullImage: pendingItem.media?.fullImage,
          },
          museum: pendingItem.museum,
          source: pendingItem.source,
          dateCreated: pendingItem.dateCreated,
          url: pendingItem.url,
          dateAdded: new Date().toISOString(),
        };

        newCollection.items = [cleanItem];
      }
      setCollections((prev) => [...prev, newCollection]);
      setActiveCollection(newCollection);
      setPendingItem(null);

      return newCollection;
    },
    [pendingItem]
  );

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

        if (activeCollection?.id === collectionId) {
          setActiveCollection(updatedCollection);
        }

        return newCollections;
      });
    },
    [activeCollection]
  );

  const deleteCollection = useCallback(
    (collectionId) => {
      setCollections((prev) => {
        const filtered = prev.filter((c) => c.id !== collectionId);

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

        const itemExists = prev[index].items.some(
          (existingItem) => existingItem.id === item.id
        );
        if (itemExists) return prev;

        const cleanItem = {
          id: item.id,
          title: item.title,
          description: item.description,
          media: {
            thumbnail: item.media?.thumbnail,
            primaryImage: item.media?.primaryImage,
            fullImage: item.media?.fullImage,
          },
          museum: item.museum,
          source: item.source,
          dateCreated: item.dateCreated,
          filterDate: item.filterDate,
          century: item.century,
          url: item.url,
          dateAdded: new Date().toISOString(),
        };

        const updatedCollection = {
          ...prev[index],
          items: [...prev[index].items, cleanItem],
          dateModified: new Date().toISOString(),
        };

        const newCollections = [...prev];
        newCollections[index] = updatedCollection;

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

        const updatedCollection = {
          ...prev[index],
          items: prev[index].items.filter((item) => item.id !== itemId),
          dateModified: new Date().toISOString(),
        };

        const newCollections = [...prev];
        newCollections[index] = updatedCollection;

        if (activeCollection?.id === collectionId) {
          setActiveCollection(updatedCollection);
        }

        return newCollections;
      });
    },
    [activeCollection]
  );

  const itemExistsInCollection = useCallback(
    (collectionId, itemId) => {
      const collection = collections.find((c) => c.id === collectionId);
      if (!collection) return false;

      return collection.items.some((item) => item.id === itemId);
    },
    [collections]
  );

  const itemExistsInAnyCollection = useCallback(
    (itemId) => {
      return collections.some((collection) =>
        collection.items.some((item) => item.id === itemId)
      );
    },
    [collections]
  );

  const getCollectionsWithItem = useCallback(
    (itemId) => {
      return collections.filter((collection) =>
        collection.items.some((item) => item.id === itemId)
      );
    },
    [collections]
  );

  // Context
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
    pendingItem,
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
