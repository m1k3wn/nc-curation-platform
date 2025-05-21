// CollectionView.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCollections } from "../context/CollectionsContext";
import ItemCard from "../components/search/ItemCard"; // Adjust path as needed

export default function CollectionView() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { collections, setActiveCollection, loading, openEditModal } =
    useCollections();

  const [collection, setCollection] = useState(null);
  const [sortOption, setSortOption] = useState("dateAdded-desc");

  // Find the collection and set it as active when component mounts or ID changes
  useEffect(() => {
    if (collections.length > 0 && collectionId) {
      const foundCollection = collections.find((c) => c.id === collectionId);

      if (foundCollection) {
        setCollection(foundCollection);
        setActiveCollection(foundCollection);
      } else {
        // Collection not found, redirect to collections page
        navigate("/collections");
      }
    }
  }, [collectionId, collections, setActiveCollection, navigate]);

  /**
   * Sort collection items based on selected option
   */
  const getSortedItems = () => {
    if (!collection || !collection.items) return [];

    const items = [...collection.items];
    const [field, direction] = sortOption.split("-");

    return items.sort((a, b) => {
      let valueA, valueB;

      // Determine values to compare based on field
      switch (field) {
        case "title":
          valueA = (a.title || "").toLowerCase();
          valueB = (b.title || "").toLowerCase();
          break;
        case "datePublished":
          valueA = a.datePublished || "";
          valueB = b.datePublished || "";
          break;
        case "dateAdded":
        default:
          valueA = a.dateAdded || "";
          valueB = b.dateAdded || "";
          break;
      }

      // Compare based on direction
      if (direction === "asc") {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
  };

  /**
   * Format date for display
   */
  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString();
  };

  // Loading state
  if (loading || !collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Loading collection...</span>
        </div>
      </div>
    );
  }

  // Get sorted items for display
  const sortedItems = getSortedItems();

  // Empty collection state
  if (sortedItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <button
            className="mr-2 p-2 rounded-full hover:bg-gray-100"
            onClick={() => navigate("/collections")}
            aria-label="Back to collections"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">{collection.name}</h1>

          <button
            className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            onClick={() => openEditModal(collection)}
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
        </div>

        {collection.description && (
          <p className="text-gray-600 mb-6 ml-9">{collection.description}</p>
        )}

        <div className="text-center py-12 bg-gray-50 rounded-md">
          <p className="text-gray-500 mb-4">
            This collection is empty. Search for items to add them to this
            collection.
          </p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            onClick={() => navigate("/")}
          >
            Search Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header section */}
      <div className="flex items-center mb-2">
        <button
          className="mr-2 p-2 rounded-full hover:bg-gray-100"
          onClick={() => navigate("/collections")}
          aria-label="Back to collections"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">{collection.name}</h1>

        <button
          className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          onClick={() => openEditModal(collection)}
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
      </div>

      {/* Description */}
      {collection.description && (
        <p className="text-gray-600 mb-4 ml-9">{collection.description}</p>
      )}

      {/* Collection metadata */}
      <div className="flex text-sm text-gray-500 mb-6 ml-9">
        <span>{collection.items.length} items</span>
        <span className="mx-2">•</span>
        <span>Last updated: {formatDate(collection.dateModified)}</span>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6 bg-gray-50 p-3 rounded-md">
        {/* Sort dropdown */}
        <div className="flex items-center">
          <label htmlFor="sort-select" className="mr-2 text-sm">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border border-gray-300 rounded p-1 text-sm"
          >
            <option value="dateAdded-desc">Recently Added</option>
            <option value="dateAdded-asc">Oldest First</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="datePublished-desc">Newest (Published)</option>
            <option value="datePublished-asc">Oldest (Published)</option>
          </select>
        </div>
      </div>

      {/* Items Grid */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-0">
        {sortedItems.map((item) => (
          <div key={item.id}>
            <ItemCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
