import { useCollections } from "../../context/CollectionsContext";

/**
 * @param {Object} item - The item to remove from collection
 * @param {string} collectionId - The ID of the collection to remove from
 */

export default function RemoveFromCollectionButton({ item, collectionId }) {
  const { removeItemFromCollection } = useCollections();

  const handleRemove = (e) => {
    e.stopPropagation();
    removeItemFromCollection(collectionId, item.id);
  };

  return (
    <button
      className="p-3 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
      onClick={handleRemove}
      aria-label="Remove from collection"
      title="Remove from collection"
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
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  );
}
