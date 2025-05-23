import { useCollections } from "../../context/CollectionsContext";

export default function EmptyCollectionsList() {
  const { openCreateModal } = useCollections();
  return (
    <div className="col-span-full text-center py-12 bg-gray-50 rounded-md">
      <p className="text-gray-500 mb-4">
        You haven't created any collections yet.
      </p>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        onClick={openCreateModal}
      >
        Create Your First Collection
      </button>
    </div>
  );
}
