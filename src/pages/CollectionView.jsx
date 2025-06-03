import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCollections } from "../context/CollectionsContext";
import ItemCard from "../components/search/ItemCard";
import RemoveFromCollectionButton from "../components/collections/RemoveFromCollectionButton";
import EmptyCollectionCard from "../components/collections/EmptyCollectionCard";
import CustomDropdown from "../components/common/CustomDropdown";

export default function CollectionView() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { collections, setActiveCollection, loading, openEditModal } =
    useCollections();

  const [collection, setCollection] = useState(null);
  const [sortOption, setSortOption] = useState("dateAdded-desc");

  useEffect(() => {
    if (collections.length > 0 && collectionId) {
      const foundCollection = collections.find((c) => c.id === collectionId);

      if (foundCollection) {
        setCollection(foundCollection);
        setActiveCollection(foundCollection);
      } else {
        // Collection not found fallback
        navigate("/collections");
      }
    }
  }, [collectionId, collections, setActiveCollection, navigate]);

  const getSortedItems = () => {
    if (!collection || !collection.items) return [];

    const items = [...collection.items];
    const [field, direction] = sortOption.split("-");

    return items.sort((a, b) => {
      let valueA, valueB;

      switch (field) {
        case "title":
          valueA = (a.title || "").toLowerCase();
          valueB = (b.title || "").toLowerCase();
          break;
        case "filterDate":
          valueA = a.filterDate || 0;
          valueB = b.filterDate || 0;
          return direction === "asc" ? valueA - valueB : valueB - valueA;
        case "dateAdded":
        default:
          valueA = a.dateAdded || "";
          valueB = b.dateAdded || "";
          break;
      }

      // if (direction === "asc") {
      //   return valueA.localeCompare(valueB);
      // } else {
      //   return valueB.localeCompare(valueA);
      // }
    });
  };

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
          <span className="ml-2 text-title">Loading collection...</span>
        </div>
      </div>
    );
  }

  const sortedItems = getSortedItems();

  if (sortedItems.length === 0) {
    return <EmptyCollectionCard collection={collection} />;
  }
  const sortOptions = [
    { value: "dateAdded-desc", label: "Recently Added" },
    { value: "dateAdded-asc", label: "First Added" },
    { value: "filterDate-desc", label: "Newest First" },
    { value: "filterDate-asc", label: "Oldest First" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header section */}
      <div className="flex items-center mb-2">
        <button
          className="icon-circle text-inverse hover:bg-accent-secondary hover:text-main mr-4"
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
        <h1 className="text-subtitle text-4xl font-bold">{collection.name}</h1>

        <button
          className="icon-circle bg-main hover:bg-main/60 hover:text-inverse ml-4"
          onClick={() => openEditModal(collection)}
          aria-label="Edit collection"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="white"
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
        <p className="text-body text-lg mb-2 ml-9">{collection.description}</p>
      )}

      {/* Collection metadata */}
      <div className="flex text-sm text-gray-500 mb-4 ml-9">
        <span>{collection.items.length} items</span>
        <span className="mx-2">•</span>
        <span>Last updated: {formatDate(collection.dateModified)}</span>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6 bg-main p-3 rounded-md">
        {/* Sort dropdown */}
        <div className="flex items-center">
          <label
            htmlFor="sort-select"
            className="mr-4 ml-2 text-subtitle text-m text-inverse"
          >
            Sort by:
          </label>
          <div className="w-48">
            <CustomDropdown
              options={sortOptions}
              value={sortOption}
              onChange={(newValue) => {
                console.log("Dropdown changed to:", newValue);
                setSortOption(newValue);
              }}
              placeholder="Sort by..."
            />
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-0">
        {sortedItems.map((item) => (
          <div key={item.id} role="listitem">
            <ItemCard
              item={item}
              actionButtons={
                <RemoveFromCollectionButton
                  item={item}
                  collectionId={collectionId}
                />
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
