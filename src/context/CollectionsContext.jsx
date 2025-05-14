// Add Firebase storage later, placeholder state for now
import { createContext, useContext, useState } from "react";

// Create the context
const CollectionsContext = createContext();

// Custom hook for using the collections context
export function useCollections() {
  return useContext(CollectionsContext);
}

// Provider component
export function CollectionsProvider({ children }) {
  // Mock collections data
  const [collections, setCollections] = useState([
    {
      id: 1,
      title: "Tech Articles",
      itemCount: 12,
      lastUpdated: "2 days ago",
      isPublished: false,
    },
    {
      id: 2,
      title: "Design Inspiration",
      itemCount: 8,
      lastUpdated: "1 week ago",
      isPublished: true,
    },
    {
      id: 3,
      title: "Reading List",
      itemCount: 24,
      lastUpdated: "Yesterday",
      isPublished: false,
    },
    {
      id: 4,
      title: "Project Ideas",
      itemCount: 5,
      lastUpdated: "3 days ago",
      isPublished: true,
    },
    {
      id: 5,
      title: "Learning Resources",
      itemCount: 18,
      lastUpdated: "5 days ago",
      isPublished: false,
    },
    {
      id: 6,
      title: "Favorite Tools",
      itemCount: 7,
      lastUpdated: "2 weeks ago",
      isPublished: false,
    },
  ]);

  // Mock public collections
  const [publicCollections, setPublicCollections] = useState([
    {
      id: 1,
      title: "Design Inspiration",
      owner: "emmajones",
      itemCount: 8,
      likes: 42,
    },
    {
      id: 2,
      title: "Project Ideas",
      owner: "johnsmith",
      itemCount: 5,
      likes: 17,
    },
    {
      id: 3,
      title: "Productivity Tools",
      owner: "alexlee",
      itemCount: 12,
      likes: 63,
    },
    {
      id: 4,
      title: "UI Patterns",
      owner: "sarahjohnson",
      itemCount: 24,
      likes: 108,
    },
    {
      id: 5,
      title: "Dev Resources",
      owner: "michaelbrown",
      itemCount: 15,
      likes: 37,
    },
    {
      id: 6,
      title: "Creative Exercises",
      owner: "rachelwilliams",
      itemCount: 9,
      likes: 22,
    },
  ]);

  // Collection management functions
  const addCollection = (newCollection) => {
    setCollections([
      ...collections,
      {
        id: Date.now(), // Simple ID generation
        ...newCollection,
        lastUpdated: "Just now",
        isPublished: false,
      },
    ]);
  };

  const updateCollection = (id, updatedData) => {
    setCollections(
      collections.map((collection) =>
        collection.id === id ? { ...collection, ...updatedData } : collection
      )
    );
  };

  const deleteCollection = (id) => {
    setCollections(collections.filter((collection) => collection.id !== id));
  };

  const togglePublished = (id) => {
    setCollections(
      collections.map((collection) =>
        collection.id === id
          ? { ...collection, isPublished: !collection.isPublished }
          : collection
      )
    );
  };

  const collectionValues = {
    collections,
    publicCollections,
    addCollection,
    updateCollection,
    deleteCollection,
    togglePublished,
  };

  return (
    <CollectionsContext.Provider value={collectionValues}>
      {children}
    </CollectionsContext.Provider>
  );
}
